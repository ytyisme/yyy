(() => {
  const L = GameLevels;

  // 第 34 关：保卫萝卜 · 塔防
  L.register(34, (g) => {
    const WORLD_W = 960;
    // 地面必须在岩浆线（LAVA_Y ≈ 488）上方，否则一出生就烫死
    const groundY = 400;

    L.road(g, groundY, WORLD_W, 0);

    // 更绕的路线：右上入场 → 蛇形折返 → 左下萝卜
    const path = [
      { x: 900, y: 60 },   // 入口
      { x: 720, y: 60 },
      { x: 720, y: 140 },
      { x: 860, y: 140 },  // 回折
      { x: 860, y: 220 },
      { x: 520, y: 220 },
      { x: 520, y: 90 },   // 再上绕
      { x: 380, y: 90 },
      { x: 380, y: 300 },  // 长竖线下来
      { x: 200, y: 300 },
      { x: 200, y: 170 },  // 再上去
      { x: 300, y: 170 },
      { x: 300, y: 250 },
      { x: 140, y: 250 },  // 通向萝卜
      { x: 90, y: 280 },
    ];

    // 开局 5 个放塔位（贴着弯道）；之后自己点地图开新位
    const slots = [
      { x: 800, y: 100, tower: null, open: true },
      { x: 620, y: 180, tower: null, open: true },
      { x: 720, y: 260, tower: null, open: true },
      { x: 450, y: 150, tower: null, open: true },
      { x: 250, y: 230, tower: null, open: true },
    ];

    const carrot34Scene = {
      groundY,
      phase: "ready", // ready | wave | win | lose
      path,
      slots,
      carrot: { x: 70, y: 300, hp: 10, maxHp: 10 },
      enemies: [],
      shots: [],
      wave: 0,
      maxWave: 5,
      spawnLeft: 0,
      spawnT: 0,
      waveT: 0,
      coins: 120,
      placeKind: "arrow", // arrow | cannon | fan
      placingSlot: false, // 正在自选新塔位
      toast: "",
      toastT: 0,
      pulse: 0,
    };

    L.finish(g, {
      spawnX: 80,
      floorY: groundY,
      worldWidth: WORLD_W,
      worldMin: 0,
      star: null,
      fakeLava: false,
      extra: { carrot34Scene },
    });
  });
})();
