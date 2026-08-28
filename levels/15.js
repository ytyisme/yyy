(() => {
  const L = GameLevels;

  L.register(15, (g) => {
    const groundY = 380;

    // 城市地面（各楼层共用同一跑酷高度，靠 zone 切换场景）
    L.plat(g, 0, groundY, 960, 28, "ground", { theme: "city" });
    L.plat(g, 680, groundY - 200, 200, 200, "ground", { theme: "cityBld" });
    L.plat(g, 720, groundY - 28, 120, 28, "ground", { theme: "elevPad" });

    const subwayScene = {
      groundY,
      zone: "1F",
      phase: "explore",
      phoneOpen: false,
      phoneApp: null,
      scanMode: false,
      showBalance: false,
      balance: 20,
      ticketPrice: 3,
      qrActive: false,
      paid: false,
      hasTicket: false,
      gatePassed: false,
      onPlatform: false,
      trainCount: 0,
      trainTimer: 0,
      trainArriving: false,
      onTrain: false,
      trainPhase: "idle",
      trainX: -420,
      trainParkX: 160,
      trainT: 0,
      doorOpen: 0,
      screenDoorOpen: 0,
      doorLight: "red",
      rideT: 0,
      tunnelScroll: 0,
      pushFx: 0,
      rushT: 0,
      interiorDoorOpen: 0,
      cabinPassengers: [],
      toast: "",
      toastT: 0,
      announce: "",
      announceT: 0,
      paymentFlash: 0,
      ticketPanelOpen: false,
      elevPanelOpen: false,
      elevKind: null,
      elevatorHit: null,
      ticketHit: null,
      gateHit: null,
      platElevHit: null,
      line1: ["小村庄", "格门大桥", "七七步行街", "果比商城", "天齐河"],
      line2: ["本站", "蓝月桥"],
      crowd: [],
    };

    for (let i = 0; i < 28; i++) {
      subwayScene.crowd.push({
        x: 80 + (i % 14) * 58 + (i % 3) * 6,
        bob: Math.random() * Math.PI * 2,
      });
    }

    L.finish(g, {
      homeMode: true,
      spawnX: 120,
      floorY: groundY,
      worldWidth: 960,
      worldMin: 0,
      star: null,
      fakeLava: true,
      extra: { subwayScene },
    });
  });
})();
