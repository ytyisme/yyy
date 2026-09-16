(() => {
  const L = GameLevels;

  L.register(25, (g) => {
    const WORLD_W = 1480;
    const groundTop = 248;
    const groundBot = 388;
    const gapL = 720;
    const gapR = 980;
    const gapW = gapR - gapL;
    // NPC 天花板：贴着上路地板下沿抬高，给下路留出跳跃高度
    const dividerY = groundTop + 22;

    // 上路（玩家）
    L.plat(g, 40, groundTop, gapL - 40, 22, "ground", { theme: "twinFloor" });
    L.plat(g, gapR, groundTop, WORLD_W - gapR - 40, 22, "ground", { theme: "twinFloor" });
    // 上路小起伏
    L.plat(g, 220, groundTop - 56, 90, 16, "mid", { theme: "twinFloor" });
    L.plat(g, 420, groundTop - 40, 80, 16, "mid", { theme: "twinFloor" });
    L.plat(g, 560, groundTop - 70, 90, 16, "mid", { theme: "twinFloor" });

    // 下路（NPC）——平台 X/相对高度与上路对齐
    L.plat(g, 40, groundBot, gapL - 40, 22, "ground", { theme: "twinFloorB" });
    L.plat(g, gapR, groundBot, WORLD_W - gapR - 40, 22, "ground", { theme: "twinFloorB" });
    L.plat(g, 220, groundBot - 56, 90, 16, "mid", { theme: "twinFloorB" });
    L.plat(g, 420, groundBot - 40, 80, 16, "mid", { theme: "twinFloorB" });
    L.plat(g, 560, groundBot - 70, 90, 16, "mid", { theme: "twinFloorB" });

    // 左右护墙
    L.plat(g, 20, 80, 20, 340, "mid", { theme: "twinWall" });
    L.plat(g, WORLD_W - 40, 80, 20, 340, "mid", { theme: "twinWall" });
    // 上下路隔离带 = NPC 天花板（贴上路抬高）
    L.plat(g, 40, dividerY, gapL - 40, 10, "mid", { theme: "twinWall" });
    L.plat(g, gapR, dividerY, WORLD_W - gapR - 40, 10, "mid", { theme: "twinWall" });

    const plateA = { x: gapL - 70, y: groundTop - 6, w: 56, h: 10 };
    const plateB = { x: gapL - 70, y: groundBot - 6, w: 56, h: 10 };
    const goal = { x: gapR + 120, y: groundTop - 50, w: 70, h: 50 };

    const twinScene = {
      gapL,
      gapR,
      gapW,
      groundTop,
      groundBot,
      plateA,
      plateB,
      goal,
      npc: null,
      bridgeOn: false,
      bridgeT: 0,
      bridgeDur: 10,
      bridgePlats: [],
      onA: false,
      onB: false,
      toast: "",
      toastT: 0,
      done: false,
      pulse: 0,
    };

    L.finish(g, {
      spawnX: 80,
      floorY: groundTop,
      worldWidth: WORLD_W,
      worldMin: 0,
      star: null,
      fakeLava: false,
      extra: { twinScene },
    });
  });
})();
