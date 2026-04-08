(function () {
  "use strict";
  var COLS = [
    { key: "backlog", label: "Backlog" },
    { key: "em_execucao", label: "Em execucao" },
    { key: "impedido", label: "Impedido" },
    { key: "revisao_engenheiro", label: "Revisao eng." },
    { key: "concluido", label: "Concluido" },
  ];
  function $(id) { return document.getElementById(id); }
  function currentProjectId() {
    var sel = $("project-select");
    return sel && sel.value ? sel.value : "";
  }
  function refreshProjects() {
    var st = window.stageflowStore.load();
    var sel = $("project-select");
    if (!sel) return;
    sel.innerHTML = "";
    var opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = "Selecione um projeto";
    sel.appendChild(opt0);
    st.projects.forEach(function (p) {
      var o = document.createElement("option");
      o.value = p.id;
      o.textContent = p.name;
      sel.appendChild(o);
    });
  }
  function refreshKanban() {
    var pid = currentProjectId();
    var wrap = $("kanban-wrap");
    if (!wrap) return;
    wrap.innerHTML = "";
    if (!pid) {
      wrap.textContent = "Crie ou selecione um projeto.";
      return;
    }
    var tasks = window.stageflowStore.tasksByProject(pid);
    COLS.forEach(function (col) {
      var colEl = document.createElement("div");
      colEl.className = "min-w-[200px] flex-1 rounded-lg border border-slate-600 bg-slate-800/40 p-2";
      var h = document.createElement("h3");
      h.className = "mb-2 text-sm font-semibold text-amber-400";
      h.textContent = col.label;
      colEl.appendChild(h);
      var list = tasks.filter(function (t) { return t.column === col.key; });
      list.forEach(function (t) {
        var card = document.createElement("div");
        card.className = "mb-2 rounded border border-slate-600 bg-slate-900 p-2 text-xs";
        card.innerHTML =
          "<p class=\"font-medium text-slate-100\">" + escapeHtml(t.what) + "</p>" +
          "<p class=\"text-slate-400\">" + escapeHtml(t.who_role) + " · " + escapeHtml(t.where_text) + "</p>";
        var nav = document.createElement("div");
        nav.className = "mt-2 flex flex-wrap gap-1";
        COLS.forEach(function (c2) {
          if (c2.key === t.column) return;
          var b = document.createElement("button");
          b.type = "button";
          b.className = "rounded bg-slate-700 px-1 py-0.5 text-[10px]";
          b.textContent = c2.label;
          b.addEventListener("click", function () {
            window.stageflowStore.updateTask(t.id, { column: c2.key });
            refreshKanban();
          });
          nav.appendChild(b);
        });
        card.appendChild(nav);
        colEl.appendChild(card);
      });
      wrap.appendChild(colEl);
    });
  }
  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
  function refreshFeed() {
    var pid = currentProjectId();
    var el = $("feed-list");
    if (!el) return;
    el.innerHTML = "";
    if (!pid) return;
    var rows = window.stageflowStore.transcriptionsByProject(pid);
    rows.slice(0, 50).forEach(function (r) {
      var li = document.createElement("li");
      li.className = "border-b border-slate-700 py-2 text-sm";
      li.innerHTML =
        "<span class=\"text-amber-400\">[" + escapeHtml(r.kind) + "]</span> " +
        "<span class=\"text-slate-500\">" + escapeHtml(r.urgency) + "</span><br/>" +
        escapeHtml(r.summary);
      el.appendChild(li);
    });
  }
  async function gate() {
    if (window.stageflowAuth.isDemoSupervisor()) return true;
    var c = window.stageflowSupabase && window.stageflowSupabase.getClient();
    if (!c) {
      window.location.href = "index.html";
      return false;
    }
    var r = await c.auth.getSession();
    if (r.data.session) return true;
    window.location.href = "index.html";
    return false;
  }
  document.addEventListener("DOMContentLoaded", async function () {
    if (window.stageflowSupabase) window.stageflowSupabase.init();
    var ok = await gate();
    if (!ok) return;
    var label = $("user-label");
    if (label) label.textContent = (await window.stageflowAuth.getUserLabel()) || "";
    refreshProjects();
    $("project-select").addEventListener("change", function () {
      refreshKanban();
      refreshFeed();
      updateInviteLink();
    });
    $("btn-new-project").addEventListener("click", function () {
      var name = ($("new-project-name") || {}).value || "";
      if (!name.trim()) return alert("Nome do projeto");
      window.stageflowStore.addProject(name.trim());
      ($("new-project-name") || {}).value = "";
      refreshProjects();
    });
    $("btn-import-ai").addEventListener("click", async function () {
      var pid = currentProjectId();
      var txt = ($("layout-input") || {}).value || "";
      var pname = "";
      if (pid) {
        var st = window.stageflowStore.load();
        var pr = st.projects.find(function (p) { return p.id === pid; });
        if (pr) pname = pr.name;
      }
      if (!pid) {
        pname = ($("new-project-name") || {}).value || "Projeto importado";
        pid = window.stageflowStore.addProject(pname);
        refreshProjects();
        $("project-select").value = pid;
      }
      try {
        $("import-status").textContent = "Processando…";
        var json = await window.stageflowAi.runLayoutReader(txt, pname);
        var tasks = json.tasks || [];
        tasks.forEach(function (t) {
          window.stageflowStore.addTask({
            id: window.stageflowCore.uid(),
            project_id: pid,
            what: t.what,
            who_role: t.who_role || "Generico",
            where_text: t.where_text || "",
            when_text: t.when_text || "",
            column: "backlog",
            priority: t.priority || "media",
          });
        });
        $("import-status").textContent = "Importadas " + tasks.length + " tarefas.";
        refreshKanban();
      } catch (e) {
        $("import-status").textContent = e.message || "Erro";
      }
    });
    $("btn-gen-invite").addEventListener("click", function () {
      var pid = currentProjectId();
      var role = ($("invite-role") || {}).value || "Generico";
      if (!pid) return alert("Selecione um projeto");
      var token = "sf-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      window.stageflowStore.addInvite({ token: token, project_id: pid, role: role, created_at: new Date().toISOString() });
      var link = new URL("join.html", window.location.href).href + "?token=" + encodeURIComponent(token);
      var out = $("invite-link-out");
      if (out) {
        out.textContent = link;
        out.setAttribute("href", link);
      }
    });
    $("btn-feed-mic").addEventListener("click", function () {
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) return alert("Web Speech API indisponivel");
      var pid = currentProjectId();
      if (!pid) return alert("Selecione um projeto");
      var rec = new SR();
      rec.lang = "pt-BR";
      rec.onresult = function (ev) {
        var text = ev.results[0][0].transcript;
        var cls = window.stageflowAi.classifyTranscription(text);
        window.stageflowStore.addTranscription({
          id: window.stageflowCore.uid(),
          project_id: pid,
          raw_text: text,
          kind: cls.kind,
          urgency: cls.urgency,
          summary: cls.summary,
          created_at: new Date().toISOString(),
        });
        refreshFeed();
      };
      rec.start();
    });
    function updateInviteLink() {
      var out = $("invite-link-out");
      if (out && !out.textContent) out.textContent = "Gere um convite acima.";
    }
    refreshKanban();
    refreshFeed();
  });
})();

