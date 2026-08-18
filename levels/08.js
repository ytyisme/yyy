(() => {
  const L = GameLevels;
  L.register(8, (g) => {
    const { startY } = g;
    L.road(g, startY, 1200);
    g.rockets.push(
      { x: 220, y: startY - 90, w: 36, h: 90, big: false, eaten: false, block: true },
      { x: 380, y: startY - 100, w: 40, h: 100, big: false, eaten: false, block: true },
      { x: 540, y: startY - 95, w: 38, h: 95, big: false, eaten: false, block: true },
      { x: 700, y: startY - 110, w: 44, h: 110, big: false, eaten: false, block: true },
      { x: 860, y: startY - 230, w: 110, h: 230, big: true, eaten: false, block: true }
    );
    L.finish(g, {
      homeMode: true,
      spawnX: 80,
      worldWidth: 1280,
      starX: 1020,
      starY: startY - 70,
    });
  });
})();
