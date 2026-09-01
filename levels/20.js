(() => {
  const L = GameLevels;

  L.register(20, (g) => {
    const groundY = 400;
    const room = { x: 40, y: 50, w: 880, h: groundY - 50 };

    L.plat(g, room.x, groundY, room.w, 28, "ground", { theme: "dateFloor" });
    L.plat(g, room.x, room.y, room.w, 18, "roof", { theme: "dateWall" });
    L.plat(g, room.x, room.y, 18, room.h, "mid", { theme: "dateWall" });
    L.plat(g, room.x + room.w - 18, room.y, 18, room.h, "mid", { theme: "dateWall" });

    // 窗台装饰台
    L.plat(g, 120, 210, 140, 14, "mid", { theme: "dateShelf" });
    L.plat(g, 700, 210, 140, 14, "mid", { theme: "dateShelf" });

    const table = { x: 360, y: 368, w: 240, h: 14 };
    const playerSeat = { x: 300, y: groundY - 42 };
    const dateSeat = { x: 620, y: groundY - 42 };

    const dateScene = {
      room,
      table,
      playerSeat,
      dateSeat,
      gender: null, // "f" | "m"
      choosing: true,
      dining: false,
      done: false,
      course: 0,
      courseT: 0,
      toast: "",
      toastT: 0,
      candleFlicker: 0,
      partnerBlink: 0,
      softTalk: 0,
      dineProgress: 0,
      winAt: 55,
      hearts: [],
      kissCd: 0,
      partnerSay: "",
      partnerSayT: 0,
      genderBtns: {
        f: { x: 330, y: 210, w: 130, h: 54 },
        m: { x: 500, y: 210, w: 130, h: 54 },
      },
    };

    L.finish(g, {
      homeMode: true,
      spawnX: playerSeat.x,
      floorY: groundY,
      worldWidth: 960,
      worldMin: 0,
      star: null,
      fakeLava: true,
      extra: { dateScene },
    });
  });
})();
