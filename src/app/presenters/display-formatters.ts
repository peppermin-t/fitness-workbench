// @ts-nocheck
(function () {
  "use strict";

  function create({ equipment = [] } = {}) {
    function equipmentLabel(id) {
      return equipment.find((item) => item.id === id)?.label || id;
    }

    function tag(text, type = "") {
      return `<span class="tag ${type}">${esc(text)}</span>`;
    }

    function fmt(value, unit) {
      return typeof value === "number" ? `${value}${unit}` : "-";
    }

    function numUnit(value, unit) {
      return typeof value === "number" && Number.isFinite(value) ? `${Math.round(value)}${unit}` : "-";
    }

    function trendLabel(trend, unit) {
      return trend ? `${trend.delta > 0 ? "+" : ""}${trend.delta.toFixed(1)}${unit}` : "-";
    }

    function deltaLabel(value, unit) {
      return typeof value === "number" && Number.isFinite(value) ? `${value > 0 ? "+" : ""}${Math.round(value)}${unit}` : "-";
    }

    function volumeLabel(value) {
      return Number(value || 0) > 0 ? `${Math.round(Number(value))}kg` : "-";
    }

    function qualityLabel(value) {
      return { good: "好", ok: "一般", poor: "差" }[value] || value || "-";
    }

    function romLabel(value) {
      return { full: "完整", reduced_late: "后程半程", partial: "全程半程" }[value] || value || "-";
    }

    function targetFeelLabel(value) {
      return { strong: "强", moderate: "中", weak: "弱", none: "没感觉" }[value] || value || "-";
    }

    function limiterLabel(value) {
      return {
        target_muscle: "目标肌肉",
        grip: "小臂/握力",
        joint_pain: "关节疼",
        core: "核心不稳",
        cardio: "心肺",
        fatigue: "整体疲劳",
        technique: "技术",
        unknown: "不确定"
      }[value] || value || "-";
    }

    function sideIssueLabel(value) {
      return { none: "无", left_weaker: "左弱", right_weaker: "右弱" }[value] || value || "-";
    }

    function advicePriorityType(priority) {
      return { high: "warn", medium: "info", low: "success", info: "" }[priority] || "";
    }

    function adviceSortScore(priority) {
      return { high: 300, medium: 200, low: 100, info: 50 }[priority] || 0;
    }

    function advicePriorityLabel(priority, fallback) {
      return fallback || { high: "高优先级", medium: "中优先级", low: "低优先级", info: "观察" }[priority] || "观察";
    }

    function renderEvidenceList(items) {
      if (!items?.length) return "";
      return `<ul class="plain-list" style="margin-top:10px;">${items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
    }

    function renderRecommendationItems(items) {
      if (!items?.length) return "";
      return `<div class="compact-list" style="margin-top:10px;">${items.map((item) => `
        <div>
          <div class="tag-row">${tag(advicePriorityLabel(item.priority), advicePriorityType(item.priority))}${item.tags?.slice(0, 3).map((entry) => tag(entry, "info")).join("") || ""}</div>
          <div style="margin-top:6px;"><strong>${esc(item.title || "建议")}</strong></div>
          <div class="mini-text" style="margin-top:4px;">${esc(item.detail || "")}</div>
          ${renderEvidenceList((item.evidence || []).slice(0, 3))}
        </div>
      `).join("")}</div>`;
    }

    function equipmentEnglishLabel(id) {
      return {
        barbell: "Barbell",
        dumbbell: "Dumbbell",
        kettlebell: "Kettlebell",
        trap_bar: "Trap Bar",
        squat_rack: "Squat Rack",
        bench: "Bench",
        smith: "Smith Machine",
        cable: "Cable Machine",
        lat_pulldown: "Lat Pulldown",
        seated_row_machine: "Seated Row Machine",
        leg_press: "Leg Press",
        hack_squat: "Hack Squat Machine",
        leg_extension: "Leg Extension Machine",
        leg_curl: "Leg Curl Machine",
        calf_raise: "Calf Raise Machine",
        pec_deck: "Pec Deck",
        chest_press_machine: "Chest Press Machine",
        incline_press_machine: "Incline Press Machine",
        shoulder_press_machine: "Shoulder Press Machine",
        ez_bar: "EZ-Bar",
        bicep_curl_machine: "Biceps Curl Machine",
        high_row_machine: "High Row Machine",
        t_bar_row_station: "T-Bar Row Station",
        pullup_bar: "Pull-Up Bar",
        dip_station: "Dip Station",
        assisted_pullup: "Assisted Pull-Up Machine",
        landmine: "Landmine",
        glute_drive: "Glute Drive Machine",
        hip_abduction: "Hip Abduction Machine",
        hip_adduction: "Hip Adduction Machine",
        preacher_bench: "Preacher Bench",
        back_extension: "Back Extension Bench",
        ab_machine: "Abdominal Machine",
        bands: "Resistance Bands",
        suspension_trainer: "Suspension Trainer",
        mat: "Mat",
        treadmill: "Treadmill",
        elliptical: "Elliptical",
        stair_climber: "Stair Climber",
        bike: "Exercise Bike",
        rower: "Rowing Machine",
        sled: "Prowler Sled"
      }[id] || id;
    }

    function exerciseEnglishName(id) {
      return {
        barbell_squat: "Barbell Squat",
        goblet_squat: "Goblet Squat",
        leg_press: "Leg Press",
        smith_squat: "Smith Squat",
        bulgarian_split_squat: "Bulgarian Split Squat",
        barbell_deadlift: "Barbell Deadlift",
        dumbbell_rdl: "Dumbbell Romanian Deadlift",
        hip_thrust: "Barbell Hip Thrust",
        glute_bridge: "Glute Bridge",
        bench_press: "Barbell Bench Press",
        dumbbell_bench_press: "Dumbbell Bench Press",
        push_up: "Push-Up",
        machine_chest_press: "Machine Chest Press",
        chest_press_machine: "Chest Press Machine",
        incline_press_machine: "Incline Press Machine",
        incline_dumbbell_press: "DB Incline Press / Incline Dumbbell Press",
        incline_barbell_press: "Incline Press (Barbell)",
        dumbbell_shoulder_press: "Dumbbell Shoulder Press",
        barbell_overhead_press: "Barbell Overhead Press",
        machine_shoulder_press: "Shoulder Press Machine",
        landmine_press: "Landmine Press",
        lateral_raise: "Dumbbell Lateral Raise",
        cable_lateral_raise: "Cable Lateral Raise",
        lat_pulldown: "Lat Pulldown / Lat Pull Down",
        assisted_pullup_machine: "Assisted Pull-Up Machine",
        pull_up: "Pull-Up",
        band_pulldown: "Band Lat Pulldown",
        seated_cable_row: "Seated Cable Row",
        seated_row_machine: "Seated Row Machine",
        high_row_machine: "High Row Machine",
        chest_supported_row: "Chest-Supported Row",
        t_bar_row: "T-Bar Row",
        face_pull: "Face Pull",
        rear_delt_fly: "Rear Delt Fly",
        one_arm_dumbbell_row: "One-Arm Dumbbell Row",
        band_row: "Band Row",
        dumbbell_curl: "Dumbbell Curl",
        incline_dumbbell_curl: "Incline DB Curl / Incline Dumbbell Curl",
        cable_curl: "Cable Curl",
        preacher_curl: "Preacher Curl",
        ez_bar_curl: "EZ-Bar Curl",
        reverse_ez_bar_curl: "Reverse EZ-Bar Curl",
        bicep_curl_machine: "Bicep Machine / Biceps Curl Machine",
        triceps_pushdown: "Cable Pushdown / Triceps Pushdown",
        dip: "Dip",
        overhead_triceps_extension: "Overhead Triceps Extension",
        plank: "Plank",
        dead_bug: "Dead Bug",
        ab_crunch_machine: "Ab Crunch Machine",
        back_extension: "Back Extension",
        hack_squat_machine: "Hack Squat",
        trap_bar_deadlift: "Trap Bar Deadlift",
        kettlebell_swing: "Kettlebell Swing",
        leg_extension_machine: "Leg Extension",
        seated_leg_curl: "Leg Curl / Seated Leg Curl",
        standing_calf_raise: "Standing Calf Raise",
        glute_drive_machine: "Glute Drive Machine",
        hip_abduction_machine: "Hip Abduction Machine",
        hip_adduction_machine: "Hip Adduction Machine",
        treadmill_incline_walk: "Incline Treadmill Walk",
        elliptical_easy: "Easy Elliptical",
        stair_climber_easy: "Easy Stair Climber",
        bike_easy: "Easy Bike",
        rower_easy: "Easy Row",
        sled_push: "Sled Push"
      }[id] || id;
    }

    function bilingualNameMarkup(zh, en, strong = false) {
      const primary = strong ? `<strong>${esc(zh)}</strong>` : `<span>${esc(zh)}</span>`;
      return `${primary}<div class="mini-text dual-name-english">${esc(en)}</div>`;
    }

    function equipmentDisplayText(id) {
      return `${equipmentLabel(id)} / ${equipmentEnglishLabel(id)}`;
    }

    function equipmentFamilyLabel(id) {
      return {
        free_weight: "自由重量",
        rack_support: "支架 / 长椅",
        cable_station: "绳索 / 滑轮",
        fixed_machine: "固定器械",
        bodyweight_station: "自重 / 辅助",
        accessories: "附件 / 地面",
        conditioning: "有氧 / 体能"
      }[equipmentFamily(id)] || "通用器械";
    }

    function equipmentFamily(id) {
      return {
        barbell: "free_weight",
        dumbbell: "free_weight",
        kettlebell: "free_weight",
        trap_bar: "free_weight",
        squat_rack: "rack_support",
        bench: "rack_support",
        smith: "fixed_machine",
        cable: "cable_station",
        lat_pulldown: "cable_station",
        seated_row_machine: "fixed_machine",
        leg_press: "fixed_machine",
        hack_squat: "fixed_machine",
        leg_extension: "fixed_machine",
        leg_curl: "fixed_machine",
        calf_raise: "fixed_machine",
        pec_deck: "fixed_machine",
        chest_press_machine: "fixed_machine",
        incline_press_machine: "fixed_machine",
        shoulder_press_machine: "fixed_machine",
        ez_bar: "free_weight",
        bicep_curl_machine: "fixed_machine",
        high_row_machine: "fixed_machine",
        t_bar_row_station: "fixed_machine",
        pullup_bar: "bodyweight_station",
        dip_station: "bodyweight_station",
        assisted_pullup: "bodyweight_station",
        landmine: "rack_support",
        glute_drive: "fixed_machine",
        hip_abduction: "fixed_machine",
        hip_adduction: "fixed_machine",
        preacher_bench: "rack_support",
        back_extension: "fixed_machine",
        ab_machine: "fixed_machine",
        bands: "accessories",
        suspension_trainer: "accessories",
        mat: "accessories",
        treadmill: "conditioning",
        elliptical: "conditioning",
        stair_climber: "conditioning",
        bike: "conditioning",
        rower: "conditioning",
        sled: "conditioning"
      }[id] || "fixed_machine";
    }

    return {
      esc,
      equipmentLabel,
      tag,
      fmt,
      numUnit,
      trendLabel,
      deltaLabel,
      volumeLabel,
      qualityLabel,
      romLabel,
      targetFeelLabel,
      limiterLabel,
      sideIssueLabel,
      advicePriorityType,
      adviceSortScore,
      advicePriorityLabel,
      renderEvidenceList,
      renderRecommendationItems,
      equipmentEnglishLabel,
      exerciseEnglishName,
      bilingualNameMarkup,
      equipmentDisplayText,
      equipmentFamilyLabel
    };
  }

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  window.FitnessApp = window.FitnessApp || {};
  window.FitnessApp.DisplayFormatters = {
    create
  };
})();
