(function () {
    "use strict";
    const { uniqueStrings, revision } = window.FitnessCore.AdviceEngine;
    const { sortedMetrics, metricTrend } = window.FitnessCore.MetricAnalyzer;
    const { buildExerciseProfiles } = window.FitnessCore.ExerciseFeedbackAnalyzer;
    const { buildNutritionProfile } = window.FitnessCore.NutritionParser;
    const { buildIntegratedSignals } = window.FitnessCore.IntegratedSignals;
    function buildWeeklyReview({ goal, metrics, sessions, exerciseLogs, nutritionLogs, plan }) {
        const completedSessions = filterCompletedSessions(sessions || []);
        const recentSessions = withinDays(completedSessions, 7);
        const recentExerciseLogs = withinDays(exerciseLogs || [], 7);
        const recentNutritionLogs = withinDays(nutritionLogs || [], 7);
        const nutritionProfile = buildNutritionProfile(recentNutritionLogs, goal);
        const exerciseProfiles = buildExerciseProfiles(recentExerciseLogs);
        const integratedSignals = buildIntegratedSignals({ goal, metrics, sessions: completedSessions, exerciseLogs, nutritionLogs });
        const latestMetric = sortedMetrics(metrics || []).at(-1);
        const weightTrend30 = metricTrend(metrics || [], "weight", 30);
        const completionAvg = averageOf(recentSessions, "completion");
        const rpeAvg = averageOf(recentSessions, "rpe");
        const fatigueAvg = averageOf(recentSessions, "fatigue");
        const painSessions = recentSessions.filter((item) => Number(item.painScore) >= 3);
        const lowCompletionSessions = recentSessions.filter((item) => Number(item.completion) < 70);
        const stableSessions = recentSessions.filter((item) => Number(item.completion) >= 90 && Number(item.rpe) <= 8 && Number(item.painScore) <= 1);
        const highlights = [];
        const nextActions = [];
        const candidates = [];
        const primary = goal?.parsed?.primaryGoal || "general_fitness";
        if (!recentSessions.length) {
            highlights.push("最近 7 天还没有训练记录，周复盘会在你开始持续记录后变得更有参考价值。");
        }
        else {
            highlights.push(`最近 7 天记录了 ${recentSessions.length} 次训练，平均完成度 ${round1(completionAvg)}%，平均 RPE ${round1(rpeAvg)}。`);
            if (fatigueAvg >= 4)
                highlights.push(`最近训练疲劳均值 ${round1(fatigueAvg)}/5，当前恢复压力偏高。`);
            if (painSessions.length)
                highlights.push(`最近 7 天有 ${painSessions.length} 次训练出现较高疼痛反馈，下一周优先保动作质量和恢复。`);
            if (lowCompletionSessions.length)
                highlights.push(`最近 7 天有 ${lowCompletionSessions.length} 次训练完成度低于 70%，当前计划可能对时间、状态或场地不够友好。`);
            if (stableSessions.length >= 2)
                highlights.push("最近至少有 2 次训练完成度高、疼痛低，部分主动作具备小幅进阶条件。");
        }
        if (nutritionProfile.count) {
            highlights.push(`最近 7 天记录了 ${nutritionProfile.count} 天饮食，平均蛋白 ${round1(nutritionProfile.averages.protein)}g，漏正餐 ${nutritionProfile.missedMealDays} 天。`);
            if (nutritionProfile.lowProteinDays >= 2)
                nextActions.push("先把白天蛋白补齐，再谈加训练量。午餐和加餐优先补高蛋白。");
            if (nutritionProfile.missedMealDays >= 2)
                nextActions.push("最近漏正餐偏多，先建立出差保底简餐模板，避免用零食顶正餐。");
        }
        else {
            nextActions.push("最近 7 天没有饮食记录，联动判断会偏弱。至少补 3 天饮食记录，再看是否需要改计划。");
        }
        if (latestMetric) {
            highlights.push(`最近一次身体指标：体重 ${fmtNum(latestMetric.weight, "kg")}，体脂 ${fmtNum(latestMetric.bodyFat, "%")}，骨骼肌 ${fmtNum(latestMetric.skeletalMuscle, "kg")}。`);
        }
        if (weightTrend30) {
            highlights.push(`近 30 天体重变化 ${signed(round1(weightTrend30.delta), "kg")}。`);
        }
        if (exerciseProfiles.some((profile) => profile.topTags.some(([tag]) => tag === "pain_risk"))) {
            nextActions.push("动作级反馈里已有疼痛风险标签，本周先处理风险动作，不继续追求加重。");
        }
        if (exerciseProfiles.some((profile) => profile.topTags.some(([tag]) => tag === "grip_limiting"))) {
            nextActions.push("近期有动作反复被握力限制，背部主练日优先用更稳定的动作版本或助力带。");
        }
        if (painSessions.length) {
            const targetSession = painSessions.sort((a, b) => Number(b.painScore || 0) - Number(a.painScore || 0))[0];
            const targetDay = plan?.days?.[targetSession.dayIndex];
            if (targetDay) {
                candidates.push({
                    key: `reduce_day_volume_${targetSession.dayIndex}`,
                    summary: `下周降低 ${targetDay.focus} 的训练量`,
                    reason: `最近 7 天里 ${targetDay.focus} 有较高疼痛反馈，建议先减少组数约 30%，观察恢复和动作质量。`,
                    tags: ["周复盘", "疼痛反馈", "降量"],
                    patch: { type: "reduce_day_volume", dayIndex: targetSession.dayIndex, factor: 0.7 }
                });
            }
        }
        if (lowCompletionSessions.length) {
            const targetSession = lowCompletionSessions.sort((a, b) => Number(a.completion || 0) - Number(b.completion || 0))[0];
            const targetDay = plan?.days?.[targetSession.dayIndex];
            if (targetDay) {
                candidates.push({
                    key: `trim_accessory_${targetSession.dayIndex}`,
                    summary: `下周简化 ${targetDay.focus} 的安排`,
                    reason: `最近 7 天里 ${targetDay.focus} 完成度最低，建议减少 1-2 个辅助动作，先保证主动作完成质量。`,
                    tags: ["周复盘", "完成度低", "便利化"],
                    patch: { type: "trim_accessory", dayIndex: targetSession.dayIndex }
                });
            }
        }
        if (stableSessions.length >= 2) {
            const targetSession = stableSessions[0];
            const targetDay = plan?.days?.[targetSession.dayIndex];
            if (targetDay) {
                candidates.push({
                    key: `add_progression_note_${targetSession.dayIndex}`,
                    summary: `${targetDay.focus} 下周可尝试小幅进阶`,
                    reason: `最近 7 天内该训练日完成度高、RPE 可控且疼痛低，符合渐进超负荷的基础条件。`,
                    tags: ["周复盘", "渐进超负荷", "加重"],
                    patch: { type: "add_progression_note", dayIndex: targetSession.dayIndex }
                });
            }
        }
        if (primary === "fat_loss" && weightTrend30?.delta > 0.3 && recentSessions.length >= 2 && rpeAvg <= 8.5) {
            const conditioningIndex = findConditioningDayIndex(plan);
            if (conditioningIndex >= 0) {
                const conditioningDay = plan.days[conditioningIndex];
                candidates.push({
                    key: `increase_cardio_time_${conditioningIndex}`,
                    summary: `下周增加 ${conditioningDay.focus} 的有氧时长`,
                    reason: "减脂目标下近 30 天体重没有向目标方向走，且当前训练压力可控，可以先小幅增加 10 分钟有氧。",
                    tags: ["周复盘", "减脂", "有氧"],
                    patch: { type: "increase_cardio_time", dayIndex: conditioningIndex, minutes: 10 }
                });
            }
        }
        if (primary === "muscle_gain" && nutritionProfile.lowProteinDays >= 2) {
            nextActions.push("增肌目标下，最近蛋白缺口偏多，先提高午餐和加餐的蛋白完成度，再决定是否继续加训练量。");
        }
        if (primary === "fat_loss" && nutritionProfile.missedMealDays >= 2) {
            nextActions.push("减脂目标下不建议靠漏餐制造缺口，先把正餐稳定住，再看体重趋势。");
        }
        if (primary === "strength" && nutritionProfile.missedMealDays >= 1) {
            nextActions.push("力量目标下，先确保训练日前后有稳定碳水和正餐，不然 RPE 和动作质量会先波动。");
        }
        integratedSignals.slice(0, 3).forEach((item) => {
            if (item.priority === "high")
                highlights.push(item.detail);
            else
                nextActions.push(item.detail);
        });
        return {
            periodDays: 7,
            stats: {
                sessionCount: recentSessions.length,
                avgCompletion: round1(completionAvg),
                avgRpe: round1(rpeAvg),
                avgFatigue: round1(fatigueAvg),
                lowProteinDays: nutritionProfile.lowProteinDays || 0,
                missedMealDays: nutritionProfile.missedMealDays || 0,
                weightDelta30: weightTrend30 ? round1(weightTrend30.delta) : null
            },
            highlights: uniqueStrings(highlights),
            nextActions: uniqueStrings(nextActions),
            candidates: dedupeCandidates(candidates)
        };
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
    function filterCompletedSessions(sessions) {
        return (sessions || []).filter((session) => !session.status || session.status === "completed");
    }
    function averageOf(items, key) {
        const values = (items || []).map((item) => Number(item?.[key])).filter((value) => Number.isFinite(value));
        if (!values.length)
            return 0;
        return values.reduce((sum, value) => sum + value, 0) / values.length;
    }
    function fmtNum(value, unit) {
        return Number.isFinite(value) ? `${round1(value)}${unit}` : "-";
    }
    function signed(value, unit) {
        if (!Number.isFinite(value))
            return "-";
        return `${value > 0 ? "+" : ""}${value}${unit}`;
    }
    function findConditioningDayIndex(plan) {
        if (!plan?.days?.length)
            return -1;
        const direct = plan.days.findIndex((day) => day.type === "conditioning" || /有氧|恢复/.test(String(day.focus || "")));
        if (direct >= 0)
            return direct;
        return plan.days.findIndex((day) => day.exercises.some((row) => /分钟/.test(String(row.reps || ""))));
    }
    function dedupeCandidates(candidates) {
        const seen = new Set();
        return (candidates || []).filter((candidate) => {
            if (!candidate?.key || seen.has(candidate.key))
                return false;
            seen.add(candidate.key);
            return true;
        });
    }
    function round1(value) {
        return Math.round(Number(value || 0) * 10) / 10;
    }
    window.FitnessCore = window.FitnessCore || {};
    window.FitnessCore.WeeklyReview = {
        buildWeeklyReview,
        revision
    };
})();
