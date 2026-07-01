export type GoalPrimary = "fat_loss" | "muscle_gain" | "strength" | "general_fitness" | "maintenance";
export type GoalSecondary = "strength_maintenance" | "conditioning" | "posture" | null;
export type SessionStatus = "in_progress" | "completed" | "cancelled";
export type AdviceStatus = "active" | "dismissed" | "applied" | "snoozed" | "reviewed";
export type RevisionStatus = "pending" | "applied" | "dismissed";
export type Priority = "high" | "medium" | "low" | "info";

export type Equipment = { id: string; label: string };
export type Gym = { id: string; name: string; location?: string; equipment: string[] };
export type Exercise = {
  id: string;
  name: string;
  pattern: string;
  muscles: string[];
  equipment: string[];
  substitutes: string[];
  cue: string;
  risk: string;
};

export type GoalParsed = {
  rawText: string;
  primaryGoal: GoalPrimary;
  primaryGoalLabel: string;
  secondaryGoal: GoalSecondary;
  secondaryGoalLabel: string;
  targetWeight: number | null;
  trainingDaysPerWeek: number;
  sessionDurationMinutes: number;
  frequentTravel: boolean;
  conveniencePriority: boolean;
  constraints: string[];
  notes: string[];
};

export type Goal = { id: string; text: string; parsed: GoalParsed; createdAt: string };
export type PlannedExercise = {
  id: string;
  exerciseId: string;
  sets: number | string;
  reps: number | string;
  load: string;
  rpe: number | string;
  rest: string;
  notes: string;
};
export type WorkoutDay = { id: string; type: string; focus: string; intent: string; exercises: PlannedExercise[] };
export type TrainingPlan = {
  id: string;
  generatedAt: string;
  context: { goalLabel: string; gymName: string; metricSummary: string; notes: string[] };
  days: WorkoutDay[];
};

export type SetLog = {
  id: string;
  setIndex: number;
  loadKg: number | null;
  reps: number | null;
  rpe: number | null;
  completed: boolean;
  note: string;
};

export type WorkoutSession = {
  id: string;
  date: string;
  createdAt: string;
  startedAt: string;
  completedAt: string | null;
  status: SessionStatus;
  gymId: string | null;
  gymName: string;
  planId: string | null;
  dayIndex: number;
  focus: string;
  completion: number | null;
  rpe: number | null;
  painScore: number | null;
  painArea: string;
  sleep: number | null;
  fatigue: number | null;
  notes: string;
  exerciseLogIds: string[];
};

export type ExerciseLog = {
  id: string;
  date: string;
  createdAt: string;
  sessionId: string;
  exerciseId: string;
  exerciseName: string;
  dayIndex: number;
  focus: string;
  plannedSets: number | string;
  plannedReps: number | string;
  plannedLoad: string;
  plannedRpe: number | string;
  actualLoad: string;
  actualReps: string;
  sets: SetLog[];
  volumeLoad: number;
  hardSets: number;
  rpe: number;
  quality: string;
  rangeOfMotion: string;
  targetMuscleFeel: string;
  limitingFactor: string;
  sideIssue: string;
  painScore: number;
  painArea: string;
  freeText: string;
  analysis: { tags: string[]; evidence: string[]; recommendations: string[]; priority: Priority };
};

export type BodyMetricEntry = {
  id: string;
  date: string;
  weight: number | null;
  bodyFat: number | null;
  skeletalMuscle: number | null;
  waist: number | null;
  notes: string;
  createdAt: string;
};

export type NutritionLog = {
  id: string;
  date: string;
  createdAt: string;
  rawText: string;
  goalId: string | null;
  analysis: { calories: number; protein: number; confidence: "low" | "medium" | "high"; tags: string[]; recommendations: string[] };
};

export type Advice = {
  id: string;
  type: string;
  priority: Priority;
  title: string;
  detail: string;
  evidence: string[];
  tags: string[];
  source: string;
  status: AdviceStatus;
  createdAt: string;
  expiresAt: string | null;
};

export type Revision = {
  id: string;
  status: RevisionStatus;
  summary: string;
  reason: string;
  evidence: string[];
  patch: PlanPatch;
  createdAt: string;
  appliedAt: string | null;
};

export type PlanPatch =
  | { type: "reduce_day_volume"; dayIndex: number; factor: number }
  | { type: "trim_accessory"; dayIndex: number }
  | { type: "add_progression_note"; dayIndex: number }
  | { type: "increase_cardio_time"; dayIndex: number; minutes: number }
  | { type: "manual_replace"; dayIndex: number; rowIndex: number; exerciseId: string };

export type BackupSnapshot = { id: string; createdAt: string; reason: string; schemaVersion: number; stateJson: string };

export type AppData = {
  schemaVersion: number;
  currentGymId: string | null;
  currentGoalId: string | null;
  gyms: Gym[];
  goals: Goal[];
  plan: TrainingPlan | null;
  sessions: WorkoutSession[];
  exerciseLogs: ExerciseLog[];
  metrics: BodyMetricEntry[];
  nutritionLogs: NutritionLog[];
  advice: Advice[];
  revisions: Revision[];
  backupSnapshots: BackupSnapshot[];
};
