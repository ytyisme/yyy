(() => {
  const L = GameLevels;
  const N = (f, b) => ({ f, b: b != null ? b : 1 });

  L.register(19, (g) => {
    const groundY = 400;
    const arena = { x: 40, y: 60, w: 880, h: groundY - 60 };

    L.plat(g, arena.x, groundY, arena.w, 28, "ground", { theme: "musicFloor", musicHit: true });
    L.plat(g, arena.x, arena.y, arena.w, 16, "roof", { theme: "musicWall", musicHit: true });
    L.plat(g, arena.x, arena.y, 16, arena.h, "mid", { theme: "musicWall", musicHit: true });
    L.plat(g, arena.x + arena.w - 16, arena.y, 16, arena.h, "mid", { theme: "musicWall", musicHit: true });
    L.plat(g, 280, 140, 14, 130, "mid", { theme: "musicWall", musicHit: true });
    L.plat(g, 520, 180, 14, 150, "mid", { theme: "musicWall", musicHit: true });
    L.plat(g, 680, 120, 110, 14, "mid", { theme: "musicWall", musicHit: true });

    // Cursor 合集 · 纯音乐段落（无名）
    const parts = [
      {
        id: "a",
        color: "#6ad4ff",
        style: "cool",
        bpm: 112,
        notes: [
          N(523, 2), N(659, 1), N(784, 1), N(659, 2), N(587, 1), N(523, 1), N(440, 2),
          N(523, 1), N(659, 1), N(784, 2), N(880, 1), N(784, 1), N(659, 2), N(523, 2),
          N(392, 1), N(440, 1), N(523, 2), N(659, 1), N(784, 1), N(659, 2), N(587, 1), N(523, 2),
          N(440, 1), N(523, 1), N(659, 2), N(784, 2), N(880, 1), N(1047, 3), N(784, 1), N(659, 2),
        ],
      },
      {
        id: "b",
        color: "#ff9fbf",
        style: "pluck",
        bpm: 100,
        notes: [
          N(392, 2), N(440, 1), N(494, 1), N(523, 2), N(587, 1), N(523, 1), N(440, 2), N(392, 2),
          N(349, 2), N(392, 1), N(440, 1), N(494, 2), N(523, 1), N(494, 1), N(440, 2), N(349, 2),
          N(523, 1), N(587, 1), N(659, 2), N(587, 1), N(523, 1), N(494, 2), N(440, 1), N(494, 1),
          N(523, 2), N(587, 1), N(659, 2), N(587, 1), N(523, 3), N(440, 1), N(392, 2), N(440, 1), N(523, 3),
        ],
      },
      {
        id: "c",
        color: "#ffd24a",
        style: "fly",
        bpm: 108,
        notes: [
          N(262, 1), N(330, 1), N(392, 2), N(523, 2), N(392, 1), N(523, 1), N(659, 2), N(784, 3),
          N(523, 1), N(659, 1), N(784, 2), N(1047, 2), N(880, 1), N(784, 1), N(659, 2), N(523, 3),
          N(392, 1), N(523, 1), N(659, 2), N(784, 1), N(880, 1), N(784, 2), N(659, 1), N(523, 1), N(392, 2), N(330, 1), N(262, 3),
          N(330, 1), N(392, 1), N(523, 2), N(659, 2), N(784, 1), N(880, 2), N(784, 1), N(659, 1), N(523, 3),
        ],
      },
      {
        id: "d",
        color: "#b8ff6a",
        style: "batida",
        bpm: 120,
        notes: [
          N(98, 2), N(147, 1), N(98, 1), N(196, 2), N(147, 1), N(98, 2), N(0, 1),
          N(110, 2), N(165, 1), N(110, 1), N(220, 2), N(165, 1), N(110, 2), N(0, 1),
          N(98, 1), N(147, 1), N(196, 2), N(247, 1), N(196, 1), N(147, 2), N(98, 2),
          N(147, 1), N(196, 1), N(247, 2), N(294, 1), N(247, 1), N(196, 2), N(98, 3), N(196, 1), N(98, 2),
        ],
      },
      {
        id: "e",
        color: "#d47aff",
        style: "chant",
        bpm: 88,
        notes: [
          N(330, 2), N(392, 1), N(440, 1), N(392, 2), N(330, 2), N(294, 1), N(262, 3),
          N(330, 1), N(392, 1), N(440, 2), N(523, 2), N(440, 1), N(392, 1), N(330, 3),
          N(262, 1), N(294, 1), N(330, 2), N(349, 1), N(392, 1), N(349, 2), N(330, 1), N(294, 1), N(262, 2), N(220, 3),
          N(330, 1), N(392, 1), N(440, 2), N(523, 1), N(587, 2), N(523, 1), N(440, 1), N(392, 2),
          N(330, 2), N(294, 1), N(262, 1), N(330, 3), N(392, 1), N(330, 1), N(262, 3),
        ],
      },
      {
        id: "f",
        color: "#ff8a5c",
        style: "bounce",
        bpm: 108,
        notes: [
          N(392, 2), N(440, 1), N(523, 1), N(659, 2), N(523, 1), N(440, 1), N(392, 2), N(349, 1), N(392, 3),
          N(440, 1), N(494, 1), N(587, 2), N(698, 1), N(587, 1), N(494, 2), N(440, 1), N(392, 1), N(349, 2), N(330, 3),
          N(349, 1), N(392, 1), N(440, 2), N(523, 1), N(587, 1), N(659, 2), N(587, 1), N(523, 1), N(440, 3),
          N(392, 1), N(440, 1), N(523, 2), N(440, 1), N(392, 1), N(349, 2), N(330, 1), N(349, 1), N(392, 3),
          N(523, 1), N(587, 1), N(659, 2), N(587, 1), N(523, 1), N(440, 2), N(392, 1), N(440, 1), N(392, 4),
        ],
      },
    ];

    const mixNotes = [];
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (i > 0) {
        mixNotes.push({ f: 0, b: 2, style: p.style, bpm: p.bpm, color: p.color });
        const root = Math.round((p.notes[0] && p.notes[0].f) || 392);
        mixNotes.push({ f: root / 2, b: 2, style: p.style, bpm: p.bpm, color: p.color });
        mixNotes.push({ f: root, b: 2, style: p.style, bpm: p.bpm, color: p.color });
      }
      for (const n of p.notes) {
        mixNotes.push({
          f: n.f,
          b: n.b,
          style: p.style,
          bpm: p.bpm,
          color: p.color,
        });
      }
    }

    const songs = [
      {
        id: "cursor-mix",
        title: "Cursor合集·纯音乐",
        color: "#9fd4ff",
        style: "cool",
        bpm: 120,
        notes: mixNotes,
        parts,
      },
    ];

    const musicScene = {
      arena,
      groundY,
      ball: { x: 220, y: 200, r: 12, vx: 220, vy: -180, trail: [] },
      songs,
      songIndex: 0,
      noteIndex: 0,
      songT: 0,
      hitFlash: 0,
      lastHitT: 0,
      toast: "",
      toastT: 0,
      done: false,
      bounceCount: 0,
      sparks: [],
      playing: false,
      mode: "synth",
      trackProgress: 0,
      trackDuration: 0,
      missingHint: "",
      playlistLoaded: true,
      partTitle: "",
      partColor: parts[0].color,
      disclaimer: "Cursor合集·纯音乐，请欣赏",
    };

    L.finish(g, {
      homeMode: true,
      spawnX: 140,
      floorY: groundY,
      worldWidth: 960,
      worldMin: 0,
      star: null,
      fakeLava: true,
      extra: { musicScene },
    });
  });
})();
