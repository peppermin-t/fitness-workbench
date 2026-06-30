// @ts-nocheck
(function () {
  "use strict";

function parseGoal(text) {
    const source = (text || "").trim();
    const lower = source.toLowerCase();
    const parsed = {
      rawText: source,
      primaryGoal: "general_fitness",
      primaryGoalLabel: "综合体能",
      secondaryGoal: null,
      secondaryGoalLabel: null,
      targetWeight: null,
      trainingDaysPerWeek: null,
      sessionDurationMinutes: null,
      frequentTravel: /出差|旅行|酒店|差旅|travel/.test(lower),
      conveniencePriority: /方便|便利|简单|少录入|省事|快捷/.test(lower),
      constraints: [],
      notes: []
    };

    if (/减脂|减肥|瘦|掉体重|降体脂|fat loss|lose weight/.test(lower)) {
      parsed.primaryGoal = "fat_loss";
      parsed.primaryGoalLabel = "减脂";
    } else if (/增肌|长肌肉|肌肥大|muscle|hypertrophy/.test(lower)) {
      parsed.primaryGoal = "muscle_gain";
      parsed.primaryGoalLabel = "增肌";
    } else if (/力量|变强|深蹲|卧推|硬拉|strength/.test(lower)) {
      parsed.primaryGoal = "strength";
      parsed.primaryGoalLabel = "力量提升";
    } else if (/维持|保持|健康|maintenance/.test(lower)) {
      parsed.primaryGoal = "maintenance";
      parsed.primaryGoalLabel = "维持健康";
    }

    if (/保持力量|不掉力量|维持力量/.test(lower)) {
      parsed.secondaryGoal = "strength_maintenance";
      parsed.secondaryGoalLabel = "保持力量";
    } else if (/体态|姿态|圆肩|久坐/.test(lower)) {
      parsed.secondaryGoal = "posture";
      parsed.secondaryGoalLabel = "体态改善";
    } else if (/心肺|有氧|耐力/.test(lower)) {
      parsed.secondaryGoal = "conditioning";
      parsed.secondaryGoalLabel = "心肺提升";
    }

    const targetMatch = source.match(/(?:到|减到|降到|目标|target)\s*(\d{2,3}(?:\.\d+)?)\s*(?:kg|公斤)?/i);
    if (targetMatch) parsed.targetWeight = Number(targetMatch[1]);

    const dayMatch = source.match(/(?:每周|一周|周)\D{0,8}(\d)\D{0,8}(?:次|练|天)/);
    if (dayMatch) parsed.trainingDaysPerWeek = clamp(Number(dayMatch[1]), 1, 6);

    const durationMatch = source.match(/(\d{2,3})\s*(?:分钟|min|mins|minute)/i);
    if (durationMatch) parsed.sessionDurationMinutes = clamp(Number(durationMatch[1]), 20, 120);

    if (parsed.frequentTravel) parsed.constraints.push("frequent_travel");
    if (parsed.conveniencePriority) parsed.constraints.push("convenience_first");
    if (/膝|腰|肩|痛|伤|不适/.test(lower)) parsed.constraints.push("pain_or_injury_note");
    if (!parsed.trainingDaysPerWeek) parsed.trainingDaysPerWeek = parsed.frequentTravel ? 3 : 4;
    if (!parsed.sessionDurationMinutes) parsed.sessionDurationMinutes = parsed.frequentTravel ? 45 : 60;
    if (!source) parsed.notes.push("目标描述为空，按综合体能默认处理。");
    return parsed;
  }



function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
  }



  window.FitnessCore = window.FitnessCore || {};
  window.FitnessCore.GoalParser = {
    parseGoal
  };
})();
