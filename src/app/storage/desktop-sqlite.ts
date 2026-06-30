(function () {
  "use strict";

  function tauriInvoke() {
    const tauri = (window as any).__TAURI__;
    return tauri?.core?.invoke || tauri?.tauri?.invoke || null;
  }

  function isAvailable() {
    return typeof tauriInvoke() === "function";
  }

  async function loadAppState() {
    const invoke = tauriInvoke();
    if (!invoke) return null;
    const json = await invoke("load_app_state");
    if (!json) return null;
    return JSON.parse(String(json));
  }

  async function saveAppState(state) {
    const invoke = tauriInvoke();
    if (!invoke) return false;
    await invoke("save_app_state", {
      stateJson: JSON.stringify(state)
    });
    return true;
  }

  window.FitnessCore = window.FitnessCore || {};
  window.FitnessCore.DesktopStorage = {
    isAvailable,
    loadAppState,
    saveAppState
  };
})();
