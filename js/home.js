(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  document.addEventListener("DOMContentLoaded", function () {
    if (window.stageflowSupabase) window.stageflowSupabase.init();
    async function refresh() {
      var c = window.stageflowSupabase && window.stageflowSupabase.getClient();
      var email = null;
      if (c) {
        var r = await c.auth.getSession();
        if (r.data.session) email = r.data.session.user.email;
      }
      var st = $("auth-home-status");
      if (st) st.textContent = email ? "Logado: " + email : "Use demo ou login Google (Supabase).";
    }
    refresh();
    if (window.stageflowSupabase && window.stageflowSupabase.getClient()) {
      window.stageflowSupabase.getClient().auth.onAuthStateChange(function () { refresh(); });
    }
    var btnDemo = $("btn-demo-supervisor");
    if (btnDemo) btnDemo.addEventListener("click", function () {
      window.stageflowAuth.startDemoSupervisor();
      window.location.href = "supervisor.html";
    });
    var btnGoogle = $("btn-google-home");
    if (btnGoogle) btnGoogle.addEventListener("click", async function () {
      var c = window.stageflowSupabase && window.stageflowSupabase.getClient();
      if (!c) return alert("Configure config.js com Supabase");
      await c.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + window.location.pathname },
      });
    });
    var btnOut = $("btn-signout-home");
    if (btnOut) btnOut.addEventListener("click", async function () {
      window.stageflowAuth.signOut();
      refresh();
    });
  });
})();
