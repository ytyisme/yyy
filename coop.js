(() => {
  const ROOM = "yyy-magma-l11-v2";
  const TOPIC = "yyy/magma-parkour/l11/v2";
  const BROKERS = [
    "wss://broker.emqx.io:8084/mqtt",
    "wss://broker.hivemq.com:8884/mqtt",
  ];

  let myId = "";
  let joined = false;
  let channel = null;
  let mqtt = null;
  let onMessage = null;
  let onCount = null;
  let onStatus = null;

  function notifyCount(n) {
    if (typeof onCount === "function") onCount(n);
  }

  function notifyStatus(status) {
    if (typeof onStatus === "function") onStatus(status);
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

  function incoming(raw) {
    const msg = parseData(raw);
    if (!msg || msg.room !== ROOM || msg.id === myId) return;
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
      4, // protocol level 3.1.1
      0x06, // clean session + will, qos 0
      0,
      30, // keepalive
    ]);
    return mqttPacket(1, 0, concatBytes([proto, header, cid, willT, willM]));
  }

  function makeSubscribe(topic) {
    const id = new Uint8Array([0, 1]);
    const qos = new Uint8Array([0]);
    return mqttPacket(8, 2, concatBytes([id, mqttString(topic), qos]));
  }

  function makePublish(topic, payload) {
    return mqttPacket(3, 0, concatBytes([mqttString(topic), utf8Bytes(payload)]));
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
          safeSend(makeSubscribe(TOPIC));
          send({ type: "hello" });
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
        const will = JSON.stringify({ room: ROOM, id: myId, type: "bye" });
        safeSend(makeConnect(clientId, TOPIC, will));
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
      publish(text) {
        return safeSend(makePublish(TOPIC, text));
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
    if (!joined) return;
    const packed = { room: ROOM, id: myId, ...msg };
    const text = JSON.stringify(packed);
    if (channel) {
      try {
        channel.postMessage(packed);
      } catch {
        /* ignore */
      }
    }
    if (mqtt) mqtt.publish(text);
  }

  function join(id, handlers = {}) {
    leave();
    myId = id;
    onMessage = handlers.onMessage || null;
    onCount = handlers.onCount || null;
    onStatus = handlers.onStatus || null;
    joined = true;
    notifyStatus("connecting");
    try {
      channel = new BroadcastChannel(ROOM);
      channel.onmessage = (e) => incoming(e.data);
    } catch {
      channel = null;
    }
    send({ type: "hello" });
    notifyCount(1);
    mqtt = createMqttClient();
  }

  function leave() {
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
    onStatus = null;
    if (channel) {
      try {
        channel.close();
      } catch {
        /* ignore */
      }
    }
    channel = null;
    if (mqtt) {
      try {
        mqtt.close();
      } catch {
        /* ignore */
      }
    }
    mqtt = null;
    myId = "";
  }

  window.LevelCoop = {
    join,
    leave,
    send,
    isJoined: () => joined,
    isOnline: () => !!(mqtt && mqtt.isOnline()),
    myId: () => myId,
  };
})();
