(function () {
  "use strict";
  var KEY = "stageflow_demo_v1";
  var SESSION = "stageflow_session_v1";
  var defaultState = function () {
    return { projects: [], tasks: [], invites: [], transcriptions: [], profiles: [] };
  };
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return defaultState();
      var o = JSON.parse(raw);
      if (!o.projects) o.projects = [];
      if (!o.tasks) o.tasks = [];
      if (!o.invites) o.invites = [];
      if (!o.transcriptions) o.transcriptions = [];
      return o;
    } catch (e) {
      return defaultState();
    }
  }
  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }
  function getSession() {
    try {
      var raw = localStorage.getItem(SESSION);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function setSession(s) {
    if (s) localStorage.setItem(SESSION, JSON.stringify(s));
    else localStorage.removeItem(SESSION);
  }
  window.stageflowStore = {
    load: load,
    save: save,
    getSession: getSession,
    setSession: setSession,
    addProject: function (name) {
      var st = load();
      var id = window.stageflowCore.uid();
      st.projects.push({ id: id, name: name, created_at: new Date().toISOString() });
      save(st);
      return id;
    },
    addTask: function (task) {
      var st = load();
      st.tasks.push(task);
      save(st);
    },
    updateTask: function (id, patch) {
      var st = load();
      for (var i = 0; i < st.tasks.length; i++) {
        if (st.tasks[i].id === id) {
          for (var k in patch) if (Object.prototype.hasOwnProperty.call(patch, k)) st.tasks[i][k] = patch[k];
          save(st);
          return st.tasks[i];
        }
      }
      return null;
    },
    tasksByProject: function (projectId) {
      return load().tasks.filter(function (t) { return t.project_id === projectId; });
    },
    addInvite: function (inv) {
      var st = load();
      st.invites.push(inv);
      save(st);
    },
    findInvite: function (token) {
      return load().invites.find(function (i) { return i.token === token; }) || null;
    },
    addTranscription: function (row) {
      var st = load();
      st.transcriptions.unshift(row);
      if (st.transcriptions.length > 200) st.transcriptions.length = 200;
      save(st);
    },
    transcriptionsByProject: function (projectId) {
      return load().transcriptions.filter(function (x) { return x.project_id === projectId; });
    },
  };
})();
