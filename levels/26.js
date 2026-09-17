(() => {
  const L = GameLevels;

  L.register(26, (g) => {
    const WORLD_W = 960;
    const planeFloorY = 120;
    const groundY = 3200; // 下落路程；显示高度按 9000m 映射
    const cabinX = 220;
    const cabinW = 520;

    // 机舱地板
    L.plat(g, cabinX, planeFloorY, cabinW, 18, "ground", { theme: "planeFloor", planeCabin: true });
    // 机舱左右壁
    L.plat(g, cabinX - 16, planeFloorY - 90, 16, 108, "mid", { theme: "planeWall", planeCabin: true });
    L.plat(g, cabinX + cabinW, planeFloorY - 90, 16, 108, "mid", { theme: "planeWall", planeCabin: true });
    // 舱顶
    L.plat(g, cabinX, planeFloorY - 96, cabinW, 14, "roof", { theme: "planeWall", planeCabin: true });

    // 地面
    L.plat(g, 40, groundY, WORLD_W - 80, 28, "ground", { theme: "planeGround" });

    const chutes = [];
    for (let i = 0; i < 5; i++) {
      chutes.push({
        x: cabinX + 70 + i * 88,
        y: planeFloorY - 52,
        taken: i < 4, // 前 4 个已被跳下的人拿走
      });
    }

    const jumpers = [];
    for (let i = 0; i < 4; i++) {
      jumpers.push({
        x: 180 + i * 160 + Math.random() * 40,
        y: planeFloorY + 180 + i * 220 + Math.random() * 80,
        vx: (Math.random() - 0.5) * 40,
        vy: 90 + Math.random() * 40,
        chute: true,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const planeScene = {
      planeFloorY,
      groundY,
      cabinX,
      cabinW,
      altMax: 9000,
      phase: "cabin", // cabin | falling | landed
      chuteOpen: false,
      chuteT: 0,
      jumpHeld: false,
      camY: 0,
      camYTarget: 0,
      obstacles: [],
      spawnAcc: 0,
      chutes,
      jumpers,
      toast: "",
      toastT: 0,
      done: false,
      shakePlane: 0,
      wind: 0,
    };

    L.finish(g, {
      spawnX: cabinX + cabinW * 0.55,
      floorY: planeFloorY,
      worldWidth: WORLD_W,
      worldMin: 0,
      star: null,
      fakeLava: true,
      extra: { planeScene },
    });
  });
})();
