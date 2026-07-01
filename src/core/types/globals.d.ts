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

type UnknownFn = (...args: unknown[]) => unknown;

interface GoalParserModule {
  parseGoal: UnknownFn;
}

interface MetricAnalyzerModule {
  sortedMetrics: UnknownFn;
  metricTrend: UnknownFn;
}

interface TrainingStatsModule {
  calculateVolumeLoad: UnknownFn;
  calculateHardSets: UnknownFn;
  detectSimplePr: UnknownFn;
}

interface AdviceEngineModule {
  recommendationItem: UnknownFn;
  buildAdviceEntry: UnknownFn;
  sortRecommendationItems: UnknownFn;
  highestPriority: UnknownFn;
  priorityScore: UnknownFn;
  priorityLabel: UnknownFn;
  uniqueStrings: UnknownFn;
  revision: UnknownFn;
  createAdviceFromSession: UnknownFn;
}

interface PlanGeneratorModule {
  generatePlan: UnknownFn;
  buildPlanDay: UnknownFn;
  planDayTypes: UnknownFn;
  planConfig: UnknownFn;
  defaultRowNote: UnknownFn;
  pickAvailableExercise: UnknownFn;
  buildPlanContext: UnknownFn;
  isAvailable: UnknownFn;
  availableSubstitutes: UnknownFn;
}

interface ExerciseFeedbackAnalyzerModule {
  analyzeExerciseFeedback: UnknownFn;
  buildExerciseProfiles: UnknownFn;
  computeExercisePriority: UnknownFn;
  inferExerciseProfileAdvice: UnknownFn;
}

interface NutritionParserModule {
  parseNutritionLog: UnknownFn;
  buildNutritionProfile: UnknownFn;
  buildNutritionTrend: UnknownFn;
  inferNutritionProfileAdvice?: UnknownFn;
  buildNutritionReminders: UnknownFn;
  nutritionRecommendations?: UnknownFn;
  buildNutritionRecommendationItems?: UnknownFn;
}

interface IntegratedSignalsModule {
  buildIntegratedSignals: UnknownFn;
  buildTrainingReminders: UnknownFn;
  buildLinkedTodayInsights: UnknownFn;
}

interface WeeklyReviewModule {
  buildWeeklyReview: UnknownFn;
  revision: UnknownFn;
}

interface RulesModule extends
  GoalParserModule,
  MetricAnalyzerModule,
  TrainingStatsModule,
  AdviceEngineModule,
  PlanGeneratorModule,
  ExerciseFeedbackAnalyzerModule,
  NutritionParserModule,
  IntegratedSignalsModule,
  WeeklyReviewModule {}

interface FitnessDataModule {
  equipment: Equipment[];
  exercises: Exercise[];
  defaultGyms: Gym[];
}

interface StateNormalizerModule {
  CURRENT_SCHEMA_VERSION: number;
  normalizeAppState: UnknownFn;
}

interface DesktopStorageModule {
  isAvailable: UnknownFn;
  loadAppState: UnknownFn;
  saveAppState: UnknownFn;
}

interface AppStateStoreModule {
  createDefaultState: UnknownFn;
  prepareState: UnknownFn;
  normalizeState: UnknownFn;
  loadLocalState: UnknownFn;
  saveLocalState: UnknownFn;
  hydrateDesktopState: UnknownFn;
  persistDesktopState: UnknownFn;
}

interface DataPortabilityModule {
  buildPlanCsv: UnknownFn;
  parsePlanCsv: UnknownFn;
  buildBackupJson: UnknownFn;
  parseBackupJson: UnknownFn;
}

interface LineChartModule {
  draw: UnknownFn;
}

interface BrowserFileIOModule {
  downloadText: UnknownFn;
  readInputFileText: UnknownFn;
  clearInput: UnknownFn;
  confirmResetData: UnknownFn;
}

interface DisplayFormattersFactoryModule {
  create: UnknownFn;
}

interface ViewRenderersFactoryModule {
  create: UnknownFn;
}

interface WorkbenchActionsFactoryModule {
  create: UnknownFn;
}

interface DomUtilsModule {
  create: UnknownFn;
}

interface FitnessAppNamespace {
  DataPortability?: DataPortabilityModule;
  LineChart?: LineChartModule;
  BrowserFileIO?: BrowserFileIOModule;
  DomUtils?: DomUtilsModule;
  DisplayFormatters?: DisplayFormattersFactoryModule;
  ViewRenderers?: ViewRenderersFactoryModule;
  WorkbenchActions?: WorkbenchActionsFactoryModule;
}

interface FitnessCoreNamespace {
  GoalParser?: GoalParserModule;
  MetricAnalyzer?: MetricAnalyzerModule;
  TrainingStats?: TrainingStatsModule;
  AdviceEngine?: AdviceEngineModule;
  PlanGenerator?: PlanGeneratorModule;
  ExerciseFeedbackAnalyzer?: ExerciseFeedbackAnalyzerModule;
  NutritionParser?: NutritionParserModule;
  IntegratedSignals?: IntegratedSignalsModule;
  WeeklyReview?: WeeklyReviewModule;
  Rules?: RulesModule;
  StateNormalizer?: StateNormalizerModule;
  DesktopStorage?: DesktopStorageModule;
  AppStateStore?: AppStateStoreModule;
}

interface Window {
  FitnessCore: FitnessCoreNamespace;
  FitnessApp: FitnessAppNamespace;
  FitnessData: FitnessDataModule;
}
