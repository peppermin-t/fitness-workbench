(() => {
  "use strict";

  const STORAGE_KEY = "fitness-coach-workbench-v1";
  const D = window.FitnessData;
  const P = window.FitnessCore.Rules;
  const M = window.FitnessCore.StateNormalizer;
  const DesktopStorage = window.FitnessCore.DesktopStorage;
  const AppStateStore = window.FitnessCore.AppStateStore;
  const DataPortability = window.FitnessApp.DataPortability;
  const LineChart = window.FitnessApp.LineChart;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const clone = (v) => JSON.parse(JSON.stringify(v));
  let parsedGoalDraft = null;
  let weeklyReviewDraft = null;
  const storeContext = {
    storageKey: STORAGE_KEY,
    fitnessData: D,
    normalizer: M,
    desktopStorage: DesktopStorage
  };
  let state = loadState();

  const viewMeta = {
    today: ["今日训练", "选择当前健身房，查看今天可执行的训练安排和反馈入口。"],
    goals: ["目标设定", "用自然语言录入目标，系统解析后纳入计划制定。"],
    gyms: ["健身房", "维护不同场地的器械条件，方便出差时生成可执行方案。"],
    metrics: ["身体指标", "记录体重、体脂、骨骼肌等，按时间查看趋势。"],
    nutrition: ["饮食记录", "用自然语言记录饮食，按当前目标判断结构缺口和调整方向。"],
    plan: ["训练计划", "按目标、指标、器械和反馈生成可调整的训练计划。"],
    exercises: ["动作库", "查看动作依赖的器械、替代动作和示例链接。"],
    coach: ["智能教练", "查看训练反馈触发的优化建议和计划调整记录。"],
    data: ["导入导出", "备份本地数据，导入教练计划表格。"]
  };

  document.addEventListener("DOMContentLoaded", () => {
    bindEvents();
    renderAll();
    hydrateDesktopState();
  });

  function defaultState() {
    return AppStateStore.createDefaultState(storeContext);
  }

  function loadState() {
    return AppStateStore.loadLocalState(storeContext);
  }

  function prepareState(data) {
    return AppStateStore.prepareState(data, storeContext);
  }

  function normalizeState(next) {
    return AppStateStore.normalizeState(next, storeContext);
  }

  function saveState() {
    state = AppStateStore.saveLocalState(state, storeContext);
    persistDesktopState();
  }

  async function hydrateDesktopState() {
    await AppStateStore.hydrateDesktopState(state, storeContext, {
      onHydrated(next) {
        state = next;
        renderAll();
      },
      onError(error) {
        console.warn("Desktop SQLite load failed.", error);
      },
      onPersistError(error) {
        console.warn("Desktop SQLite save failed.", error);
      }
    });
  }

  function persistDesktopState() {
    AppStateStore.persistDesktopState(state, storeContext, {
      onError(error) {
        console.warn("Desktop SQLite save failed.", error);
      }
    });
  }

  function bindEvents() {
    $$(".nav-button").forEach((b) => b.addEventListener("click", () => switchView(b.dataset.view)));
    $("#current-gym-select").addEventListener("change", (e) => {
      state.currentGymId = e.target.value;
      saveState();
      renderAll();
      toast("已切换当前健身房，动作替代范围已更新。");
    });
    $("#today-generate-plan").addEventListener("click", () => generatePlan());
    $("#generate-plan-btn").addEventListener("click", () => generatePlan());
    $("#export-plan-csv").addEventListener("click", exportPlanCsv);
    $("#import-plan-csv-input").addEventListener("change", importPlanCsv);
    $("#session-form").addEventListener("submit", saveSessionFeedback);
    $("#parse-goal-btn").addEventListener("click", () => {
      parsedGoalDraft = P.parseGoal($("#goal-text").value);
      renderParsedGoal();
    });
    $("#save-goal-btn").addEventListener("click", saveGoal);
    $("#gym-form").addEventListener("submit", saveGym);
    $("#metric-date").value = todayIso();
    $("#metric-form").addEventListener("submit", saveMetric);
    $("#nutrition-date").value = todayIso();
    $("#nutrition-form").addEventListener("submit", saveNutritionLog);
    $("#exercise-log-form").addEventListener("submit", saveExerciseLog);
    $("#exercise-history-filter").addEventListener("change", renderExerciseHistory);
    $("#exercise-search").addEventListener("input", renderExerciseList);
    $("#export-json").addEventListener("click", exportJson);
    $("#import-json").addEventListener("change", importJson);
    $("#reset-data").addEventListener("click", resetData);
    $("#today-plan-day-select").addEventListener("change", () => {
      renderTodayWorkout();
      renderExerciseLogSelect();
      renderTrainingReminders();
    });
    document.addEventListener("click", handleClick);
  }

  function switchView(view) {
    $$(".nav-button").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
    $$(".view").forEach((s) => s.classList.toggle("active", s.id === `view-${view}`));
    const meta = viewMeta[view] || viewMeta.today;
    $("#view-title").textContent = meta[0];
    $("#view-subtitle").textContent = meta[1];
    if (view === "metrics") drawMetricChart();
    if (view === "nutrition") drawNutritionChart();
  }

  function renderAll() {
    renderStatus();
    renderGymSelect();
    renderCurrentGymSummary();
    renderTodayAdvice();
    renderTodayPlanSelect();
    renderTrainingReminders();
    renderTodayWorkout();
    renderExerciseLogSelect();
    renderExerciseLogList();
    renderExerciseHistoryFilter();
    renderExerciseHistory();
    renderEquipmentChecklist();
    renderEquipmentLibrary();
    renderGymList();
    renderParsedGoal();
    renderGoalsList();
    renderMetrics();
    renderNutritionList();
    renderNutritionReminders();
    renderPlan();
    renderExerciseList();
    renderCoach();
    renderDataSummary();
  }

  function renderStatus() {
    const gym = currentGym();
    const goal = currentGoal();
    $("#status-gym").textContent = `健身房：${gym ? gym.name : "未选择"}`;
    $("#status-goal").textContent = `目标：${goal ? goal.parsed.primaryGoalLabel : "未设定"}`;
  }

  function renderGymSelect() {
    $("#current-gym-select").innerHTML = state.gyms.map((g) => `<option value="${esc(g.id)}"${g.id === state.currentGymId ? " selected" : ""}>${esc(g.name)}</option>`).join("");
  }

  function renderCurrentGymSummary() {
    const gym = currentGym();
    $("#current-gym-summary").innerHTML = gym ? `
      <div><strong>${esc(gym.name)}</strong></div>
      <div class="mini-text">${esc(gym.location || "无地点备注")}</div>
      <div class="tag-row">${gym.equipment.map((id) => tag(equipmentLabel(id))).join("")}</div>
    ` : `<p class="empty">还没有健身房，请先添加。</p>`;
  }

  function renderTodayAdvice() {
    const goal = currentGoal();
    const gym = currentGym();
    const latest = latestMetric();
    const trend = P.metricTrend(state.metrics, "weight", 30);
    const session = latestCompletedSession();
    const summary = [];
    const linkedSignals = P.buildIntegratedSignals({
      goal,
      metrics: state.metrics,
      sessions: state.sessions,
      exerciseLogs: state.exerciseLogs,
      nutritionLogs: state.nutritionLogs
    });
    summary.push(goal ? `当前目标：${goal.parsed.primaryGoalLabel}${goal.parsed.secondaryGoalLabel ? ` + ${goal.parsed.secondaryGoalLabel}` : ""}。` : "先在“目标设定”里录入当前目标，计划会更贴合。");
    if (gym) summary.push(`当前场地：${gym.name}，可用器械 ${gym.equipment.length} 类。`);
    if (gym?.equipment.length <= 5) summary.push("器械范围较少，生成计划时会优先使用哑铃、自重、弹力带和有氧替代。");
    if (latest) summary.push(`最近身体数据：${latest.date}，体重 ${fmt(latest.weight, "kg")}，体脂 ${fmt(latest.bodyFat, "%")}，骨骼肌 ${fmt(latest.skeletalMuscle, "kg")}。`);
    if (trend && goal?.parsed.primaryGoal === "fat_loss" && trend.delta > 0.3) summary.push(`近 30 天体重上升 ${trend.delta.toFixed(1)}kg，减脂计划中建议增加有氧或检查饮食记录。`);
    if (session) summary.push(`最近训练完成度 ${session.completion}%、RPE ${session.rpe}、疼痛 ${session.painScore}/5。`);
    if (!state.plan) summary.push("还没有训练计划，可以先点击“生成/刷新计划”。");
    $("#today-advice").innerHTML = `
      <div class="context-box">
        <div><strong>今日概况</strong></div>
        ${renderEvidenceList(summary)}
      </div>
      ${linkedSignals.length ? `<div class="context-box" style="margin-top:14px;"><div><strong>联动信号</strong></div>${renderRecommendationItems(linkedSignals)}</div>` : ""}
    `;
  }

  function renderTrainingReminders() {
    const el = $("#training-reminders");
    if (!el) return;
    if (!state.plan?.days?.length) {
      el.innerHTML = `<div class="context-box"><div><strong>训练前提醒</strong></div><div class="mini-text">生成计划后，这里会结合长期画像和联动判断给出训练前提醒。</div></div>`;
      return;
    }
    const dayIndex = Number($("#today-plan-day-select")?.value || 0);
    const day = state.plan.days[dayIndex] || state.plan.days[0];
    const reminders = P.buildTrainingReminders({
      goal: currentGoal(),
      metrics: state.metrics || [],
      sessions: state.sessions || [],
      exerciseLogs: state.exerciseLogs || [],
      nutritionLogs: state.nutritionLogs || [],
      day
    });
    el.innerHTML = `
      <div class="context-box">
        <div><strong>训练前提醒</strong></div>
        ${reminders.length ? renderRecommendationItems(reminders.slice(0, 4)) : `<div class="mini-text" style="margin-top:8px;">当前没有额外的训练前提醒，按计划执行并继续记录即可。</div>`}
      </div>
    `;
  }

  function renderTodayPlanSelect() {
    const select = $("#today-plan-day-select");
    select.innerHTML = state.plan?.days?.length
      ? state.plan.days.map((d, i) => `<option value="${i}">第 ${i + 1} 天：${esc(d.focus)}</option>`).join("")
      : `<option value="">暂无计划</option>`;
  }

  function renderTodayWorkout() {
    const el = $("#today-workout");
    if (!state.plan?.days?.length) {
      el.innerHTML = `<div class="context-box empty">暂无计划。点击“生成/刷新计划”后，这里会显示今日训练。</div>`;
      return;
    }
    const index = Number($("#today-plan-day-select").value || 0);
    el.innerHTML = renderWorkoutDay(state.plan.days[index] || state.plan.days[0], index, true);
  }

  function renderGoalsList() {
    $("#goals-list").innerHTML = state.goals.length ? `<div class="item-list">${state.goals.map((g) => `
      <article class="list-item"><div class="list-item-header"><div>
        <h3>${esc(g.parsed.primaryGoalLabel)}</h3><p class="mini-text">${esc(g.text)}</p>
        <div class="tag-row">
          ${g.id === state.currentGoalId ? tag("当前目标", "success") : ""}
          ${g.parsed.secondaryGoalLabel ? tag(g.parsed.secondaryGoalLabel, "info") : ""}
          ${tag(`每周 ${g.parsed.trainingDaysPerWeek || 3} 次`)}
          ${tag(`每次 ${g.parsed.sessionDurationMinutes || 60} 分钟`)}
          ${g.parsed.frequentTravel ? tag("出差较多", "warn") : ""}
          ${g.parsed.targetWeight ? tag(`目标体重 ${g.parsed.targetWeight}kg`) : ""}
        </div>
      </div><div class="item-actions">
        <button class="button" data-action="set-goal" data-id="${esc(g.id)}">设为当前</button>
        <button class="button danger" data-action="delete-goal" data-id="${esc(g.id)}">删除</button>
      </div></div></article>`).join("")}</div>` : `<p class="empty">暂无保存目标。</p>`;
  }

  function renderMetrics() {
    const sorted = P.sortedMetrics(state.metrics);
    const el = $("#metric-list");
    if (!sorted.length) {
      el.innerHTML = `<p class="empty">暂无身体指标。先录入一次体重/体脂/骨骼肌。</p>`;
      drawMetricChart();
      return;
    }
    const latest = sorted.at(-1);
    el.innerHTML = `
      <div class="metric-grid">
        <div class="metric-pill"><span>最近体重</span><strong>${fmt(latest.weight, "kg")}</strong></div>
        <div class="metric-pill"><span>近30天体重</span><strong>${trendLabel(P.metricTrend(state.metrics, "weight", 30), "kg")}</strong></div>
        <div class="metric-pill"><span>近30天体脂</span><strong>${trendLabel(P.metricTrend(state.metrics, "bodyFat", 30), "%")}</strong></div>
        <div class="metric-pill"><span>近30天骨骼肌</span><strong>${trendLabel(P.metricTrend(state.metrics, "skeletalMuscle", 30), "kg")}</strong></div>
      </div>
      <div class="table-wrap" style="margin-top:14px;"><table><thead><tr><th>日期</th><th>体重</th><th>体脂</th><th>骨骼肌</th><th>腰围</th><th>备注</th><th>操作</th></tr></thead><tbody>
      ${sorted.slice().reverse().map((m) => `<tr><td>${esc(m.date)}</td><td>${fmt(m.weight, "kg")}</td><td>${fmt(m.bodyFat, "%")}</td><td>${fmt(m.skeletalMuscle, "kg")}</td><td>${fmt(m.waist, "cm")}</td><td>${esc(m.notes || "")}</td><td><button class="button danger" data-action="delete-metric" data-id="${esc(m.id)}">删除</button></td></tr>`).join("")}
      </tbody></table></div>`;
    drawMetricChart();
  }

  function renderPlan() {
    const context = $("#plan-context");
    const table = $("#plan-table");
    if (!state.plan) {
      context.innerHTML = `<p class="empty">暂无计划。点击“生成计划”会按当前目标、身体指标和健身房器械生成。</p>`;
      table.innerHTML = "";
      return;
    }
    context.innerHTML = `<div><strong>生成时间：</strong>${esc(state.plan.generatedAt)}</div><div><strong>目标：</strong>${esc(state.plan.context.goalLabel)}</div><div><strong>健身房：</strong>${esc(state.plan.context.gymName)}</div><div><strong>身体指标：</strong>${esc(state.plan.context.metricSummary)}</div><div class="tag-row">${state.plan.context.notes.map((n) => tag(n, "info")).join("")}</div>`;
    table.innerHTML = state.plan.days.map((d, i) => renderWorkoutDay(d, i, false)).join("");
  }

  function renderWorkoutDay(day, dayIndex) {
    return `<div class="day-block"><div class="day-header"><div><h3>第 ${dayIndex + 1} 天：${esc(day.focus)}</h3><p class="mini-text">${esc(day.intent)}</p></div>${tag(`${day.exercises.length} 个动作`)}</div><div class="table-wrap"><table><thead><tr><th>动作</th><th>组数</th><th>次数/时长</th><th>重量</th><th>RPE</th><th>休息</th><th>备注/替代</th><th>示例</th></tr></thead><tbody>${day.exercises.map((row, rowIndex) => renderPlanRow(row, dayIndex, rowIndex)).join("")}</tbody></table></div></div>`;
  }

  function renderDataSummary() {
    $("#data-summary").innerHTML = `<div>健身房：${state.gyms.length} 个</div><div>动作：${state.exercises.length} 个</div><div>目标：${state.goals.length} 条</div><div>身体指标：${state.metrics.length} 条</div><div>训练记录：${state.sessions.length} 条</div><div>动作级反馈：${(state.exerciseLogs || []).length} 条</div><div>饮食记录：${(state.nutritionLogs || []).length} 条</div><div>智能建议：${state.advice.length} 条</div>`;
  }

  function saveGoal() {
    const text = $("#goal-text").value.trim();
    if (!text) return toast("请先输入目标描述。");
    const parsed = parsedGoalDraft?.rawText === text ? parsedGoalDraft : P.parseGoal(text);
    const goal = { id: uid("goal"), text, parsed, createdAt: nowLabel() };
    state.goals.unshift(goal);
    state.currentGoalId = goal.id;
    parsedGoalDraft = parsed;
    saveState();
    renderAll();
    toast("目标已保存，并设为当前目标。");
  }

  function saveGym(event) {
    event.preventDefault();
    const name = $("#gym-name").value.trim();
    if (!name) return toast("请填写健身房名称。");
    const equipment = $$("#equipment-checklist input:checked").map((x) => x.value);
    const gym = { id: uid("gym"), name, location: $("#gym-location").value.trim(), equipment };
    state.gyms.unshift(gym);
    state.currentGymId = gym.id;
    $("#gym-form").reset();
    saveState();
    renderAll();
    toast("健身房已保存，并设为当前场地。");
  }

  function deleteGym(id) {
    if (state.gyms.length <= 1) return toast("至少保留一个健身房。");
    state.gyms = state.gyms.filter((x) => x.id !== id);
    if (state.currentGymId === id) state.currentGymId = state.gyms[0]?.id || null;
    saveState();
    renderAll();
    toast("健身房已删除。");
  }

  function deleteGoal(id) {
    state.goals = state.goals.filter((x) => x.id !== id);
    if (state.currentGoalId === id) state.currentGoalId = state.goals[0]?.id || null;
    saveState();
    renderAll();
    toast("目标已删除。");
  }

  function saveMetric(event) {
    event.preventDefault();
    const metric = {
      id: uid("metric"),
      date: $("#metric-date").value || todayIso(),
      weight: num($("#metric-weight").value),
      bodyFat: num($("#metric-bodyfat").value),
      skeletalMuscle: num($("#metric-muscle").value),
      waist: num($("#metric-waist").value),
      notes: $("#metric-notes").value.trim(),
      createdAt: nowLabel()
    };
    if ([metric.weight, metric.bodyFat, metric.skeletalMuscle, metric.waist].every((x) => x === null)) return toast("至少填写一个身体指标。");
    state.metrics.push(metric);
    state.metrics = P.sortedMetrics(state.metrics);
    $("#metric-form").reset();
    $("#metric-date").value = todayIso();
    saveState();
    renderAll();
    toast("身体指标已保存。");
  }

  function deleteMetric(id) {
    state.metrics = state.metrics.filter((x) => x.id !== id);
    saveState();
    renderAll();
    toast("身体指标已删除。");
  }

  function generatePlan() {
    const gym = currentGym();
    if (!gym) return toast("请先添加并选择健身房。");
    const goal = currentGoal();
    state.plan = P.generatePlan({ gym, goal, metrics: state.metrics, exercises: state.exercises, nowLabel, uid });
    state.advice.unshift({ id: uid("advice"), createdAt: nowLabel(), title: "已生成训练计划", body: `计划已按“${state.plan.context.goalLabel}”、当前健身房“${state.plan.context.gymName}”和最近身体指标生成。替代动作会优先在当前器械范围内选择。`, tags: ["计划生成", state.plan.context.gymName, state.plan.context.goalLabel] });
    saveState();
    renderAll();
    toast("训练计划已生成。");
  }

  function saveSessionFeedback(event) {
    event.preventDefault();
    if (!state.plan?.days?.length) return toast("请先生成训练计划。");
    const dayIndex = Number($("#today-plan-day-select").value || 0);
    const day = state.plan.days[dayIndex];
    const session = getOrCreateWorkoutSession(dayIndex, day);
    Object.assign(session, {
      completedAt: nowLabel(),
      status: "completed",
      completion: clamp(Number($("#log-completion").value || 0), 0, 100),
      rpe: clamp(Number($("#log-rpe").value || 0), 1, 10),
      painScore: clamp(Number($("#log-pain-score").value || 0), 0, 5),
      painArea: $("#log-pain-area").value.trim(),
      sleep: clamp(Number($("#log-sleep").value || 0), 1, 5),
      fatigue: clamp(Number($("#log-fatigue").value || 0), 1, 5),
      notes: $("#log-notes").value.trim()
    });
    moveSessionToFront(session.id);
    state.feedback.unshift({ ...session, type: "post_workout" });
    const result = P.createAdviceFromSession({ session, day, nowLabel, uid });
    state.advice.unshift(...result.advice);
    state.revisions.unshift(...result.revisions);
    $("#session-form").reset();
    $("#log-completion").value = 100;
    $("#log-rpe").value = 7;
    $("#log-pain-score").value = 0;
    $("#log-sleep").value = 3;
    $("#log-fatigue").value = 3;
    saveState();
    renderAll();
    switchView("coach");
    toast("反馈已保存，智能教练已生成建议。");
  }

  function saveExerciseLog(event) {
    event.preventDefault();
    const exerciseId = $("#exercise-log-exercise").value;
    const exercise = getExercise(exerciseId);
    if (!exercise) return toast("请先生成计划并选择动作。");
    const dayIndex = Number($("#today-plan-day-select").value || 0);
    const day = state.plan?.days?.[dayIndex];
    const plannedRow = day?.exercises?.find((row) => row.exerciseId === exerciseId);
    const session = getOrCreateWorkoutSession(dayIndex, day);
    const log = {
      id: uid("exercise_log"),
      date: todayIso(),
      createdAt: nowLabel(),
      sessionId: session.id,
      exerciseId,
      exerciseName: exercise.name,
      dayIndex,
      focus: day?.focus || "",
      plannedSets: plannedRow?.sets || "",
      plannedReps: plannedRow?.reps || "",
      plannedLoad: plannedRow?.load || "",
      plannedRpe: plannedRow?.rpe || "",
      actualLoad: $("#exercise-log-load").value.trim(),
      actualReps: $("#exercise-log-reps").value.trim(),
      rpe: clamp(Number($("#exercise-log-rpe").value || 0), 1, 10),
      quality: $("#exercise-log-quality").value,
      rangeOfMotion: $("#exercise-log-rom").value,
      targetMuscleFeel: $("#exercise-log-target-feel").value,
      limitingFactor: $("#exercise-log-limiter").value,
      sideIssue: $("#exercise-log-side").value,
      painScore: clamp(Number($("#exercise-log-pain-score").value || 0), 0, 5),
      painArea: $("#exercise-log-pain-area").value.trim(),
      freeText: $("#exercise-log-feedback").value.trim()
    };
    log.sets = parseSetLogs($("#exercise-log-sets")?.value, log.actualLoad, log.actualReps, log.rpe);
    Object.assign(log, buildTrainingStatsForLog(log, state.exerciseLogs || []));
    log.analysis = P.analyzeExerciseFeedback(log, exercise);
    state.exerciseLogs = state.exerciseLogs || [];
    state.exerciseLogs.unshift(log);
    session.exerciseLogIds = Array.isArray(session.exerciseLogIds) ? session.exerciseLogIds : [];
    if (!session.exerciseLogIds.includes(log.id)) session.exerciseLogIds.push(log.id);
    moveSessionToFront(session.id);
    state.advice.unshift({
      id: uid("advice"),
      createdAt: nowLabel(),
      title: `${exercise.name} 动作反馈建议`,
      body: log.analysis.recommendations.join(" "),
      tags: log.analysis.tags.map((item) => item.tag),
      priority: log.analysis.priority,
      priorityLabel: log.analysis.priorityLabel,
      evidence: log.analysis.evidence || [],
      recommendationItems: log.analysis.recommendationItems || []
    });
    $("#exercise-log-form").reset();
    $("#exercise-log-rpe").value = 7;
    $("#exercise-log-pain-score").value = 0;
    saveState();
    renderAll();
    toast("动作级反馈已保存，并生成动作建议。");
  }

  function deleteExerciseLog(id) {
    state.exerciseLogs = (state.exerciseLogs || []).filter((x) => x.id !== id);
    saveState();
    renderAll();
    toast("动作级反馈已删除。");
  }

  function deleteNutritionLog(id) {
    state.nutritionLogs = (state.nutritionLogs || []).filter((x) => x.id !== id);
    saveState();
    renderAll();
    toast("饮食记录已删除。");
  }

  function replaceExercise(dayIndex, rowIndex, exerciseId) {
    const row = state.plan?.days?.[dayIndex]?.exercises?.[rowIndex];
    const next = getExercise(exerciseId);
    if (!row || !next) return;
    const old = getExercise(row.exerciseId);
    row.exerciseId = next.id;
    row.notes = `已从 ${old?.name || "原动作"} 替换为 ${next.name}，以适配当前健身房器械。`;
    state.revisions.unshift({ id: uid("rev"), createdAt: nowLabel(), status: "applied", summary: `替换动作：${old?.name || "原动作"} -> ${next.name}`, reason: `当前健身房器械条件更适合执行 ${next.name}。`, tags: ["动作替代", currentGym()?.name || "当前场地"], patch: { type: "manual_replace", dayIndex, rowIndex, exerciseId } });
    saveState();
    renderAll();
    toast("动作已替换并记录原因。");
  }

  function drawMetricChart() {
    const canvas = $("#metric-chart");
    const data = P.sortedMetrics(state.metrics);
    LineChart.draw(canvas, {
      data,
      emptyText: "至少录入两次身体指标后显示趋势。",
      emptyY: 160,
      gridStep: 55,
      series: [
        { field: "weight", color: "#2f7d57", label: "体重 kg", legendX: 52 },
        { field: "bodyFat", color: "#b85c27", label: "体脂 %", legendX: 150 },
        { field: "skeletalMuscle", color: "#2e6f9e", label: "骨骼肌 kg", legendX: 248 }
      ]
    });
  }

  function exportPlanCsv() {
    if (!state.plan) return toast("暂无计划可导出。");
    const csv = DataPortability.buildPlanCsv(state.plan, (exerciseId) => getExercise(exerciseId)?.name);
    DataPortability.downloadFile(`training-plan-${todayIso()}.csv`, csv, "text/csv;charset=utf-8");
  }

  function importPlanCsv(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const days = DataPortability.parsePlanCsv(String(reader.result || ""), findOrCreateExercise);
      state.plan = { id: uid("plan"), generatedAt: nowLabel(), context: P.generatePlan({ gym: currentGym(), goal: currentGoal(), metrics: state.metrics, exercises: state.exercises, nowLabel, uid }).context, days };
      saveState();
      renderAll();
      event.target.value = "";
      toast("计划 CSV 已导入。");
    };
    reader.readAsText(file, "utf-8");
  }

  function exportJson() {
    state = normalizeState(state);
    DataPortability.downloadFile(`fitness-workbench-backup-${todayIso()}.json`, DataPortability.buildBackupJson(state), "application/json;charset=utf-8");
  }

  function importJson(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        state = prepareState(DataPortability.parseBackupJson(reader.result));
        saveState();
        renderAll();
        toast("JSON 备份已导入。");
      } catch {
        toast("JSON 解析失败，请检查文件。");
      }
      event.target.value = "";
    };
    reader.readAsText(file, "utf-8");
  }

  function resetData() {
    if (!confirm("确认恢复初始数据？当前本地记录会被覆盖。")) return;
    state = defaultState();
    parsedGoalDraft = null;
    saveState();
    renderAll();
    toast("已恢复初始数据。");
  }

  function findOrCreateExercise(name) {
    const found = state.exercises.find((x) => x.name === name);
    if (found) return found.id;
    const id = uid("custom_exercise");
    state.exercises.push({ id, name, pattern: "自定义", muscles: ["待补充"], equipment: [], substitutes: [], cue: "从 CSV 导入的自定义动作，请后续补充器械依赖。", risk: "尚未录入注意事项。", links: [{ label: "YouTube 搜索", url: `https://www.youtube.com/results?search_query=${encodeURIComponent(name)}` }] });
    return id;
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

  function buildExerciseHistorySummary(logs) {
    const count = logs.length;
    if (!count) {
      return {
        count: 0,
        avgRpe: "-",
        poorCount: 0,
        painCount: 0,
        totalVolumeLoad: 0,
        totalHardSets: 0,
        prCount: 0,
        topTags: [],
        stage1Conclusion: "还没有动作反馈数据。"
      };
    }
    const avgRpe = (logs.reduce((sum, log) => sum + Number(log.rpe || 0), 0) / count).toFixed(1);
    const poorCount = logs.filter((log) => log.quality === "poor").length;
    const painCount = logs.filter((log) => Number(log.painScore) >= 3).length;
    const totalVolumeLoad = logs.reduce((sum, log) => sum + Number(log.volumeLoad || 0), 0);
    const totalHardSets = logs.reduce((sum, log) => sum + Number(log.hardSets || 0), 0);
    const prCount = logs.filter((log) => log.simplePr?.isPr).length;
    const tagCounts = {};
    logs.forEach((log) => {
      (log.analysis?.tags || []).forEach((item) => {
        tagCounts[item.tag] = (tagCounts[item.tag] || 0) + 1;
      });
    });
    const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const stage1Conclusion = inferStage1Conclusion(logs, topTags, poorCount, painCount);
    return { count, avgRpe, poorCount, painCount, totalVolumeLoad, totalHardSets, prCount, topTags, stage1Conclusion };
  }

  function inferStage1Conclusion(logs, topTags, poorCount, painCount) {
    const recent = logs.slice(0, 3);
    const tags = topTags.map(([issueTag]) => issueTag);
    if (painCount > 0 || tags.includes("pain_risk")) return "该动作已有疼痛风险记录，阶段 1 建议先解决风险和技术，再考虑进阶。";
    if (tags.includes("grip_limiting")) return "该动作的主要短板是握力/小臂限制，阶段 1 已经定位到限制因素，下一步应优先验证替代动作或助力带是否有效。";
    if (tags.includes("poor_target_muscle_feel")) return "该动作的主要问题是目标肌肉感觉不稳定，阶段 1 建议先降低重量、加停顿或激活动作。";
    if (tags.includes("left_weaker") || tags.includes("right_weaker")) return "该动作存在明显左右差异，阶段 1 应以弱侧高质量完成度为标准继续记录。";
    if (tags.includes("reduced_rom_late") || tags.includes("technique_breakdown")) return "该动作主要问题是后程质量和技术稳定性，阶段 1 已能稳定回看并定位问题。";
    if (poorCount === 0 && recent.every((log) => Number(log.painScore) <= 1 && Number(log.rpe) <= 8)) return "该动作近期记录较稳定，阶段 1 的动作级反馈闭环已基本跑通。";
    return "该动作已有可回看的结构化历史，阶段 1 已完成基础闭环，继续积累数据后再进入更强联动。";
  }

  function renderNutritionList() {
    const summaryEl = $("#nutrition-summary");
    const listEl = $("#nutrition-list");
    if (!listEl) return;
    const logs = (state.nutritionLogs || []).slice();
    const profile = P.buildNutritionProfile(logs, currentGoal());
    if (summaryEl) {
      if (!logs.length) {
        summaryEl.innerHTML = "";
      } else {
        summaryEl.innerHTML = `
          <div class="metric-grid">
            <div class="metric-pill"><span>近期待均热量</span><strong>${numUnit(profile.averages?.calories, "kcal")}</strong></div>
            <div class="metric-pill"><span>近期待均蛋白</span><strong>${numUnit(profile.averages?.protein, "g")}</strong></div>
            <div class="metric-pill"><span>蛋白缺口天数</span><strong>${profile.lowProteinDays || 0}/${profile.count || 0}</strong></div>
            <div class="metric-pill"><span>漏餐天数</span><strong>${profile.missedMealDays || 0}/${profile.count || 0}</strong></div>
          </div>
          <div class="context-box" style="margin-top:14px;">
            <div class="tag-row">${(profile.topTags || []).map(([issueTag, count]) => tag(`${issueTag} ×${count}`, "info")).join("")}</div>
            <div>${esc((profile.advice || []).join(" "))}</div>
          </div>
        `;
      }
    }
    if (!logs.length) {
      listEl.innerHTML = `<p class="empty">暂无饮食记录。输入自然语言饮食描述后，这里会显示解析结果、估算和趋势。</p>`;
      drawNutritionChart();
      return;
    }
    const mealLabel = { breakfast: "早餐", lunch: "午餐", dinner: "晚餐", snack: "加餐", all_day: "全天" };
    const recentLogs = logs.slice(0, 12);
    listEl.innerHTML = `<div class="item-list">${recentLogs.map((log) => `
      <article class="list-item">
        <div class="list-item-header">
          <div>
            <h3>${esc(log.date)} 饮食记录</h3>
            <p class="mini-text">置信度：${esc(log.analysis.confidence)} · ${esc(log.rawText)}</p>
            <div class="metric-grid" style="margin-top:10px;">
              <div class="metric-pill"><span>热量估算</span><strong>${numUnit(log.analysis.estimates?.total?.calories, "kcal")}</strong></div>
              <div class="metric-pill"><span>蛋白估算</span><strong>${numUnit(log.analysis.estimates?.total?.protein, "g")}</strong></div>
              <div class="metric-pill"><span>碳水估算</span><strong>${numUnit(log.analysis.estimates?.total?.carbs, "g")}</strong></div>
              <div class="metric-pill"><span>脂肪估算</span><strong>${numUnit(log.analysis.estimates?.total?.fat, "g")}</strong></div>
            </div>
            <div class="tag-row">${tag(advicePriorityLabel(log.analysis.priority, log.analysis.priorityLabel), advicePriorityType(log.analysis.priority))}${(log.analysis.tags || []).map((item) => tag(item, "info")).join("")}</div>
            ${(log.analysis.missingInfo || []).length ? `<p class="mini-text" style="margin-top:8px;">补充信息：${esc(log.analysis.missingInfo.join(" "))}</p>` : ""}
            <div style="margin-top:10px;">
              ${(log.analysis.meals || []).map((meal) => `
                <div class="compact-list" style="margin-top:8px;">
                  <strong>${esc(mealLabel[meal.meal] || meal.meal)}</strong>
                  <div>${esc(meal.text)}</div>
                  ${(meal.items || []).length ? `<div class="mini-text">食物项：${esc(meal.items.map((item) => `${item.label}${item.quantity ? ` ${item.quantity}${item.unit}` : ""}`).join("、"))}</div>` : ""}
                  <div class="mini-text">估算：${numUnit(meal.estimates?.calories, "kcal")} · 蛋白 ${numUnit(meal.estimates?.protein, "g")} · 碳水 ${numUnit(meal.estimates?.carbs, "g")} · 脂肪 ${numUnit(meal.estimates?.fat, "g")}</div>
                  <div class="tag-row">${(meal.tags || []).map((item) => tag(item)).join("")}</div>
                </div>
              `).join("")}
            </div>
            <p class="mini-text" style="margin-top:10px;">${esc((log.analysis.recommendations || []).join(" "))}</p>
            ${log.analysis.evidence?.length ? `<div class="context-box" style="margin-top:10px;"><div><strong>依据</strong></div>${renderEvidenceList(log.analysis.evidence.slice(0, 6))}</div>` : ""}
          </div>
          <button class="button danger" data-action="delete-nutrition-log" data-id="${esc(log.id)}">删除</button>
        </div>
      </article>`).join("")}</div>`;
    drawNutritionChart();
  }

  function renderProfiles() {
    const exerciseEl = $("#exercise-profiles");
    const nutritionEl = $("#nutrition-profiles");
    if (exerciseEl) {
      const profiles = P.buildExerciseProfiles(state.exerciseLogs || []).slice(0, 6);
      exerciseEl.innerHTML = profiles.length ? `<div class="item-list">${profiles.map((profile) => `
        <article class="list-item">
          <div class="list-item-header">
            <div>
              <h3>${esc(profile.exerciseName)}</h3>
              <p class="mini-text">反馈 ${profile.count} 次 · 动作质量差 ${profile.poorQualityCount} 次 · 疼痛风险 ${profile.painCount} 次</p>
              <div class="tag-row">${profile.topTags.map(([issueTag, count]) => tag(`${issueTag} ×${count}`, "info")).join("")}</div>
              <p class="mini-text" style="margin-top:8px;">${esc(profile.advice.join(" "))}</p>
            </div>
          </div>
        </article>
      `).join("")}</div>` : `<p class="empty">动作级反馈还不够多，继续记录后这里会形成长期画像。</p>`;
    }
    if (nutritionEl) {
      const profile = P.buildNutritionProfile(state.nutritionLogs || [], currentGoal());
      nutritionEl.innerHTML = profile.count ? `
        <div class="item-list">
          <article class="list-item">
            <div class="list-item-header">
              <div>
                <h3>近期饮食模式</h3>
                <p class="mini-text">已记录 ${profile.count} 天饮食 · 近期待均蛋白 ${numUnit(profile.averages?.protein, "g")} · 近期待均热量 ${numUnit(profile.averages?.calories, "kcal")}</p>
                <div class="tag-row">${profile.topTags.map(([issueTag, count]) => tag(`${issueTag} ×${count}`, "info")).join("")}</div>
                <p class="mini-text" style="margin-top:8px;">${esc(profile.advice.join(" "))}</p>
                ${profile.trend ? `<p class="mini-text" style="margin-top:8px;">最近 4 次相比前 4 次：蛋白 ${deltaLabel(profile.trend.proteinDelta, "g")} · 热量 ${deltaLabel(profile.trend.caloriesDelta, "kcal")} · 纤维 ${deltaLabel(profile.trend.fiberDelta, "g")}</p>` : ""}
              </div>
            </div>
          </article>
        </div>
      ` : `<p class="empty">饮食记录还不够多，继续记录后这里会形成长期画像。</p>`;
    }
  }

  function saveNutritionLog(event) {
    event.preventDefault();
    const rawText = $("#nutrition-text").value.trim();
    if (!rawText) return toast("请先输入饮食描述。");
    const analysis = P.parseNutritionLog(rawText, currentGoal(), latestMetric());
    const log = {
      id: uid("nutrition"),
      date: $("#nutrition-date").value || todayIso(),
      createdAt: nowLabel(),
      rawText,
      goalId: currentGoal()?.id || null,
      analysis
    };
    state.nutritionLogs = state.nutritionLogs || [];
    state.nutritionLogs.unshift(log);
    state.advice.unshift({
      id: uid("advice"),
      createdAt: nowLabel(),
      title: `${log.date} 饮食建议`,
      body: analysis.recommendations.join(" "),
      tags: ["饮食", analysis.confidence, ...(analysis.tags || []).slice(0, 4)],
      priority: analysis.priority,
      priorityLabel: analysis.priorityLabel,
      evidence: analysis.evidence || [],
      recommendationItems: analysis.recommendationItems || []
    });
    $("#nutrition-form").reset();
    $("#nutrition-date").value = todayIso();
    saveState();
    renderAll();
    switchView("nutrition");
    toast("饮食记录已保存，并生成了饮食建议。");
  }

  function drawNutritionChart() {
    const canvas = $("#nutrition-chart");
    const data = P.buildNutritionTrend(state.nutritionLogs || []);
    LineChart.draw(canvas, {
      data,
      emptyText: "至少记录两天饮食后显示热量和蛋白趋势。",
      emptyY: 150,
      gridStep: 50,
      series: [
        { field: "calories", color: "#b85c27", label: "热量 kcal", legendX: 52 },
        { field: "protein", color: "#2f7d57", label: "蛋白 g", legendX: 160 }
      ]
    });
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

  function renderEquipmentChecklist() {
    $("#equipment-checklist").innerHTML = D.equipment.map((x) => `
      <label class="check-item check-item-text">
        <input type="checkbox" value="${esc(x.id)}" />
        <div class="dual-name">${bilingualNameMarkup(x.label, equipmentEnglishLabel(x.id))}</div>
      </label>
    `).join("");
  }

  function renderEquipmentLibrary() {
    const el = $("#equipment-library");
    if (!el) return;
    el.innerHTML = `<div class="visual-grid">${D.equipment.map((item) => `
      <article class="visual-card">
        <div class="dual-name">${bilingualNameMarkup(item.label, equipmentEnglishLabel(item.id), true)}</div>
        <p class="mini-text">${esc(equipmentFamilyLabel(item.id))}</p>
      </article>
    `).join("")}</div>`;
  }

  function renderExerciseLogSelect() {
    const select = $("#exercise-log-exercise");
    if (!select) return;
    if (!state.plan?.days?.length) {
      select.innerHTML = `<option value="">暂无计划动作</option>`;
      return;
    }
    const dayIndex = Number($("#today-plan-day-select").value || 0);
    const day = state.plan.days[dayIndex] || state.plan.days[0];
    select.innerHTML = day.exercises.map((row) => {
      const ex = getExercise(row.exerciseId);
      return `<option value="${esc(row.exerciseId)}">${esc(ex?.name || row.exerciseId)} / ${esc(exerciseEnglishName(row.exerciseId))}</option>`;
    }).join("");
  }

  function renderPlanRow(row, dayIndex, rowIndex) {
    const ex = getExercise(row.exerciseId);
    if (!ex) return "";
    const gym = currentGym();
    const available = P.isAvailable(ex, gym);
    const subs = P.availableSubstitutes(ex, gym, state.exercises).slice(0, 4);
    return `<tr><td><strong>${esc(ex.name)}</strong><div class="mini-text dual-name-english">${esc(exerciseEnglishName(ex.id))}</div><div class="mini-text">${esc(ex.pattern)} · ${esc(ex.muscles.join(" / "))}</div><div class="tag-row">${tag(available ? "当前场地可做" : "当前场地缺器械", available ? "success" : "warn")}${ex.equipment.map((id) => tag(equipmentDisplayText(id))).join("")}</div></td><td>${esc(row.sets)}</td><td>${esc(row.reps)}</td><td>${esc(row.load || "-")}</td><td>${esc(row.rpe)}</td><td>${esc(row.rest || "-")}</td><td><div class="mini-text">${esc(row.notes || ex.cue)}</div><div class="tag-row">${subs.map((s) => `<button class="button" data-action="replace-exercise" data-day="${dayIndex}" data-row="${rowIndex}" data-exercise-id="${esc(s.id)}">${esc(s.name)}</button>`).join("") || `<span class="mini-text">暂无适配替代</span>`}</div></td><td><div class="link-list">${ex.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noreferrer">${esc(l.label)}</a>`).join("")}</div></td></tr>`;
  }

  function renderExerciseList() {
    const q = ($("#exercise-search").value || "").trim().toLowerCase();
    const gym = currentGym();
    const items = state.exercises.filter((x) => !q || [x.name, exerciseEnglishName(x.id), x.pattern, x.muscles.join(" "), x.equipment.map(equipmentDisplayText).join(" ")].join(" ").toLowerCase().includes(q));
    $("#exercise-list").innerHTML = items.length ? `<div class="item-list">${items.map((x) => {
      const available = P.isAvailable(x, gym);
      const subs = P.availableSubstitutes(x, gym, state.exercises).slice(0, 5);
      return `<article class="list-item"><div class="exercise-card-layout exercise-card-layout-text"><div><div class="dual-name">${bilingualNameMarkup(x.name, exerciseEnglishName(x.id), true)}</div><p class="mini-text">${esc(x.cue)}</p><p class="mini-text">注意：${esc(x.risk)}</p><div class="tag-row">${tag(available ? "当前场地可做" : "当前场地缺器械", available ? "success" : "warn")}${tag(x.pattern)}${x.muscles.map((m) => tag(m)).join("")}</div><div class="equipment-inline" style="margin-top:10px;">${x.equipment.map((id) => `<span class="equipment-chip equipment-chip-text"><span>${esc(equipmentLabel(id))}</span><span class="dual-name-english">${esc(equipmentEnglishLabel(id))}</span></span>`).join("")}</div><div class="link-list" style="margin-top:10px;">${x.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noreferrer">${esc(l.label)}</a>`).join("")}</div><p class="mini-text" style="margin-top:10px;">当前场地替代：${subs.map((s) => `${s.name} / ${exerciseEnglishName(s.id)}`).join("、") || "暂无"}</p></div></div></article>`;
    }).join("")}</div>` : `<p class="empty">没有匹配的动作。</p>`;
  }

  function renderGymList() {
    $("#gym-list").innerHTML = state.gyms.length ? `<div class="item-list">${state.gyms.map((g) => `
      <article class="list-item"><div class="list-item-header"><div>
        <h3>${esc(g.name)}</h3><p class="mini-text">${esc(g.location || "无地点备注")}</p>
        <div class="tag-row">${g.equipment.map((id) => tag(equipmentDisplayText(id))).join("")}</div>
      </div><div class="item-actions">
        ${g.id === state.currentGymId ? tag("当前", "success") : `<button class="button" data-action="set-current-gym" data-id="${esc(g.id)}">设为当前</button>`}
        <button class="button danger" data-action="delete-gym" data-id="${esc(g.id)}">删除</button>
      </div></div></article>`).join("")}</div>` : `<p class="empty">暂无健身房。</p>`;
  }

  function renderExerciseLogList() {
    const el = $("#exercise-log-list");
    if (!el) return;
    const logs = (state.exerciseLogs || []).slice(0, 6);
    if (!logs.length) {
      el.innerHTML = `<p class="empty">暂无动作级反馈。</p>`;
      return;
    }
    el.innerHTML = `<div class="item-list">${logs.map((log) => `
      <article class="list-item">
        <div class="list-item-header">
          <div>
            <div class="dual-name">${bilingualNameMarkup(log.exerciseName, exerciseEnglishName(log.exerciseId), true)}</div>
            <p class="mini-text">${esc(log.createdAt)} · ${esc(log.focus || "未记录训练日")} · 计划 ${esc(log.plannedSets || "-")} 组 / ${esc(log.plannedReps || "-")} · 实际 ${esc(log.actualLoad || "-")} / ${esc(log.actualReps || "-")} · RPE ${esc(log.rpe)}</p>
            <p style="margin-top:8px;">${esc(log.freeText || "无自由反馈")}</p>
            <div class="tag-row">${tag(advicePriorityLabel(log.analysis?.priority, log.analysis?.priorityLabel), advicePriorityType(log.analysis?.priority))}${(log.analysis?.tags || []).map((item) => tag(item.tag, "info")).join("")}</div>
            <p class="mini-text" style="margin-top:8px;">${esc((log.analysis?.recommendations || []).join(" "))}</p>
            ${trainingStatsLine(log)}
            ${log.analysis?.evidence?.length ? `<div class="context-box" style="margin-top:10px;"><div><strong>依据</strong></div>${renderEvidenceList(log.analysis.evidence.slice(0, 5))}</div>` : ""}
          </div>
          <button class="button danger" data-action="delete-exercise-log" data-id="${esc(log.id)}">删除</button>
        </div>
      </article>`).join("")}</div>`;
  }

  function renderExerciseHistoryFilter() {
    const select = $("#exercise-history-filter");
    if (!select) return;
    const currentValue = select.value || "all";
    const options = [];
    const seen = new Set();
    (state.exerciseLogs || []).forEach((log) => {
      if (log.exerciseId && !seen.has(log.exerciseId)) {
        seen.add(log.exerciseId);
        options.push({ value: log.exerciseId, label: `${log.exerciseName || log.exerciseId} / ${exerciseEnglishName(log.exerciseId)}` });
      }
    });
    select.innerHTML = [`<option value="all">全部动作</option>`, ...options.map((item) => `<option value="${esc(item.value)}">${esc(item.label)}</option>`)].join("");
    select.value = options.some((item) => item.value === currentValue) || currentValue === "all" ? currentValue : "all";
  }

  function renderExerciseHistory() {
    const summaryEl = $("#exercise-history-summary");
    const listEl = $("#exercise-history-list");
    const logs = state.exerciseLogs || [];
    if (!summaryEl || !listEl) return;
    if (!logs.length) {
      summaryEl.innerHTML = "";
      listEl.innerHTML = `<p class="empty">暂无动作反馈历史。</p>`;
      return;
    }
    const filterValue = $("#exercise-history-filter")?.value || "all";
    const filtered = filterValue === "all" ? logs.slice() : logs.filter((log) => log.exerciseId === filterValue);
    const summary = buildExerciseHistorySummary(filtered);
    summaryEl.innerHTML = `
      <div class="metric-grid">
        <div class="metric-pill"><span>反馈次数</span><strong>${summary.count}</strong></div>
        <div class="metric-pill"><span>平均 RPE</span><strong>${summary.avgRpe}</strong></div>
        <div class="metric-pill"><span>动作质量差</span><strong>${summary.poorCount}</strong></div>
        <div class="metric-pill"><span>疼痛风险</span><strong>${summary.painCount}</strong></div>
      </div>
      <div class="context-box" style="margin-top: 14px;">
        <div><strong>阶段 1 结论：</strong>${esc(summary.stage1Conclusion)}</div>
        <div class="tag-row">${summary.topTags.map(([issueTag, count]) => tag(`${issueTag} ×${count}`, "info")).join("")}</div>
      </div>
    `;
    listEl.innerHTML = `<div class="item-list">${filtered.map((log) => `
      <article class="list-item">
        <div class="list-item-header">
          <div>
            <div class="dual-name">${bilingualNameMarkup(log.exerciseName, exerciseEnglishName(log.exerciseId), true)}</div>
            <p class="mini-text">${esc(log.createdAt)} · ${esc(log.focus || "未记录训练日")}</p>
            <p class="mini-text">计划：${esc(log.plannedSets || "-")} 组 · ${esc(log.plannedReps || "-")} · ${esc(log.plannedLoad || "-")} · 计划 RPE ${esc(log.plannedRpe || "-")}</p>
            <p class="mini-text">实际：${esc(log.actualLoad || "-")} · ${esc(log.actualReps || "-")} · RPE ${esc(log.rpe)} · 动作质量 ${qualityLabel(log.quality)} · 幅度 ${romLabel(log.rangeOfMotion)}</p>
            <div class="tag-row">
              ${tag(`目标感觉 ${targetFeelLabel(log.targetMuscleFeel)}`)}
              ${tag(`限制因素 ${limiterLabel(log.limitingFactor)}`)}
              ${tag(`左右差 ${sideIssueLabel(log.sideIssue)}`)}
              ${tag(`疼痛 ${log.painScore}/5`, Number(log.painScore) >= 3 ? "warn" : "")}
            </div>
            <p style="margin-top:8px;">${esc(log.freeText || "无自由反馈")}</p>
            <div class="tag-row">${(log.analysis?.tags || []).map((item) => tag(item.tag, "info")).join("")}</div>
            <p class="mini-text" style="margin-top:8px;">${esc((log.analysis?.recommendations || []).join(" "))}</p>
            ${trainingStatsLine(log)}
          </div>
          <button class="button danger" data-action="delete-exercise-log" data-id="${esc(log.id)}">删除</button>
        </div>
      </article>`).join("")}</div>`;
  }

  function handleClick(event) {
    const t = event.target.closest("[data-action]");
    if (!t) return;
    const action = t.dataset.action;
    if (action === "set-current-gym") state.currentGymId = t.dataset.id;
    if (action === "delete-gym") deleteGym(t.dataset.id);
    if (action === "set-goal") state.currentGoalId = t.dataset.id;
    if (action === "delete-goal") deleteGoal(t.dataset.id);
    if (action === "delete-metric") deleteMetric(t.dataset.id);
    if (action === "delete-exercise-log") deleteExerciseLog(t.dataset.id);
    if (action === "delete-nutrition-log") deleteNutritionLog(t.dataset.id);
    if (action === "delete-advice") state.advice = state.advice.filter((x) => x.id !== t.dataset.id);
    if (action === "apply-revision") applyRevision(t.dataset.id);
    if (action === "apply-review-candidate") applyReviewCandidate(Number(t.dataset.index));
    if (action === "replace-exercise") replaceExercise(Number(t.dataset.day), Number(t.dataset.row), t.dataset.exerciseId);
    if (["set-current-gym", "set-goal", "delete-advice"].includes(action)) {
      saveState();
      renderAll();
    }
  }

  function renderCoach() {
    const sortedAdvice = state.advice.slice().sort((a, b) => adviceSortScore(b.priority) - adviceSortScore(a.priority));
    $("#coach-advice").innerHTML = sortedAdvice.length ? `<div class="item-list">${sortedAdvice.map((x) => `<article class="list-item"><div class="list-item-header"><div><h3>${esc(x.title)}</h3><p class="mini-text">${esc(x.createdAt)} · ${esc(x.status === "applied" ? "已应用" : "已记录")}</p><div class="tag-row" style="margin-top:8px;">${tag(advicePriorityLabel(x.priority, x.priorityLabel), advicePriorityType(x.priority))}${(x.tags || []).map((t) => tag(t, "info")).join("")}</div><p style="margin-top:8px;">${esc(x.body)}</p>${x.evidence?.length ? `<div class="context-box" style="margin-top:10px;"><div><strong>依据</strong></div>${renderEvidenceList(x.evidence)}</div>` : ""}${renderRecommendationItems(x.recommendationItems)}</div><button class="button danger" data-action="delete-advice" data-id="${esc(x.id)}">删除</button></div></article>`).join("")}</div>` : `<p class="empty">暂无建议。完成训练或饮食记录后，这里会生成计划和恢复建议。</p>`;
    $("#revisions-list").innerHTML = state.revisions.length ? `<div class="item-list">${state.revisions.map((x) => `<article class="list-item"><div class="list-item-header"><div><h3>${esc(x.summary)}</h3><p class="mini-text">${esc(x.createdAt)} · ${esc(x.status === "applied" ? "已应用" : "待确认")}</p><p style="margin-top:8px;">${esc(x.reason)}</p><div class="tag-row">${(x.tags || []).map((t) => tag(t)).join("")}</div></div><div class="item-actions">${x.status === "pending" ? `<button class="button primary" data-action="apply-revision" data-id="${esc(x.id)}">应用</button>` : tag("已应用", "success")}</div></div></article>`).join("")}</div>` : `<p class="empty">暂无计划调整记录。</p>`;
    renderWeeklyReview();
    renderProfiles();
  }

  function renderWeeklyReview() {
    const summaryEl = $("#weekly-review-summary");
    const candidatesEl = $("#weekly-review-candidates");
    if (!summaryEl || !candidatesEl) return;

    weeklyReviewDraft = P.buildWeeklyReview({
      goal: currentGoal(),
      metrics: state.metrics || [],
      sessions: state.sessions || [],
      exerciseLogs: state.exerciseLogs || [],
      nutritionLogs: state.nutritionLogs || [],
      plan: state.plan
    });

    const stats = weeklyReviewDraft.stats || {};
    summaryEl.innerHTML = `
      <div class="metric-grid">
        <div class="metric-pill"><span>训练次数</span><strong>${stats.sessionCount || 0}</strong></div>
        <div class="metric-pill"><span>平均完成度</span><strong>${Number.isFinite(stats.avgCompletion) ? `${stats.avgCompletion}%` : "-"}</strong></div>
        <div class="metric-pill"><span>平均 RPE</span><strong>${Number.isFinite(stats.avgRpe) ? stats.avgRpe : "-"}</strong></div>
        <div class="metric-pill"><span>平均疲劳</span><strong>${Number.isFinite(stats.avgFatigue) ? `${stats.avgFatigue}/5` : "-"}</strong></div>
        <div class="metric-pill"><span>蛋白缺口天数</span><strong>${stats.lowProteinDays || 0}</strong></div>
        <div class="metric-pill"><span>漏正餐天数</span><strong>${stats.missedMealDays || 0}</strong></div>
        <div class="metric-pill"><span>近 30 天体重</span><strong>${deltaLabel(stats.weightDelta30, "kg")}</strong></div>
      </div>
      <div class="context-box" style="margin-top:14px;">
        <div><strong>本周重点</strong></div>
        <ul class="plain-list">${(weeklyReviewDraft.highlights || []).map((item) => `<li>${esc(item)}</li>`).join("") || "<li>最近 7 天的数据还不够，先继续记录。</li>"}</ul>
      </div>
      <div class="context-box" style="margin-top:14px;">
        <div><strong>下周优先动作</strong></div>
        <ul class="plain-list">${(weeklyReviewDraft.nextActions || []).map((item) => `<li>${esc(item)}</li>`).join("") || "<li>当前没有额外的优先处理项。</li>"}</ul>
      </div>
    `;

    const candidates = weeklyReviewDraft.candidates || [];
    if (!candidates.length) {
      candidatesEl.innerHTML = `<p class="empty">当前还没有足够明确的周级计划调整候选。继续积累训练、饮食和身体指标后，这里会给出更稳的修改建议。</p>`;
      return;
    }

    candidatesEl.innerHTML = `
      <div class="section-heading" style="margin-bottom: 12px;">
        <div>
          <h3>调整候选</h3>
          <p>这些建议还不会静默改计划，需要你确认后才会写入。</p>
        </div>
      </div>
      <div class="item-list">${candidates.map((candidate, index) => {
        const matched = findMatchingRevision(candidate);
        return `
          <article class="list-item">
            <div class="list-item-header">
              <div>
                <h3>${esc(candidate.summary)}</h3>
                <p style="margin-top:8px;">${esc(candidate.reason)}</p>
                <div class="tag-row">${(candidate.tags || []).map((item) => tag(item)).join("")}</div>
              </div>
              <div class="item-actions">
                ${matched?.status === "applied"
                  ? tag("已应用", "success")
                  : matched?.status === "pending"
                    ? `<button class="button primary" data-action="apply-revision" data-id="${esc(matched.id)}">应用待确认项</button>`
                    : `<button class="button primary" data-action="apply-review-candidate" data-index="${index}">应用到计划</button>`}
              </div>
            </div>
          </article>
        `;
      }).join("")}</div>
    `;
  }

  function applyReviewCandidate(index) {
    const candidate = weeklyReviewDraft?.candidates?.[index];
    if (!candidate) return;
    const matched = findMatchingRevision(candidate);
    if (matched?.status === "applied") return toast("这个周复盘候选已经应用过了。");
    if (matched?.status === "pending") return applyRevision(matched.id);

    const revision = {
      id: uid("rev"),
      createdAt: nowLabel(),
      status: "pending",
      summary: candidate.summary,
      reason: candidate.reason,
      tags: candidate.tags || [],
      patch: clone(candidate.patch)
    };
    state.revisions.unshift(revision);
    applyRevision(revision.id);
  }

  function applyRevision(id) {
    const rev = state.revisions.find((x) => x.id === id);
    const day = state.plan?.days?.[rev?.patch?.dayIndex];
    if (!rev || !day) return;

    if (rev.patch.type === "reduce_day_volume") {
      day.exercises.forEach((r) => {
        if (Number(r.sets) > 1) r.sets = Math.max(2, Math.round(Number(r.sets) * rev.patch.factor));
        r.notes = appendNote(r.notes, "已根据疼痛反馈降量。");
      });
    }

    if (rev.patch.type === "trim_accessory" && day.exercises.length > 4) {
      day.exercises = day.exercises.slice(0, Math.max(4, day.exercises.length - 2));
      day.intent = `${day.intent} 已根据完成度反馈简化。`;
    }

    if (rev.patch.type === "add_progression_note") {
      day.exercises.slice(0, 3).forEach((r) => {
        r.notes = appendNote(r.notes, "下次可尝试加重 2.5%-5% 或增加 1-2 次。");
      });
    }

    if (rev.patch.type === "increase_cardio_time") {
      const minutes = Number(rev.patch.minutes || 10);
      let targetRow = day.exercises.find((row) => /分钟|min/i.test(String(row.reps || "")));
      if (!targetRow) {
        targetRow = day.exercises.find((row) => /有氧/.test(String(getExercise(row.exerciseId)?.pattern || "")));
      }
      if (targetRow) {
        targetRow.reps = bumpDurationText(String(targetRow.reps || ""), minutes);
        targetRow.notes = appendNote(targetRow.notes, `已根据周复盘增加有氧 ${minutes} 分钟。`);
      } else {
        day.intent = appendNote(day.intent, `已根据周复盘增加有氧 ${minutes} 分钟。`);
      }
    }

    rev.status = "applied";
    rev.appliedAt = nowLabel();
    saveState();
    renderAll();
    toast("计划调整已应用。");
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

  function findMatchingRevision(candidate) {
    const signature = candidatePatchSignature(candidate?.patch);
    return state.revisions.find((item) => candidatePatchSignature(item.patch) === signature) || null;
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

  function getOrCreateWorkoutSession(dayIndex, day) {
    state.sessions = state.sessions || [];
    const date = todayIso();
    const existing = state.sessions.find((session) =>
      session.date === date
      && Number(session.dayIndex) === Number(dayIndex)
      && (!state.plan?.id || session.planId === state.plan.id)
      && session.status !== "cancelled"
    );
    if (existing) {
      existing.status = existing.status || "in_progress";
      existing.exerciseLogIds = Array.isArray(existing.exerciseLogIds) ? existing.exerciseLogIds : [];
      return existing;
    }
    const session = {
      id: uid("session"),
      date,
      createdAt: nowLabel(),
      startedAt: nowLabel(),
      completedAt: null,
      status: "in_progress",
      gymId: state.currentGymId,
      gymName: currentGym()?.name || "",
      planId: state.plan?.id || null,
      dayIndex,
      focus: day?.focus || "",
      completion: null,
      rpe: null,
      painScore: null,
      painArea: "",
      sleep: null,
      fatigue: null,
      notes: "",
      exerciseLogIds: []
    };
    state.sessions.unshift(session);
    return session;
  }

  function moveSessionToFront(sessionId) {
    const index = (state.sessions || []).findIndex((session) => session.id === sessionId);
    if (index <= 0) return;
    const [session] = state.sessions.splice(index, 1);
    state.sessions.unshift(session);
  }

  function latestCompletedSession() {
    return (state.sessions || []).find((session) => !session.status || session.status === "completed") || null;
  }

  function parseSetLogs(rawText, actualLoadText, actualRepsText, defaultRpe) {
    const explicitLines = String(rawText || "")
      .split(/[\n;；]+/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (explicitLines.length) {
      return explicitLines.map((line, index) => parseSetLine(line, index, defaultRpe));
    }

    const loadKg = parseLoadKg(actualLoadText);
    const reps = String(actualRepsText || "")
      .split(/[\/,，\s]+/)
      .map((item) => parseNumber(item))
      .filter((value) => value != null && value > 0);
    if (loadKg == null || !reps.length) return [];
    return reps.map((rep, index) => ({
      id: uid("set"),
      setIndex: index + 1,
      loadKg,
      reps: rep,
      rpe: Number.isFinite(defaultRpe) && defaultRpe > 0 ? defaultRpe : null,
      completed: true,
      note: "由实际重量和实际次数自动推导"
    }));
  }

  function parseSetLine(line, index, defaultRpe) {
    const loadMatch = line.match(/(\d+(?:\.\d+)?)\s*(?:kg|公斤)?/i);
    const repsMatch = line.match(/[x×]\s*(\d+(?:\.\d+)?)/i) || line.match(/(\d+(?:\.\d+)?)\s*(?:次|reps?)/i);
    const rpeMatch = line.match(/(?:@|rpe\s*)(\d+(?:\.\d+)?)/i);
    return {
      id: uid("set"),
      setIndex: index + 1,
      loadKg: loadMatch ? Number(loadMatch[1]) : null,
      reps: repsMatch ? Number(repsMatch[1]) : null,
      rpe: rpeMatch ? Number(rpeMatch[1]) : (Number.isFinite(defaultRpe) && defaultRpe > 0 ? defaultRpe : null),
      completed: true,
      note: line
    };
  }

  function buildTrainingStatsForLog(log, previousLogs) {
    const volumeLoad = P.calculateVolumeLoad(log.sets || []);
    const hardSets = P.calculateHardSets(log.sets || []);
    const simplePr = P.detectSimplePr({ ...log, volumeLoad, hardSets }, previousLogs || []);
    return { volumeLoad, hardSets, simplePr };
  }

  function trainingStatsLine(log) {
    const setCount = (log.sets || []).length;
    if (!setCount) return "";
    const prText = log.simplePr?.isPr ? ` · ${log.simplePr.records.map((record) => record.label).join(" / ")}` : "";
    return `<p class="mini-text">每组 ${setCount} 组 · 容量 ${volumeLabel(log.volumeLoad)} · 有效组 ${Number(log.hardSets || 0)}${esc(prText)}</p>`;
  }

  function parseLoadKg(text) {
    if (/自重|bodyweight/i.test(String(text || ""))) return null;
    return parseNumber(text);
  }

  function parseNumber(text) {
    const match = String(text || "").match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : null;
  }

  function volumeLabel(value) {
    return Number(value) > 0 ? `${Math.round(Number(value))}kg` : "-";
  }

  function renderNutritionReminders() {
    const el = $("#nutrition-reminders");
    if (!el) return;
    const reminders = P.buildNutritionReminders({
      goal: currentGoal(),
      metrics: state.metrics || [],
      sessions: state.sessions || [],
      exerciseLogs: state.exerciseLogs || [],
      nutritionLogs: state.nutritionLogs || []
    });
    el.innerHTML = `
      <div class="context-box">
        <div><strong>饮食前提醒</strong></div>
        ${reminders.length ? renderRecommendationItems(reminders.slice(0, 4)) : `<div class="mini-text" style="margin-top:8px;">当前没有额外的饮食前提醒，按正常方式记录即可。</div>`}
      </div>
    `;
  }

  function candidatePatchSignature(patch) {
    if (!patch) return "";
    return JSON.stringify({
      type: patch.type || "",
      dayIndex: Number.isFinite(Number(patch.dayIndex)) ? Number(patch.dayIndex) : null,
      rowIndex: Number.isFinite(Number(patch.rowIndex)) ? Number(patch.rowIndex) : null,
      exerciseId: patch.exerciseId || null,
      minutes: Number.isFinite(Number(patch.minutes)) ? Number(patch.minutes) : null,
      factor: Number.isFinite(Number(patch.factor)) ? Number(patch.factor) : null
    });
  }

  function bumpDurationText(text, minutes) {
    const source = String(text || "");
    const rangeMatch = source.match(/(\d+)\s*-\s*(\d+)\s*(分钟|min)/i);
    if (rangeMatch) {
      const nextMin = Number(rangeMatch[1]) + minutes;
      const nextMax = Number(rangeMatch[2]) + minutes;
      return `${nextMin}-${nextMax} ${rangeMatch[3]}`;
    }
    const singleMatch = source.match(/(\d+)\s*(分钟|min)/i);
    if (singleMatch) return `${Number(singleMatch[1]) + minutes} ${singleMatch[2]}`;
    return `${source || "有氧"} +${minutes} 分钟`;
  }

  function currentGym() { return state.gyms.find((x) => x.id === state.currentGymId) || state.gyms[0] || null; }
  function currentGoal() { return state.goals.find((x) => x.id === state.currentGoalId) || state.goals[0] || null; }
  function latestMetric() { return P.sortedMetrics(state.metrics).at(-1) || null; }
  function getExercise(id) { return state.exercises.find((x) => x.id === id); }
  function equipmentLabel(id) { return D.equipment.find((x) => x.id === id)?.label || id; }
  function tag(text, type = "") { return `<span class="tag ${type}">${esc(text)}</span>`; }
  function num(v) { return v === "" || v == null ? null : Number(v); }
  function fmt(v, unit) { return typeof v === "number" ? `${v}${unit}` : "-"; }
  function numUnit(v, unit) {
    return typeof v === "number" && Number.isFinite(v) ? `${Math.round(v)}${unit}` : "-";
  }
  function trendLabel(t, unit) { return t ? `${t.delta > 0 ? "+" : ""}${t.delta.toFixed(1)}${unit}` : "-"; }
  function deltaLabel(v, unit) {
    return typeof v === "number" && Number.isFinite(v) ? `${v > 0 ? "+" : ""}${Math.round(v)}${unit}` : "-";
  }
  function appendNote(a, b) { return a ? `${a} ${b}` : b; }
  function clamp(v, min, max) { return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min; }
  function todayIso() { return new Date().toISOString().slice(0, 10); }
  function nowLabel() { const d = new Date(); return `${d.toLocaleDateString("zh-CN")} ${d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`; }
  function uid(prefix) { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`; }
  function esc(v) { return String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
  let toastTimer = null;
  function toast(msg) { const el = $("#toast"); el.textContent = msg; el.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2600); }
})();
