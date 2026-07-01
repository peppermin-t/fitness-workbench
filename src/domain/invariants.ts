import type { Advice, ExerciseLog, PlanPatch, Revision, SetLog, WorkoutSession } from "./types";

export type Issue = { field: string; code: string };
export type ValidationResult = { ok: boolean; issues: Issue[] };

const sessionStatuses = new Set(["in_progress", "completed", "cancelled"]);
const adviceStatuses = new Set(["active", "dismissed", "applied", "snoozed", "reviewed"]);
const revisionStatuses = new Set(["pending", "applied", "dismissed"]);
const patchTypes = new Set(["reduce_day_volume", "trim_accessory", "add_progression_note", "increase_cardio_time", "manual_replace"]);

export function validateWorkoutSession(session: WorkoutSession): ValidationResult {
  const issues: Issue[] = [];
  if (!session.id) issues.push(issue("id", "required"));
  if (!session.date) issues.push(issue("date", "required"));
  if (!sessionStatuses.has(session.status)) issues.push(issue("status", "invalid"));
  if (!session.startedAt) issues.push(issue("startedAt", "required"));
  if (session.completedAt && session.status !== "completed") issues.push(issue("completedAt", "only_for_completed"));
  if (session.status === "completed") {
    (["completion", "rpe", "painScore", "sleep", "fatigue"] as const).forEach((field) => {
      if (session[field] == null) issues.push(issue(field, "required_when_completed"));
    });
  }
  if (session.completion != null && !between(session.completion, 0, 100)) issues.push(issue("completion", "out_of_range"));
  if (session.rpe != null && !between(session.rpe, 1, 10)) issues.push(issue("rpe", "out_of_range"));
  if (session.painScore != null && !between(session.painScore, 0, 5)) issues.push(issue("painScore", "out_of_range"));
  return result(issues);
}

export function validateSetLog(set: SetLog): ValidationResult {
  const issues: Issue[] = [];
  if (!Number.isInteger(set.setIndex) || set.setIndex < 1) issues.push(issue("setIndex", "invalid"));
  if (set.loadKg != null && set.loadKg < 0) issues.push(issue("loadKg", "out_of_range"));
  if (set.reps != null && set.reps < 0) issues.push(issue("reps", "out_of_range"));
  if (set.rpe != null && !between(set.rpe, 1, 10)) issues.push(issue("rpe", "out_of_range"));
  return result(issues);
}

export function validateExerciseLog(log: ExerciseLog): ValidationResult {
  const issues: Issue[] = [];
  if (!log.sessionId) issues.push(issue("sessionId", "required"));
  if (!log.exerciseId) issues.push(issue("exerciseId", "required"));
  log.sets.forEach((set, index) => validateSetLog(set).issues.forEach((item) => issues.push(issue(`sets.${index}.${item.field}`, item.code))));
  return result(issues);
}

export function validateAdvice(advice: Advice): ValidationResult {
  const issues: Issue[] = [];
  if (!advice.id) issues.push(issue("id", "required"));
  if (!advice.title) issues.push(issue("title", "required"));
  if (!adviceStatuses.has(advice.status)) issues.push(issue("status", "invalid"));
  if (advice.priority === "high" && !advice.evidence.length) issues.push(issue("evidence", "required_for_high_priority"));
  return result(issues);
}

export function validateRevision(revision: Revision, planDayCount?: number): ValidationResult {
  const issues: Issue[] = [];
  if (!revision.id) issues.push(issue("id", "required"));
  if (!revision.summary) issues.push(issue("summary", "required"));
  if (!revisionStatuses.has(revision.status)) issues.push(issue("status", "invalid"));
  if (revision.appliedAt && revision.status !== "applied") issues.push(issue("appliedAt", "only_for_applied"));
  validatePlanPatch(revision.patch, planDayCount).issues.forEach((item) => issues.push(issue(`patch.${item.field}`, item.code)));
  return result(issues);
}

export function validatePlanPatch(patch: PlanPatch, planDayCount?: number): ValidationResult {
  const issues: Issue[] = [];
  if (!patchTypes.has(patch.type)) issues.push(issue("type", "invalid"));
  if (patch.dayIndex < 0 || !Number.isInteger(patch.dayIndex)) issues.push(issue("dayIndex", "invalid"));
  if (planDayCount != null && patch.dayIndex >= planDayCount) issues.push(issue("dayIndex", "out_of_range"));
  if (patch.type === "reduce_day_volume" && !between(patch.factor, 0.5, 1)) issues.push(issue("factor", "out_of_range"));
  if (patch.type === "increase_cardio_time" && patch.minutes <= 0) issues.push(issue("minutes", "invalid"));
  if (patch.type === "manual_replace" && (!patch.exerciseId || patch.rowIndex < 0)) issues.push(issue("manual_replace", "invalid"));
  return result(issues);
}

function issue(field: string, code: string): Issue {
  return { field, code };
}

function result(issues: Issue[]): ValidationResult {
  return { ok: issues.length === 0, issues };
}

function between(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max;
}
