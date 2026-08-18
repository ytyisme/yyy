(() => {
  const L = GameLevels;
  L.register(2, (g) => {
    const { startY, roofY } = g;
    const spawnX = 400;
    const startPlatW = 520;
    const secretX = -100;
    L.plat(g, 0, startY, startPlatW, 28, "ground");
    L.plat(g, 0, roofY, startPlatW + 40, 24, "roof");
    L.plat(g, secretX, startY, 100, 28, "ground");
    const run = L.parkour(g, {
      x: startPlatW,
      y: startY,
      count: 10,
      gap: [80, 30],
      w: [85, 150],
      rise: [-50, 50],
      yClamp: [280, 420],
      roof: true,
      roofY,
      roofPad: [8, 30],
      roofW: [30, 90],
      mid: "odd",
    });
    L.zombiesAbove(g, 20, roofY, (i) => ({
      x: 260 + (i % 10) * 48 + Math.floor(i / 10) * 90,
      y: roofY - 38 - (i % 3) * 2,
      speed: 2.4 + (i % 5) * 0.12,
      delayed: 0.15 + (i % 8) * 0.12,
      pounceCd: 0.4 + (i % 7) * 0.18,
    }));
    L.finish(g, {
      reverseGoal: true,
      spawnX,
      worldMin: secretX - 40,
      worldWidth: run.x + 800,
      starX: secretX + 40,
      starY: startY - 70,
    });
  });
})();
