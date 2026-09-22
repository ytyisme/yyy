(() => {
  const L = GameLevels;

  L.register(31, (g) => {
    const WORLD_W = 960;
    const groundY = 400;

    L.plat(g, 40, groundY, WORLD_W - 80, 28, "ground", { theme: "maliangFloor" });

    const ml31Scene = {
      groundY,
      phase: "draw", // draw | shoot | done
      hasBrush: true,
      ink: Infinity,
      inkMax: Infinity,
      inkSpent: 0,
      strokes: [],
      drawing: null,
      shields: [],
      bullets: [],
      shootT: 0,
      shootDur: 10,
      fireCd: 0,
      npc: {
        x: 720,
        y: groundY - 44,
        w: 30,
        h: 44,
        facing: -1,
      },
      toast: "",
      toastT: 0,
      done: false,
      pulse: 0,
    };

    L.finish(g, {
      spawnX: 160,
      floorY: groundY,
      worldWidth: WORLD_W,
      worldMin: 0,
      star: null,
      fakeLava: false,
      extra: { ml31Scene },
    });
  });
})();
