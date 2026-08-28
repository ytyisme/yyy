(() => {
  const L = GameLevels;

  L.register(17, (g) => {
    const groundY = 400;

    L.plat(g, 0, groundY, 1600, 28, "ground", { theme: "battle" });
    // 掩体
    L.plat(g, 320, groundY - 48, 70, 48, "mid", { theme: "crate" });
    L.plat(g, 720, groundY - 56, 80, 56, "mid", { theme: "crate" });
    L.plat(g, 1100, groundY - 48, 70, 48, "mid", { theme: "crate" });

    function makeNpc(team, i, baseX) {
      const spread = (i % 5) * 55 + Math.floor(i / 5) * 20;
      return {
        id: `${team}-${i}`,
        team,
        x: baseX + spread,
        y: groundY - 40,
        w: 28,
        h: 40,
        vx: 0,
        facing: team === "blue" ? 1 : -1,
        hp: 10,
        maxHp: 10,
        alive: true,
        attackCd: 0.4 + Math.random() * 0.8,
        thinkT: Math.random() * 0.5,
        weapon: Math.random() > 0.45 ? "gun" : "dagger",
        bob: Math.random() * Math.PI * 2,
        name: "玩家",
      };
    }

    const npcs = [];
    for (let i = 0; i < 10; i++) npcs.push(makeNpc("blue", i, 80));
    for (let i = 0; i < 10; i++) npcs.push(makeNpc("red", i, 1180));

    const battleScene = {
      groundY,
      playerTeam: "blue",
      playerHp: 10,
      playerMaxHp: 10,
      weapon: "gun", // gun | dagger
      cooldown: 0,
      bullets: [],
      npcs,
      toast: "",
      toastT: 0,
      done: false,
      hurtFlash: 0,
      muzzleFlash: 0,
    };

    L.finish(g, {
      homeMode: true,
      spawnX: 200,
      floorY: groundY,
      worldWidth: 1600,
      worldMin: 0,
      star: null,
      fakeLava: true,
      extra: { battleScene },
    });
  });
})();
