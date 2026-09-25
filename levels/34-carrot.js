// 第 34 关：保卫萝卜 · 路径刷怪、放塔守萝卜
window.installCarrot34 = function (S) {
  with (S) {
    const toast = GameLevelKit.makeToast(() => carrot34Scene);

    const TOWERS = {
      arrow: { name: "箭塔", cost: 40, range: 120, rate: 0.7, dmg: 2, color: "#8d6e63" },
      cannon: { name: "炮塔", cost: 70, range: 100, rate: 1.4, dmg: 5, color: "#607d8b" },
      // 风扇：范围吹风，把怪物吹死
      fan: { name: "风扇", cost: 55, range: 110, rate: 0.28, dmg: 3, color: "#4fc3f7", aoe: true },
    };
    const SLOT_COST = 3;

    function resetLevel() {
      const sc = carrot34Scene;
      sc.phase = "ready";
      sc.enemies = [];
      sc.shots = [];
      sc.wave = 0;
      sc.carrot.hp = sc.carrot.maxHp;
      sc.coins = 120;
      sc.placeKind = "arrow";
      sc.placingSlot = false;
      sc.toast = "";
      sc.toastT = 0;
      sc.slots.splice(0, sc.slots.length);
      for (const [x, y] of [[800, 100], [620, 180], [720, 260], [450, 150], [250, 230]]) {
        sc.slots.push({ x, y, tower: null, open: true });
      }
    }

    function freezePlayer() {
      if (!player) return;
      player.vx = 0;
      player.vy = 0;
      player.x = 80;
      player.y = (carrot34Scene.groundY || 400) - player.h;
      player.onGround = true;
    }

    function initCarrot34() {
      resetLevel();
      freezePlayer();
      showTowerPad(true);
      statusLabel.textContent = "保卫萝卜 · 点空位放塔 · 可花 3 金币自选开新位";
      toast("开局 5 个塔位，可自己开新位、放风扇吹死怪物！", 2.8);
    }

    function syncCarrot34OnLeave() {
      const p = document.getElementById("lv34-tower-pad");
      if (p) {
        p.classList.add("hidden");
        p.setAttribute("aria-hidden", "true");
      }
      // 离开本关时恢复道具栏，避免影响其它关
      const items = document.getElementById("item-bar");
      if (items) items.classList.remove("hidden");
    }

    function showTowerPad(show) {
      const p = document.getElementById("lv34-tower-pad");
      if (p) {
        p.classList.toggle("hidden", !show);
        p.setAttribute("aria-hidden", show ? "false" : "true");
      }
      const items = document.getElementById("item-bar");
      if (items) items.classList.toggle("hidden", !!show);
    }

    function startWave() {
      const sc = carrot34Scene;
      if (sc.phase === "wave" || sc.phase === "win" || sc.phase === "lose") return;
      sc.placingSlot = false;
      sc.wave += 1;
      sc.phase = "wave";
      sc.spawnLeft = 4 + sc.wave * 2;
      sc.spawnT = 0;
      sc.waveT = 0;
      toast(`第 ${sc.wave} 波来了！`, 2);
    }

    function spawnEnemy() {
      const sc = carrot34Scene;
      const hp = 3 + sc.wave * 2;
      sc.enemies.push({
        t: 0,
        hp,
        maxHp: hp,
        // 路线变长后稍加快，避免整体拖太长
        speed: 0.18 + sc.wave * 0.02,
        x: sc.path[0].x,
        y: sc.path[0].y,
        r: 12,
      });
    }

    function pathPos(t) {
      const sc = carrot34Scene;
      const pts = sc.path;
      const segs = pts.length - 1;
      const u = Math.max(0, Math.min(1, t)) * segs;
      const i = Math.min(segs - 1, Math.floor(u));
      const lt = u - i;
      const a = pts[i];
      const b = pts[i + 1];
      return { x: a.x + (b.x - a.x) * lt, y: a.y + (b.y - a.y) * lt };
    }

    function buyTower(kind) {
      const sc = carrot34Scene;
      const spec = TOWERS[kind];
      if (!spec) return;
      sc.placingSlot = false;
      if (sc.coins < spec.cost) {
        toast("金币不够", 1.2);
        return;
      }
      sc.placeKind = kind;
      toast(`选中${spec.name} ${spec.cost}币 · 点空位放置`, 2);
    }

    // 开新塔位：自己在地图上点位置（不限数量，3 金币一个）
    function buySlot() {
      const sc = carrot34Scene;
      if (!sc) return;
      if (sc.coins < SLOT_COST) {
        toast(`开新位要 ${SLOT_COST} 金币`, 1.5);
        return;
      }
      sc.placingSlot = true;
      toast("点地图空白处，自己选新塔位（3 金币）", 2.2);
    }

    function canPlaceSlotAt(wx, wy) {
      const sc = carrot34Scene;
      if (wx < 40 || wx > 920 || wy < 40 || wy > 360) return false;
      // 不能贴着萝卜
      if (Math.hypot(wx - sc.carrot.x, wy - sc.carrot.y) < 50) return false;
      // 不能叠在已有塔位上
      for (const s of sc.slots) {
        if (Math.hypot(s.x - wx, s.y - wy) < 48) return false;
      }
      // 不能正好压在路上（允许路边）
      for (let i = 0; i < sc.path.length - 1; i++) {
        const a = sc.path[i];
        const b = sc.path[i + 1];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len2 = dx * dx + dy * dy || 1;
        let t = ((wx - a.x) * dx + (wy - a.y) * dy) / len2;
        t = Math.max(0, Math.min(1, t));
        const px = a.x + dx * t;
        const py = a.y + dy * t;
        if (Math.hypot(wx - px, wy - py) < 36) return false;
      }
      return true;
    }

    function tryPlaceNewSlot(wx, wy) {
      const sc = carrot34Scene;
      if (!sc.placingSlot) return false;
      if (sc.coins < SLOT_COST) {
        sc.placingSlot = false;
        toast("金币不够", 1.2);
        return true;
      }
      if (!canPlaceSlotAt(wx, wy)) {
        toast("这里不能放塔位，点空白处", 1.5);
        return true;
      }
      sc.coins -= SLOT_COST;
      sc.slots.push({ x: wx, y: wy, tower: null, open: true });
      sc.placingSlot = false;
      spawnBurst(wx, wy, "#7dffb0", 14);
      toast(`新开塔位！（花 ${SLOT_COST} 金币）`, 1.5);
      return true;
    }

    // 1 五角星 → 30 金币
    function tradeStarForCoins() {
      const sc = carrot34Scene;
      if (!sc) return;
      if ((stars || 0) < 1) {
        toast("五角星不够", 1.2);
        return;
      }
      stars -= 1;
      if (typeof saveStars === "function") saveStars();
      sc.coins += 30;
      spawnBurst(200, 80, "#ffe566", 16);
      toast("1 颗五角星换 30 金币！", 1.6);
    }

    function placeAtSlot(wx, wy) {
      const sc = carrot34Scene;
      const spec = TOWERS[sc.placeKind];
      if (!spec) return false;
      for (const slot of sc.slots) {
        if (Math.hypot(slot.x - wx, slot.y - wy) > 40) continue;
        if (slot.tower) {
          toast("这里已经有塔了", 1.2);
          return true;
        }
        if (sc.coins < spec.cost) {
          toast("金币不够", 1.2);
          return true;
        }
        sc.coins -= spec.cost;
        slot.tower = { kind: sc.placeKind, cd: 0 };
        spawnBurst(slot.x, slot.y, "#ffe566", 10);
        toast(`放下${spec.name}`, 1.2);
        return true;
      }
      return false;
    }

    function updateCarrot34(dt) {
      const sc = carrot34Scene;
      if (!sc || state !== "playing" || level !== 34) return;
      sc.pulse += dt;
      GameLevelKit.tickToast(sc, dt);
      freezePlayer();
      showTowerPad(true);

      if (sc.phase !== "wave") {
        statusLabel.textContent =
          sc.phase === "ready"
            ? `保卫萝卜 · 塔位 ${sc.slots.length} · 金币 ${sc.coins}${sc.placingSlot ? " · 点地图选塔位" : " · 点「开始刷怪」"}`
            : sc.phase === "win"
              ? "萝卜保住了！"
              : "萝卜被吃了…";
        return;
      }

      // 出怪
      if (sc.spawnLeft > 0) {
        sc.spawnT -= dt;
        if (sc.spawnT <= 0) {
          spawnEnemy();
          sc.spawnLeft -= 1;
          sc.spawnT = 0.7;
        }
      }

      // 怪沿路走
      for (let i = sc.enemies.length - 1; i >= 0; i--) {
        const e = sc.enemies[i];
        e.t += e.speed * dt * 0.35;
        const p = pathPos(e.t);
        e.x = p.x;
        e.y = p.y;
        if (e.t >= 1) {
          sc.enemies.splice(i, 1);
          sc.carrot.hp -= 1;
          spawnBurst(sc.carrot.x, sc.carrot.y, "#ff6a4a", 16);
          shake = 8;
          if (sc.carrot.hp <= 0) {
            sc.phase = "lose";
            toast("萝卜被啃光了！", 2.5);
            statusLabel.textContent = "失败…萝卜没了";
            return;
          }
        }
      }

      // 塔攻击
      for (const slot of sc.slots) {
        const tw = slot.tower;
        if (!tw) continue;
        const spec = TOWERS[tw.kind];
        tw.cd -= dt;
        if (tw.cd > 0) continue;

        if (spec.aoe) {
          // 风扇：吹范围内所有怪
          let hitAny = false;
          for (const e of sc.enemies) {
            const d = Math.hypot(e.x - slot.x, e.y - slot.y);
            if (d > spec.range) continue;
            hitAny = true;
            e.hp -= spec.dmg;
            // 往回吹一点
            e.t = Math.max(0, e.t - 0.012);
            sc.shots.push({
              x: slot.x,
              y: slot.y,
              tx: e.x,
              ty: e.y,
              dmg: spec.dmg,
              life: 0.18,
              wind: true,
            });
            if (e.hp <= 0) {
              sc.coins += 15;
              spawnBurst(e.x, e.y, "#b3e5fc", 12);
              const ix = sc.enemies.indexOf(e);
              if (ix >= 0) sc.enemies.splice(ix, 1);
            }
          }
          if (hitAny) {
            tw.cd = spec.rate;
            if (window.GameAudio && GameAudio.playGunShot) GameAudio.playGunShot();
          }
        } else {
          let best = null;
          let bestD = spec.range;
          for (const e of sc.enemies) {
            const d = Math.hypot(e.x - slot.x, e.y - slot.y);
            if (d < bestD) {
              bestD = d;
              best = e;
            }
          }
          if (best) {
            tw.cd = spec.rate;
            sc.shots.push({
              x: slot.x,
              y: slot.y,
              tx: best.x,
              ty: best.y,
              target: best,
              dmg: spec.dmg,
              life: 0.15,
            });
            best.hp -= spec.dmg;
            if (window.GameAudio && GameAudio.playGunShot) GameAudio.playGunShot();
            if (best.hp <= 0) {
              sc.coins += 15;
              spawnBurst(best.x, best.y, "#ffd24a", 12);
              const ix = sc.enemies.indexOf(best);
              if (ix >= 0) sc.enemies.splice(ix, 1);
            }
          }
        }
      }

      for (let i = sc.shots.length - 1; i >= 0; i--) {
        sc.shots[i].life -= dt;
        if (sc.shots[i].life <= 0) sc.shots.splice(i, 1);
      }

      // 波次结束
      if (sc.spawnLeft <= 0 && sc.enemies.length === 0) {
        if (sc.wave >= sc.maxWave) {
          sc.phase = "win";
          toast("萝卜保住了！胜利", 2.5);
          if (window.GameAudio && GameAudio.playStar) GameAudio.playStar();
          if (state === "playing" && level === 34) winLevel();
        } else {
          sc.phase = "ready";
          sc.coins += 30;
          toast(`第 ${sc.wave} 波结束 · 奖励 30 币`, 2);
        }
      }
      statusLabel.textContent = `保卫萝卜 · 波 ${sc.wave}/${sc.maxWave} · 金币 ${sc.coins} · 萝卜 ${sc.carrot.hp}/${sc.carrot.maxHp}`;
    }

    function tryClickCarrot34(cx, cy) {
      const sc = carrot34Scene;
      if (!sc || level !== 34 || state !== "playing") return false;
      if (sc.phase === "win" || sc.phase === "lose") return true;
      const world = clientToWorld(cx, cy);

      // 自选新塔位
      if (sc.placingSlot) {
        tryPlaceNewSlot(world.x, world.y);
        return true;
      }

      // 点已有空位放塔
      if (placeAtSlot(world.x, world.y)) return true;

      if (sc.phase === "ready") {
        startWave();
        return true;
      }
      return true;
    }

    // ── 绘制 ──
    function drawPath() {
      const sc = carrot34Scene;
      ctx.save();
      ctx.strokeStyle = "#5a4030";
      ctx.lineWidth = 36;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(sc.path[0].x, sc.path[0].y);
      for (let i = 1; i < sc.path.length; i++) ctx.lineTo(sc.path[i].x, sc.path[i].y);
      ctx.stroke();
      ctx.strokeStyle = "#7a5a40";
      ctx.lineWidth = 28;
      ctx.stroke();
      ctx.restore();
    }

    function drawCarrot() {
      const sc = carrot34Scene;
      const x = sc.carrot.x;
      const y = sc.carrot.y;
      ctx.save();
      ctx.fillStyle = "#ff7043";
      ctx.beginPath();
      ctx.ellipse(x, y, 18, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#66bb6a";
      ctx.beginPath();
      ctx.ellipse(x - 4, y - 24, 6, 10, -0.4, 0, Math.PI * 2);
      ctx.ellipse(x + 4, y - 24, 6, 10, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(x - 22, y + 28, 44, 6);
      ctx.fillStyle = "#7dffb0";
      ctx.fillRect(x - 22, y + 28, 44 * (sc.carrot.hp / sc.carrot.maxHp), 6);
      ctx.restore();
    }

    function drawTowers() {
      const sc = carrot34Scene;
      for (const slot of sc.slots) {
        ctx.save();
        if (!slot.tower) {
          ctx.strokeStyle = "rgba(255,210,74,0.85)";
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.strokeRect(slot.x - 22, slot.y - 22, 44, 44);
          ctx.setLineDash([]);
          ctx.fillStyle = "rgba(255,210,74,0.18)";
          ctx.fillRect(slot.x - 22, slot.y - 22, 44, 44);
          ctx.fillStyle = "rgba(255,220,120,0.9)";
          ctx.font = "700 11px 'Noto Sans SC', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("空位", slot.x, slot.y + 4);
          ctx.textAlign = "left";
        } else {
          const spec = TOWERS[slot.tower.kind];
          if (slot.tower.kind === "fan") {
            // 风扇：圆 + 扇叶
            ctx.fillStyle = "#81d4fa";
            ctx.beginPath();
            ctx.arc(slot.x, slot.y, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#0277bd";
            for (let k = 0; k < 3; k++) {
              const ang = sc.pulse * 6 + (k * Math.PI * 2) / 3;
              ctx.beginPath();
              ctx.ellipse(
                slot.x + Math.cos(ang) * 8,
                slot.y + Math.sin(ang) * 8,
                10,
                5,
                ang,
                0,
                Math.PI * 2
              );
              ctx.fill();
            }
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            ctx.arc(slot.x, slot.y, 5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = spec.color;
            ctx.fillRect(slot.x - 16, slot.y - 16, 32, 32);
            ctx.fillStyle = "#263238";
            ctx.beginPath();
            ctx.arc(slot.x, slot.y, 9, 0, Math.PI * 2);
            ctx.fill();
            if (slot.tower.kind === "cannon") {
              ctx.fillStyle = "#455a64";
              ctx.fillRect(slot.x - 5, slot.y - 26, 10, 18);
            } else {
              ctx.fillStyle = "#ffe082";
              ctx.fillRect(slot.x - 2, slot.y - 26, 4, 18);
            }
          }
        }
        ctx.restore();
      }

      // 自选塔位提示圈
      if (sc.placingSlot) {
        ctx.save();
        ctx.strokeStyle = "rgba(125,255,176,0.9)";
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        for (const s of sc.slots) {
          ctx.strokeRect(s.x - 22, s.y - 22, 44, 44);
        }
        ctx.setLineDash([]);
        ctx.restore();
      }
    }

    function drawEnemies() {
      const sc = carrot34Scene;
      for (const e of sc.enemies) {
        ctx.save();
        ctx.fillStyle = "#c62828";
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(e.x - 4, e.y - 2, 3, 0, Math.PI * 2);
        ctx.arc(e.x + 4, e.y - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fillRect(e.x - 14, e.y - 20, 28, 4);
        ctx.fillStyle = "#ff8a80";
        ctx.fillRect(e.x - 14, e.y - 20, 28 * (e.hp / e.maxHp), 4);
        ctx.restore();
      }
    }

    function drawShots() {
      const sc = carrot34Scene;
      ctx.save();
      for (const s of sc.shots) {
        if (s.wind) {
          ctx.strokeStyle = "rgba(179,229,252,0.85)";
          ctx.lineWidth = 3;
          for (let k = 0; k < 3; k++) {
            const ox = (k - 1) * 8;
            ctx.beginPath();
            ctx.moveTo(s.x + ox, s.y);
            ctx.lineTo(s.tx + ox, s.ty);
            ctx.stroke();
          }
        } else {
          ctx.strokeStyle = "#ffe566";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.tx, s.ty);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    function drawHud() {
      const sc = carrot34Scene;
      if (sc.phase === "ready") {
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(W / 2 - 180, 20, 360, 40);
        ctx.fillStyle = "#ffd24a";
        ctx.font = "700 15px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          sc.placingSlot
            ? "点地图空白处选新塔位"
            : `塔位 ${sc.slots.length} · 第 ${sc.wave + 1} 波 / 共 ${sc.maxWave} 波`,
          W / 2,
          46
        );
        ctx.textAlign = "left";
      }
    }

    function drawCarrot34Extras() {
      const sc = carrot34Scene;
      if (!sc || !Array.isArray(sc.path) || !Array.isArray(sc.slots)) return;
      // 兜底画地面，避免整屏只剩背景
      ctx.fillStyle = "#3d2b1f";
      ctx.fillRect(0, sc.groundY || 400, W, 28);
      ctx.fillStyle = "#5a4030";
      ctx.fillRect(0, sc.groundY || 400, W, 8);
      drawPath();
      drawTowers();
      drawEnemies();
      drawShots();
      drawCarrot();
      drawHud();
      if (sc.toast) {
        ctx.save();
        ctx.textAlign = "center";
        ctx.font = "14px 'Noto Sans SC', sans-serif";
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        const tw = ctx.measureText(sc.toast).width + 24;
        ctx.fillRect(W / 2 - tw / 2, 70, tw, 30);
        ctx.fillStyle = "#ffe082";
        ctx.fillText(sc.toast, W / 2, 90);
        ctx.restore();
      }
    }

    // 塔按钮
    {
      const pad = document.getElementById("lv34-tower-pad");
      if (pad && !pad._b) {
        pad._b = true;
        pad.addEventListener("click", (e) => {
          const t = e.target.closest ? e.target.closest("[data-tower34]") : null;
          if (!t) return;
          const kind = t.dataset.tower34;
          if (kind === "wave") startWave();
          else if (kind === "slot") buySlot();
          else if (kind === "star") tradeStarForCoins();
          else buyTower(kind);
        });
      }
    }

    S.initCarrot34 = initCarrot34;
    S.updateCarrot34 = updateCarrot34;
    S.drawCarrot34Extras = drawCarrot34Extras;
    S.syncCarrot34OnLeave = syncCarrot34OnLeave;
    S.tryClickCarrot34 = tryClickCarrot34;
    S.buyTower34 = buyTower;
    S.buySlot34 = buySlot;
  }
};
