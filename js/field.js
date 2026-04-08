(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
  function pickCurrentTask(projectId, role) {
    var tasks = window.stageflowStore.tasksByProject(projectId);
    var match = function (t) {
      return (t.who_role === role || role === "Generico" || t.who_role === "Generico");
    };
    var order = ["em_execucao", "backlog", "impedido"];
    for (var o = 0; o < order.length; o++) {
      var col = order[o];
      var found = tasks.filter(function (t) { return t.column === col && match(t); });
      if (found.length) return found[0];
    }
    return null;
  }
  async function gate() {
    var s = window.stageflowStore.getSession();
    if (s && s.mode === "demo_field" && s.project_id) return s;
    window.location.href = "index.html";
    return null;
  }
  document.addEventListener("DOMContentLoaded", async function () {
    if (window.stageflowSupabase) window.stageflowSupabase.init();
    var sess = await gate();
    if (!sess) return;
    var pid = sess.project_id;
    var role = sess.role || "Generico";
    $("field-role").textContent = role;
    function render() {
      var t = pickCurrentTask(pid, role);
      var box = $("task-card");
      if (!t) {
        box.innerHTML = "<p class=\"text-xl text-slate-400\">Nenhuma tarefa na fila para este perfil.</p>";
        $("btn-complete").disabled = true;
        return;
      }
      $("btn-complete").disabled = false;
      box.innerHTML =
        "<p class=\"text-2xl font-bold leading-tight text-white\">" + escapeHtml(t.what) + "</p>" +
        "<p class=\"mt-4 text-lg text-slate-300\">Onde: " + escapeHtml(t.where_text) + "</p>" +
        "<p class=\"mt-2 text-lg text-slate-400\">Quando: " + escapeHtml(t.when_text) + "</p>";
      box.dataset.taskId = t.id;
    }
    $("btn-complete").addEventListener("click", function () {
      var tid = ($("task-card") || {}).dataset.taskId;
      var file = ($("photo-input") || {}).files && ($("photo-input") || {}).files[0];
      if (!tid) return;
      if (!file) return alert("Tire ou selecione uma foto do trabalho concluido.");
      var reader = new FileReader();
      reader.onload = function () {
        window.stageflowStore.updateTask(tid, {
          column: "revisao_engenheiro",
          photo_data: reader.result,
          completed_at: new Date().toISOString(),
        });
        ($("photo-input") || {}).value = "";
        render();
        try {
          var beep = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==");
          beep.play();
        } catch (e) {}
      };
      reader.readAsDataURL(file);
    });
    $("btn-impedimento").addEventListener("click", function () {
      var tid = ($("task-card") || {}).dataset.taskId;
      if (!tid) return;
      window.stageflowStore.updateTask(tid, { column: "impedido" });
      render();
    });
    var ex = $("field-exit");
    if (ex) ex.addEventListener("click", function () { window.stageflowAuth.signOut(); });
    render();
  });
})();
