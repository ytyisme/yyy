(() => {
  const L = GameLevels;

  // 第 35 关：玩家PVP · 500 米平路障碍竞速（至少 2 人）
  L.register(35, (g) => {
    const M = 10; // 1 米 = 10 像素
    const WORLD_W = 500 * M; // 5000
    const groundY = 420;

    // 整条平路
    L.road(g, groundY, WORLD_W, 0);

    // 路障：矮墙 / 高台 / 窄缝（无僵尸、无 NPC）
    const obstacles = [];
    const block = (x, y, w, h, theme, kind) => {
      L.plat(g, x, y, w, h, "mid", theme ? { theme } : undefined);
      obstacles.push({ x, y, w, h, kind: kind || "block" });
    };

    // 每隔约 40 米一组障碍
    for (let i = 0; i < 11; i++) {
      const x = 35 * M + i * 40 * M;
      const kind = i % 3;
      if (kind === 0) {
        // 矮墙：跳过去
        block(x, groundY - 36, 36, 36, "crate", "hurdle");
      } else if (kind === 1) {
        // 高台 + 下方空档：跳上或钻策略
        block(x, groundY - 90, 120, 24, null, "platform");
        block(x + 40, groundY - 40, 28, 40, "crate", "pillar");
      } else {
        // 连续路障
        block(x, groundY - 28, 24, 28, "crate", "hurdle");
        block(x + 56, groundY - 48, 24, 48, "crate", "pillar");
        block(x + 112, groundY - 28, 24, 28, "crate", "hurdle");
      }
    }

    // 终点线
    const finishX = WORLD_W - 80;

    const pvpScene = {
      groundY,
      worldW: WORLD_W,
      meters: 500,
      phase: "match", // match | intro | race | done
      matchT: 0,
      introT: 0,
      introDur: 3.2,
      vsY: -80,
      myTeam: null, // "red" | "blue"
      foeTeam: null,
      teamsReady: false,
      foeName: "",
      obstacles,
      finishX,
      winner: null, // "me" | "foe" | null
      toast: "",
      toastT: 0,
      pulse: 0,
      raceStartX: 120,
    };

    L.finish(g, {
      spawnX: pvpScene.raceStartX,
      floorY: groundY,
      worldWidth: WORLD_W,
      worldMin: 0,
      star: null,
      fakeLava: false,
      extra: { pvpScene },
    });
  });
})();
