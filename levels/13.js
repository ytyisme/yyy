(() => {
  const L = GameLevels;
  L.register(13, (g) => {
    const { startY, clamp } = g;
    const groundY = startY;

    L.plat(g, 0, groundY, 280, 28, "ground");

    let x = 300;
    let y = groundY;
    const kinds = [
      "jelly",
      "keyboard",
      "oreo",
      "chocoice",
      "jelly",
      "oreo",
      "keyboard",
      "chocoice",
      "jelly",
      "oreo",
      "keyboard",
      "chocoice",
      "jelly",
      "oreo",
    ];

    for (let i = 0; i < kinds.length; i++) {
      const kind = kinds[i];
      const gap = 58 + (i % 3) * 12;
      const w =
        kind === "jelly"
          ? 96 + (i % 2) * 28
          : kind === "oreo"
            ? 100 + (i % 2) * 20
            : kind === "chocoice"
              ? 108 + (i % 3) * 16
              : 118 + (i % 3) * 18;
      const rise = ((i % 4) - 1.5) * 28;
      y = clamp(y + rise, 250, 400);
      x += gap;
      const h = kind === "jelly" ? 30 : kind === "chocoice" ? 28 : 26;
      L.plat(g, x, y, w, h, "ground", { theme: kind, chocolateCracked: false });
      if (i % 3 === 1) {
        const midKind = kinds[(i + 1) % kinds.length];
        L.plat(g, x + w * 0.35, clamp(y - 78, 200, 320), 70, 22, "mid", {
          theme: midKind,
          chocolateCracked: false,
        });
      }
      x += w;
    }

    const endX = x + 70;
    L.plat(g, endX, 340, 520, 28, "ground");
    L.plat(g, endX + 40, 340, 90, 30, "ground", { theme: "jelly" });
    L.plat(g, endX + 150, 340, 100, 26, "ground", { theme: "oreo", chocolateCracked: false });
    L.plat(g, endX + 270, 340, 110, 28, "ground", { theme: "chocoice", chocolateCracked: false });
    L.plat(g, endX + 400, 340, 100, 26, "ground", { theme: "keyboard" });

    L.finish(g, {
      spawnX: 80,
      floorY: groundY,
      worldWidth: endX + 580,
      star: null,
      extra: {
        endSign: { x: endX + 320, y: 290, pulse: 0, hit: null },
      },
    });
  });
})();
