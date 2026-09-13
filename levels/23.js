(() => {
  const L = GameLevels;

  L.register(23, (g) => {
    const groundY = 400;
    const room = { x: 40, y: 40, w: 880, h: groundY - 40 };

    L.plat(g, room.x, groundY, room.w, 28, "ground", { theme: "matchFloor" });
    L.plat(g, room.x, room.y, room.w, 14, "roof", { theme: "matchWall" });
    L.plat(g, room.x, room.y, 14, room.h, "mid", { theme: "matchWall" });
    L.plat(g, room.x + room.w - 14, room.y, 14, room.h, "mid", { theme: "matchWall" });

    const COLS = 12;
    const ROWS = 90;
    const CELL = 26;
    const boardW = COLS * CELL;
    const originX = Math.floor((960 - boardW) / 2);
    const colors = [
      { id: 0, name: "绿", hex: "#3ecf5a" },
      { id: 1, name: "红", hex: "#ff4d5a" },
      { id: 2, name: "橙", hex: "#ff9a2a" },
      { id: 3, name: "紫", hex: "#b46aff" },
    ];

    const grid = new Int8Array(COLS * ROWS);
    // 顶部留空，方便炮台往下打；下面 90 行里填满可消方块
    const EMPTY_TOP = 3;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        grid[i] = r < EMPTY_TOP ? -1 : (Math.random() * 4) | 0;
      }
    }

    const matchScene = {
      room,
      cols: COLS,
      rows: ROWS,
      cell: CELL,
      originX,
      originY: 96,
      colors,
      grid,
      aim: 0,
      aimMin: -1.05,
      aimMax: 1.05,
      cannon: { x: 480, y: 62 },
      current: (Math.random() * 4) | 0,
      next: (Math.random() * 4) | 0,
      shot: null,
      cooldown: 0,
      scrollY: 0,
      toast: "",
      toastT: 0,
      cleared: 0,
      remaining: COLS * ROWS,
      done: false,
      particles: [],
      shootHeld: false,
    };

    L.finish(g, {
      homeMode: true,
      spawnX: -999,
      floorY: groundY,
      worldWidth: 960,
      worldMin: 0,
      star: null,
      fakeLava: true,
      extra: { matchScene },
    });
  });
})();
