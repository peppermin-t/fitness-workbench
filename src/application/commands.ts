import { createDefaultData, exercises } from "../domain/seed";
import { analyzeExerciseLog, buildAdviceFromSession, calculateHardSets, calculateVolumeLoad, generatePlan, makeAdvice, nowLabel, parseGoal, parseNutrition, parseSetLogs, todayIso, uid } from "../domain/rules";
import type { Advice, AppData, BodyMetricEntry, ExerciseLog, Goal, Gym, NutritionLog, Revision, SetLog, TrainingPlan, WorkoutSession } from "../domain/types";
import { validateAdvice, validateExerciseLog, validateRevision, validateWorkoutSession } from "../domain/invariants";
import { saveAppData } from "../infrastructure/repository";

export type CommandResult<T = AppData> =
  | { status: "success"; data: T; message?: string }
  | { status: "validation_error" | "not_found" | "storage_error"; message: string; issues?: unknown[] };

export async function createGoal(data: AppData, text: string): Promise<CommandResult> {
  if (!text.trim()) return fail("validation_error", "请输入目标描述。");
  const goal: Goal = { id: uid("goal"), text: text.trim(), parsed: parseGoal(text), createdAt: nowLabel() };
  return persist({ ...data, goals: [goal, ...data.goals], currentGoalId: goal.id });
}

export async function setCurrentGym(data: AppData, gymId: string): Promise<CommandResult> {
  if (!data.gyms.some((gym) => gym.id === gymId)) return fail("not_found", "健身房不存在。");
  return persist({ ...data, currentGymId: gymId });
}

export async function createGym(data: AppData, gym: Omit<Gym, "id">): Promise<CommandResult> {
  if (!gym.name.trim()) return fail("validation_error", "请填写健身房名称。");
  const next: Gym = { ...gym, id: uid("gym"), equipment: [...new Set(gym.equipment)] };
  return persist({ ...data, gyms: [next, ...data.gyms], currentGymId: next.id });
}

export async function generateTrainingPlan(data: AppData): Promise<CommandResult> {
  const gym = currentGym(data);
  if (!gym) return fail("validation_error", "请先选择健身房。");
  const goal = currentGoal(data);
  const plan = generatePlan(gym, goal?.parsed ?? null, data.metrics);
  const advice = makeAdvice("plan", "low", "已生成训练计划", `计划已按 ${plan.context.goalLabel} 和 ${gym.name} 生成。`, [plan.context.goalLabel, gym.name], ["计划生成"]);
  return persist({ ...data, plan, advice: [advice, ...data.advice] });
}

export async function startWorkoutSession(data: AppData, dayIndex: number): Promise<CommandResult> {
  const day = data.plan?.days[dayIndex];
  if (!data.plan || !day) return fail("validation_error", "请先生成计划并选择训练日。");
  const existing = data.sessions.find((item) => item.status === "in_progress" && item.date === todayIso() && item.planId === data.plan?.id && item.dayIndex === dayIndex);
  if (existing) return { status: "success", data };
  const gym = currentGym(data);
  const session: WorkoutSession = {
    id: uid("session"),
    date: todayIso(),
    createdAt: nowLabel(),
    startedAt: nowLabel(),
    completedAt: null,
    status: "in_progress",
    gymId: gym?.id ?? null,
    gymName: gym?.name ?? "",
    planId: data.plan.id,
    dayIndex,
    focus: day.focus,
    completion: null,
    rpe: null,
    painScore: null,
    painArea: "",
    sleep: null,
    fatigue: null,
    notes: "",
    exerciseLogIds: []
  };
  const validation = validateWorkoutSession(session);
  if (!validation.ok) return fail("validation_error", "训练 session 不合法。", validation.issues);
  return persist({ ...data, sessions: [session, ...data.sessions] });
}

export async function logExercise(data: AppData, input: {
  sessionId: string;
  exerciseId: string;
  actualLoad: string;
  actualReps: string;
  setsText: string;
  rpe: number;
  quality: string;
  rangeOfMotion: string;
  targetMuscleFeel: string;
  limitingFactor: string;
  sideIssue: string;
  painScore: number;
  painArea: string;
  freeText: string;
}): Promise<CommandResult> {
  const session = data.sessions.find((item) => item.id === input.sessionId);
  if (!session) return fail("not_found", "训练 session 不存在。");
  const day = data.plan?.days[session.dayIndex];
  const planned = day?.exercises.find((row) => row.exerciseId === input.exerciseId);
  const exercise = exercises.find((item) => item.id === input.exerciseId);
  if (!day || !planned || !exercise) return fail("not_found", "计划动作不存在。");
  const sets = parseSetLogs(input.setsText, input.actualLoad, input.actualReps, input.rpe);
  const draft = {
    id: uid("exercise_log"),
    date: session.date,
    createdAt: nowLabel(),
    sessionId: session.id,
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    dayIndex: session.dayIndex,
    focus: day.focus,
    plannedSets: planned.sets,
    plannedReps: planned.reps,
    plannedLoad: planned.load,
    plannedRpe: planned.rpe,
    actualLoad: input.actualLoad,
    actualReps: input.actualReps,
    sets,
    volumeLoad: calculateVolumeLoad(sets),
    hardSets: calculateHardSets(sets),
    rpe: input.rpe,
    quality: input.quality,
    rangeOfMotion: input.rangeOfMotion,
    targetMuscleFeel: input.targetMuscleFeel,
    limitingFactor: input.limitingFactor,
    sideIssue: input.sideIssue,
    painScore: input.painScore,
    painArea: input.painArea,
    freeText: input.freeText
  };
  const log: ExerciseLog = { ...draft, analysis: analyzeExerciseLog(draft) };
  const validation = validateExerciseLog(log);
  if (!validation.ok) return fail("validation_error", "动作记录不合法。", validation.issues);
  const advice = makeAdvice("exercise", log.analysis.priority, `${exercise.name} 动作反馈`, log.analysis.recommendations.join(" "), log.analysis.evidence, log.analysis.tags);
  const adviceValidation = validateAdvice(advice);
  if (!adviceValidation.ok) return fail("validation_error", "动作建议不合法。", adviceValidation.issues);
  const sessions = data.sessions.map((item) => item.id === session.id ? { ...item, exerciseLogIds: [...new Set([...item.exerciseLogIds, log.id])] } : item);
  return persist({ ...data, sessions, exerciseLogs: [log, ...data.exerciseLogs], advice: [advice, ...data.advice] });
}

export async function finishWorkoutSession(data: AppData, sessionId: string, input: { completion: number; rpe: number; painScore: number; painArea: string; sleep: number; fatigue: number; notes: string }): Promise<CommandResult> {
  const session = data.sessions.find((item) => item.id === sessionId);
  if (!session) return fail("not_found", "训练 session 不存在。");
  const completed: WorkoutSession = { ...session, ...input, completedAt: nowLabel(), status: "completed" };
  const validation = validateWorkoutSession(completed);
  if (!validation.ok) return fail("validation_error", "训练反馈不合法。", validation.issues);
  const generated = buildAdviceFromSession({ ...input, focus: session.focus, dayIndex: session.dayIndex });
  const badRevision = generated.revisions.find((item) => !validateRevision(item, data.plan?.days.length).ok);
  if (badRevision) return fail("validation_error", "计划调整候选不合法。");
  const sessions = data.sessions.map((item) => item.id === sessionId ? completed : item);
  return persist({ ...data, sessions, advice: [...generated.advice, ...data.advice], revisions: [...generated.revisions, ...data.revisions] });
}

export async function saveMetric(data: AppData, metric: Omit<BodyMetricEntry, "id" | "createdAt">): Promise<CommandResult> {
  const entry: BodyMetricEntry = { ...metric, id: uid("metric"), createdAt: nowLabel() };
  return persist({ ...data, metrics: [entry, ...data.metrics].sort((a, b) => b.date.localeCompare(a.date)) });
}

export async function saveNutrition(data: AppData, rawText: string, date: string): Promise<CommandResult> {
  if (!rawText.trim()) return fail("validation_error", "请输入饮食记录。");
  const log: NutritionLog = { id: uid("nutrition"), date, createdAt: nowLabel(), rawText, goalId: data.currentGoalId, analysis: parseNutrition(rawText) };
  const advice = makeAdvice("nutrition", log.analysis.tags.length ? "medium" : "low", `${date} 饮食建议`, log.analysis.recommendations.join(" "), [`蛋白粗估 ${log.analysis.protein}g`, `热量粗估 ${log.analysis.calories}kcal`], log.analysis.tags);
  return persist({ ...data, nutritionLogs: [log, ...data.nutritionLogs], advice: [advice, ...data.advice] });
}

export async function applyRevision(data: AppData, revisionId: string): Promise<CommandResult> {
  const revision = data.revisions.find((item) => item.id === revisionId);
  if (!revision || !data.plan) return fail("not_found", "调整候选不存在。");
  const plan = applyPatch(data.plan, revision.patch);
  const revisions = data.revisions.map((item) => item.id === revisionId ? { ...item, status: "applied" as const, appliedAt: nowLabel() } : item);
  return persist({ ...data, plan, revisions });
}

export async function dismissAdvice(data: AppData, adviceId: string): Promise<CommandResult> {
  return persist({ ...data, advice: data.advice.map((item) => item.id === adviceId ? { ...item, status: "dismissed" } : item) });
}

export async function importBackup(data: AppData, imported: AppData): Promise<CommandResult> {
  const snapshot = await createBackupSnapshot(data, "before_import_json");
  return persist({ ...imported, backupSnapshots: [snapshot, ...(imported.backupSnapshots ?? [])].slice(0, 10) });
}

export async function resetData(data: AppData): Promise<CommandResult> {
  const snapshot = await createBackupSnapshot(data, "before_reset_initial_data");
  return persist({ ...createDefaultData(), backupSnapshots: [snapshot] });
}

export async function createBackupSnapshot(data: AppData, reason: string) {
  return { id: uid("backup"), createdAt: nowLabel(), reason, schemaVersion: data.schemaVersion, stateJson: JSON.stringify({ ...data, backupSnapshots: [] }, null, 2) };
}

function applyPatch(plan: TrainingPlan, patch: Revision["patch"]): TrainingPlan {
  const next = structuredClone(plan);
  const day = next.days[patch.dayIndex];
  if (!day) return next;
  if (patch.type === "reduce_day_volume") day.exercises = day.exercises.map((row) => ({ ...row, sets: Math.max(2, Math.round(Number(row.sets || 1) * patch.factor)), notes: `${row.notes} 已降量。` }));
  if (patch.type === "trim_accessory") day.exercises = day.exercises.slice(0, Math.max(3, day.exercises.length - 2));
  if (patch.type === "add_progression_note") day.exercises = day.exercises.map((row, index) => index < 3 ? { ...row, notes: `${row.notes} 下次可小幅加重或增加 1-2 次。` } : row);
  if (patch.type === "increase_cardio_time") day.exercises = day.exercises.map((row) => String(row.reps).includes("分钟") ? { ...row, reps: `${row.reps} +${patch.minutes} 分钟` } : row);
  if (patch.type === "manual_replace" && day.exercises[patch.rowIndex]) day.exercises[patch.rowIndex] = { ...day.exercises[patch.rowIndex]!, exerciseId: patch.exerciseId, notes: "已手动替换动作。" };
  return next;
}

function currentGym(data: AppData): Gym | null {
  return data.gyms.find((gym) => gym.id === data.currentGymId) ?? data.gyms[0] ?? null;
}

function currentGoal(data: AppData): Goal | null {
  return data.goals.find((goal) => goal.id === data.currentGoalId) ?? data.goals[0] ?? null;
}

async function persist(data: AppData): Promise<CommandResult> {
  try {
    return { status: "success", data: await saveAppData(data) };
  } catch (error) {
    return fail("storage_error", error instanceof Error ? error.message : String(error));
  }
}

function fail(status: "validation_error" | "not_found" | "storage_error", message: string, issues?: unknown[]): CommandResult {
  return { status, message, issues };
}
