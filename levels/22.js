(() => {
  const L = GameLevels;

  L.register(22, (g) => {
    const groundY = 400;
    const room = { x: 40, y: 50, w: 880, h: groundY - 50 };

    L.plat(g, room.x, groundY, room.w, 28, "ground", { theme: "starFloor" });
    L.plat(g, room.x, room.y, room.w, 18, "roof", { theme: "starWall" });
    L.plat(g, room.x, room.y, 18, room.h, "mid", { theme: "starWall" });
    L.plat(g, room.x + room.w - 18, room.y, 18, room.h, "mid", { theme: "starWall" });

    // 两侧观景台
    L.plat(g, 100, 280, 120, 14, "mid", { theme: "starShelf" });
    L.plat(g, 740, 280, 120, 14, "mid", { theme: "starShelf" });

    const fountain = { x: 480, y: groundY - 8, r: 54 };

    const starHouseScene = {
      room,
      fountain,
      stars: [],
      spray: [],
      burstT: 0.01,
      burstEvery: 0.01,
      pulse: 0,
      toast: "",
      toastT: 0,
      collected: 0,
      sessionGain: 0,
    };

    L.finish(g, {
      homeMode: true,
      spawnX: 140,
      floorY: groundY,
      worldWidth: 960,
      worldMin: 0,
      star: null,
      fakeLava: true,
      extra: { starHouseScene },
    });
  });
})();
