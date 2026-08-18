(() => {
  const L = GameLevels;
  L.register(5, (g) => {
    const { startY } = g;
    L.plat(g, 40, startY, 240, 28, "ground");
    const run = L.parkour(g, {
      x: 280,
      y: startY,
      count: 12,
      gap: [65, 25],
      w: [100, 160],
      rise: [-45, 45],
      yClamp: [280, 410],
    });
    const endX = run.x + 60;
    L.plat(g, endX, 340, 420, 28, "ground");
    L.zombiesBehind(g, 5, startY, (i) => ({
      x: -50 - i * 60,
      speed: 2.35 + i * 0.08,
      delayed: 0.7 + i * 0.3,
    }));
    L.finish(g, {
      spawnX: 80,
      worldWidth: endX + 480,
      star: null,
      extra: { endSign: { x: endX + 90, y: 290, pulse: 0, hit: null } },
    });
  });
})();
