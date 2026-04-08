(function () {
  "use strict";
  function getClient() {
    return window.stageflowSupabase && window.stageflowSupabase.getClient();
  }
  window.stageflowAuth = {
    isDemoSupervisor: function () {
      var s = window.stageflowStore.getSession();
      return s && s.mode === "demo_supervisor";
    },
    isDemoField: function () {
      var s = window.stageflowStore.getSession();
      return s && s.mode === "demo_field";
    },
    startDemoSupervisor: function () {
      window.stageflowStore.setSession({ mode: "demo_supervisor", at: new Date().toISOString() });
    },
    startDemoField: function (projectId, role) {
      window.stageflowStore.setSession({ mode: "demo_field", project_id: projectId, role: role || "Generico", at: new Date().toISOString() });
    },
    signOut: function () {
      window.stageflowStore.setSession(null);
      var c = getClient();
      if (c) c.auth.signOut();
    },
    async getUserLabel: function () {
      var c = getClient();
      if (c) {
        var r = await c.auth.getUser();
        if (r.data && r.data.user) return r.data.user.email || r.data.user.id;
      }
      var s = window.stageflowStore.getSession();
      if (s && s.mode === "demo_supervisor") return "Demo Supervisor";
      if (s && s.mode === "demo_field") return "Demo Campo (" + (s.role || "") + ")";
      return null;
    },
  };
})();
