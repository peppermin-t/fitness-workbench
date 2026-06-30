(function () {
    "use strict";
    const core = window.FitnessCore;
    window.FitnessCore = core || {};
    window.FitnessCore.Rules = {
        parseGoal: core.GoalParser.parseGoal,
        sortedMetrics: core.MetricAnalyzer.sortedMetrics,
        metricTrend: core.MetricAnalyzer.metricTrend,
        calculateVolumeLoad: core.TrainingStats.calculateVolumeLoad,
        calculateHardSets: core.TrainingStats.calculateHardSets,
        detectSimplePr: core.TrainingStats.detectSimplePr,
        generatePlan: core.PlanGenerator.generatePlan,
        buildPlanDay: core.PlanGenerator.buildPlanDay,
        planDayTypes: core.PlanGenerator.planDayTypes,
        planConfig: core.PlanGenerator.planConfig,
        defaultRowNote: core.PlanGenerator.defaultRowNote,
        pickAvailableExercise: core.PlanGenerator.pickAvailableExercise,
        buildPlanContext: core.PlanGenerator.buildPlanContext,
        isAvailable: core.PlanGenerator.isAvailable,
        availableSubstitutes: core.PlanGenerator.availableSubstitutes,
        recommendationItem: core.AdviceEngine.recommendationItem,
        buildAdviceEntry: core.AdviceEngine.buildAdviceEntry,
        sortRecommendationItems: core.AdviceEngine.sortRecommendationItems,
        highestPriority: core.AdviceEngine.highestPriority,
        priorityScore: core.AdviceEngine.priorityScore,
        priorityLabel: core.AdviceEngine.priorityLabel,
        uniqueStrings: core.AdviceEngine.uniqueStrings,
        revision: core.AdviceEngine.revision,
        createAdviceFromSession: core.AdviceEngine.createAdviceFromSession,
        analyzeExerciseFeedback: core.ExerciseFeedbackAnalyzer.analyzeExerciseFeedback,
        buildExerciseProfiles: core.ExerciseFeedbackAnalyzer.buildExerciseProfiles,
        computeExercisePriority: core.ExerciseFeedbackAnalyzer.computeExercisePriority,
        inferExerciseProfileAdvice: core.ExerciseFeedbackAnalyzer.inferExerciseProfileAdvice,
        parseNutritionLog: core.NutritionParser.parseNutritionLog,
        buildNutritionProfile: core.NutritionParser.buildNutritionProfile,
        buildNutritionTrend: core.NutritionParser.buildNutritionTrend,
        buildNutritionReminders: core.NutritionParser.buildNutritionReminders,
        buildIntegratedSignals: core.IntegratedSignals.buildIntegratedSignals,
        buildTrainingReminders: core.IntegratedSignals.buildTrainingReminders,
        buildLinkedTodayInsights: core.IntegratedSignals.buildLinkedTodayInsights,
        buildWeeklyReview: core.WeeklyReview.buildWeeklyReview
    };
})();
