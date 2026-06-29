(function () {
  "use strict";

  const parseGoal = window.FitnessCore.GoalParser.parseGoal;
  const { sortedMetrics, metricTrend } = window.FitnessCore.MetricAnalyzer;

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



function fmtNum(value, unit) {
    return Number.isFinite(value) ? `${round1(value)}${unit}` : "-";
  }



function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
  }



  window.FitnessCore = window.FitnessCore || {};
  window.FitnessCore.PlanGenerator = {
    generatePlan,
    buildPlanDay,
    planDayTypes,
    planConfig,
    defaultRowNote,
    pickAvailableExercise,
    buildPlanContext,
    isAvailable,
    availableSubstitutes
  };
})();
