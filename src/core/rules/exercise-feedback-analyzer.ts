// @ts-nocheck
(function () {
  "use strict";

  const {
    recommendationItem,
    sortRecommendationItems,
    highestPriority,
    priorityLabel,
    uniqueStrings
  } = window.FitnessCore.AdviceEngine;

function analyzeExerciseFeedback(input, exercise) {
    const text = `${input.freeText || ""} ${input.painArea || ""}`.toLowerCase();
    const tags = [];
    const recommendationItems = [];
    const addTag = (tag, evidence) => {
      if (!tags.some((item) => item.tag === tag)) tags.push({ tag, evidence });
    };
    const addRule = (type, priority, title, detail, evidence, extraTags = []) => {
      recommendationItems.push(recommendationItem(type, priority, title, detail, evidence, extraTags));
    };
    const pattern = String(exercise?.pattern || "");
    const muscles = exercise?.muscles || [];
    const isBackPull = /拉|背/.test(pattern) || muscles.some((item) => /背|斜方|背阔/.test(String(item)));
    const evidenceBase = [];
    if (input.rangeOfMotion) evidenceBase.push(`动作幅度：${input.rangeOfMotion}`);
    if (input.sideIssue && input.sideIssue !== "none") evidenceBase.push(`左右差异：${input.sideIssue}`);
    if (input.targetMuscleFeel) evidenceBase.push(`目标肌肉感觉：${input.targetMuscleFeel}`);
    if (input.limitingFactor && input.limitingFactor !== "unknown") evidenceBase.push(`限制因素：${input.limitingFactor}`);
    if (Number(input.rpe)) evidenceBase.push(`RPE ${input.rpe}/10`);
    if (Number(input.painScore) >= 0) evidenceBase.push(`疼痛 ${input.painScore}/5`);
    if (input.freeText) evidenceBase.push(`原始反馈：${input.freeText}`);

    if (input.rangeOfMotion === "reduced_late" || /半程|做不满|幅度.*小|后程/.test(text)) {
      addTag("reduced_rom_late", "出现半程或后程幅度下降");
      addRule("technique", Number(input.rpe) >= 8.5 ? "high" : "medium", "先恢复完整幅度", "下次该动作不加重，优先恢复完整幅度；如果 RPE 偏高，可降重 5%-10%。", ["出现半程或后程幅度下降", `RPE ${input.rpe || "-"}/10`], ["动作幅度", "不加重"]);
    }
    if (input.rangeOfMotion === "partial") {
      addTag("partial_reps", "动作幅度整体不足");
      addRule("technique", "high", "整体幅度不足，先降重重建", "先降低重量，保证每次重复都在可控幅度内完成。", ["动作幅度：全程半程"], ["技术重建"]);
    }
    if (input.sideIssue === "left_weaker" || /左侧|左边|左手/.test(text)) {
      addTag("left_weaker", "左侧弱或左侧动作质量下降");
      addRule("stimulus", "medium", "按弱侧决定训练标准", "单侧动作从左侧开始，以左侧高质量完成次数决定右侧次数；必要时给左侧补 1 组轻重量技术组。", ["左侧弱或左侧动作质量下降"], ["左右差异", "弱侧优先"]);
    }
    if (input.sideIssue === "right_weaker" || /右侧|右边|右手/.test(text)) {
      addTag("right_weaker", "右侧弱或右侧动作质量下降");
      addRule("stimulus", "medium", "按弱侧决定训练标准", "单侧动作从右侧开始，以右侧高质量完成次数决定左侧次数；必要时给右侧补 1 组轻重量技术组。", ["右侧弱或右侧动作质量下降"], ["左右差异", "弱侧优先"]);
    }
    if (input.limitingFactor === "grip" || /小臂|握不住|手先|前臂|抓不住/.test(text)) {
      addTag("grip_limiting", "小臂或握力成为限制因素");
      addRule("stimulus", isBackPull ? "high" : "medium", "先解除非目标限制因素", isBackPull ? "这是背部动作时，主动作可使用助力带，避免握力限制背部刺激；优先考虑胸托划船、坐姿划船等更稳定版本。" : "如果握力先掉链子，先不要盲目加目标肌群训练量，可补充农夫走、静态悬垂或更稳定器械版本。", ["小臂或握力成为限制因素"], ["握力限制", "替代动作"]);
    }
    if (input.targetMuscleFeel === "weak" || input.targetMuscleFeel === "none" || /没感觉|没有感觉|发力.*差|背没|胸没|臀没/.test(text)) {
      addTag("poor_target_muscle_feel", "目标肌肉感觉弱");
      addRule("stimulus", "medium", "先把目标肌肉感觉拉出来", "下次先降低重量或增加顶峰停顿，训练前做 1-2 组轻重量激活动作；如果连续两次都没感觉，优先换更稳定的动作版本。", ["目标肌肉感觉弱"], ["募集不足", "激活"]);
    }
    if (input.quality === "poor" || /借力|晃|不稳|代偿|控制不住/.test(text)) {
      addTag("technique_breakdown", "动作质量下降或出现代偿");
      addRule("technique", "high", "技术先于负荷", "先保持或降低重量，控制离心，减少借力；连续两次出现时建议换更稳定动作。", ["动作质量下降或出现代偿"], ["动作质量", "技术优先"]);
    }
    if (Number(input.painScore) >= 3 || /疼|痛|不舒服|不适/.test(text)) {
      addTag("pain_risk", "疼痛或不适反馈");
      addRule("safety", "high", "疼痛优先处理", "疼痛评分较高时不建议加重；优先降量、缩小风险动作范围或替换动作。", [`疼痛 ${input.painScore}/5`, input.painArea ? `部位：${input.painArea}` : "未填写具体疼痛部位"], ["疼痛风险", "不加重"]);
    }
    if (!tags.length && Number(input.rpe) <= 7 && input.quality === "good" && Number(input.painScore) <= 1) {
      addTag("progression_ready", "完成质量好且疼痛低");
      addRule("progression", "low", "具备小幅进阶条件", "如果下次状态相近，可以小幅加重 2.5%-5% 或增加 1-2 次。", [`RPE ${input.rpe}/10`, "动作质量好", `疼痛 ${input.painScore}/5`], ["渐进超负荷"]);
    }
    const sortedItems = sortRecommendationItems(recommendationItems);
    const recommendations = sortedItems.map((item) => item.detail);
    if (!recommendations.length) {
      sortedItems.push(recommendationItem("info", "low", "当前不需要额外调整", "本次动作反馈未触发明显调整，继续观察完成度、RPE 和动作质量。", evidenceBase, ["稳定观察"]));
      recommendations.push("本次动作反馈未触发明显调整，继续观察完成度、RPE 和动作质量。");
    }

    return {
      exerciseId: input.exerciseId,
      exerciseName: exercise?.name || input.exerciseId,
      tags,
      priority: highestPriority(sortedItems),
      priorityLabel: priorityLabel(highestPriority(sortedItems)),
      evidence: uniqueStrings([
        ...evidenceBase,
        ...tags.map((item) => `${item.tag}：${item.evidence}`)
      ]).slice(0, 8),
      recommendationItems: sortedItems,
      recommendations,
      summary: buildExerciseSummary(tags, recommendations)
    };
  }



function buildExerciseSummary(tags, recommendations) {
    const tagText = tags.map((item) => item.tag).join(", ") || "none";
    return `识别标签：${tagText}。建议：${recommendations.join(" ")}`;
  }



function buildExerciseProfiles(logs) {
    const groups = new Map();
    (logs || []).forEach((log) => {
      const key = log.exerciseId || log.exerciseName;
      if (!groups.has(key)) {
        groups.set(key, {
          exerciseId: log.exerciseId,
          exerciseName: log.exerciseName,
          count: 0,
          poorQualityCount: 0,
          painCount: 0,
          tagCounts: {},
          latestAt: log.createdAt || log.date || ""
        });
      }
      const profile = groups.get(key);
      profile.count += 1;
      if (log.quality === "poor") profile.poorQualityCount += 1;
      if (Number(log.painScore) >= 3) profile.painCount += 1;
      if ((log.createdAt || log.date || "") > profile.latestAt) profile.latestAt = log.createdAt || log.date || "";
      (log.analysis?.tags || []).forEach((item) => {
        profile.tagCounts[item.tag] = (profile.tagCounts[item.tag] || 0) + 1;
      });
    });

    return Array.from(groups.values()).map((profile) => {
      const topTags = Object.entries(profile.tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
      const priority = computeExercisePriority(topTags, profile);
      const advice = inferExerciseProfileAdvice(topTags, profile);
      return {
        exerciseId: profile.exerciseId,
        exerciseName: profile.exerciseName,
        count: profile.count,
        poorQualityCount: profile.poorQualityCount,
        painCount: profile.painCount,
        latestAt: profile.latestAt,
        topTags,
        priority,
        advice
      };
    }).sort((a, b) => b.priority - a.priority || b.count - a.count);
  }



function computeExercisePriority(topTags, profile) {
    let score = profile.count;
    if (profile.painCount) score += profile.painCount * 4;
    if (profile.poorQualityCount) score += profile.poorQualityCount * 2;
    topTags.forEach(([tag, count]) => {
      if (tag === "pain_risk") score += count * 4;
      if (tag === "grip_limiting" || tag === "poor_target_muscle_feel") score += count * 2;
      if (tag === "reduced_rom_late" || tag === "technique_breakdown") score += count * 2;
      if (tag === "left_weaker" || tag === "right_weaker") score += count * 2;
    });
    return score;
  }



function inferExerciseProfileAdvice(topTags, profile) {
    const tags = topTags.map(([tag]) => tag);
    const notes = [];
    if (tags.includes("pain_risk")) notes.push("该动作多次出现疼痛或不适，优先降强度或替换成更稳的版本。");
    if (tags.includes("reduced_rom_late")) notes.push("该动作后程容易半程，下次先恢复完整幅度，再考虑加重。");
    if (tags.includes("left_weaker") || tags.includes("right_weaker")) notes.push("该动作存在左右差异，单侧训练时以弱侧高质量完成度作为标准。");
    if (tags.includes("grip_limiting")) notes.push("该动作常被握力限制，背部训练可优先考虑助力带或更稳定器械。");
    if (tags.includes("poor_target_muscle_feel")) notes.push("该动作目标肌肉感觉偏弱，建议加入激活动作或顶峰停顿。");
    if (tags.includes("technique_breakdown")) notes.push("该动作历史上代偿较多，先稳住技术，再继续堆量。");
    if (!notes.length && profile.count >= 2) notes.push("该动作近期整体稳定，继续观察是否满足渐进超负荷条件。");
    return notes;
  }



  window.FitnessCore = window.FitnessCore || {};
  window.FitnessCore.ExerciseFeedbackAnalyzer = {
    analyzeExerciseFeedback,
    buildExerciseProfiles,
    computeExercisePriority,
    inferExerciseProfileAdvice
  };
})();
