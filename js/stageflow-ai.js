(function () {
  "use strict";
  var ROLES = ["Marcenaria", "Eletrica", "Iluminacao", "Audio", "Rigging", "Cenografia", "Logistica", "Seguranca", "Engenharia", "Generico"];
  function guessRole(line) {
    var l = line.toLowerCase();
    if (/eletr|luz|ilumina/i.test(l)) return "Eletrica";
    if (/marcen|madeir|carpint/i.test(l)) return "Marcenaria";
    if (/som|audio|acust/i.test(l)) return "Audio";
    if (/rig|estrutur|truss|talha/i.test(l)) return "Rigging";
    if (/ceno|palco|decor/i.test(l)) return "Cenografia";
    if (/logist|carreg|monta/i.test(l)) return "Logistica";
    if (/segur/i.test(l)) return "Seguranca";
    if (/engenh|revisa|projeto/i.test(l)) return "Engenharia";
    return "Generico";
  }
  function mockFromText(text, projectName) {
    var lines = text.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
    if (!lines.length) lines = ["Tarefa gerada a partir do documento"];
    var tasks = lines.slice(0, 40).map(function (line, idx) {
      return {
        temp_id: "t" + (idx + 1),
        what: line.length > 200 ? line.slice(0, 200) + "..." : line,
        who_role: guessRole(line),
        where_text: "A definir no local",
        when_text: "Conforme cronograma",
        priority: "media",
      };
    });
    return {
      schema_version: "1.0.0",
      source: { detected_medium: "mixed", notes: "Modo demonstracao — configure aiEdgeUrl no config.js para IA real." },
      project: { name: projectName || "Novo projeto" },
      tasks: tasks,
    };
  }
  window.stageflowAi = {
    ROLES: ROLES,
    mockFromText: mockFromText,
    runLayoutReader: async function (text, projectName) {
      var cfg = window.STAGEFLOW_CONFIG || {};
      var url = cfg.aiEdgeUrl;
      if (url) {
        var res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text, project_name: projectName || "" }),
        });
        if (!res.ok) throw new Error("IA: " + res.status);
        var data = await res.json();
        if (data.json) return typeof data.json === "string" ? JSON.parse(data.json) : data.json;
        return data;
      }
      return mockFromText(text, projectName);
    },
    classifyTranscription: function (text) {
      var l = (text || "").toLowerCase();
      var kind = "unknown";
      if (/problema|imped|nao consigo|urgente|socorro/i.test(l)) kind = "problem";
      else if (/pronto|feito|ok|conclu/i.test(l)) kind = "status";
      else if (/preciso|faca|mand|ordem|desce|sobe/i.test(l)) kind = "order";
      else if (text && text.length > 3) kind = "chat";
      var urgency = "media";
      if (/urgente|critico|agora|imediato/i.test(l)) urgency = "alta";
      else if (/ok|tranquilo|depois/i.test(l)) urgency = "baixa";
      return {
        kind: kind,
        urgency: urgency,
        summary: (text || "").slice(0, 160) || "(vazio)",
        suggested_roles: [guessRole(text || "")],
        entities: {},
      };
    },
  };
})();

