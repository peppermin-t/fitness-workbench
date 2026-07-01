(function () {
  "use strict";

  function createToastController(selector: string, hideDelayMs = 2600) {
    let timer: ReturnType<typeof setTimeout> | null = null;

    return function toast(message: string) {
      const el = document.querySelector(selector);
      if (!el) return;
      el.textContent = message;
      el.classList.add("show");
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => el.classList.remove("show"), hideDelayMs);
    };
  }

  function create() {
    return {
      $(selector: string) {
        return document.querySelector(selector);
      },
      $$(selector: string) {
        return Array.from(document.querySelectorAll(selector));
      },
      createToastController
    };
  }

  window.FitnessApp = window.FitnessApp || {};
  window.FitnessApp.DomUtils = {
    create
  };
})();
