(() => {
  const L = GameLevels;
  const FLOORS = 123;

  L.floorY = function floorY(f) {
    const top = 72;
    const bot = 488;
    return bot - ((f - 1) / (FLOORS - 1)) * (bot - top);
  };

  L.register(14, (g) => {
    const { clamp } = g;
    const floorY = L.floorY;
    const tx = 280;
    const tw = 340;
    const topPlatY = floorY(FLOORS) - 20;

    // 123 层房间
    L.plat(g, tx, topPlatY, tw, 24, "ground", { theme: "tower" });
    L.plat(g, tx - 16, topPlatY - 120, 18, 120, "ground", { theme: "towerWall" });
    L.plat(g, tx + tw - 2, topPlatY - 120, 18, 120, "ground", { theme: "towerWall" });
    L.plat(g, tx - 16, topPlatY - 120, tw + 32, 16, "ground", { theme: "towerWall" });

    // 1 楼大堂
    const botPlatY = floorY(1) - 20;
    L.plat(g, tx, botPlatY, tw, 24, "ground", { theme: "tower" });
    L.plat(g, tx - 16, botPlatY, 18, 80, "ground", { theme: "towerWall" });
    L.plat(g, tx + tw - 2, botPlatY, 18, 80, "ground", { theme: "towerWall" });

    // 楼梯井（每 10 层一段）
    const stairX = tx + 48;
    for (let f = 1; f < FLOORS; f += 10) {
      const y = floorY(f);
      L.plat(g, stairX, y - 8, 56, 10, "mid", { theme: "towerStair" });
    }
    // 竖井侧墙
    L.plat(g, stairX - 8, floorY(1) - 20, 10, floorY(FLOORS) - floorY(1) + 40, "mid", {
      theme: "towerShaft",
    });
    L.plat(g, stairX + 56, floorY(1) - 20, 8, floorY(FLOORS) - floorY(1) + 40, "mid", {
      theme: "towerShaft",
    });

    const towerScene = {
      floors: FLOORS,
      floorY,
      towerX: tx,
      towerW: tw,
      roomFloorY: topPlatY,
      stairX: stairX + 28,
      stairWell: {
        left: stairX - 8,
        inner: stairX,
        width: 56,
        right: stairX + 56,
        wallR: stairX + 64,
      },
      phase: "intro",
      phoneCharged: false,
      charging: false,
      chargeT: 0,
      phoneOpen: false,
      currentApp: null,
      balance: 13,
      ordered: false,
      orderItem: null,
      toast: "",
      toastT: 0,
      showBalance: false,
      cameraTarget: "player",
      camY: 0,
      camYTarget: 0,
      planeInWorld: false,
      planeX: 0,
      planeY: 0,
      planeGiven: false,
      mapSearch: "",
      mapPlaneShown: false,
      chargerHit: null,
      phoneHit: null,
      delivery: {
        active: false,
        floor: 1,
        x: stairX + 28,
        y: floorY(1) - 40,
        w: 28,
        h: 40,
        hasPlane: false,
        flying: false,
        cancelled: false,
        delivered: false,
        climbSpeed: 4.2,
        flySpeed: 28,
        bob: 0,
      },
      menu: [
        { id: "cola", name: "可乐", price: 14 },
        { id: "burger", name: "汉堡", price: 13 },
        { id: "fries", name: "薯条", price: 18 },
        { id: "nuggets", name: "鸡块", price: 20 },
        { id: "chicken", name: "炸鸡", price: 20 },
      ],
    };

    L.finish(g, {
      homeMode: true,
      spawnX: tx + tw - 90,
      floorY: topPlatY,
      worldWidth: 960,
      worldMin: 0,
      star: null,
      extra: { towerScene },
    });
  });
})();
