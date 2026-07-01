import { exercises } from "./seed";
import type { Advice, AppData, BodyMetricEntry, Exercise, ExerciseLog, GoalParsed, Gym, NutritionLog, PlanPatch, PlannedExercise, Priority, Revision, SetLog, TrainingPlan, WorkoutDay } from "./types";

export function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nowLabel(): string {
  const d = new Date();
  return `${d.toLocaleDateString("zh-CN")} ${d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
}

export function parseGoal(text: string): GoalParsed {
  const source = text.trim();
  const lower = source.toLowerCase();
  const parsed: GoalParsed = {
    rawText: source,
    primaryGoal: "general_fitness",
    primaryGoalLabel: "综合体能",
    secondaryGoal: null,
    secondaryGoalLabel: "",
    targetWeight: null,
    trainingDaysPerWeek: /出差|旅行|酒店|差旅|travel/.test(lower) ? 3 : 4,
    sessionDurationMinutes: /出差|旅行|酒店|差旅|travel/.test(lower) ? 45 : 60,
    frequentTravel: /出差|旅行|酒店|差旅|travel/.test(lower),
    conveniencePriority: /方便|便利|简单|少录入|省事|快捷/.test(lower),
    constraints: [],
    notes: []
  };
  if (/减脂|减肥|瘦|掉体重|降体脂|fat loss|lose weight/.test(lower)) {
    parsed.primaryGoal = "fat_loss"; parsed.primaryGoalLabel = "减脂";
  } else if (/增肌|长肌肉|肌肥大|muscle|hypertrophy/.test(lower)) {
    parsed.primaryGoal = "muscle_gain"; parsed.primaryGoalLabel = "增肌";
  } else if (/力量|变强|深蹲|卧推|硬拉|strength/.test(lower)) {
    parsed.primaryGoal = "strength"; parsed.primaryGoalLabel = "力量提升";
  } else if (/维持|保持|健康|maintenance/.test(lower)) {
    parsed.primaryGoal = "maintenance"; parsed.primaryGoalLabel = "维持健康";
  }
  if (/保持力量|不掉力量|维持力量|不想掉力量/.test(lower)) {
    parsed.secondaryGoal = "strength_maintenance"; parsed.secondaryGoalLabel = "保持力量";
  } else if (/体态|姿态|圆肩|久坐/.test(lower)) {
    parsed.secondaryGoal = "posture"; parsed.secondaryGoalLabel = "体态改善";
  } else if (/心肺|有氧|耐力/.test(lower)) {
    parsed.secondaryGoal = "conditioning"; parsed.secondaryGoalLabel = "心肺提升";
  }
  const targetMatch = source.match(/(?:到|减到|降到|目标|target)\s*(\d{2,3}(?:\.\d+)?)\s*(?:kg|公斤)?/i);
  if (targetMatch?.[1]) parsed.targetWeight = Number(targetMatch[1]);
  const dayMatch = source.match(/(?:每周|一周|周)\D{0,8}(\d)\D{0,8}(?:次|练|天)/);
  if (dayMatch?.[1]) parsed.trainingDaysPerWeek = clamp(Number(dayMatch[1]), 1, 6);
  const durationMatch = source.match(/(\d{2,3})\s*(?:分钟|min|mins|minute)/i);
  if (durationMatch?.[1]) parsed.sessionDurationMinutes = clamp(Number(durationMatch[1]), 20, 120);
  if (parsed.frequentTravel) parsed.constraints.push("frequent_travel");
  if (parsed.conveniencePriority) parsed.constraints.push("convenience_first");
  if (/膝|腰|肩|痛|伤|不适/.test(lower)) parsed.constraints.push("pain_or_injury_note");
  if (!source) parsed.notes.push("目标描述为空，按综合体能默认处理。");
  return parsed;
}

export function generatePlan(gym: Gym, goal: GoalParsed | null, metrics: BodyMetricEntry[]): TrainingPlan {
  const parsed = goal ?? parseGoal("");
  const daysCount = clamp(parsed.trainingDaysPerWeek, 1, 6);
  const types = dayTypes(daysCount, parsed.primaryGoal);
  const config = planConfig(parsed.primaryGoal);
  const days = types.map((type, dayIndex) => buildDay(type, dayIndex, config, gym, parsed));
  const latest = sortedMetrics(metrics).at(-1);
  return {
    id: uid("plan"),
    generatedAt: nowLabel(),
    context: {
      goalLabel: `${parsed.primaryGoalLabel}${parsed.secondaryGoalLabel ? ` + ${parsed.secondaryGoalLabel}` : ""}`,
      gymName: gym.name,
      metricSummary: latest ? `${latest.date}: 体重 ${latest.weight ?? "-"}kg，体脂 ${latest.bodyFat ?? "-"}%` : "暂无身体指标",
      notes: [
        parsed.frequentTravel ? "出差优先：训练控制在可执行范围" : "",
        gym.equipment.length <= 6 ? "器械受限：优先替代动作" : ""
      ].filter(Boolean)
    },
    days
  };
}

function dayTypes(days: number, goal: GoalParsed["primaryGoal"]): string[] {
  if (days <= 1) return ["full"];
  if (days === 2) return ["upper", "lower"];
  if (days === 3) return goal === "fat_loss" ? ["upper", "lower", "conditioning"] : ["upper", "lower", "full"];
  if (days === 4) return goal === "muscle_gain" ? ["push", "pull", "lower", "upper"] : ["upper", "lower", "full", "conditioning"];
  return ["push", "pull", "lower", "upper", "conditioning"].slice(0, days);
}

function planConfig(goal: GoalParsed["primaryGoal"]) {
  if (goal === "strength") return { sets: 4, reps: "3-6", rpe: "7-8", rest: "2-3 分钟", cardio: "15-20 分钟" };
  if (goal === "muscle_gain") return { sets: 3, reps: "8-12", rpe: "7-8", rest: "90-120 秒", cardio: "10-15 分钟" };
  if (goal === "fat_loss") return { sets: 3, reps: "10-15", rpe: "6-8", rest: "60-90 秒", cardio: "20-30 分钟" };
  return { sets: 3, reps: "8-12", rpe: "6-7", rest: "90 秒", cardio: "15-20 分钟" };
}

function buildDay(type: string, dayIndex: number, config: ReturnType<typeof planConfig>, gym: Gym, goal: GoalParsed): WorkoutDay {
  const templates: Record<string, [string, string, string[]]> = {
    upper: ["上肢力量", "保留主要推拉动作，适合快速完成。", ["bench_press", "seated_cable_row", "dumbbell_shoulder_press", "lat_pulldown", "plank"]],
    lower: ["下肢力量", "蹲、髋铰链和核心为主。", ["barbell_squat", "dumbbell_rdl", "leg_press", "glute_bridge", "dead_bug"]],
    full: ["全身训练", "出差或低频训练时保证全身刺激。", ["goblet_squat", "dumbbell_bench_press", "one_arm_dumbbell_row", "dumbbell_rdl", "treadmill_incline_walk"]],
    push: ["推类/胸肩三头", "推类重点日。", ["bench_press", "dumbbell_bench_press", "dumbbell_shoulder_press", "push_up", "plank"]],
    pull: ["拉类/背二头", "背部和手臂拉类训练。", ["lat_pulldown", "seated_cable_row", "one_arm_dumbbell_row", "band_row", "dead_bug"]],
    conditioning: ["恢复/有氧", "减脂或疲劳较高时保留连续性。", ["treadmill_incline_walk", "bike_easy", "rower_easy", "plank", "band_row"]]
  };
  const [focus, intent, ids] = templates[type] ?? templates.full!;
  return {
    id: `day_${dayIndex + 1}`,
    type,
    focus,
    intent,
    exercises: ids.map((id, rowIndex) => plannedRow(id, rowIndex, config, gym, goal))
  };
}

function plannedRow(id: string, rowIndex: number, config: ReturnType<typeof planConfig>, gym: Gym, goal: GoalParsed): PlannedExercise {
  const selected = pickAvailable(id, gym);
  const isCardio = selected.pattern === "有氧";
  return {
    id: `planned_${rowIndex + 1}`,
    exerciseId: selected.id,
    sets: isCardio ? 1 : config.sets,
    reps: isCardio ? config.cardio : config.reps,
    load: isCardio ? "中低强度" : "按 RPE 调整",
    rpe: isCardio ? "5-6" : config.rpe,
    rest: isCardio ? "-" : config.rest,
    notes: selected.id === id
      ? (goal.secondaryGoal === "strength_maintenance" ? "保留动作质量，不用每次都冲重量。" : selected.cue)
      : `当前场地缺原动作器械，已改用 ${selected.name}。`
  };
}

export function isAvailable(exercise: Exercise, gym: Gym): boolean {
  return exercise.equipment.every((id) => gym.equipment.includes(id));
}

export function substitutes(exercise: Exercise, gym: Gym): Exercise[] {
  return [...exercise.substitutes, ...exercises.filter((item) => item.pattern === exercise.pattern && item.id !== exercise.id).map((item) => item.id)]
    .map((id) => exercises.find((item) => item.id === id))
    .filter((item): item is Exercise => Boolean(item && isAvailable(item, gym)));
}

function pickAvailable(id: string, gym: Gym): Exercise {
  const exercise = exercises.find((item) => item.id === id) ?? exercises[0]!;
  if (isAvailable(exercise, gym)) return exercise;
  return substitutes(exercise, gym)[0] ?? exercise;
}

export function parseSetLogs(text: string, fallbackLoad: string, fallbackReps: string, rpe: number): SetLog[] {
  const lines = text.split(/[\n;；]+/).map((line) => line.trim()).filter(Boolean);
  if (lines.length) return lines.map((line, index) => parseSetLine(line, index, rpe));
  const load = parseLoad(fallbackLoad);
  const reps = fallbackReps.split(/[\/,，\s]+/).map((item) => Number(item)).filter((value) => Number.isFinite(value) && value > 0);
  if (load == null || !reps.length) return [];
  return reps.map((rep, index) => ({ id: uid("set"), setIndex: index + 1, loadKg: load, reps: rep, rpe, completed: true, note: "快速记录" }));
}

function parseSetLine(line: string, index: number, fallbackRpe: number): SetLog {
  const load = line.match(/(\d+(?:\.\d+)?)\s*(?:kg|公斤)?/i)?.[1];
  const reps = (line.match(/[x×]\s*(\d+(?:\.\d+)?)/i) ?? line.match(/(\d+(?:\.\d+)?)\s*(?:次|reps?)/i))?.[1];
  const rpe = line.match(/(?:@|rpe\s*)(\d+(?:\.\d+)?)/i)?.[1];
  return { id: uid("set"), setIndex: index + 1, loadKg: load ? Number(load) : null, reps: reps ? Number(reps) : null, rpe: rpe ? Number(rpe) : fallbackRpe, completed: true, note: line };
}

function parseLoad(text: string): number | null {
  if (/自重|bodyweight/i.test(text)) return null;
  const match = text.match(/-?\d+(?:\.\d+)?/);
  return match?.[0] ? Number(match[0]) : null;
}

export function calculateVolumeLoad(sets: SetLog[]): number {
  return sets.reduce((sum, set) => sum + ((set.loadKg ?? 0) * (set.reps ?? 0)), 0);
}

export function calculateHardSets(sets: SetLog[]): number {
  return sets.filter((set) => (set.reps ?? 0) > 0 && (set.rpe ?? 0) >= 7).length;
}

export function analyzeExerciseLog(log: Omit<ExerciseLog, "analysis">): ExerciseLog["analysis"] {
  const tags: string[] = [];
  const evidence: string[] = [`RPE ${log.rpe}/10`, `疼痛 ${log.painScore}/5`];
  const recommendations: string[] = [];
  if (log.painScore >= 3 || log.limitingFactor === "joint_pain") {
    tags.push("pain_risk"); recommendations.push("下次先降量或换低风险替代，不建议继续加重。");
  }
  if (log.rangeOfMotion !== "full") {
    tags.push("reduced_rom"); recommendations.push("优先完整幅度，必要时降低重量。");
  }
  if (log.limitingFactor === "grip") {
    tags.push("grip_limiting"); recommendations.push("可考虑助力带或更稳定版本。");
  }
  if (log.targetMuscleFeel === "weak" || log.targetMuscleFeel === "none") {
    tags.push("poor_target_muscle_feel"); recommendations.push("降低重量并增加停顿，确认目标肌肉发力。");
  }
  if (log.sideIssue !== "none") tags.push(log.sideIssue);
  if (!recommendations.length) recommendations.push("本次动作记录稳定，继续观察下次表现。");
  return { tags, evidence, recommendations, priority: tags.includes("pain_risk") ? "high" : tags.length ? "medium" : "low" };
}

export function parseNutrition(rawText: string): NutritionLog["analysis"] {
  const proteinHints = (rawText.match(/鸡蛋|牛肉|鸡胸|鱼|虾|蛋白|豆腐|奶|酸奶/g) ?? []).length;
  const missedMeal = /没吃|漏餐|不吃/.test(rawText);
  const hotpot = /火锅|外卖|炸|烧烤/.test(rawText);
  const protein = Math.max(30, proteinHints * 18 + (rawText.length > 20 ? 20 : 0));
  const calories = 800 + proteinHints * 120 + (hotpot ? 700 : 0);
  const tags = [missedMeal ? "missed_meal" : "", hotpot ? "high_fat_possible" : "", protein < 90 ? "daily_protein_gap" : ""].filter(Boolean);
  return {
    calories,
    protein,
    confidence: rawText.length > 20 ? "medium" : "low",
    tags,
    recommendations: tags.length ? ["这是粗估结果，优先补足正餐和蛋白。"] : ["记录已保存，继续积累趋势。"]
  };
}

export function buildAdviceFromSession(session: { completion: number; rpe: number; painScore: number; sleep: number; fatigue: number; painArea: string; focus: string; dayIndex: number }): { advice: Advice[]; revisions: Revision[] } {
  const advice: Advice[] = [];
  const revisions: Revision[] = [];
  const evidence = [`完成度 ${session.completion}%`, `RPE ${session.rpe}/10`, `疼痛 ${session.painScore}/5`, `睡眠 ${session.sleep}/5`, `疲劳 ${session.fatigue}/5`];
  if (session.painScore >= 3) {
    advice.push(makeAdvice("safety", "high", "先处理疼痛风险", `疼痛评分 ${session.painScore}/5，下一次同类训练先降量或替换动作。`, evidence, ["疼痛"]));
    revisions.push(makeRevision(`降低 ${session.focus} 的训练量`, "训练后疼痛评分较高，建议组数减少约 30%。", evidence, { type: "reduce_day_volume", dayIndex: session.dayIndex, factor: 0.7 }));
  } else if (session.completion >= 95 && session.rpe <= 7 && session.fatigue <= 3) {
    advice.push(makeAdvice("progression", "low", "具备小幅进阶条件", "完成度高且 RPE 可控，下次主动作可小幅加重或增加次数。", evidence, ["进阶"]));
    revisions.push(makeRevision(`${session.focus} 下次可小幅进阶`, "完成度高、疼痛低，符合小幅渐进条件。", evidence, { type: "add_progression_note", dayIndex: session.dayIndex }));
  } else {
    advice.push(makeAdvice("training", "low", "维持当前计划", "本次没有触发高风险信号，继续观察完成度、RPE 和恢复。", evidence, ["观察"]));
  }
  return { advice, revisions };
}

export function makeAdvice(type: string, priority: Priority, title: string, detail: string, evidence: string[], tags: string[]): Advice {
  return { id: uid("advice"), type, priority, title, detail, evidence, tags, source: "rules", status: "active", createdAt: nowLabel(), expiresAt: null };
}

export function makeRevision(summary: string, reason: string, evidence: string[], patch: PlanPatch): Revision {
  return { id: uid("rev"), status: "pending", summary, reason, evidence, patch, createdAt: nowLabel(), appliedAt: null };
}

export function sortedMetrics(metrics: BodyMetricEntry[]): BodyMetricEntry[] {
  return [...metrics].sort((a, b) => a.date.localeCompare(b.date));
}

export function buildTodayDashboard(data: AppData) {
  const gym = data.gyms.find((item) => item.id === data.currentGymId) ?? data.gyms[0] ?? null;
  const goal = data.goals.find((item) => item.id === data.currentGoalId) ?? data.goals[0] ?? null;
  const day = data.plan?.days[0] ?? null;
  const activeSession = data.sessions.find((session) => session.status === "in_progress" && session.date === todayIso()) ?? null;
  return { gym, goal, day, activeSession, highAdvice: data.advice.filter((item) => item.status === "active").slice(0, 3) };
}

function clamp(value: number, min: number, max: number): number {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;
}
