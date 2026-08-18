(() => {
  const L = GameLevels;
  L.register(4, (g) => {
    const { startY } = g;
    const spawnX = 220;
    const roadLen = 2600;
    L.road(g, startY, roadLen);
    g.pushZombie({
      x: spawnX - 220,
      y: startY - 78,
      w: 64,
      h: 78,
      speed: 4.55,
      delayed: 1.1,
      mode: "behind",
      big: true,
    });
    L.finish(g, {
      spawnX,
      worldWidth: roadLen + 120,
      starX: roadLen - 160,
      starY: startY - 70,
      extra: {
        crate: { x: spawnX + 48, y: startY - 36, w: 36, h: 36, open: false },
        potion: null,
        speedBoost: 0,
      },
    });
  });
})();
