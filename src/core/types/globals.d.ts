interface MetricTrendResult {
  delta: number;
  first?: number;
  latest?: number;
  days?: number;
}

interface NutritionProfileSummary {
  count: number;
  lowProteinDays: number;
  missedMealDays: number;
  uncertainDays: number;
  missedMealByMeal: Record<string, number>;
  averages: Record<string, number>;
  topTags: Array<[string, number]>;
  advice: string[];
  trend?: Record<string, number> | null;
}

interface ExerciseProfileSummary {
  exerciseId: string;
  exerciseName: string;
  count: number;
  painCount: number;
  poorQualityCount: number;
  topTags: Array<[string, number]>;
  advice?: string[];
  priority?: string;
}

interface GoalParserModule {
  parseGoal(text: string): GoalParsed;
}

interface MetricAnalyzerModule {
  sortedMetrics(metrics: BodyMetricEntry[]): BodyMetricEntry[];
  metricTrend(metrics: BodyMetricEntry[], key: string, days: number): MetricTrendResult | null;
}

interface TrainingStatsModule {
  calculateVolumeLoad(sets: SetLog[]): number;
  calculateHardSets(sets: SetLog[]): number;
  detectSimplePr(log: ExerciseLog, previousLogs: ExerciseLog[]): SimplePrResult;
}

interface AdviceEngineModule {
  recommendationItem(type: string, priority: string, title: string, detail: string, evidence?: string[], tags?: string[]): RecommendationItem;
  buildAdviceEntry(uid: (prefix: string) => string, nowLabel: () => string, title: string, items: RecommendationItem[], tags?: string[], evidence?: string[]): Advice;
  sortRecommendationItems(items: RecommendationItem[]): RecommendationItem[];
  highestPriority(items: RecommendationItem[]): string;
  priorityScore(priority: string): number;
  priorityLabel(priority: string): string;
  uniqueStrings(items: string[]): string[];
  createAdviceFromSession?(input: Record<string, unknown>): { advice: Advice[]; revisions: Revision[] };
}

interface PlanGeneratorModule {
  generatePlan(input: Record<string, unknown>): TrainingPlan;
  isAvailable(exercise: Exercise, gym: Gym): boolean;
  availableSubstitutes(exercise: Exercise, gym: Gym, exercises: Exercise[]): Exercise[];
  [key: string]: unknown;
}

interface ExerciseFeedbackAnalyzerModule {
  analyzeExerciseFeedback(input: Record<string, unknown>, exercise: Exercise): Record<string, unknown>;
  buildExerciseProfiles(logs: ExerciseLog[], exercises?: Exercise[]): ExerciseProfileSummary[];
  computeExercisePriority?(profile: ExerciseProfileSummary): string;
  inferExerciseProfileAdvice?(profile: ExerciseProfileSummary): string[];
}

interface NutritionParserModule {
  parseNutritionLog(rawText: string, goal?: Goal | null, latestMetric?: BodyMetricEntry | null): Record<string, unknown>;
  buildNutritionProfile(logs: NutritionLog[], goal?: Goal | null): NutritionProfileSummary;
  buildNutritionTrend(logs: NutritionLog[]): Record<string, number> | null;
  buildNutritionReminders?(input: Record<string, unknown>): RecommendationItem[];
  [key: string]: unknown;
}

interface IntegratedSignalsModule {
  buildIntegratedSignals(input: Record<string, unknown>): RecommendationItem[];
  buildTrainingReminders(input: Record<string, unknown>): RecommendationItem[];
  buildLinkedTodayInsights(input: Record<string, unknown>): string[];
  [key: string]: unknown;
}

interface WeeklyReviewModule {
  buildWeeklyReview(input: Record<string, unknown>): Record<string, unknown>;
  [key: string]: unknown;
}

interface StateNormalizerModule {
  CURRENT_SCHEMA_VERSION: number;
  normalizeAppState(input: unknown, defaults: AppState): AppState;
}

interface DesktopStorageModule {
  isAvailable(): boolean;
  loadAppState(): Promise<unknown>;
  saveAppState(state: unknown): Promise<boolean>;
}

interface AppStateStoreModule {
  createDefaultState(input: Record<string, unknown>): AppState;
  prepareState(data: unknown, context: Record<string, unknown>): AppState;
  normalizeState(state: unknown, context: Record<string, unknown>): AppState;
  loadLocalState(context: Record<string, unknown>): AppState;
  saveLocalState(state: unknown, context: Record<string, unknown>): AppState;
  hydrateDesktopState(currentState: unknown, context: Record<string, unknown>, callbacks?: Record<string, unknown>): Promise<void>;
  persistDesktopState(state: unknown, context: Record<string, unknown>, callbacks?: Record<string, unknown>): void;
}

type LooseGlobalModule = Record<string, unknown> & { [key: string]: any };

interface FitnessCoreNamespace {
  GoalParser?: LooseGlobalModule;
  MetricAnalyzer?: LooseGlobalModule;
  TrainingStats?: LooseGlobalModule;
  AdviceEngine?: LooseGlobalModule;
  PlanGenerator?: LooseGlobalModule;
  ExerciseFeedbackAnalyzer?: LooseGlobalModule;
  NutritionParser?: LooseGlobalModule;
  IntegratedSignals?: LooseGlobalModule;
  WeeklyReview?: LooseGlobalModule;
  Rules?: LooseGlobalModule;
  StateNormalizer?: LooseGlobalModule;
  DesktopStorage?: LooseGlobalModule;
  AppStateStore?: LooseGlobalModule;
}

interface Window {
  FitnessCore: FitnessCoreNamespace;
  FitnessApp: Record<string, unknown>;
  FitnessData: Record<string, unknown>;
  FitnessPlanner: LooseGlobalModule;
}
