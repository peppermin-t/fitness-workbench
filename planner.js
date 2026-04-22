window.FitnessPlanner = (() => {
  "use strict";

  const FOOD_LIBRARY = [
    food("egg_white", "鸡蛋蛋白", ["鸡蛋蛋白", "蛋白"], "个", { calories: 17, protein: 3.6, carbs: 0.2, fat: 0, fiber: 0 }, ["high_protein"]),
    food("whole_egg", "鸡蛋", ["全蛋", "鸡蛋"], "个", { calories: 70, protein: 6, carbs: 0.6, fat: 5, fiber: 0 }, ["protein_present"]),
    food("sweet_potato", "地瓜", ["地瓜", "红薯", "紫薯"], "个", { calories: 130, protein: 2, carbs: 30, fat: 0.2, fiber: 4 }, ["carb_present", "fiber_present"]),
    food("soy_milk", "豆浆", ["豆浆"], "碗", { calories: 110, protein: 7, carbs: 9, fat: 4, fiber: 1 }, ["protein_present"]),
    food("fried_noodles", "炒面", ["炒面", "炒粉", "炒河粉"], "份", { calories: 420, protein: 12, carbs: 55, fat: 16, fiber: 2 }, ["carb_present", "high_fat_possible", "portion_uncertain"]),
    food("wafer", "威化", ["威化", "威化饼", "威化饼干"], "个", { calories: 35, protein: 0.4, carbs: 4.5, fat: 1.8, fiber: 0.1 }, ["processed_snack", "high_sugar_possible"]),
    food("beef_hotpot", "牛肉火锅", ["牛肉火锅"], "份", { calories: 680, protein: 42, carbs: 22, fat: 40, fiber: 3 }, ["high_protein", "high_fat_possible", "high_sodium_possible", "portion_uncertain"]),
    food("hotpot", "火锅", ["火锅"], "份", { calories: 620, protein: 28, carbs: 24, fat: 38, fiber: 3 }, ["high_fat_possible", "high_sodium_possible", "portion_uncertain"]),
    food("beef", "牛肉", ["牛肉", "肥牛"], "份", { calories: 220, protein: 26, carbs: 0, fat: 13, fiber: 0 }, ["high_protein"]),
    food("chicken_breast", "鸡胸肉", ["鸡胸", "鸡胸肉"], "份", { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 }, ["high_protein"]),
    food("fish", "鱼", ["鱼", "三文鱼", "鳕鱼"], "份", { calories: 180, protein: 25, carbs: 0, fat: 8, fiber: 0 }, ["high_protein"]),
    food("shrimp", "虾", ["虾", "虾仁"], "份", { calories: 120, protein: 24, carbs: 1, fat: 1.5, fiber: 0 }, ["high_protein"]),
    food("tofu", "豆腐", ["豆腐"], "份", { calories: 90, protein: 10, carbs: 3, fat: 5, fiber: 1 }, ["protein_present"]),
    food("yogurt", "酸奶", ["酸奶", "希腊酸奶", "无糖酸奶"], "杯", { calories: 120, protein: 12, carbs: 12, fat: 2, fiber: 0 }, ["protein_present"]),
    food("protein_powder", "蛋白粉", ["蛋白粉"], "勺", { calories: 120, protein: 24, carbs: 3, fat: 1.5, fiber: 0 }, ["high_protein"]),
    food("rice", "米饭", ["米饭", "白米饭"], "碗", { calories: 230, protein: 4, carbs: 50, fat: 0.4, fiber: 0.6 }, ["carb_present"]),
    food("noodles", "面", ["面条", "拌面", "面"], "碗", { calories: 260, protein: 8, carbs: 50, fat: 2, fiber: 2 }, ["carb_present"]),
    food("bread", "面包", ["面包", "吐司"], "片", { calories: 80, protein: 3, carbs: 15, fat: 1, fiber: 1 }, ["carb_present"]),
    food("oats", "燕麦", ["燕麦", "燕麦片"], "碗", { calories: 190, protein: 7, carbs: 32, fat: 4, fiber: 5 }, ["carb_present", "fiber_present"]),
    food("banana", "香蕉", ["香蕉"], "根", { calories: 100, protein: 1.2, carbs: 25, fat: 0.3, fiber: 3 }, ["fruit_present", "carb_present", "fiber_present"]),
    food("apple", "苹果", ["苹果"], "个", { calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4 }, ["fruit_present", "fiber_present"]),
    food("vegetables", "蔬菜", ["青菜", "蔬菜", "西兰花", "生菜", "沙拉", "菠菜"], "份", { calories: 50, protein: 3, carbs: 9, fat: 0.5, fiber: 4 }, ["vegetable_present", "fiber_present"]),
    food("milk_tea", "奶茶", ["奶茶"], "杯", { calories: 280, protein: 3, carbs: 45, fat: 8, fiber: 0 }, ["processed_snack", "high_sugar_possible"]),
    food("cookies", "饼干", ["饼干", "曲奇"], "份", { calories: 180, protein: 2, carbs: 22, fat: 9, fiber: 1 }, ["processed_snack", "high_sugar_possible"]),
    food("cake", "蛋糕", ["蛋糕"], "份", { calories: 260, protein: 4, carbs: 30, fat: 13, fiber: 1 }, ["processed_snack", "high_sugar_possible"]),
    food("nuts", "坚果", ["坚果", "混合坚果"], "份", { calories: 170, protein: 6, carbs: 6, fat: 15, fiber: 3 }, ["high_fat_possible"]),
    food("coffee", "咖啡", ["咖啡", "美式"], "杯", { calories: 10, protein: 0, carbs: 1, fat: 0, fiber: 0 }, []),
    food("juice", "果汁", ["果汁"], "杯", { calories: 120, protein: 1, carbs: 28, fat: 0, fiber: 0 }, ["high_sugar_possible"]),
    food("protein_bar", "蛋白棒", ["蛋白棒"], "个", { calories: 200, protein: 18, carbs: 20, fat: 7, fiber: 6 }, ["protein_present"])
  ];

  const FOOD_ALIASES = FOOD_LIBRARY
    .flatMap((item) => item.aliases.map((alias) => ({ item, alias })))
    .sort((a, b) => b.alias.length - a.alias.length);

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

  function generatePlan({ gym, goal, metrics, exercises, nowLabel, uid }) {
    const parsed = goal?.parsed || parseGoal("");
    const daysCount = clamp(parsed.trainingDaysPerWeek || 3, 1, 6);
    const config = planConfig(parsed);
    const days = planDayTypes(daysCount, parsed.primaryGoal).map((type) => buildPlanDay(type, config, gym, parsed, exercises));
    const context = buildPlanContext(gym, goal, parsed, metrics);
    return {
      id: uid("plan"),
      generatedAt: nowLabel(),
      context,
      days
    };
  }

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

  function parseNutritionLog(rawText, goal, latestMetric) {
    const text = (rawText || "").trim();
    const meals = splitMeals(text);
    const allTags = new Set();
    const totals = emptyNutritionTotals();
    const missingInfo = [];
    const mealResults = meals.map((meal) => {
      const items = extractFoodItems(meal.text);
      const mealTotals = emptyNutritionTotals();
      const mealTags = new Set();
      items.forEach((item) => {
        addNutritionTotals(mealTotals, item.estimate);
        item.tags.forEach((tag) => mealTags.add(tag));
        if (item.uncertain) mealTags.add("portion_uncertain");
      });
      nutritionTagsFor(meal.text, items, mealTotals, meal.meal).forEach((tag) => mealTags.add(tag));
      mealTags.forEach((tag) => allTags.add(tag));
      addNutritionTotals(totals, mealTotals);
      if (mealTags.has("portion_uncertain")) missingInfo.push(mealMissingPrompt(meal.meal, items));
      return {
        meal: meal.meal,
        text: meal.text,
        items,
        tags: Array.from(mealTags),
        estimates: roundNutritionTotals(mealTotals)
      };
    });

    const target = nutritionTargets(goal?.parsed, latestMetric);
    const mealDistribution = summarizeMealDistribution(mealResults);
    const dayStatus = evaluateNutritionDay({ totals, tags: Array.from(allTags), goal: goal?.parsed, target, mealDistribution });
    dayStatus.tags.forEach((tag) => allTags.add(tag));
    const confidence = nutritionConfidence(text, mealResults);
    const recommendationItems = buildNutritionRecommendationItems({
      tags: Array.from(allTags),
      goal: goal?.parsed,
      totals,
      target,
      mealDistribution,
      confidence,
      dayStatus
    });
    const recommendations = recommendationItems.map((item) => item.detail);
    const evidence = buildNutritionEvidence({
      tags: Array.from(allTags),
      totals,
      target,
      confidence,
      mealResults
    });

    return {
      rawText: text,
      meals: mealResults,
      items: mealResults.flatMap((meal) => meal.items),
      tags: Array.from(allTags),
      estimates: {
        total: roundNutritionTotals(totals),
        target,
        dayStatus
      },
      priority: highestPriority(recommendationItems),
      priorityLabel: priorityLabel(highestPriority(recommendationItems)),
      evidence,
      recommendationItems,
      recommendations,
      confidence,
      missingInfo: uniqueStrings(missingInfo).filter(Boolean)
    };
  }

  function buildExerciseSummary(tags, recommendations) {
    const tagText = tags.map((item) => item.tag).join(", ") || "none";
    return `识别标签：${tagText}。建议：${recommendations.join(" ")}`;
  }

  function splitMeals(text) {
    if (!text) return [];
    const markers = [
      ["breakfast", /早上|早餐|早饭/],
      ["lunch", /中午|午餐|午饭/],
      ["dinner", /晚上|晚餐|晚饭/],
      ["snack", /加餐|零食|下午/]
    ];
    const pieces = [];
    let currentMeal = "all_day";
    let buffer = "";
    for (const part of text.split(/[，。；;]/).map((x) => x.trim()).filter(Boolean)) {
      const found = markers.find(([, regex]) => regex.test(part));
      if (found) {
        if (buffer) pieces.push({ meal: currentMeal, text: buffer });
        currentMeal = found[0];
        buffer = part;
      } else {
        buffer = buffer ? `${buffer}，${part}` : part;
      }
    }
    if (buffer) pieces.push({ meal: currentMeal, text: buffer });
    return pieces.length ? pieces : [{ meal: "all_day", text }];
  }

  function extractFoodItems(text) {
    const matches = [];
    const occupied = [];
    for (const { item, alias } of FOOD_ALIASES) {
      const pattern = new RegExp(`((?:\\d+(?:\\.\\d+)?)|半|一|二|两|三|四|五|六|七|八|九|十|一点|一些|少量|少许)?\\s*(个|颗|根|碗|杯|份|袋|盒|勺|片|串|克|g|毫升|ml)?\\s*${escapeRegex(alias)}`, "g");
      let match = pattern.exec(text);
      while (match) {
        const start = match.index;
        const end = pattern.lastIndex;
        const overlap = occupied.some((range) => !(end <= range[0] || start >= range[1]));
        if (!overlap) {
          occupied.push([start, end]);
          const quantityInfo = parseFoodQuantity(match[1], match[2], item.unit);
          const estimate = estimateFoodItem(item, quantityInfo.quantity, quantityInfo.unit);
          matches.push({
            id: item.id,
            label: item.label,
            raw: match[0].trim(),
            quantity: quantityInfo.quantity,
            unit: quantityInfo.unit,
            uncertain: quantityInfo.uncertain || estimate.uncertain,
            tags: uniqueStrings([...item.tags, ...(quantityInfo.uncertain || estimate.uncertain ? ["portion_uncertain"] : [])]),
            estimate: roundNutritionTotals(estimate)
          });
        }
        match = pattern.exec(text);
      }
    }
    return matches.sort((a, b) => text.indexOf(a.raw) - text.indexOf(b.raw));
  }

  function nutritionTagsFor(text, items, totals, mealName) {
    const tags = [];
    const add = (tag) => { if (!tags.includes(tag)) tags.push(tag); };
    if (/没吃|不吃|没饭|没吃饭/.test(text)) add("missed_meal");
    if ((items || []).length === 0) add("unparsed_food");
    if ((items || []).some((item) => item.tags.includes("processed_snack"))) add("processed_snack");
    if ((items || []).some((item) => item.tags.includes("high_fat_possible"))) add("high_fat_possible");
    if ((items || []).some((item) => item.tags.includes("high_sodium_possible"))) add("high_sodium_possible");
    if ((items || []).some((item) => item.tags.includes("high_sugar_possible"))) add("high_sugar_possible");
    if ((items || []).some((item) => item.tags.includes("fruit_present"))) add("fruit_present");
    if ((items || []).some((item) => item.tags.includes("vegetable_present"))) add("vegetable_present");
    if ((items || []).some((item) => item.tags.includes("portion_uncertain")) || /一点|一些|少量|大概|火锅|外卖|随便/.test(text)) add("portion_uncertain");
    if (totals.protein >= 25) add("high_protein");
    else if (mealName !== "snack" && mealName !== "all_day") add("low_protein_possible");
    if (totals.carbs >= 25) add("carb_present");
    if (totals.fiber < 4 && !/(菜|蔬|水果|苹果|香蕉|西兰花|青菜|沙拉)/.test(text)) add("low_fiber_possible");
    if (totals.calories >= 500) add("high_calorie_meal");
    return tags;
  }

  function nutritionTargets(goal, latestMetric) {
    const primary = goal?.primaryGoal || "general_fitness";
    const referenceWeight = latestMetric?.weight || goal?.targetWeight || 70;
    const proteinMultiplier = primary === "muscle_gain" ? 1.9 : primary === "fat_loss" ? 1.7 : primary === "strength" ? 1.8 : 1.5;
    const calorieLower = referenceWeight * (primary === "fat_loss" ? 24 : primary === "muscle_gain" ? 30 : primary === "strength" ? 28 : 26);
    const calorieUpper = referenceWeight * (primary === "fat_loss" ? 30 : primary === "muscle_gain" ? 36 : primary === "strength" ? 34 : 32);
    const carbLower = referenceWeight * (primary === "strength" || primary === "muscle_gain" ? 3 : 2);
    const carbUpper = referenceWeight * (primary === "muscle_gain" ? 5 : primary === "strength" ? 4 : 3.5);
    return {
      protein: Math.round(referenceWeight * proteinMultiplier),
      caloriesLower: Math.round(calorieLower),
      caloriesUpper: Math.round(calorieUpper),
      carbsLower: Math.round(carbLower),
      carbsUpper: Math.round(carbUpper),
      fiber: 25
    };
  }

  function summarizeMealDistribution(meals) {
    const proteinByMeal = {};
    let highestProteinShare = 0;
    let dominantMeal = null;
    const totalProtein = meals.reduce((sum, meal) => sum + Number(meal.estimates?.protein || 0), 0) || 1;
    meals.forEach((meal) => {
      const protein = Number(meal.estimates?.protein || 0);
      proteinByMeal[meal.meal] = protein;
      const share = protein / totalProtein;
      if (share > highestProteinShare) {
        highestProteinShare = share;
        dominantMeal = meal.meal;
      }
    });
    return { proteinByMeal, dominantMeal, highestProteinShare: round1(highestProteinShare) };
  }

  function evaluateNutritionDay({ totals, goal, target, mealDistribution }) {
    const tags = [];
    const primary = goal?.primaryGoal || "general_fitness";
    if (totals.protein < target.protein * 0.7) tags.push("daily_protein_gap");
    if (totals.fiber < target.fiber * 0.7) tags.push("daily_fiber_gap");
    if (totals.calories < target.caloriesLower * 0.75) tags.push("daily_energy_low");
    if (totals.calories > target.caloriesUpper * 1.1) tags.push("daily_energy_high");
    if ((primary === "strength" || primary === "muscle_gain") && totals.carbs < target.carbsLower * 0.75) tags.push("daily_carb_low");
    if (mealDistribution.highestProteinShare >= 0.6) tags.push("protein_distribution_unbalanced");
    const alignment = tags.includes("daily_energy_high") && primary === "fat_loss"
      ? "off_track"
      : tags.includes("daily_energy_low") && primary === "muscle_gain"
        ? "off_track"
        : tags.length >= 3
          ? "needs_adjustment"
          : "acceptable";
    return { tags, alignment };
  }

  function nutritionConfidence(text, meals) {
    let score = 0.78;
    if (/一点|一些|少量|大概|火锅|外卖|随便/.test(text)) score -= 0.2;
    const uncertainItems = meals.flatMap((meal) => meal.items).filter((item) => item.uncertain).length;
    score -= Math.min(0.25, uncertainItems * 0.06);
    if (meals.flatMap((meal) => meal.items).length <= 1) score -= 0.08;
    if (score >= 0.75) return "high";
    if (score >= 0.55) return "medium";
    return "medium_low";
  }

  function buildNutritionRecommendationItems({ tags, goal, totals, target, confidence, dayStatus }) {
    const items = [];
    const primary = goal?.primaryGoal || "general_fitness";
    if (tags.includes("missed_meal") || tags.includes("processed_snack")) {
      items.push(recommendationItem("nutrition", "high", "先修正正餐连续性", "当天存在漏正餐或零食顶替正餐，下一餐优先补一份高蛋白正餐或简餐，先把进食连续性拉稳。", ["出现漏正餐/零食顶替正餐"], ["饮食结构", "正餐优先"]));
    }
    if (tags.includes("daily_protein_gap")) {
      items.push(recommendationItem("nutrition", "high", "蛋白缺口先补齐", `估算蛋白约 ${Math.round(totals.protein)}g，低于当前目标建议值 ${target.protein}g。优先补鸡胸、牛肉、鱼虾、酸奶、豆制品或蛋白粉。`, [`蛋白 ${Math.round(totals.protein)}g`, `目标 ${target.protein}g`], ["蛋白缺口"]));
    }
    if (tags.includes("daily_energy_low") && (primary === "muscle_gain" || primary === "strength")) {
      items.push(recommendationItem("nutrition", "high", "当前热量不够支撑训练", "全天估算热量偏低，当前目标下不够支撑训练和恢复，优先补午餐或训练前后的一份主食加蛋白。", [`热量 ${Math.round(totals.calories)}kcal`, `目标下限 ${target.caloriesLower}kcal`], ["热量不足", primary]));
    }
    if (tags.includes("daily_energy_high") && primary === "fat_loss") {
      items.push(recommendationItem("nutrition", "high", "热量很可能超出减脂需要", "减脂目标下，当前热量估算已经偏高，优先处理外食油脂、蘸料和高糖零食，不要靠后续漏餐硬拉回来。", [`热量 ${Math.round(totals.calories)}kcal`, `目标上限 ${target.caloriesUpper}kcal`], ["减脂", "热量偏高"]));
    }
    if (tags.includes("daily_carb_low")) {
      items.push(recommendationItem("nutrition", "medium", "训练相关碳水偏低", "当前目标更依赖稳定碳水，但当天主食偏少。训练日前后优先补米饭、面、燕麦、土豆或水果。", [`碳水 ${Math.round(totals.carbs)}g`, `建议下限 ${target.carbsLower}g`], ["碳水不足"]));
    }
    if (tags.includes("protein_distribution_unbalanced")) {
      items.push(recommendationItem("nutrition", "medium", "蛋白分布不均", "蛋白过于集中在单一一餐，后续尽量分到 3-4 餐，白天先补一餐而不是把量全堆到晚餐。", ["蛋白分布集中"], ["蛋白分配"]));
    }
    if (tags.includes("daily_fiber_gap") || tags.includes("low_fiber_possible")) {
      items.push(recommendationItem("nutrition", "low", "纤维和蔬果偏少", "蔬菜/水果/纤维偏少，建议至少补 1 份蔬菜和 1 份水果，先把饱腹感和消化状态拉起来。", [`纤维 ${Math.round(totals.fiber)}g`, `建议 ${target.fiber}g`], ["纤维不足"]));
    }
    if (tags.includes("high_fat_possible") || tags.includes("high_sodium_possible")) {
      items.push(recommendationItem("nutrition", primary === "fat_loss" ? "medium" : "low", "外食不确定性偏高", "外食油脂或钠偏高，火锅/炒面类优先控制蘸料、肥肉和额外主食，避免把热量不确定性堆在晚餐。", ["高油脂/高钠可能", `状态：${dayStatus.alignment}`], ["外食", "不确定性"]));
    }
    if (confidence !== "high") {
      items.push(recommendationItem("info", "low", "分量还不够清楚", "这次饮食记录有分量模糊项，后续至少补“几份/几碗/多少克”，系统判断会更稳。", [`置信度 ${confidence}`], ["记录质量"]));
    }
    if (!items.length) {
      items.push(recommendationItem("info", "low", "当天饮食基本匹配目标", `当天饮食估算与当前目标基本匹配，保持记录连续性即可。状态：${dayStatus.alignment}`, [`状态：${dayStatus.alignment}`], ["稳定观察"]));
    }
    return sortRecommendationItems(items);
  }

  function buildNutritionEvidence({ tags, totals, target, confidence, mealResults }) {
    return uniqueStrings([
      `热量 ${Math.round(totals.calories)}kcal / 目标 ${target.caloriesLower}-${target.caloriesUpper}kcal`,
      `蛋白 ${Math.round(totals.protein)}g / 目标 ${target.protein}g`,
      `碳水 ${Math.round(totals.carbs)}g / 参考下限 ${target.carbsLower}g`,
      `纤维 ${Math.round(totals.fiber)}g / 目标 ${target.fiber}g`,
      `置信度 ${confidence}`,
      `餐次 ${mealResults.length} 次`,
      ...tags.slice(0, 6).map((tag) => `标签：${tag}`)
    ]).slice(0, 8);
  }

  function nutritionRecommendations({ tags, goal, totals, target, confidence, dayStatus }) {
    return buildNutritionRecommendationItems({ tags, goal, totals, target, confidence, dayStatus }).map((item) => item.detail);
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

  function buildNutritionProfile(logs, goal) {
    const tagCounts = {};
    const mealCounts = {};
    const missedMealByMeal = { breakfast: 0, lunch: 0, dinner: 0, snack: 0, all_day: 0 };
    const totals = [];
    let lowProteinDays = 0;
    let missedMealDays = 0;
    let uncertainDays = 0;
    (logs || []).forEach((log) => {
      (log.analysis?.tags || []).forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
      (log.analysis?.meals || []).forEach((meal) => {
        mealCounts[meal.meal] = (mealCounts[meal.meal] || 0) + 1;
        if ((meal.tags || []).includes("missed_meal")) {
          missedMealByMeal[meal.meal] = (missedMealByMeal[meal.meal] || 0) + 1;
        }
      });
      if ((log.analysis?.tags || []).includes("daily_protein_gap")) lowProteinDays += 1;
      if ((log.analysis?.tags || []).includes("missed_meal")) missedMealDays += 1;
      if (log.analysis?.confidence !== "high") uncertainDays += 1;
      if (log.analysis?.estimates?.total) totals.push({ date: log.date, ...log.analysis.estimates.total });
    });
    const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const averages = averageNutritionTotals(totals);
    const trend = nutritionTrendSummary(totals);
    const advice = inferNutritionProfileAdvice(topTags, goal?.parsed, {
      count: (logs || []).length,
      lowProteinDays,
      missedMealDays,
      uncertainDays,
      averages,
      trend
    });
    return {
      count: (logs || []).length,
      topTags,
      mealCounts,
      missedMealByMeal,
      advice,
      averages,
      trend,
      lowProteinDays,
      missedMealDays,
      uncertainDays
    };
  }

  function inferNutritionProfileAdvice(topTags, goal, stats) {
    const tags = topTags.map(([tag]) => tag);
    const primary = goal?.primaryGoal || "general_fitness";
    const notes = [];
    if (tags.includes("missed_meal")) notes.push("最近多次出现漏正餐或正餐质量不足，优先建立可执行的保底简餐。");
    if (tags.includes("processed_snack")) notes.push("加工零食出现较多，容易影响饱腹感和训练供能稳定性。");
    if (tags.includes("low_fiber_possible")) notes.push("蔬菜/水果/纤维记录偏少，建议先固定每天 1-2 份蔬果。");
    if (tags.includes("high_fat_possible") || tags.includes("high_sodium_possible")) notes.push("外食油脂和钠不确定性较高，火锅/炒面/烧烤类需要更留意份量。");
    if (stats.lowProteinDays >= Math.max(2, Math.ceil(stats.count / 3))) notes.push(`近 ${stats.count} 天里有 ${stats.lowProteinDays} 天蛋白估算偏低，阶段 2 要先把“白天补蛋白”固定下来。`);
    if (stats.missedMealDays >= Math.max(2, Math.ceil(stats.count / 3))) notes.push(`最近漏餐/正餐空缺比较频繁（${stats.missedMealDays}/${stats.count} 天），优先建立出差保底简餐模板。`);
    if (stats.uncertainDays >= Math.max(2, Math.ceil(stats.count / 2))) notes.push("多数饮食记录分量仍偏模糊，后续至少补几份/几碗/多少克，趋势判断会更可靠。");
    if (primary === "fat_loss") notes.push("减脂目标下，优先保证蛋白和正餐完整，再处理零食和高油外食。");
    if (primary === "muscle_gain") notes.push("增肌目标下，需要把蛋白和碳水更均匀地分布到白天各餐。");
    if (primary === "strength") notes.push("力量目标下，如果白天经常缺餐，训练表现和动作质量会更不稳定。");
    if (!notes.length) notes.push("饮食记录还不够多，继续积累数据后再看长期模式。");
    return notes;
  }

  function buildNutritionTrend(logs) {
    return (logs || [])
      .map((log) => ({
        date: log.date,
        calories: Number(log.analysis?.estimates?.total?.calories || 0),
        protein: Number(log.analysis?.estimates?.total?.protein || 0),
        fiber: Number(log.analysis?.estimates?.total?.fiber || 0),
        missedMeal: (log.analysis?.tags || []).includes("missed_meal") ? 1 : 0
      }))
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .slice(-10);
  }

  function buildIntegratedSignals({ goal, metrics, sessions, exerciseLogs, nutritionLogs }) {
    const primary = goal?.parsed?.primaryGoal || "general_fitness";
    const nutritionProfile = buildNutritionProfile(nutritionLogs || [], goal);
    const exerciseProfiles = buildExerciseProfiles(exerciseLogs || []);
    const latestMetric = sortedMetrics(metrics || []).at(-1);
    const latestSession = sortedSessions(sessions || []).at(-1);
    const weightTrend21 = metricTrend(metrics || [], "weight", 21);
    const sessionTrend = compareSessionWindows(sessions || [], 14);
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
    const profiles = new Map(buildExerciseProfiles(exerciseLogs || []).map((profile) => [profile.exerciseId, profile]));
    const integrated = buildIntegratedSignals({ goal, metrics, sessions, exerciseLogs, nutritionLogs });
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

  function buildNutritionReminders({ goal, metrics, sessions, exerciseLogs, nutritionLogs }) {
    const profile = buildNutritionProfile(nutritionLogs || [], goal);
    const integrated = buildIntegratedSignals({ goal, metrics, sessions, exerciseLogs, nutritionLogs });
    const reminders = [];

    if (profile.lowProteinDays >= 2) {
      reminders.push(recommendationItem("nutrition", "high", "今天先把白天蛋白补齐", "最近蛋白缺口反复出现，今天至少保证午餐或加餐里有一份高蛋白来源。", [`蛋白缺口 ${profile.lowProteinDays}/${profile.count || 0} 天`], ["饮食前提醒", "蛋白缺口"]));
    }
    if ((profile.missedMealByMeal?.lunch || 0) >= 2) {
      reminders.push(recommendationItem("nutrition", "high", "今天不要再空午餐", "你最近最容易缺的是午餐，这会直接影响训练供能和晚餐控制。今天优先把午餐补上。", [`午餐缺失 ${profile.missedMealByMeal.lunch} 次`], ["饮食前提醒", "午餐优先"]));
    }
    if (profile.uncertainDays >= Math.max(2, Math.ceil((profile.count || 0) / 2))) {
      reminders.push(recommendationItem("nutrition", "low", "今天记录尽量补分量", "饮食趋势已经有了，但分量还偏模糊。今天尽量补“几份/几碗/多少克”。", [`记录不确定 ${profile.uncertainDays}/${profile.count || 0} 天`], ["饮食前提醒", "记录质量"]));
    }
    integrated.filter((item) => item.type === "nutrition" || item.type === "recovery").slice(0, 2).forEach((item) => {
      reminders.push(recommendationItem("nutrition", item.priority, item.title, item.detail, item.evidence, ["饮食前提醒", ...(item.tags || [])]));
    });

    return dedupeReminderItems(sortRecommendationItems(reminders));
  }

  function buildLinkedTodayInsights({ goal, metrics, sessions, exerciseLogs, nutritionLogs }) {
    return buildIntegratedSignals({ goal, metrics, sessions, exerciseLogs, nutritionLogs }).map((item) => item.detail);
  }

  function buildWeeklyReview({ goal, metrics, sessions, exerciseLogs, nutritionLogs, plan }) {
    const recentSessions = withinDays(sessions || [], 7);
    const recentExerciseLogs = withinDays(exerciseLogs || [], 7);
    const recentNutritionLogs = withinDays(nutritionLogs || [], 7);
    const nutritionProfile = buildNutritionProfile(recentNutritionLogs, goal);
    const exerciseProfiles = buildExerciseProfiles(recentExerciseLogs);
    const integratedSignals = buildIntegratedSignals({ goal, metrics, sessions, exerciseLogs, nutritionLogs });
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
    } else {
      highlights.push(`最近 7 天记录了 ${recentSessions.length} 次训练，平均完成度 ${round1(completionAvg)}%，平均 RPE ${round1(rpeAvg)}。`);
      if (fatigueAvg >= 4) highlights.push(`最近训练疲劳均值 ${round1(fatigueAvg)}/5，当前恢复压力偏高。`);
      if (painSessions.length) highlights.push(`最近 7 天有 ${painSessions.length} 次训练出现较高疼痛反馈，下一周优先保动作质量和恢复。`);
      if (lowCompletionSessions.length) highlights.push(`最近 7 天有 ${lowCompletionSessions.length} 次训练完成度低于 70%，当前计划可能对时间、状态或场地不够友好。`);
      if (stableSessions.length >= 2) highlights.push("最近至少有 2 次训练完成度高、疼痛低，部分主动作具备小幅进阶条件。");
    }

    if (nutritionProfile.count) {
      highlights.push(`最近 7 天记录了 ${nutritionProfile.count} 天饮食，平均蛋白 ${round1(nutritionProfile.averages.protein)}g，漏正餐 ${nutritionProfile.missedMealDays} 天。`);
      if (nutritionProfile.lowProteinDays >= 2) nextActions.push("先把白天蛋白补齐，再谈加训练量。午餐和加餐优先补高蛋白。");
      if (nutritionProfile.missedMealDays >= 2) nextActions.push("最近漏正餐偏多，先建立出差保底简餐模板，避免用零食顶正餐。");
    } else {
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
      if (item.priority === "high") highlights.push(item.detail);
      else nextActions.push(item.detail);
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

  function revision(uid, nowLabel, summary, reason, tags, patch) {
    return {
      id: uid("rev"),
      createdAt: nowLabel(),
      status: "pending",
      summary,
      reason,
      tags,
      patch
    };
  }

  function buildPlanDay(type, config, gym, goal, exercises) {
    const templates = {
      upper: ["上肢力量", "保留主要推拉动作，适合器械受限时快速完成。", [
        ["水平推", ["bench_press", "incline_barbell_press", "dumbbell_bench_press", "incline_dumbbell_press", "incline_press_machine", "chest_press_machine", "machine_chest_press", "push_up"]],
        ["水平拉", ["chest_supported_row", "high_row_machine", "t_bar_row", "seated_cable_row", "seated_row_machine", "one_arm_dumbbell_row", "band_row"]],
        ["垂直推", ["dumbbell_shoulder_press", "machine_shoulder_press", "landmine_press", "barbell_overhead_press", "lateral_raise"]],
        ["垂直拉", ["lat_pulldown", "assisted_pullup_machine", "pull_up", "band_pulldown"]],
        ["肘屈", ["ez_bar_curl", "incline_dumbbell_curl", "bicep_curl_machine", "dumbbell_curl", "cable_curl", "preacher_curl", "reverse_ez_bar_curl"]],
        ["肘伸", ["triceps_pushdown", "overhead_triceps_extension", "dip"]]
      ]],
      lower: ["下肢力量", "以蹲、髋铰链和单腿动作为主，按疼痛反馈调整负荷。", [
        ["蹲", ["barbell_squat", "hack_squat_machine", "leg_press", "goblet_squat", "smith_squat"]],
        ["髋铰链", ["trap_bar_deadlift", "barbell_deadlift", "dumbbell_rdl", "hip_thrust", "glute_drive_machine", "glute_bridge"]],
        ["单腿", ["bulgarian_split_squat", "goblet_squat"]],
        ["核心抗伸展", ["plank", "dead_bug", "ab_crunch_machine"]],
        ["有氧", ["treadmill_incline_walk", "bike_easy", "elliptical_easy", "stair_climber_easy", "rower_easy"]]
      ]],
      full: ["全身训练", "出差或每周训练次数少时优先保证全身刺激。", [
        ["蹲", ["goblet_squat", "hack_squat_machine", "barbell_squat", "leg_press"]],
        ["髋铰链", ["dumbbell_rdl", "trap_bar_deadlift", "barbell_deadlift", "glute_bridge"]],
        ["水平推", ["dumbbell_bench_press", "incline_dumbbell_press", "incline_barbell_press", "incline_press_machine", "bench_press", "push_up", "chest_press_machine"]],
        ["水平拉", ["chest_supported_row", "high_row_machine", "t_bar_row", "one_arm_dumbbell_row", "seated_cable_row", "seated_row_machine", "band_row"]],
        ["核心抗伸展", ["plank", "dead_bug"]],
        ["有氧", ["treadmill_incline_walk", "bike_easy", "elliptical_easy", "rower_easy"]]
      ]],
      push: ["推类/胸肩三头", "增肌或力量周期中的上肢推类重点日。", [
        ["水平推", ["bench_press", "incline_barbell_press", "incline_dumbbell_press", "incline_press_machine", "dumbbell_bench_press", "chest_press_machine", "machine_chest_press", "push_up"]],
        ["垂直推", ["dumbbell_shoulder_press", "machine_shoulder_press", "landmine_press", "barbell_overhead_press"]],
        ["肩外展", ["lateral_raise", "cable_lateral_raise"]],
        ["肘伸", ["triceps_pushdown", "overhead_triceps_extension", "dip"]]
      ]],
      pull: ["拉类/背二头", "背部和手臂拉类训练，兼顾肩胛控制。", [
        ["垂直拉", ["lat_pulldown", "assisted_pullup_machine", "pull_up", "band_pulldown"]],
        ["水平拉", ["chest_supported_row", "high_row_machine", "t_bar_row", "seated_row_machine", "seated_cable_row", "one_arm_dumbbell_row", "band_row", "face_pull"]],
        ["髋铰链", ["dumbbell_rdl", "trap_bar_deadlift", "barbell_deadlift", "glute_bridge"]],
        ["肘屈", ["ez_bar_curl", "incline_dumbbell_curl", "bicep_curl_machine", "dumbbell_curl", "cable_curl", "preacher_curl", "reverse_ez_bar_curl"]],
        ["核心抗伸展", ["plank", "dead_bug"]]
      ]],
      conditioning: ["恢复/有氧", "减脂期或疲劳较高时保留训练连续性。", [
        ["有氧", ["treadmill_incline_walk", "bike_easy", "elliptical_easy", "stair_climber_easy", "rower_easy", "sled_push"]],
        ["核心抗伸展", ["plank", "dead_bug"]],
        ["水平拉", ["band_row", "face_pull", "one_arm_dumbbell_row", "seated_cable_row"]],
        ["蹲", ["goblet_squat", "leg_press", "hack_squat_machine"]],
        ["肩外展", ["lateral_raise", "cable_lateral_raise"]]
      ]]
    };
    const [focus, intent, items] = templates[type] || templates.full;
    return {
      type,
      focus,
      intent,
      exercises: items.map(([pattern, candidates]) => {
        const selected = pickAvailableExercise(candidates, gym, exercises);
        const isCardio = pattern === "有氧";
        return {
          exerciseId: selected.id,
          sets: isCardio ? 1 : config.sets,
          reps: isCardio ? config.cardio : config.reps,
          load: isCardio ? "中低强度" : "按 RPE 调整",
          rpe: isCardio ? "5-6" : config.rpe,
          rest: isCardio ? "-" : config.rest,
          notes: selected.available ? defaultRowNote(goal, pattern) : `当前场地缺原动作器械，已改用 ${selected.name}。`
        };
      })
    };
  }

  function planDayTypes(daysCount, goal) {
    if (daysCount <= 1) return ["full"];
    if (daysCount === 2) return ["upper", "lower"];
    if (daysCount === 3) return goal === "fat_loss" ? ["upper", "lower", "conditioning"] : ["upper", "lower", "full"];
    if (daysCount === 4) return goal === "muscle_gain" ? ["push", "pull", "lower", "upper"] : ["upper", "lower", "full", "conditioning"];
    if (daysCount === 5) return ["push", "pull", "lower", "upper", "conditioning"];
    return ["push", "pull", "lower", "upper", "full", "conditioning"];
  }

  function planConfig(goal) {
    if (goal.primaryGoal === "strength") return { sets: 4, reps: "3-6", rpe: "7-8", rest: "2-3 分钟", cardio: "15-20 分钟" };
    if (goal.primaryGoal === "muscle_gain") return { sets: 3, reps: "8-12", rpe: "7-8", rest: "90-120 秒", cardio: "10-15 分钟" };
    if (goal.primaryGoal === "fat_loss") return { sets: 3, reps: "10-15", rpe: "6-8", rest: "60-90 秒", cardio: "20-30 分钟" };
    return { sets: 3, reps: "8-12", rpe: "6-7", rest: "90 秒", cardio: "15-20 分钟" };
  }

  function defaultRowNote(goal, pattern) {
    if (goal.primaryGoal === "fat_loss" && pattern === "有氧") return "保持可持续强度，优先保证训练连续性。";
    if (goal.secondaryGoal === "strength_maintenance") return "保留动作质量，不用每次都冲重量。";
    if (goal.frequentTravel) return "出差模式：优先可执行和低录入成本。";
    return "按目标 RPE 完成，保留 1-3 次余力。";
  }

  function pickAvailableExercise(candidates, gym, exercises) {
    const byId = new Map(exercises.map((item) => [item.id, item]));
    const resolved = candidates.map((id) => byId.get(id)).filter(Boolean);
    const available = resolved.find((item) => isAvailable(item, gym));
    if (available) return { ...available, available: true };
    const fallback = resolved[0] || exercises[0];
    const sub = availableSubstitutes(fallback, gym, exercises)[0];
    if (sub) return { ...sub, available: true };
    return { ...fallback, available: false };
  }

  function buildPlanContext(gym, goal, parsed, metrics) {
    const latest = sortedMetrics(metrics).at(-1);
    const trend = metricTrend(metrics, "weight", 30);
    const notes = [];
    if (parsed.frequentTravel) notes.push("出差优先：每次训练控制在可执行范围");
    if (gym.equipment.length <= 5) notes.push("器械受限：启用替代动作优先级");
    if (latest) {
      if (parsed.primaryGoal === "fat_loss" && trend?.delta > 0.3) notes.push("减脂目标下体重近30天上升，建议增加有氧/检查饮食");
      if (parsed.primaryGoal === "muscle_gain" && trend && Math.abs(trend.delta) < 0.3) notes.push("增肌目标下体重变化小，关注热量摄入和渐进超负荷");
      if (parsed.primaryGoal === "fat_loss" && latest.skeletalMuscle) notes.push("减脂期保留力量训练，关注骨骼肌变化");
    }
    return {
      goalLabel: goal ? `${goal.parsed.primaryGoalLabel}${goal.parsed.secondaryGoalLabel ? ` + ${goal.parsed.secondaryGoalLabel}` : ""}` : "综合体能",
      gymName: gym.name,
      equipment: [...gym.equipment],
      metricSummary: latest ? `${latest.date}：体重 ${fmt(latest.weight, "kg")}，体脂 ${fmt(latest.bodyFat, "%")}，骨骼肌 ${fmt(latest.skeletalMuscle, "kg")}` : "暂无身体指标",
      notes
    };
  }

  function isAvailable(exercise, gym) {
    return exercise.equipment.every((id) => gym.equipment.includes(id));
  }

  function availableSubstitutes(exercise, gym, exercises) {
    const byId = new Map(exercises.map((item) => [item.id, item]));
    const ids = [...new Set([...(exercise.substitutes || []), ...exercises.filter((item) => item.pattern === exercise.pattern && item.id !== exercise.id).map((item) => item.id)])];
    return ids.map((id) => byId.get(id)).filter(Boolean).filter((item) => isAvailable(item, gym));
  }

  function sortedMetrics(metrics) {
    return (metrics || []).slice().sort((a, b) => a.date.localeCompare(b.date));
  }

  function metricTrend(metrics, field, days) {
    const data = sortedMetrics(metrics).filter((item) => typeof item[field] === "number");
    if (data.length < 2) return null;
    const last = data[data.length - 1];
    const cutoff = new Date(last.date);
    cutoff.setDate(cutoff.getDate() - days);
    const first = data.find((item) => new Date(item.date) >= cutoff) || data[0];
    return { first: first[field], last: last[field], delta: last[field] - first[field] };
  }

  function food(id, label, aliases, unit, macros, tags) {
    return { id, label, aliases, unit, macros, tags };
  }

  function parseFoodQuantity(quantityToken, unitToken, defaultUnit) {
    const unit = normalizeFoodUnit(unitToken || defaultUnit || "份");
    if (!quantityToken) return { quantity: 1, unit, uncertain: !unitToken };
    if (/一点|一些|少量|少许/.test(quantityToken)) return { quantity: 0.5, unit, uncertain: true };
    return { quantity: parseChineseNumber(quantityToken), unit, uncertain: !/^\d/.test(quantityToken) };
  }

  function estimateFoodItem(item, quantity, unit) {
    const factor = unit === item.unit ? quantity : quantity;
    return {
      calories: item.macros.calories * factor,
      protein: item.macros.protein * factor,
      carbs: item.macros.carbs * factor,
      fat: item.macros.fat * factor,
      fiber: item.macros.fiber * factor,
      uncertain: unit !== item.unit
    };
  }

  function mealMissingPrompt(mealName, items) {
    const label = { breakfast: "早餐", lunch: "午餐", dinner: "晚餐", snack: "加餐", all_day: "当天饮食" }[mealName] || "该餐";
    if (!items.length) return `${label}描述较模糊，补充主食/肉量会更准确。`;
    if (items.some((item) => item.label.includes("火锅"))) return `${label}是火锅，补充肉量、主食和蘸料会更准确。`;
    return `${label}有分量模糊项，补充“几份/几碗/多少克”会更准确。`;
  }

  function emptyNutritionTotals() {
    return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  }

  function addNutritionTotals(target, source) {
    target.calories += Number(source.calories || 0);
    target.protein += Number(source.protein || 0);
    target.carbs += Number(source.carbs || 0);
    target.fat += Number(source.fat || 0);
    target.fiber += Number(source.fiber || 0);
    return target;
  }

  function averageNutritionTotals(entries) {
    if (!entries.length) return roundNutritionTotals(emptyNutritionTotals());
    const total = entries.reduce((acc, item) => addNutritionTotals(acc, item), emptyNutritionTotals());
    return roundNutritionTotals({
      calories: total.calories / entries.length,
      protein: total.protein / entries.length,
      carbs: total.carbs / entries.length,
      fat: total.fat / entries.length,
      fiber: total.fiber / entries.length
    });
  }

  function nutritionTrendSummary(entries) {
    const sorted = (entries || []).slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
    if (sorted.length < 4) return null;
    const recent = sorted.slice(-4);
    const previous = sorted.slice(-8, -4);
    if (!previous.length) return null;
    const avg = (group, field) => group.reduce((sum, item) => sum + Number(item[field] || 0), 0) / group.length;
    return {
      proteinDelta: round1(avg(recent, "protein") - avg(previous, "protein")),
      caloriesDelta: Math.round(avg(recent, "calories") - avg(previous, "calories")),
      fiberDelta: round1(avg(recent, "fiber") - avg(previous, "fiber"))
    };
  }

  function roundNutritionTotals(totals) {
    return {
      calories: Math.round(totals.calories),
      protein: round1(totals.protein),
      carbs: round1(totals.carbs),
      fat: round1(totals.fat),
      fiber: round1(totals.fiber)
    };
  }

  function normalizeFoodUnit(unit) {
    if (!unit) return "份";
    if (/g|克/.test(unit)) return "克";
    if (/ml|毫升/.test(unit)) return "毫升";
    return unit;
  }

  function parseChineseNumber(token) {
    if (!token) return 1;
    if (/^\d+(\.\d+)?$/.test(token)) return Number(token);
    const map = { 半: 0.5, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
    return map[token] || 1;
  }

  function escapeRegex(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function uniqueStrings(list) {
    return Array.from(new Set((list || []).filter(Boolean)));
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

  function averageOf(items, key) {
    const values = (items || []).map((item) => Number(item?.[key])).filter((value) => Number.isFinite(value));
    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function fmtNum(value, unit) {
    return Number.isFinite(value) ? `${round1(value)}${unit}` : "-";
  }

  function signed(value, unit) {
    if (!Number.isFinite(value)) return "-";
    return `${value > 0 ? "+" : ""}${value}${unit}`;
  }

  function findConditioningDayIndex(plan) {
    if (!plan?.days?.length) return -1;
    const direct = plan.days.findIndex((day) => day.type === "conditioning" || /有氧|恢复/.test(String(day.focus || "")));
    if (direct >= 0) return direct;
    return plan.days.findIndex((day) => day.exercises.some((row) => /分钟/.test(String(row.reps || ""))));
  }

  function dedupeCandidates(candidates) {
    const seen = new Set();
    return (candidates || []).filter((candidate) => {
      if (!candidate?.key || seen.has(candidate.key)) return false;
      seen.add(candidate.key);
      return true;
    });
  }

  function sortedSessions(sessions) {
    return (sessions || []).slice().sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
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
    const latest = new Date(sorted.at(-1).date);
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

  function dedupeReminderItems(items) {
    const seen = new Set();
    return (items || []).filter((item) => {
      const key = `${item.title}|${item.detail}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function buildAdviceEntry(uid, nowLabel, title, items, tags, evidence = []) {
    const sorted = sortRecommendationItems(items);
    return {
      id: uid("advice"),
      createdAt: nowLabel(),
      title,
      body: sorted.map((item) => item.detail).join(" "),
      tags: uniqueStrings([...(tags || []), ...sorted.flatMap((item) => item.tags || [])]),
      priority: highestPriority(sorted),
      priorityLabel: priorityLabel(highestPriority(sorted)),
      evidence: uniqueStrings([...(evidence || []), ...sorted.flatMap((item) => item.evidence || [])]).slice(0, 8),
      recommendationItems: sorted
    };
  }

  function recommendationItem(type, priority, title, detail, evidence = [], tags = []) {
    return {
      type,
      priority,
      title,
      detail,
      evidence: uniqueStrings(evidence),
      tags: uniqueStrings(tags)
    };
  }

  function sortRecommendationItems(items) {
    return (items || []).slice().sort((a, b) => priorityScore(b.priority) - priorityScore(a.priority) || String(a.title || "").localeCompare(String(b.title || "")));
  }

  function highestPriority(items) {
    return sortRecommendationItems(items)[0]?.priority || "low";
  }

  function priorityScore(priority) {
    return { high: 300, medium: 200, low: 100, info: 50 }[priority] || 0;
  }

  function priorityLabel(priority) {
    return { high: "高优先级", medium: "中优先级", low: "低优先级", info: "观察" }[priority] || "观察";
  }

  function round1(value) {
    return Math.round(Number(value || 0) * 10) / 10;
  }

  function fmt(value, unit) {
    return typeof value === "number" ? `${value}${unit}` : "-";
  }

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
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
    sortedMetrics
  };
})();
