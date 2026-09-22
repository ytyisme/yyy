(() => {
  const L = GameLevels;

  L.register(29, (g) => {
    const WORLD_W = 2400;
    const groundY = 400;

    L.plat(g, 0, groundY, WORLD_W, 28, "ground", { theme: "toiletFloor" });

    // 厕所外墙 / 门口
    const doorX = 1180;
    L.plat(g, doorX - 20, groundY - 120, 20, 120, "mid", { theme: "toiletWall" });
    L.plat(g, doorX + 100, groundY - 120, 20, 120, "mid", { theme: "toiletWall" });
    L.plat(g, doorX - 20, groundY - 130, 140, 14, "roof", { theme: "toiletWall" });

    const queue = [];
    for (let i = 0; i < 13; i++) {
      queue.push({
        id: i,
        x: 200 + i * 58,
        y: groundY - 40,
        w: 28,
        h: 40,
        alive: true,
        facing: 1, // 面朝厕所（右）
        turned: false,
        alertT: 0,
        shirt: ["#6ec8ff", "#ffb347", "#b8ff6a", "#d47aff", "#ff8a5c"][i % 5],
      });
    }

    const toiletScene = {
      groundY,
      doorX,
      door: { x: doorX, y: groundY - 100, w: 100, h: 100 },
      queue,
      phase: "queue", // queue | choose | inside | peeing | done
      gender: null, // "male" | "female"
      swordWasOn: false,
      peeT: 0,
      peeDur: 10,
      peeTarget: null,
      fixtures: [],
      peopleInside: [],
      toast: "",
      toastT: 0,
      done: false,
      chooseBtns: {
        male: { x: 0, y: 0, w: 140, h: 48, label: "男厕" },
        female: { x: 0, y: 0, w: 140, h: 48, label: "女厕" },
      },
    };

    L.finish(g, {
      spawnX: 80,
      floorY: groundY,
      worldWidth: WORLD_W,
      worldMin: 0,
      star: null,
      fakeLava: false,
      extra: { toiletScene },
    });
  });
})();
