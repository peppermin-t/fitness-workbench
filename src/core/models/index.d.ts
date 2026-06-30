type GoalPrimary = "fat_loss" | "muscle_gain" | "strength" | "general";
type GoalSecondary = "strength_maintenance" | "conditioning" | "convenience" | null;
type WorkoutSessionStatus = "in_progress" | "completed" | "cancelled";
type RevisionStatus = "pending" | "applied" | "dismissed";
type AdviceStatus = "active" | "applied" | "dismissed";

interface AppState {
  schemaVersion: number;
  currentGymId: string | null;
  currentGoalId: string | null;
  gyms: Gym[];
  exercises: Exercise[];
  goals: Goal[];
  metrics: BodyMetricEntry[];
  plan: TrainingPlan | null;
  sessions: WorkoutSession[];
  exerciseLogs: ExerciseLog[];
  nutritionLogs: NutritionLog[];
  feedback: unknown[];
  advice: Advice[];
  revisions: Revision[];
}

interface Goal {
  id: string;
  text?: string;
  rawText?: string;
  createdAt?: string;
  parsed: GoalParsed;
}

interface GoalParsed {
  rawText?: string;
  primaryGoal: GoalPrimary | string;
  primaryGoalLabel?: string;
  secondaryGoal?: GoalSecondary | string;
  secondaryGoalLabel?: string;
  targetWeight?: number | null;
  trainingDaysPerWeek?: number | null;
  sessionDurationMinutes?: number | null;
  frequentTravel?: boolean;
  conveniencePriority?: boolean;
  constraints?: string[];
  notes?: string[];
}

interface Gym {
  id: string;
  name: string;
  location?: string;
  equipment: string[];
}

interface Exercise {
  id: string;
  name: string;
  pattern: string;
  muscles: string[];
  equipment: string[];
  substitutes: string[];
  cue: string;
  risk: string;
  links: Link[];
}

interface Link {
  label: string;
  url: string;
}

interface TrainingPlan {
  id: string;
  schemaVersion?: number;
  generatedAt?: string;
  context?: Record<string, unknown>;
  days: WorkoutDay[];
}

interface WorkoutDay {
  id?: string;
  focus: string;
  intent?: string;
  exercises: PlannedExercise[];
}

interface PlannedExercise {
  id?: string;
  exerciseId: string;
  sets: number | string;
  reps: number | string;
  load?: string;
  rpe?: number | string;
  rest?: string;
  notes?: string;
}

interface WorkoutSession {
  id: string;
  date: string;
  createdAt?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  status: WorkoutSessionStatus | string;
  gymId?: string | null;
  gymName?: string;
  planId?: string | null;
  dayIndex?: number;
  focus?: string;
  completion?: number | null;
  rpe?: number | null;
  painScore?: number | null;
  painArea?: string;
  sleep?: number | null;
  fatigue?: number | null;
  notes?: string;
  exerciseLogIds: string[];
}

interface ExerciseLog {
  id: string;
  date: string;
  createdAt?: string;
  sessionId: string | null;
  exerciseId: string;
  exerciseName?: string;
  dayIndex?: number;
  focus?: string;
  plannedSets?: number | string;
  plannedReps?: number | string;
  plannedLoad?: string;
  plannedRpe?: number | string;
  actualLoad?: string;
  actualReps?: string;
  sets: SetLog[];
  volumeLoad?: number;
  hardSets?: number;
  simplePr?: SimplePrResult;
  rpe?: number;
  quality?: string;
  rangeOfMotion?: string;
  targetMuscleFeel?: string;
  limitingFactor?: string;
  sideIssue?: string;
  painScore?: number;
  painArea?: string;
  freeText?: string;
  analysis?: Record<string, unknown>;
}

interface SetLog {
  id?: string;
  setIndex: number;
  loadKg: number | null;
  reps: number | null;
  rpe?: number | null;
  completed: boolean;
  note?: string;
}

interface SimplePrResult {
  isPr: boolean;
  records: SimplePrRecord[];
}

interface SimplePrRecord {
  type: "volume_load" | "max_load" | "max_reps" | string;
  label: string;
  current: number;
  previous: number;
}

interface BodyMetricEntry {
  id: string;
  date: string;
  weight?: number | null;
  bodyFat?: number | null;
  skeletalMuscle?: number | null;
  waist?: number | null;
  notes?: string;
  createdAt?: string;
}

interface NutritionLog {
  id: string;
  date: string;
  createdAt?: string;
  rawText?: string;
  text?: string;
  goalId?: string | null;
  analysis?: Record<string, unknown>;
}

interface Advice {
  id: string;
  createdAt?: string;
  title: string;
  body?: string;
  tags?: string[];
  priority?: string;
  priorityLabel?: string;
  evidence?: string[];
  recommendationItems?: RecommendationItem[];
  status?: AdviceStatus | string;
}

interface RecommendationItem {
  type: string;
  priority: string;
  title: string;
  detail: string;
  evidence?: string[];
  tags?: string[];
}

interface Revision {
  id: string;
  createdAt?: string;
  appliedAt?: string;
  status: RevisionStatus | string;
  summary: string;
  reason?: string;
  tags?: string[];
  patch?: Record<string, unknown>;
}
