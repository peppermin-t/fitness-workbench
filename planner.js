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
    const messages = [];

    if (session.painScore >= 3) {
      messages.push(`疼痛评分 ${session.painScore}/5，后续涉及“${session.painArea || "相关部位"}”的动作建议先降强度或换成低风险替代。`);
      revisions.push(revision(uid, nowLabel, `降低 ${day.focus} 的训练量`, `训练后疼痛评分较高（${session.painScore}/5），建议将同类训练日组数减少约 30%。`, ["疼痛反馈", "降量"], { type: "reduce_day_volume", dayIndex: session.dayIndex, factor: 0.7 }));
    }

    if (session.completion < 70) {
      messages.push(`完成度只有 ${session.completion}% ，下次同类训练不建议加重量，优先缩短动作数量或降低组数。`);
      revisions.push(revision(uid, nowLabel, `简化 ${day.focus} 的训练安排`, "本次完成度低于 70%，说明当前安排对当天状态或场地不够友好，建议减少 1-2 个辅助动作。", ["完成度低", "便利化"], { type: "trim_accessory", dayIndex: session.dayIndex }));
    }

    if (session.completion >= 95 && session.rpe <= 7 && session.painScore <= 1) {
      messages.push("完成度高且 RPE 不高，可以在下次同动作中小幅加重 2.5%-5%，或每个主要动作增加 1-2 次。");
      revisions.push(revision(uid, nowLabel, `${day.focus} 下次可小幅进阶`, `完成度 ${session.completion}% 且 RPE ${session.rpe}，疼痛反馈低，符合小幅渐进超负荷条件。`, ["渐进超负荷", "加重"], { type: "add_progression_note", dayIndex: session.dayIndex }));
    }

    if (session.sleep <= 2 || session.fatigue >= 4) {
      messages.push(`睡眠 ${session.sleep}/5、疲劳 ${session.fatigue}/5，近期建议保留训练但降低冲重量动作。`);
      tags.push("恢复不足");
    }

    if (!messages.length) messages.push("本次反馈没有触发明显风险。维持当前计划，下一次继续观察完成度、RPE 和疼痛变化。");

    advice.push({
      id: uid("advice"),
      createdAt: nowLabel(),
      title: `${day.focus} 反馈建议`,
      body: messages.join(" "),
      tags
    });
    return { advice, revisions };
  }

  function analyzeExerciseFeedback(input, exercise) {
    const text = `${input.freeText || ""} ${input.painArea || ""}`.toLowerCase();
    const tags = [];
    const recommendations = [];
    const addTag = (tag, evidence) => {
      if (!tags.some((item) => item.tag === tag)) tags.push({ tag, evidence });
    };

    if (input.rangeOfMotion === "reduced_late" || /半程|做不满|幅度.*小|后程/.test(text)) {
      addTag("reduced_rom_late", "出现半程或后程幅度下降");
      recommendations.push("下次该动作不加重，优先恢复完整幅度；如果 RPE 偏高，可降重 5%-10%。");
    }
    if (input.rangeOfMotion === "partial") {
      addTag("partial_reps", "动作幅度整体不足");
      recommendations.push("先降低重量，保证每次重复都在可控幅度内完成。");
    }
    if (input.sideIssue === "left_weaker" || /左侧|左边|左手/.test(text)) {
      addTag("left_weaker", "左侧弱或左侧动作质量下降");
      recommendations.push("单侧动作从左侧开始，以左侧高质量完成次数决定右侧次数。");
    }
    if (input.sideIssue === "right_weaker" || /右侧|右边|右手/.test(text)) {
      addTag("right_weaker", "右侧弱或右侧动作质量下降");
      recommendations.push("单侧动作从右侧开始，以右侧高质量完成次数决定左侧次数。");
    }
    if (input.limitingFactor === "grip" || /小臂|握不住|手先|前臂|抓不住/.test(text)) {
      addTag("grip_limiting", "小臂或握力成为限制因素");
      recommendations.push("如果这是背部训练，主动作可使用助力带，避免握力限制背部刺激；也可补充农夫走或静态悬垂。");
    }
    if (input.targetMuscleFeel === "weak" || input.targetMuscleFeel === "none" || /没感觉|没有感觉|发力.*差|背没|胸没|臀没/.test(text)) {
      addTag("poor_target_muscle_feel", "目标肌肉感觉弱");
      recommendations.push("下次先降低重量或增加顶峰停顿，训练前做 1-2 组轻重量激活动作。");
    }
    if (input.quality === "poor" || /借力|晃|不稳|代偿|控制不住/.test(text)) {
      addTag("technique_breakdown", "动作质量下降或出现代偿");
      recommendations.push("先保持或降低重量，控制离心，减少借力；连续两次出现时建议换更稳定动作。");
    }
    if (Number(input.painScore) >= 3 || /疼|痛|不舒服|不适/.test(text)) {
      addTag("pain_risk", "疼痛或不适反馈");
      recommendations.push("疼痛评分较高时不建议加重；优先降量、缩小风险动作范围或替换动作。");
    }
    if (!tags.length && Number(input.rpe) <= 7 && input.quality === "good" && Number(input.painScore) <= 1) {
      addTag("progression_ready", "完成质量好且疼痛低");
      recommendations.push("如果下次状态相近，可以小幅加重 2.5%-5% 或增加 1-2 次。");
    }
    if (!recommendations.length) recommendations.push("本次动作反馈未触发明显调整，继续观察完成度、RPE 和动作质量。");

    return {
      exerciseId: input.exerciseId,
      exerciseName: exercise?.name || input.exerciseId,
      tags,
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
    const recommendations = nutritionRecommendations({
      tags: Array.from(allTags),
      goal: goal?.parsed,
      totals,
      target,
      mealDistribution,
      confidence,
      dayStatus
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

  function nutritionRecommendations({ tags, goal, totals, target, confidence, dayStatus }) {
    const recs = [];
    const primary = goal?.primaryGoal || "general_fitness";
    if (tags.includes("missed_meal") || tags.includes("processed_snack")) {
      recs.push("当天存在漏正餐或零食顶替正餐，下一餐优先补一份高蛋白正餐或简餐，先把进食连续性拉稳。");
    }
    if (tags.includes("daily_protein_gap")) {
      recs.push(`估算蛋白约 ${Math.round(totals.protein)}g，低于当前目标建议值 ${target.protein}g。优先补鸡胸、牛肉、鱼虾、酸奶、豆制品或蛋白粉。`);
    }
    if (tags.includes("daily_fiber_gap") || tags.includes("low_fiber_possible")) {
      recs.push("蔬菜/水果/纤维偏少，建议至少补 1 份蔬菜和 1 份水果，先把饱腹感和消化状态拉起来。");
    }
    if (tags.includes("high_fat_possible") || tags.includes("high_sodium_possible") || tags.includes("daily_energy_high")) {
      recs.push("外食油脂或钠偏高，火锅/炒面类优先控制蘸料、肥肉和额外主食，避免把热量不确定性堆在晚餐。");
    }
    if (tags.includes("daily_energy_low") && (primary === "muscle_gain" || primary === "strength")) {
      recs.push("全天估算热量偏低，当前目标下不够支撑训练和恢复，优先补午餐或训练前后的一份主食加蛋白。");
    }
    if (tags.includes("daily_carb_low")) {
      recs.push("当前目标更依赖稳定碳水，但当天主食偏少。训练日前后优先补米饭、面、燕麦、土豆或水果。");
    }
    if (tags.includes("protein_distribution_unbalanced")) {
      recs.push("蛋白过于集中在单一一餐，后续尽量分到 3-4 餐，白天先补一餐而不是把量全堆到晚餐。");
    }
    if (primary === "fat_loss") {
      recs.push("减脂目标下，先保证蛋白和正餐完整，再处理高糖零食和高油外食，不要只靠漏餐制造缺口。");
    } else if (primary === "muscle_gain") {
      recs.push("增肌目标下，重点看全天热量、蛋白和训练前后碳水是否到位，不要让午餐长期空掉。");
    } else if (primary === "strength") {
      recs.push("力量目标下，白天供能不足会更快反映到 RPE 和动作质量，训练日前后不建议长期低碳。");
    } else {
      recs.push("维持目标下，优先做到每餐有蛋白来源、一天里有蔬果和稳定主食。");
    }
    if (confidence !== "high") {
      recs.push("这次饮食记录有分量模糊项，后续至少补“几份/几碗/多少克”，系统判断会更稳。");
    }
    if (!recs.length) recs.push(`当天饮食估算与当前目标基本匹配，保持记录连续性即可。状态：${dayStatus.alignment}`);
    return uniqueStrings(recs);
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

  function buildLinkedTodayInsights({ goal, metrics, sessions, exerciseLogs, nutritionLogs }) {
    const insights = [];
    const primary = goal?.parsed?.primaryGoal || "general_fitness";
    const exerciseProfiles = buildExerciseProfiles(exerciseLogs || []);
    const nutritionProfile = buildNutritionProfile(nutritionLogs || [], goal);
    const latestSession = (sessions || [])[0];
    const latestMetric = sortedMetrics(metrics || []).at(-1);
    const weightTrend = metricTrend(metrics || [], "weight", 30);

    if (exerciseProfiles[0]?.topTags?.some(([tag]) => tag === "grip_limiting")) {
      insights.push("近期动作级反馈里，握力/小臂限制比较频繁。背部主训练可优先解决限制因素，而不是盲目降背部训练量。");
    }
    if (exerciseProfiles[0]?.topTags?.some(([tag]) => tag === "pain_risk")) {
      insights.push("近期某些动作反复出现疼痛风险，今天训练建议优先保动作质量，不要强行加重。");
    }
    if (latestSession && (latestSession.rpe >= 8.5 || latestSession.fatigue >= 4) && nutritionProfile.topTags.some(([tag]) => tag === "missed_meal")) {
      insights.push("最近训练疲劳偏高，同时饮食里有漏正餐模式，训练表现波动可能和白天供能不足有关。");
    }
    if (nutritionProfile.lowProteinDays >= 2) {
      insights.push("最近饮食记录里出现了连续蛋白缺口天数，今天如果安排主训练日，先把白天蛋白和主食补齐。");
    }
    if (primary === "fat_loss" && weightTrend?.delta > 0.3 && nutritionProfile.topTags.some(([tag]) => tag === "high_fat_possible" || tag === "processed_snack")) {
      insights.push("减脂目标下，近 30 天体重没有往目标方向走，结合饮食记录看，高油外食或零食可能是主要干扰项。");
    }
    if (primary === "muscle_gain" && latestMetric && nutritionProfile.topTags.some(([tag]) => tag === "missed_meal")) {
      insights.push("增肌目标下，白天漏正餐会直接拉低总热量和蛋白完成度，优先补稳定午餐/加餐。");
    }
    if (primary === "strength" && nutritionProfile.topTags.some(([tag]) => tag === "missed_meal")) {
      insights.push("力量目标下，缺碳水或正餐不稳定通常会先体现在 RPE 提高和动作质量下滑。");
    }

    return insights;
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
        ["水平推", ["bench_press", "dumbbell_bench_press", "incline_dumbbell_press", "chest_press_machine", "machine_chest_press", "push_up"]],
        ["水平拉", ["chest_supported_row", "seated_cable_row", "seated_row_machine", "one_arm_dumbbell_row", "band_row"]],
        ["垂直推", ["dumbbell_shoulder_press", "machine_shoulder_press", "landmine_press", "barbell_overhead_press", "lateral_raise"]],
        ["垂直拉", ["lat_pulldown", "assisted_pullup_machine", "pull_up", "band_pulldown"]],
        ["肘屈", ["dumbbell_curl", "cable_curl", "preacher_curl"]],
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
        ["水平推", ["dumbbell_bench_press", "incline_dumbbell_press", "bench_press", "push_up", "chest_press_machine"]],
        ["水平拉", ["chest_supported_row", "one_arm_dumbbell_row", "seated_cable_row", "seated_row_machine", "band_row"]],
        ["核心抗伸展", ["plank", "dead_bug"]],
        ["有氧", ["treadmill_incline_walk", "bike_easy", "elliptical_easy", "rower_easy"]]
      ]],
      push: ["推类/胸肩三头", "增肌或力量周期中的上肢推类重点日。", [
        ["水平推", ["bench_press", "incline_dumbbell_press", "dumbbell_bench_press", "chest_press_machine", "machine_chest_press", "push_up"]],
        ["垂直推", ["dumbbell_shoulder_press", "machine_shoulder_press", "landmine_press", "barbell_overhead_press"]],
        ["肩外展", ["lateral_raise", "cable_lateral_raise"]],
        ["肘伸", ["triceps_pushdown", "overhead_triceps_extension", "dip"]]
      ]],
      pull: ["拉类/背二头", "背部和手臂拉类训练，兼顾肩胛控制。", [
        ["垂直拉", ["lat_pulldown", "assisted_pullup_machine", "pull_up", "band_pulldown"]],
        ["水平拉", ["chest_supported_row", "seated_row_machine", "seated_cable_row", "one_arm_dumbbell_row", "band_row", "face_pull"]],
        ["髋铰链", ["dumbbell_rdl", "trap_bar_deadlift", "barbell_deadlift", "glute_bridge"]],
        ["肘屈", ["dumbbell_curl", "cable_curl", "preacher_curl"]],
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
    buildLinkedTodayInsights,
    availableSubstitutes,
    isAvailable,
    metricTrend,
    sortedMetrics
  };
})();
