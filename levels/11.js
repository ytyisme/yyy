(() => {
  const L = GameLevels;
  L.register(11, (g) => {
    const { clamp, seededRng } = g;
    const rng = seededRng(11011);
    const groundY = 380;
    let x = 0;
    const start = L.plat(g, x, groundY, 480, 28, "ground", { theme: "moon" });
    x += 480;
    L.scatterPickups(g, start, 1, rng);
    for (let i = 0; i < 14; i++) {
      const pit = 78 + Math.floor(rng() * 64);
      g.craters.push({ x, w: pit });
      x += pit;
      const w = 108 + Math.floor(rng() * 120);
      const y = clamp(groundY + Math.floor(rng() * 56 - 28), 328, 408);
      const plat = L.plat(g, x, y, w, 26, "ground", { theme: "moon" });
      if (i % 2 === 0) L.scatterPickups(g, plat, 1, rng);
      x += w;
    }
    const lastGap = 92;
    g.craters.push({ x, w: lastGap });
    x += lastGap;
    const end = L.plat(g, x, 358, 360, 28, "ground", { theme: "moon" });
    L.scatterPickups(g, end, 1, rng);
    L.finish(g, {
      spawnX: 90,
      floorY: groundY,
      worldWidth: x + 360 + 80,
      starX: x + 360 - 88,
      starY: 288,
    });
  });
})();
