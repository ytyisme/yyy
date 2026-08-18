(() => {
  const PRESENCE_ROOM = "yyy-magma-presence-v3";
  const PRESENCE_TOPIC = "yyy/magma-parkour/presence/v3";
  const BROKERS = [
    "wss://broker-cn.emqx.io:8084/mqtt",
    "wss://broker.emqx.io:8084/mqtt",
    "wss://broker.hivemq.com:8884/mqtt",
  ];

  let myId = "";
  let roomId = "";
  let topic = "";
  let playLevel = 0;
  let joined = false;
  let channel = null;
  let presenceChannel = null;
  let mqtt = null;
  let onMessage = null;
  let onCount = null;
  let onStatus = null;
  let onPresence = null;
  let onSocial = null;
  let onPeer = null;
  let beatId = 0;
  const peers = new Map();
  let myName = "玩家";
  const SOCIAL_TYPES = new Set([
    "friendreq",
    "friendok",
    "friendno",
    "dm",
    "invite",
    "inviteok",
    "inviteno",
    "mod",
  ]);

  function notifyCount(n) {
    if (typeof onCount === "function") onCount(n);
  }

  function notifyStatus(status) {
    if (typeof onStatus === "function") onStatus(status);
  }

  function notifyPeer(ev) {
    if (typeof onPeer === "function") onPeer(ev);
  }

  function prunePeers(notify) {
    const now = Date.now();
    for (const [id, p] of [...peers]) {
      if (now - (p.last || 0) > 8000) {
        peers.delete(id);
        if (notify) notifyPeer({ type: "offline", id, name: p.name || "玩家" });
      }
    }
  }

  function presenceCounts() {
    prunePeers(true);
    const counts = {};
    for (const [id, p] of peers) {
      const lv = Math.floor(Number(p.lv) || 0);
      if (lv < 1) continue;
      counts[lv] = (counts[lv] || 0) + 1;
    }
    return counts;
  }

  function notifyPresence() {
    if (typeof onPresence === "function") onPresence(presenceCounts());
  }

  function peerLevels() {
    prunePeers(true);
    const out = {};
    for (const [id, p] of peers) {
      out[id] = Math.floor(Number(p.lv) || 0);
    }
    return out;
  }

  function parseData(raw) {
    if (!raw) return null;
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    if (raw instanceof ArrayBuffer) {
      try {
        return JSON.parse(new TextDecoder().decode(raw));
      } catch {
        return null;
      }
    }
    if (raw instanceof Uint8Array) {
      try {
        return JSON.parse(new TextDecoder().decode(raw));
      } catch {
        return null;
      }
    }
    return raw;
  }

  function handlePresence(msg) {
    if (!msg || msg.id === myId) return;
    if (msg.type === "away" || msg.type === "bye") {
      const prev = peers.get(msg.id);
      peers.delete(msg.id);
      notifyPresence();
      if (prev) notifyPeer({ type: "offline", id: msg.id, name: prev.name || msg.name || "玩家" });
      return;
    }
    if (msg.type === "here") {
      const was = peers.has(msg.id);
      const prev = peers.get(msg.id);
      const name = String(msg.name || (prev && prev.name) || "玩家").slice(0, 16) || "玩家";
      peers.set(msg.id, { lv: Number(msg.lv) || 0, last: Date.now(), name });
      notifyPresence();
      if (!was) notifyPeer({ type: "online", id: msg.id, name });
    }
  }

  function incoming(raw) {
    const msg = parseData(raw);
    if (!msg || msg.id === myId) return;
    if (msg.type === "gchat" || msg.type === "reportlog") {
      if (typeof onSocial === "function") onSocial(msg);
      return;
    }
    if (SOCIAL_TYPES.has(msg.type)) {
      if (!msg.to || msg.to !== myId) return;
      if (typeof onSocial === "function") onSocial(msg);
      return;
    }
    if (msg.room === PRESENCE_ROOM || msg.type === "here" || msg.type === "away") {
      handlePresence(msg);
      return;
    }
    if (!joined || !roomId || msg.room !== roomId) return;
    if (typeof onMessage === "function") onMessage(msg);
  }

  function utf8Bytes(str) {
    return new TextEncoder().encode(str);
  }

  function mqttString(str) {
    const body = utf8Bytes(str);
    const out = new Uint8Array(2 + body.length);
    out[0] = (body.length >> 8) & 255;
    out[1] = body.length & 255;
    out.set(body, 2);
    return out;
  }

  function remainBytes(len) {
    const bytes = [];
    do {
      let d = len % 128;
      len = Math.floor(len / 128);
      if (len > 0) d |= 128;
      bytes.push(d);
    } while (len > 0);
    return bytes;
  }

  function concatBytes(parts) {
    const arrs = parts.map((p) => (p instanceof Uint8Array ? p : new Uint8Array(p)));
    const total = arrs.reduce((sum, a) => sum + a.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const a of arrs) {
      out.set(a, offset);
      offset += a.length;
    }
    return out;
  }

  function mqttPacket(type, flags, variable) {
    const remain = remainBytes(variable.length);
    const out = new Uint8Array(1 + remain.length + variable.length);
    out[0] = (type << 4) | (flags & 15);
    out.set(remain, 1);
    out.set(variable, 1 + remain.length);
    return out;
  }

  function makeConnect(clientId, willTopic, willPayload) {
    const proto = mqttString("MQTT");
    const willT = mqttString(willTopic);
    const willM = mqttString(willPayload);
    const cid = mqttString(clientId);
    const header = new Uint8Array([
      4,
      0x06,
      0,
      30,
    ]);
    return mqttPacket(1, 0, concatBytes([proto, header, cid, willT, willM]));
  }

  function makeSubscribeAll() {
    const id = new Uint8Array([0, 1]);
    const parts = [id, mqttString(PRESENCE_TOPIC), new Uint8Array([0])];
    if (topic) {
      parts.push(mqttString(topic), new Uint8Array([0]));
    }
    return mqttPacket(8, 2, concatBytes(parts));
  }

  function makePublish(pubTopic, payload) {
    return mqttPacket(3, 0, concatBytes([mqttString(pubTopic), utf8Bytes(payload)]));
  }

  function makePing() {
    return new Uint8Array([12 << 4, 0]);
  }

  function makeDisconnect() {
    return new Uint8Array([14 << 4, 0]);
  }

  function readRemain(buf, start) {
    let mul = 1;
    let len = 0;
    let i = start;
    for (;;) {
      if (i >= buf.length) return null;
      const d = buf[i++];
      len += (d & 127) * mul;
      if ((d & 128) === 0) break;
      mul *= 128;
      if (mul > 128 * 128 * 128) return null;
    }
    return { len, next: i };
  }

  function parsePublish(packet) {
    if (packet.payload.length < 2) return null;
    const tlen = (packet.payload[0] << 8) | packet.payload[1];
    if (packet.payload.length < 2 + tlen) return null;
    const body = packet.payload.slice(2 + tlen);
    return new TextDecoder().decode(body);
  }

  function createMqttClient() {
    let ws = null;
    let buf = new Uint8Array(0);
    let pingId = 0;
    const attempts = [];
    for (const url of BROKERS) {
      attempts.push({ url, proto: ["mqtt"] });
      attempts.push({ url, proto: undefined });
    }
    let attemptIndex = 0;
    let closed = false;
    let online = false;
    const clientId = `y${myId}`.replace(/[^A-Za-z0-9]/g, "").slice(0, 22) || `y${Date.now() % 1e8}`;

    function append(chunk) {
      const next = new Uint8Array(buf.length + chunk.length);
      next.set(buf);
      next.set(chunk, buf.length);
      buf = next;
    }

    function pump() {
      while (buf.length >= 2) {
        const remain = readRemain(buf, 1);
        if (!remain) break;
        if (buf.length < remain.next + remain.len) break;
        const type = buf[0] >> 4;
        const payload = buf.slice(remain.next, remain.next + remain.len);
        buf = buf.slice(remain.next + remain.len);
        if (type === 2) {
          const code = payload.length > 1 ? payload[1] : 1;
          if (code !== 0) {
            try {
              ws.close();
            } catch {
              /* ignore */
            }
            return;
          }
          online = true;
          notifyStatus("online");
          notifyCount(1);
          safeSend(makeSubscribeAll());
          beatPresence();
          if (joined) send({ type: "hello" });
        } else if (type === 3) {
          const text = parsePublish({ payload });
          if (text) incoming(text);
        }
      }
    }

    function safeSend(bytes) {
      if (!ws || ws.readyState !== 1) return false;
      try {
        ws.send(bytes);
        return true;
      } catch {
        return false;
      }
    }

    function openBroker() {
      if (closed || attemptIndex >= attempts.length) {
        online = false;
        notifyStatus("offline");
        return;
      }
      notifyStatus("connecting");
      const attempt = attempts[attemptIndex];
      try {
        ws = attempt.proto
          ? new WebSocket(attempt.url, attempt.proto)
          : new WebSocket(attempt.url);
      } catch {
        attemptIndex += 1;
        openBroker();
        return;
      }
      ws.binaryType = "arraybuffer";
      ws.onopen = () => {
        const will = JSON.stringify({ room: PRESENCE_ROOM, id: myId, type: "away" });
        safeSend(makeConnect(clientId, PRESENCE_TOPIC, will));
        pingId = window.setInterval(() => safeSend(makePing()), 20000);
      };
      ws.onmessage = (ev) => {
        const data = ev.data;
        const chunk =
          data instanceof ArrayBuffer
            ? new Uint8Array(data)
            : data instanceof Blob
              ? null
              : utf8Bytes(String(data));
        if (chunk) {
          append(chunk);
          pump();
          return;
        }
        if (data instanceof Blob) {
          data.arrayBuffer().then((ab) => {
            append(new Uint8Array(ab));
            pump();
          });
        }
      };
      ws.onerror = () => {
        /* onclose 会处理重试 */
      };
      ws.onclose = () => {
        window.clearInterval(pingId);
        pingId = 0;
        online = false;
        ws = null;
        if (closed) {
          notifyStatus("offline");
          return;
        }
        attemptIndex += 1;
        window.setTimeout(openBroker, 400);
      };
    }

    openBroker();

    return {
      isOnline: () => online && ws && ws.readyState === 1,
      publish(pubTopic, text) {
        return safeSend(makePublish(pubTopic, text));
      },
      resubscribe() {
        return safeSend(makeSubscribeAll());
      },
      close() {
        closed = true;
        window.clearInterval(pingId);
        try {
          safeSend(makeDisconnect());
        } catch {
          /* ignore */
        }
        try {
          if (ws) ws.close();
        } catch {
          /* ignore */
        }
        ws = null;
        online = false;
      },
    };
  }

  function send(msg) {
    if (!joined || !roomId) return;
    const packed = { room: roomId, id: myId, ...msg };
    const text = JSON.stringify(packed);
    if (channel) {
      try {
        channel.postMessage(packed);
      } catch {
        /* ignore */
      }
    }
    if (mqtt && topic) mqtt.publish(topic, text);
  }

  function sendSocial(msg) {
    if (!myId) return;
    const packed = { room: PRESENCE_ROOM, id: myId, ...msg };
    const text = JSON.stringify(packed);
    if (presenceChannel) {
      try {
        presenceChannel.postMessage(packed);
      } catch {
        /* ignore */
      }
    }
    if (mqtt) mqtt.publish(PRESENCE_TOPIC, text);
  }

  function beatPresence() {
    if (!myId) return;
    const packed = {
      room: PRESENCE_ROOM,
      id: myId,
      type: "here",
      lv: playLevel || 0,
      name: myName || "玩家",
    };
    if (presenceChannel) {
      try {
        presenceChannel.postMessage(packed);
      } catch {
        /* ignore */
      }
    }
    if (mqtt) mqtt.publish(PRESENCE_TOPIC, JSON.stringify(packed));
    notifyPresence();
  }

  function startHeartbeat() {
    if (beatId) return;
    beatId = window.setInterval(() => {
      prunePeers(true);
      beatPresence();
    }, 2500);
  }

  function stopHeartbeat() {
    if (beatId) window.clearInterval(beatId);
    beatId = 0;
  }

  function ensurePresenceChannel() {
    if (presenceChannel) return;
    try {
      presenceChannel = new BroadcastChannel(PRESENCE_ROOM);
      presenceChannel.onmessage = (e) => incoming(e.data);
    } catch {
      presenceChannel = null;
    }
  }

  function roomFor(level) {
    const lv = Math.max(1, Math.floor(Number(level) || 1));
    return {
      room: `yyy-magma-l${lv}-v4`,
      topic: `yyy/magma-parkour/l${lv}/v4`,
    };
  }

  function setName(name) {
    myName = String(name || "玩家").slice(0, 16) || "玩家";
  }

  function watch(id, handlers = {}) {
    myId = id || myId;
    if (handlers.onPresence) onPresence = handlers.onPresence;
    if (handlers.onStatus) onStatus = handlers.onStatus;
    if (handlers.onSocial) onSocial = handlers.onSocial;
    if (handlers.onPeer) onPeer = handlers.onPeer;
    if (handlers.name) setName(handlers.name);
    playLevel = 0;
    ensurePresenceChannel();
    startHeartbeat();
    if (!mqtt) mqtt = createMqttClient();
    beatPresence();
  }

  function join(id, handlers = {}) {
    myId = id || myId;
    onMessage = handlers.onMessage || null;
    onCount = handlers.onCount || null;
    if (handlers.onStatus) onStatus = handlers.onStatus;
    if (handlers.onPresence) onPresence = handlers.onPresence;
    if (handlers.onSocial) onSocial = handlers.onSocial;
    if (handlers.onPeer) onPeer = handlers.onPeer;
    if (handlers.name) setName(handlers.name);
    const spec = roomFor(handlers.level);
    if (joined && roomId && roomId !== spec.room) {
      try {
        send({ type: "bye" });
      } catch {
        /* ignore */
      }
      if (channel) {
        try {
          channel.close();
        } catch {
          /* ignore */
        }
        channel = null;
      }
    }
    roomId = spec.room;
    topic = spec.topic;
    playLevel = Math.max(1, Math.floor(Number(handlers.level) || 1));
    joined = true;
    ensurePresenceChannel();
    startHeartbeat();
    try {
      channel = new BroadcastChannel(roomId);
      channel.onmessage = (e) => incoming(e.data);
    } catch {
      channel = null;
    }
    notifyStatus("connecting");
    notifyCount(1);
    if (!mqtt) mqtt = createMqttClient();
    else mqtt.resubscribe();
    send({ type: "hello" });
    beatPresence();
  }

  function leaveLevel() {
    if (joined) {
      try {
        send({ type: "bye" });
      } catch {
        /* ignore */
      }
    }
    joined = false;
    onMessage = null;
    onCount = null;
    playLevel = 0;
    roomId = "";
    topic = "";
    if (channel) {
      try {
        channel.close();
      } catch {
        /* ignore */
      }
    }
    channel = null;
    beatPresence();
    if (mqtt) mqtt.resubscribe();
  }

  function leave() {
    if (joined) {
      try {
        send({ type: "bye" });
      } catch {
        /* ignore */
      }
    }
    try {
      const packed = { room: PRESENCE_ROOM, id: myId, type: "away" };
      if (presenceChannel) presenceChannel.postMessage(packed);
      if (mqtt) mqtt.publish(PRESENCE_TOPIC, JSON.stringify(packed));
    } catch {
      /* ignore */
    }
    joined = false;
    onMessage = null;
    onCount = null;
    onStatus = null;
    onPresence = null;
    onSocial = null;
    onPeer = null;
    playLevel = 0;
    stopHeartbeat();
    peers.clear();
    if (channel) {
      try {
        channel.close();
      } catch {
        /* ignore */
      }
    }
    channel = null;
    if (presenceChannel) {
      try {
        presenceChannel.close();
      } catch {
        /* ignore */
      }
    }
    presenceChannel = null;
    if (mqtt) {
      try {
        mqtt.close();
      } catch {
        /* ignore */
      }
    }
    mqtt = null;
    myId = "";
    roomId = "";
    topic = "";
  }

  window.LevelCoop = {
    join,
    watch,
    leaveLevel,
    leave,
    send,
    sendSocial,
    setName,
    isJoined: () => joined,
    isOnline: () => !!(mqtt && mqtt.isOnline()),
    myId: () => myId,
    counts: presenceCounts,
    peerLevels,
  };
})();
