(() => {
  const L = GameLevels;

  L.register(18, (g) => {
    const floor2Y = 260; // 二楼教室/走廊
    const groundY = 400; // 一楼操场/马路/食堂
    const PX_PER_M = 25;
    const m = (meters) => meters * PX_PER_M;

    // 路段：校门 → 马路 → 其他班级 → 直行500米 → 食堂
    const gateLeft = 2380;
    const gateRight = 2520;
    const roadStart = 2580;
    const roadEnd = 3600;
    const otherClassStart = roadEnd + 40;
    const otherClassEnd = otherClassStart + 1400; // 其他班级门口一带
    const straightStart = otherClassEnd + 20;
    const straightMeters = 500;
    const straightEnd = straightStart + m(straightMeters);
    const cafeteriaX = straightEnd + 80;
    const WORLD_W = cafeteriaX + 520;

    // 二楼地面：教室 + 走廊
    L.plat(g, 0, floor2Y, 1680, 24, "ground", { theme: "school" });
    // 教室左墙 / 后墙
    L.plat(g, 0, floor2Y - 200, 24, 200, "mid", { theme: "schoolWall" });
    L.plat(g, 0, floor2Y - 200, 760, 16, "roof", { theme: "schoolWall" });
    // 教室前门（下课前挡住）
    const door = L.plat(g, 760, floor2Y - 120, 22, 120, "mid", {
      theme: "schoolDoor",
      schoolDoor: true,
    });

    // 走廊延伸 + 办公室门口平台
    L.plat(g, 900, floor2Y - 160, 220, 16, "roof", { theme: "schoolWall" });

    // 楼梯口下楼（二楼 → 一楼），末级与一楼地面齐平
    const stairX = 1680;
    const stairSteps = 7;
    for (let i = 0; i < stairSteps; i++) {
      const sy = floor2Y + ((groundY - floor2Y) * (i + 1)) / (stairSteps + 1);
      L.plat(g, stairX + i * 78, sy, 74, 18, "mid", { theme: "school" });
    }

    // 一楼地面：楼梯末级 → 食堂
    const groundStart = stairX + stairSteps * 78 - 20;
    L.plat(g, groundStart, groundY, WORLD_W - groundStart, 28, "ground", {
      theme: "school",
    });

    // 其他班级门口（装饰墙，不挡路）
    const otherClasses = [];
    const classNames = ["高一(2)班", "高一(3)班", "高一(4)班", "高二(1)班", "高二(2)班", "高三(1)班"];
    for (let i = 0; i < classNames.length; i++) {
      otherClasses.push({
        x: otherClassStart + 80 + i * 220,
        label: classNames[i],
      });
    }

    const classmates = [];
    const deskXs = [180, 260, 340, 420, 500, 580, 200, 280, 360, 440, 520, 600];
    for (let i = 0; i < deskXs.length; i++) {
      classmates.push({
        id: `c${i}`,
        x: deskXs[i],
        y: floor2Y - 40,
        w: 26,
        h: 40,
        vx: 0,
        facing: -1,
        bob: Math.random() * Math.PI * 2,
        color: ["#6eb6ff", "#ff9f68", "#9bdf6e", "#e0b0ff", "#ffe566"][i % 5],
        seated: true,
        hasMeal: false,
        targetMeal: -1,
      });
    }

    const meals = [
      { x: cafeteriaX + 100, y: groundY, taken: false, by: null },
      { x: cafeteriaX + 180, y: groundY, taken: false, by: null },
      { x: cafeteriaX + 260, y: groundY, taken: false, by: null },
    ];

    const schoolScene = {
      name: "抢饭",
      floor2Y,
      groundY,
      groundStart,
      pxPerM: PX_PER_M,
      gateLeft,
      gateRight,
      roadStart,
      roadEnd,
      otherClassStart,
      otherClassEnd,
      otherClasses,
      straightStart,
      straightEnd,
      straightMeters,
      cafeteriaX,
      phase: "class", // class | rush | done
      classT: 30,
      bellPlayed: false,
      door,
      doorOpen: false,
      teacher: {
        x: 90,
        y: floor2Y - 44,
        w: 30,
        h: 44,
        vx: 0,
        facing: 1,
        state: "teach", // teach | toOffice | office
        bob: 0,
        chalk: 0,
      },
      officeX: 1020,
      classmates,
      meals,
      cars: [],
      carSpawnT: 0.8,
      toast: "",
      toastT: 0,
      done: false,
      gotMeal: false,
      zoneHint: "教室",
    };

    L.finish(g, {
      homeMode: true,
      spawnX: 480,
      floorY: floor2Y,
      worldWidth: WORLD_W,
      worldMin: 0,
      star: null,
      fakeLava: true,
      extra: { schoolScene },
    });
  });
})();
