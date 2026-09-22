(() => {
  const L = GameLevels;

  L.register(28, (g) => {
    const WORLD_W = 3200;
    const groundY = 400;
    const PX_PER_M = 16; // 50 米 = 800px
    const exitX = 2920;

    // 实验室主走廊地板
    L.plat(g, 40, groundY, WORLD_W - 80, 28, "ground", { theme: "labFloor" });

    // 实验室内景平台 / 实验台
    L.plat(g, 120, groundY - 70, 140, 16, "mid", { theme: "labDesk" });
    L.plat(g, 420, groundY - 90, 120, 16, "mid", { theme: "labDesk" });
    L.plat(g, 780, groundY - 60, 160, 16, "mid", { theme: "labDesk" });
    L.plat(g, 1180, groundY - 80, 130, 16, "mid", { theme: "labDesk" });
    L.plat(g, 1680, groundY - 55, 150, 16, "mid", { theme: "labDesk" });
    L.plat(g, 2200, groundY - 75, 140, 16, "mid", { theme: "labDesk" });

    // 错误岔路（死胡同，科学家不会走）
    L.plat(g, 980, groundY - 140, 200, 16, "mid", { theme: "labWrong" });
    L.plat(g, 980, groundY - 200, 80, 16, "mid", { theme: "labWrong" });
    L.plat(g, 1980, groundY - 150, 220, 16, "mid", { theme: "labWrong" });

    // 出口门台
    L.plat(g, exitX - 40, groundY - 8, 120, 36, "ground", { theme: "labExit" });

    const lines = ["实验失败了！", "快跑！", "病毒爆发了！"];
    const scientists = [];
    for (let i = 0; i < 7; i++) {
      scientists.push({
        x: 220 + i * 48,
        y: groundY - 40,
        w: 26,
        h: 40,
        vx: 0,
        speed: 155 + (i % 3) * 12 + Math.random() * 10,
        facing: 1,
        lineIdx: i % lines.length,
        chat: "",
        chatT: 0,
        chatCd: 0.4 + i * 0.35,
        escaped: false,
        coat: i % 2 === 0 ? "#e8eef8" : "#d0d8e8",
      });
    }

    const labScene = {
      groundY,
      pxPerM: PX_PER_M,
      exitX,
      exit: { x: exitX, y: groundY - 90, w: 70, h: 90 },
      lines,
      scientists,
      zombies: [],
      followWarnT: 0,
      toast: "",
      toastT: 0,
      done: false,
      pulse: 0,
      siren: 0,
    };

    L.finish(g, {
      spawnX: 160,
      floorY: groundY,
      worldWidth: WORLD_W,
      worldMin: 0,
      star: null,
      fakeLava: false,
      extra: { labScene },
    });
  });
})();
