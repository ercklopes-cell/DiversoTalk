(function () {
  "use strict";
  var state = { peer: null, localStream: null, remoteAudio: null, peerId: null };
  function getPeerOptions() {
    var c = window.STAGEFLOW_CONFIG || {};
    return {
      host: c.peerJsHost || "0.peerjs.com",
      port: c.peerJsPort != null ? c.peerJsPort : 443,
      path: c.peerJsPath || "/",
      secure: c.peerJsSecure !== false,
    };
  }
  function playRemote(stream) {
    if (state.remoteAudio) state.remoteAudio.remove();
    var el = document.createElement("audio");
    el.autoplay = true;
    el.playsInline = true;
    el.srcObject = stream;
    el.style.display = "none";
    document.body.appendChild(el);
    state.remoteAudio = el;
  }
  window.stageflowPtt = {
    initPeer: function (customId) {
      if (typeof Peer === "undefined") return Promise.reject(new Error("PeerJS ausente"));
      return new Promise(function (resolve, reject) {
        var opts = getPeerOptions();
        if (state.peer && state.peerId) { resolve(state.peerId); return; }
        state.peer = customId ? new Peer(customId, opts) : new Peer(opts);
        state.peer.on("open", function (id) {
          state.peerId = id;
          resolve(id);
        });
        state.peer.on("error", reject);
        state.peer.on("call", function (call) {
          if (!state.localStream) {
            call.close();
            return;
          }
          call.answer(state.localStream);
          call.on("stream", function (remoteStream) {
            playRemote(remoteStream);
          });
        });
      });
    },
    acquireMic: function () {
      return navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(function (stream) {
        state.localStream = stream;
        return stream;
      });
    },
    callPeer: function (remoteId) {
      if (!state.peer || !state.localStream) return Promise.reject(new Error("Peer ou microfone nao pronto"));
      var call = state.peer.call(remoteId, state.localStream);
      return new Promise(function (resolve, reject) {
        call.on("stream", function (remoteStream) {
          playRemote(remoteStream);
          resolve(call);
        });
        call.on("error", reject);
      });
    },
    setMuted: function (muted) {
      if (!state.localStream) return;
      state.localStream.getAudioTracks().forEach(function (t) {
        t.enabled = !muted;
      });
    },
    destroy: function () {
      if (state.localStream) {
        state.localStream.getTracks().forEach(function (t) {
          t.stop();
        });
        state.localStream = null;
      }
      if (state.peer) {
        state.peer.destroy();
        state.peer = null;
      }
      if (state.remoteAudio) {
        state.remoteAudio.remove();
        state.remoteAudio = null;
      }
    },
  };
})();

