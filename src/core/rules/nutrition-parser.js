(function () {
  "use strict";

  const {
    recommendationItem,
    buildAdviceEntry,
    sortRecommendationItems,
    highestPriority,
    priorityLabel,
    uniqueStrings
  } = window.FitnessCore.AdviceEngine;

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



function buildNutritionReminders({ goal, metrics, sessions, exerciseLogs, nutritionLogs }) {
    const profile = buildNutritionProfile(nutritionLogs || [], goal);
    const integrated = window.FitnessCore.IntegratedSignals.buildIntegratedSignals({ goal, metrics, sessions, exerciseLogs, nutritionLogs });
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



function dedupeReminderItems(items) {
    const seen = new Set();
    return (items || []).filter((item) => {
      const key = `${item.title}|${item.detail}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
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



function roundNutritionTotals(totals) {
    return {
      calories: Math.round(totals.calories),
      protein: round1(totals.protein),
      carbs: round1(totals.carbs),
      fat: round1(totals.fat),
      fiber: round1(totals.fiber)
    };
  }



function parseChineseNumber(token) {
    if (!token) return 1;
    if (/^\d+(\.\d+)?$/.test(token)) return Number(token);
    const map = { 半: 0.5, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
    return map[token] || 1;
  }



function normalizeFoodUnit(unit) {
    if (!unit) return "份";
    if (/g|克/.test(unit)) return "克";
    if (/ml|毫升/.test(unit)) return "毫升";
    return unit;
  }



function mealMissingPrompt(mealName, items) {
    const label = { breakfast: "早餐", lunch: "午餐", dinner: "晚餐", snack: "加餐", all_day: "当天饮食" }[mealName] || "该餐";
    if (!items.length) return `${label}描述较模糊，补充主食/肉量会更准确。`;
    if (items.some((item) => item.label.includes("火锅"))) return `${label}是火锅，补充肉量、主食和蘸料会更准确。`;
    return `${label}有分量模糊项，补充“几份/几碗/多少克”会更准确。`;
  }



function escapeRegex(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }



function round1(value) {
    return Math.round(Number(value || 0) * 10) / 10;
  }



  window.FitnessCore = window.FitnessCore || {};
  window.FitnessCore.NutritionParser = {
    parseNutritionLog,
    buildNutritionProfile,
    inferNutritionProfileAdvice,
    buildNutritionTrend,
    buildNutritionReminders,
    nutritionRecommendations,
    buildNutritionRecommendationItems
  };
})();
