(() => {
  "use strict";

  type UiElement = HTMLElement & {
    value: string;
    checked: boolean;
    reset: () => void;
    dataset: DOMStringMap;
  };

  type DomTools = {
    $: (selector: string) => UiElement;
    $$: (selector: string) => UiElement[];
    createToastController: (selector: string, hideDelayMs?: number) => (message: string) => void;
  };

  type DisplayFormattersRuntime = {
    esc: (value: unknown) => string;
    tag: (label: unknown, tone?: string) => string;
    fmt: (value: unknown, unit?: string) => string;
    exerciseEnglishName: (id: string) => string;
  };

  type RenderResult = {
    hasData?: boolean;
    hasPlan?: boolean;
    html?: string;
    contextHtml?: string;
    tableHtml?: string;
    summaryHtml?: string;
    listHtml?: string;
    exerciseHtml?: string;
    nutritionHtml?: string;
    value?: string;
  };

  type WeeklyReviewDraft = Record<string, unknown> & {
    candidates?: Array<Record<string, unknown>>;
  };

  type RulesRuntime = {
    parseGoal: (text: string) => GoalParsed;
    metricTrend: (metrics: BodyMetricEntry[], key: string, days: number) => MetricTrendResult | null;
    sortedMetrics: (metrics: BodyMetricEntry[]) => BodyMetricEntry[];
    buildIntegratedSignals: (input: Record<string, unknown>) => RecommendationItem[];
    buildTrainingReminders: (input: Record<string, unknown>) => RecommendationItem[];
    isAvailable: (exercise: Exercise, gym: Gym | null) => boolean;
    availableSubstitutes: (exercise: Exercise, gym: Gym | null, exercises: Exercise[]) => Exercise[];
    buildNutritionProfile: (logs: NutritionLog[], goal: Goal | null) => NutritionProfileSummary;
    buildNutritionTrend: (logs: NutritionLog[]) => Record<string, number>[] | null;
    buildNutritionReminders: (input: Record<string, unknown>) => RecommendationItem[];
    buildExerciseProfiles: (logs: ExerciseLog[]) => ExerciseProfileSummary[];
    buildWeeklyReview: (input: Record<string, unknown>) => WeeklyReviewDraft;
  };

  type ViewRenderersRuntime = {
    statusGymText: (gym: Gym | null) => string;
    statusGoalText: (goal: Goal | null) => string;
    gymSelectOptions: (gyms: Gym[], currentGymId: string | null) => string;
    currentGymSummary: (gym: Gym | null) => string;
    todayAdvice: (input: Record<string, unknown>) => string;
    trainingReminders: (input: Record<string, unknown>) => string;
    todayPlanOptions: (plan: TrainingPlan | null) => string;
    todayWorkoutEmpty: () => string;
    goalsList: (goals: Goal[], currentGoalId: string | null) => string;
    metricsList: (metrics: BodyMetricEntry[]) => RenderResult;
    planContext: (plan: TrainingPlan | null) => RenderResult;
    workoutDay: (day: WorkoutDay, dayIndex: number, renderPlanRow: (row: PlannedExercise, dayIndex: number, rowIndex: number) => string) => string;
    dataSummary: (state: AppState) => string;
    equipmentChecklist: (equipment: Array<{ id: string; label: string }>) => string;
    equipmentLibrary: (equipment: Array<{ id: string; label: string }>) => string;
    exerciseLogSelectOptions: (day: WorkoutDay, getExercise: (id: string) => Exercise | undefined, exerciseEnglishName: (id: string) => string) => string;
    planRow: (input: Record<string, unknown>) => string;
    exerciseList: (input: Record<string, unknown>) => string;
    gymList: (gyms: Gym[], currentGymId: string | null) => string;
    exerciseLogList: (logs: ExerciseLog[]) => string;
    exerciseHistoryFilterOptions: (input: Record<string, unknown>) => RenderResult;
    exerciseHistory: (input: Record<string, unknown>) => { summaryHtml: string; listHtml: string };
    coachAdvice: (advice: Advice[]) => string;
    revisionsList: (revisions: Revision[]) => string;
    weeklyReviewSummary: (review: WeeklyReviewDraft) => string;
    weeklyReviewCandidates: (input: Record<string, unknown>) => string;
    nutritionList: (input: Record<string, unknown>) => { summaryHtml: string; listHtml: string };
    profiles: (input: Record<string, unknown>) => { exerciseHtml: string; nutritionHtml: string };
    nutritionReminders: (items: RecommendationItem[]) => string;
    trainingStatsLine: (log: ExerciseLog) => string;
  };

  type WorkbenchActionsRuntime = {
    setCurrentGym: (input: Record<string, unknown>) => void;
    setCurrentGoal: (input: Record<string, unknown>) => void;
    saveGoal: (input: Record<string, unknown>) => Goal;
    deleteGoal: (input: Record<string, unknown>) => void;
    saveGym: (input: Record<string, unknown>) => Gym;
    deleteGym: (input: Record<string, unknown>) => boolean;
    saveMetric: (input: Record<string, unknown>) => BodyMetricEntry;
    deleteMetric: (input: Record<string, unknown>) => void;
    generatePlan: (input: Record<string, unknown>) => void;
    saveSessionFeedback: (input: Record<string, unknown>) => void;
    saveExerciseLog: (input: Record<string, unknown>) => void;
    deleteExerciseLog: (input: Record<string, unknown>) => void;
    deleteNutritionLog: (input: Record<string, unknown>) => void;
    replaceExercise: (input: Record<string, unknown>) => void;
    importPlanCsv: (input: Record<string, unknown>) => void;
    saveNutritionLog: (input: Record<string, unknown>) => void;
    deleteAdvice: (input: Record<string, unknown>) => void;
    applyReviewCandidate: (input: Record<string, unknown>) => { status: string };
    applyRevision: (input: Record<string, unknown>) => boolean;
    findMatchingRevision: (state: AppState, candidate: Record<string, unknown>) => Revision | null;
    findOrCreateExercise: (input: Record<string, unknown>) => Exercise;
  };

  type AppStateStoreRuntime = {
    createDefaultState: (context: Record<string, unknown>) => AppState;
    prepareState: (data: unknown, context: Record<string, unknown>) => AppState;
    normalizeState: (data: unknown, context: Record<string, unknown>) => AppState;
    loadLocalState: (context: Record<string, unknown>) => AppState;
    saveLocalState: (state: AppState, context: Record<string, unknown>) => AppState;
    hydrateDesktopState: (state: AppState, context: Record<string, unknown>, callbacks: Record<string, unknown>) => Promise<void>;
    persistDesktopState: (state: AppState, context: Record<string, unknown>, callbacks: Record<string, unknown>) => void;
  };

  type DataPortabilityRuntime = {
    buildPlanCsv: (plan: TrainingPlan, resolveName: (exerciseId: string) => string | undefined) => string;
    parsePlanCsv: (text: string, findOrCreateExercise: (name: string) => Exercise) => WorkoutDay[];
    buildBackupJson: (state: AppState) => string;
    parseBackupJson: (text: string) => unknown;
  };

  type BrowserFileIORuntime = {
    downloadText: (filename: string, text: string, mimeType: string) => void;
    readInputFileText: (event: Event) => Promise<string | null>;
    clearInput: (event: Event) => void;
    confirmResetData: () => boolean;
  };

  type LineChartRuntime = {
    draw: (canvas: Element | null, options: Record<string, unknown>) => void;
  };

  const STORAGE_KEY = "fitness-coach-workbench-v1";
  const D = window.FitnessData;
  const P = window.FitnessCore.Rules as RulesRuntime;
  const M = window.FitnessCore.StateNormalizer;
  const DesktopStorage = window.FitnessCore.DesktopStorage;
  const AppStateStore = window.FitnessCore.AppStateStore as AppStateStoreRuntime;
  const DataPortability = window.FitnessApp.DataPortability as DataPortabilityRuntime;
  const LineChart = window.FitnessApp.LineChart as LineChartRuntime;
  const BrowserFileIO = window.FitnessApp.BrowserFileIO as BrowserFileIORuntime;
  const DomUtils = window.FitnessApp.DomUtils.create() as DomTools;
  const DisplayFormatters = window.FitnessApp.DisplayFormatters.create({ equipment: D.equipment }) as DisplayFormattersRuntime;
  const ViewRenderers = window.FitnessApp.ViewRenderers.create({ formatters: DisplayFormatters, rules: P }) as ViewRenderersRuntime;
  const WorkbenchActions = window.FitnessApp.WorkbenchActions.create({ rules: P, uid, nowLabel, todayIso }) as WorkbenchActionsRuntime;
  const {
    esc,
    tag,
    fmt,
    exerciseEnglishName
  } = DisplayFormatters;
  const { $, $$ } = DomUtils;
  const toast = DomUtils.createToastController("#toast");
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
      WorkbenchActions.setCurrentGym({ state, gymId: (e.target as UiElement).value });
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
    $("#status-gym").textContent = ViewRenderers.statusGymText(gym);
    $("#status-goal").textContent = ViewRenderers.statusGoalText(goal);
  }

  function renderGymSelect() {
    $("#current-gym-select").innerHTML = ViewRenderers.gymSelectOptions(state.gyms, state.currentGymId);
  }

  function renderCurrentGymSummary() {
    $("#current-gym-summary").innerHTML = ViewRenderers.currentGymSummary(currentGym());
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
    $("#today-advice").innerHTML = ViewRenderers.todayAdvice({ summary, linkedSignals });
  }

  function renderTrainingReminders() {
    const el = $("#training-reminders");
    if (!el) return;
    if (!state.plan?.days?.length) {
      el.innerHTML = ViewRenderers.trainingReminders({ hasPlan: false, reminders: [] });
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
    el.innerHTML = ViewRenderers.trainingReminders({ hasPlan: true, reminders });
  }

  function renderTodayPlanSelect() {
    const select = $("#today-plan-day-select");
    select.innerHTML = ViewRenderers.todayPlanOptions(state.plan);
  }

  function renderTodayWorkout() {
    const el = $("#today-workout");
    if (!state.plan?.days?.length) {
      el.innerHTML = ViewRenderers.todayWorkoutEmpty();
      return;
    }
    const index = Number($("#today-plan-day-select").value || 0);
    el.innerHTML = renderWorkoutDay(state.plan.days[index] || state.plan.days[0], index, true);
  }

  function renderGoalsList() {
    $("#goals-list").innerHTML = ViewRenderers.goalsList(state.goals, state.currentGoalId);
  }

  function renderParsedGoal() {
    const el = $("#parsed-goal-output");
    if (!el) return;
    if (!parsedGoalDraft) {
      el.innerHTML = "";
      return;
    }
    el.innerHTML = `<pre>${esc(JSON.stringify(parsedGoalDraft, null, 2))}</pre>`;
  }

  function renderMetrics() {
    const el = $("#metric-list");
    const result = ViewRenderers.metricsList(state.metrics);
    el.innerHTML = result.html;
    if (!result.hasData) {
      drawMetricChart();
      return;
    }
    drawMetricChart();
  }

  function renderPlan() {
    const context = $("#plan-context");
    const table = $("#plan-table");
    const result = ViewRenderers.planContext(state.plan);
    context.innerHTML = result.contextHtml;
    if (!result.hasPlan) {
      table.innerHTML = result.tableHtml;
      return;
    }
    table.innerHTML = state.plan.days.map((d, i) => renderWorkoutDay(d, i, false)).join("");
  }

  function renderWorkoutDay(day, dayIndex, compact = false) {
    return ViewRenderers.workoutDay(day, dayIndex, renderPlanRow);
  }

  function renderDataSummary() {
    $("#data-summary").innerHTML = ViewRenderers.dataSummary(state);
  }

  function saveGoal() {
    const text = $("#goal-text").value.trim();
    if (!text) return toast("请先输入目标描述。");
    const parsed = parsedGoalDraft?.rawText === text ? parsedGoalDraft : P.parseGoal(text);
    WorkbenchActions.saveGoal({ state, text, parsed });
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
    WorkbenchActions.saveGym({ state, name, location: $("#gym-location").value.trim(), equipment });
    $("#gym-form").reset();
    saveState();
    renderAll();
    toast("健身房已保存，并设为当前场地。");
  }

  function deleteGym(id) {
    if (!WorkbenchActions.deleteGym({ state, gymId: id })) return toast("至少保留一个健身房。");
    saveState();
    renderAll();
    toast("健身房已删除。");
  }

  function deleteGoal(id) {
    WorkbenchActions.deleteGoal({ state, goalId: id });
    saveState();
    renderAll();
    toast("目标已删除。");
  }

  function saveMetric(event) {
    event.preventDefault();
    const metric = {
      date: $("#metric-date").value || todayIso(),
      weight: num($("#metric-weight").value),
      bodyFat: num($("#metric-bodyfat").value),
      skeletalMuscle: num($("#metric-muscle").value),
      waist: num($("#metric-waist").value),
      notes: $("#metric-notes").value.trim()
    };
    if ([metric.weight, metric.bodyFat, metric.skeletalMuscle, metric.waist].every((x) => x === null)) return toast("至少填写一个身体指标。");
    WorkbenchActions.saveMetric({ state, metric });
    $("#metric-form").reset();
    $("#metric-date").value = todayIso();
    saveState();
    renderAll();
    toast("身体指标已保存。");
  }

  function deleteMetric(id) {
    WorkbenchActions.deleteMetric({ state, metricId: id });
    saveState();
    renderAll();
    toast("身体指标已删除。");
  }

  function generatePlan() {
    const gym = currentGym();
    if (!gym) return toast("请先添加并选择健身房。");
    const goal = currentGoal();
    WorkbenchActions.generatePlan({ state, gym, goal });
    saveState();
    renderAll();
    toast("训练计划已生成。");
  }

  function saveSessionFeedback(event) {
    event.preventDefault();
    if (!state.plan?.days?.length) return toast("请先生成训练计划。");
    const dayIndex = Number($("#today-plan-day-select").value || 0);
    const day = state.plan.days[dayIndex];
    WorkbenchActions.saveSessionFeedback({
      state,
      dayIndex,
      day,
      currentGym: currentGym(),
      input: {
        completion: clamp(Number($("#log-completion").value || 0), 0, 100),
        rpe: clamp(Number($("#log-rpe").value || 0), 1, 10),
        painScore: clamp(Number($("#log-pain-score").value || 0), 0, 5),
        painArea: $("#log-pain-area").value.trim(),
        sleep: clamp(Number($("#log-sleep").value || 0), 1, 5),
        fatigue: clamp(Number($("#log-fatigue").value || 0), 1, 5),
        notes: $("#log-notes").value.trim()
      }
    });
    $("#session-form").reset();
    $("#log-completion").value = "100";
    $("#log-rpe").value = "7";
    $("#log-pain-score").value = "0";
    $("#log-sleep").value = "3";
    $("#log-fatigue").value = "3";
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
    WorkbenchActions.saveExerciseLog({
      state,
      dayIndex,
      day,
      exercise,
      plannedRow,
      input: {
        currentGym: currentGym(),
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
        freeText: $("#exercise-log-feedback").value.trim(),
        setsText: $("#exercise-log-sets")?.value
      }
    });
    $("#exercise-log-form").reset();
    $("#exercise-log-rpe").value = "7";
    $("#exercise-log-pain-score").value = "0";
    saveState();
    renderAll();
    toast("动作级反馈已保存，并生成动作建议。");
  }

  function deleteExerciseLog(id) {
    WorkbenchActions.deleteExerciseLog({ state, logId: id });
    saveState();
    renderAll();
    toast("动作级反馈已删除。");
  }

  function deleteNutritionLog(id) {
    WorkbenchActions.deleteNutritionLog({ state, logId: id });
    saveState();
    renderAll();
    toast("饮食记录已删除。");
  }

  function replaceExercise(dayIndex, rowIndex, exerciseId) {
    const row = state.plan?.days?.[dayIndex]?.exercises?.[rowIndex];
    const next = getExercise(exerciseId);
    if (!row || !next) return;
    const old = getExercise(row.exerciseId);
    WorkbenchActions.replaceExercise({
      state,
      dayIndex,
      rowIndex,
      nextExercise: next,
      oldExercise: old,
      currentGymName: currentGym()?.name || "当前场地"
    });
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
    BrowserFileIO.downloadText(`training-plan-${todayIso()}.csv`, csv, "text/csv;charset=utf-8");
  }

  async function importPlanCsv(event) {
    const text = await BrowserFileIO.readInputFileText(event);
    if (text == null) return;
    try {
      const days = DataPortability.parsePlanCsv(text, findOrCreateExercise);
      WorkbenchActions.importPlanCsv({ state, days, gym: currentGym(), goal: currentGoal() });
      saveState();
      renderAll();
      toast("计划 CSV 已导入。");
    } finally {
      BrowserFileIO.clearInput(event);
    }
  }

  function exportJson() {
    state = normalizeState(state);
    BrowserFileIO.downloadText(`fitness-workbench-backup-${todayIso()}.json`, DataPortability.buildBackupJson(state), "application/json;charset=utf-8");
  }

  async function importJson(event) {
    const text = await BrowserFileIO.readInputFileText(event);
    if (text == null) return;
    try {
      state = prepareState(DataPortability.parseBackupJson(text));
      saveState();
      renderAll();
      toast("JSON 备份已导入。");
    } catch {
      toast("JSON 解析失败，请检查文件。");
    } finally {
      BrowserFileIO.clearInput(event);
    }
  }

  function resetData() {
    if (!BrowserFileIO.confirmResetData()) return;
    state = defaultState();
    parsedGoalDraft = null;
    saveState();
    renderAll();
    toast("已恢复初始数据。");
  }

  function findOrCreateExercise(name) {
    return WorkbenchActions.findOrCreateExercise({ state, name });
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
    const tagCounts: Record<string, number> = {};
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
    const rendered = ViewRenderers.nutritionList({ logs, profile });
    if (summaryEl) summaryEl.innerHTML = rendered.summaryHtml;
    listEl.innerHTML = rendered.listHtml;
    drawNutritionChart();
  }

  function renderProfiles() {
    const exerciseEl = $("#exercise-profiles");
    const nutritionEl = $("#nutrition-profiles");
    if (!exerciseEl && !nutritionEl) return;
    const rendered = ViewRenderers.profiles({
      exerciseProfiles: P.buildExerciseProfiles(state.exerciseLogs || []).slice(0, 6),
      nutritionProfile: P.buildNutritionProfile(state.nutritionLogs || [], currentGoal())
    });
    if (exerciseEl) exerciseEl.innerHTML = rendered.exerciseHtml;
    if (nutritionEl) nutritionEl.innerHTML = rendered.nutritionHtml;
  }

  function saveNutritionLog(event) {
    event.preventDefault();
    const rawText = $("#nutrition-text").value.trim();
    if (!rawText) return toast("请先输入饮食描述。");
    WorkbenchActions.saveNutritionLog({
      state,
      rawText,
      date: $("#nutrition-date").value || todayIso(),
      goal: currentGoal(),
      latestMetric: latestMetric()
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


  function renderEquipmentChecklist() {
    $("#equipment-checklist").innerHTML = ViewRenderers.equipmentChecklist(D.equipment);
  }

  function renderEquipmentLibrary() {
    const el = $("#equipment-library");
    if (!el) return;
    el.innerHTML = ViewRenderers.equipmentLibrary(D.equipment);
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
    select.innerHTML = ViewRenderers.exerciseLogSelectOptions(day, getExercise, exerciseEnglishName);
  }

  function renderPlanRow(row, dayIndex, rowIndex) {
    const ex = getExercise(row.exerciseId);
    if (!ex) return "";
    const gym = currentGym();
    const available = P.isAvailable(ex, gym);
    const subs = P.availableSubstitutes(ex, gym, state.exercises).slice(0, 4);
    return ViewRenderers.planRow({ row, dayIndex, rowIndex, exercise: ex, available, substitutes: subs });
  }

  function renderExerciseList() {
    $("#exercise-list").innerHTML = ViewRenderers.exerciseList({
      exercises: state.exercises,
      query: $("#exercise-search").value,
      gym: currentGym(),
      allExercises: state.exercises
    });
  }

  function renderGymList() {
    $("#gym-list").innerHTML = ViewRenderers.gymList(state.gyms, state.currentGymId);
  }

  function renderExerciseLogList() {
    const el = $("#exercise-log-list");
    if (!el) return;
    const logs = (state.exerciseLogs || []).slice(0, 6);
    el.innerHTML = ViewRenderers.exerciseLogList(logs);
  }

  function renderExerciseHistoryFilter() {
    const select = $("#exercise-history-filter");
    if (!select) return;
    const currentValue = select.value || "all";
    const result = ViewRenderers.exerciseHistoryFilterOptions({ logs: state.exerciseLogs || [], currentValue });
    select.innerHTML = result.html;
    select.value = result.value;
  }

  function renderExerciseHistory() {
    const summaryEl = $("#exercise-history-summary");
    const listEl = $("#exercise-history-list");
    const logs = state.exerciseLogs || [];
    if (!summaryEl || !listEl) return;
    const filterValue = $("#exercise-history-filter")?.value || "all";
    const filtered = filterValue === "all" ? logs.slice() : logs.filter((log) => log.exerciseId === filterValue);
    const summary = buildExerciseHistorySummary(filtered);
    const rendered = ViewRenderers.exerciseHistory({ logs: filtered, summary });
    summaryEl.innerHTML = rendered.summaryHtml;
    listEl.innerHTML = rendered.listHtml;
  }

  function handleClick(event) {
    const t = event.target.closest("[data-action]");
    if (!t) return;
    const action = t.dataset.action;
    if (action === "set-current-gym") WorkbenchActions.setCurrentGym({ state, gymId: t.dataset.id });
    if (action === "delete-gym") deleteGym(t.dataset.id);
    if (action === "set-goal") WorkbenchActions.setCurrentGoal({ state, goalId: t.dataset.id });
    if (action === "delete-goal") deleteGoal(t.dataset.id);
    if (action === "delete-metric") deleteMetric(t.dataset.id);
    if (action === "delete-exercise-log") deleteExerciseLog(t.dataset.id);
    if (action === "delete-nutrition-log") deleteNutritionLog(t.dataset.id);
    if (action === "delete-advice") WorkbenchActions.deleteAdvice({ state, adviceId: t.dataset.id });
    if (action === "apply-revision") applyRevision(t.dataset.id);
    if (action === "apply-review-candidate") applyReviewCandidate(Number(t.dataset.index));
    if (action === "replace-exercise") replaceExercise(Number(t.dataset.day), Number(t.dataset.row), t.dataset.exerciseId);
    if (["set-current-gym", "set-goal", "delete-advice"].includes(action)) {
      saveState();
      renderAll();
    }
  }

  function renderCoach() {
    $("#coach-advice").innerHTML = ViewRenderers.coachAdvice(state.advice);
    $("#revisions-list").innerHTML = ViewRenderers.revisionsList(state.revisions);
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

    summaryEl.innerHTML = ViewRenderers.weeklyReviewSummary(weeklyReviewDraft);

    const candidates = weeklyReviewDraft.candidates || [];
    candidatesEl.innerHTML = ViewRenderers.weeklyReviewCandidates({ candidates, findMatchingRevision });
  }

  function applyReviewCandidate(index) {
    const candidate = weeklyReviewDraft?.candidates?.[index];
    if (!candidate) return;
    const result = WorkbenchActions.applyReviewCandidate({ state, candidate, getExercise });
    if (result.status === "already_applied") return toast("这个周复盘候选已经应用过了。");
    if (result.status !== "applied") return;
    saveState();
    renderAll();
    toast("计划调整已应用。");
  }

  function applyRevision(id) {
    const applied = WorkbenchActions.applyRevision({ state, revisionId: id, getExercise });
    if (!applied) return;
    saveState();
    renderAll();
    toast("计划调整已应用。");
  }

  function findMatchingRevision(candidate) {
    return WorkbenchActions.findMatchingRevision(state, candidate);
  }

  function latestCompletedSession() {
    return (state.sessions || []).find((session) => !session.status || session.status === "completed") || null;
  }

  function trainingStatsLine(log) {
    return ViewRenderers.trainingStatsLine(log);
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
    el.innerHTML = ViewRenderers.nutritionReminders(reminders);
  }

  function currentGym() { return state.gyms.find((x) => x.id === state.currentGymId) || state.gyms[0] || null; }
  function currentGoal() { return state.goals.find((x) => x.id === state.currentGoalId) || state.goals[0] || null; }
  function latestMetric() { const metrics = P.sortedMetrics(state.metrics); return metrics[metrics.length - 1] || null; }
  function getExercise(id) { return state.exercises.find((x) => x.id === id); }
  function num(v) { return v === "" || v == null ? null : Number(v); }
  function clamp(v, min, max) { return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min; }
  function todayIso() { return new Date().toISOString().slice(0, 10); }
  function nowLabel() { const d = new Date(); return `${d.toLocaleDateString("zh-CN")} ${d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`; }
  function uid(prefix) { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`; }
})();
