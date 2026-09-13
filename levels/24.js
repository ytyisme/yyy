(() => {
  const L = GameLevels;

  L.register(24, (g) => {
    const WORLD_W = 960;
    const TOP_Y = 60;
    const FLOOR_Y = 920;
    const LAYER = 44;
    // 普通跳跃大约能到 ~100px，台阶控制在 70–85，保证能跳上去
    const STEP = 78;

    // 竖井两侧岩壁
    L.plat(g, 80, TOP_Y, 36, FLOOR_Y - TOP_Y + 40, "mid", { theme: "furnaceWall" });
    L.plat(g, WORLD_W - 116, TOP_Y, 36, FLOOR_Y - TOP_Y + 40, "mid", { theme: "furnaceWall" });

    // 底部起始台
    L.plat(g, 200, FLOOR_Y, 560, 22, "ground", { theme: "furnaceStone" });

    // 高低错落的石台（相对地面逐级升高，左右交错方便跳）
    const pillars = [
      { x: 240, top: FLOOR_Y - STEP, w: 70 },
      { x: 400, top: FLOOR_Y - STEP * 2, w: 64 },
      { x: 560, top: FLOOR_Y - STEP * 3, w: 70 },
      { x: 300, top: FLOOR_Y - STEP * 4, w: 66 },
      { x: 480, top: FLOOR_Y - STEP * 5, w: 72 },
      { x: 620, top: FLOOR_Y - STEP * 6, w: 64 },
      { x: 260, top: FLOOR_Y - STEP * 7, w: 68 },
      { x: 430, top: FLOOR_Y - STEP * 8, w: 70 },
      { x: 580, top: FLOOR_Y - STEP * 9, w: 66 },
      { x: 340, top: FLOOR_Y - STEP * 10, w: 68 },
      { x: 500, top: FLOOR_Y - STEP * 11, w: 72 },
    ];

    for (const p of pillars) {
      // 石柱：台面厚一点，柱身接到下层附近
      const capH = 20;
      L.plat(g, p.x, p.top, p.w, capH, "ground", { theme: "furnaceStone" });
      const shaftH = Math.min(FLOOR_Y - (p.top + capH), STEP * 2.2);
      if (shaftH > 8) {
        L.plat(g, p.x + p.w * 0.22, p.top + capH, p.w * 0.56, shaftH, "mid", {
          theme: "furnaceStone",
        });
      }
    }

    const portal = { x: 430, y: TOP_Y + 8, w: 100, h: 70 };

    // 初始星星：柱顶 + 稍后岩浆面再刷
    const pickups = [];
    let sid = 1;
    for (const p of pillars) {
      if (Math.random() < 0.55) {
        pickups.push({
          id: sid++,
          x: p.x + p.w / 2,
          y: p.top - 18,
          r: 14,
          collected: false,
          pulse: Math.random() * Math.PI,
          onLava: false,
        });
      }
    }
    // 保底至少 3 颗在柱顶
    while (pickups.filter((s) => !s.onLava).length < 3) {
      const p = pillars[(Math.random() * pillars.length) | 0];
      pickups.push({
        id: sid++,
        x: p.x + p.w / 2 + (Math.random() - 0.5) * 20,
        y: p.top - 18,
        r: 14,
        collected: false,
        pulse: Math.random() * Math.PI,
        onLava: false,
      });
    }

    const furnaceScene = {
      topY: TOP_Y,
      floorY: FLOOR_Y,
      layer: LAYER,
      riseEvery: 30,
      riseT: 30,
      lavaY: FLOOR_Y + 28,
      layersRisen: 0,
      maxLayers: 18,
      camY: 0,
      camYTarget: 0,
      portal,
      pickups,
      starsGot: 0,
      needStars: 3,
      portalOpen: false,
      done: false,
      toast: "",
      toastT: 0,
      placeCd: 0,
      placeHeld: false,
      blockW: 40,
      blockH: 18,
      nextStarId: sid,
      lavaStarT: 8,
      pulse: 0,
    };

    L.finish(g, {
      homeMode: true,
      spawnX: 460,
      floorY: FLOOR_Y,
      worldWidth: WORLD_W,
      worldMin: 0,
      star: null,
      fakeLava: false,
      extra: { furnaceScene },
    });
  });
})();
