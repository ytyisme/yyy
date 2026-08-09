(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayMsg = document.getElementById("overlay-msg");
  const startBtn = document.getElementById("start-btn");
  const levelLabel = document.getElementById("level-label");
  const starLabel = document.getElementById("star-label");
  const statusLabel = document.getElementById("status-label");
  const puzzleTools = document.getElementById("puzzle-tools");
  const fakeButtons = [...puzzleTools.querySelectorAll(".fake-btn")];
  const nameForm = document.getElementById("name-form");
  const nameInput = document.getElementById("player-name-input");
  const overlayHint = document.getElementById("overlay-hint");
  const homeBtn = document.getElementById("home-btn");
  const levelSelect = document.getElementById("level-select");
  const levelGrid = document.getElementById("level-grid");
  const levelTip = document.getElementById("level-tip");
  const logoutBtn = document.getElementById("logout-btn");
  const loginScreen = document.getElementById("login-screen");
  const loginUser = document.getElementById("login-user");
  const loginPass = document.getElementById("login-pass");
  const loginPhone = document.getElementById("login-phone");
  const loginSms = document.getElementById("login-sms");
  const loginIdcard = document.getElementById("login-idcard");
  const loginError = document.getElementById("login-error");
  const loginSubmit = document.getElementById("login-submit");
  const smsBtn = document.getElementById("sms-btn");
  const minorNotice = document.getElementById("minor-notice");
  const minorOk = document.getElementById("minor-ok");
  const loginTabs = [...document.querySelectorAll(".login-tab")];
  const loginPaneAccount = document.getElementById("login-pane-account");
  const loginPanePhone = document.getElementById("login-pane-phone");
  const loginPaneIdcard = document.getElementById("login-pane-idcard");

  const W = canvas.width;
  const H = canvas.height;
  const GRAVITY = 0.55;
  const JUMP = -11.2;
  const MOVE = 4.2;
  const ZOMBIE_COUNT = 5;
  const LAVA_Y = H - 52;

  const keys = new Set();
  let state = "login"; // login | select | menu | naming | playing | dead | win
  let level = 1;
  let stars = 0;
  let playerName = "";
  let loggedIn = false;
  const TOTAL_LEVELS = 35;
  const MAX_PLAYABLE = 9; // current content ends at level 9
  let cameraX = 0;
  let worldMin = 0;
  let worldWidth = 3200;
  let reverseGoal = false;
  let fakeLava = false;
  let spawnX = 80;
  let puzzleMode = false;
  let pitStart = 0;
  let pitWidth = 0;
  let bridgePieceW = 92;
  let bridgeY = 380;
  let platforms = [];
  let player = null;
  let zombies = [];
  let star = null;
  let endSign = null;
  let comingSoon = null;
  let homeMode = false;
  let spikes = [];
  let maces = [];
  let rockets = [];
  let belly = { items: [], revealed: false };
  let eatAnim = null;
  let backpack = { spikes: 0, zombiesKilled: 0, maces: 0, revealed: false };
  let crate = null;
  let potion = null;
  let speedBoost = 0;
  let particles = [];
  let shake = 0;
  let time = 0;
  let lastTs = 0;

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function pushZombie(opts) {
    zombies.push({
      w: 30,
      h: 38,
      vx: 0,
      vy: 0,
      onGround: false,
      bob: rand(0, Math.PI * 2),
      pounceCd: 0,
      preferRoof: false,
      mode: "behind",
      ...opts,
    });
  }

  function makeLevel(n) {
    platforms = [];
    zombies = [];
    reverseGoal = false;
    fakeLava = false;
    puzzleMode = false;
    pitStart = 0;
    pitWidth = 0;
    worldMin = 0;
    crate = null;
    potion = null;
    speedBoost = 0;
    endSign = null;
    comingSoon = null;
    homeMode = false;
    spikes = [];
    maces = [];
    rockets = [];
    belly = { items: [], revealed: false };
    eatAnim = null;
    backpack = { spikes: 0, zombiesKilled: 0, maces: 0, revealed: false };
    const startY = 380;
    const roofY = 150;

    if (n === 2) {
      // Trick: star is just off-screen to the left. Right side is endless parkour.
      reverseGoal = true;
      const zombieN = 20;
      spawnX = 400;
      const startPlatW = 520;

      // Visible start ledge — left edge sits at screen edge, secret is barely past it
      platforms.push({ x: 0, y: startY, w: startPlatW, h: 28, lane: "ground" });
      platforms.push({ x: 0, y: roofY, w: startPlatW + 40, h: 24, lane: "roof" });

      // Tiny hidden ledge + star, just outside the left of the screen
      // Almost connected to the start — walk left a little and you're there
      const secretX = -100;
      platforms.push({ x: secretX, y: startY, w: 100, h: 28, lane: "ground" });
      worldMin = secretX - 40;

      star = {
        x: secretX + 40,
        y: startY - 70,
        r: 18,
        collected: false,
        pulse: 0,
      };

      // Seed a chunk of forward parkour; more is generated as you run right
      let rx = startPlatW;
      let ry = startY;
      for (let i = 0; i < 10; i++) {
        const gap = 65 + rand(15, 45);
        const w = rand(85, 150);
        rx += gap;
        ry = clamp(ry + rand(-50, 50), 280, 420);
        platforms.push({ x: rx, y: ry, w, h: 28, lane: "ground" });
        platforms.push({
          x: rx - rand(8, 30),
          y: roofY + rand(-8, 16),
          w: w + rand(30, 90),
          h: 22,
          lane: "roof",
        });
        if (i % 2 === 1) {
          platforms.push({
            x: rx + w * 0.25,
            y: clamp(ry - 90, 200, 300),
            w: rand(55, 85),
            h: 22,
            lane: "mid",
          });
        }
        rx += w;
      }
      worldWidth = rx + 800;

      player = {
        x: spawnX,
        y: startY - 40,
        w: 28,
        h: 40,
        vx: 0,
        vy: 0,
        onGround: false,
        facing: 1,
        alive: true,
      };

      for (let i = 0; i < zombieN; i++) {
        pushZombie({
          x: 260 + (i % 10) * 48 + Math.floor(i / 10) * 90,
          y: roofY - 38 - (i % 3) * 2,
          speed: 2.4 + (i % 5) * 0.12,
          delayed: 0.15 + (i % 8) * 0.12,
          mode: "above",
          pounceCd: 0.4 + (i % 7) * 0.18,
          preferRoof: true,
        });
      }
    } else if (n === 3) {
      // Flat walk → giant pit. No zombies. Bridge with draggable fake UI buttons.
      puzzleMode = true;
      reverseGoal = false;
      spawnX = 80;
      const startY = 380;
      bridgeY = startY;
      bridgePieceW = 92;
      pitWidth = bridgePieceW * 3; // exactly three buttons
      const approach = 1080; // long flat road, no bumps/pits
      pitStart = approach;

      platforms.push({ x: 0, y: startY, w: approach, h: 28, lane: "ground" });

      const rightX = pitStart + pitWidth;
      platforms.push({ x: rightX, y: startY, w: 360, h: 28, lane: "ground" });
      worldWidth = rightX + 420;
      worldMin = 0;

      player = {
        x: spawnX,
        y: startY - 40,
        w: 28,
        h: 40,
        vx: 0,
        vy: 0,
        onGround: false,
        facing: 1,
        alive: true,
      };

      // no zombies

      star = {
        x: rightX + 140,
        y: startY - 70,
        r: 18,
        collected: false,
        pulse: 0,
      };
    } else if (n === 4) {
      // Flat sprint: huge zombie behind, speed potion in a crate, star at the end
      reverseGoal = false;
      spawnX = 220;
      const roadLen = 2600;
      platforms.push({ x: 0, y: startY, w: roadLen, h: 28, lane: "ground" });
      worldWidth = roadLen + 120;
      worldMin = 0;

      player = {
        x: spawnX,
        y: startY - 40,
        w: 28,
        h: 40,
        vx: 0,
        vy: 0,
        onGround: false,
        facing: 1,
        alive: true,
      };

      // One giant zombie behind you — slightly faster than normal run
      pushZombie({
        x: spawnX - 220,
        y: startY - 78,
        w: 64,
        h: 78,
        speed: 4.55,
        delayed: 1.1,
        mode: "behind",
        big: true,
      });

      crate = {
        x: spawnX + 48,
        y: startY - 36,
        w: 36,
        h: 36,
        open: false,
      };

      potion = null;
      speedBoost = 0;

      star = {
        x: roadLen - 160,
        y: startY - 70,
        r: 18,
        collected: false,
        pulse: 0,
      };
    } else if (n === 5) {
      // Simple parkour + 5 zombies. Ending is a lie — click 五角星 in the text.
      reverseGoal = false;
      spawnX = 80;
      let x = 40;
      let y = startY;
      platforms.push({ x, y, w: 240, h: 28, lane: "ground" });
      x += 240;

      for (let i = 0; i < 12; i++) {
        const gap = 55 + rand(10, 35);
        const w = rand(100, 160);
        x += gap;
        y = clamp(y + rand(-45, 45), 280, 410);
        platforms.push({ x, y, w, h: 28, lane: "ground" });
        x += w;
      }

      const endX = x + 60;
      platforms.push({ x: endX, y: 340, w: 420, h: 28, lane: "ground" });
      worldWidth = endX + 480;
      worldMin = 0;

      player = {
        x: spawnX,
        y: startY - 40,
        w: 28,
        h: 40,
        vx: 0,
        vy: 0,
        onGround: false,
        facing: 1,
        alive: true,
      };

      for (let i = 0; i < 5; i++) {
        pushZombie({
          x: -50 - i * 60,
          y: startY - 38,
          speed: 2.35 + i * 0.08,
          delayed: 0.7 + i * 0.3,
          mode: "behind",
        });
      }

      // No real star — only a misleading sentence at the finish
      star = null;
      endSign = {
        x: endX + 90,
        y: 290,
        pulse: 0,
        hit: null,
      };
    } else if (n === 6) {
      // Flat road with spike gaps + fake zombie chasing from ABOVE
      reverseGoal = false;
      homeMode = true;
      spawnX = 100;
      const roadLen = 2200;
      const roofY6 = 150;
      platforms.push({ x: 0, y: startY, w: roadLen, h: 28, lane: "ground" });
      // Upper chase path for the fake zombie
      for (let rx = -40; rx < roadLen; rx += 160) {
        platforms.push({
          x: rx,
          y: roofY6 + (rx / 160) % 2 === 0 ? 0 : 8,
          w: 190,
          h: 22,
          lane: "roof",
        });
      }
      worldWidth = roadLen + 80;
      worldMin = 0;

      player = {
        x: spawnX,
        y: startY - 40,
        w: 28,
        h: 40,
        vx: 0,
        vy: 0,
        onGround: false,
        facing: 1,
        alive: true,
      };

      // Spikes with walkable gaps between them
      spikes = [];
      let sx = 280;
      while (sx < roadLen - 420) {
        const spikeW = 22;
        const gapW = 48; // enough to stand / land in the gap
        spikes.push({
          x: sx,
          y: startY - 18,
          w: spikeW,
          h: 18,
        });
        sx += spikeW + gapW;
        if (Math.random() < 0.22) sx += 40;
      }

      // 20 fake zombies chase from above — scary, but harmless on touch; click to kill
      for (let i = 0; i < 20; i++) {
        pushZombie({
          x: 40 + (i % 10) * 70 + Math.floor(i / 10) * 35,
          y: roofY6 - 38 - (i % 4) * 2,
          speed: 3.5 + (i % 5) * 0.12,
          delayed: 0.25 + (i % 8) * 0.12,
          mode: "above",
          preferRoof: true,
          pounceCd: 0.4 + (i % 6) * 0.15,
          fake: true,
        });
      }

      star = {
        x: roadLen - 200,
        y: startY - 70,
        r: 18,
        collected: false,
        pulse: 0,
      };
      comingSoon = null;
    } else if (n === 7) {
      // Flat road with 5 rotating spiked maces — secretly dismantleable
      reverseGoal = false;
      homeMode = true;
      spawnX = 100;
      const roadLen = 2000;
      platforms.push({ x: 0, y: startY, w: roadLen, h: 28, lane: "ground" });
      worldWidth = roadLen + 80;
      worldMin = 0;

      player = {
        x: spawnX,
        y: startY - 40,
        w: 28,
        h: 40,
        vx: 0,
        vy: 0,
        onGround: false,
        facing: 1,
        alive: true,
      };

      maces = [];
      const base = 380;
      const spacing = 300;
      for (let i = 0; i < 5; i++) {
        maces.push({
          x: base + i * spacing,
          y: startY - 8,
          len: 168, // large sweep — blocks the road unless dismantled
          angle: (i * Math.PI * 2) / 5,
          spin: 0.028 + i * 0.004,
          ballR: 48,
          shaftW: 22,
        });
      }

      star = {
        x: roadLen - 180,
        y: startY - 70,
        r: 18,
        collected: false,
        pulse: 0,
      };
    } else if (n === 8) {
      // City flat road: star ahead blocked by a huge rocket; click rockets to eat them
      reverseGoal = false;
      homeMode = true;
      spawnX = 80;
      const roadLen = 1200;
      platforms.push({ x: 0, y: startY, w: roadLen, h: 28, lane: "ground" });
      worldWidth = roadLen + 80;
      worldMin = 0;

      player = {
        x: spawnX,
        y: startY - 40,
        w: 28,
        h: 40,
        vx: 0,
        vy: 0,
        onGround: false,
        facing: 1,
        alive: true,
      };

      // 5 rockets — all block the road until eaten; the last is huge
      rockets = [
        { x: 220, y: startY - 90, w: 36, h: 90, big: false, eaten: false, block: true },
        { x: 380, y: startY - 100, w: 40, h: 100, big: false, eaten: false, block: true },
        { x: 540, y: startY - 95, w: 38, h: 95, big: false, eaten: false, block: true },
        { x: 700, y: startY - 110, w: 44, h: 110, big: false, eaten: false, block: true },
        {
          x: 860,
          y: startY - 230,
          w: 110,
          h: 230,
          big: true,
          eaten: false,
          block: true,
        },
      ];

      star = {
        x: 1020,
        y: startY - 70,
        r: 18,
        collected: false,
        pulse: 0,
      };
    } else if (n === 9) {
      // Flat road that breaks — fake lava below, secret path under it (off-screen ahead)
      reverseGoal = false;
      fakeLava = true;
      homeMode = true;
      spawnX = 100;
      const roadEnd = 680;
      platforms.push({ x: 0, y: startY, w: roadEnd, h: 28, lane: "ground" });

      // Landing just under the break, then a long flat secret road to the right (star off-screen)
      const underY = 518;
      let ux = roadEnd - 40;
      platforms.push({ x: ux, y: underY, w: 200, h: 22, lane: "secret" });
      ux += 200;
      for (let i = 0; i < 18; i++) {
        ux += 28;
        platforms.push({ x: ux, y: underY, w: 160, h: 22, lane: "secret" });
        ux += 160;
      }
      const starX = ux + 120;
      platforms.push({ x: starX - 40, y: underY, w: 300, h: 22, lane: "secret" });
      worldWidth = starX + 400;
      worldMin = 0;

      player = {
        x: spawnX,
        y: startY - 40,
        w: 28,
        h: 40,
        vx: 0,
        vy: 0,
        onGround: false,
        facing: 1,
        alive: true,
      };

      // no zombies
      star = {
        x: starX + 80,
        y: underY - 48,
        r: 18,
        collected: false,
        pulse: 0,
      };
    } else {
      const aboveHunt = n > 9;
      const gapBase = aboveHunt ? 70 + n * 10 : 48 + n * 8;
      const jumpLen = 90 + Math.min(40, n * 4);
      let x = 40;
      spawnX = 80;
      platforms.push({ x, y: startY, w: 220, h: 28, lane: "ground" });
      if (aboveHunt) {
        platforms.push({ x: 20, y: roofY, w: 280, h: 24, lane: "roof" });
      }
      x += 220;

      const segments = 14 + n * 2;
      let y = startY;
      for (let i = 0; i < segments; i++) {
        const gap = gapBase + rand(0, 30 + n * 4);
        x += gap;
        const rise = rand(aboveHunt ? -55 : -70, aboveHunt ? 55 : 70);
        y = clamp(y + rise, aboveHunt ? 280 : 220, 420);
        const w = rand(90, 160 + Math.max(0, 40 - n * 3));
        platforms.push({ x, y, w, h: 28, lane: "ground" });

        if (aboveHunt) {
          const rw = w + rand(40, 100);
          const rx = x - rand(10, 40);
          platforms.push({
            x: rx,
            y: roofY + rand(-8, 18),
            w: rw,
            h: 22,
            lane: "roof",
          });
          if (i % 3 === 1) {
            platforms.push({
              x: x + w * 0.3,
              y: clamp(y - 95, 200, 300),
              w: rand(60, 90),
              h: 22,
              lane: "mid",
            });
          }
        } else if (Math.random() < 0.35 && i < segments - 2) {
          const midX = x + w * 0.5 + rand(20, jumpLen);
          const midY = clamp(y - rand(40, 90), 180, 400);
          platforms.push({ x: midX, y: midY, w: rand(70, 110), h: 24, lane: "mid" });
        }
        x += w;
      }

      const endX = x + 80;
      platforms.push({ x: endX, y: 340, w: 260, h: 28, lane: "ground" });
      if (aboveHunt) {
        platforms.push({ x: endX - 40, y: roofY, w: 300, h: 24, lane: "roof" });
      }
      worldWidth = endX + 320;

      player = {
        x: spawnX,
        y: startY - 40,
        w: 28,
        h: 40,
        vx: 0,
        vy: 0,
        onGround: false,
        facing: 1,
        alive: true,
      };

      for (let i = 0; i < ZOMBIE_COUNT; i++) {
        if (aboveHunt) {
          pushZombie({
            x: 60 + i * 70,
            y: roofY - 38,
            speed: 2.8 + n * 0.22 + i * 0.1,
            delayed: 0.35 + i * 0.22,
            mode: "above",
            pounceCd: 0.8 + i * 0.25,
            preferRoof: true,
          });
        } else {
          pushZombie({
            x: -40 - i * 55,
            y: startY - 38,
            speed: 2.1 + n * 0.18 + i * 0.08,
            delayed: 0.6 + i * 0.35,
            mode: "behind",
          });
        }
      }

      star = {
        x: endX + 110,
        y: 340 - 70,
        r: 18,
        collected: false,
        pulse: 0,
      };
    }

    particles = [];
    cameraX = 0;
    shake = 0;
  }

  function extendEndlessParkour() {
    if (!reverseGoal || !player) return;
    // Keep generating bricks ahead so the right path never ends
    while (worldWidth - player.x < 1400) {
      const roofY = 150;
      let lastGround = null;
      for (let i = platforms.length - 1; i >= 0; i--) {
        if (platforms[i].lane === "ground") {
          lastGround = platforms[i];
          break;
        }
      }
      if (!lastGround) break;
      const gap = 65 + rand(15, 50);
      const w = rand(80, 150);
      const x = lastGround.x + lastGround.w + gap;
      const y = clamp(lastGround.y + rand(-55, 55), 280, 420);
      platforms.push({ x, y, w, h: 28, lane: "ground" });
      platforms.push({
        x: x - rand(8, 30),
        y: roofY + rand(-8, 16),
        w: w + rand(30, 90),
        h: 22,
        lane: "roof",
      });
      if (Math.random() < 0.45) {
        platforms.push({
          x: x + w * 0.2,
          y: clamp(y - 90, 200, 300),
          w: rand(55, 85),
          h: 22,
          lane: "mid",
        });
      }
      worldWidth = x + w + 900;
    }
  }

  function spawnBurst(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x,
        y,
        vx: rand(-3, 3),
        vy: rand(-5, -1),
        life: rand(0.4, 0.9),
        max: 1,
        color,
        size: rand(2, 5),
      });
    }
  }

  function solidAt(body, dx, dy) {
    const box = { x: body.x + dx, y: body.y + dy, w: body.w, h: body.h };
    for (const p of platforms) {
      if (rectsOverlap(box, p)) return p;
    }
    return null;
  }

  function findRoofAhead(actor, dir) {
    const probeX = actor.x + actor.w / 2 + dir * 40;
    let best = null;
    for (const p of platforms) {
      if (p.lane !== "roof" && p.lane !== "mid") continue;
      if (probeX >= p.x - 10 && probeX <= p.x + p.w + 10) {
        if (!best || p.y < best.y) best = p;
      }
    }
    return best;
  }

  function moveActor(actor, ax, wantsJump, chaseTarget) {
    if (actor.delayed && actor.delayed > 0) {
      actor.delayed -= 1 / 60;
      return;
    }

    if (chaseTarget) {
      const dx = chaseTarget.x - actor.x;
      const aboveMode = actor.mode === "above";

      if (Math.abs(dx) > 4) {
        actor.vx = Math.sign(dx) * actor.speed;
        actor.facing = Math.sign(dx);
      } else {
        actor.vx = 0;
      }

      if (aboveMode) {
        if (actor.pounceCd > 0) actor.pounceCd -= 1 / 60;

        const aligned = Math.abs(dx) < 55;
        const higher = actor.y + actor.h < chaseTarget.y - 10;
        // Drop-pounce when hovering above the player
        if (aligned && higher && actor.pounceCd <= 0 && actor.onGround) {
          actor.vy = 2.5;
          actor.onGround = false;
          actor.preferRoof = false;
          actor.pounceCd = 2.2;
          spawnBurst(actor.x + actor.w / 2, actor.y + actor.h, "#6aaa4a", 8);
        }

        // After pouncing / falling, climb back to roof when possible
        if (actor.onGround && !actor.preferRoof && actor.y > 210) {
          actor.preferRoof = true;
          actor.pounceCd = Math.max(actor.pounceCd, 0.9);
        }

        if (actor.onGround) {
          const dir = actor.facing || 1;
          const roof = findRoofAhead(actor, dir);
          const under = solidAt(actor, actor.vx * 10, 2);
          if (!under) {
            // Leap along upper path
            actor.vy = JUMP * 0.88;
            actor.onGround = false;
          } else if (actor.preferRoof && roof && roof.y + 8 < actor.y + actor.h - 6) {
            actor.vy = JUMP * 1.05;
            actor.onGround = false;
          } else if (
            actor.preferRoof &&
            under.lane === "ground" &&
            Math.abs(dx) > 30
          ) {
            // Stuck on ground lane — jump toward roof height
            actor.vy = JUMP * 1.1;
            actor.onGround = false;
          }
        }
      } else if (actor.onGround) {
        const ahead = actor.x + actor.w + 18;
        const footY = actor.y + actor.h + 2;
        let land = null;
        for (const p of platforms) {
          if (p.x <= ahead && p.x + p.w >= ahead - 10 && Math.abs(p.y - footY) < 120) {
            land = p;
            break;
          }
        }
        const under = solidAt(actor, actor.vx * 8, 2);
        if (!under || (land && land.y + 8 < actor.y + actor.h)) {
          actor.vy = JUMP * 0.92;
          actor.onGround = false;
        }
      }
    } else {
      actor.vx = ax * MOVE * (speedBoost > 0 ? 1.85 : 1);
      if (ax) actor.facing = ax;
      if (wantsJump && actor.onGround) {
        actor.vy = JUMP;
        actor.onGround = false;
        spawnBurst(actor.x + actor.w / 2, actor.y + actor.h, "#ffd27a", 6);
        if (window.GameAudio) GameAudio.playJump();
      }
    }

    actor.vy += GRAVITY;
    actor.vy = Math.min(actor.vy, 16);

    // Horizontal
    actor.x += actor.vx;
    const hitX = solidAt(actor, 0, 0);
    if (hitX) {
      if (actor.vx > 0) actor.x = hitX.x - actor.w;
      else if (actor.vx < 0) actor.x = hitX.x + hitX.w;
      actor.vx = 0;
    }

    // Vertical
    actor.y += actor.vy;
    actor.onGround = false;
    const hitY = solidAt(actor, 0, 0);
    if (hitY) {
      if (actor.vy > 0) {
        actor.y = hitY.y - actor.h;
        actor.vy = 0;
        actor.onGround = true;
      } else if (actor.vy < 0) {
        actor.y = hitY.y + hitY.h;
        actor.vy = 0;
      }
    }

    if (actor.y + actor.h > LAVA_Y) {
      if (fakeLava) {
        // Fake magma — fall through onto the secret path
        if (actor.y > H + 120) {
          actor.alive = false;
        }
      } else {
        actor.alive = false;
        actor.y = LAVA_Y - actor.h;
      }
    }
  }

  function update(dt) {
    time += dt;
    if (state !== "playing") {
      updateParticles(dt);
      if (window.GameAudio) GameAudio.stopAllAmbience();
      return;
    }

    const left = keys.has("ArrowLeft") || keys.has("a") || keys.has("A");
    const right = keys.has("ArrowRight") || keys.has("d") || keys.has("D");
    const jump =
      keys.has(" ") || keys.has("ArrowUp") || keys.has("w") || keys.has("W");
    let ax = (right ? 1 : 0) - (left ? 1 : 0);

    // Eating animation locks player movement
    if (eatAnim) {
      ax = 0;
      updateEatAnim(dt);
    }

    moveActor(player, eatAnim ? 0 : ax, eatAnim ? false : jump, null);
    extendEndlessParkour();

    if (speedBoost > 0) {
      speedBoost -= dt;
      if (Math.random() < 0.45) {
        spawnBurst(
          player.x + player.w / 2,
          player.y + player.h - 4,
          "#5ce1ff",
          2
        );
      }
    }

    // Crate + speed potion (level 4)
    if (crate && !crate.open && rectsOverlap(player, crate)) {
      crate.open = true;
      potion = {
        x: crate.x + 6,
        y: crate.y - 28,
        w: 22,
        h: 28,
        bob: 0,
      };
      spawnBurst(crate.x + crate.w / 2, crate.y, "#d4a574", 12);
      statusLabel.textContent = "开箱！";
    }
    if (potion && rectsOverlap(player, potion)) {
      potion = null;
      speedBoost = 7.5;
      spawnBurst(player.x + player.w / 2, player.y + 10, "#5ce1ff", 20);
      statusLabel.textContent = "加速！";
    }
    if (potion) potion.bob += dt * 5;

    for (const z of zombies) {
      if (!z.alive && z.alive !== false) z.alive = true;
      moveActor(z, 0, false, player);
      z.bob += dt * 8;
      if (z.alive !== false && rectsOverlap(player, z)) {
        if (z.fake) {
          // Harmless scare zombie
          if (!z.scaredAt || time - z.scaredAt > 1.2) {
            z.scaredAt = time;
            shake = Math.max(shake, 6);
            statusLabel.textContent = "假的！虚惊一场";
            spawnBurst(z.x + z.w / 2, z.y + 10, "#9bbb6a", 8);
          }
        } else {
          die("zombie");
          return;
        }
      }
    }

    // Spikes
    for (const s of spikes) {
      const hit = {
        x: s.x + 2,
        y: s.y + 4,
        w: s.w - 4,
        h: s.h - 2,
      };
      if (rectsOverlap(player, hit)) {
        die("spike");
        return;
      }
    }

    // Rotating maces (level 7) — oversized; blocks path unless dismantled
    for (const m of maces) {
      m.angle += m.spin;
      if (hitByMace(player, m)) {
        die("mace");
        return;
      }
    }

    // All uneaten rockets block the path (level 8)
    for (const r of rockets) {
      if (r.eaten || r.eating) continue;
      if (rectsOverlap(player, r)) {
        if (player.x + player.w / 2 < r.x + r.w / 2) {
          player.x = r.x - player.w;
        } else {
          player.x = r.x + r.w;
        }
        player.vx = 0;
      }
    }

    if (player.alive === false) {
      die("lava");
      return;
    }

    // Star collect (normal levels only)
    if (star) {
      const starBox = {
        x: star.x - star.r,
        y: star.y - star.r,
        w: star.r * 2,
        h: star.r * 2,
      };
      star.pulse += dt * 4;
      if (!star.collected && rectsOverlap(player, starBox)) {
        star.collected = true;
        stars += 1;
        starLabel.textContent = String(stars);
        spawnBurst(star.x, star.y, "#ffe566", 28);
        spawnBurst(star.x, star.y, "#ff9a2a", 16);
        shake = 10;
        winLevel();
        return;
      }
    }
    if (endSign) endSign.pulse += dt * 3;
    if (comingSoon) comingSoon.pulse += dt * 2;

    cameraX = clamp(
      player.x - W * 0.35,
      worldMin,
      Math.max(worldMin, worldWidth - W)
    );
    if (shake > 0) shake *= 0.88;
    updateParticles(dt);

    if (window.GameAudio) {
      const running =
        player &&
        player.onGround &&
        Math.abs(player.vx) > 0.4 &&
        !eatAnim;
      GameAudio.updateGameplay(dt, {
        playing: true,
        city: level === 8,
        zombies: zombies.some((z) => z.alive !== false),
        running,
        fast: speedBoost > 0,
      });
    }
  }

  function updateParticles(dt) {
    for (const p of particles) {
      p.life -= dt;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 8 * dt;
    }
    particles = particles.filter((p) => p.life > 0);
  }

  function die(cause) {
    state = "dead";
    statusLabel.textContent = "失败";
    shake = 14;
    spawnBurst(player.x + player.w / 2, player.y + player.h / 2, "#ff5533", 20);
    if (window.GameAudio) {
      GameAudio.stopAllAmbience();
      GameAudio.playDeath();
    }
    syncPuzzleTools();
    syncHomeBtn();

    if (playerName) {
      let title;
      if (cause === "zombie") title = `${playerName}被僵尸吃掉了`;
      else if (cause === "spike") title = `${playerName}被尖刺扎死了`;
      else if (cause === "mace") title = `${playerName}被狼牙棒砸中了`;
      else title = `${playerName}烫死了`;
      showOverlay(title, `关卡 ${level} · 已收集 ${stars} 颗五角星`, "重生", {
        showName: false,
        hideHint: true,
      });
      return;
    }

    const reason =
      cause === "zombie"
        ? "僵尸抓住了你！"
        : cause === "spike"
          ? "踩到尖刺了！"
          : cause === "mace"
            ? "被旋转的狼牙棒砸中了！"
            : "掉进岩浆了！";
    showOverlay("游戏结束", `${reason}<br />关卡 ${level} · 已收集 ${stars} 颗五角星`, "再试一次");
  }

  function winLevel() {
    state = "win";
    statusLabel.textContent = "通关";
    if (window.GameAudio) {
      GameAudio.stopAllAmbience();
      GameAudio.playStar();
      setTimeout(() => GameAudio.playWin(), 280);
    }
    syncPuzzleTools();
    syncHomeBtn();

    if (level >= MAX_PLAYABLE) {
      showOverlay(
        "到达终点！",
        `第 ${level} 关完成！<br />第 9 关是目前的终点，后面作者还在做，敬请期待。`,
        "回主页",
        { hideHint: true }
      );
      return;
    }

    const next = level + 1;
    let warn = "";
    if (next === 2) {
      warn =
        `<br /><span style="color:#ffb347">警告：第 2 关有 20 只僵尸从上方追击……终点似乎不太对劲。</span>`;
    } else if (next === 3) {
      warn =
        `<br /><span style="color:#ffb347">第 3 关没有僵尸……但好像少了点什么。</span>`;
    } else if (next === 4) {
      warn =
        `<br /><span style="color:#ffb347">第 4 关：平路逃亡。身后有大僵尸——旁边的箱子也许能救命。</span>`;
    } else if (next === 5) {
      warn =
        `<br /><span style="color:#ffb347">第 5 关：简单跑酷。终点……好像有点不对劲？</span>`;
    } else if (next === 6) {
      warn =
        `<br /><span style="color:#ffb347">第 6 关：尖刺与假僵尸。终点有五角星。</span>`;
    } else if (next === 7) {
      warn =
        `<br /><span style="color:#ffb347">第 7 关：平路上有旋转的大狼牙棒。</span>`;
    } else if (next === 8) {
      warn =
        `<br /><span style="color:#ffb347">第 8 关：城市里，火箭挡住了五角星。</span>`;
    } else if (next === 9) {
      warn =
        `<br /><span style="color:#ffb347">第 9 关：路断了……岩浆下也许有秘密。这是目前终点。</span>`;
    }
    showOverlay(
      "获得五角星！",
      `第 ${level} 关完成！<br />发光的五角星已到手，准备冲击第 ${next} 关。${warn}`,
      "下一关"
    );
  }

  function showOverlay(title, msg, btn, opts = {}) {
    overlayTitle.textContent = title;
    overlayMsg.innerHTML = msg;
    startBtn.textContent = btn;
    const showName = !!opts.showName;
    nameForm.classList.toggle("hidden", !showName);
    if (overlayHint) {
      if (showName) {
        overlayHint.classList.remove("hidden");
        overlayHint.textContent = "名字会出现在你的头顶上";
      } else if (opts.hideHint) {
        overlayHint.classList.add("hidden");
      } else {
        overlayHint.classList.remove("hidden");
        overlayHint.textContent = "← → / A D 移动 · 空格 / W / ↑ 跳跃 · R 重开";
      }
    }
    overlay.classList.remove("hidden");
    syncPuzzleTools();
    if (showName) {
      nameInput.value = playerName || "";
      setTimeout(() => nameInput.focus(), 50);
    }
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
    nameForm.classList.add("hidden");
  }

  function syncPuzzleTools() {
    if (!puzzleTools) return;
    const show = puzzleMode && state === "playing";
    puzzleTools.classList.toggle("hidden", !show);
    puzzleTools.setAttribute("aria-hidden", show ? "false" : "true");
  }

  function syncHomeBtn() {
    if (!homeBtn) return;
    // Home button on every level (top-right) while playing
    const show = state === "playing";
    homeBtn.classList.toggle("hidden", !show);
  }

  function hideLevelSelect() {
    if (!levelSelect) return;
    levelSelect.classList.add("hidden");
    levelSelect.setAttribute("aria-hidden", "true");
    if (levelTip) {
      levelTip.classList.add("hidden");
      levelTip.textContent = "";
    }
  }

  function buildLevelGrid() {
    if (!levelGrid) return;
    levelGrid.innerHTML = "";
    for (let i = 1; i <= TOTAL_LEVELS; i++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "level-cell";
      btn.dataset.level = String(i);
      if (i < MAX_PLAYABLE) {
        btn.classList.add("playable");
        btn.innerHTML = `${i}`;
      } else if (i === MAX_PLAYABLE) {
        btn.classList.add("endpoint");
        btn.innerHTML = `${i}<span class="badge">终点</span>`;
      } else {
        btn.classList.add("locked");
        btn.innerHTML = `${i}<span class="badge">未开放</span>`;
      }
      btn.addEventListener("click", () => selectLevel(i));
      levelGrid.appendChild(btn);
    }
  }

  function showLevelSelect() {
    closeLoginScreen();
    hideOverlay();
    hideLevelSelect();
    buildLevelGrid();
    state = "select";
    statusLabel.textContent = "选关";
    levelSelect.classList.remove("hidden");
    levelSelect.setAttribute("aria-hidden", "false");
    syncPuzzleTools();
    syncHomeBtn();
  }

  function needsPlayerName(n) {
    // Level 4 introduces naming; levels 5–35 always require a name overhead
    return n === 4 || n >= 5;
  }

  function playUiClick() {
    if (window.GameAudio) GameAudio.playClick();
  }

  function selectLevel(n) {
    playUiClick();
    if (n > MAX_PLAYABLE) {
      levelTip.textContent = "后面作者还在做，敬请期待（第 9 关是目前终点）";
      levelTip.classList.remove("hidden");
      return;
    }
    levelTip.classList.add("hidden");
    hideLevelSelect();
    level = n;
    levelLabel.textContent = String(level);
    if (needsPlayerName(level) && !playerName) {
      showNamePrompt();
      return;
    }
    beginPlaying();
  }

  function openLoginScreen() {
    state = "login";
    loggedIn = false;
    statusLabel.textContent = "登录";
    syncPuzzleTools();
    syncHomeBtn();
    hideOverlay();
    hideLevelSelect();
    loginError.classList.add("hidden");
    minorNotice.classList.add("hidden");
    loginSubmit.classList.remove("hidden");
    loginUser.value = "";
    loginPass.value = "";
    loginPhone.value = "";
    loginSms.value = "";
    loginIdcard.value = "";
    mockSmsCode = "";
    setLoginMode("account");
    loginScreen.classList.remove("hidden");
    loginScreen.setAttribute("aria-hidden", "false");
    setTimeout(() => loginUser.focus(), 50);
  }

  function closeLoginScreen() {
    loginScreen.classList.add("hidden");
    loginScreen.setAttribute("aria-hidden", "true");
  }

  function goHome() {
    if (loggedIn) showLevelSelect();
    else openLoginScreen();
  }

  function returnToHomeMenu() {
    loggedIn = true;
    closeLoginScreen();
    // Keep collected stars; reset only on logout
    statusLabel.textContent = "选关";
    homeMode = false;
    puzzleMode = false;
    makeLevel(1);
    resetPuzzleButtons();
    syncPuzzleTools();
    syncHomeBtn();
    showLevelSelect();
  }

  let loginMode = "account";
  let mockSmsCode = "";
  let smsCooldown = 0;
  let smsTimer = null;

  function setLoginMode(mode) {
    loginMode = mode;
    for (const tab of loginTabs) {
      tab.classList.toggle("active", tab.dataset.mode === mode);
    }
    loginPaneAccount.classList.toggle("hidden", mode !== "account");
    loginPanePhone.classList.toggle("hidden", mode !== "phone");
    loginPaneIdcard.classList.toggle("hidden", mode !== "idcard");
    loginError.classList.add("hidden");
    minorNotice.classList.add("hidden");
    loginSubmit.classList.remove("hidden");
  }

  function showLoginError(msg) {
    loginError.textContent = msg;
    loginError.classList.remove("hidden");
  }

  function parseIdAge(id) {
    const s = String(id).trim().toUpperCase();
    let birth = null;
    if (/^\d{17}[\dX]$/.test(s)) {
      birth = s.slice(6, 14); // YYYYMMDD
    } else if (/^\d{15}$/.test(s)) {
      birth = `19${s.slice(6, 12)}`;
    } else {
      return null;
    }
    const y = Number(birth.slice(0, 4));
    const m = Number(birth.slice(4, 6));
    const d = Number(birth.slice(6, 8));
    if (!y || m < 1 || m > 12 || d < 1 || d > 31) return null;
    const birthday = new Date(y, m - 1, d);
    if (Number.isNaN(birthday.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - y;
    const md = now.getMonth() + 1 - m;
    if (md < 0 || (md === 0 && now.getDate() < d)) age -= 1;
    return age;
  }

  function showMinorNotice() {
    minorNotice.classList.remove("hidden");
    loginSubmit.classList.add("hidden");
    loginError.classList.add("hidden");
    statusLabel.textContent = "防沉迷";
  }

  function sendSmsCode() {
    const phone = (loginPhone.value || "").trim();
    if (!/^1\d{10}$/.test(phone)) {
      showLoginError("请输入正确的 11 位手机号");
      return;
    }
    if (smsCooldown > 0) return;
    mockSmsCode = String(Math.floor(100000 + Math.random() * 900000));
    showLoginError(`验证码已发送（演示码：${mockSmsCode}）`);
    loginError.style.color = "#7dffb0";
    smsCooldown = 60;
    smsBtn.disabled = true;
    smsBtn.textContent = `${smsCooldown}s`;
    clearInterval(smsTimer);
    smsTimer = setInterval(() => {
      smsCooldown -= 1;
      if (smsCooldown <= 0) {
        clearInterval(smsTimer);
        smsBtn.disabled = false;
        smsBtn.textContent = "获取验证码";
      } else {
        smsBtn.textContent = `${smsCooldown}s`;
      }
    }, 1000);
  }

  function submitLogin() {
    loginError.style.color = "#ff7a5c";
    if (loginMode === "account") {
      const user = (loginUser.value || "").trim();
      const pass = loginPass.value || "";
      if (!user || !pass) {
        showLoginError("请输入账号和密码");
        return;
      }
      returnToHomeMenu();
      return;
    }

    if (loginMode === "phone") {
      const phone = (loginPhone.value || "").trim();
      const code = (loginSms.value || "").trim();
      if (!/^1\d{10}$/.test(phone)) {
        showLoginError("请输入正确的 11 位手机号");
        return;
      }
      if (!mockSmsCode) {
        showLoginError("请先获取验证码");
        return;
      }
      if (code !== mockSmsCode) {
        showLoginError("验证码错误");
        return;
      }
      returnToHomeMenu();
      return;
    }

    if (loginMode === "idcard") {
      const id = (loginIdcard.value || "").trim().toUpperCase();
      if (!/^\d{17}[\dX]$/.test(id) && !/^\d{15}$/.test(id)) {
        showLoginError("请输入正确的身份证号码");
        return;
      }
      const age = parseIdAge(id);
      if (age == null) {
        showLoginError("身份证号码无效");
        return;
      }
      if (age < 18) {
        showMinorNotice();
        return;
      }
      returnToHomeMenu();
    }
  }

  function resetPuzzleButtons() {
    for (const btn of fakeButtons) {
      btn.classList.remove("used", "dragging", "locked");
      btn.style.transform = "";
      btn.style.left = "";
      btn.style.top = "";
      btn.style.position = "";
      btn.style.width = "";
      btn.style.zIndex = "";
    }
  }

  function canvasScale() {
    const rect = canvas.getBoundingClientRect();
    return {
      rect,
      sx: rect.width / W,
      sy: rect.height / H,
    };
  }

  function clientToWorld(clientX, clientY) {
    const { rect, sx, sy } = canvasScale();
    return {
      x: (clientX - rect.left) / sx + cameraX,
      y: (clientY - rect.top) / sy,
    };
  }

  function placeBridgeButton(btn, clientX, clientY) {
    const world = clientToWorld(clientX, clientY);
    const label = btn.dataset.label || "砖";
    // Snap onto the pit height; length of three pieces exactly fills the gap
    let x = world.x - bridgePieceW / 2;
    const y = bridgeY;

    // Magnetic snap into the three ordered slots across the pit
    const slots = [0, 1, 2].map((i) => pitStart + i * bridgePieceW);
    const taken = new Set(
      platforms.filter((p) => p.lane === "bridge").map((p) => Math.round(p.x))
    );
    let best = null;
    let bestDist = Infinity;
    for (const slot of slots) {
      if (taken.has(Math.round(slot))) continue;
      const d = Math.abs(x - slot);
      if (d < bestDist) {
        bestDist = d;
        best = slot;
      }
    }
    // Also allow free-ish placement if dropped near the pit band
    const nearPit =
      world.x > pitStart - 80 &&
      world.x < pitStart + pitWidth + 80 &&
      world.y > bridgeY - 120 &&
      world.y < bridgeY + 80;

    if (!nearPit || best == null) {
      // Bounce back — not a valid build spot
      return false;
    }

    x = best;
    platforms.push({
      x,
      y,
      w: bridgePieceW,
      h: 28,
      lane: "bridge",
      label,
    });
    spawnBurst(x + bridgePieceW / 2, y, "#ffd24a", 10);
    btn.classList.add("used");
    statusLabel.textContent = "搭路中";
    return true;
  }

  function setupPuzzleDrag() {
    let drag = null;

    for (const btn of fakeButtons) {
      // Never activate as real UI — click does nothing useful
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
      });

      btn.addEventListener("pointerdown", (e) => {
        if (state !== "playing" || !puzzleMode || btn.classList.contains("used")) return;
        e.preventDefault();
        btn.setPointerCapture(e.pointerId);
        const rect = btn.getBoundingClientRect();
        drag = {
          btn,
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          moved: false,
          offsetX: e.clientX - rect.left,
          offsetY: e.clientY - rect.top,
        };
        btn.classList.add("dragging");
        btn.style.position = "fixed";
        btn.style.left = `${rect.left}px`;
        btn.style.top = `${rect.top}px`;
        btn.style.width = `${rect.width}px`;
        btn.style.zIndex = "30";
      });
    }

    window.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.pointerId) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (Math.hypot(dx, dy) > 6) drag.moved = true;
      drag.btn.style.left = `${e.clientX - drag.offsetX}px`;
      drag.btn.style.top = `${e.clientY - drag.offsetY}px`;
    });

    window.addEventListener("pointerup", (e) => {
      if (!drag || e.pointerId !== drag.pointerId) return;
      const { btn, moved } = drag;
      btn.classList.remove("dragging");
      try {
        btn.releasePointerCapture(e.pointerId);
      } catch (_) {}

      btn.style.position = "";
      btn.style.left = "";
      btn.style.top = "";
      btn.style.width = "";
      btn.style.zIndex = "";

      if (!moved) {
        btn.classList.remove("locked");
        void btn.offsetWidth;
        btn.classList.add("locked");
        statusLabel.textContent = "打不开…";
        setTimeout(() => btn.classList.remove("locked"), 400);
        drag = null;
        return;
      }

      const ok = placeBridgeButton(btn, e.clientX, e.clientY);
      if (!ok) statusLabel.textContent = "拖到坑上才能搭路";
      drag = null;
    });
  }

  function beginPlaying() {
    levelLabel.textContent = String(level);
    statusLabel.textContent = "逃亡中";
    makeLevel(level);
    resetPuzzleButtons();
    state = "playing";
    hideOverlay();
    hideLevelSelect();
    syncPuzzleTools();
    syncHomeBtn();
    if (window.GameAudio) {
      GameAudio.unlock();
      GameAudio.syncAmbience({
        playing: true,
        force: true,
        city: level === 8,
        zombies: zombies.length > 0,
      });
    }
  }

  function showNamePrompt() {
    state = "naming";
    levelLabel.textContent = String(level);
    statusLabel.textContent = "起名";
    makeLevel(level);
    resetPuzzleButtons();
    syncPuzzleTools();
    syncHomeBtn();
    hideLevelSelect();
    const msg =
      level >= 5
        ? `第 ${level} 关起，名字会一直显示在头顶。<br />请先给自己的玩家起个名字。`
        : "先给自己的玩家起个名字。<br />平路上有一只大僵尸在追你——旁边的箱子里藏着速度药水。";
    showOverlay(`第 ${level} 关`, msg, "确认名字", { showName: true });
  }

  function confirmPlayerName() {
    const name = (nameInput.value || "").trim().slice(0, 8);
    if (!name) {
      nameInput.focus();
      statusLabel.textContent = "先起个名字";
      return false;
    }
    playerName = name;
    beginPlaying();
    return true;
  }

  function startGame(mode) {
    // mode: fresh | retry | next
    if (mode === "fresh") {
      if (loggedIn) {
        showLevelSelect();
        return;
      }
      openLoginScreen();
      return;
    } else if (mode === "next") {
      if (level >= MAX_PLAYABLE) {
        showLevelSelect();
        return;
      }
      level += 1;
    }

    if (needsPlayerName(level) && !playerName) {
      showNamePrompt();
      return;
    }

    beginPlaying();
  }

  function drawBackground() {
    if (level === 8) {
      drawCityBackground();
      return;
    }
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#24100c");
    g.addColorStop(0.55, "#1a0b08");
    g.addColorStop(1, "#3a1208");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Distant cliffs
    ctx.save();
    ctx.translate(-cameraX * 0.2, 0);
    ctx.fillStyle = "rgba(60, 24, 16, 0.55)";
    for (let i = 0; i < 12; i++) {
      const bx = i * 280;
      ctx.beginPath();
      ctx.moveTo(bx, 280);
      ctx.lineTo(bx + 80, 160 + (i % 3) * 20);
      ctx.lineTo(bx + 180, 250);
      ctx.lineTo(bx + 260, 190);
      ctx.lineTo(bx + 320, 300);
      ctx.lineTo(bx, 300);
      ctx.fill();
    }
    ctx.restore();

    // Ash particles
    ctx.fillStyle = "rgba(255, 180, 120, 0.25)";
    for (let i = 0; i < 30; i++) {
      const ax = ((i * 97 + time * (20 + (i % 5))) % (W + 40)) - 20;
      const ay = (i * 53 + Math.sin(time + i) * 20) % H;
      ctx.fillRect(ax, ay, 2, 2);
    }
  }

  function drawCityBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#1a2744");
    sky.addColorStop(0.45, "#2a3a55");
    sky.addColorStop(1, "#3a2a28");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // distant city glow
    const glow = ctx.createRadialGradient(W * 0.7, H * 0.55, 20, W * 0.7, H * 0.7, 280);
    glow.addColorStop(0, "rgba(255, 160, 60, 0.2)");
    glow.addColorStop(1, "rgba(255, 100, 40, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(-cameraX * 0.35, 0);
    for (let i = 0; i < 18; i++) {
      const bx = i * 160 - 40;
      const bh = 120 + (i % 5) * 35 + (i % 3) * 20;
      const by = LAVA_Y - 8 - bh;
      ctx.fillStyle = i % 2 === 0 ? "#1c2438" : "#151c2c";
      ctx.fillRect(bx, by, 120, bh);
      // windows
      for (let wy = by + 12; wy < by + bh - 20; wy += 18) {
        for (let wx = bx + 10; wx < bx + 110; wx += 16) {
          const lit = ((i * 13 + wx + Math.floor(wy)) % 7) !== 0;
          ctx.fillStyle = lit ? "rgba(255, 210, 120, 0.55)" : "rgba(40, 50, 70, 0.5)";
          ctx.fillRect(wx, wy, 8, 10);
        }
      }
    }
    ctx.restore();

    // street lights dust
    ctx.fillStyle = "rgba(200, 220, 255, 0.2)";
    for (let i = 0; i < 20; i++) {
      const ax = ((i * 113 + time * 15) % (W + 30)) - 10;
      const ay = 80 + (i * 37) % 200;
      ctx.fillRect(ax, ay, 2, 2);
    }
  }

  function drawLava() {
    const base = LAVA_Y;
    const under =
      fakeLava && player && player.y + player.h > LAVA_Y + 4;
    const lavaGrad = ctx.createLinearGradient(0, base - 10, 0, H);
    lavaGrad.addColorStop(0, "#ffb347");
    lavaGrad.addColorStop(0.25, "#ff5a1f");
    lavaGrad.addColorStop(1, "#8a1400");
    ctx.save();
    // From above it looks real; only thin out once you've jumped in
    if (under) ctx.globalAlpha = 0.42;
    ctx.fillStyle = lavaGrad;
    ctx.fillRect(0, base, W, H - base);

    ctx.beginPath();
    ctx.moveTo(0, base);
    for (let x = 0; x <= W; x += 16) {
      const wave =
        Math.sin(x * 0.04 + time * 4) * 5 +
        Math.sin(x * 0.01 + time * 2.2) * 3;
      ctx.lineTo(x, base + wave);
    }
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 220, 80, 0.35)";
    ctx.fill();
    ctx.restore();

    // Heat glow
    const glow = ctx.createLinearGradient(0, base - 60, 0, base);
    glow.addColorStop(0, "rgba(255, 80, 20, 0)");
    glow.addColorStop(1, under ? "rgba(255, 60, 10, 0.14)" : "rgba(255, 60, 10, 0.28)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, base - 60, W, 60);
  }

  function drawBrick(p) {
    const x = p.x - cameraX;
    const y = p.y;
    if (x + p.w < -20 || x > W + 20) return;

    if (p.lane === "secret") {
      ctx.fillStyle = "#2a1810";
      ctx.fillRect(x, y, p.w, p.h);
      ctx.fillStyle = "#4a3020";
      ctx.fillRect(x + 2, y + 2, p.w - 4, p.h - 5);
      ctx.fillStyle = "rgba(255, 120, 40, 0.12)";
      ctx.fillRect(x + 2, y + 2, p.w - 4, 3);
      return;
    }

    if (p.lane === "bridge") {
      ctx.fillStyle = "#3a2418";
      ctx.fillRect(x, y, p.w, p.h + 10);
      ctx.fillStyle = "#24140e";
      ctx.fillRect(x + 2, y + 2, p.w - 4, p.h + 6);
      ctx.strokeStyle = "#8a5a28";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, p.w - 2, p.h + 8);
      ctx.fillStyle = "#ffd24a";
      ctx.font = "9px 'Press Start 2P', monospace";
      ctx.textAlign = "center";
      ctx.fillText(p.label || "砖", x + p.w / 2, y + 18);
      ctx.textAlign = "left";
      return;
    }

    const roof = p.lane === "roof";
    ctx.fillStyle = roof ? "#3a2818" : "#5a2e20";
    ctx.fillRect(x, y, p.w, p.h);
    ctx.fillStyle = roof ? "#5a4030" : "#7a4430";
    ctx.fillRect(x + 2, y + 2, p.w - 4, p.h - 6);

    const cols = Math.max(1, Math.floor(p.w / 28));
    const bw = p.w / cols;
    ctx.strokeStyle = "rgba(30, 12, 8, 0.55)";
    ctx.lineWidth = 1;
    for (let i = 1; i < cols; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * bw, y + 2);
      ctx.lineTo(x + i * bw, y + p.h - 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(x + 2, y + p.h / 2);
    ctx.lineTo(x + p.w - 2, y + p.h / 2);
    ctx.stroke();

    ctx.fillStyle = roof
      ? "rgba(180, 80, 60, 0.22)"
      : "rgba(255, 200, 150, 0.18)";
    ctx.fillRect(x + 2, y + 2, p.w - 4, 4);

    if (roof) {
      ctx.fillStyle = "rgba(40, 20, 12, 0.7)";
      for (let i = 0; i < cols; i++) {
        const tx = x + i * bw + bw * 0.45;
        ctx.beginPath();
        ctx.moveTo(tx - 3, y + p.h);
        ctx.lineTo(tx + 3, y + p.h);
        ctx.lineTo(tx, y + p.h + 7);
        ctx.fill();
      }
    }
  }

  function drawPlayer() {
    const x = player.x - cameraX;
    const y = player.y;
    const hop = player.onGround ? 0 : -2;

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(x + 14, player.y + player.h + 4, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = speedBoost > 0 ? "#7aefff" : "#3ec6ff";
    ctx.fillRect(x + 6, y + 10 + hop, 16, 22);
    // Head
    ctx.fillStyle = "#ffe0b8";
    ctx.fillRect(x + 6, y + hop, 16, 14);
    // Eyes
    ctx.fillStyle = "#1a0c08";
    ctx.fillRect(x + (player.facing >= 0 ? 14 : 8), y + 5 + hop, 3, 3);
    // Legs
    const swing = player.onGround && Math.abs(player.vx) > 0.2
      ? Math.sin(time * 14) * 4
      : 0;
    ctx.fillStyle = "#245a8a";
    ctx.fillRect(x + 7, y + 30 + hop, 5, 10 + swing);
    ctx.fillRect(x + 16, y + 30 + hop, 5, 10 - swing);

    if (playerName || level >= 5) {
      const label = playerName || "???";
      ctx.save();
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0, 0, 0, 0.75)";
      ctx.fillStyle = "#ffe27a";
      const labelX = x + player.w / 2;
      const labelY = y - 10 + hop;
      ctx.strokeText(label, labelX, labelY);
      ctx.fillText(label, labelX, labelY);
      ctx.restore();
    }
  }

  function drawZombie(z) {
    const x = z.x - cameraX;
    const y = z.y + Math.sin(z.bob) * 1.5;
    if (x < -80 || x > W + 80) return;
    const above = z.mode === "above";
    const big = !!z.big;
    const s = big ? 2.15 : 1;

    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(
      x + (big ? 32 : 15),
      z.y + z.h + 3,
      big ? 28 : 12,
      big ? 6 : 3,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    const bodyX = x + (big ? 10 : 5);
    const bodyY = y + (big ? 22 : 10);
    // Body
    const bodyColor = z.fake
      ? "#4a7a38"
      : above
        ? "#3d5a28"
        : big
          ? "#2f5a22"
          : "#4a7a38";
    const headColor = z.fake
      ? "#6aaa4a"
      : above
        ? "#8bcc3a"
        : big
          ? "#6db84a"
          : "#6aaa4a";
    ctx.fillStyle = bodyColor;
    ctx.fillRect(bodyX, bodyY, 20 * s, 20 * s * 0.85);
    ctx.fillStyle = headColor;
    ctx.fillRect(x + (big ? 8 : 4), y, 22 * s * 0.95, 14 * s);

    ctx.fillStyle = z.fake ? "#ff3030" : above ? "#ffee44" : "#ff3030";
    const eyeY = y + (big ? 10 : 4);
    ctx.fillRect(x + (big ? 16 : 8), eyeY, big ? 8 : 4, big ? 8 : 4);
    ctx.fillRect(x + (big ? 36 : 16), eyeY, big ? 8 : 4, big ? 8 : 4);

    ctx.fillStyle = z.fake ? "#4a7a38" : above ? "#3d5a28" : big ? "#2f5a22" : "#4a7a38";
    if (above && !z.fake) {
      const hang = 8 + Math.sin(z.bob * 1.8) * 4;
      ctx.fillRect(x + 2, y + 14, 5, hang);
      ctx.fillRect(x + 23, y + 14, 5, hang);
      ctx.fillStyle = "#c8e060";
      ctx.fillRect(x + 1, y + 14 + hang, 7, 3);
      ctx.fillRect(x + 22, y + 14 + hang, 7, 3);
    } else if (big) {
      const reach = 14 + Math.sin(z.bob * 1.5) * 5;
      ctx.fillRect(x + 52, y + 30, reach, 10);
      ctx.fillRect(x - reach + 8, y + 34, reach, 10);
      ctx.fillStyle = "#c8e060";
      ctx.fillRect(x + 52 + reach - 2, y + 28, 8, 14);
    } else {
      const reach = 6 + Math.sin(z.bob * 1.5) * 3;
      ctx.fillRect(x + 22, y + 14, reach, 5);
      ctx.fillRect(x - reach + 4, y + 16, reach, 5);
    }

    ctx.fillStyle = "#2f4f22";
    const swing = Math.sin(z.bob * 2) * (big ? 5 : 3);
    if (big) {
      ctx.fillRect(x + 16, y + 58, 12, 20 + swing);
      ctx.fillRect(x + 36, y + 58, 12, 20 - swing);
    } else {
      ctx.fillRect(x + 8, y + 28, 6, 10 + swing);
      ctx.fillRect(x + 16, y + 28, 6, 10 - swing);
    }
  }

  function drawCrate() {
    if (!crate) return;
    const x = crate.x - cameraX;
    const y = crate.y;
    if (x < -50 || x > W + 50) return;

    ctx.fillStyle = "#6b4226";
    ctx.fillRect(x, y, crate.w, crate.h);
    ctx.fillStyle = "#8b5a32";
    ctx.fillRect(x + 3, y + 3, crate.w - 6, crate.h - 6);
    ctx.strokeStyle = "#3a2414";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, crate.w - 2, crate.h - 2);
    ctx.beginPath();
    ctx.moveTo(x + crate.w / 2, y + 3);
    ctx.lineTo(x + crate.w / 2, y + crate.h - 3);
    ctx.moveTo(x + 3, y + crate.h / 2);
    ctx.lineTo(x + crate.w - 3, y + crate.h / 2);
    ctx.stroke();
    // Metal latch
    ctx.fillStyle = crate.open ? "#888" : "#ffd24a";
    ctx.fillRect(x + crate.w / 2 - 4, y + crate.h / 2 - 4, 8, 8);

    if (!crate.open) {
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "10px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("箱子", x + crate.w / 2, y - 6);
      ctx.textAlign = "left";
    }
  }

  function drawPotion() {
    if (!potion) return;
    const x = potion.x - cameraX;
    const y = potion.y + Math.sin(potion.bob) * 4;
    if (x < -40 || x > W + 40) return;

    ctx.fillStyle = "rgba(92, 225, 255, 0.25)";
    ctx.beginPath();
    ctx.arc(x + 11, y + 16, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#e8f7ff";
    ctx.fillRect(x + 7, y, 8, 8);
    ctx.fillStyle = "#5ce1ff";
    ctx.fillRect(x + 4, y + 8, 14, 18);
    ctx.fillStyle = "#9af0ff";
    ctx.fillRect(x + 6, y + 10, 5, 10);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 4, y + 8, 14, 18);

    ctx.fillStyle = "#ffe27a";
    ctx.font = "10px 'Noto Sans SC', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("速度药水", x + 11, y - 6);
    ctx.textAlign = "left";
  }

  function drawStar() {
    if (!star || star.collected) return;
    const x = star.x - cameraX;
    const y = star.y + Math.sin(star.pulse) * 6;
    const glow = 0.45 + Math.sin(star.pulse * 1.5) * 0.25;

    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = `rgba(255, 220, 80, ${glow})`;
    ctx.shadowBlur = 24 + Math.sin(star.pulse) * 10;

    // Outer glow circle
    const rg = ctx.createRadialGradient(0, 0, 2, 0, 0, 40);
    rg.addColorStop(0, `rgba(255, 240, 120, ${0.35 + glow * 0.3})`);
    rg.addColorStop(1, "rgba(255, 160, 40, 0)");
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, Math.PI * 2);
    ctx.fill();

    // Five-point star
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      const b = a + Math.PI / 5;
      const r1 = star.r + 4;
      const r2 = star.r * 0.42;
      ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.lineTo(Math.cos(b) * r2, Math.sin(b) * r2);
    }
    ctx.closePath();
    const sg = ctx.createLinearGradient(0, -20, 0, 20);
    sg.addColorStop(0, "#fff6a8");
    sg.addColorStop(0.5, "#ffd24a");
    sg.addColorStop(1, "#ff9a1a");
    ctx.fillStyle = sg;
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 220, 0.8)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  function drawEndSign() {
    if (!endSign) return;
    const prefix = "这里没有";
    const mid = "五角星";
    const suffix = "哦";
    const sx = endSign.x - cameraX;
    const sy = endSign.y + Math.sin(endSign.pulse) * 2;
    if (sx < -280 || sx > W + 40) {
      endSign.hit = null;
      return;
    }

    ctx.save();
    ctx.font = "bold 26px 'Noto Sans SC', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    const w1 = ctx.measureText(prefix).width;
    const w2 = ctx.measureText(mid).width;
    const w3 = ctx.measureText(suffix).width;
    const total = w1 + w2 + w3;

    // Soft board behind the sentence
    ctx.fillStyle = "rgba(20, 8, 6, 0.55)";
    ctx.fillRect(sx - 14, sy - 34, total + 28, 48);
    ctx.strokeStyle = "rgba(122, 61, 36, 0.8)";
    ctx.lineWidth = 2;
    ctx.strokeRect(sx - 14, sy - 34, total + 28, 48);

    ctx.fillStyle = "#c9a48a";
    ctx.fillText(prefix, sx, sy);

    // The clickable words look almost like normal text, with a subtle gold hint
    const glow = 0.35 + Math.sin(endSign.pulse * 2) * 0.2;
    ctx.fillStyle = `rgba(255, 210, 74, ${0.75 + glow * 0.25})`;
    ctx.fillText(mid, sx + w1, sy);
    ctx.strokeStyle = `rgba(255, 210, 74, ${0.35 + glow * 0.3})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx + w1, sy + 6);
    ctx.lineTo(sx + w1 + w2, sy + 6);
    ctx.stroke();

    ctx.fillStyle = "#c9a48a";
    ctx.fillText(suffix, sx + w1 + w2, sy);
    ctx.restore();

    endSign.hit = {
      x: endSign.x + w1,
      y: endSign.y - 28,
      w: w2,
      h: 36,
    };
  }

  function drawSpikes() {
    for (const s of spikes) {
      const x = s.x - cameraX;
      const y = s.y;
      if (x + s.w < -10 || x > W + 10) continue;
      ctx.beginPath();
      ctx.moveTo(x, y + s.h);
      ctx.lineTo(x + s.w / 2, y);
      ctx.lineTo(x + s.w, y + s.h);
      ctx.closePath();
      const g = ctx.createLinearGradient(x, y, x, y + s.h);
      g.addColorStop(0, "#e8e8f0");
      g.addColorStop(0.45, "#a0a0b8");
      g.addColorStop(1, "#5a5a70");
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = "rgba(20, 10, 8, 0.55)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#3a2a22";
      ctx.fillRect(x - 1, y + s.h - 2, s.w + 2, 4);
    }
  }

  function maceBall(m) {
    return {
      x: m.x + Math.cos(m.angle) * m.len,
      y: m.y + Math.sin(m.angle) * m.len,
    };
  }

  function distPointToSegment(px, py, x1, y1, x2, y2) {
    const vx = x2 - x1;
    const vy = y2 - y1;
    const wx = px - x1;
    const wy = py - y1;
    const c1 = vx * wx + vy * wy;
    if (c1 <= 0) return Math.hypot(px - x1, py - y1);
    const c2 = vx * vx + vy * vy;
    if (c2 <= c1) return Math.hypot(px - x2, py - y2);
    const t = c1 / c2;
    return Math.hypot(px - (x1 + t * vx), py - (y1 + t * vy));
  }

  function hitByMace(playerBox, m) {
    const ball = maceBall(m);
    const pcx = playerBox.x + playerBox.w / 2;
    const pcy = playerBox.y + playerBox.h / 2;
    const ballHit = Math.hypot(pcx - ball.x, pcy - ball.y) < m.ballR + 16;
    const shaftHit =
      distPointToSegment(pcx, pcy, m.x, m.y, ball.x, ball.y) < (m.shaftW || 20);
    return ballHit || shaftHit;
  }

  function drawMaces() {
    for (const m of maces) {
      const ball = maceBall(m);
      const px = m.x - cameraX;
      const py = m.y;
      const bx = ball.x - cameraX;
      const by = ball.y;
      if (px < -120 && bx < -120) continue;
      if (px > W + 120 && bx > W + 120) continue;

      // shaft
      ctx.strokeStyle = "#5a4030";
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.strokeStyle = "#8a6040";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(bx, by);
      ctx.stroke();

      // pivot
      ctx.fillStyle = "#3a2818";
      ctx.beginPath();
      ctx.arc(px, py, 16, 0, Math.PI * 2);
      ctx.fill();

      // spiked ball
      ctx.fillStyle = "#6a6a78";
      ctx.beginPath();
      ctx.arc(bx, by, m.ballR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#2a2a32";
      ctx.lineWidth = 3;
      ctx.stroke();

      for (let i = 0; i < 10; i++) {
        const a = m.angle + (i * Math.PI) / 5;
        const x1 = bx + Math.cos(a) * (m.ballR - 4);
        const y1 = by + Math.sin(a) * (m.ballR - 4);
        const x2 = bx + Math.cos(a) * (m.ballR + 22);
        const y2 = by + Math.sin(a) * (m.ballR + 22);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = "#d0d0dc";
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 + Math.cos(a - 0.35) * 9, y2 + Math.sin(a - 0.35) * 9);
        ctx.lineTo(x2 + Math.cos(a + 0.35) * 9, y2 + Math.sin(a + 0.35) * 9);
        ctx.closePath();
        ctx.fillStyle = "#e8e8f0";
        ctx.fill();
      }
    }
  }

  function drawBackpack() {
    if (state !== "playing") return;
    if (level === 6) {
      const x = 24;
      const y = H - 108;
      ctx.fillStyle = "rgba(18, 8, 6, 0.75)";
      ctx.fillRect(x, y, 168, 84);
      ctx.strokeStyle = "#8a5a28";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, 168, 84);

      ctx.fillStyle = "#ffd24a";
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      ctx.fillText("背包", x + 12, y + 18);

      ctx.fillStyle = "#fff3e6";
      ctx.font = "13px 'Noto Sans SC', sans-serif";
      ctx.fillText(`击杀僵尸 × ${backpack.zombiesKilled}`, x + 12, y + 42);
      ctx.fillText(`尖刺 × ${backpack.spikes}`, x + 12, y + 66);

      const left = zombies.filter((z) => z.alive !== false).length;
      ctx.fillStyle = left > 0 ? "#ff9a7a" : "#7dffb0";
      ctx.font = "11px 'Noto Sans SC', sans-serif";
      ctx.fillText(left > 0 ? `剩余僵尸 ${left}` : "可拆尖刺", x + 12, y + 80);
      return;
    }

    // Level 7: backpack only appears after first secret dismantle
    if (level === 7 && backpack.revealed) {
      const x = 24;
      const y = H - 78;
      ctx.fillStyle = "rgba(18, 8, 6, 0.75)";
      ctx.fillRect(x, y, 168, 54);
      ctx.strokeStyle = "#8a5a28";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, 168, 54);
      ctx.fillStyle = "#ffd24a";
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      ctx.fillText("背包", x + 12, y + 20);
      ctx.fillStyle = "#fff3e6";
      ctx.font = "14px 'Noto Sans SC', sans-serif";
      ctx.fillText(`狼牙棒 × ${backpack.maces}`, x + 12, y + 42);
    }
  }

  function pointInRect(px, py, r) {
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  }

  function tryClickLevel6(clientX, clientY) {
    if (state !== "playing" || level !== 6) return false;
    const world = clientToWorld(clientX, clientY);

    for (let i = zombies.length - 1; i >= 0; i--) {
      const z = zombies[i];
      if (z.alive === false) continue;
      if (pointInRect(world.x, world.y, z)) {
        spawnBurst(z.x + z.w / 2, z.y + z.h / 2, "#6aaa4a", 22);
        spawnBurst(z.x + z.w / 2, z.y + z.h / 2, "#ff5533", 12);
        shake = 10;
        zombies.splice(i, 1);
        backpack.zombiesKilled += 1;
        if (window.GameAudio) GameAudio.playClick();
        const left = zombies.length;
        statusLabel.textContent =
          left > 0
            ? `击杀僵尸！剩余 ${left} 只`
            : "僵尸已清空！现在可以拆尖刺了";
        return true;
      }
    }

    for (let i = spikes.length - 1; i >= 0; i--) {
      const s = spikes[i];
      const hit = {
        x: s.x - 6,
        y: s.y - 8,
        w: s.w + 12,
        h: s.h + 14,
      };
      if (pointInRect(world.x, world.y, hit)) {
        if (zombies.some((z) => z.alive !== false)) {
          statusLabel.textContent = "先把僵尸全部打死，才能拆尖刺！";
          shake = Math.max(shake, 4);
          return true;
        }
        spikes.splice(i, 1);
        backpack.spikes += 1;
        if (window.GameAudio) GameAudio.playClick();
        spawnBurst(s.x + s.w / 2, s.y + 4, "#c8c8d8", 14);
        spawnBurst(s.x + s.w / 2, s.y + 4, "#ffd24a", 8);
        statusLabel.textContent = `尖刺已拆下，装进背包（${backpack.spikes}）`;
        return true;
      }
    }
    return false;
  }

  function tryClickLevel7(clientX, clientY) {
    if (state !== "playing" || level !== 7) return false;
    const world = clientToWorld(clientX, clientY);

    for (let i = maces.length - 1; i >= 0; i--) {
      const m = maces[i];
      const ball = maceBall(m);
      const dx = world.x - ball.x;
      const dy = world.y - ball.y;
      const pivotDx = world.x - m.x;
      const pivotDy = world.y - m.y;
      const hitBall = dx * dx + dy * dy <= (m.ballR + 16) * (m.ballR + 16);
      const hitShaft =
        Math.abs(pivotDx * Math.sin(m.angle) - pivotDy * Math.cos(m.angle)) < 14 &&
        pivotDx * Math.cos(m.angle) + pivotDy * Math.sin(m.angle) > 0 &&
        pivotDx * Math.cos(m.angle) + pivotDy * Math.sin(m.angle) < m.len + 10;
      if (hitBall || hitShaft) {
        maces.splice(i, 1);
        backpack.maces += 1;
        backpack.revealed = true;
        if (window.GameAudio) GameAudio.playClick();
        spawnBurst(ball.x, ball.y, "#c8c8d8", 18);
        spawnBurst(ball.x, ball.y, "#8a6040", 10);
        shake = 8;
        statusLabel.textContent = `狼牙棒拆下了！装进背包（${backpack.maces}）`;
        return true;
      }
    }
    return false;
  }

  function hoverLevel6Target(clientX, clientY) {
    if (state !== "playing" || level !== 6) return false;
    const world = clientToWorld(clientX, clientY);
    for (const z of zombies) {
      if (z.alive === false) continue;
      if (pointInRect(world.x, world.y, z)) return true;
    }
    for (const s of spikes) {
      const hit = {
        x: s.x - 6,
        y: s.y - 8,
        w: s.w + 12,
        h: s.h + 14,
      };
      if (pointInRect(world.x, world.y, hit)) return true;
    }
    return false;
  }

  function rocketContents(index) {
    const pool = ["燃料罐", "螺丝钉", "星尘碎片", "压缩饼干", "小旗子"];
    return pool[index % pool.length];
  }

  function updateEatAnim(dt) {
    if (!eatAnim) return;
    eatAnim.t += dt;
    const r = eatAnim.rocket;
    const p = player;
    const handX = p.x + p.w / 2 - r.w * eatAnim.scale * 0.5;
    const handY = p.y - 10 - r.h * eatAnim.scale * 0.15;
    const mouthX = p.x + (p.facing >= 0 ? p.w - 4 : -4) - r.w * eatAnim.scale * 0.5;
    const mouthY = p.y + 2;

    if (eatAnim.t < 0.45) {
      const u = eatAnim.t / 0.45;
      const e = 1 - Math.pow(1 - u, 3);
      r.drawX = eatAnim.fromX + (handX - eatAnim.fromX) * e;
      r.drawY = eatAnim.fromY + (handY - eatAnim.fromY) * e;
      eatAnim.scale = 1;
      player.facing = r.x + r.w / 2 >= p.x ? 1 : -1;
    } else if (eatAnim.t < 0.85) {
      const u = (eatAnim.t - 0.45) / 0.4;
      const e = 1 - Math.pow(1 - u, 2);
      r.drawX = handX + (mouthX - handX) * e;
      r.drawY = handY + (mouthY - handY) * e;
      eatAnim.scale = 1 - e * 0.55;
      if (Math.random() < 0.5) {
        spawnBurst(mouthX + r.w * 0.3, mouthY + 8, "#ffb347", 2);
      }
    } else if (eatAnim.t < 1.15) {
      const u = (eatAnim.t - 0.85) / 0.3;
      r.drawX = mouthX;
      r.drawY = mouthY;
      eatAnim.scale = Math.max(0.05, 0.45 * (1 - u));
      spawnBurst(mouthX + 10, mouthY + 6, "#ffe07a", 1);
    } else {
      // Finish eating — stomach contents appear
      r.eaten = true;
      r.eating = false;
      const item = rocketContents(belly.items.length);
      belly.items.push(item);
      belly.revealed = true;
      spawnBurst(p.x + p.w / 2, p.y, "#ff9a2a", 16);
      spawnBurst(p.x + p.w / 2, p.y + 10, "#5ce1ff", 10);
      statusLabel.textContent = `吃掉火箭！肚子里出现了：${item}`;
      shake = 8;
      eatAnim = null;
    }
  }

  function startEatRocket(r) {
    if (eatAnim || r.eaten || r.eating) return;
    r.eating = true;
    eatAnim = {
      rocket: r,
      t: 0,
      fromX: r.x,
      fromY: r.y,
      scale: 1,
    };
    r.drawX = r.x;
    r.drawY = r.y;
    statusLabel.textContent = r.big ? "举起超级大火箭……" : "举起火箭……";
    if (window.GameAudio) GameAudio.playRocket();
  }

  function drawRocket(r, x, y, w, h) {
    // body
    const bodyGrad = ctx.createLinearGradient(x, y, x + w, y);
    bodyGrad.addColorStop(0, "#d8dde8");
    bodyGrad.addColorStop(0.5, "#f4f7ff");
    bodyGrad.addColorStop(1, "#a8b0c0");
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, y);
    ctx.quadraticCurveTo(x + w * 1.05, y + h * 0.2, x + w * 0.85, y + h * 0.55);
    ctx.lineTo(x + w * 0.85, y + h * 0.82);
    ctx.lineTo(x + w * 0.15, y + h * 0.82);
    ctx.lineTo(x + w * 0.15, y + h * 0.55);
    ctx.quadraticCurveTo(x - w * 0.05, y + h * 0.2, x + w * 0.5, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#5a6578";
    ctx.lineWidth = 2;
    ctx.stroke();

    // window
    ctx.fillStyle = "#7ec8ff";
    ctx.beginPath();
    ctx.arc(x + w * 0.5, y + h * 0.32, w * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#2a4060";
    ctx.stroke();

    // fins
    ctx.fillStyle = "#e85a3a";
    ctx.beginPath();
    ctx.moveTo(x + w * 0.15, y + h * 0.7);
    ctx.lineTo(x - w * 0.2, y + h * 0.95);
    ctx.lineTo(x + w * 0.2, y + h * 0.82);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + w * 0.85, y + h * 0.7);
    ctx.lineTo(x + w * 1.2, y + h * 0.95);
    ctx.lineTo(x + w * 0.8, y + h * 0.82);
    ctx.closePath();
    ctx.fill();

    // flame
    const flicker = 0.7 + Math.sin(time * 14 + x) * 0.3;
    ctx.fillStyle = `rgba(255, 160, 40, ${0.55 * flicker})`;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.3, y + h * 0.82);
    ctx.lineTo(x + w * 0.5, y + h * 0.82 + 28 * flicker);
    ctx.lineTo(x + w * 0.7, y + h * 0.82);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = `rgba(255, 240, 120, ${0.7 * flicker})`;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.38, y + h * 0.82);
    ctx.lineTo(x + w * 0.5, y + h * 0.82 + 16 * flicker);
    ctx.lineTo(x + w * 0.62, y + h * 0.82);
    ctx.closePath();
    ctx.fill();
  }

  function drawRockets() {
    for (const r of rockets) {
      if (r.eaten || r.eating) continue;
      const x = r.x - cameraX;
      const y = r.y;
      const w = r.w;
      const h = r.h;
      if (x + w < -40 || x > W + 40) continue;
      drawRocket(r, x, y, w, h);
      if (r.big) {
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.font = "12px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("超级大火箭", x + w / 2, y - 8);
        ctx.textAlign = "left";
      }
    }
  }

  function drawBelly() {
    if (level !== 8 || state !== "playing" || !belly.revealed) return;
    const x = 24;
    const y = H - 120;
    const h = 96;
    ctx.fillStyle = "rgba(18, 8, 6, 0.78)";
    ctx.fillRect(x, y, 210, h);
    ctx.strokeStyle = "#8a5a28";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 210, h);
    ctx.fillStyle = "#ffd24a";
    ctx.font = "12px 'Noto Sans SC', sans-serif";
    ctx.fillText("肚子里的东西", x + 12, y + 20);
    ctx.fillStyle = "#fff3e6";
    ctx.font = "12px 'Noto Sans SC', sans-serif";
    if (!belly.items.length) {
      ctx.fillText("（空）", x + 12, y + 48);
    } else {
      belly.items.forEach((item, i) => {
        ctx.fillText(`${i + 1}. ${item}`, x + 12, y + 42 + i * 16);
      });
    }
  }

  function tryClickLevel8(clientX, clientY) {
    if (state !== "playing" || level !== 8 || eatAnim) return false;
    const world = clientToWorld(clientX, clientY);
    // Prefer topmost / biggest rocket under cursor
    let best = null;
    for (const r of rockets) {
      if (r.eaten || r.eating) continue;
      if (pointInRect(world.x, world.y, r)) {
        if (!best || r.w * r.h > best.w * best.h) best = r;
      }
    }
    if (best) {
      startEatRocket(best);
      return true;
    }
    return false;
  }

  function hoverLevel8Target(clientX, clientY) {
    if (state !== "playing" || level !== 8 || eatAnim) return false;
    const world = clientToWorld(clientX, clientY);
    return rockets.some(
      (r) => !r.eaten && !r.eating && pointInRect(world.x, world.y, r)
    );
  }

  function hoverLevel7Target(clientX, clientY) {
    if (state !== "playing" || level !== 7) return false;
    const world = clientToWorld(clientX, clientY);
    for (const m of maces) {
      const ball = maceBall(m);
      const dx = world.x - ball.x;
      const dy = world.y - ball.y;
      if (dx * dx + dy * dy <= (m.ballR + 16) * (m.ballR + 16)) return true;
    }
    return false;
  }

  function drawComingSoon() {
    if (!comingSoon) return;
    const sx = comingSoon.x - cameraX;
    const sy = comingSoon.y + Math.sin(comingSoon.pulse) * 3;
    if (sx < -420 || sx > W + 40) return;

    ctx.save();
    ctx.font = "bold 28px 'Noto Sans SC', sans-serif";
    const text = comingSoon.text;
    const tw = ctx.measureText(text).width;
    comingSoon.w = tw + 36;

    ctx.fillStyle = "rgba(20, 8, 6, 0.6)";
    ctx.fillRect(sx - 18, sy - 36, tw + 36, 56);
    ctx.strokeStyle = "rgba(255, 180, 80, 0.45)";
    ctx.lineWidth = 2;
    ctx.strokeRect(sx - 18, sy - 36, tw + 36, 56);

    ctx.fillStyle = "#ffd24a";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(text, sx, sy);
    ctx.restore();
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = clamp(p.life / 0.6, 0, 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - cameraX, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  function drawUI() {
    let progress = 0;
    const goalX = star ? star.x : endSign ? endSign.x : comingSoon ? comingSoon.x : 1;
    if (reverseGoal && star) {
      const total = Math.max(1, spawnX - star.x);
      progress = clamp((spawnX - player.x) / total, 0, 1);
    } else {
      progress = clamp(player.x / Math.max(1, goalX), 0, 1);
    }
    const barX = puzzleMode ? W - 220 : 24;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(barX, 16, 180, 8);
    ctx.fillStyle = "#ffd24a";
    ctx.fillRect(barX, 16, 180 * progress, 8);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "10px 'Press Start 2P', monospace";
    ctx.fillText(reverseGoal ? "???" : "终点", barX + 186, 24);
  }

  function draw() {
    ctx.save();
    if (shake > 0.5) {
      ctx.translate(rand(-shake, shake), rand(-shake, shake));
    }

    drawBackground();

    for (const p of platforms) {
      if (p.lane !== "secret") drawBrick(p);
    }
    drawSpikes();
    drawMaces();
    drawRockets();
    drawCrate();
    drawPotion();
    if (!(fakeLava && star && star.y + star.r > LAVA_Y - 20)) drawStar();
    drawEndSign();
    drawComingSoon();
    for (const z of zombies) drawZombie(z);
    if (player && player.y + player.h <= LAVA_Y + 8) drawPlayer();
    if (eatAnim && eatAnim.rocket && !eatAnim.rocket.eaten) {
      const r = eatAnim.rocket;
      const s = eatAnim.scale;
      drawRocket(
        r,
        (r.drawX ?? r.x) - cameraX,
        r.drawY ?? r.y,
        r.w * s,
        r.h * s
      );
    }
    drawLava();
    // Reveal secret path only after jumping into the fake lava
    const revealSecret =
      fakeLava && player && player.y + player.h > LAVA_Y + 4;
    if (revealSecret) {
      for (const p of platforms) {
        if (p.lane === "secret") drawBrick(p);
      }
      drawStar();
      drawPlayer();
    }
    drawParticles();
    if (state === "playing") drawUI();
    drawBackpack();
    drawBelly();
    if (state === "playing" && speedBoost > 0) {
      ctx.fillStyle = "rgba(92, 225, 255, 0.9)";
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      ctx.fillText(`加速 ${speedBoost.toFixed(1)}s`, 24, 48);
    }

    ctx.restore();
  }

  function loop(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.033, (ts - lastTs) / 1000);
    lastTs = ts;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", (e) => {
    keys.add(e.key);
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
      e.preventDefault();
    }
    if ((e.key === "r" || e.key === "R") && state === "playing") {
      makeLevel(level);
      resetPuzzleButtons();
      syncPuzzleTools();
      syncHomeBtn();
      statusLabel.textContent = "重开";
    }
    if (e.key === "Enter" && state !== "playing" && state !== "login" && state !== "select") {
      if (state === "naming") {
        confirmPlayerName();
      } else if (state === "win") {
        if (level >= MAX_PLAYABLE) showLevelSelect();
        else startGame("next");
      } else if (state === "dead") startGame("retry");
      else startGame("fresh");
    }
  });

  window.addEventListener("keyup", (e) => {
    keys.delete(e.key);
  });

  startBtn.addEventListener("click", () => {
    playUiClick();
    if (state === "naming") confirmPlayerName();
    else if (state === "win") {
      if (level >= MAX_PLAYABLE) showLevelSelect();
      else startGame("next");
    } else if (state === "dead") startGame("retry");
    else startGame("fresh");
  });

  nameInput.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      confirmPlayerName();
    }
  });

  function tryClickEndSign(clientX, clientY) {
    if (state !== "playing" || !endSign || !endSign.hit) return false;
    const world = clientToWorld(clientX, clientY);
    const h = endSign.hit;
    if (
      world.x >= h.x &&
      world.x <= h.x + h.w &&
      world.y >= h.y &&
      world.y <= h.y + h.h
    ) {
      if (window.GameAudio) GameAudio.playClick();
      stars += 1;
      starLabel.textContent = String(stars);
      spawnBurst(h.x + h.w / 2, h.y + h.h / 2, "#ffe566", 24);
      spawnBurst(h.x + h.w / 2, h.y + h.h / 2, "#ff9a2a", 14);
      shake = 10;
      statusLabel.textContent = "点到了！";
      winLevel();
      return true;
    }
    return false;
  }

  canvas.addEventListener("click", (e) => {
    if (tryClickLevel6(e.clientX, e.clientY)) return;
    if (tryClickLevel7(e.clientX, e.clientY)) return;
    if (tryClickLevel8(e.clientX, e.clientY)) return;
    tryClickEndSign(e.clientX, e.clientY);
  });

  canvas.addEventListener("mousemove", (e) => {
    if (state !== "playing") {
      canvas.style.cursor = "default";
      return;
    }
    if (
      hoverLevel6Target(e.clientX, e.clientY) ||
      hoverLevel8Target(e.clientX, e.clientY)
    ) {
      canvas.style.cursor = "pointer";
      return;
    }
    // Level 7 maces: no pointer cursor — dismantle is a secret
    if (endSign && endSign.hit) {
      const world = clientToWorld(e.clientX, e.clientY);
      const h = endSign.hit;
      const over =
        world.x >= h.x &&
        world.x <= h.x + h.w &&
        world.y >= h.y &&
        world.y <= h.y + h.h;
      canvas.style.cursor = over ? "pointer" : "default";
      return;
    }
    canvas.style.cursor = "default";
  });

  homeBtn.addEventListener("click", () => {
    playUiClick();
    if (state === "playing") goHome();
  });
  homeBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (state === "playing") goHome();
    }
  });

  logoutBtn.addEventListener("click", () => {
    playUiClick();
    stars = 0;
    playerName = "";
    starLabel.textContent = "0";
    levelLabel.textContent = "1";
    openLoginScreen();
  });

  loginSubmit.addEventListener("click", () => {
    playUiClick();
    submitLogin();
  });
  smsBtn.addEventListener("click", () => {
    playUiClick();
    sendSmsCode();
  });
  minorOk.addEventListener("click", () => {
    playUiClick();
    minorNotice.classList.add("hidden");
    loginSubmit.classList.remove("hidden");
    loginIdcard.value = "";
    showLoginError("未成年人仅可在周五至周日 20:00–21:00 游玩");
  });
  for (const tab of loginTabs) {
    tab.addEventListener("click", () => {
      playUiClick();
      setLoginMode(tab.dataset.mode);
    });
  }
  loginPass.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      submitLogin();
    }
  });
  loginUser.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      loginPass.focus();
    }
  });
  loginSms.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      submitLogin();
    }
  });
  loginPhone.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      loginSms.focus();
    }
  });
  loginIdcard.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      submitLogin();
    }
  });

  // Prep first level visuals; login is required before playing
  setupPuzzleDrag();
  makeLevel(1);
  levelLabel.textContent = "1";
  starLabel.textContent = "0";
  statusLabel.textContent = "登录";
  syncPuzzleTools();
  syncHomeBtn();
  setLoginMode("account");
  setTimeout(() => loginUser.focus(), 50);
  requestAnimationFrame(loop);
})();
