(() => {
  const L = GameLevels;
  L.register(6, (g) => {
    const { startY, mapChance } = g;
    const spawnX = 100;
    const roadLen = 2200;
    const roofY = 150;
    L.road(g, startY, roadLen);
    for (let rx = -40; rx < roadLen; rx += 160) {
      L.plat(g, rx, roofY + (rx / 160) % 2 === 0 ? 0 : 8, 190, 22, "roof");
    }
    let sx = 280;
    while (sx < roadLen - 420) {
      g.spikes.push({ x: sx, y: startY - 18, w: 22, h: 18 });
      sx += 70;
      if (mapChance(0.22)) sx += 40;
    }
    L.zombiesAbove(g, 20, roofY, (i) => ({
      x: 40 + (i % 10) * 70 + Math.floor(i / 10) * 35,
      y: roofY - 38 - (i % 4) * 2,
      speed: 3.5 + (i % 5) * 0.12,
      delayed: 0.25 + (i % 8) * 0.12,
      pounceCd: 0.4 + (i % 6) * 0.15,
      fake: true,
    }));
    L.finish(g, {
      homeMode: true,
      spawnX,
      worldWidth: roadLen + 80,
      starX: roadLen - 200,
      starY: startY - 70,
      extra: { comingSoon: null },
    });
  });
})();
