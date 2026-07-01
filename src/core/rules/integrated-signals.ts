(function () {
  "use strict";

  type ExerciseProfileSummary = {
    exerciseId: string;
    exerciseName: string;
    count: number;
    painCount: number;
    poorQualityCount: number;
    topTags: Array<[string, number]>;
  };

  const { recommendationItem, sortRecommendationItems, uniqueStrings } = window.FitnessCore.AdviceEngine as {
    recommendationItem: (...args: unknown[]) => RecommendationItem;
    sortRecommendationItems: (items: RecommendationItem[]) => RecommendationItem[];
    uniqueStrings: (items: string[]) => string[];
  };
  const { sortedMetrics, metricTrend } = window.FitnessCore.MetricAnalyzer as {
    sortedMetrics: (metrics: BodyMetricEntry[]) => BodyMetricEntry[];
    metricTrend: (metrics: BodyMetricEntry[], key: string, days: number) => MetricTrendResult | null;
  };
  const { buildExerciseProfiles } = window.FitnessCore.ExerciseFeedbackAnalyzer as {
    buildExerciseProfiles: (logs: ExerciseLog[]) => ExerciseProfileSummary[];
  };
  const { buildNutritionProfile } = window.FitnessCore.NutritionParser as {
    buildNutritionProfile: (logs: NutritionLog[], goal?: Goal | null) => NutritionProfileSummary;
  };

function buildIntegratedSignals({ goal, metrics, sessions, exerciseLogs, nutritionLogs }) {
    const primary = goal?.parsed?.primaryGoal || "general_fitness";
    const completedSessions = filterCompletedSessions(sessions || []);
    const nutritionProfile = buildNutritionProfile(nutritionLogs || [], goal);
    const exerciseProfiles = buildExerciseProfiles(exerciseLogs || []);
    const sortedMetricList = sortedMetrics(metrics || []);
    const sortedSessionList = sortedSessions(completedSessions);
    const latestMetric = sortedMetricList[sortedMetricList.length - 1];
    const latestSession = sortedSessionList[sortedSessionList.length - 1];
    const weightTrend21 = metricTrend(metrics || [], "weight", 21);
    const sessionTrend = compareSessionWindows(completedSessions, 14);
    const items = [];

    if (exerciseProfiles.some((profile) => profile.topTags.some(([tag]) => tag === "pain_risk"))) {
      items.push(recommendationItem("safety", "high", "近期有动作疼痛风险在反复出现", "今天训练先保动作质量，不要在已有疼痛风险的动作上继续追求加重。", [
        `高优先画像数量 ${exerciseProfiles.filter((profile) => profile.topTags.some(([tag]) => tag === "pain_risk")).length}`,
        "动作画像里存在 pain_risk"
      ], ["动作画像", "疼痛风险"]));
    }

    if (primary === "fat_loss" && weightTrend21 && Math.abs(weightTrend21.delta) <= 0.4) {
      const likelyCauses = [];
      if (nutritionProfile.topTags.some(([tag]) => tag === "high_fat_possible" || tag === "processed_snack")) likelyCauses.push("高油外食或零食频率较高");
      if (nutritionProfile.missedMealDays >= 2) likelyCauses.push("正餐连续性差");
      if (nutritionProfile.uncertainDays >= 2) likelyCauses.push("饮食分量记录偏模糊");
      items.push(recommendationItem("nutrition", "high", "体重 2-3 周基本不动，先查饮食干扰项", `减脂目标下近 21 天体重变化只有 ${signed(round1(weightTrend21.delta), "kg")}，${likelyCauses.length ? `更像是 ${likelyCauses.join("、")} 在干扰。` : "优先检查饮食记录和有氧执行是否稳定。"} `, [
        `近 21 天体重变化 ${signed(round1(weightTrend21.delta), "kg")}`,
        `漏正餐 ${nutritionProfile.missedMealDays} 天`,
        `记录置信度不足 ${nutritionProfile.uncertainDays} 天`
      ], ["联动判断", "体重平台"]));
    }

    if ((sessionTrend.recentAvgRpe >= 8 || latestSession?.rpe >= 8.5) && (nutritionProfile.missedMealByMeal?.lunch || 0) >= 2) {
      items.push(recommendationItem("nutrition", "high", "午餐缺失很可能在拖训练供能", "近期 RPE 偏高，同时午餐缺失重复出现，训练表现波动更像是白天供能不足，而不是单纯训练量不够。", [
        `近期平均 RPE ${round1(sessionTrend.recentAvgRpe)}`,
        `午餐缺失 ${nutritionProfile.missedMealByMeal.lunch || 0} 次`
      ], ["联动判断", "供能不足", "午餐缺失"]));
    }

    if (primary === "fat_loss" && sessionTrend.hasDecline && (nutritionProfile.lowProteinDays >= 2 || sessionTrend.recentAvgFatigue >= 4)) {
      items.push(recommendationItem("recovery", "high", "减脂期力量表现在下滑，先保蛋白和恢复", "最近训练完成度下降、RPE 上升，减脂目标下这通常意味着恢复和蛋白支撑不够，先稳住蛋白、睡眠和训练量。", [
        `完成度 ${round1(sessionTrend.previousAvgCompletion)}% -> ${round1(sessionTrend.recentAvgCompletion)}%`,
        `RPE ${round1(sessionTrend.previousAvgRpe)} -> ${round1(sessionTrend.recentAvgRpe)}`,
        `蛋白缺口 ${nutritionProfile.lowProteinDays} 天`,
        `近期疲劳 ${round1(sessionTrend.recentAvgFatigue)}/5`
      ], ["联动判断", "减脂", "力量下滑"]));
    }

    if (nutritionProfile.lowProteinDays >= 2) {
      items.push(recommendationItem("nutrition", "medium", "近期蛋白缺口反复出现", "今天如果安排主训练日，先把白天蛋白和主食补齐，再看是否需要冲训练量。", [
        `蛋白缺口 ${nutritionProfile.lowProteinDays}/${nutritionProfile.count || 0} 天`,
        `近期待均蛋白 ${round1(nutritionProfile.averages.protein)}g`
      ], ["饮食画像", "蛋白缺口"]));
    }

    if (latestMetric && primary === "muscle_gain" && weightTrend21 && Math.abs(weightTrend21.delta) < 0.3 && nutritionProfile.lowProteinDays >= 2) {
      items.push(recommendationItem("nutrition", "medium", "增肌期体重没动，先补热量和蛋白", "体重趋势几乎不动，同时蛋白缺口较多，先把白天正餐和蛋白补稳，再决定是否继续加训练量。", [
        `近 21 天体重变化 ${signed(round1(weightTrend21.delta), "kg")}`,
        `蛋白缺口 ${nutritionProfile.lowProteinDays} 天`
      ], ["增肌", "热量/蛋白"]));
    }

    return sortRecommendationItems(items);
  }



function buildTrainingReminders({ goal, metrics, sessions, exerciseLogs, nutritionLogs, day }) {
    const profiles = new Map<string, ExerciseProfileSummary>((buildExerciseProfiles(exerciseLogs || []) as ExerciseProfileSummary[]).map((profile) => [profile.exerciseId, profile]));
    const integrated = buildIntegratedSignals({ goal, metrics, sessions: filterCompletedSessions(sessions || []), exerciseLogs, nutritionLogs });
    const reminders = [];

    (day?.exercises || []).forEach((row) => {
      const profile = profiles.get(row.exerciseId);
      if (!profile) return;
      const tags = profile.topTags.map(([tag]) => tag);
      if (tags.includes("pain_risk")) {
        reminders.push(recommendationItem("training", "high", `${profile.exerciseName} 先按低风险版本做`, "这个动作长期有疼痛风险记录，今天先保幅度和稳定性，不要冲重量。", [`历史风险 ${profile.painCount} 次`, `最近标签 ${profile.topTags.map(([tag]) => tag).join(" / ")}`], ["训练前提醒", profile.exerciseName]));
      }
      if (tags.includes("grip_limiting")) {
        reminders.push(recommendationItem("training", "medium", `${profile.exerciseName} 先解决握力限制`, "如果今天继续做这个动作，先考虑助力带或更稳定版本，避免小臂先掉链子。", [`反馈次数 ${profile.count}`, "历史上反复出现 grip_limiting"], ["训练前提醒", "握力限制"]));
      }
      if (tags.includes("reduced_rom_late") || tags.includes("technique_breakdown")) {
        reminders.push(recommendationItem("training", "medium", `${profile.exerciseName} 先保动作质量`, "今天这类动作先用完整幅度和可控离心做标准，不要一开始就冲负荷。", [`动作质量差 ${profile.poorQualityCount} 次`], ["训练前提醒", "动作质量"]));
      }
    });

    integrated.filter((item) => item.priority === "high").slice(0, 2).forEach((item) => {
      reminders.push(recommendationItem("training", item.priority, item.title, item.detail, item.evidence, ["训练前提醒", ...(item.tags || [])]));
    });

    return dedupeReminderItems(sortRecommendationItems(reminders));
  }



function buildLinkedTodayInsights({ goal, metrics, sessions, exerciseLogs, nutritionLogs }) {
    return buildIntegratedSignals({ goal, metrics, sessions, exerciseLogs, nutritionLogs }).map((item) => item.detail);
  }



function dedupeReminderItems(items) {
    const seen = new Set();
    return (items || []).filter((item) => {
      const key = `${item.title}|${item.detail}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }



function withinDays(items, days) {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - days);
    return (items || []).filter((item) => {
      const stamp = item?.date ? new Date(item.date) : null;
      return stamp && !Number.isNaN(stamp.getTime()) && stamp >= cutoff;
    });
  }



function round1(value) {
    return Math.round(Number(value || 0) * 10) / 10;
  }



function signed(value, unit) {
    if (!Number.isFinite(value)) return "-";
    return `${value > 0 ? "+" : ""}${value}${unit}`;
  }



function averageOf(items, key) {
    const values = (items || []).map((item) => Number(item?.[key])).filter((value) => Number.isFinite(value));
    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }



function sortedSessions(sessions) {
    return (sessions || []).slice().sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
  }



function filterCompletedSessions(sessions) {
    return (sessions || []).filter((session) => !session.status || session.status === "completed");
  }



function compareSessionWindows(sessions, daysPerWindow) {
    const sorted = sortedSessions(sessions);
    if (!sorted.length) {
      return {
        recentAvgCompletion: 0,
        previousAvgCompletion: 0,
        recentAvgRpe: 0,
        previousAvgRpe: 0,
        recentAvgFatigue: 0,
        previousAvgFatigue: 0,
        hasDecline: false
      };
    }
    const latestSortedSession = sorted[sorted.length - 1];
    const latest = new Date(latestSortedSession.date);
    const recentCutoff = new Date(latest);
    recentCutoff.setDate(recentCutoff.getDate() - daysPerWindow);
    const previousCutoff = new Date(recentCutoff);
    previousCutoff.setDate(previousCutoff.getDate() - daysPerWindow);
    const recent = sorted.filter((item) => {
      const date = new Date(item.date);
      return date > recentCutoff && date <= latest;
    });
    const previous = sorted.filter((item) => {
      const date = new Date(item.date);
      return date > previousCutoff && date <= recentCutoff;
    });
    const recentAvgCompletion = averageOf(recent, "completion");
    const previousAvgCompletion = averageOf(previous, "completion");
    const recentAvgRpe = averageOf(recent, "rpe");
    const previousAvgRpe = averageOf(previous, "rpe");
    const recentAvgFatigue = averageOf(recent, "fatigue");
    const previousAvgFatigue = averageOf(previous, "fatigue");
    const hasDecline = previous.length >= 1 && recent.length >= 1
      && recentAvgCompletion <= previousAvgCompletion - 8
      && recentAvgRpe >= previousAvgRpe + 0.6;
    return {
      recentAvgCompletion: round1(recentAvgCompletion),
      previousAvgCompletion: round1(previousAvgCompletion),
      recentAvgRpe: round1(recentAvgRpe),
      previousAvgRpe: round1(previousAvgRpe),
      recentAvgFatigue: round1(recentAvgFatigue),
      previousAvgFatigue: round1(previousAvgFatigue),
      hasDecline
    };
  }



  window.FitnessCore = window.FitnessCore || {};
  window.FitnessCore.IntegratedSignals = {
    buildIntegratedSignals,
    buildTrainingReminders,
    buildLinkedTodayInsights
  };
})();
