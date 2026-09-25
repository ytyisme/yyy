(() => {
  const L = GameLevels;

  // 第 33 关：你的胆子真的是肥嘟嘟的 · 骑电车送货，躲开车辆/同行/大运重卡，5000 米
  L.register(33, (g) => {
    const M = 2; // 1 米 = 2 像素
    const WORLD_W = 5000 * M; // 10000
    const groundY = 460;

    // 整条平路（平面 2D）
    L.road(g, groundY, WORLD_W, 0);

    const rider33Scene = {
      groundY,
      worldW: WORLD_W,
      meters: 5000,
      mScale: M,
      phase: "ready", // ready | ride | done
      // 三条车道（画面 Y）
      lanes: [groundY - 120, groundY - 70, groundY - 20],
      lane: 1,
      laneY: groundY - 70,
      // 车流
      cars: [], // {x, y, w, h, vx, kind: car|bike|truck, label}
      spawnT: 0,
      rideT: 0,
      toast: "",
      toastT: 0,
      pulse: 0,
      winner: false,
      hit: false,
      // 电车手
      rider: { x: 220, y: groundY - 70, w: 36, h: 48 },
    };

    L.finish(g, {
      spawnX: 220,
      floorY: groundY,
      worldWidth: WORLD_W,
      worldMin: 0,
      star: null,
      fakeLava: false,
      extra: { rider33Scene },
    });
  });
})();
