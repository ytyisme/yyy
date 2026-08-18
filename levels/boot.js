(() => {
  function makePlayer(x, y) {
    return {
      x,
      y,
      w: 28,
      h: 40,
      vx: 0,
      vy: 0,
      onGround: false,
      facing: 1,
      alive: true,
    };
  }

  function makeStar(x, y) {
    return { x, y, r: 18, collected: false, pulse: 0 };
  }

  const GameLevels = {
    builders: Object.create(null),
    makePlayer,
    makeStar,
    register(id, build) {
      this.builders[id] = build;
    },
    build(n, ctx) {
      const fn = this.builders[n] || this.builders[1];
      if (typeof fn !== "function") throw new Error("缺少关卡 " + n);
      fn(ctx);
    },
    plat(g, x, y, w, h, lane, extra) {
      const p = { x, y, w, h, lane: lane || "ground" };
      if (extra) Object.assign(p, extra);
      g.platforms.push(p);
      return p;
    },
    road(g, y, len, x) {
      return this.plat(g, x || 0, y, len, 28, "ground");
    },
    finish(g, opts) {
      const spawnX = opts.spawnX != null ? opts.spawnX : 80;
      const floorY = opts.floorY != null ? opts.floorY : g.startY;
      const out = {
        spawnX,
        worldMin: opts.worldMin != null ? opts.worldMin : 0,
        worldWidth: opts.worldWidth,
        player: makePlayer(spawnX, floorY - 40),
      };
      if (opts.reverseGoal != null) out.reverseGoal = opts.reverseGoal;
      if (opts.homeMode != null) out.homeMode = opts.homeMode;
      if (opts.fakeLava != null) out.fakeLava = opts.fakeLava;
      if (opts.puzzleMode != null) out.puzzleMode = opts.puzzleMode;
      if ("star" in opts) out.star = opts.star;
      else if (opts.starX != null) out.star = makeStar(opts.starX, opts.starY);
      if (opts.extra) Object.assign(out, opts.extra);
      g.set(out);
    },
    parkour(g, cfg) {
      const { mapRand, clamp, mapChance } = g;
      let x = cfg.x;
      let y = cfg.y;
      const roofY = cfg.roofY;
      for (let i = 0; i < cfg.count; i++) {
        const gap = cfg.gap[0] + mapRand(0, cfg.gap[1]);
        const w = mapRand(cfg.w[0], cfg.w[1]);
        x += gap;
        y = clamp(y + mapRand(cfg.rise[0], cfg.rise[1]), cfg.yClamp[0], cfg.yClamp[1]);
        this.plat(g, x, y, w, 28, "ground");
        if (cfg.roof && roofY != null) {
          this.plat(
            g,
            x - mapRand(cfg.roofPad ? cfg.roofPad[0] : 8, cfg.roofPad ? cfg.roofPad[1] : 40),
            roofY + mapRand(-8, 18),
            w + mapRand(cfg.roofW ? cfg.roofW[0] : 30, cfg.roofW ? cfg.roofW[1] : 100),
            22,
            "roof"
          );
        }
        if (cfg.mid === "odd" && i % 2 === 1) {
          this.plat(g, x + w * 0.25, clamp(y - 90, 200, 300), mapRand(55, 85), 22, "mid");
        } else if (cfg.mid === "third" && i % 3 === 1) {
          this.plat(g, x + w * 0.3, clamp(y - 95, 200, 300), mapRand(60, 90), 22, "mid");
        } else if (cfg.mid === "chance" && mapChance(0.35) && i < cfg.count - 2) {
          this.plat(
            g,
            x + w * 0.5 + mapRand(20, cfg.jumpLen || 90),
            clamp(y - mapRand(40, 90), 180, 400),
            mapRand(70, 110),
            24,
            "mid"
          );
        }
        x += w;
      }
      return { x, y };
    },
    zombiesBehind(g, count, startY, each) {
      for (let i = 0; i < count; i++) {
        g.pushZombie(
          Object.assign({ y: startY - 38, mode: "behind" }, typeof each === "function" ? each(i) : each || {})
        );
      }
    },
    zombiesAbove(g, count, roofY, each) {
      for (let i = 0; i < count; i++) {
        const extra = typeof each === "function" ? each(i) : each || {};
        g.pushZombie(
          Object.assign({ y: roofY - 38, mode: "above", preferRoof: true }, extra)
        );
      }
    },
    scatterPickups(g, plat, count, rng) {
      for (let i = 0; i < count; i++) {
        g.pickups.push({
          id: g.pickups.length + 1,
          x: plat.x + plat.w * ((i + 1) / (count + 1)),
          y: plat.y - 22,
          r: 8,
          collected: false,
          pulse: rng() * 5,
        });
      }
    },
  };

  window.GameLevels = GameLevels;
})();
