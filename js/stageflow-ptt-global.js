(function () {
  "use strict";
  var prepared = false;
  function ensurePanel() {
    if (document.getElementById("stageflow-ptt-root")) return;
    var root = document.createElement("div");
    root.id = "stageflow-ptt-root";
    root.className = "fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2";
    root.innerHTML =
      '<div id="stageflow-ptt-panel" class="hidden max-w-xs rounded-lg border border-amber-600/50 bg-slate-900/95 p-3 text-xs text-slate-200 shadow-xl">' +
      '<p class="mb-2 font-semibold text-amber-400">Talk-to-Talk</p>' +
      '<p class="mb-1">Seu Peer ID: <span id="stageflow-peer-self" class="break-all text-emerald-300">—</span></p>' +
      '<input id="stageflow-peer-remote" class="mb-2 w-full rounded border border-slate-600 bg-slate-800 px-2 py-1" placeholder="ID remoto" />' +
      '<button type="button" id="stageflow-ptt-prepare" class="mb-2 w-full rounded bg-slate-600 px-2 py-1">Preparar mic + Peer</button>' +
      '<p id="stageflow-ptt-msg" class="text-slate-400"></p></div>' +
      '<div class="flex items-end gap-2">' +
      '<button type="button" id="stageflow-ptt-toggle" class="h-10 w-10 rounded-full border border-slate-600 bg-slate-800 text-lg text-amber-400" title="Config">&#9881;</button>' +
      '<button type="button" id="stageflow-talk" class="min-h-[80px] min-w-[80px] rounded-full bg-amber-500 text-lg font-bold text-slate-900 shadow-lg active:scale-95">TALK</button></div>';
    document.body.appendChild(root);
    document.getElementById("stageflow-ptt-toggle").addEventListener("click", function () {
      var p = document.getElementById("stageflow-ptt-panel");
      p.classList.toggle("hidden");
    });
    var talk = document.getElementById("stageflow-talk");
    var msg = function (t) {
      var el = document.getElementById("stageflow-ptt-msg");
      if (el) el.textContent = t;
    };
    document.getElementById("stageflow-ptt-prepare").addEventListener("click", async function () {
      if (!window.stageflowPtt) return msg("PeerJS nao carregado");
      try {
        msg("Microfone…");
        await window.stageflowPtt.acquireMic();
        window.stageflowPtt.setMuted(true);
        var id = await window.stageflowPtt.initPeer();
        var selfEl = document.getElementById("stageflow-peer-self");
        if (selfEl) selfEl.textContent = id;
        prepared = true;
        var remote = (document.getElementById("stageflow-peer-remote") || {}).value;
        if (remote && remote.trim()) {
          await window.stageflowPtt.callPeer(remote.trim());
          msg("Chamada ativa — segure TALK");
        } else msg("Peer OK — informe ID remoto e clique Preparar de novo");
      } catch (e) {
        msg(e.message || "Erro");
      }
    });
    var down = function (e) {
      e.preventDefault();
      if (!prepared) {
        msg("Abra a engrenagem e prepare mic + Peer");
        var p = document.getElementById("stageflow-ptt-panel");
        if (p) p.classList.remove("hidden");
        return;
      }
      window.stageflowPtt.setMuted(false);
      msg("Transmitindo…");
    };
    var up = function () {
      if (!prepared) return;
      window.stageflowPtt.setMuted(true);
      msg("Ouvir");
    };
    talk.addEventListener("pointerdown", down);
    talk.addEventListener("pointerup", up);
    talk.addEventListener("pointerleave", up);
  }
  window.stageflowPttUi = { init: ensurePanel };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ensurePanel);
  else ensurePanel();
})();
