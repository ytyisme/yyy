(() => {
  const L = GameLevels;

  L.register(30, (g) => {
    const WORLD_W = 2600;
    const groundY = 400;

    // 起始陆地
    L.plat(g, 40, groundY, 280, 28, "ground", { theme: "maliangFloor" });
    // 中间几段陆地，中间有岩浆缺口需神笔画桥
    L.plat(g, 520, groundY, 160, 28, "ground", { theme: "maliangFloor" });
    L.plat(g, 880, groundY - 40, 140, 28, "ground", { theme: "maliangFloor" });
    L.plat(g, 1220, groundY, 180, 28, "ground", { theme: "maliangFloor" });
    L.plat(g, 1580, groundY - 55, 150, 28, "ground", { theme: "maliangFloor" });
    L.plat(g, 1920, groundY, 200, 28, "ground", { theme: "maliangFloor" });
    // 终点台
    L.plat(g, 2280, groundY, 260, 28, "ground", { theme: "maliangFloor" });

    // 神笔台（开局捡起）
    const brushPickup = { x: 180, y: groundY - 36, w: 28, h: 28, taken: false };

    const maliangScene = {
      groundY,
      brushPickup,
      hasBrush: false,
      ink: 12,
      inkMax: 12,
      placeCd: 0,
      painted: [],
      toast: "",
      toastT: 0,
      done: false,
      exit: { x: 2380, y: groundY - 80, w: 70, h: 80 },
      pulse: 0,
    };

    L.finish(g, {
      spawnX: 80,
      floorY: groundY,
      worldWidth: WORLD_W,
      worldMin: 0,
      star: null,
      fakeLava: false,
      extra: { maliangScene },
    });
  });
})();
