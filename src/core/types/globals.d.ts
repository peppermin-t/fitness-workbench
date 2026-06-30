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
  StateNormalizer?: any;
}

interface Window {
  FitnessCore: FitnessCoreNamespace;
  FitnessData: any;
  FitnessPlanner: any;
}
