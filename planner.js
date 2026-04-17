window.FitnessPlanner = (() => {
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
    } else if (/增肌|长肌肉|肌肉量|muscle|hypertrophy/.test(lower)) {
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
    if (/膝|腰|肩|疼|伤|不适/.test(lower)) parsed.constraints.push("pain_or_injury_note");
    if (!parsed.trainingDaysPerWeek) parsed.trainingDaysPerWeek = parsed.frequentTravel ? 3 : 4;
    if (!parsed.sessionDurationMinutes) parsed.sessionDurationMinutes = parsed.frequentTravel ? 45 : 60;
    if (!source) parsed.notes.push("目标描述为空，已按综合体能默认处理。");
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
      messages.push(`完成度只有 ${session.completion}%，下次同类训练不建议加重量，优先缩短动作数量或降低组数。`);
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
      recommendations.push("如果这是背部训练，主动作可使用助力带，避免握力限制背部刺激；另可补充农夫走或静态悬垂。");
    }
    if (input.targetMuscleFeel === "weak" || input.targetMuscleFeel === "none" || /没感觉|没有感觉|发力.*差|背没|胸没|臀没/.test(text)) {
      addTag("poor_target_muscle_feel", "目标肌肉感觉弱");
      recommendations.push("下次先降低重量或增加顶峰停顿，训练前加 1-2 组轻重量激活动作。");
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

  function parseNutritionLog(rawText, goal) {
    const text = (rawText || "").trim();
    const lower = text.toLowerCase();
    const meals = splitMeals(text);
    const allTags = new Set();
    const estimates = {
      protein: "unknown",
      calories: "unknown",
      carbs: "unknown",
      fat: "unknown"
    };
    const mealResults = meals.map((meal) => {
      const tags = nutritionTagsFor(meal.text);
      tags.forEach((tag) => allTags.add(tag));
      return { meal: meal.meal, text: meal.text, tags };
    });

    if (/蛋白|鸡蛋|牛肉|鸡胸|鱼|虾|豆浆|豆腐|酸奶|蛋白粉/.test(lower)) estimates.protein = "present";
    if (/威化|甜|糖|奶茶|饼干|蛋糕|炒面|火锅|炸|肥牛|烧烤/.test(lower)) estimates.calories = "possibly_high";
    if (/地瓜|米饭|面|粉|馒头|面包|燕麦|土豆/.test(lower)) estimates.carbs = "present";
    if (/火锅|肥牛|炒|炸|烧烤|奶油|芝士/.test(lower)) estimates.fat = "possibly_high";

    const recommendations = nutritionRecommendations(Array.from(allTags), goal?.parsed);
    const confidence = /一点|一些|一碗|火锅|外卖|大概|随便/.test(text) ? "medium_low" : "medium";
    return { rawText: text, meals: mealResults, tags: Array.from(allTags), estimates, recommendations, confidence };
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
    for (const part of text.split(/[，,。；;]/).map((x) => x.trim()).filter(Boolean)) {
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

  function nutritionTagsFor(text) {
    const tags = [];
    const add = (tag) => { if (!tags.includes(tag)) tags.push(tag); };
    if (/没吃|不吃|没饭|没吃饭/.test(text)) add("missed_meal");
    if (/蛋白|鸡蛋|牛肉|鸡胸|鱼|虾|豆浆|豆腐|酸奶|蛋白粉/.test(text)) add("protein_present");
    if (/威化|饼干|蛋糕|糖|奶茶|巧克力|零食/.test(text)) add("processed_snack");
    if (/炒面|炒饭|油条|炸|火锅|肥牛|烧烤/.test(text)) add("high_fat_possible");
    if (/火锅|泡面|卤|腌|咸/.test(text)) add("high_sodium_possible");
    if (/地瓜|米饭|面|粉|馒头|面包|燕麦|土豆/.test(text)) add("carb_present");
    if (!/菜|蔬|水果|苹果|香蕉|莓|西兰花|青菜/.test(text)) add("low_fiber_possible");
    if (/一点|一些|一碗|火锅|大概|随便/.test(text)) add("portion_uncertain");
    return tags;
  }

  function nutritionRecommendations(tags, goal) {
    const recs = [];
    const primary = goal?.primaryGoal || "general_fitness";
    if (tags.includes("missed_meal") || tags.includes("processed_snack")) {
      recs.push("有正餐缺失或零食替代正餐，容易导致晚餐过量和训练供能波动。下一餐优先补一个高蛋白正餐或简餐。");
    }
    if (tags.includes("low_fiber_possible")) {
      recs.push("蔬菜/水果/纤维记录偏少，建议补一份蔬菜或水果，帮助饱腹和恢复。");
    }
    if (tags.includes("high_fat_possible") || tags.includes("high_sodium_possible")) {
      recs.push("外食油脂和钠不确定性较高，火锅/炒面类建议控制蘸料、肥肉和额外主食量。");
    }
    if (primary === "fat_loss") {
      recs.push("减脂目标下，优先保证蛋白和正餐稳定，再控制高糖零食和高油外食。");
    } else if (primary === "muscle_gain") {
      recs.push("增肌目标下，午餐和训练前后需要稳定蛋白与碳水，避免全天蛋白集中在一餐。");
    } else if (primary === "strength") {
      recs.push("力量目标下，训练日前后不要长期缺碳水，否则 RPE 和动作质量可能受影响。");
    } else {
      recs.push("维持目标下，先保证每餐有蛋白来源、主食或薯类、蔬果中的至少两类。");
    }
    return recs;
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
        ["水平推", ["bench_press", "dumbbell_bench_press", "machine_chest_press", "push_up"]],
        ["水平拉", ["seated_cable_row", "one_arm_dumbbell_row", "band_row"]],
        ["垂直推", ["dumbbell_shoulder_press", "barbell_overhead_press", "lateral_raise"]],
        ["垂直拉", ["lat_pulldown", "pull_up", "band_pulldown"]],
        ["肘屈", ["dumbbell_curl"]],
        ["肘伸", ["triceps_pushdown", "overhead_triceps_extension"]]
      ]],
      lower: ["下肢力量", "以蹲、髋铰链和单腿动作为主，按疼痛反馈调整负荷。", [
        ["蹲", ["barbell_squat", "leg_press", "goblet_squat", "smith_squat"]],
        ["髋铰链", ["barbell_deadlift", "dumbbell_rdl", "hip_thrust", "glute_bridge"]],
        ["单腿", ["bulgarian_split_squat", "goblet_squat"]],
        ["核心抗伸展", ["plank", "dead_bug"]],
        ["有氧", ["treadmill_incline_walk", "bike_easy", "rower_easy"]]
      ]],
      full: ["全身训练", "出差或每周训练次数少时优先保证全身刺激。", [
        ["蹲", ["goblet_squat", "barbell_squat", "leg_press"]],
        ["髋铰链", ["dumbbell_rdl", "barbell_deadlift", "glute_bridge"]],
        ["水平推", ["dumbbell_bench_press", "bench_press", "push_up"]],
        ["水平拉", ["one_arm_dumbbell_row", "seated_cable_row", "band_row"]],
        ["核心抗伸展", ["plank", "dead_bug"]],
        ["有氧", ["treadmill_incline_walk", "bike_easy", "rower_easy"]]
      ]],
      push: ["推类/胸肩三头", "增肌或力量周期中的上肢推类重点日。", [
        ["水平推", ["bench_press", "dumbbell_bench_press", "machine_chest_press", "push_up"]],
        ["垂直推", ["dumbbell_shoulder_press", "barbell_overhead_press"]],
        ["肩外展", ["lateral_raise", "cable_lateral_raise"]],
        ["肘伸", ["triceps_pushdown", "overhead_triceps_extension"]]
      ]],
      pull: ["拉类/背二头", "背部和手臂拉类训练，兼顾肩胛控制。", [
        ["垂直拉", ["lat_pulldown", "pull_up", "band_pulldown"]],
        ["水平拉", ["seated_cable_row", "one_arm_dumbbell_row", "band_row"]],
        ["髋铰链", ["dumbbell_rdl", "barbell_deadlift", "glute_bridge"]],
        ["肘屈", ["dumbbell_curl"]],
        ["核心抗伸展", ["plank", "dead_bug"]]
      ]],
      conditioning: ["恢复/有氧", "减脂期或疲劳较高时保留训练连续性。", [
        ["有氧", ["treadmill_incline_walk", "bike_easy", "rower_easy"]],
        ["核心抗伸展", ["plank", "dead_bug"]],
        ["水平拉", ["band_row", "one_arm_dumbbell_row", "seated_cable_row"]],
        ["蹲", ["goblet_squat", "leg_press"]],
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

  function fmt(value, unit) {
    return typeof value === "number" ? `${value}${unit}` : "-";
  }

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
  }

  return { parseGoal, generatePlan, createAdviceFromSession, analyzeExerciseFeedback, parseNutritionLog, availableSubstitutes, isAvailable, metricTrend, sortedMetrics };
})();
