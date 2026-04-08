(function () {
  "use strict";
  function uid() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return "id-" + Date.now() + "-" + Math.random().toString(36).slice(2, 11);
  }
  window.stageflowCore = { uid: uid };
})();
