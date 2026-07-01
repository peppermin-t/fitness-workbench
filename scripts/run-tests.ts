import { createDefaultData } from "../src/domain/seed";
import {
  buildTodayDashboard,
  generatePlan,
  parseGoal,
  parseNutrition,
  parseSetLogs
} from "../src/domain/rules";
import {
  validateAdvice,
  validateExerciseLog,
  validatePlanPatch,
  validateRevision,
  validateSetLog,
  validateWorkoutSession
} from "../src/domain/invariants";

Object.defineProperty(globalThis, "window", { value: {}, configurable: true });

const assert = {
  equal(actual: unknown, expected: unknown) {
    if (actual !== expected) throw new Error(`Expected ${String(actual)} to equal ${String(expected)}`);
  },
  ok(value: unknown) {
    assertOk(value);
  }
};

function assertOk<T>(value: T | null | undefined | false | 0 | ""): asserts value is T {
  if (!value) throw new Error("Expected value to be present");
}

function testGoalParser() {
  const parsed = parseGoal("fat loss target 75kg strength travel 4 days 60 min");
  assert.equal(parsed.primaryGoal, "fat_loss");
  assert.equal(parsed.primaryGoal, "fat_loss");
  assert.equal(parsed.targetWeight, 75);
  assert.equal(parsed.sessionDurationMinutes, 60);
  assert.equal(parsed.frequentTravel, true);
}

function testPlanGenerator() {
  const data = createDefaultData();
  const gym = data.gyms[0];
  assertOk(gym);
  const plan = generatePlan(gym, parseGoal("muscle hypertrophy 5 days"), []);
  assert.equal(plan.days.length, 4);
  assert.ok(plan.days.every((day) => day.exercises.length >= 4));
  assert.ok(plan.days.flatMap((day) => day.exercises).every((row) => row.id && row.exerciseId));
}

function testNutritionParser() {
  const parsed = parseNutrition("eggs milk beef rice takeaway dinner");
  assert.ok(parsed.calories > 0);
  assert.ok(parsed.protein > 0);
  assert.ok(Array.isArray(parsed.tags));
}

function testSessionInvariants() {
  const set = {
    id: "set-1",
    setIndex: 1,
    loadKg: 60,
    reps: 8,
    rpe: 8,
    completed: true,
    note: ""
  };
  assert.equal(validateSetLog(set).ok, true);

  const session = {
    id: "session-1",
    date: "2026-07-01",
    createdAt: "2026-07-01 10:00",
    startedAt: "2026-07-01 10:00",
    completedAt: null,
    status: "in_progress" as const,
    gymId: "gym-1",
    gymName: "Gym",
    planId: "plan-1",
    dayIndex: 0,
    focus: "Push",
    completion: null,
    rpe: null,
    painScore: null,
    painArea: "",
    sleep: null,
    fatigue: null,
    notes: "",
    exerciseLogIds: []
  };
  assert.equal(validateWorkoutSession(session).ok, true);

  const exerciseLog = {
    id: "elog-1",
    date: "2026-07-01",
    createdAt: "2026-07-01 10:10",
    sessionId: "session-1",
    exerciseId: "bench",
    exerciseName: "Bench",
    dayIndex: 0,
    focus: "Push",
    plannedSets: 3,
    plannedReps: "8-10",
    plannedLoad: "moderate",
    plannedRpe: 8,
    actualLoad: "60",
    actualReps: "8",
    sets: [set],
    volumeLoad: 480,
    hardSets: 1,
    rpe: 8,
    quality: "good",
    rangeOfMotion: "full",
    targetMuscleFeel: "good",
    limitingFactor: "",
    sideIssue: "",
    painScore: 0,
    painArea: "",
    freeText: "",
    analysis: { tags: [], evidence: ["ok"], recommendations: [], priority: "low" as const }
  };
  assert.equal(validateExerciseLog(exerciseLog).ok, true);

  const advice = {
    id: "advice-1",
    type: "training",
    priority: "medium" as const,
    title: "Control fatigue",
    detail: "RPE is high",
    evidence: ["rpe 9"],
    tags: ["fatigue"],
    source: "test",
    status: "active" as const,
    createdAt: "2026-07-01 10:30",
    expiresAt: null
  };
  assert.equal(validateAdvice(advice).ok, true);

  const revision = {
    id: "rev-1",
    status: "pending" as const,
    summary: "Reduce volume",
    reason: "Fatigue is high",
    evidence: ["fatigue 8"],
    patch: { type: "reduce_day_volume" as const, dayIndex: 0, factor: 0.8 },
    createdAt: "2026-07-01 10:30",
    appliedAt: null
  };
  assert.equal(validatePlanPatch(revision.patch, 3).ok, true);
  assert.equal(validateRevision(revision, 3).ok, true);
}

async function testCommandLifecycle() {
  const commands = await import("../src/application/commands");
  let data = createDefaultData();

  const goalResult = await commands.createGoal(data, "fat loss strength 4 days 60 min");
  assert.equal(goalResult.status, "success");
  if (goalResult.status !== "success") throw new Error(goalResult.message);
  data = goalResult.data;

  const planResult = await commands.generateTrainingPlan(data);
  assert.equal(planResult.status, "success");
  if (planResult.status !== "success") throw new Error(planResult.message);
  data = planResult.data;
  assert.ok(data.plan);

  const startResult = await commands.startWorkoutSession(data, 0);
  assert.equal(startResult.status, "success");
  if (startResult.status !== "success") throw new Error(startResult.message);
  data = startResult.data;

  const session = data.sessions.find((item) => item.status === "in_progress");
  assertOk(session);
  const planned = data.plan?.days[0]?.exercises[0];
  assertOk(planned);

  const setLogs = parseSetLogs("60x8@8", "60", "8", 8);
  assert.equal(setLogs.length, 1);

  const logResult = await commands.logExercise(data, {
    sessionId: session.id,
    exerciseId: planned.exerciseId,
    actualLoad: "60",
    actualReps: "8",
    setsText: "60x8@8",
    rpe: 8,
    quality: "good",
    rangeOfMotion: "full",
    targetMuscleFeel: "good",
    limitingFactor: "",
    sideIssue: "",
    painScore: 0,
    painArea: "",
    freeText: ""
  });
  assert.equal(logResult.status, "success");
  if (logResult.status !== "success") throw new Error(logResult.message);
  data = logResult.data;
  assert.equal(data.exerciseLogs.length, 1);

  const finishResult = await commands.finishWorkoutSession(data, session.id, {
    completion: 90,
    rpe: 8,
    painScore: 1,
    painArea: "",
    sleep: 7,
    fatigue: 4,
    notes: "normal"
  });
  assert.equal(finishResult.status, "success");
  if (finishResult.status !== "success") throw new Error(finishResult.message);
  data = finishResult.data;
  assert.equal(data.sessions[0]?.status, "completed");

  const dashboard = buildTodayDashboard(data);
  assert.ok(dashboard.day);
  assert.ok(dashboard.highAdvice.length <= 3);
}

testGoalParser();
testPlanGenerator();
testNutritionParser();
testSessionInvariants();
await testCommandLifecycle();
console.log("frontend domain/application tests passed");
