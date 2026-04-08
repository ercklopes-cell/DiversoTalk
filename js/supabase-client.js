(function () {
  "use strict";
  function getConfig() {
    if (!window.STAGEFLOW_CONFIG) {
      console.warn("[StageFlow] Defina config.js a partir de config.example.js");
      return null;
    }
    var c = window.STAGEFLOW_CONFIG;
    if (!c.supabaseUrl || !c.supabaseAnonKey) return null;
    return c;
  }
  window.stageflowSupabase = {
    client: null,
    init: function () {
      var cfg = getConfig();
      if (!cfg || typeof supabase === "undefined") return null;
      this.client = supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      });
      return this.client;
    },
    getClient: function () {
      return this.client || this.init();
    },
  };
})();
