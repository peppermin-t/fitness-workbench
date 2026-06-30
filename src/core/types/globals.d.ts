interface FitnessCoreNamespace {
  GoalParser?: any;
  MetricAnalyzer?: any;
  TrainingStats?: any;
  AdviceEngine?: any;
  PlanGenerator?: any;
  ExerciseFeedbackAnalyzer?: any;
  NutritionParser?: any;
  IntegratedSignals?: any;
  WeeklyReview?: any;
  Rules?: any;
  StateNormalizer?: any;
  DesktopStorage?: any;
  AppStateStore?: any;
}

interface Window {
  FitnessCore: FitnessCoreNamespace;
  FitnessData: any;
  FitnessPlanner: any;
}
