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
  parseGoal: Function;
}

interface MetricAnalyzerModule {
  sortedMetrics: Function;
  metricTrend: Function;
}

interface TrainingStatsModule {
  calculateVolumeLoad: Function;
  calculateHardSets: Function;
  detectSimplePr: Function;
}

interface AdviceEngineModule {
  recommendationItem: Function;
  buildAdviceEntry: Function;
  sortRecommendationItems: Function;
  highestPriority: Function;
  priorityScore: Function;
  priorityLabel: Function;
  uniqueStrings: Function;
  revision: Function;
  createAdviceFromSession: Function;
}

interface PlanGeneratorModule {
  generatePlan: Function;
  buildPlanDay: Function;
  planDayTypes: Function;
  planConfig: Function;
  defaultRowNote: Function;
  pickAvailableExercise: Function;
  buildPlanContext: Function;
  isAvailable: Function;
  availableSubstitutes: Function;
}

interface ExerciseFeedbackAnalyzerModule {
  analyzeExerciseFeedback: Function;
  buildExerciseProfiles: Function;
  computeExercisePriority: Function;
  inferExerciseProfileAdvice: Function;
}

interface NutritionParserModule {
  parseNutritionLog: Function;
  buildNutritionProfile: Function;
  buildNutritionTrend: Function;
  inferNutritionProfileAdvice?: Function;
  buildNutritionReminders: Function;
  nutritionRecommendations?: Function;
  buildNutritionRecommendationItems?: Function;
}

interface IntegratedSignalsModule {
  buildIntegratedSignals: Function;
  buildTrainingReminders: Function;
  buildLinkedTodayInsights: Function;
}

interface WeeklyReviewModule {
  buildWeeklyReview: Function;
  revision: Function;
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
  normalizeAppState: Function;
}

interface DesktopStorageModule {
  isAvailable: Function;
  loadAppState: Function;
  saveAppState: Function;
}

interface AppStateStoreModule {
  createDefaultState: Function;
  prepareState: Function;
  normalizeState: Function;
  loadLocalState: Function;
  saveLocalState: Function;
  hydrateDesktopState: Function;
  persistDesktopState: Function;
}

interface DataPortabilityModule {
  buildPlanCsv: Function;
  parsePlanCsv: Function;
  buildBackupJson: Function;
  parseBackupJson: Function;
}

interface LineChartModule {
  draw: Function;
}

interface BrowserFileIOModule {
  downloadText: Function;
  readInputFileText: Function;
  clearInput: Function;
  confirmResetData: Function;
}

interface DisplayFormattersFactoryModule {
  create: Function;
}

interface ViewRenderersFactoryModule {
  create: Function;
}

interface WorkbenchActionsFactoryModule {
  create: Function;
}

interface FitnessAppNamespace {
  DataPortability?: DataPortabilityModule;
  LineChart?: LineChartModule;
  BrowserFileIO?: BrowserFileIOModule;
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
