(() => {
  const CHUNK = 16;
  const SY = 45;
  const SEA_LEVEL = 8;
  const RENDER_R = 4;
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
  const SNOW = 33;
  const ICE = 34;
  const BEDROCK = 35;
  const OBSIDIAN = 36;
  const LAVA = 37;
  const NETHERRACK = 38;
  const PORTAL = 39;
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
  const EMERALD = 69;
  const FLINT_STEEL = 70;
  const WATER_Y = SEA_LEVEL;
  const PLATEAU = 12;
  const ATLAS_COLS = 8;
  const CAT = window.McCatalog || { entries: [], byId: new Map(), tileById: new Map() };
  const ATLAS_ROWS = Math.max(36, Math.ceil((72 + (CAT.entries.length || 0)) / ATLAS_COLS));
  const TILE = 32;
  const MOB = {
    pig: { hp: 10, body: 54, head: 55, drop: [66, 1], w: 0.72, h: 0.52, d: 0.48 },
    cow: { hp: 14, body: 56, head: 57, drop: [67, 1], w: 0.88, h: 0.68, d: 0.52 },
    sheep: { hp: 8, body: 60, head: 60, drop: [17, 1], w: 0.78, h: 0.62, d: 0.48 },
    zombie: { hp: 20, body: 61, head: 61, drop: [62, 1], w: 0.48, h: 1.72, d: 0.36, hostile: true },
    fish: { hp: 3, body: 71, head: 71, drop: [0, 0], w: 0.4, h: 0.22, d: 0.18, aquatic: true },
    piglin: { hp: 18, body: 70, head: 70, drop: [64, 1], w: 0.48, h: 1.72, d: 0.36, piglin: true },
  };

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
    33: "雪块",
    34: "冰",
    35: "基岩",
    36: "黑曜石",
    37: "岩浆",
    38: "下界岩",
    39: "传送门",
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
    69: "绿宝石",
    70: "打火石",
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
    33: { hard: 0.2, tool: "shovel", drop: 33 },
    34: { hard: 0.5, tool: "pick", drop: 34 },
    35: { hard: 999, drop: 0 },
    36: { hard: 8, tool: "pick", need: true, drop: 36, min: "iron" },
    37: { hard: 100, drop: 0 },
    38: { hard: 0.6, tool: "pick", drop: 38 },
    39: { hard: 0.1, drop: 0 },
  };

  const PLACEABLE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26, 27, 28, 29, 30, 33, 34, 36, 37, 38, 39, 68];
  const BASE_ALL_ITEMS = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26, 27, 28, 29, 30, 33, 34, 36, 37, 38, 39,
    50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70,
  ];
  const ALL_ITEMS = [...new Set([...BASE_ALL_ITEMS, ...CAT.entries.map((e) => e.id)])].sort((a, b) => a - b);

  for (const e of CAT.entries) {
    NAMES[e.id] = e.name;
    if (e.kind === "block") {
      BLOCKS[e.id] = {
        hard: e.hard ?? 1,
        tool: e.tool,
        need: e.need,
        drop: e.drop ?? e.id,
        min: e.min,
      };
      if (e.placeable && !PLACEABLE.includes(e.id)) PLACEABLE.push(e.id);
    }
    if (e.toolSpec) TOOLS[e.id] = e.toolSpec;
  }

  const FACES = [
    { n: [0, 1, 0], s: 1.18, v: [0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1], uv: [0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0] },
    { n: [0, -1, 0], s: 0.62, v: [0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0], uv: [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1] },
    { n: [0, 0, 1], s: 0.94, v: [0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 1], uv: [0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0] },
    { n: [0, 0, -1], s: 0.7, v: [1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0], uv: [0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0] },
    { n: [1, 0, 0], s: 0.82, v: [1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0], uv: [0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0] },
    { n: [-1, 0, 0], s: 0.68, v: [0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1], uv: [0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0] },
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
      vFog = clamp((d - 80.0) / 64.0, 0.0, 0.18);
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
      if (t.a < 0.5) discard;
      vec3 col = t.rgb * vShade;
      gl_FragColor = vec4(mix(col, uFog, vFog), 1.0);
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
  let chunks = new Map();
  let animalChunks = new Set();
  let villageChunks = new Set();
  let dirty = true;
  let meshCenter = { cx: 0, cz: 0 };
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
  let animals = [];
  let remotes = new Map();
  let edits = [];
  let sendAcc = 0;
  let lastPos = [0, 0, 0];
  let lookDrag = null;
  let eHeld = false;
  let tradeOpen = null;
  let fHeld = false;
  let dimension = "overworld";
  let overworldReturn = null;
  let portalUseT = 0;
  let portalCooldown = 0;
  let lavaBurnT = 0;
  let fishChunks = new Set();
  let handlers = {};
  let gameMode = "survival";
  let flying = false;
  let jumpWas = false;
  let lastJumpTap = 0;
  let mineHeld = false;
  /** 触控板短按放置：按住并在该时长内松开；超过则为长按挖掘 */
  const TAP_PLACE_MS = 2000;
  const TAP_MOVE_PX = 8;
  let mineT = 0;
  let mineAt = null;
  let attackAcc = 0;
  let drops = [];
  let dropSeq = 1;

  const { seededRng, escapeHtml } = window.GameUtil;

  function chunkKey(cx, cz) {
    return dimension + ":" + cx + "," + cz;
  }

  function localIdx(lx, y, lz) {
    return lx + lz * CHUNK + y * CHUNK * CHUNK;
  }

  function worldXZ(x, z) {
    const cx = Math.floor(x / CHUNK);
    const cz = Math.floor(z / CHUNK);
    const lx = x - cx * CHUNK;
    const lz = z - cz * CHUNK;
    return { cx, cz, lx, lz };
  }

  function ensureChunk(cx, cz) {
    const k = chunkKey(cx, cz);
    if (chunks.has(k)) return chunks.get(k);
    const data = dimension === "nether" ? buildNetherChunk(cx, cz) : buildOverworldChunk(cx, cz);
    chunks.set(k, data);
    return data;
  }

  function inbY(y) {
    return y >= 0 && y < SY;
  }

  function get(x, y, z) {
    if (y < 0) return AIR;
    if (!inbY(y)) return AIR;
    const { cx, cz, lx, lz } = worldXZ(x, z);
    const chunk = ensureChunk(cx, cz);
    return chunk[localIdx(lx, y, lz)];
  }

  function set(x, y, z, id) {
    if (y < 0 || !inbY(y)) return false;
    if (y === 0 && id !== BEDROCK && id !== AIR) return false;
    const { cx, cz, lx, lz } = worldXZ(x, z);
    const chunk = ensureChunk(cx, cz);
    const i = localIdx(lx, y, lz);
    if (chunk[i] === id) return false;
    chunk[i] = id;
    dirty = true;
    return true;
  }

  function ensureChunksAround(px_, pz_, r) {
    const pcx = Math.floor(px_ / CHUNK);
    const pcz = Math.floor(pz_ / CHUNK);
    for (let dz = -r; dz <= r; dz++) {
      for (let dx = -r; dx <= r; dx++) ensureChunk(pcx + dx, pcz + dz);
    }
  }

  function isDoor(id) {
    return id === DOOR_B || id === DOOR_T || id === DOOR_B_OPEN || id === DOOR_T_OPEN;
  }

  function isOpenDoor(id) {
    return id === DOOR_B_OPEN || id === DOOR_T_OPEN;
  }

  function solid(id) {
    return id !== AIR && id !== WATER && id !== LAVA && id !== TORCH && !isOpenDoor(id) && id !== PORTAL;
  }

  function opaque(id) {
    return (
      id !== AIR &&
      id !== WATER &&
      id !== LAVA &&
      id !== LEAF &&
      id !== GLASS &&
      id !== TORCH &&
      id !== PORTAL &&
      !isDoor(id)
    );
  }

  function isAquatic(id) {
    return id === WATER;
  }

  function playerHasGold() {
    for (const s of bag) {
      if (!s.id || s.n <= 0) continue;
      if (s.id === GOLD || s.id === GOLD_INGOT || s.id === GOLD_ORE) return true;
    }
    const h = bag[selected];
    return h && h.id && (h.id === GOLD || h.id === GOLD_INGOT || h.id === GOLD_ORE);
  }

  function villageInfo(wx, wz) {
    const gx = Math.floor(wx / 128);
    const gz = Math.floor(wz / 128);
    if (hash2(gx + 17, gz + 31) < 0.38) return null;
    const cx = gx * 128 + 48 + ((hash2(gx, gz) * 32) | 0);
    const cz = gz * 128 + 48 + ((hash2(gz, gx) * 32) | 0);
    const dist = Math.hypot(wx - cx, wz - cz);
    if (dist > 18) return null;
    return { cx, cz, dist, y: PLATEAU };
  }

  function inVillage(x, z) {
    return villageInfo(x, z) != null;
  }

  function hash2(x, z) {
    const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123;
    return n - Math.floor(n);
  }

  function valueNoise(x, z) {
    const xi = Math.floor(x);
    const zi = Math.floor(z);
    const xf = x - xi;
    const zf = z - zi;
    const u = xf * xf * (3 - 2 * xf);
    const v = zf * zf * (3 - 2 * zf);
    const n00 = hash2(xi, zi);
    const n10 = hash2(xi + 1, zi);
    const n01 = hash2(xi, zi + 1);
    const n11 = hash2(xi + 1, zi + 1);
    return n00 * (1 - u) * (1 - v) + n10 * u * (1 - v) + n01 * (1 - u) * v + n11 * u * v;
  }

  function fbm(x, z) {
    return valueNoise(x, z) * 0.52 + valueNoise(x * 2.1, z * 2.1) * 0.32 + valueNoise(x * 4.3, z * 4.3) * 0.16;
  }

  function heightAt(x, z) {
    const sea = 6;
    let h = sea + fbm(x * 0.08, z * 0.08) * 11 + fbm(x * 0.22 + 5, z * 0.22) * 3.5;
    const ridge = fbm(x * 0.025 + 50, z * 0.025 + 50);
    if (ridge > 0.68) h += (ridge - 0.68) * 48;
    const lakeX = Math.sin(x * 0.04) * 40 + Math.cos(z * 0.03) * 35;
    const lakeZ = Math.cos(x * 0.035) * 38 + Math.sin(z * 0.045) * 42;
    const lake = (x - lakeX) * (x - lakeX) + (z - lakeZ) * (z - lakeZ);
    if (lake < 120) h = lake < 35 ? 2 : lake < 80 ? 4 : 5;
    h = Math.max(2, Math.min(31, Math.round(h)));
    const v = villageInfo(x, z);
    if (v) {
      if (v.dist < 10) return v.y;
      if (v.dist < 16) {
        const t = (v.dist - 10) / 6;
        return Math.round(v.y + (h - v.y) * t);
      }
    }
    return h;
  }

  function surfaceId(h, x, z) {
    const biome = fbm(x * 0.018, z * 0.018);
    const detail = fbm(x * 0.09 + 17, z * 0.09 + 31);
    if (h >= 22) return SNOW;
    if (h >= 18) return STONE;
    if (h <= WATER_Y + 1 || biome < 0.26) return SAND;
    if (biome > 0.72 && detail > 0.55) return GRAVEL;
    return GRASS;
  }

  function mobStandY(x, z, kind) {
    const bx = Math.floor(x);
    const bz = Math.floor(z);
    const gy = groundY(x, z);
    const floor = get(bx, gy, bz);
    const walkable =
      floor === GRASS ||
      floor === SAND ||
      floor === SNOW ||
      floor === DIRT ||
      floor === PLANK ||
      floor === COBBLE ||
      floor === GRAVEL ||
      floor === NETHERRACK;
    if (!walkable) return null;
    const def = MOB[kind] || MOB.pig;
    const need = Math.max(2, Math.ceil(def.h + 0.35));
    for (let dy = 1; dy <= need; dy++) {
      if (solid(get(bx, gy + dy, bz))) return null;
    }
    return gy + 1;
  }

  function turnMob(ent, amount) {
    ent.blockT = (ent.blockT || 0) + amount;
    if (ent.blockT < 0.55) return;
    ent.blockT = 0;
    ent.yaw += Math.PI * 0.35 + Math.random() * Math.PI * 0.9;
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
          if (inbY(y) && get(x, y, z) === AIR) set(x, y, z, LEAF);
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

  function spawnVillage(vx, vz) {
    const y = PLATEAU;
    const rng = seededRng(vx * 131 + vz * 719);
    house(vx - 3, vz - 2, 6, 6);
    house(vx + 4, vz - 3, 7, 6);
    house(vx - 2, vz + 5, 6, 6);
    fillBox(vx, y, vz, vx + 2, y, vz + 2, COBBLE);
    set(vx + 1, y, vz + 1, AIR);
    set(vx + 1, y - 1, vz + 1, WATER);
    const names = ["吉姆", "玛拉", "老周", "艾力克", "安娜", "小林"];
    const phrases = [
      "欢迎来到沙盒世界，这里没有尽头。",
      "按 F 和我交易，需要绿宝石。",
      "左键拿剑可以打动物和僵尸。",
      "木门右键可以开关。",
      "绿宝石可以从僵尸身上获得。",
      "走远一点能看到山和湖。",
    ];
    const trades = [
      { cost: EMERALD, costN: 2, give: BREAD, giveN: 6 },
      { cost: EMERALD, costN: 4, give: APPLE, giveN: 8 },
      { cost: EMERALD, costN: 5, give: WOOD_PICK, giveN: 1 },
      { cost: EMERALD, costN: 8, give: IRON_PICK, giveN: 1 },
      { cost: EMERALD, costN: 3, give: WOOD_SWORD, giveN: 1 },
      { cost: EMERALD, costN: 12, give: DIAMOND, giveN: 1 },
    ];
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + rng() * 0.4;
      const dist = 2 + rng() * 2.5;
      villagers.push({
        x: vx + 1.5 + Math.sin(angle) * dist,
        y: y + 1,
        z: vz + 1.5 + Math.cos(angle) * dist,
        yaw: angle + Math.PI,
        name: names[(vx + vz + i) % names.length],
        t: rng() * 2,
        phrase: phrases[(vx + i) % phrases.length],
        trades,
        hp: 999,
      });
    }
  }

  function spawnChunkAnimals(cx, cz) {
    if (dimension !== "overworld") return;
    const k = chunkKey(cx, cz);
    if (animalChunks.has(k)) return;
    animalChunks.add(k);
    const rng = seededRng(cx * 991 + cz * 313);
    const kinds = ["pig", "pig", "cow", "cow", "sheep", "sheep", "zombie"];
    const baseX = cx * CHUNK;
    const baseZ = cz * CHUNK;
    for (let n = 0; n < 3; n++) {
      const kind = kinds[(rng() * kinds.length) | 0];
      const ax = baseX + 2 + ((rng() * (CHUNK - 4)) | 0);
      const az = baseZ + 2 + ((rng() * (CHUNK - 4)) | 0);
      if (inVillage(ax, az)) continue;
      const stand = mobStandY(ax + 0.5, az + 0.5, kind);
      if (stand == null) continue;
      const def = MOB[kind];
      animals.push({
        x: ax + 0.5,
        y: stand,
        z: az + 0.5,
        yaw: rng() * Math.PI * 2,
        t: rng() * 2,
        kind,
        hp: def.hp,
        maxHp: def.hp,
        dead: false,
      });
    }
  }

  function carveWaterColumn(wx, wz, lx, lz, data) {
    let h = heightAt(wx, wz);
    const sea = valueNoise(wx * 0.008, wz * 0.008) < 0.28;
    const river = Math.abs(valueNoise(wx * 0.06 + 20, wz * 0.06) - 0.5) < 0.038;
    const pond = hash2(wx * 2, wz * 2) > 0.93 && h > SEA_LEVEL + 2;
    if (sea && h <= SEA_LEVEL + 2) {
      const floor = Math.max(1, Math.min(h, SEA_LEVEL - 1));
      for (let y = 1; y < SY; y++) {
        let id = AIR;
        if (y < floor - 2) id = STONE;
        else if (y < floor) id = DIRT;
        else if (y === floor) id = SAND;
        else if (y <= SEA_LEVEL) id = WATER;
        data[localIdx(lx, y, lz)] = id;
      }
      return;
    }
    if (river) {
      const top = Math.min(Math.max(h, SEA_LEVEL - 1) + 1, SEA_LEVEL + 1);
      for (let y = h + 1; y <= top; y++) {
        if (y >= SY) break;
        const li = localIdx(lx, y, lz);
        if (data[li] === AIR || data[li] === GRASS || data[li] === LEAF) data[li] = WATER;
      }
    }
    if (pond) {
      const surface = Math.max(1, h - 1);
      for (let y = surface; y <= h + 1 && y < SY; y++) {
        const li = localIdx(lx, y, lz);
        if (y === surface) data[li] = DIRT;
        else data[li] = WATER;
      }
    }
  }

  function spawnChunkFish(cx, cz) {
    if (dimension !== "overworld") return;
    const k = chunkKey(cx, cz);
    if (fishChunks.has(k)) return;
    fishChunks.add(k);
    const rng = seededRng(cx * 555 + cz * 777);
    const baseX = cx * CHUNK;
    const baseZ = cz * CHUNK;
    for (let n = 0; n < 5; n++) {
      const lx = 1 + ((rng() * (CHUNK - 2)) | 0);
      const lz = 1 + ((rng() * (CHUNK - 2)) | 0);
      const wx = baseX + lx;
      const wz = baseZ + lz;
      for (let y = SEA_LEVEL; y >= 1; y--) {
        if (get(wx, y, wz) !== WATER) continue;
        if (get(wx, y + 1, wz) !== WATER && get(wx, y + 1, wz) !== AIR) continue;
        animals.push({
          x: wx + 0.5,
          y: y + 0.35,
          z: wz + 0.5,
          yaw: rng() * Math.PI * 2,
          t: rng() * 2,
          kind: "fish",
          hp: 3,
          maxHp: 3,
          dead: false,
        });
        break;
      }
    }
  }

  function spawnNetherMobs(cx, cz) {
    const k = chunkKey(cx, cz);
    if (animalChunks.has(k)) return;
    animalChunks.add(k);
    const rng = seededRng(cx * 131 + cz * 919);
    const baseX = cx * CHUNK;
    const baseZ = cz * CHUNK;
    for (let n = 0; n < 2; n++) {
      const ax = baseX + 2 + ((rng() * (CHUNK - 4)) | 0);
      const az = baseZ + 2 + ((rng() * (CHUNK - 4)) | 0);
      const gy = groundY(ax + 0.5, az + 0.5);
      if (get(ax, gy, az) !== NETHERRACK) continue;
      animals.push({
        x: ax + 0.5,
        y: gy + 1,
        z: az + 0.5,
        yaw: rng() * Math.PI * 2,
        t: rng() * 2,
        kind: "piglin",
        hp: 18,
        maxHp: 18,
        dead: false,
      });
    }
  }

  function buildNetherChunk(cx, cz) {
    const k = chunkKey(cx, cz);
    if (chunks.has(k)) return chunks.get(k);
    const data = new Uint8Array(CHUNK * SY * CHUNK);
    const baseX = cx * CHUNK;
    const baseZ = cz * CHUNK;
    const rng = seededRng(cx * 777 + cz * 333);
    for (let lz = 0; lz < CHUNK; lz++) {
      for (let lx = 0; lx < CHUNK; lx++) {
        const wx = baseX + lx;
        const wz = baseZ + lz;
        const ceiling = 36 + ((fbm(wx * 0.11, wz * 0.11) * 8) | 0);
        for (let y = 0; y < SY; y++) {
          let id = AIR;
          if (y === 0) id = BEDROCK;
          else if (y < ceiling) id = NETHERRACK;
          data[localIdx(lx, y, lz)] = id;
        }
        if (rng() < 0.22) {
          const ly = 1 + ((rng() * 6) | 0);
          for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
              const nl = lx + dx;
              const nz = lz + dz;
              if (nl < 0 || nl >= CHUNK || nz < 0 || nz >= CHUNK || ly < 1) continue;
              const li = localIdx(nl, ly, nz);
              if (data[li] === NETHERRACK) data[li] = LAVA;
            }
          }
        }
        if (rng() < 0.06) {
          const surface = 1 + ((rng() * 3) | 0);
          for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
              const nl = lx + dx;
              const nz = lz + dz;
              if (nl < 0 || nl >= CHUNK || nz < 0 || nz >= CHUNK) continue;
              const li = localIdx(nl, surface, nz);
              if (data[li] === NETHERRACK) data[li] = LAVA;
            }
          }
        }
      }
    }
    chunks.set(k, data);
    spawnNetherMobs(cx, cz);
    return data;
  }

  function buildOverworldChunk(cx, cz) {
    const k = chunkKey(cx, cz);
    if (chunks.has(k)) return chunks.get(k);
    const data = new Uint8Array(CHUNK * SY * CHUNK);
    const baseX = cx * CHUNK;
    const baseZ = cz * CHUNK;
    for (let lz = 0; lz < CHUNK; lz++) {
      for (let lx = 0; lx < CHUNK; lx++) {
        const wx = baseX + lx;
        const wz = baseZ + lz;
        const h = heightAt(wx, wz);
        for (let y = 0; y < SY; y++) {
          let id = AIR;
          if (y === 0) id = BEDROCK;
          else if (y < h - 3) id = STONE;
          else if (y < h) id = h >= 19 ? STONE : DIRT;
          else if (y === h) id = surfaceId(h, wx, wz);
          else if (y <= SEA_LEVEL && h < SEA_LEVEL) id = WATER;
          data[localIdx(lx, y, lz)] = id;
        }
        carveWaterColumn(wx, wz, lx, lz, data);
      }
    }
    chunks.set(k, data);
    const oreRng = seededRng(cx * 404 + cz * 909);
    for (let i = 0; i < 18; i++) {
      const lx = (oreRng() * CHUNK) | 0;
      const oy = 1 + ((oreRng() * 11) | 0);
      const lz = (oreRng() * CHUNK) | 0;
      const li = localIdx(lx, oy, lz);
      if (data[li] !== STONE) continue;
      const r = oreRng();
      let ore = COAL_ORE;
      if (r > 0.86 && oy <= 4) ore = DIAMOND_ORE;
      else if (r > 0.72 && oy <= 6) ore = GOLD_ORE;
      else if (r > 0.42) ore = IRON_ORE;
      data[li] = ore;
    }
    const treeRng = seededRng(cx * 77 + cz * 53);
    for (let i = 0; i < 6; i++) {
      if (treeRng() > 0.55) continue;
      const lx = 2 + ((treeRng() * (CHUNK - 4)) | 0);
      const lz = 2 + ((treeRng() * (CHUNK - 4)) | 0);
      addTree(baseX + lx, baseZ + lz);
    }
    const gx = Math.floor((baseX + CHUNK / 2) / 128);
    const gz = Math.floor((baseZ + CHUNK / 2) / 128);
    const vk = chunkKey(cx, cz);
    if (hash2(gx + 17, gz + 31) >= 0.38 && !villageChunks.has(vk)) {
      const vcx = gx * 128 + 48 + ((hash2(gx, gz) * 32) | 0);
      const vcz = gz * 128 + 48 + ((hash2(gz, gx) * 32) | 0);
      if (Math.floor(vcx / CHUNK) === cx && Math.floor(vcz / CHUNK) === cz) {
        villageChunks.add(vk);
        spawnVillage(vcx - 6, vcz - 6);
      }
    }
    spawnChunkAnimals(cx, cz);
    spawnChunkFish(cx, cz);
    return data;
  }

  function tryPortalFrame(fx, fy, fz, axis) {
    const w = 4;
    const h = 5;
    const inner = [];
    for (let dy = 0; dy < h; dy++) {
      for (let di = 0; di < w; di++) {
        const x = axis === "z" ? fx + di : fx;
        const y = fy + dy;
        const z = axis === "z" ? fz : fz + di;
        const edge = di === 0 || di === w - 1 || dy === 0 || dy === h - 1;
        const id = get(x, y, z);
        if (edge) {
          if (id !== OBSIDIAN) return null;
        } else if (id === AIR || id === PORTAL) {
          inner.push({ x, y, z });
        } else return null;
      }
    }
    return inner.length >= 6 ? inner : null;
  }

  function tryFlintSteel(bx, by, bz) {
    if (get(bx, by, bz) !== OBSIDIAN) {
      if (typeof handlers.onStatus === "function") handlers.onStatus("打火石要对黑曜石框使用");
      return false;
    }
    for (let ox = bx - 3; ox <= bx; ox++) {
      for (let oy = by - 2; oy <= by; oy++) {
        let inner = tryPortalFrame(ox, oy, bz, "z");
        if (inner) {
          for (const p of inner) applyEdit(p.x, p.y, p.z, PORTAL, false);
          if (typeof handlers.onStatus === "function") handlers.onStatus("下界传送门已激活！");
          return true;
        }
        inner = tryPortalFrame(ox, oy, bz, "x");
        if (inner) {
          for (const p of inner) applyEdit(p.x, p.y, p.z, PORTAL, false);
          if (typeof handlers.onStatus === "function") handlers.onStatus("下界传送门已激活！");
          return true;
        }
      }
    }
    if (typeof handlers.onStatus === "function") handlers.onStatus("需要4×5黑曜石框（中间2×3空）");
    return false;
  }

  function inPortal() {
    const bx = Math.floor(px);
    const by = Math.floor(py - 0.5);
    const bz = Math.floor(pz);
    for (let dy = -1; dy <= 1; dy++) {
      if (get(bx, by + dy, bz) === PORTAL) return true;
    }
    return false;
  }

  function spawnReturnPortal(wx, wz) {
    const fx = Math.floor(wx) - 1;
    const fz = Math.floor(wz);
    let fy = groundY(fx + 1, fz) + 1;
    if (fy < 2) fy = 2;
    if (fy > SY - 6) fy = SY - 6;
    for (let dy = 0; dy < 5; dy++) {
      for (let di = 0; di < 4; di++) {
        const x = fx + di;
        const y = fy + dy;
        const z = fz;
        const edge = di === 0 || di === 3 || dy === 0 || dy === 4;
        set(x, y, z, edge ? OBSIDIAN : PORTAL);
      }
    }
  }

  function travelDimension() {
    if (portalCooldown > 0) return;
    portalCooldown = 2.5;
    portalUseT = 0;
    dirty = true;
    meshCenter = { cx: -999, cz: -999 };
    if (dimension === "overworld") {
      overworldReturn = { x: px, y: py, z: pz, yaw, pitch };
      dimension = "nether";
      px = px * 0.125;
      pz = pz * 0.125;
      py = 38;
      chunks = new Map();
      animalChunks = new Set();
      fishChunks = new Set();
      animals = [];
      villagers = [];
      ensureChunksAround(px, pz, RENDER_R + 2);
      py = standEyeY(px, pz);
      spawnReturnPortal(px, pz);
      if (typeof handlers.onStatus === "function") {
        handlers.onStatus("已进入下界！脚下有岩浆，旁边紫色传送门站 1 秒可回主世界");
      }
    } else {
      dimension = "overworld";
      const back = overworldReturn || { x: 0.5, y: 20, z: 0.5, yaw: 0, pitch: -0.2 };
      px = back.x;
      py = back.y;
      pz = back.z;
      yaw = back.yaw || 0;
      pitch = back.pitch || -0.2;
      chunks = new Map();
      animalChunks = new Set();
      fishChunks = new Set();
      animals = [];
      ensureChunksAround(px, pz, RENDER_R + 2);
      if (typeof handlers.onStatus === "function") handlers.onStatus("回到了主世界（从进来的传送门附近）");
    }
  }

  const HUD_HINT =
    "WASD 移动 · 触控板2秒内短按放方块/超2秒长按挖 · 鼠标左挖右键放 · E 背包 · F 交易";

  function updatePortal(dt) {
    portalCooldown = Math.max(0, portalCooldown - dt);
    const hint = document.getElementById("craft-hint");
    if (inPortal()) {
      portalUseT += dt;
      const left = Math.max(0, 0.75 - portalUseT);
      if (hint) {
        hint.textContent =
          dimension === "nether"
            ? `回程传送中… ${left.toFixed(1)} 秒后回主世界`
            : `进入下界… ${left.toFixed(1)} 秒`;
      }
      if (portalUseT >= 0.75) travelDimension();
    } else {
      portalUseT = 0;
      if (hint) hint.textContent = HUD_HINT;
    }
  }

  function updateHazards(dt) {
    const feet = Math.floor(py - 1.62);
    const bx = Math.floor(px);
    const bz = Math.floor(pz);
    let inLava = false;
    for (let dy = 0; dy <= 1; dy++) {
      if (get(bx, feet - dy, bz) === LAVA || get(bx, Math.floor(py - 0.5), bz) === LAVA) inLava = true;
    }
    if (inLava) {
      if (gameMode === "survival" && !flying) {
        lavaBurnT += dt;
        vy = 5.5;
        vx *= 0.5;
        vz *= 0.5;
        if (lavaBurnT > 0.45 && typeof handlers.onStatus === "function") {
          handlers.onStatus("岩浆好烫！快离开");
          lavaBurnT = 0;
        }
      }
    } else lavaBurnT = 0;
    if (py < -8) {
      py = standEyeY(px, pz);
      vy = 0;
      if (typeof handlers.onStatus === "function") handlers.onStatus("掉进了虚空！");
    }
  }

  function genWorld() {
    chunks = new Map();
    animalChunks = new Set();
    fishChunks = new Set();
    villageChunks = new Set();
    dimension = "overworld";
    overworldReturn = null;
    portalUseT = 0;
    portalCooldown = 0;
    villagers = [];
    animals = [];
    ensureChunksAround(0, 0, RENDER_R + 2);
    px = 0.5;
    pz = 0.5;
    py = standEyeY(px, pz);
    yaw = 0;
    pitch = -0.22;
    vx = vy = vz = 0;
    flying = false;
    mineHeld = false;
    mineT = 0;
    mineAt = null;
    drops = [];
    tradeOpen = null;
    dirty = true;
    meshCenter = { cx: 0, cz: 0 };
    if (villagers.length === 0) spawnVillage(-6, -6);
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
            [OBSIDIAN, 64],
            [FLINT_STEEL, 64],
            [NETHERRACK, 64],
          ]
        : [
            [WOOD_SWORD, 1],
            [WOOD_PICK, 1],
            [FLINT_STEEL, 1],
          ];
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
    if (id === BEDROCK) return 999;
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
    if (id === SNOW) return 35;
    if (id === ICE) return 36;
    if (id === BEDROCK) return 64;
    if (id === OBSIDIAN) return 65;
    if (id === LAVA) return 66;
    if (id === NETHERRACK) return 67;
    if (id === PORTAL) return 68;
    if (id === FLINT_STEEL) return 69;
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
    if (id === EMERALD) return 62;
    const ct = CAT.tileById.get(id);
    if (ct != null) return ct;
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
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, c.width, c.height);
    const put = (tile, fn) => {
      const col = tile % ATLAS_COLS;
      const row = (tile / ATLAS_COLS) | 0;
      const img = ctx.createImageData(TILE, TILE);
      for (let y = 0; y < TILE; y++) {
        for (let x = 0; x < TILE; x++) {
          const p = fn(x, y, rng);
          const i = (y * TILE + x) * 4;
          const cutout = p[3] === 0;
          if (cutout) {
            img.data[i] = 0;
            img.data[i + 1] = 0;
            img.data[i + 2] = 0;
            img.data[i + 3] = 0;
            continue;
          }
          const a = p[3] == null ? 255 : p[3];
          const edge = x < 2 || y < 2 || x > 29 || y > 29;
          if (edge) {
            img.data[i] = (p[0] * 0.78) | 0;
            img.data[i + 1] = (p[1] * 0.78) | 0;
            img.data[i + 2] = (p[2] * 0.78) | 0;
          } else {
            img.data[i] = p[0];
            img.data[i + 1] = p[1];
            img.data[i + 2] = p[2];
          }
          img.data[i + 3] = a;
        }
      }
      ctx.putImageData(img, col * TILE, row * TILE);
    };
    const n = (a, b) => a + (rng() * 2 - 1) * b;
    const clamp = (v) => Math.max(0, Math.min(255, v | 0));
    const mix = (r, g, b, j) => [clamp(n(r, j)), clamp(n(g, j)), clamp(n(b, j)), 255];
    const stonePx = (x, y) => {
      const crack = (x + y * 3) % 12 === 0;
      const g = 108 + ((x * 5 + y * 9) % 36);
      return crack ? [72, 72, 72, 255] : [g, g, g, 255];
    };
    const ore = (mx, my, mz, dens) => (x, y) => {
      const spec = ((x * 7 + y * 13) % dens) === 0 || ((x * 5 + y * 3) % (dens + 2)) === 1;
      return spec ? mix(mx, my, mz, 12) : stonePx(x, y);
    };
    put(0, (x, y) => {
      const speck = (x * 3 + y * 5) % 9 === 0;
      return speck ? [66, 168, 38, 255] : [88, 196, 52, 255];
    });
    put(1, (x, y) => {
      if (y < 10) return [88, 196, 52, 255];
      if (y < 14) return [72, 150, 42, 255];
      return [150, 100, 58, 255];
    });
    put(2, () => [156, 108, 68, 255]);
    put(3, stonePx);
    put(4, (x) => (x % 6 < 2 ? [96, 68, 38, 255] : [128, 92, 48, 255]));
    put(5, (x, y) => {
      const r = Math.hypot(x - 15.5, y - 15.5);
      return Math.floor(r) % 4 === 0 ? [118, 82, 44, 255] : [196, 150, 88, 255];
    });
    put(6, (x, y) => {
      if ((x + y * 3) % 11 === 0) return [0, 0, 0, 0];
      return [48, 132, 36, 255];
    });
    put(7, () => [236, 214, 150, 255]);
    put(8, (x, y) => {
      const wave = ((x + y) & 8) === 0;
      return wave ? [36, 118, 228, 255] : [24, 86, 210, 255];
    });
    put(9, (x, y) => {
      const line = y % 8 === 0 || (x % 16 === 0 && y % 16 < 8);
      return line ? [140, 96, 48, 255] : [210, 168, 96, 255];
    });
    put(10, (x, y) => {
      const blob = (x * 3 + y * 5) % 9 < 3;
      return blob ? [108, 108, 108, 255] : [148, 148, 148, 255];
    });
    put(11, (x, y) => {
      const spark = (x % 8 === 2 && y % 8 === 3) || (x % 7 === 5 && y % 6 === 1);
      return spark ? [255, 252, 160, 255] : [255, 220, 48, 255];
    });
    put(12, ore(28, 28, 28, 6));
    put(13, ore(220, 168, 132, 7));
    put(14, ore(255, 210, 40, 7));
    put(15, ore(70, 240, 235, 8));
    put(16, (x, y) => {
      const edge = x < 2 || y < 2 || x > 29 || y > 29;
      return edge ? [210, 230, 240, 255] : [200, 225, 235, 255];
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
    put(35, (x, y) => {
      const speck = (x + y * 2) % 10 === 0;
      return speck ? [220, 236, 255, 255] : [248, 252, 255, 255];
    });
    put(36, (x, y) => {
      const crack = (x * 3 + y) % 11 === 0;
      return crack ? [130, 210, 245, 255] : [150, 230, 255, 255];
    });
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
    put(54, () => mix(255, 168, 185, 8));
    put(55, (x, y) => {
      const snout = x > 18 && y > 14 && y < 22;
      return snout ? mix(240, 130, 150, 6) : mix(255, 175, 190, 8);
    });
    put(56, () => mix(88, 58, 32, 8));
    put(57, () => mix(245, 245, 250, 8));
    put(58, (x, y) => {
      const face = y > 18 && Math.abs(x - 16) < 5;
      return face ? mix(216, 175, 147, 6) : mix(120, 72, 36, 8);
    });
    put(59, (x, y) => {
      const eye = (x === 12 || x === 20) && y === 18;
      return eye ? [30, 30, 30, 255] : mix(216, 175, 147, 6);
    });
    put(60, () => mix(240, 240, 245, 6));
    put(61, (x, y) => {
      const eye = (x === 12 || x === 20) && y === 16;
      if (eye) return [20, 60, 20, 255];
      return mix(72, 140, 72, 8);
    });
    put(62, () => mix(32, 200, 96, 10));
    put(64, () => [40, 40, 44, 255]);
    put(65, (x, y) => {
      const speck = (x + y * 2) % 7 === 0;
      return speck ? [20, 8, 32, 255] : [28, 12, 42, 255];
    });
    put(66, (x, y) => {
      const bubble = ((x + y * 3) & 7) === 0;
      return bubble ? [255, 140, 20, 255] : [220, 60, 10, 255];
    });
    put(67, (x, y) => {
      const speck = (x * 3 + y) % 9 === 0;
      return speck ? [110, 30, 30, 255] : [130, 38, 38, 255];
    });
    put(68, (x, y) => {
      const swirl = ((x * 5 + y * 3) & 15) < 8;
      return swirl ? [120, 20, 180, 220] : [80, 10, 140, 220];
    });
    put(69, (x, y) => {
      const spark = x > 18 && y < 14;
      if (spark) return [255, 200, 60, 255];
      if (Math.abs(x - y) < 3 && x > 8) return [130, 92, 48, 255];
      return [0, 0, 0, 0];
    });
    put(70, (x, y) => {
      const face = y > 16 && Math.abs(x - 16) < 5;
      return face ? [240, 190, 150, 255] : [220, 160, 80, 255];
    });
    put(71, (x, y) => {
      const tail = x < 10;
      return tail ? [255, 120, 80, 255] : [255, 160, 100, 255];
    });
    const catalogPx = (e, x, y) => {
      const [r, g, b] = e.color;
      const speck = (x * 5 + y * 7) % 13 === 0;
      const m = (rr, gg, bb, j) => mix(rr, gg, bb, j);
      switch (e.pattern || "block") {
        case "stone":
          return speck ? m(r * 0.72, g * 0.72, b * 0.72, 8) : m(r, g, b, 10);
        case "wood":
          return x % 6 < 2 ? m(r * 0.82, g * 0.82, b * 0.82, 6) : m(r, g, b, 8);
        case "plank":
          return (x + y) % 8 < 2 ? m(r * 0.88, g * 0.88, b * 0.88, 5) : m(r, g, b, 7);
        case "ore":
          return speck ? m(Math.min(255, r + 80), g, b, 12) : stonePx(x, y);
        case "wool":
          return m(r, g, b, 6);
        case "concrete":
          return m(r, g, b, 4);
        case "terracotta":
          return speck ? m(r * 0.9, g * 0.9, b * 0.9, 5) : m(r, g, b, 8);
        case "glass":
          return [r, g, b, 180];
        case "glow":
          return ((x + y) & 6) === 0 ? [255, 255, 220, 255] : m(r, g, b, 10);
        case "lava":
          return ((x + y * 3) & 7) === 0 ? [255, 150, 30, 255] : m(r, g, b, 14);
        case "portal":
          return ((x * 5 + y * 3) & 15) < 8 ? [120, 20, 180, 220] : [80, 10, 140, 220];
        case "plant":
          return y > 18 ? m(r, g, b, 10) : [0, 0, 0, 0];
        case "redstone":
          return speck ? [255, 60, 60, 255] : m(r, g, b, 8);
        case "prism":
          return ((x + y) & 4) === 0 ? m(r + 20, g + 20, b + 20, 6) : m(r, g, b, 8);
        case "crystal":
          return speck ? [255, 255, 255, 255] : m(r, g, b, 12);
        case "goo":
          return m(r, g, b, 8);
        case "tnt":
          return y > 16 && x > 10 && x < 22 ? [240, 60, 60, 255] : m(r, g, b, 6);
        case "bars":
          return x % 9 < 2 || y % 9 < 2 ? m(r, g, b, 6) : [0, 0, 0, 0];
        case "grain":
          return speck ? m(r * 0.85, g * 0.85, b * 0.85, 6) : m(r, g, b, 9);
        case "ingot":
          return x > 8 && x < 24 && y > 10 && y < 22 ? [255, 255, 255, 255] : m(r, g, b, 8);
        case "gem":
          return speck ? [255, 255, 255, 255] : m(r, g, b, 12);
        case "food":
          return y > 12 ? m(r, g, b, 10) : m(r * 0.85, g * 0.85, b * 0.85, 8);
        case "tool":
          return x > 18 ? m(Math.min(255, r + 40), g, b, 10) : m(r * 0.7, g * 0.7, b * 0.7, 8);
        case "item":
        default:
          return m(r, g, b, 9);
      }
    };
    for (const e of CAT.entries) {
      const tile = CAT.tileById.get(e.id);
      if (tile == null) continue;
      put(tile, (x, y) => catalogPx(e, x, y));
    }
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
          ? `无限世界 · 创造 · ${name} · 左键/挖掘键 攻击 · F 和村民交易 · E 物品栏 · 两下空格飞行`
          : `无限世界 · 生存 · ${name} · 左键/挖掘键 攻击（木剑更快）· F 交易 · E 背包`;
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
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, makeAtlas());
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
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
    const pcx = Math.floor(px / CHUNK);
    const pcz = Math.floor(pz / CHUNK);
    meshCenter = { cx: pcx, cz: pcz };
    ensureChunksAround(px, pz, RENDER_R + 1);
    const arr = [];
    for (let cz = pcz - RENDER_R; cz <= pcz + RENDER_R; cz++) {
      for (let cx = pcx - RENDER_R; cx <= pcx + RENDER_R; cx++) {
        const chunk = ensureChunk(cx, cz);
        const baseX = cx * CHUNK;
        const baseZ = cz * CHUNK;
        for (let y = 0; y < SY; y++) {
          for (let lz = 0; lz < CHUNK; lz++) {
            for (let lx = 0; lx < CHUNK; lx++) {
              const id = chunk[localIdx(lx, y, lz)];
              if (id === AIR) continue;
              const x = baseX + lx;
              const z = baseZ + lz;
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
              const leaf = id === LEAF || id === WATER || id === GLASS || id === PORTAL || id === LAVA;
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
                if (solid(get(x, y + 1, z)) && fi !== 0) shade *= 0.72;
                if (solid(get(x - 1, y, z)) && fi === 4) shade *= 0.88;
                if (solid(get(x + 1, y, z)) && fi === 5) shade *= 0.88;
                emitFace(arr, x, y, z, face, tileFor(id, fi), shade);
              }
            }
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

  function pushMob(arr, ent) {
    const def = MOB[ent.kind];
    if (!def) return;
    if (ent.kind === "zombie" || ent.kind === "piglin") {
      pushPerson(arr, ent.x, ent.y, ent.z, ent.yaw, def.body, false, def.body, def.head);
      return;
    }
    if (ent.kind === "fish") {
      const w = def.w;
      const h = def.h;
      const d = def.d;
      const sy = Math.sin(ent.yaw);
      const cy = Math.cos(ent.yaw);
      const bx = ent.x - (sy * w) / 2 - (cy * d) / 2;
      const bz = ent.z - (cy * w) / 2 + (sy * d) / 2;
      pushBox(arr, bx, ent.y, bz, w, h, d, def.body, 1);
      return;
    }
    const w = def.w;
    const h = def.h;
    const d = def.d;
    const sy = Math.sin(ent.yaw);
    const cy = Math.cos(ent.yaw);
    const bx = ent.x - (sy * w) / 2 - (cy * d) / 2;
    const bz = ent.z - (cy * w) / 2 + (sy * d) / 2;
    pushBox(arr, bx, ent.y, bz, w, h, d, def.body, 1);
    const hx = ent.x + sy * w * 0.35;
    const hz = ent.z + cy * d * 0.35;
    pushBox(arr, hx - 0.16, ent.y + h * 0.55, hz - 0.16, 0.32, 0.32, 0.32, def.head, 1);
  }

  function pushPerson(arr, x, y, z, yaw, bodyTile, isVillager, robeTile, faceTile) {
    const w = isVillager ? 0.48 : 0.52;
    const d = isVillager ? 0.36 : 0.42;
    const h = isVillager ? 1.58 : 1.8;
    const bt = isVillager ? robeTile || 58 : bodyTile;
    pushBox(arr, x - w / 2, y, z - d / 2, w, h * 0.58, d, bt, 1);
    pushBox(arr, x - 0.22, y + h * 0.58, z - 0.22, 0.44, 0.44, 0.44, isVillager ? faceTile || 59 : 18, 1);
    if (isVillager) {
      pushBox(arr, x - 0.26, y + h * 0.64, z - 0.26, 0.52, 0.16, 0.52, 4, 1);
    }
  }

  function rebuildActors() {
    const arr = [];
    for (const v of villagers) {
      if (v.dead) continue;
      pushPerson(arr, v.x, v.y, v.z, v.yaw, 58, true, 58, 59);
    }
    for (const a of animals) {
      if (a.dead) continue;
      pushMob(arr, a);
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
    const pcx = Math.floor(px / CHUNK);
    const pcz = Math.floor(pz / CHUNK);
    if (dirty || pcx !== meshCenter.cx || pcz !== meshCenter.cz) rebuildWorldMesh();
    rebuildActors();
    const w = canvas.width;
    const h = canvas.height;
    gl.viewport(0, 0, w, h);
    const fogCol = dimension === "nether" ? [0.38, 0.07, 0.05] : [0.42, 0.68, 0.94];
    gl.clearColor(fogCol[0], fogCol[1], fogCol[2], 1);
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
    gl.uniform3f(locFog, fogCol[0], fogCol[1], fogCol[2]);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(locTex, 0);
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    bindMesh(worldBuf);
    gl.drawArrays(gl.TRIANGLES, 0, worldCount);
    if (actorCount) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      bindMesh(actorBuf);
      gl.drawArrays(gl.TRIANGLES, 0, actorCount);
      gl.disable(gl.BLEND);
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
    for (const v of villagers) {
      if (v.dead) continue;
      add(v.name, v.x, v.y + 1.7, v.z, nearVillager(v) ? (tradeOpen === v ? "交易中…" : v.phrase) : "");
    }
    for (const a of animals) {
      if (a.dead) continue;
      const label =
        a.kind === "pig"
          ? "猪"
          : a.kind === "cow"
            ? "牛"
            : a.kind === "sheep"
              ? "羊"
              : a.kind === "fish"
                ? "鱼"
                : a.kind === "piglin"
                  ? "猪灵"
                  : "僵尸";
      if (Math.hypot(a.x - px, a.z - pz) < 6) add(label, a.x, a.y + (MOB[a.kind]?.h || 1) + 0.5, a.z, "");
    }
    for (const rp of remotes.values()) {
      const x = rp.drawX != null ? rp.drawX : rp.x;
      const y = rp.drawY != null ? rp.drawY : rp.y;
      const z = rp.drawZ != null ? rp.drawZ : rp.z;
      if (x == null || z == null) continue;
      add(rp.name || "玩家", x, y + 0.3, z, rp.chat && rp.chatUntil > performance.now() / 1000 ? rp.chat : "");
    }
    el.innerHTML = bits.join("");
  }

  function nearVillager(v) {
    return Math.hypot(v.x - px, v.z - pz) < 3.2;
  }

  function collideAxis(nx, ny, nz) {
    ensureChunksAround(nx, nz, 2);
    const hw = 0.28;
    const feet = ny - 1.62 + 0.08;
    const x0 = Math.floor(nx - hw);
    const x1 = Math.floor(nx + hw);
    const y0 = Math.floor(feet);
    const y1 = Math.floor(ny + 0.08);
    const z0 = Math.floor(nz - hw);
    const z1 = Math.floor(nz + hw);
    for (let y = y0; y <= y1; y++) {
      if (y < 1) return true;
      for (let z = z0; z <= z1; z++) {
        for (let x = x0; x <= x1; x++) {
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
    if (id === AIR || id === WATER || id === LAVA) return false;
    if (id === BEDROCK && gameMode !== "creative") return false;
    return true;
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
    if (!hittable(b)) return;
    if (b === BEDROCK && gameMode !== "creative") return;
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

  function countItem(id) {
    let n = 0;
    for (const s of bag) if (s.id === id) n += s.n;
    return n;
  }

  function takeItem(id, n) {
    let left = n;
    for (const s of bag) {
      if (s.id !== id || left <= 0) continue;
      const sub = Math.min(s.n, left);
      s.n -= sub;
      left -= sub;
      if (s.n <= 0) {
        s.id = 0;
        s.n = 0;
      }
    }
    renderBag();
    return left <= 0;
  }

  function renderTrade() {
    const el = document.getElementById("craft-trade");
    const list = document.getElementById("craft-trade-list");
    if (!el || !list) return;
    if (!tradeOpen) {
      el.classList.add("hidden");
      return;
    }
    el.classList.remove("hidden");
    const title = document.getElementById("craft-trade-title");
    if (title) title.textContent = `${tradeOpen.name} · 交易（需要绿宝石）`;
    list.innerHTML = (tradeOpen.trades || [])
      .map(
        (t, i) =>
          `<button type="button" class="craft-trade-btn" data-trade="${i}">
            <img src="${tileIcon(t.cost)}" alt=""><span>${t.costN} ${NAMES[t.cost]}</span>
            <span class="craft-trade-arrow">→</span>
            <img src="${tileIcon(t.give)}" alt=""><span>${t.giveN} ${NAMES[t.give]}</span>
          </button>`
      )
      .join("");
  }

  function doTrade(idx) {
    if (!tradeOpen || !tradeOpen.trades) return;
    const t = tradeOpen.trades[idx];
    if (!t) return;
    if (countItem(t.cost) < t.costN) {
      if (typeof handlers.onStatus === "function") handlers.onStatus("绿宝石不够，打僵尸有几率掉落");
      return;
    }
    takeItem(t.cost, t.costN);
    give(t.give, t.giveN);
    if (typeof handlers.onStatus === "function") handlers.onStatus(`交易成功：获得 ${NAMES[t.give]}`);
  }

  function interactVillager() {
    let near = null;
    let best = 3.8;
    for (const v of villagers) {
      if (v.dead) continue;
      const d = Math.hypot(v.x - px, v.z - pz);
      if (d < best) {
        best = d;
        near = v;
      }
    }
    if (near) {
      tradeOpen = near;
      renderTrade();
      if (typeof handlers.onStatus === "function") handlers.onStatus(`和 ${near.name} 交易 · 需要绿宝石`);
      return true;
    }
    return false;
  }

  function rayMarchBlockDist(maxDist) {
    const f = fwd();
    let x = px;
    let y = py;
    let z = pz;
    const step = 0.06;
    for (let t = 0; t < maxDist; t += step) {
      const bx = Math.floor(x);
      const by = Math.floor(y);
      const bz = Math.floor(z);
      if (hittable(get(bx, by, bz))) return t;
      x += f[0] * step;
      y += f[1] * step;
      z += f[2] * step;
    }
    return null;
  }

  function entityBox(ent) {
    const def = MOB[ent.kind] || MOB.pig;
    if (ent.kind === "zombie") {
      return {
        x0: ent.x - 0.28,
        x1: ent.x + 0.28,
        y0: ent.y,
        y1: ent.y + 1.85,
        z0: ent.z - 0.22,
        z1: ent.z + 0.22,
      };
    }
    if (ent.kind === "fish") {
      return {
        x0: ent.x - 0.22,
        x1: ent.x + 0.22,
        y0: ent.y - 0.1,
        y1: ent.y + 0.2,
        z0: ent.z - 0.14,
        z1: ent.z + 0.14,
      };
    }
    if (ent.kind === "piglin") {
      return {
        x0: ent.x - 0.28,
        x1: ent.x + 0.28,
        y0: ent.y,
        y1: ent.y + 1.85,
        z0: ent.z - 0.22,
        z1: ent.z + 0.22,
      };
    }
    const pad = Math.max(def.w, def.d) * 0.55;
    return {
      x0: ent.x - pad,
      x1: ent.x + pad,
      y0: ent.y,
      y1: ent.y + def.h + 0.45,
      z0: ent.z - pad,
      z1: ent.z + pad,
    };
  }

  function rayAabb(origin, dir, box, maxDist) {
    let tmin = 0;
    let tmax = maxDist;
    const axes = [
      [0, box.x0, box.x1],
      [1, box.y0, box.y1],
      [2, box.z0, box.z1],
    ];
    for (const [axis, b0, b1] of axes) {
      const o = origin[axis];
      const d = dir[axis];
      if (Math.abs(d) < 1e-8) {
        if (o < b0 || o > b1) return null;
        continue;
      }
      let t1 = (b0 - o) / d;
      let t2 = (b1 - o) / d;
      if (t1 > t2) {
        const tmp = t1;
        t1 = t2;
        t2 = tmp;
      }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    }
    if (tmin < 0 || tmin > maxDist) return null;
    return tmin;
  }

  function rayHitEntity(maxDist) {
    const f = fwd();
    const origin = [px, py, pz];
    let best = null;
    let bestT = maxDist + 1;
    for (const a of animals) {
      if (a.dead) continue;
      const t = rayAabb(origin, f, entityBox(a), maxDist);
      if (t != null && t < bestT) {
        bestT = t;
        best = a;
      }
    }
    return best;
  }

  function rayHitEntityDist(maxDist) {
    const f = fwd();
    const origin = [px, py, pz];
    let bestT = null;
    for (const a of animals) {
      if (a.dead) continue;
      const t = rayAabb(origin, f, entityBox(a), maxDist);
      if (t != null && (bestT == null || t < bestT)) bestT = t;
    }
    return bestT;
  }

  function shouldAttackEntity(maxDist) {
    const ent = rayHitEntity(maxDist);
    if (!ent) return null;
    const entT = rayHitEntityDist(maxDist);
    const blockT = rayMarchBlockDist(maxDist);
    if (blockT != null && entT != null && blockT < entT - 0.15) return null;
    return ent;
  }

  function attackEntity(ent) {
    if (!ent || ent.dead || ent.hp >= 999) return false;
    const tool = heldTool();
    const dmg = tool && tool.tool === "sword" ? 5 * tool.mult : 2;
    ent.hp -= dmg;
    if (ent.hp <= 0) {
      ent.dead = true;
      const def = MOB[ent.kind];
      if (def && def.drop) spawnDrop(ent.x, ent.y, ent.z, def.drop[0], false);
      if (ent.kind === "zombie" && Math.random() < 0.4) spawnDrop(ent.x, ent.y + 0.2, ent.z, EMERALD, false);
      const label = ent.kind === "zombie" ? "僵尸" : ent.kind === "pig" ? "猪" : ent.kind === "cow" ? "牛" : ent.kind === "sheep" ? "羊" : ent.kind === "fish" ? "鱼" : ent.kind === "piglin" ? "猪灵" : "生物";
      if (typeof handlers.onStatus === "function") handlers.onStatus(`${label} 被击败了`);
    } else if (typeof handlers.onStatus === "function") {
      handlers.onStatus(`命中！剩余 ${Math.max(0, ent.hp | 0)} HP`);
    }
    return true;
  }

  function meleeSwing() {
    const target = shouldAttackEntity(6.5);
    if (target) {
      attackEntity(target);
      setBreakHud(null);
      return true;
    }
    return false;
  }

  function mineTick(dt, mining) {
    if (mining) {
      const target = shouldAttackEntity(6.5);
      if (target) {
        attackAcc += dt;
        mineT = 0;
        mineAt = null;
        setBreakHud(attackAcc / 0.28);
        if (attackAcc >= 0.28) {
          attackEntity(target);
          attackAcc = 0;
          setBreakHud(null);
        }
        return;
      }
      attackAcc = 0;
    } else {
      attackAcc = 0;
    }
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
    if (!hittable(b)) {
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

  function isUtilityItem(id) {
    if (!id) return true;
    if (TOOLS[id]) return true;
    if (
      id === STICK ||
      id === COAL ||
      id === IRON_INGOT ||
      id === GOLD_INGOT ||
      id === DIAMOND ||
      id === APPLE ||
      id === BREAD ||
      id === EMERALD ||
      id === FLINT_STEEL
    ) {
      return true;
    }
    const e = CAT.byId.get(id);
    return !!(e && e.kind !== "block");
  }

  function placeBlock() {
    const hit = rayHit(6);
    if (!hit || !hit.hit) return;
    const sel = bag[selected] && bag[selected].id;
    if (sel === FLINT_STEEL) {
      if (tryFlintSteel(hit.hit.x, hit.hit.y, hit.hit.z) && gameMode !== "creative") takeSelected();
      return;
    }
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
    if (isUtilityItem(id)) {
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
      if (v.t > 3.8) {
        v.t = 0;
        v.yaw += (Math.random() - 0.5) * 1.2;
      }
      const nx = v.x + Math.sin(v.yaw) * 0.85 * dt;
      const nz = v.z + Math.cos(v.yaw) * 0.85 * dt;
      const ny = mobStandY(nx, nz, "zombie");
      if (ny != null) {
        v.x = nx;
        v.z = nz;
        v.y = ny;
        v.blockT = 0;
      } else {
        turnMob(v, dt);
      }
    }
  }

  function fishInWater(x, y, z) {
    const bx = Math.floor(x);
    const by = Math.floor(y);
    const bz = Math.floor(z);
    return get(bx, by, bz) === WATER;
  }

  function updateAnimals(dt) {
    for (const a of animals) {
      if (a.dead) continue;
      const def = MOB[a.kind];
      if (a.kind === "fish") {
        a.t += dt;
        if (a.t > 2.4) {
          a.t = 0;
          a.yaw += (Math.random() - 0.5) * 1.6;
        }
        const sp = 1.5 * dt;
        let nx = a.x + Math.sin(a.yaw) * sp;
        let nz = a.z + Math.cos(a.yaw) * sp;
        if (!fishInWater(nx, a.y, nz)) {
          a.yaw += Math.PI * 0.45 + Math.random() * 0.4;
          nx = a.x + Math.sin(a.yaw) * sp;
          nz = a.z + Math.cos(a.yaw) * sp;
        }
        if (fishInWater(nx, a.y, nz)) {
          a.x = nx;
          a.z = nz;
        }
        const bob = Math.sin(performance.now() / 500 + a.x) * 0.08 * dt;
        const tryY = a.y + bob + (Math.random() < 0.015 ? (Math.random() - 0.5) * 0.6 * dt : 0);
        if (fishInWater(a.x, tryY, a.z)) a.y = tryY;
        continue;
      }
      if (a.kind === "piglin") {
        const calm = playerHasGold();
        if (!calm) {
          const dx = px - a.x;
          const dz = pz - a.z;
          const dist = Math.hypot(dx, dz);
          if (dist < 16 && dist > 0.7) {
            a.yaw = Math.atan2(dx, dz);
            const sp = 2.8 * dt;
            const nx = a.x + Math.sin(a.yaw) * sp;
            const nz = a.z + Math.cos(a.yaw) * sp;
            const ny = mobStandY(nx, nz, a.kind);
            if (ny != null) {
              a.x = nx;
              a.z = nz;
              a.y = ny;
              a.blockT = 0;
            } else turnMob(a, dt);
          }
          continue;
        }
      }
      if (def && def.hostile) {
        const dx = px - a.x;
        const dz = pz - a.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 18 && dist > 0.6) {
          a.yaw = Math.atan2(dx, dz);
          const sp = 2.6 * dt;
          const nx = a.x + Math.sin(a.yaw) * sp;
          const nz = a.z + Math.cos(a.yaw) * sp;
          const ny = mobStandY(nx, nz, a.kind);
          if (ny != null) {
            a.x = nx;
            a.z = nz;
            a.y = ny;
            a.blockT = 0;
          } else {
            turnMob(a, dt);
          }
        }
        continue;
      }
      a.t += dt;
      if (a.t > 3.2) {
        a.t = 0;
        a.yaw += (Math.random() - 0.5) * 1.4;
      }
      const nx = a.x + Math.sin(a.yaw) * 1.1 * dt;
      const nz = a.z + Math.cos(a.yaw) * 1.1 * dt;
      const ny = mobStandY(nx, nz, a.kind);
      if (ny != null) {
        a.x = nx;
        a.z = nz;
        a.y = ny;
        a.blockT = 0;
      } else {
        turnMob(a, dt);
      }
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
    ensureChunksAround(px, pz, RENDER_R + 2);
    movePlayer(dt, input || {});
    updatePortal(dt);
    updateHazards(dt);
    updateVillagers(dt);
    updateAnimals(dt);
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
    if (keys.has("f") || keys.has("F") || keys.has("KeyF")) {
      if (!fHeld) interactVillager();
      fHeld = true;
    } else fHeld = false;
    if (keys.has("Escape") && tradeOpen) {
      tradeOpen = null;
      renderTrade();
    }
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

  function useTapPadControls(e) {
    if (e.pointerType === "touch" || e.pointerType === "pen") return true;
    if (document.pointerLockElement === canvas) return false;
    if ((navigator.maxTouchPoints || 0) > 0) return true;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.matchMedia("(max-width: 920px)").matches;
    return coarse || narrow;
  }

  function clearTapPadTimer() {
    if (lookDrag && lookDrag.timer) {
      clearTimeout(lookDrag.timer);
      lookDrag.timer = null;
    }
  }

  function startTapPadPointer(e) {
    clearTapPadTimer();
    lookDrag = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      longPress: false,
      timer: setTimeout(() => {
        if (!lookDrag || lookDrag.id !== e.pointerId || lookDrag.moved) return;
        lookDrag.longPress = true;
        mineHeld = true;
        meleeSwing();
      }, TAP_PLACE_MS),
    };
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (_) {
      /* ignore */
    }
  }

  function onPointerDown(e) {
    if (!running || bagOpen) return;
    if (e.target.closest && e.target.closest(".craft-slot, #craft-inv, #craft-trade, button")) return;
    if (useTapPadControls(e)) {
      if (e.button !== 0) return;
      e.preventDefault();
      startTapPadPointer(e);
      return;
    }
    if (e.pointerType === "mouse") {
      if (e.button === 2) {
        e.preventDefault();
        if (!interactVillager()) placeBlock();
        return;
      }
      if (e.button === 0) {
        if (!document.pointerLockElement && canvas.requestPointerLock) {
          canvas.requestPointerLock();
        }
        mineHeld = true;
        meleeSwing();
      }
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
    yaw += dx * 0.006;
    pitch = Math.max(-1.4, Math.min(1.4, pitch - dy * 0.006));
    lookDrag.x = e.clientX;
    lookDrag.y = e.clientY;
    if (
      !lookDrag.longPress &&
      Math.hypot(e.clientX - lookDrag.startX, e.clientY - lookDrag.startY) > TAP_MOVE_PX
    ) {
      lookDrag.moved = true;
      clearTapPadTimer();
    }
  }

  function onPointerUp(e) {
    if (lookDrag && e.pointerId === lookDrag.id) {
      clearTapPadTimer();
      if (lookDrag.longPress) {
        mineHeld = false;
      } else if (!lookDrag.moved) {
        if (!interactVillager()) placeBlock();
      }
      lookDrag = null;
      return;
    }
    if (e.button === 0) mineHeld = false;
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

  function onClickTrade(e) {
    const btn = e.target.closest("[data-trade]");
    if (!btn) return;
    doTrade(Number(btn.dataset.trade) || 0);
  }

  function bindUi(on) {
    const hud = document.getElementById("craft-hud");
    const hot = document.getElementById("craft-hotbar");
    const inv = document.getElementById("craft-inv");
    const put = document.getElementById("craft-place");
    const trade = document.getElementById("craft-trade");
    const tradeClose = document.getElementById("craft-trade-close");
    if (on) {
      canvas.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
      canvas.addEventListener("contextmenu", prevent);
      if (hot) hot.addEventListener("click", onClickSlot);
      if (inv) inv.addEventListener("click", onClickSlot);
      if (put) put.addEventListener("click", placeBlock);
      if (trade) trade.addEventListener("click", onClickTrade);
      if (tradeClose) tradeClose.addEventListener("click", () => {
        tradeOpen = null;
        renderTrade();
      });
    } else {
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("contextmenu", prevent);
      if (hot) hot.removeEventListener("click", onClickSlot);
      if (inv) inv.removeEventListener("click", onClickSlot);
      if (put) put.removeEventListener("click", placeBlock);
      if (trade) trade.removeEventListener("click", onClickTrade);
      if (tradeClose) tradeClose.removeEventListener("click", () => {});
      mineHeld = false;
      clearTapPadTimer();
      lookDrag = null;
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
    tradeOpen = null;
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
    tradeOpen = null;
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
