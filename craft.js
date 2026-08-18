(() => {
  const SX = 64;
  const SY = 36;
  const SZ = 64;
  const AIR = 0;
  const GRASS = 1;
  const DIRT = 2;
  const STONE = 3;
  const LOG = 4;
  const LEAF = 5;
  const SAND = 6;
  const WATER = 7;
  const PLANK = 8;
  const COBBLE = 9;
  const GOLD = 10;
  const COAL_ORE = 11;
  const IRON_ORE = 12;
  const GOLD_ORE = 13;
  const DIAMOND_ORE = 14;
  const GLASS = 15;
  const BRICK = 16;
  const WOOL = 17;
  const GRAVEL = 18;
  const SANDSTONE = 19;
  const DOOR_B = 20;
  const DOOR_T = 21;
  const CRAFT_TBL = 22;
  const FURNACE = 23;
  const CHEST = 24;
  const TORCH = 25;
  const IRON_BLOCK = 26;
  const DIAMOND_BLOCK = 27;
  const BOOKSHELF = 28;
  const PUMPKIN = 29;
  const HAY = 30;
  const DOOR_B_OPEN = 31;
  const DOOR_T_OPEN = 32;
  const WOOD_PICK = 50;
  const STONE_PICK = 51;
  const IRON_PICK = 52;
  const DIA_PICK = 53;
  const WOOD_AXE = 54;
  const STONE_AXE = 55;
  const IRON_AXE = 56;
  const WOOD_SHOVEL = 57;
  const STONE_SHOVEL = 58;
  const IRON_SHOVEL = 59;
  const WOOD_SWORD = 60;
  const STICK = 61;
  const COAL = 62;
  const IRON_INGOT = 63;
  const GOLD_INGOT = 64;
  const DIAMOND = 65;
  const APPLE = 66;
  const BREAD = 67;
  const DOOR_ITEM = 68;
  const WATER_Y = 5;
  const PLATEAU = 12;
  const ATLAS_COLS = 8;
  const ATLAS_ROWS = 8;
  const TILE = 32;

  const NAMES = {
    1: "草方块",
    2: "泥土",
    3: "石头",
    4: "橡木原木",
    5: "橡木树叶",
    6: "沙子",
    7: "水",
    8: "橡木木板",
    9: "圆石",
    10: "金块",
    11: "煤矿石",
    12: "铁矿石",
    13: "金矿石",
    14: "钻石矿石",
    15: "玻璃",
    16: "砖块",
    17: "白色羊毛",
    18: "沙砾",
    19: "砂岩",
    20: "橡木门",
    21: "橡木门",
    22: "工作台",
    23: "熔炉",
    24: "箱子",
    25: "火把",
    26: "铁块",
    27: "钻石块",
    28: "书架",
    29: "南瓜",
    30: "干草捆",
    31: "橡木门",
    32: "橡木门",
    50: "木镐",
    51: "石镐",
    52: "铁镐",
    53: "钻石镐",
    54: "木斧",
    55: "石斧",
    56: "铁斧",
    57: "木锹",
    58: "石锹",
    59: "铁锹",
    60: "木剑",
    61: "木棍",
    62: "煤炭",
    63: "铁锭",
    64: "金锭",
    65: "钻石",
    66: "苹果",
    67: "面包",
    68: "橡木门",
  };

  const TOOLS = {
    50: { tool: "pick", mult: 2 },
    51: { tool: "pick", mult: 4 },
    52: { tool: "pick", mult: 6 },
    53: { tool: "pick", mult: 8 },
    54: { tool: "axe", mult: 2 },
    55: { tool: "axe", mult: 4 },
    56: { tool: "axe", mult: 6 },
    57: { tool: "shovel", mult: 2 },
    58: { tool: "shovel", mult: 4 },
    59: { tool: "shovel", mult: 6 },
    60: { tool: "sword", mult: 1.5 },
  };

  const BLOCKS = {
    1: { hard: 0.6, tool: "shovel", drop: 2 },
    2: { hard: 0.5, tool: "shovel", drop: 2 },
    3: { hard: 1.5, tool: "pick", need: true, drop: 9 },
    4: { hard: 2, tool: "axe", drop: 4 },
    5: { hard: 0.2, tool: "axe", drop: 5, chance: 0.35 },
    6: { hard: 0.5, tool: "shovel", drop: 6 },
    7: { hard: 100, drop: 0 },
    8: { hard: 2, tool: "axe", drop: 8 },
    9: { hard: 2, tool: "pick", need: true, drop: 9 },
    10: { hard: 3, tool: "pick", need: true, drop: 10 },
    11: { hard: 3, tool: "pick", need: true, drop: 62 },
    12: { hard: 3, tool: "pick", need: true, drop: 12, min: "stone" },
    13: { hard: 3, tool: "pick", need: true, drop: 13, min: "iron" },
    14: { hard: 3, tool: "pick", need: true, drop: 65, min: "iron" },
    15: { hard: 0.3, tool: "pick", drop: 0 },
    16: { hard: 2, tool: "pick", need: true, drop: 16 },
    17: { hard: 0.8, drop: 17 },
    18: { hard: 0.6, tool: "shovel", drop: 18 },
    19: { hard: 0.8, tool: "pick", need: true, drop: 19 },
    20: { hard: 3, tool: "axe", drop: 68 },
    21: { hard: 3, tool: "axe", drop: 0 },
    22: { hard: 2.5, tool: "axe", drop: 22 },
    23: { hard: 3.5, tool: "pick", need: true, drop: 23 },
    24: { hard: 2.5, tool: "axe", drop: 24 },
    25: { hard: 0.1, drop: 25 },
    26: { hard: 5, tool: "pick", need: true, drop: 26 },
    27: { hard: 5, tool: "pick", need: true, drop: 27 },
    28: { hard: 1.5, tool: "axe", drop: 28 },
    29: { hard: 1, tool: "axe", drop: 29 },
    30: { hard: 0.5, tool: "hoe", drop: 30 },
    31: { hard: 3, tool: "axe", drop: 68 },
    32: { hard: 3, tool: "axe", drop: 0 },
  };

  const PLACEABLE = [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26, 27, 28, 29, 30, 68];
  const ALL_ITEMS = [
    1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26, 27, 28, 29, 30,
    50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68,
  ];

  const FACES = [
    { n: [0, 1, 0], s: 1.05, v: [0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1], uv: [0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0] },
    { n: [0, -1, 0], s: 0.42, v: [0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0], uv: [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1] },
    { n: [0, 0, 1], s: 0.86, v: [0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 1], uv: [0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0] },
    { n: [0, 0, -1], s: 0.78, v: [1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0], uv: [0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0] },
    { n: [1, 0, 0], s: 0.7, v: [1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0], uv: [0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0] },
    { n: [-1, 0, 0], s: 0.62, v: [0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1], uv: [0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0] },
  ];

  const VS = `
    attribute vec3 aPos;
    attribute vec2 aUv;
    attribute float aShade;
    uniform mat4 uMVP;
    uniform vec3 uCam;
    varying vec2 vUv;
    varying float vShade;
    varying float vFog;
    void main() {
      gl_Position = uMVP * vec4(aPos, 1.0);
      vUv = aUv;
      vShade = aShade;
      float d = distance(aPos, uCam);
      vFog = clamp((d - 32.0) / 38.0, 0.0, 1.0);
    }
  `;
  const FS = `
    precision mediump float;
    varying vec2 vUv;
    varying float vShade;
    varying float vFog;
    uniform sampler2D uTex;
    uniform vec3 uFog;
    void main() {
      vec4 t = texture2D(uTex, vUv);
      if (t.a < 0.28) discard;
      vec3 col = t.rgb * vShade;
      gl_FragColor = vec4(mix(col, uFog, vFog), t.a);
    }
  `;

  let running = false;
  let gl = null;
  let canvas = null;
  let prog = null;
  let locMVP = null;
  let locCam = null;
  let locFog = null;
  let locTex = null;
  let tex = null;
  let atlasCanvas = null;
  let worldBuf = null;
  let worldCount = 0;
  let actorBuf = null;
  let actorCount = 0;
  let blocks = null;
  let dirty = true;
  let yaw = 0;
  let pitch = -0.18;
  let px = 22;
  let py = 16;
  let pz = 16;
  let vx = 0;
  let vy = 0;
  let vz = 0;
  let onGround = false;
  let bag = [];
  let selected = 0;
  let bagOpen = false;
  let villagers = [];
  let remotes = new Map();
  let edits = [];
  let sendAcc = 0;
  let lastPos = [0, 0, 0];
  let lookDrag = null;
  let eHeld = false;
  let winSent = false;
  let handlers = {};
  let goldSpot = { x: 22, y: 13, z: 24 };
  let gameMode = "survival";
  let flying = false;
  let jumpWas = false;
  let lastJumpTap = 0;
  let mineHeld = false;
  let mineT = 0;
  let mineAt = null;
  let drops = [];
  let dropSeq = 1;

  function seededRng(seed) {
    let s = seed | 0;
    return () => {
      s = Math.imul(s ^ (s >>> 15), 1 | s);
      s ^= s + Math.imul(s ^ (s >>> 7), 61 | s);
      return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
    };
  }

  function idx(x, y, z) {
    return x + z * SX + y * SX * SZ;
  }

  function inb(x, y, z) {
    return x >= 0 && y >= 0 && z >= 0 && x < SX && y < SY && z < SZ;
  }

  function get(x, y, z) {
    if (!inb(x, y, z)) return y < 1 ? STONE : AIR;
    return blocks[idx(x, y, z)];
  }

  function set(x, y, z, id) {
    if (!inb(x, y, z) || y <= 0) return false;
    const i = idx(x, y, z);
    if (blocks[i] === id) return false;
    blocks[i] = id;
    dirty = true;
    return true;
  }

  function isDoor(id) {
    return id === DOOR_B || id === DOOR_T || id === DOOR_B_OPEN || id === DOOR_T_OPEN;
  }

  function isOpenDoor(id) {
    return id === DOOR_B_OPEN || id === DOOR_T_OPEN;
  }

  function solid(id) {
    return id !== AIR && id !== WATER && id !== TORCH && !isOpenDoor(id);
  }

  function opaque(id) {
    return (
      id !== AIR &&
      id !== WATER &&
      id !== LEAF &&
      id !== GLASS &&
      id !== TORCH &&
      !isDoor(id)
    );
  }

  function inVillage(x, z) {
    return x >= 13 && x <= 33 && z >= 15 && z <= 35;
  }

  function heightAt(x, z) {
    if (x >= 13 && x <= 33 && z >= 15 && z <= 35) return PLATEAU;
    if (x >= 11 && x <= 35 && z >= 13 && z <= 37) return PLATEAU - 1;
    if (x >= 9 && x <= 37 && z >= 11 && z <= 39) return PLATEAU - 2;
    const lx = x - 6;
    const lz = z - 7;
    const lake = lx * lx + lz * lz;
    if (lake < 64) return lake < 20 ? 3 : 4;
    const n =
      Math.sin(x * 0.18) * 1.7 +
      Math.cos(z * 0.15) * 1.5 +
      Math.sin(x * 0.07 + z * 0.09) * 1.1;
    return Math.max(7, Math.min(14, (9 + n) | 0));
  }

  function groundY(x, z) {
    const bx = Math.floor(x);
    const bz = Math.floor(z);
    for (let y = SY - 2; y >= 1; y--) {
      if (solid(get(bx, y, bz))) return y;
    }
    return PLATEAU;
  }

  function addTree(tx, tz) {
    const h = groundY(tx, tz);
    if (h <= WATER_Y + 1 || inVillage(tx, tz)) return;
    if (get(tx, h, tz) !== GRASS) return;
    const th = 4;
    for (let i = 1; i <= th; i++) set(tx, h + i, tz, LOG);
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        for (let dy = 0; dy <= 2; dy++) {
          if (Math.abs(dx) === 2 && Math.abs(dz) === 2 && dy !== 1) continue;
          const x = tx + dx;
          const y = h + th + dy;
          const z = tz + dz;
          if (inb(x, y, z) && get(x, y, z) === AIR) set(x, y, z, LEAF);
        }
      }
    }
  }

  function fillBox(x0, y0, z0, x1, y1, z1, id) {
    for (let y = y0; y <= y1; y++) {
      for (let z = z0; z <= z1; z++) {
        for (let x = x0; x <= x1; x++) set(x, y, z, id);
      }
    }
  }

  function house(x, z, w, d) {
    const y = PLATEAU;
    fillBox(x, y, z, x + w - 1, y, z + d - 1, PLANK);
    for (let h = 1; h <= 3; h++) {
      for (let i = 0; i < w; i++) {
        const edge = i === 0 || i === w - 1;
        set(x + i, y + h, z, edge ? LOG : PLANK);
        set(x + i, y + h, z + d - 1, edge ? LOG : PLANK);
      }
      for (let j = 1; j < d - 1; j++) {
        set(x, y + h, z + j, j === 1 || j === d - 2 ? LOG : PLANK);
        set(x + w - 1, y + h, z + j, j === 1 || j === d - 2 ? LOG : PLANK);
      }
    }
    fillBox(x + 1, y + 1, z + 1, x + w - 2, y + 3, z + d - 2, AIR);
    fillBox(x - 1, y + 4, z - 1, x + w, y + 4, z + d, PLANK);
    fillBox(x, y + 5, z, x + w - 1, y + 5, z + d - 1, PLANK);
    const dx = x + ((w / 2) | 0);
    set(dx, y + 1, z, DOOR_B);
    set(dx, y + 2, z, DOOR_T);
    set(x + 1, y + 2, z, GLASS);
    set(x + w - 2, y + 2, z, GLASS);
    set(x + 1, y + 1, z + d - 2, CHEST);
    set(x + w - 2, y + 1, z + 1, CRAFT_TBL);
  }

  function genWorld() {
    blocks = new Uint8Array(SX * SY * SZ);
    for (let z = 0; z < SZ; z++) {
      for (let x = 0; x < SX; x++) {
        const h = heightAt(x, z);
        for (let y = 0; y < SY; y++) {
          let id = AIR;
          if (y === 0) id = STONE;
          else if (y < h - 3) id = STONE;
          else if (y < h) id = DIRT;
          else if (y === h) id = h <= WATER_Y ? SAND : GRASS;
          else if (y <= WATER_Y && h < WATER_Y) id = WATER;
          blocks[idx(x, y, z)] = id;
        }
      }
    }
    const oreRng = seededRng(20260818);
    for (let i = 0; i < 220; i++) {
      const ox = (oreRng() * SX) | 0;
      const oy = 1 + ((oreRng() * 11) | 0);
      const oz = (oreRng() * SZ) | 0;
      if (get(ox, oy, oz) !== STONE) continue;
      const r = oreRng();
      let ore = COAL_ORE;
      if (r > 0.86 && oy <= 4) ore = DIAMOND_ORE;
      else if (r > 0.72 && oy <= 6) ore = GOLD_ORE;
      else if (r > 0.42) ore = IRON_ORE;
      set(ox, oy, oz, ore);
    }
    for (let z = 13; z <= 35; z++) {
      for (let x = 13; x <= 33; x++) {
        set(x, PLATEAU, z, GRASS);
        for (let y = PLATEAU + 1; y < SY; y++) set(x, y, z, AIR);
      }
    }
    for (let x = 21; x <= 23; x++) {
      for (let z = 16; z <= 30; z++) set(x, PLATEAU, z, DIRT);
    }
    for (let z = 23; z <= 25; z++) {
      for (let x = 16; x <= 30; x++) set(x, PLATEAU, z, DIRT);
    }
    house(15, 18, 6, 6);
    house(25, 17, 7, 6);
    house(17, 27, 6, 6);
    fillBox(21, PLATEAU, 23, 23, PLATEAU, 25, COBBLE);
    set(22, PLATEAU, 24, AIR);
    set(22, PLATEAU - 1, 24, WATER);
    set(22, PLATEAU - 2, 24, COBBLE);
    goldSpot = { x: 22, y: PLATEAU + 1, z: 24 };
    set(22, PLATEAU + 1, 24, GOLD);
    set(20, PLATEAU + 1, 24, FURNACE);
    set(24, PLATEAU + 1, 24, CRAFT_TBL);
    set(23, PLATEAU + 1, 22, HAY);
    set(21, PLATEAU + 1, 26, PUMPKIN);
    const trees = [
      [8, 18],
      [10, 30],
      [36, 16],
      [38, 32],
      [14, 8],
      [30, 8],
      [40, 22],
      [6, 24],
      [35, 40],
      [18, 40],
      [42, 12],
      [9, 40],
    ];
    for (const [tx, tz] of trees) addTree(tx, tz);
    villagers = [
      { x: 20.5, y: PLATEAU + 1, z: 21.5, yaw: 0.4, name: "吉姆", t: 0, phrase: "欢迎来到沙盒世界。" },
      { x: 26.4, y: PLATEAU + 1, z: 25.2, yaw: 2.1, name: "玛拉", t: 1.2, phrase: "木门可以右键开关。" },
      { x: 19.2, y: PLATEAU + 1, z: 28.4, yaw: -0.7, name: "老周", t: 2.4, phrase: "挖方块会掉东西，走近就能捡。" },
      { x: 24.8, y: PLATEAU + 1, z: 20.6, yaw: 1.3, name: "艾力克", t: 0.6, phrase: "石头要用镐挖才掉圆石。" },
    ];
    px = 22.5;
    pz = 16.5;
    py = standEyeY(px, pz);
    yaw = 0;
    pitch = -0.08;
    vx = vy = vz = 0;
    flying = false;
    mineHeld = false;
    mineT = 0;
    mineAt = null;
    drops = [];
    dirty = true;
  }

  function emptyBag() {
    bag = [];
    const start =
      gameMode === "creative"
        ? [
            [GRASS, 64],
            [DIRT, 64],
            [STONE, 64],
            [PLANK, 64],
            [COBBLE, 64],
            [LOG, 64],
            [DOOR_ITEM, 64],
            [GLASS, 64],
            [TORCH, 64],
          ]
        : [];
    for (let i = 0; i < 36; i++) {
      const s = start[i];
      bag.push(s ? { id: s[0], n: s[1] } : { id: 0, n: 0 });
    }
    selected = 0;
    bagOpen = false;
    renderBag();
  }

  function give(id, n) {
    if (!id || gameMode === "creative") return;
    let left = n;
    for (const s of bag) {
      if (s.id === id && s.n < 64) {
        const add = Math.min(64 - s.n, left);
        s.n += add;
        left -= add;
        if (!left) {
          renderBag();
          return;
        }
      }
    }
    for (const s of bag) {
      if (!s.id) {
        const add = Math.min(64, left);
        s.id = id;
        s.n = add;
        left -= add;
        if (!left) {
          renderBag();
          return;
        }
      }
    }
    renderBag();
  }

  function takeSelected() {
    const s = bag[selected];
    if (!s || !s.id || s.n <= 0) return 0;
    const id = s.id;
    if (gameMode === "creative") return id;
    s.n -= 1;
    if (s.n <= 0) {
      s.id = 0;
      s.n = 0;
    }
    renderBag();
    return id;
  }

  function heldTool() {
    const s = bag[selected];
    return s && TOOLS[s.id] ? TOOLS[s.id] : null;
  }

  function canHarvest(info, tool) {
    if (!info || !info.need) return true;
    if (!tool || tool.tool !== info.tool) return false;
    if (info.min === "iron") return tool.mult >= 6;
    if (info.min === "stone") return tool.mult >= 4;
    return true;
  }

  function breakSeconds(id) {
    if (gameMode === "creative") return 0.05;
    const info = BLOCKS[id];
    if (!info) return 0.75;
    const tool = heldTool();
    let speed = 1;
    if (tool && tool.tool === info.tool) speed = tool.mult;
    else if (tool && tool.tool === "sword" && (id === LEAF || id === WOOL)) speed = 1.5;
    const harvest = canHarvest(info, tool);
    return (info.hard * (harvest ? 1.5 : 5)) / Math.max(0.1, speed);
  }

  function tileFor(id, face) {
    if (id === GRASS) return face === 0 ? 0 : face === 1 ? 2 : 1;
    if (id === DIRT) return 2;
    if (id === STONE) return 3;
    if (id === LOG) return face === 0 || face === 1 ? 5 : 4;
    if (id === LEAF) return 6;
    if (id === SAND) return 7;
    if (id === WATER) return 8;
    if (id === PLANK) return 9;
    if (id === COBBLE) return 10;
    if (id === GOLD) return 11;
    if (id === COAL_ORE) return 12;
    if (id === IRON_ORE) return 13;
    if (id === GOLD_ORE) return 14;
    if (id === DIAMOND_ORE) return 15;
    if (id === GLASS) return 16;
    if (id === BRICK) return 17;
    if (id === WOOL) return 18;
    if (id === GRAVEL) return 19;
    if (id === SANDSTONE) return face === 0 || face === 1 ? 20 : 20;
    if (isDoor(id) || id === DOOR_ITEM) return 21;
    if (id === CRAFT_TBL) return face === 0 ? 22 : 23;
    if (id === FURNACE) return face === 2 ? 24 : 25;
    if (id === CHEST) return 26;
    if (id === TORCH) return 27;
    if (id === IRON_BLOCK) return 28;
    if (id === DIAMOND_BLOCK) return 29;
    if (id === BOOKSHELF) return face === 0 || face === 1 ? 9 : 30;
    if (id === PUMPKIN) return face === 2 ? 32 : 31;
    if (id === HAY) return face === 0 || face === 1 ? 34 : 33;
    if (id === WOOD_PICK) return 40;
    if (id === STONE_PICK) return 41;
    if (id === IRON_PICK) return 42;
    if (id === DIA_PICK) return 43;
    if (id === WOOD_AXE || id === STONE_AXE || id === IRON_AXE) return 44;
    if (id === WOOD_SHOVEL || id === STONE_SHOVEL || id === IRON_SHOVEL) return 45;
    if (id === WOOD_SWORD) return 46;
    if (id === STICK) return 47;
    if (id === COAL) return 48;
    if (id === IRON_INGOT) return 49;
    if (id === GOLD_INGOT) return 50;
    if (id === DIAMOND) return 51;
    if (id === APPLE) return 52;
    if (id === BREAD) return 53;
    return 3;
  }

  function atlasUV(tile, u, v) {
    const col = tile % ATLAS_COLS;
    const row = (tile / ATLAS_COLS) | 0;
    const pad = 0.004;
    const u0 = col / ATLAS_COLS + pad;
    const u1 = (col + 1) / ATLAS_COLS - pad;
    const v0 = 1 - (row + 1) / ATLAS_ROWS + pad;
    const v1 = 1 - row / ATLAS_ROWS - pad;
    return [u0 + (u1 - u0) * u, v0 + (v1 - v0) * v];
  }

  function makeAtlas() {
    const rng = seededRng(4242);
    const c = document.createElement("canvas");
    c.width = TILE * ATLAS_COLS;
    c.height = TILE * ATLAS_ROWS;
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    const put = (tile, fn) => {
      const col = tile % ATLAS_COLS;
      const row = (tile / ATLAS_COLS) | 0;
      const img = ctx.createImageData(TILE, TILE);
      for (let y = 0; y < TILE; y++) {
        for (let x = 0; x < TILE; x++) {
          const p = fn(x, y, rng);
          const i = (y * TILE + x) * 4;
          img.data[i] = p[0];
          img.data[i + 1] = p[1];
          img.data[i + 2] = p[2];
          img.data[i + 3] = p[3] == null ? 255 : p[3];
        }
      }
      ctx.putImageData(img, col * TILE, row * TILE);
    };
    const n = (a, b) => a + (rng() * 2 - 1) * b;
    const clamp = (v) => Math.max(0, Math.min(255, v | 0));
    const mix = (r, g, b, j) => [clamp(n(r, j)), clamp(n(g, j)), clamp(n(b, j)), 255];
    const stonePx = (x, y) => {
      const crack = (x + y * 3) % 13 === 0;
      const g = n(127, 10);
      return crack ? [96, 96, 96, 255] : [g, g, g, 255];
    };
    const ore = (mx, my, mz, dens) => (x, y) => {
      const spec = ((x * 7 + y * 13) % dens) === 0 || ((x * 5 + y * 3) % (dens + 2)) === 1;
      return spec ? mix(mx, my, mz, 12) : stonePx(x, y);
    };
    put(0, (x, y) => {
      const speck = (x * 3 + y * 5) % 9 === 0;
      return speck ? mix(98, 168, 68, 8) : mix(145, 189, 89, 10);
    });
    put(1, (x, y) => {
      if (y < 12) return mix(128, 178, 78, 10);
      if (y < 14) return mix(109, 156, 64, 8);
      return mix(150, 108, 74, 10);
    });
    put(2, () => mix(150, 108, 74, 10));
    put(3, stonePx);
    put(4, (x) => (x % 6 < 2 ? mix(90, 70, 42, 8) : mix(109, 85, 50, 8)));
    put(5, (x, y) => {
      const r = Math.hypot(x - 15.5, y - 15.5);
      return Math.floor(r) % 4 === 0 ? mix(109, 85, 50, 6) : mix(181, 144, 90, 8);
    });
    put(6, (x, y) => {
      if ((x + y * 3) % 8 === 0) return [0, 0, 0, 0];
      return [clamp(n(75, 12)), clamp(n(151, 14)), clamp(n(74, 10)), 230];
    });
    put(7, () => mix(219, 207, 163, 10));
    put(8, (x, y) => {
      const wave = Math.sin((x + y) * 0.45) > 0.15;
      return wave ? [70, 130, 230, 170] : [63, 118, 228, 185];
    });
    put(9, (x, y) => {
      const line = y % 8 === 0 || (x % 16 === 0 && y % 16 < 8);
      return line ? mix(130, 98, 54, 6) : mix(194, 157, 98, 8);
    });
    put(10, (x, y) => {
      const blob = (x * 3 + y * 5) % 9 < 3;
      return blob ? mix(110, 110, 110, 8) : mix(140, 140, 140, 8);
    });
    put(11, (x, y) => {
      const spark = (x % 8 === 2 && y % 8 === 3) || (x % 7 === 5 && y % 6 === 1);
      return spark ? [255, 252, 180, 255] : mix(249, 210, 54, 10);
    });
    put(12, ore(20, 20, 20, 6));
    put(13, ore(216, 175, 147, 7));
    put(14, ore(232, 188, 42, 7));
    put(15, ore(93, 236, 232, 8));
    put(16, (x, y) => {
      const edge = x < 2 || y < 2 || x > 29 || y > 29;
      return edge ? [210, 230, 240, 90] : [200, 225, 235, 70];
    });
    put(17, (x, y) => {
      const mort = y % 8 === 0 || ((y & 8) === 0 ? x % 16 === 0 : x % 16 === 8);
      return mort ? mix(178, 167, 157, 6) : mix(150, 80, 62, 8);
    });
    put(18, () => mix(233, 236, 236, 6));
    put(19, (x, y) => {
      const pebble = (x * 5 + y * 7) % 8 < 3;
      return pebble ? mix(120, 114, 108, 8) : mix(136, 126, 118, 8);
    });
    put(20, (x, y) => {
      const band = y % 8 < 2;
      return band ? mix(196, 178, 128, 6) : mix(216, 203, 138, 8);
    });
    put(21, (x, y) => {
      const frame = x < 3 || x > 28 || y < 2 || y > 29 || (x > 18 && x < 22 && y > 12 && y < 18);
      return frame ? mix(90, 64, 32, 6) : mix(157, 114, 64, 8);
    });
    put(22, (x, y) => {
      const grid = x % 16 < 2 || y % 16 < 2;
      return grid ? mix(120, 84, 42, 6) : mix(160, 118, 70, 8);
    });
    put(23, (x, y) => (y < 6 ? mix(160, 118, 70, 6) : mix(194, 157, 98, 8)));
    put(24, (x, y) => {
      const mouth = x > 8 && x < 24 && y > 10 && y < 26;
      return mouth ? [28, 20, 16, 255] : mix(96, 96, 96, 8);
    });
    put(25, () => mix(96, 96, 96, 8));
    put(26, (x, y) => {
      const band = y === 14 || y === 15;
      return band ? mix(80, 56, 24, 4) : mix(162, 106, 34, 8);
    });
    put(27, (x, y) => {
      if (y < 10 && Math.abs(x - 16) < 4) return mix(255, 180, 40, 10);
      if (Math.abs(x - 16) < 3) return mix(120, 80, 40, 6);
      return [0, 0, 0, 0];
    });
    put(28, () => mix(220, 220, 220, 8));
    put(29, () => mix(83, 242, 226, 8));
    put(30, (x, y) => {
      if (y % 8 < 6 && x > 2 && x < 30) {
        return mix(80 + ((x * 9) % 90), 40 + ((x * 3) % 40), 40, 8);
      }
      return mix(194, 157, 98, 6);
    });
    put(31, () => mix(198, 118, 24, 10));
    put(32, (x, y) => {
      const face = x > 10 && x < 22 && y > 12 && y < 22;
      return face ? mix(40, 24, 12, 6) : mix(198, 118, 24, 10);
    });
    put(33, (x) => (x % 4 < 2 ? mix(196, 162, 42, 8) : mix(176, 142, 28, 8)));
    put(34, () => mix(196, 162, 42, 8));
    const tool = (headR, headG, headB) => (x, y) => {
      const stick = Math.abs(x - y) < 2 && x > 8 && y > 8;
      const head = x > 16 && y < 16 && x < 30 && y > 4;
      if (head) return mix(headR, headG, headB, 8);
      if (stick) return mix(130, 92, 48, 6);
      return [0, 0, 0, 0];
    };
    put(40, tool(160, 118, 70));
    put(41, tool(140, 140, 140));
    put(42, tool(210, 210, 215));
    put(43, tool(80, 230, 220));
    put(44, tool(160, 118, 70));
    put(45, tool(160, 118, 70));
    put(46, (x, y) => {
      const blade = x > 14 && y < 18 && Math.abs(x - 20) < 3;
      const hilt = Math.abs(x - 16) < 2 && y > 16;
      if (blade) return mix(200, 200, 210, 6);
      if (hilt) return mix(130, 92, 48, 6);
      return [0, 0, 0, 0];
    });
    put(47, (x, y) => (Math.abs(x - y) < 2 ? mix(130, 92, 48, 6) : [0, 0, 0, 0]));
    put(48, () => mix(36, 36, 36, 8));
    put(49, () => mix(216, 175, 147, 8));
    put(50, () => mix(249, 210, 54, 8));
    put(51, () => mix(83, 242, 226, 8));
    put(52, () => mix(200, 48, 40, 8));
    put(53, () => mix(196, 148, 80, 8));
    atlasCanvas = c;
    return c;
  }

  function tileIcon(id) {
    if (!atlasCanvas) return "";
    const blitTile = (ctx, tile, dx, dy, dw, dh) => {
      const col = tile % ATLAS_COLS;
      const row = (tile / ATLAS_COLS) | 0;
      ctx.drawImage(atlasCanvas, col * TILE, row * TILE, TILE, TILE, dx, dy, dw, dh);
    };
    const c = document.createElement("canvas");
    c.width = TILE;
    c.height = TILE;
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    if (id === GRASS) {
      blitTile(ctx, 1, 5, 12, 22, 16);
      blitTile(ctx, 0, 5, 4, 22, 14);
      return c.toDataURL();
    }
    blitTile(ctx, tileFor(id, 0), 0, 0, TILE, TILE);
    return c.toDataURL();
  }

  function renderBag() {
    const hot = document.getElementById("craft-hotbar");
    const inv = document.getElementById("craft-inv-grid");
    const cell = (s, i) => {
      const on = i === selected ? " on" : "";
      const body = s.id
        ? `<img alt="${NAMES[s.id] || ""}" src="${tileIcon(s.id)}"><b>${s.n}</b>`
        : "";
      return `<button type="button" class="craft-slot${on}" data-slot="${i}" title="${NAMES[s.id] || "空"}">${body}</button>`;
    };
    if (hot) hot.innerHTML = bag.slice(0, 9).map(cell).join("");
    if (inv) inv.innerHTML = bag.map(cell).join("");
    const panel = document.getElementById("craft-inv");
    if (panel) panel.classList.toggle("hidden", !bagOpen);
    const title = document.getElementById("craft-inv-title");
    if (title) title.textContent = gameMode === "creative" ? "创造物品栏" : "背包";
    const creative = document.getElementById("craft-creative");
    const cgrid = document.getElementById("craft-creative-grid");
    if (creative) creative.classList.toggle("hidden", gameMode !== "creative" || !bagOpen);
    if (cgrid && gameMode === "creative") {
      cgrid.innerHTML = ALL_ITEMS.map((id) => {
        return `<button type="button" class="craft-slot" data-item="${id}" title="${NAMES[id] || ""}"><img alt="${NAMES[id] || ""}" src="${tileIcon(id)}"></button>`;
      }).join("");
    }
    const hint = document.getElementById("craft-hint");
    const hold = bag[selected];
    if (hint) {
      const name = hold && hold.id ? NAMES[hold.id] : "空手";
      hint.textContent =
        gameMode === "creative"
          ? `沙盒世界 · 创造 · ${name} · 按住左键挖 · 右键放 · 两下空格飞行 · E 物品栏`
          : `沙盒世界 · 生存 · ${name} · 按住左键挖 · 右键放/开门 · E 背包`;
    }
  }

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
    }
    return s;
  }

  function initGl() {
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
    gl.bindAttribLocation(prog, 0, "aPos");
    gl.bindAttribLocation(prog, 1, "aUv");
    gl.bindAttribLocation(prog, 2, "aShade");
    gl.linkProgram(prog);
    locMVP = gl.getUniformLocation(prog, "uMVP");
    locCam = gl.getUniformLocation(prog, "uCam");
    locFog = gl.getUniformLocation(prog, "uFog");
    locTex = gl.getUniformLocation(prog, "uTex");
    worldBuf = gl.createBuffer();
    actorBuf = gl.createBuffer();
    tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, makeAtlas());
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  function emitFace(arr, x, y, z, face, tile, shade) {
    const v = face.v;
    const uv = face.uv;
    for (let i = 0; i < 6; i++) {
      arr.push(x + v[i * 3], y + v[i * 3 + 1], z + v[i * 3 + 2]);
      const t = atlasUV(tile, uv[i * 2], uv[i * 2 + 1]);
      arr.push(t[0], t[1], shade);
    }
  }

  function rebuildWorldMesh() {
    const arr = [];
    for (let y = 0; y < SY; y++) {
      for (let z = 0; z < SZ; z++) {
        for (let x = 0; x < SX; x++) {
          const id = get(x, y, z);
          if (id === AIR) continue;
          if (isDoor(id)) {
            const tile = 21;
            if (isOpenDoor(id)) pushBox(arr, x, y, z, 0.16, 1, 1, tile, 1);
            else pushBox(arr, x, y, z, 1, 1, 0.16, tile, 1);
            continue;
          }
          if (id === TORCH) {
            pushBox(arr, x + 0.4, y, z + 0.4, 0.2, 0.72, 0.2, 27, 1.15);
            continue;
          }
          const leaf = id === LEAF || id === WATER || id === GLASS;
          for (let fi = 0; fi < FACES.length; fi++) {
            const face = FACES[fi];
            const nx = x + face.n[0];
            const ny = y + face.n[1];
            const nz = z + face.n[2];
            const nb = get(nx, ny, nz);
            if (leaf) {
              if (nb === id) continue;
            } else if (opaque(nb)) continue;
            let shade = face.s;
            if (solid(get(x, y + 1, z)) && fi !== 0) shade *= 0.78;
            emitFace(arr, x, y, z, face, tileFor(id, fi), shade);
          }
        }
      }
    }
    const data = new Float32Array(arr);
    gl.bindBuffer(gl.ARRAY_BUFFER, worldBuf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    worldCount = (arr.length / 6) | 0;
    dirty = false;
  }

  function pushBox(arr, x, y, z, w, h, d, tile, shadeMul) {
    for (let fi = 0; fi < FACES.length; fi++) {
      const face = FACES[fi];
      const v = face.v;
      const uv = face.uv;
      const shade = face.s * (shadeMul || 1);
      for (let i = 0; i < 6; i++) {
        arr.push(x + v[i * 3] * w, y + v[i * 3 + 1] * h, z + v[i * 3 + 2] * d);
        const t = atlasUV(tile, uv[i * 2], uv[i * 2 + 1]);
        arr.push(t[0], t[1], shade);
      }
    }
  }

  function pushPerson(arr, x, y, z, yaw, bodyTile, isVillager) {
    void yaw;
    const w = isVillager ? 0.48 : 0.52;
    const d = isVillager ? 0.36 : 0.42;
    const h = isVillager ? 1.58 : 1.8;
    pushBox(arr, x - w / 2, y, z - d / 2, w, h * 0.58, d, bodyTile, 1);
    pushBox(arr, x - 0.22, y + h * 0.58, z - 0.22, 0.44, 0.44, 0.44, 18, 1);
    if (isVillager) {
      pushBox(arr, x - 0.26, y + h * 0.64, z - 0.26, 0.52, 0.16, 0.52, 4, 1);
    }
  }

  function rebuildActors() {
    const arr = [];
    for (const v of villagers) {
    pushPerson(arr, v.x, v.y, v.z, v.yaw, 26, true);
    }
    for (const rp of remotes.values()) {
      if (rp.dead) continue;
      const x = rp.drawX != null ? rp.drawX : rp.x;
      const y = rp.drawY != null ? rp.drawY : rp.y;
      const z = rp.drawZ != null ? rp.drawZ : rp.z;
      if (x == null || z == null) continue;
      pushPerson(arr, x, y - 1.62, z, rp.yaw || 0, 11, false);
    }
    const bob = performance.now() / 400;
    for (const d of drops) {
      const s = 0.28;
      pushBox(arr, d.x - s / 2, d.y + Math.sin(bob + d.sid) * 0.06, d.z - s / 2, s, s, s, tileFor(d.id, 0), 1.1);
    }
    const data = new Float32Array(arr);
    gl.bindBuffer(gl.ARRAY_BUFFER, actorBuf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    actorCount = (arr.length / 6) | 0;
  }

  function matPersp(fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2);
    const o = new Float32Array(16);
    o[0] = f / aspect;
    o[5] = f;
    o[10] = (far + near) / (near - far);
    o[11] = -1;
    o[14] = (2 * far * near) / (near - far);
    return o;
  }

  function matLook(eye, center, up) {
    let zx = eye[0] - center[0];
    let zy = eye[1] - center[1];
    let zz = eye[2] - center[2];
    let zl = Math.hypot(zx, zy, zz) || 1;
    zx /= zl;
    zy /= zl;
    zz /= zl;
    let xx = up[1] * zz - up[2] * zy;
    let xy = up[2] * zx - up[0] * zz;
    let xz = up[0] * zy - up[1] * zx;
    let xl = Math.hypot(xx, xy, xz) || 1;
    xx /= xl;
    xy /= xl;
    xz /= xl;
    const yx = zy * xz - zz * xy;
    const yy = zz * xx - zx * xz;
    const yz = zx * xy - zy * xx;
    const o = new Float32Array(16);
    o[0] = xx;
    o[1] = yx;
    o[2] = zx;
    o[4] = xy;
    o[5] = yy;
    o[6] = zy;
    o[8] = xz;
    o[9] = yz;
    o[10] = zz;
    o[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
    o[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
    o[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
    o[15] = 1;
    return o;
  }

  function mul4(a, b) {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 4; r++) {
        o[c * 4 + r] =
          a[r] * b[c * 4] +
          a[4 + r] * b[c * 4 + 1] +
          a[8 + r] * b[c * 4 + 2] +
          a[12 + r] * b[c * 4 + 3];
      }
    }
    return o;
  }

  function fwd() {
    const cp = Math.cos(pitch);
    return [Math.sin(yaw) * cp, Math.sin(pitch), Math.cos(yaw) * cp];
  }

  function bindMesh(buf) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 24, 12);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 24, 20);
    gl.enableVertexAttribArray(2);
  }

  function drawScene() {
    if (!gl || !running) return;
    if (dirty) rebuildWorldMesh();
    rebuildActors();
    const w = canvas.width;
    const h = canvas.height;
    gl.viewport(0, 0, w, h);
    gl.clearColor(0.45, 0.7, 0.96, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const f = fwd();
    const eye = [px, py, pz];
    const center = [px + f[0], py + f[1], pz + f[2]];
    const P = matPersp((68 * Math.PI) / 180, w / Math.max(1, h), 0.06, 96);
    const V = matLook(eye, center, [0, 1, 0]);
    const MVP = mul4(P, V);
    gl.useProgram(prog);
    gl.uniformMatrix4fv(locMVP, false, MVP);
    gl.uniform3f(locCam, px, py, pz);
    gl.uniform3f(locFog, 0.62, 0.8, 0.96);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(locTex, 0);
    bindMesh(worldBuf);
    gl.drawArrays(gl.TRIANGLES, 0, worldCount);
    if (actorCount) {
      bindMesh(actorBuf);
      gl.drawArrays(gl.TRIANGLES, 0, actorCount);
    }
    placeNames(MVP);
  }

  function project(mvp, x, y, z, w, h) {
    const nx = mvp[0] * x + mvp[4] * y + mvp[8] * z + mvp[12];
    const ny = mvp[1] * x + mvp[5] * y + mvp[9] * z + mvp[13];
    const nw = mvp[3] * x + mvp[7] * y + mvp[11] * z + mvp[15];
    if (nw <= 0.05) return null;
    return {
      x: ((nx / nw) * 0.5 + 0.5) * w,
      y: (1 - ((ny / nw) * 0.5 + 0.5)) * h,
    };
  }

  function placeNames(mvp) {
    const el = document.getElementById("craft-names");
    if (!el || !canvas) return;
    const w = canvas.clientWidth || canvas.width;
    const h = canvas.clientHeight || canvas.height;
    const bits = [];
    const add = (name, x, y, z, chat) => {
      const p = project(mvp, x, y + 0.35, z, w, h);
      if (!p) return;
      const label = chat ? `${name}：${chat}` : name;
      bits.push(
        `<span class="craft-name" style="left:${p.x}px;top:${p.y}px">${escapeHtml(label)}</span>`
      );
    };
    for (const v of villagers) add(v.name, v.x, v.y + 1.7, v.z, nearVillager(v) ? v.phrase : "");
    for (const rp of remotes.values()) {
      const x = rp.drawX != null ? rp.drawX : rp.x;
      const y = rp.drawY != null ? rp.drawY : rp.y;
      const z = rp.drawZ != null ? rp.drawZ : rp.z;
      if (x == null || z == null) continue;
      add(rp.name || "玩家", x, y + 0.3, z, rp.chat && rp.chatUntil > performance.now() / 1000 ? rp.chat : "");
    }
    el.innerHTML = bits.join("");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function nearVillager(v) {
    return Math.hypot(v.x - px, v.z - pz) < 3.2;
  }

  function collideAxis(nx, ny, nz) {
    const hw = 0.28;
    const feet = ny - 1.62 + 0.08;
    const x0 = Math.floor(nx - hw);
    const x1 = Math.floor(nx + hw);
    const y0 = Math.floor(feet);
    const y1 = Math.floor(ny + 0.08);
    const z0 = Math.floor(nz - hw);
    const z1 = Math.floor(nz + hw);
    for (let y = y0; y <= y1; y++) {
      for (let z = z0; z <= z1; z++) {
        for (let x = x0; x <= x1; x++) {
          if (!inb(x, y, z)) {
            if (x < 0 || z < 0 || x >= SX || z >= SZ || y < 1) return true;
            continue;
          }
          if (solid(get(x, y, z))) return true;
        }
      }
    }
    return false;
  }

  function standEyeY(x, z) {
    const bx = Math.floor(x);
    const bz = Math.floor(z);
    for (let y = SY - 3; y >= 1; y--) {
      if (solid(get(bx, y, bz)) && !solid(get(bx, y + 1, bz)) && !solid(get(bx, y + 2, bz))) {
        return y + 1 + 1.62 + 0.05;
      }
    }
    return 14;
  }

  function movePlayer(dt, input) {
    if (input.paused) return;
    const keys = input.keys || new Set();
    const touch = input.touch || {};
    const f = fwd();
    const rx = f[2];
    const rz = -f[0];
    let ax = 0;
    let az = 0;
    const forward = keys.has("KeyW") || keys.has("w") || keys.has("W") || keys.has("ArrowUp") || touch.up;
    const back = keys.has("KeyS") || keys.has("s") || keys.has("S") || keys.has("ArrowDown") || touch.down;
    const left = keys.has("KeyA") || keys.has("a") || keys.has("A") || keys.has("ArrowLeft") || touch.left;
    const right = keys.has("KeyD") || keys.has("d") || keys.has("D") || keys.has("ArrowRight") || touch.right;
    const jump = keys.has("Space") || keys.has(" ") || touch.jump;
    const sneak = keys.has("Shift") || keys.has("ShiftLeft") || keys.has("ShiftRight");
    if (gameMode === "creative" && jump && !jumpWas) {
      const now = performance.now();
      if (now - lastJumpTap < 280) flying = !flying;
      lastJumpTap = now;
    }
    jumpWas = jump;
    if (forward) {
      ax += f[0];
      az += f[2];
    }
    if (back) {
      ax -= f[0];
      az -= f[2];
    }
    if (left) {
      ax -= rx;
      az -= rz;
    }
    if (right) {
      ax += rx;
      az += rz;
    }
    const len = Math.hypot(ax, az);
    const fly = gameMode === "creative" && flying;
    const speed = (fly ? 10.8 : sneak ? 7.2 : 4.6) * (len > 0.001 ? 1 : 0);
    if (len > 0.001) {
      ax = (ax / len) * speed;
      az = (az / len) * speed;
    }
    vx = ax;
    vz = az;
    if (fly) {
      if (jump) vy = 6.8;
      else if (sneak) vy = -6.8;
      else vy = 0;
    } else {
      vy -= 28 * dt;
      if (jump && onGround) {
        vy = 8.6;
        onGround = false;
      }
    }
    let nx = px + vx * dt;
    if (!collideAxis(nx, py, pz)) px = nx;
    let nz = pz + vz * dt;
    if (!collideAxis(px, py, nz)) pz = nz;
    let ny = py + vy * dt;
    if (!collideAxis(px, ny, pz)) {
      py = ny;
      onGround = false;
    } else {
      if (vy < 0) onGround = true;
      vy = 0;
    }
    let guard = 0;
    while (collideAxis(px, py, pz) && guard < 24) {
      py += 0.12;
      guard += 1;
      onGround = true;
    }
  }

  function rayHit(maxDist) {
    const f = fwd();
    let x = px;
    let y = py;
    let z = pz;
    const step = 0.06;
    let last = null;
    for (let t = 0; t < maxDist; t += step) {
      const bx = Math.floor(x);
      const by = Math.floor(y);
      const bz = Math.floor(z);
      if (hittable(get(bx, by, bz))) {
        return { hit: { x: bx, y: by, z: bz }, prev: last };
      }
      last = { x: bx, y: by, z: bz };
      x += f[0] * step;
      y += f[1] * step;
      z += f[2] * step;
    }
    return null;
  }

  function hittable(id) {
    return id !== AIR && id !== WATER;
  }

  function sendNet(msg) {
    const coop = window.LevelCoop;
    if (coop && coop.isJoined()) coop.send(msg);
  }

  function applyEdit(x, y, z, id, fromNet) {
    if (!set(x, y, z, id) && get(x, y, z) !== id) return;
    if (!fromNet) {
      edits.push([x, y, z, id]);
      if (edits.length > 500) edits = edits.slice(-400);
      sendNet({ type: "blk", lv: 12, x, y, z, b: id });
    }
  }

  function toggleDoor(x, y, z) {
    const id = get(x, y, z);
    if (!isDoor(id)) return false;
    const top = id === DOOR_T || id === DOOR_T_OPEN;
    const bx = x;
    const by = top ? y - 1 : y;
    const bz = z;
    const open = isOpenDoor(get(bx, by, bz)) || isOpenDoor(id);
    applyEdit(bx, by, bz, open ? DOOR_B : DOOR_B_OPEN, false);
    applyEdit(bx, by + 1, bz, open ? DOOR_T : DOOR_T_OPEN, false);
    return true;
  }

  function spawnDrop(x, y, z, id, fromNet, sid) {
    if (!id) return;
    const item = {
      sid: sid || dropSeq++,
      id,
      n: 1,
      x: fromNet ? x : x + 0.5 + (Math.random() - 0.5) * 0.28,
      y: fromNet ? y : y + 0.35,
      z: fromNet ? z : z + 0.5 + (Math.random() - 0.5) * 0.28,
      vx: fromNet ? 0 : (Math.random() - 0.5) * 1.6,
      vy: fromNet ? 0 : 2.4,
      vz: fromNet ? 0 : (Math.random() - 0.5) * 1.6,
      age: 0,
    };
    drops.push(item);
    if (!fromNet) sendNet({ type: "drop", lv: 12, sid: item.sid, id, x: item.x, y: item.y, z: item.z });
  }

  function finishBreak(x, y, z, fromNet) {
    const b = get(x, y, z);
    if (!hittable(b) || y <= 0) return;
    if (b === DOOR_T || b === DOOR_T_OPEN) {
      finishBreak(x, y - 1, z, fromNet);
      return;
    }
    const info = BLOCKS[b] || {};
    applyEdit(x, y, z, AIR, fromNet);
    if (b === DOOR_B || b === DOOR_B_OPEN) applyEdit(x, y + 1, z, AIR, fromNet);
    if (fromNet || gameMode === "creative") return;
    const tool = heldTool();
    if (!canHarvest(info, tool)) return;
    if (info.chance != null && Math.random() > info.chance) {
      if (Math.random() < 0.05) spawnDrop(x, y, z, APPLE, false);
      return;
    }
    if (info.drop) spawnDrop(x, y, z, info.drop, false);
  }

  function setBreakHud(p) {
    const el = document.getElementById("craft-break");
    if (!el) return;
    if (p == null) {
      el.classList.add("hidden");
      return;
    }
    el.classList.remove("hidden");
    const span = el.querySelector("span");
    if (span) span.style.width = `${Math.max(0, Math.min(1, p)) * 100}%`;
  }

  function mineTick(dt, mining) {
    if (!mining) {
      mineT = 0;
      mineAt = null;
      setBreakHud(null);
      return;
    }
    const hit = rayHit(6);
    if (!hit || !hit.hit) {
      mineT = 0;
      mineAt = null;
      setBreakHud(null);
      return;
    }
    const { x, y, z } = hit.hit;
    const b = get(x, y, z);
    if (!hittable(b) || y <= 0) {
      mineT = 0;
      mineAt = null;
      setBreakHud(null);
      return;
    }
    const key = `${x},${y},${z}`;
    if (mineAt !== key) {
      mineAt = key;
      mineT = 0;
    }
    const need = breakSeconds(b);
    mineT += dt;
    setBreakHud(need <= 0.06 ? 1 : mineT / need);
    if (mineT >= need) {
      finishBreak(x, y, z, false);
      mineT = 0;
      mineAt = null;
      setBreakHud(null);
    }
  }

  function placeBlock() {
    const hit = rayHit(6);
    if (!hit || !hit.hit) return;
    if (isDoor(get(hit.hit.x, hit.hit.y, hit.hit.z))) {
      toggleDoor(hit.hit.x, hit.hit.y, hit.hit.z);
      return;
    }
    if (!hit.prev) return;
    const id = bag[selected] && bag[selected].id;
    if (!id) {
      if (typeof handlers.onStatus === "function") handlers.onStatus("先选背包里的方块");
      return;
    }
    if (TOOLS[id] || id === STICK || id === COAL || id === IRON_INGOT || id === GOLD_INGOT || id === DIAMOND || id === APPLE || id === BREAD) {
      if (typeof handlers.onStatus === "function") handlers.onStatus("这个不能放下去");
      return;
    }
    const p = hit.prev;
    if (Math.abs(p.x + 0.5 - px) < 0.45 && Math.abs(p.z + 0.5 - pz) < 0.45 && p.y <= py && p.y + 1 >= py - 1.6) {
      return;
    }
    if (id === DOOR_ITEM) {
      if (get(p.x, p.y, p.z) !== AIR || get(p.x, p.y + 1, p.z) !== AIR) return;
      const used = takeSelected();
      if (!used) return;
      applyEdit(p.x, p.y, p.z, DOOR_B, false);
      applyEdit(p.x, p.y + 1, p.z, DOOR_T, false);
      if (typeof handlers.onStatus === "function") handlers.onStatus("放下了橡木门");
      return;
    }
    if (!PLACEABLE.includes(id)) return;
    const used = takeSelected();
    if (!used) return;
    applyEdit(p.x, p.y, p.z, used, false);
    if (typeof handlers.onStatus === "function") handlers.onStatus(`放下了${NAMES[used]}`);
  }

  function updateDrops(dt) {
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.age += dt;
      d.vy -= 18 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.z += d.vz * dt;
      const gx = Math.floor(d.x);
      const gy = Math.floor(d.y);
      const gz = Math.floor(d.z);
      if (solid(get(gx, gy, gz))) {
        d.y = gy + 1.05;
        d.vy = 0;
        d.vx *= 0.55;
        d.vz *= 0.55;
      }
      if (d.age > 0.45 && Math.hypot(d.x - px, d.y - py, d.z - pz) < 1.55) {
        if (gameMode !== "creative") give(d.id, d.n || 1);
        sendNet({ type: "grab", lv: 12, sid: d.sid });
        drops.splice(i, 1);
        if (typeof handlers.onStatus === "function") handlers.onStatus(`捡到了${NAMES[d.id] || "物品"}`);
      } else if (d.age > 60) drops.splice(i, 1);
    }
  }

  function updateVillagers(dt) {
    for (const v of villagers) {
      v.t += dt;
      if (v.t > 3.2) {
        v.t = 0;
        v.yaw += (Math.random() - 0.5) * 1.4;
      }
      const nx = v.x + Math.sin(v.yaw) * 0.6 * dt;
      const nz = v.z + Math.cos(v.yaw) * 0.6 * dt;
      if (!solid(get(nx | 0, v.y | 0, nz | 0)) && solid(get(nx | 0, (v.y | 0) - 1, nz | 0))) {
        if (inVillage(nx | 0, nz | 0)) {
          v.x = nx;
          v.z = nz;
        } else v.yaw += 1.2;
      } else v.yaw += 0.9;
      v.y = groundY(v.x, v.z) + 1;
    }
  }

  function sendState(force) {
    sendAcc = 0;
    lastPos = [px, py, pz];
    sendNet({
      type: "state",
      lv: 12,
      x: Math.round(px * 20) / 20,
      y: Math.round(py * 20) / 20,
      z: Math.round(pz * 20) / 20,
      yaw: Math.round(yaw * 40) / 40,
      pitch: Math.round(pitch * 40) / 40,
      vx: Math.round(vx * 10) / 10,
      vy: Math.round(vy * 10) / 10,
      vz: Math.round(vz * 10) / 10,
      facing: Math.sin(yaw) >= 0 ? 1 : -1,
      alive: true,
      name: (handlers.name || "玩家").slice(0, 12),
    });
    if (force && edits.length) sendNet({ type: "edits", lv: 12, e: edits.slice(-200) });
  }

  function tick(dt, input) {
    if (!running) return;
    movePlayer(dt, input || {});
    updateVillagers(dt);
    updateDrops(dt);
    const keys = (input && input.keys) || new Set();
    const touch = (input && input.touch) || {};
    if (keys.has("e") || keys.has("E") || keys.has("KeyE")) {
      if (!eHeld) {
        bagOpen = !bagOpen;
        renderBag();
      }
      eHeld = true;
    } else eHeld = false;
    for (let i = 1; i <= 9; i++) {
      if (keys.has(String(i)) || keys.has("Digit" + i) || keys.has("Numpad" + i)) {
        selected = i - 1;
        renderBag();
      }
    }
    const mining = !bagOpen && !(input && input.paused) && (mineHeld || touch.dig);
    mineTick(dt, mining);
    sendAcc += dt;
    const moved =
      Math.abs(px - lastPos[0]) > 0.08 ||
      Math.abs(py - lastPos[1]) > 0.08 ||
      Math.abs(pz - lastPos[2]) > 0.08;
    if (sendAcc >= (moved ? 0.08 : 0.32)) sendState(false);
    const now = performance.now() / 1000;
    for (const [id, rp] of [...remotes]) {
      if (now - (rp.last || 0) > 5) {
        remotes.delete(id);
        continue;
      }
      const follow = Math.min(1, dt * 12);
      if (rp.x == null) continue;
      rp.drawX = rp.drawX == null ? rp.x : rp.drawX + (rp.x - rp.drawX) * follow;
      rp.drawY = rp.drawY == null ? rp.y : rp.drawY + (rp.y - rp.drawY) * follow;
      rp.drawZ = rp.drawZ == null ? rp.z : rp.drawZ + (rp.z - rp.drawZ) * follow;
    }
    drawScene();
  }

  function onNet(msg) {
    if (!running || !msg) return;
    if (msg.lv != null && Number(msg.lv) !== 12) return;
    if (msg.type === "blk" && msg.x != null) {
      applyEdit(msg.x | 0, msg.y | 0, msg.z | 0, msg.b | 0, true);
      return;
    }
    if (msg.type === "drop" && msg.id) {
      if (drops.some((d) => d.sid === msg.sid)) return;
      spawnDrop(msg.x, msg.y, msg.z, msg.id | 0, true, msg.sid);
      return;
    }
    if (msg.type === "grab") {
      drops = drops.filter((d) => d.sid !== msg.sid);
      return;
    }
    if (msg.type === "edits" && Array.isArray(msg.e)) {
      for (const e of msg.e) {
        if (e && e.length >= 4) applyEdit(e[0] | 0, e[1] | 0, e[2] | 0, e[3] | 0, true);
      }
      return;
    }
    if (msg.type === "chat" && msg.id) {
      const prev = remotes.get(msg.id) || { id: msg.id };
      prev.chat = String(msg.text || "").slice(0, 12);
      prev.chatUntil = performance.now() / 1000 + 4.5;
      if (msg.name) prev.name = msg.name;
      remotes.set(msg.id, prev);
      return;
    }
    if (msg.type === "bye" && msg.id) {
      remotes.delete(msg.id);
      return;
    }
    if (msg.type === "hello" || msg.type === "state") {
      const prev = remotes.get(msg.id) || {};
      remotes.set(msg.id, {
        ...prev,
        id: msg.id,
        x: msg.x != null ? msg.x : prev.x,
        y: msg.y != null ? msg.y : prev.y,
        z: msg.z != null ? msg.z : prev.z,
        yaw: msg.yaw != null ? msg.yaw : prev.yaw,
        name: msg.name || prev.name || "玩家",
        color: prev.color || [0.95, 0.45 + (msg.id.length % 5) * 0.08, 0.25],
        last: performance.now() / 1000,
        drawX: prev.drawX,
        drawY: prev.drawY,
        drawZ: prev.drawZ,
      });
      if (msg.type === "hello") sendState(true);
    }
  }

  function onPointerDown(e) {
    if (!running || bagOpen) return;
    if (e.target.closest && e.target.closest(".craft-slot, #craft-inv, button")) return;
    if (e.pointerType === "mouse") {
      if (e.button === 2) {
        e.preventDefault();
        placeBlock();
        return;
      }
      if (e.button === 0) {
        if (!document.pointerLockElement && canvas.requestPointerLock) {
          canvas.requestPointerLock();
          return;
        }
        mineHeld = true;
      }
      return;
    }
    lookDrag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (_) {
      /* ignore */
    }
  }

  function onPointerMove(e) {
    if (!running) return;
    if (document.pointerLockElement === canvas) {
      yaw += e.movementX * 0.0024;
      pitch = Math.max(-1.4, Math.min(1.4, pitch - e.movementY * 0.0024));
      return;
    }
    if (!lookDrag || e.pointerId !== lookDrag.id) return;
    const dx = e.clientX - lookDrag.x;
    const dy = e.clientY - lookDrag.y;
    if (Math.hypot(dx, dy) > 4) lookDrag.moved = true;
    yaw += dx * 0.006;
    pitch = Math.max(-1.4, Math.min(1.4, pitch - dy * 0.006));
    lookDrag.x = e.clientX;
    lookDrag.y = e.clientY;
  }

  function onPointerUp(e) {
    if (e.button === 0) mineHeld = false;
    if (lookDrag && e.pointerId === lookDrag.id) {
      lookDrag = null;
    }
  }

  function onClickSlot(e) {
    const itemBtn = e.target.closest("[data-item]");
    if (itemBtn && gameMode === "creative") {
      const id = Number(itemBtn.dataset.item) || 0;
      if (!bag[selected]) bag[selected] = { id: 0, n: 0 };
      bag[selected].id = id;
      bag[selected].n = 64;
      renderBag();
      return;
    }
    const btn = e.target.closest("[data-slot]");
    if (!btn) return;
    selected = Number(btn.dataset.slot) || 0;
    renderBag();
  }

  function bindUi(on) {
    const hud = document.getElementById("craft-hud");
    const hot = document.getElementById("craft-hotbar");
    const inv = document.getElementById("craft-inv");
    const put = document.getElementById("craft-place");
    if (on) {
      canvas.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
      canvas.addEventListener("contextmenu", prevent);
      if (hot) hot.addEventListener("click", onClickSlot);
      if (inv) inv.addEventListener("click", onClickSlot);
      if (put) put.addEventListener("click", placeBlock);
    } else {
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("contextmenu", prevent);
      if (hot) hot.removeEventListener("click", onClickSlot);
      if (inv) inv.removeEventListener("click", onClickSlot);
      if (put) put.removeEventListener("click", placeBlock);
      mineHeld = false;
      setBreakHud(null);
      if (document.pointerLockElement === canvas && document.exitPointerLock) {
        document.exitPointerLock();
      }
    }
    void hud;
  }

  function prevent(e) {
    e.preventDefault();
  }

  function showUi(on) {
    document.body.classList.toggle("craft-on", on);
    const glEl = document.getElementById("craft-gl");
    const hud = document.getElementById("craft-hud");
    const game = document.getElementById("game");
    if (glEl) glEl.classList.toggle("hidden", !on);
    if (hud) hud.classList.toggle("hidden", !on);
    if (game) game.classList.toggle("hidden-by-craft", on);
  }

  function resize(w, h) {
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(640, Math.floor((w || 960) * dpr));
    canvas.height = Math.max(360, Math.floor((h || 540) * dpr));
  }

  function start(opts) {
    if (running) stop();
    handlers = opts || {};
    gameMode = handlers.mode === "creative" ? "creative" : "survival";
    flying = false;
    mineHeld = false;
    mineT = 0;
    mineAt = null;
    drops = [];
    canvas = document.getElementById("craft-gl");
    if (!canvas) return false;
    gl =
      canvas.getContext("webgl", { antialias: true, alpha: false, powerPreference: "high-performance" }) ||
      canvas.getContext("experimental-webgl", { antialias: true, alpha: false });
    if (!gl) {
      if (typeof handlers.onStatus === "function") handlers.onStatus("这台电脑不支持 3D");
      return false;
    }
    resize(opts.w, opts.h);
    initGl();
    genWorld();
    emptyBag();
    remotes = new Map();
    edits = [];
    winSent = false;
    running = true;
    showUi(true);
    bindUi(true);
    renderBag();
    sendState(true);
    drawScene();
    if (typeof handlers.onStatus === "function") {
      handlers.onStatus(gameMode === "creative" ? "沙盒世界 · 创造模式" : "沙盒世界 · 生存模式");
    }
    return true;
  }

  function stop() {
    if (!running) return;
    bindUi(false);
    running = false;
    showUi(false);
    remotes = new Map();
    drops = [];
    mineHeld = false;
    flying = false;
    setBreakHud(null);
    const names = document.getElementById("craft-names");
    if (names) names.innerHTML = "";
    gl = null;
    canvas = null;
  }

  function reset() {
    if (!running) return;
    genWorld();
    emptyBag();
    edits = [];
    drops = [];
    winSent = false;
    sendState(true);
  }

  window.CraftWorld = {
    start,
    stop,
    reset,
    tick,
    onNet,
    resize,
    active: () => running,
  };
})();
