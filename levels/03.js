(() => {
  const L = GameLevels;
  L.register(3, (g) => {
    const startY = 380;
    const bridgePieceW = 92;
    const pitWidth = bridgePieceW * 3;
    const pitStart = 1080;
    const rightX = pitStart + pitWidth;
    L.road(g, startY, pitStart);
    L.plat(g, rightX, startY, 360, 28, "ground");
    L.finish(g, {
      puzzleMode: true,
      spawnX: 80,
      worldWidth: rightX + 420,
      starX: rightX + 140,
      starY: startY - 70,
      extra: { bridgeY: startY, bridgePieceW, pitWidth, pitStart },
    });
  });
})();
