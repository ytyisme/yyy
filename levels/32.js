(() => {
  const L = GameLevels;

  L.register(32, (g) => {
    const WORLD_W = 960;
    const groundY = 420;

    L.plat(g, 40, groundY, WORLD_W - 80, 28, "ground", { theme: "maliangFloor" });

    const pipe32Scene = {
      groundY,
      phase: "draw", // draw | flow | done
      hasBrush: true,
      ink: Infinity,
      inkMax: Infinity,
      inkSpent: 0,
      strokes: [],
      drawing: null,
      // 水源管口（上方出水口）
      source: { x: 720, y: 120, w: 36, h: 28 },
      // 左下角杯子
      cup: { x: 90, y: groundY - 56, w: 52, h: 56, fill: 0, fillMax: 100 },
      water: null, // {t, pts, segIdx} 流水动画
      pipeLit: [], // 被水打湿的笔画
      toast: "",
      toastT: 0,
      done: false,
      pulse: 0,
    };

    L.finish(g, {
      spawnX: 200,
      floorY: groundY,
      worldWidth: WORLD_W,
      worldMin: 0,
      star: null,
      fakeLava: false,
      extra: { pipe32Scene },
    });
  });
})();
