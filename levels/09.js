(() => {
  const L = GameLevels;
  L.register(9, (g) => {
    const { startY } = g;
    const roadEnd = 680;
    const underY = 518;
    L.road(g, startY, roadEnd);
    let ux = roadEnd - 40;
    L.plat(g, ux, underY, 200, 22, "secret");
    ux += 200;
    for (let i = 0; i < 18; i++) {
      ux += 28;
      L.plat(g, ux, underY, 160, 22, "secret");
      ux += 160;
    }
    const starX = ux + 120;
    L.plat(g, starX - 40, underY, 300, 22, "secret");
    L.finish(g, {
      fakeLava: true,
      homeMode: true,
      spawnX: 100,
      worldWidth: starX + 400,
      starX: starX + 80,
      starY: underY - 48,
    });
  });
})();
