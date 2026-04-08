(function () {
  "use strict";
  document.addEventListener("DOMContentLoaded", function () {
    var params = new URLSearchParams(window.location.search);
    var token = params.get("token");
    var msg = document.getElementById("join-msg");
    if (!token) {
      if (msg) msg.textContent = "Token ausente.";
      return;
    }
    var inv = window.stageflowStore.findInvite(token);
    if (!inv) {
      if (msg) msg.textContent = "Convite invalido ou expirado (modo demo: gere no supervisor).";
      return;
    }
    window.stageflowAuth.startDemoField(inv.project_id, inv.role);
    if (msg) msg.textContent = "Redirecionando…";
    window.location.replace("field.html");
  });
})();
