(() => {
  const L = GameLevels;

  L.register(17, (g) => {
    const groundY = 400;
    const PX_PER_M = 25;
    const FIELD_M = 10000;
    const FIELD_W = FIELD_M * PX_PER_M; // 250000
    const m = (meters) => meters * PX_PER_M;

    L.plat(g, 0, groundY, FIELD_W, 28, "ground", { theme: "battle" });

    function cover(mx, w, h, theme) {
      L.plat(g, m(mx), groundY - h, w, h, "mid", {
        theme: theme || "crate",
        blocksShot: theme !== "battle",
      });
    }
    function ledge(mx, w, rise) {
      L.plat(g, m(mx), groundY - rise, w, 18, "mid", { theme: "battle" });
    }
    function baseCamp(mx) {
      cover(mx, 22, 96, "sandbag");
      cover(mx + 20, 100, 54, "crate");
      cover(mx + 50, 28, 78, "sandbag");
      ledge(mx + 24, 100, 130);
    }

    // 四队大本营均分在 10000 米：蓝 / 黄 / 绿 / 红
    const BLUE_M = 20;
    const YELLOW_M = 3300;
    const GREEN_M = 6600;
    const RED_M = 9900;

    baseCamp(BLUE_M);
    baseCamp(YELLOW_M);
    baseCamp(GREEN_M);
    baseCamp(RED_M);

    // 战线掩体（稀疏铺开，覆盖整条 10000 米）
    for (let mx = 120; mx < FIELD_M - 80; mx += 180) {
      const kind = Math.floor(mx / 180) % 3;
      if (kind === 0) cover(mx, 70 + (mx % 40), 48, "crate");
      else if (kind === 1) cover(mx, 55, 40, "sandbag");
      else ledge(mx, 120, 100 + (mx % 60));
    }

    function numCN(n) {
      const dig = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
      if (n <= 0) return String(n);
      if (n < 10) return dig[n];
      if (n === 10) return "十";
      if (n < 20) return "十" + dig[n - 10];
      if (n % 10 === 0) return dig[Math.floor(n / 10)] + "十";
      if (n < 100) return dig[Math.floor(n / 10)] + "十" + dig[n % 10];
      return String(n);
    }

    const TEAM_LABEL = { blue: "蓝队", red: "红队", yellow: "黄队", green: "绿队" };

    function makeNpc(team, i, baseX, opts) {
      const o = opts || {};
      const cols = 10;
      const spread = (i % cols) * 44 + Math.floor(i / cols) * 30;
      const floor = o.floorY != null ? o.floorY : groundY;
      const teamLabel = TEAM_LABEL[team] || "队伍";
      return {
        id: `${team}-${i}`,
        team,
        x: o.x != null ? o.x : baseX + spread,
        y: floor - 40,
        floorY: floor,
        homeX: o.x != null ? o.x : baseX + spread,
        w: 28,
        h: 40,
        vx: 0,
        vy: 0,
        onGround: true,
        jumpCd: Math.random() * 0.5,
        facing: team === "blue" || team === "yellow" ? 1 : -1,
        hp: 10,
        maxHp: 10,
        alive: true,
        reviveT: 0,
        attackCd: 0.4 + Math.random() * 0.8,
        thinkT: Math.random() * 0.5,
        weapon: o.weapon || (Math.random() > 0.45 ? "gun" : "dagger"),
        bob: Math.random() * Math.PI * 2,
        name: o.name || `${teamLabel}玩家${numCN(i + 1)}`,
        sniper: !!o.sniper,
        flagGuard: !!o.flagGuard,
        guardX: o.guardX != null ? o.guardX : null,
        phaseLeft: 3,
        phaseT: 0,
        phaseExit: false,
        battlePhase: false,
        medkits: 3,
        apples: 2,
        itemCd: 0.6 + Math.random(),
        chat: "",
        chatT: 0,
        chatCd: 2 + Math.random() * 8,
        followPlayer: false,
        followSlot: 0,
        aggressive: false,
        aggressiveT: 0,
        onTrain: false,
        trainSeat: null,
        trainCd: 0,
      };
    }

    function spawnSquad(team, count, baseX, startId) {
      const list = [];
      const fighters = Math.max(0, count - 2);
      for (let i = 0; i < fighters; i++) list.push(makeNpc(team, startId + i, baseX));
      if (count >= 1) {
        list.push(
          makeNpc(team, startId + fighters, 0, {
            x: baseX + 80,
            floorY: groundY - 110,
            weapon: "gun",
            sniper: true,
          })
        );
      }
      if (count >= 2) {
        list.push(
          makeNpc(team, startId + fighters + 1, 0, {
            x: baseX + 160,
            floorY: groundY - 130,
            weapon: "gun",
            sniper: true,
          })
        );
      }
      return list;
    }

    const npcs = [];
    const blueFlagX = m(BLUE_M + 8);
    const yellowFlagX = m(YELLOW_M + 12);
    const greenFlagX = m(GREEN_M + 12);
    const redFlagX = m(RED_M + 12);

    // 蓝队玩家 100（含操作者）→ NPC 99 + 守卫 30
    npcs.push(...spawnSquad("blue", 99, m(BLUE_M + 10), 0));
    for (let i = 0; i < 15; i++) {
      const gx = Math.max(8, blueFlagX - 18 - i * 18);
      npcs.push(
        makeNpc("blue", 200 + i, 0, {
          x: gx,
          weapon: i % 2 === 0 ? "gun" : "dagger",
          name: `蓝队守卫${numCN(i + 1)}`,
          flagGuard: true,
          guardX: gx,
          homeX: gx,
        })
      );
    }
    for (let i = 0; i < 15; i++) {
      const gx = blueFlagX + 26 + i * 18;
      npcs.push(
        makeNpc("blue", 220 + i, 0, {
          x: gx,
          weapon: i % 2 === 0 ? "gun" : "dagger",
          name: `蓝队守卫${numCN(16 + i)}`,
          flagGuard: true,
          guardX: gx,
          homeX: gx,
        })
      );
    }

    // 黄 / 绿 / 红：各 50 玩家，无守卫
    npcs.push(...spawnSquad("yellow", 50, m(YELLOW_M + 10), 300));
    npcs.push(...spawnSquad("green", 50, m(GREEN_M + 10), 400));
    npcs.push(...spawnSquad("red", 50, m(RED_M + 10), 500));

    const stations = [
      { id: "blue", x: m(BLUE_M + 60), label: "蓝队站", color: "#6eb6ff" },
      { id: "yellow", x: m(YELLOW_M + 60), label: "黄队站", color: "#f1c40f" },
      { id: "green", x: m(GREEN_M + 60), label: "绿队站", color: "#2ecc71" },
      { id: "red", x: m(RED_M + 60), label: "红队站", color: "#ff7a6e" },
    ];

    function stationById(id) {
      return stations.find((s) => s.id === id);
    }

    function makeSeats() {
      return Array.from({ length: 24 }, (_, i) => ({
        dx: 28 + (i % 12) * 32,
        dy: 26 + Math.floor(i / 12) * 40,
        rider: null,
      }));
    }

    function makeTrain(opts) {
      const route = opts.route;
      const st0 = stationById(route[0]);
      return {
        id: opts.id,
        line: opts.line,
        lineName: opts.lineName,
        color: opts.color,
        route,
        pingPong: !!opts.pingPong,
        routeDir: 1,
        w: 420,
        h: 100,
        berth: opts.berth || 0,
        x: (st0 ? st0.x : 0) + (opts.berth || 0),
        y: groundY - 100,
        stationIdx: 0,
        state: "dock",
        doorOpen: 1,
        waitT: opts.waitT != null ? opts.waitT : 10,
        speed: 0,
        screenMsg: `${opts.lineName} 待命`,
        needAlight: false,
        seats: makeSeats(),
      };
    }

    // 1号线蓝↔红 · 2号线红↔黄 · 3号线黄↔绿 · 4号线四队互通
    const trains = [
      makeTrain({
        id: "L1",
        line: 1,
        lineName: "1号线",
        color: "#e74c3c",
        route: ["blue", "red"],
        pingPong: true,
        waitT: 8,
        berth: 0,
      }),
      makeTrain({
        id: "L2",
        line: 2,
        lineName: "2号线",
        color: "#3498db",
        route: ["red", "yellow"],
        pingPong: true,
        waitT: 14,
        berth: 160,
      }),
      makeTrain({
        id: "L3",
        line: 3,
        lineName: "3号线",
        color: "#27ae60",
        route: ["yellow", "green"],
        pingPong: true,
        waitT: 11,
        berth: 320,
      }),
      makeTrain({
        id: "L4",
        line: 4,
        lineName: "4号线",
        color: "#9b59b6",
        route: ["blue", "yellow", "green", "red"],
        pingPong: false,
        waitT: 16,
        berth: 480,
      }),
    ];

    const battleScene = {
      groundY,
      fieldMeters: FIELD_M,
      pxPerMeter: PX_PER_M,
      playerTeam: "blue",
      playerHp: 10,
      playerMaxHp: 10,
      weapon: "gun",
      cooldown: 0,
      bullets: [],
      npcs,
      toast: "",
      toastT: 0,
      done: false,
      hurtFlash: 0,
      muzzleFlash: 0,
      phaseLeft: 3,
      phaseT: 0,
      phaseExit: false,
      medkits: 3,
      apples: 2,
      itemCd: 0,
      killFeed: null,
      revivesLeft: 3,
      reviveT: 0,
      playerDown: false,
      heardChat: "",
      summonRedSeq: 9000,
      summonRedCount: 0,
      summonCd: 0,
      makeNpc,
      trains,
      train: trains[3], // 兼容旧引用：默认指向 4 号线
      stations,
      flags: [
        { team: "blue", homeX: blueFlagX, x: blueFlagX, y: groundY, taken: false, carrier: null },
        { team: "yellow", homeX: yellowFlagX, x: yellowFlagX, y: groundY, taken: false, carrier: null },
        { team: "green", homeX: greenFlagX, x: greenFlagX, y: groundY, taken: false, carrier: null },
        { team: "red", homeX: redFlagX, x: redFlagX, y: groundY, taken: false, carrier: null },
      ],
    };

    L.finish(g, {
      homeMode: true,
      spawnX: m(40),
      floorY: groundY,
      worldWidth: FIELD_W,
      worldMin: 0,
      star: null,
      fakeLava: true,
      extra: { battleScene },
    });
  });
})();
