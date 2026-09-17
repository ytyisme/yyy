(() => {
  const L = GameLevels;

  L.register(27, (g) => {
    const WORLD_W = 2200;
    const groundY = 400;

    // 一整条平地
    L.plat(g, 0, groundY, WORLD_W, 28, "ground", { theme: "pipeFloor" });

    const beanColors = ["#ff4d5a", "#3ecf5a", "#ff9a2a", "#b46aff", "#5ce1ff", "#ffe27a"];
    const beans = [];
    for (let i = 0; i < 36; i++) {
      beans.push({
        id: i,
        x: 160 + i * 52 + (i % 3) * 10,
        y: groundY - 18,
        r: 9,
        color: beanColors[i % beanColors.length],
        taken: false,
      });
    }

    const pipeScene = {
      groundY,
      level: 1,
      hp: 100,
      hpMax: 100,
      beans,
      boss: null,
      bossSummoned: false,
      atkCd: 0,
      hurtCd: 0,
      toast: "",
      toastT: 0,
      done: false,
      pulse: 0,
    };

    L.finish(g, {
      spawnX: 80,
      floorY: groundY,
      worldWidth: WORLD_W,
      worldMin: 0,
      star: null,
      fakeLava: false,
      extra: { pipeScene },
    });
  });
})();
