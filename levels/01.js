(() => {
  const L = GameLevels;
  L.register(1, (g) => {
    const { n, startY, roofY, zombieCount } = g;
    const aboveHunt = n > 10;
    L.plat(g, 40, startY, 220, 28, "ground");
    if (aboveHunt) L.plat(g, 20, roofY, 280, 24, "roof");
    const run = L.parkour(g, {
      x: 260,
      y: startY,
      count: 14 + n * 2,
      gap: aboveHunt ? [70 + n * 10, 30 + n * 4] : [48 + n * 8, 30 + n * 4],
      w: [90, 160 + Math.max(0, 40 - n * 3)],
      rise: aboveHunt ? [-55, 55] : [-70, 70],
      yClamp: aboveHunt ? [280, 420] : [220, 420],
      roof: aboveHunt,
      roofY,
      roofPad: [10, 40],
      roofW: [40, 100],
      mid: aboveHunt ? "third" : "chance",
      jumpLen: 90 + Math.min(40, n * 4),
    });
    const endX = run.x + 80;
    L.plat(g, endX, 340, 260, 28, "ground");
    if (aboveHunt) L.plat(g, endX - 40, roofY, 300, 24, "roof");
    if (aboveHunt) {
      L.zombiesAbove(g, zombieCount, roofY, (i) => ({
        x: 60 + i * 70,
        speed: 2.8 + n * 0.22 + i * 0.1,
        delayed: 0.35 + i * 0.22,
        pounceCd: 0.8 + i * 0.25,
      }));
    } else {
      L.zombiesBehind(g, zombieCount, startY, (i) => ({
        x: -40 - i * 55,
        speed: 2.1 + n * 0.18 + i * 0.08,
        delayed: 0.6 + i * 0.35,
      }));
    }
    L.finish(g, { spawnX: 80, worldWidth: endX + 320, starX: endX + 110, starY: 270 });
  });
})();
