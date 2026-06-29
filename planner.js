window.FitnessPlanner = (() => {
  "use strict";

  const parseGoal = window.FitnessCore.GoalParser.parseGoal;
  const { sortedMetrics, metricTrend } = window.FitnessCore.MetricAnalyzer;
  const {
    calculateVolumeLoad,
    calculateHardSets,
    detectSimplePr
  } = window.FitnessCore.TrainingStats;
  const {
    generatePlan,
    isAvailable,
    availableSubstitutes
  } = window.FitnessCore.PlanGenerator;
  const {
    recommendationItem,
    buildAdviceEntry,
    sortRecommendationItems,
    highestPriority,
    priorityScore,
    priorityLabel,
    uniqueStrings
  } = window.FitnessCore.AdviceEngine;
  const {
    analyzeExerciseFeedback,
    buildExerciseProfiles
  } = window.FitnessCore.ExerciseFeedbackAnalyzer;
  const {
    parseNutritionLog,
    buildNutritionProfile,
    buildNutritionTrend,
    buildNutritionReminders
  } = window.FitnessCore.NutritionParser;
  const {
    buildIntegratedSignals,
    buildTrainingReminders,
    buildLinkedTodayInsights
  } = window.FitnessCore.IntegratedSignals;
  const {
    buildWeeklyReview
  } = window.FitnessCore.WeeklyReview;

function createAdviceFromSession({ session, day, nowLabel, uid }) {
    const advice = [];
    const revisions = [];
    const tags = [session.focus, session.gymName];
    const evidence = [
      `完成度 ${session.completion}%`,
      `RPE ${session.rpe}/10`,
      `疼痛 ${session.painScore}/5${session.painArea ? `（${session.painArea}）` : ""}`,
      `睡眠 ${session.sleep}/5`,
      `疲劳 ${session.fatigue}/5`
    ];
    const items = [];

    if (session.painScore >= 3) {
      items.push(recommendationItem("safety", "high", "先处理疼痛风险", `疼痛评分 ${session.painScore}/5，后续涉及“${session.painArea || "相关部位"}”的动作先降强度、降量或换成低风险替代。`, [`疼痛 ${session.painScore}/5`, session.painArea ? `部位：${session.painArea}` : "未填写具体疼痛部位"], ["疼痛反馈", "降量"]));
      revisions.push(revision(uid, nowLabel, `降低 ${day.focus} 的训练量`, `训练后疼痛评分较高（${session.painScore}/5），建议将同类训练日组数减少约 30%。`, ["疼痛反馈", "降量"], { type: "reduce_day_volume", dayIndex: session.dayIndex, factor: 0.7 }));
    }

    if (session.completion < 70) {
      items.push(recommendationItem("workload", "high", "先把训练做完，再谈加量", `完成度只有 ${session.completion}% ，下次同类训练不建议加重量，优先缩短动作数量或降低组数。`, [`完成度 ${session.completion}%`, `训练日：${day.focus}`], ["完成度低", "便利化"]));
      revisions.push(revision(uid, nowLabel, `简化 ${day.focus} 的训练安排`, "本次完成度低于 70%，说明当前安排对当天状态或场地不够友好，建议减少 1-2 个辅助动作。", ["完成度低", "便利化"], { type: "trim_accessory", dayIndex: session.dayIndex }));
    }

    if (session.rpe >= 9 && session.completion < 90) {
      items.push(recommendationItem("technique", "high", "当前负荷偏顶，不适合继续加重", `RPE 已经到 ${session.rpe}/10，但完成度仍未到位，下次先维持或小幅回退负荷，优先把动作质量做稳。`, [`RPE ${session.rpe}/10`, `完成度 ${session.completion}%`], ["RPE偏高", "动作质量优先"]));
    }

    if (session.sleep <= 2 || session.fatigue >= 4) {
      items.push(recommendationItem("recovery", "medium", "恢复状态在拖训练表现", `睡眠 ${session.sleep}/5、疲劳 ${session.fatigue}/5，近期建议保留训练连续性，但降低冲重量动作和额外训练量。`, [`睡眠 ${session.sleep}/5`, `疲劳 ${session.fatigue}/5`], ["恢复不足"]));
      tags.push("恢复不足");
    }

    if (session.completion >= 95 && session.rpe <= 7 && session.painScore <= 1 && session.sleep >= 3 && session.fatigue <= 3) {
      items.push(recommendationItem("progression", "low", "具备小幅进阶条件", "完成度高且 RPE 不高，可以在下次同动作中小幅加重 2.5%-5%，或每个主要动作增加 1-2 次。", [`完成度 ${session.completion}%`, `RPE ${session.rpe}/10`, `疼痛 ${session.painScore}/5`], ["渐进超负荷", "加重"]));
      revisions.push(revision(uid, nowLabel, `${day.focus} 下次可小幅进阶`, `完成度 ${session.completion}% 且 RPE ${session.rpe}，疼痛反馈低，符合小幅渐进超负荷条件。`, ["渐进超负荷", "加重"], { type: "add_progression_note", dayIndex: session.dayIndex }));
    }

    if (!items.length) {
      items.push(recommendationItem("info", "low", "当前训练日没有触发明显风险", "维持当前计划，下一次继续观察完成度、RPE、疼痛和恢复变化。", evidence, ["稳定观察"]));
    }

    const adviceItem = buildAdviceEntry(uid, nowLabel, `${day.focus} 反馈建议`, items, tags, evidence);
    advice.push(adviceItem);
    return { advice, revisions };
  }



  return {
    parseGoal,
    generatePlan,
    createAdviceFromSession,
    analyzeExerciseFeedback,
    parseNutritionLog,
    buildExerciseProfiles,
    buildNutritionProfile,
    buildNutritionTrend,
    buildIntegratedSignals,
    buildTrainingReminders,
    buildNutritionReminders,
    buildLinkedTodayInsights,
    buildWeeklyReview,
    availableSubstitutes,
    isAvailable,
    metricTrend,
    sortedMetrics,
    calculateVolumeLoad,
    calculateHardSets,
    detectSimplePr
  };
})();
