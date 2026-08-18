(() => {
  const L = GameLevels;
  L.register(12, (g) => {
    L.road(g, g.startY, 480);
    L.finish(g, { spawnX: 80, worldWidth: 560, star: null });
  });
})();
