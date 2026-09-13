(() => {
  const L = GameLevels;

  L.register(21, (g) => {
    const groundY = 400;
    const WORLD_W = 960;

    // 钢梁平台（Donkey Kong 风格多层）
    const floors = [
      { y: groundY, x: 40, w: 880 },
      { y: 330, x: 40, w: 780 },
      { y: 260, x: 140, w: 780 },
      { y: 190, x: 40, w: 780 },
      { y: 120, x: 200, w: 560 },
    ];

    for (const f of floors) {
      L.plat(g, f.x, f.y, f.w, 16, "ground", { theme: "kongGirder" });
    }

    // 顶层左右装饰墙
    L.plat(g, 40, 50, 16, 70, "mid", { theme: "kongWall" });
    L.plat(g, WORLD_W - 56, 50, 16, 70, "mid", { theme: "kongWall" });

    // 梯子：连接相邻层（x, topY, bottomY）
    const ladders = [
      { x: 780, top: 330, bottom: groundY, w: 28 },
      { x: 160, top: 260, bottom: 330, w: 28 },
      { x: 760, top: 190, bottom: 260, w: 28 },
      { x: 180, top: 120, bottom: 190, w: 28 },
      { x: 620, top: 120, bottom: 190, w: 28 },
    ];

    const kongScene = {
      floors,
      ladders,
      barrels: [],
      spawnT: 0,
      spawnEvery: 1.55,
      kong: { x: 250, y: 68, bob: 0, throwT: 0 },
      pauline: { x: 680, y: 78 },
      goal: { x: 660, y: 78, w: 50, h: 42 },
      toast: "",
      toastT: 0,
      climbing: false,
      done: false,
      hammer: null,
      scoreHint: 0,
    };

    L.finish(g, {
      homeMode: true,
      spawnX: 80,
      floorY: groundY,
      worldWidth: WORLD_W,
      worldMin: 0,
      star: null,
      fakeLava: true,
      extra: { kongScene },
    });
  });
})();
