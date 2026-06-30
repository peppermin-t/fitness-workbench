// @ts-nocheck
(function () {
  "use strict";

  const CURRENT_SCHEMA_VERSION = 2;

  function normalizeAppState(input, defaults) {
    if (!isRecord(input)) {
      throw new Error("Imported state must be a JSON object.");
    }
    const base = clone(defaults || {});
    const next = { ...base, ...clone(input) };
    next.schemaVersion = CURRENT_SCHEMA_VERSION;
    return normalizeState(next, base);
  }

  function normalizeState(input, defaults) {
    const next = { ...clone(defaults || {}), ...clone(input || {}) };
    const arrayKeys = [
      "gyms",
      "exercises",
      "goals",
      "metrics",
      "sessions",
      "exerciseLogs",
      "nutritionLogs",
      "feedback",
      "advice",
      "revisions"
    ];
    arrayKeys.forEach((key) => {
      next[key] = ensureArray(next[key]);
    });

    next.plan = normalizePlan(next.plan);
    next.sessions = normalizeSessions(next.sessions);
    next.exerciseLogs = normalizeExerciseLogs(next.exerciseLogs);
    relinkSessionExerciseLogs(next.sessions, next.exerciseLogs);

    next.advice = next.advice.map((item) => ({
      ...item,
      status: item.status || "active"
    }));
    next.revisions = next.revisions.map((item) => ({
      ...item,
      status: item.status || "pending"
    }));

    if (!next.gyms.length && defaults?.gyms?.length) next.gyms = clone(defaults.gyms);
    if (next.gyms.length && !next.gyms.some((gym) => gym.id === next.currentGymId)) {
      next.currentGymId = next.gyms[0].id;
    }
    next.schemaVersion = CURRENT_SCHEMA_VERSION;
    return next;
  }

  function normalizePlan(plan) {
    if (!isRecord(plan)) return null;
    const planId = plan.id || stableId("plan", "current", 0);
    return {
      ...plan,
      id: planId,
      schemaVersion: Number(plan.schemaVersion) || CURRENT_SCHEMA_VERSION,
      days: ensureArray(plan.days).map((day, dayIndex) => {
        const dayId = day.id || stableId("day", planId, dayIndex);
        return {
          ...day,
          id: dayId,
          exercises: ensureArray(day.exercises).map((row, rowIndex) => ({
            ...row,
            id: row.id || stableId("planned_exercise", dayId, rowIndex)
          }))
        };
      })
    };
  }

  function normalizeSessions(sessions) {
    return ensureArray(sessions).map((session) => ({
      ...session,
      status: session.status || "completed",
      startedAt: session.startedAt || session.createdAt || null,
      completedAt: session.completedAt || (session.status === "completed" ? session.createdAt || null : null),
      exerciseLogIds: ensureArray(session.exerciseLogIds)
    }));
  }

  function normalizeExerciseLogs(logs) {
    const normalized = [];
    ensureArray(logs).forEach((log) => {
      const sets = normalizeSetLogs(log.sets);
      const draft = {
        ...log,
        sessionId: log.sessionId || null,
        sets
      };
      const stats = buildStats(draft, normalized);
      normalized.push({
        ...draft,
        volumeLoad: typeof log.volumeLoad === "number" ? log.volumeLoad : stats.volumeLoad,
        hardSets: typeof log.hardSets === "number" ? log.hardSets : stats.hardSets,
        simplePr: log.simplePr || stats.simplePr
      });
    });
    return normalized;
  }

  function normalizeSetLogs(sets) {
    return ensureArray(sets).map((set, index) => ({
      ...set,
      id: set.id || stableId("set", "legacy", index),
      setIndex: Number(set.setIndex) || index + 1,
      loadKg: toNumberOrNull(set.loadKg),
      reps: toNumberOrNull(set.reps),
      rpe: toNumberOrNull(set.rpe),
      completed: set.completed !== false,
      note: set.note || ""
    }));
  }

  function relinkSessionExerciseLogs(sessions, exerciseLogs) {
    const byId = new Map(sessions.map((session) => [session.id, session]));
    exerciseLogs.forEach((log) => {
      if (!log.sessionId || !byId.has(log.sessionId)) return;
      const session = byId.get(log.sessionId);
      if (log.id && !session.exerciseLogIds.includes(log.id)) session.exerciseLogIds.push(log.id);
    });
  }

  function buildStats(log, previousLogs) {
    const stats = window.FitnessCore?.TrainingStats;
    if (!stats) return { volumeLoad: 0, hardSets: 0, simplePr: { isPr: false, records: [] } };
    const volumeLoad = stats.calculateVolumeLoad(log.sets || []);
    const hardSets = stats.calculateHardSets(log.sets || []);
    const simplePr = stats.detectSimplePr({ ...log, volumeLoad, hardSets }, previousLogs || []);
    return { volumeLoad, hardSets, simplePr };
  }

  function ensureArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function isRecord(value) {
    return value && typeof value === "object" && !Array.isArray(value);
  }

  function toNumberOrNull(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function stableId(prefix, parent, index) {
    return `${prefix}_${String(parent || "item").replace(/[^a-z0-9_]+/gi, "_")}_${index + 1}`;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value || {}));
  }

  window.FitnessCore = window.FitnessCore || {};
  window.FitnessCore.StateNormalizer = {
    CURRENT_SCHEMA_VERSION,
    normalizeAppState
  };
})();
