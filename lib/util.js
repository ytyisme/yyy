(() => {
  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function seededRng(seed) {
    let s = seed | 0;
    return () => {
      s = Math.imul(s ^ (s >>> 15), 1 | s);
      s ^= s + Math.imul(s ^ (s >>> 7), 61 | s);
      return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
    };
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function drawStarShape(ctx, cx, cy, r, fill, stroke) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      const b = a + Math.PI / 5;
      const r1 = r;
      const r2 = r * 0.42;
      if (i === 0) ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      else ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(b) * r2, cy + Math.sin(b) * r2);
    }
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null || raw === "") return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function saveJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }

  function loadStr(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v == null ? fallback : v;
    } catch {
      return fallback;
    }
  }

  function saveStr(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch {
      /* ignore */
    }
  }

  function setHidden(el, hidden) {
    if (!el) return;
    el.classList.toggle("hidden", !!hidden);
    el.setAttribute("aria-hidden", hidden ? "true" : "false");
  }

  function liveScope(read, write, names) {
    const listed = new Set(names.split(","));
    const bag = Object.create(null);
    return new Proxy(bag, {
      has(_, prop) {
        return typeof prop === "string" && (listed.has(prop) || Object.prototype.hasOwnProperty.call(bag, prop));
      },
      get(_, prop) {
        if (typeof prop !== "string") return undefined;
        if (listed.has(prop)) return read(prop);
        return bag[prop];
      },
      set(_, prop, value) {
        if (typeof prop !== "string") return false;
        if (listed.has(prop)) {
          write(prop, value);
          return true;
        }
        bag[prop] = value;
        return true;
      },
    });
  }

  window.GameUtil = {
    clamp,
    rand,
    seededRng,
    rectsOverlap,
    drawStarShape,
    escapeHtml,
    loadJson,
    saveJson,
    loadStr,
    saveStr,
    setHidden,
    liveScope,
  };
})();
