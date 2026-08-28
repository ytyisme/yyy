(() => {
  const L = GameLevels;

  L.register(16, (g) => {
    const groundY = 400;

    // 射击场地面
    L.plat(g, 0, groundY, 1400, 28, "ground", { theme: "range" });
    // 后挡墙 / 靶墙底座
    L.plat(g, 720, groundY - 8, 520, 12, "mid", { theme: "rangeWall" });

    const targets = [
      { id: 1, x: 780, y: groundY - 90, r: 22, hit: false, bob: 0.2 },
      { id: 2, x: 880, y: groundY - 140, r: 20, hit: false, bob: 1.1 },
      { id: 3, x: 980, y: groundY - 100, r: 24, hit: false, bob: 2.0 },
      { id: 4, x: 1080, y: groundY - 160, r: 18, hit: false, bob: 0.7 },
      { id: 5, x: 1180, y: groundY - 115, r: 22, hit: false, bob: 1.6 },
    ];

    const rangeScene = {
      groundY,
      aiming: false,
      prone: false,
      sneak: false,
      aimPitch: -8,
      aimYaw: 0,
      cooldown: 0,
      bullets: [],
      targets,
      toast: "",
      toastT: 0,
      hits: 0,
      crosshairPulse: 0,
      muzzleFlash: 0,
      done: false,
      aimDrag: null,
    };

    L.finish(g, {
      homeMode: true,
      spawnX: 100,
      floorY: groundY,
      worldWidth: 1400,
      worldMin: 0,
      star: null,
      fakeLava: true,
      extra: { rangeScene },
    });
  });
})();
