(function () {
  "use strict";

  type JsonRecord = Record<string, unknown>;
  type StateStoreCallbacks = {
    onHydrated?: (state: unknown) => void;
    onPersistError?: (error: unknown) => void;
    onError?: (error: unknown) => void;
  };

  function createDefaultState({ fitnessData, normalizer }) {
    return {
      schemaVersion: normalizer.CURRENT_SCHEMA_VERSION,
      currentGymId: "gym_default",
      currentGoalId: null,
      gyms: clone(fitnessData.defaultGyms),
      exercises: clone(fitnessData.exercises),
      goals: [],
      metrics: [],
      plan: null,
      sessions: [],
      exerciseLogs: [],
      nutritionLogs: [],
      feedback: [],
      advice: [],
      revisions: []
    };
  }

  function prepareState(data, context) {
    const base = createDefaultState(context);
    const builtInExercises = context.fitnessData.exercises || [];
    const byId = new Map(builtInExercises.map((item) => [item.id, item]));
    (Array.isArray(data?.exercises) ? data.exercises : []).forEach((item) => {
      byId.set(item.id, { ...((byId.get(item.id) as JsonRecord) || {}), ...item });
    });
    const next = { ...base, ...(data || {}), exercises: Array.from(byId.values()) };
    return normalizeState(next, context);
  }

  function normalizeState(state, context) {
    return context.normalizer.normalizeAppState(state, createDefaultState(context));
  }

  function loadLocalState(context) {
    const raw = localStorage.getItem(context.storageKey);
    if (!raw) return createDefaultState(context);
    try {
      return prepareState(JSON.parse(raw), context);
    } catch {
      return createDefaultState(context);
    }
  }

  function saveLocalState(state, context) {
    const next = normalizeState(state, context);
    localStorage.setItem(context.storageKey, JSON.stringify(next));
    return next;
  }

  async function hydrateDesktopState(currentState, context, callbacks: StateStoreCallbacks = {}) {
    const storage = context.desktopStorage;
    if (!storage?.isAvailable()) return;
    try {
      const desktopState = await storage.loadAppState();
      if (desktopState) {
        const next = prepareState(desktopState, context);
        localStorage.setItem(context.storageKey, JSON.stringify(next));
        callbacks.onHydrated?.(next);
      } else {
        persistDesktopState(currentState, context, {
          onError: callbacks.onPersistError || callbacks.onError
        });
      }
    } catch (error) {
      callbacks.onError?.(error);
    }
  }

  function persistDesktopState(state, context, callbacks: StateStoreCallbacks = {}) {
    const storage = context.desktopStorage;
    if (!storage?.isAvailable()) return;
    storage.saveAppState(state).catch((error) => {
      callbacks.onError?.(error);
    });
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  window.FitnessCore = window.FitnessCore || {};
  window.FitnessCore.AppStateStore = {
    createDefaultState,
    prepareState,
    normalizeState,
    loadLocalState,
    saveLocalState,
    hydrateDesktopState,
    persistDesktopState
  };
})();
