(() => {
  const L = GameLevels;
  L.register(10, (g) => {
    const { startY } = g;
    const shopX = 520;
    L.road(g, startY, 1600);
    const shopScene = {
      x: shopX,
      y: startY,
      w: 260,
      h: 170,
      phase: "waiting",
      hour: 11,
      minute: 58,
      second: 0,
      clockAcc: 0,
      timeScale: 12,
      customers: [],
      stock: 12,
      talk: "商店12:00开门",
      talkTimer: 0,
      pulse: 0,
      starHit: null,
      doorOpen: false,
    };
    for (let i = 0; i < 18; i++) {
      shopScene.customers.push({
        x: shopX + shopScene.w + 420 + i * 46,
        y: startY - 38,
        w: 22 + (i % 3) * 2,
        h: 36 + (i % 2) * 2,
        vx: 0,
        targetX: shopX + 40 + (i % 5) * 28,
        inShop: false,
        bought: false,
        color: ["#4a90d9", "#d94a4a", "#4ad98a", "#d9c24a", "#9a4ad9"][i % 5],
        hair: ["#2a1a10", "#5a3a20", "#1a1a1a", "#8a6a40"][i % 4],
      });
    }
    L.finish(g, {
      homeMode: true,
      spawnX: 90,
      worldWidth: 1680,
      star: null,
      extra: { shopScene },
    });
  });
})();
