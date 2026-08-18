(() => {
  const L = GameLevels;
  L.register(7, (g) => {
    const { startY } = g;
    const spawnX = 100;
    const roadLen = 2000;
    L.road(g, startY, roadLen);
    for (let i = 0; i < 5; i++) {
      g.maces.push({
        x: 380 + i * 300,
        y: startY - 8,
        len: 168,
        angle: (i * Math.PI * 2) / 5,
        spin: 0.028 + i * 0.004,
        ballR: 48,
        shaftW: 22,
      });
    }
    L.finish(g, {
      homeMode: true,
      spawnX,
      worldWidth: roadLen + 80,
      starX: roadLen - 180,
      starY: startY - 70,
    });
  });
})();
