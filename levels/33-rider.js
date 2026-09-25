// 第 33 关：你胆子真是肥唧唧的 · 黄胖子袋鼠骑电车送单
window.installRider33 = function (S) {
  with (S) {
    const toast = GameLevelKit.makeToast(() => rider33Scene);

    const CAR_KINDS = [
      { kind: "car", label: "轿车", w: 70, h: 34, speed: 280, color: "#6aa0c8" },
      { kind: "bike", label: "同行", w: 44, h: 32, speed: 220, color: "#e8b84a" },
      { kind: "truck", label: "大运·重卡", w: 150, h: 52, speed: 160, color: "#c45c26" },
    ];

    // 本关道具：五角星兑换（仅第 33 关）
    // 买一次得 30 次使用次数，跨局保留
    const RIDER_ITEMS = {
      skip: { name: "跳过3000米", cost: 29 },
      ghost: { name: "穿透车辆", cost: 18 },
      boost: { name: "加速成每秒15千米", cost: 23 },
    };
    const USES_PER_BUY = 30;
    const RIDER_ITEMS_KEY = "yyy_rider_items";

    function loadRiderUses() {
      try {
        if (typeof loadJson === "function") {
          const v = loadJson(RIDER_ITEMS_KEY, null);
          if (v && typeof v === "object") {
            return {
              skip: Number(v.skip) || 0,
              ghost: Number(v.ghost) || 0,
              boost: Number(v.boost) || 0,
            };
          }
        }
      } catch (e) {
        /* ignore */
      }
      return { skip: 0, ghost: 0, boost: 0 };
    }

    function saveRiderUses(uses) {
      try {
        if (typeof saveJson === "function") saveJson(RIDER_ITEMS_KEY, uses);
      } catch (e) {
        /* ignore */
      }
    }

    // 全局使用次数（不随重开关卡清空）
    let riderUses = loadRiderUses();

    function resetRider() {
      const sc = rider33Scene;
      sc.phase = "ready";
      sc.cars = [];
      sc.spawnT = 0.8;
      sc.rideT = 0;
      sc.lane = 1;
      sc.laneY = sc.lanes[1];
      sc.winner = false;
      sc.hit = false;
      sc.rider.x = 220;
      sc.rider.y = sc.laneY;
      sc.toast = "";
      sc.toastT = 0;
      sc.skipBonus = 0;
      sc.ghost = false;
      sc.boost = false;
      // 次数跨局保留，只重置本局效果
    }

    function freezePlayer() {
      if (!player) return;
      player.vx = 0;
      player.vy = 0;
      player.x = 220;
      player.y = rider33Scene.laneY;
      player.onGround = true;
    }

    function initRider33() {
      riderUses = loadRiderUses();
      resetRider();
      freezePlayer();
      statusLabel.textContent = "按 ↑↓ 变道 · 躲开车辆 · 送货 5000 米";
      toast("黄胖子袋鼠出发！胆子肥嘟嘟也要稳", 2.5);
      showItemPad(true);
      bindItemButtons();
      syncItemPad();
    }

    function syncRider33OnLeave() {
      showItemPad(false);
      // 离开本关恢复道具栏，避免影响其它关
      const items = document.getElementById("item-bar");
      if (items) items.classList.remove("hidden");
    }

    function showItemPad(show) {
      const p = document.getElementById("lv33-item-pad");
      if (!p) return;
      p.classList.toggle("hidden", !show);
      p.setAttribute("aria-hidden", show ? "false" : "true");
    }

    function buyRiderItem(kind) {
      const sc = rider33Scene;
      const spec = RIDER_ITEMS[kind];
      if (!spec) return;
      // 不严格要求 level，避免字符串/数字对不上导致点不动
      if (!sc) {
        toast("先进入第 33 关再用道具", 1.5);
        return;
      }

      // 有次数就直接用掉 1 次
      if ((riderUses[kind] || 0) > 0) {
        if (kind === "skip") {
          sc.skipBonus += 3000;
          riderUses[kind] -= 1;
          saveRiderUses(riderUses);
          toast(`跳过 3000 米！剩余 ${riderUses[kind]} 次`, 2);
        } else if (kind === "ghost") {
          if (sc.ghost) {
            toast("本局已穿透车辆，不用再扣次数", 1.5);
          } else {
            sc.ghost = true;
            riderUses[kind] -= 1;
            saveRiderUses(riderUses);
            toast(`穿透车辆！剩余 ${riderUses[kind]} 次`, 2);
          }
        } else if (kind === "boost") {
          if (sc.boost) {
            toast("本局已加速，不用再扣次数", 1.5);
          } else {
            sc.boost = true;
            riderUses[kind] -= 1;
            saveRiderUses(riderUses);
            toast(`加速到每秒 15 千米！剩余 ${riderUses[kind]} 次`, 2);
          }
        }
        spawnBurst(sc.rider.x + 20, sc.rider.y, "#ffe566", 18);
        syncItemPad();
        return;
      }

      // 没次数：用五角星买 30 次
      if ((stars || 0) < spec.cost) {
        toast(`五角星不够，还差 ${spec.cost - (stars || 0)} 颗`, 1.8);
        return;
      }
      stars -= spec.cost;
      if (typeof saveStars === "function") saveStars();
      riderUses[kind] = (riderUses[kind] || 0) + USES_PER_BUY;
      saveRiderUses(riderUses);
      toast(`买到「${spec.name}」×${USES_PER_BUY} 次`, 2);

      // 买完立刻用 1 次
      if (kind === "skip") {
        sc.skipBonus += 3000;
        riderUses[kind] -= 1;
        saveRiderUses(riderUses);
        toast(`跳过 3000 米！剩余 ${riderUses[kind]} 次`, 2);
      } else if (kind === "ghost") {
        sc.ghost = true;
        riderUses[kind] -= 1;
        saveRiderUses(riderUses);
        toast(`穿透车辆！剩余 ${riderUses[kind]} 次`, 2);
      } else if (kind === "boost") {
        sc.boost = true;
        riderUses[kind] -= 1;
        saveRiderUses(riderUses);
        toast(`加速到每秒 15 千米！剩余 ${riderUses[kind]} 次`, 2);
      }
      spawnBurst(sc.rider.x + 20, sc.rider.y, "#ffe566", 18);
      syncItemPad();
    }

    function syncItemPad() {
      const p = document.getElementById("lv33-item-pad");
      if (!p) return;
      for (const btn of p.querySelectorAll("[data-rider-item]")) {
        const kind = btn.getAttribute("data-rider-item") || btn.dataset.riderItem;
        const spec = RIDER_ITEMS[kind];
        if (!spec) continue;
        const left = riderUses[kind] || 0;
        // 有次数就能点；没次数看五角星是否够买
        btn.disabled = left <= 0 && (stars || 0) < spec.cost;
        if (left > 0) {
          btn.textContent = `${spec.name} · 用1次（剩${left}）`;
        } else {
          btn.textContent = `${spec.name} ${spec.cost}★ 买${USES_PER_BUY}次`;
        }
      }
      const st = document.getElementById("lv33-item-stars");
      if (st) st.textContent = String(stars || 0);
    }

    function spawnCar() {
      const sc = rider33Scene;
      const pick = CAR_KINDS[Math.floor(Math.random() * CAR_KINDS.length)];
      const lane = Math.floor(Math.random() * sc.lanes.length);
      sc.cars.push({
        x: sc.rider.x + 700 + Math.random() * 400,
        y: sc.lanes[lane] + 10,
        w: pick.w,
        h: pick.h,
        vx: -pick.speed - Math.random() * 60,
        kind: pick.kind,
        label: pick.label,
        color: pick.color,
        lane,
      });
    }

    function metersDone() {
      const sc = rider33Scene;
      // 默认约 180 秒跑完；加速道具：每秒 15 千米 = 15000 米
      const rate = sc.boost ? 15000 : 28;
      return Math.min(sc.meters, Math.floor((sc.skipBonus || 0) + sc.rideT * rate));
    }

    function hitCar() {
      const sc = rider33Scene;
      if (sc.ghost) return null;
      const r = sc.rider;
      for (const c of sc.cars) {
        if (
          r.x < c.x + c.w &&
          r.x + r.w > c.x &&
          r.y < c.y + c.h &&
          r.y + r.h > c.y
        ) {
          return c;
        }
      }
      return null;
    }

    function finishRide(ok) {
      const sc = rider33Scene;
      sc.phase = "done";
      sc.winner = !!ok;
      sc.hit = !ok;
      showItemPad(false);
      if (ok) {
        statusLabel.textContent = "送达！5000 米跑完";
        toast("订单送达！客户五星好评", 2.5);
        spawnBurst(player.x + 20, player.y, "#ffe566", 24);
        if (window.GameAudio && GameAudio.playStar) GameAudio.playStar();
        if (window.LevelCoop && LevelCoop.send) {
          LevelCoop.send({ type: "rider-finish", lv: 33 });
        }
        if (state === "playing" && level === 33) winLevel();
      } else {
        statusLabel.textContent = "撞车了…订单撒了一地";
        toast("撞上了！小心大运重卡", 2.5);
        shake = 12;
        if (window.GameAudio && GameAudio.playDeath) GameAudio.playDeath();
      }
    }

    function updateRider33(dt) {
      const sc = rider33Scene;
      if (!sc || state !== "playing" || level !== 33) return;
      sc.pulse += dt;
      GameLevelKit.tickToast(sc, dt);
      if (!Array.isArray(sc.cars)) sc.cars = [];
      if (!Array.isArray(sc.lanes)) sc.lanes = [340, 390, 440];
      syncItemPad();

      if (sc.phase !== "ride") {
        freezePlayer();
        if (sc.phase === "ready") {
          statusLabel.textContent = "准备送货 · ↑↓ 变道 · 5000 米 · 左下可买道具";
        }
        return;
      }

      sc.rideT += dt;

      const up = keys.has("ArrowUp") || keys.has("w") || keys.has("W") || touch.up;
      const down = keys.has("ArrowDown") || keys.has("s") || keys.has("S") || touch.down;
      if (up && !sc._upLock) {
        sc.lane = Math.max(0, sc.lane - 1);
        sc._upLock = true;
      }
      if (!up) sc._upLock = false;
      if (down && !sc._downLock) {
        sc.lane = Math.min(sc.lanes.length - 1, sc.lane + 1);
        sc._downLock = true;
      }
      if (!down) sc._downLock = false;

      const targetY = sc.lanes[sc.lane];
      sc.laneY += (targetY - sc.laneY) * Math.min(1, dt * 12);
      sc.rider.y = sc.laneY;
      if (player) {
        player.x = sc.rider.x;
        player.y = sc.laneY;
        player.vx = 0;
        player.vy = 0;
        player.onGround = true;
      }

      sc.spawnT -= dt;
      if (sc.spawnT <= 0) {
        spawnCar();
        const t = sc.rideT;
        sc.spawnT = 0.95 - Math.min(0.45, t * 0.004) + Math.random() * 0.35;
      }

      for (let i = sc.cars.length - 1; i >= 0; i--) {
        const c = sc.cars[i];
        c.x += c.vx * dt;
        if (c.x + c.w < sc.rider.x - 200) sc.cars.splice(i, 1);
      }

      const boom = hitCar();
      if (boom) {
        spawnBurst(sc.rider.x + 18, sc.rider.y + 20, "#ff6a4a", 28);
        finishRide(false);
        return;
      }

      const m = metersDone();
      statusLabel.textContent = `${m} / ${sc.meters} 米 · 车道 ${sc.lane + 1}/3`;
      if (m >= sc.meters) {
        finishRide(true);
      }
    }

    function tryClickRider33() {
      const sc = rider33Scene;
      if (!sc || level !== 33 || state !== "playing") return false;
      if (sc.phase === "ready") {
        sc.phase = "ride";
        statusLabel.textContent = "出发！躲开路上的车";
        toast("出发！路上有同行和大运重卡", 2);
        return true;
      }
      return false;
    }

    // ── 路面 / 车辆 ──
    function drawRoad() {
      const sc = rider33Scene;
      const y0 = sc.lanes[0] - 30;
      const y1 = sc.groundY + 10;
      // 路面
      ctx.fillStyle = "#2a2e36";
      ctx.fillRect(0, y0, W, y1 - y0);
      // 车道虚线
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.setLineDash([18, 14]);
      ctx.lineWidth = 2;
      for (let i = 0; i < 2; i++) {
        const ly = (sc.lanes[i] + sc.lanes[i + 1]) / 2 + 12;
        ctx.beginPath();
        ctx.moveTo(0, ly);
        ctx.lineTo(W, ly);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      // 路缘
      ctx.fillStyle = "#c8c8c8";
      ctx.fillRect(0, y0 - 4, W, 4);
      ctx.fillRect(0, y1, W, 4);
      ctx.restore();
    }

    function drawVehicle(c) {
      const sx = c.x - cameraX;
      if (sx < -220 || sx > W + 80) return;
      ctx.save();
      ctx.fillStyle = c.color || "#6aa0c8";
      if (c.kind === "truck") {
        // 大运·重卡：长车身 + 车头
        ctx.fillRect(sx, c.y, c.w - 30, c.h);
        ctx.fillStyle = "#5a3010";
        ctx.fillRect(sx + c.w - 32, c.y + 8, 32, c.h - 8);
        ctx.fillStyle = "#888";
        ctx.fillRect(sx + 8, c.y + 8, 20, 14);
        ctx.fillStyle = "#222";
        ctx.fillRect(sx + 10, c.y + c.h - 4, 24, 10);
        ctx.fillRect(sx + c.w - 50, c.y + c.h - 4, 24, 10);
        ctx.fillStyle = "#ffb347";
        ctx.fillRect(sx + c.w - 28, c.y + 14, 18, 8);
      } else if (c.kind === "bike") {
        // 同行骑手
        ctx.fillStyle = "#e8b84a";
        ctx.fillRect(sx + 8, c.y + 6, 14, 16);
        ctx.fillStyle = "#e8c8a0";
        ctx.fillRect(sx + 10, c.y, 12, 10);
        ctx.fillStyle = "#444";
        ctx.fillRect(sx, c.y + 20, 40, 8);
        ctx.fillStyle = "#ddd";
        ctx.beginPath();
        ctx.arc(sx + 8, c.y + 28, 5, 0, Math.PI * 2);
        ctx.arc(sx + 32, c.y + 28, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ff8a3a";
        ctx.fillRect(sx + 22, c.y + 2, 12, 14);
      } else {
        // 轿车
        ctx.fillRect(sx, c.y + 6, c.w, c.h - 10);
        ctx.fillStyle = "#8ecae6";
        ctx.fillRect(sx + c.w * 0.45, c.y, c.w * 0.35, 12);
        ctx.fillStyle = "#222";
        ctx.beginPath();
        ctx.arc(sx + 14, c.y + c.h - 4, 6, 0, Math.PI * 2);
        ctx.arc(sx + c.w - 14, c.y + c.h - 4, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.font = "11px 'Noto Sans SC', sans-serif";
      ctx.fillStyle = c.kind === "truck" ? "#ffb347" : "rgba(255,255,255,0.75)";
      ctx.fillText(c.label || "", sx, c.y - 4);
      ctx.restore();
    }

    // ── 袋鼠绘制（黄胖子） ──
    // ── 袋鼠绘制（对照截图：坐姿黄胖子） ──
    function drawKangaroo(x, y, s) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s, s);

      const yellow = "#f2c94c";
      const yellowDeep = "#e8b83a";
      const yellowLight = "#f7d774";
      const belly = "#f6e7a8";
      const nose = "#c47a3a";
      const outline = "#d4a017";

      // 尾巴（右后）
      ctx.fillStyle = yellowDeep;
      ctx.beginPath();
      ctx.moveTo(18, 18);
      ctx.quadraticCurveTo(48, 8, 52, -18);
      ctx.quadraticCurveTo(42, -14, 28, 6);
      ctx.closePath();
      ctx.fill();

      // 后腿/脚（左右伸出）
      ctx.fillStyle = yellowLight;
      ctx.beginPath();
      ctx.ellipse(-34, 38, 22, 12, -0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(30, 42, 22, 12, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // 身体
      ctx.fillStyle = yellow;
      ctx.beginPath();
      ctx.ellipse(2, 14, 34, 36, 0, 0, Math.PI * 2);
      ctx.fill();

      // 大肚皮
      ctx.fillStyle = belly;
      ctx.beginPath();
      ctx.ellipse(-2, 18, 24, 26, 0, 0, Math.PI * 2);
      ctx.fill();

      // 耳朵（左短右长，像截图）
      ctx.fillStyle = yellowDeep;
      ctx.beginPath();
      ctx.ellipse(-16, -52, 10, 24, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(14, -58, 11, 28, 0.35, 0, Math.PI * 2);
      ctx.fill();
      // 耳内
      ctx.fillStyle = yellowLight;
      ctx.beginPath();
      ctx.ellipse(-16, -50, 5, 14, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(14, -56, 5, 16, 0.35, 0, Math.PI * 2);
      ctx.fill();

      // 头（略偏左，像截图）
      ctx.fillStyle = yellow;
      ctx.beginPath();
      ctx.ellipse(-4, -28, 26, 24, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // 吻部
      ctx.fillStyle = yellowLight;
      ctx.beginPath();
      ctx.ellipse(-18, -18, 14, 12, -0.35, 0, Math.PI * 2);
      ctx.fill();

      // 大棕鼻头
      ctx.fillStyle = nose;
      ctx.beginPath();
      ctx.ellipse(-22, -22, 10, 8, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // 嘴
      ctx.strokeStyle = "#b8863a";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-22, -14);
      ctx.quadraticCurveTo(-16, -10, -10, -14);
      ctx.stroke();

      // 大眼睛
      ctx.fillStyle = "#2b2118";
      ctx.beginPath();
      ctx.ellipse(-12, -38, 6.5, 8, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(8, -40, 6.5, 8, 0.1, 0, Math.PI * 2);
      ctx.fill();
      // 高光
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(-10, -40, 2.2, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(10, -42, 2.2, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // 短手抱肚皮
      ctx.fillStyle = yellow;
      ctx.beginPath();
      ctx.ellipse(-22, 4, 9, 12, -0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(18, 4, 9, 12, 0.7, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    function drawBikeAndBox(sx, y) {
      // 电动车 + 外卖箱
      ctx.save();
      // 车架
      ctx.fillStyle = "#3d8f5a";
      ctx.fillRect(sx - 4, y + 22, 52, 10);
      ctx.fillStyle = "#2e6b42";
      ctx.fillRect(sx + 8, y + 14, 28, 10);
      // 轮
      ctx.fillStyle = "#ddd";
      ctx.beginPath();
      ctx.arc(sx + 6, y + 34, 7, 0, Math.PI * 2);
      ctx.arc(sx + 42, y + 34, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#555";
      ctx.beginPath();
      ctx.arc(sx + 6, y + 34, 3, 0, Math.PI * 2);
      ctx.arc(sx + 42, y + 34, 3, 0, Math.PI * 2);
      ctx.fill();
      // 外卖箱
      ctx.fillStyle = "#ff8a3a";
      ctx.fillRect(sx + 30, y - 2, 20, 22);
      ctx.fillStyle = "#fff";
      ctx.font = "9px 'Noto Sans SC', sans-serif";
      ctx.fillText("外卖", sx + 32, y + 12);
      ctx.restore();
    }

    function drawRider() {
      const sc = rider33Scene;
      const sx = sc.rider.x - cameraX;
      const y = sc.laneY;
      drawBikeAndBox(sx, y);
      // 袋鼠坐在车上
      drawKangaroo(sx + 18, y + 2, 1);
      if (sc.ghost) {
        ctx.save();
        ctx.strokeStyle = "rgba(125,255,176,0.7)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx + 18, y + 2, 36, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      if (sc.boost) {
        ctx.save();
        ctx.strokeStyle = "rgba(255,210,74,0.55)";
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(sx - 10 - i * 12, y + 10 + i * 6);
          ctx.lineTo(sx - 28 - i * 12, y + 10 + i * 6);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    function drawBanner(text, cx, cy, w, h) {
      ctx.save();
      ctx.fillStyle = "#c62828";
      ctx.fillRect(cx - w / 2, cy, w, h);
      ctx.fillStyle = "#ffe082";
      ctx.fillRect(cx - w / 2, cy, w, 3);
      ctx.fillRect(cx - w / 2, cy + h - 3, w, 3);
      ctx.fillStyle = "#fff";
      ctx.font = "700 18px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(text, cx, cy + h / 2 + 6);
      ctx.restore();
    }

    function drawHUD() {
      const sc = rider33Scene;
      const m = metersDone();
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(W / 2 - 140, 16, 280, 36);
      ctx.fillStyle = "#ffd24a";
      ctx.font = "700 16px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${m} / 5000 米`, W / 2, 40);
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fillRect(W / 2 - 140, 56, 280, 6);
      ctx.fillStyle = "#ffd24a";
      ctx.fillRect(W / 2 - 140, 56, 280 * (m / 5000), 6);
      ctx.textAlign = "left";

      if (sc.phase === "ready") {
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, 0, W, H);
        // 开场大图：之前的黄胖子袋鼠
        drawKangaroo(W / 2, H * 0.28, 2.2);
        drawBanner("你的胆子真的是肥嘟嘟的", W / 2, H * 0.28 + 88, 360, 36);
        ctx.textAlign = "center";
        ctx.fillStyle = "#fff";
        ctx.font = "16px 'Noto Sans SC', sans-serif";
        ctx.fillText("骑电车把外卖送到客户手里", W / 2, H * 0.28 + 150);
        ctx.fillText("平面 2D · 全程 5000 米", W / 2, H * 0.28 + 178);
        ctx.fillStyle = "#ffb347";
        ctx.fillText("↑ ↓ 变道，躲开轿车、同行和大运·重卡", W / 2, H * 0.28 + 218);
        ctx.fillStyle = "#7dffb0";
        ctx.font = "700 18px 'Noto Sans SC', sans-serif";
        ctx.fillText("点击或按空格开始送货", W / 2, H * 0.28 + 258);
        ctx.textAlign = "left";
      } else if (sc.phase === "done") {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, W, H);
        drawKangaroo(W / 2, H * 0.32, 1.8);
        drawBanner(sc.winner ? "五星好评送达！" : "你的胆子真的是肥嘟嘟的", W / 2, H * 0.32 + 72, 320, 32);
        ctx.textAlign = "center";
        ctx.fillStyle = sc.winner ? "#ffe566" : "#ff8a80";
        ctx.font = "700 26px 'Noto Sans SC', sans-serif";
        ctx.fillText(sc.winner ? "送达成功！" : "撞车了…", W / 2, H * 0.32 + 130);
        ctx.fillStyle = "#fff";
        ctx.font = "14px 'Noto Sans SC', sans-serif";
        ctx.fillText(sc.winner ? "客户：五星好评！" : "再试一次，别亲大运重卡", W / 2, H * 0.32 + 160);
        ctx.textAlign = "left";
      }
      if (sc.toast) {
        ctx.save();
        ctx.textAlign = "center";
        ctx.font = "14px 'Noto Sans SC', sans-serif";
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        const tw = ctx.measureText(sc.toast).width + 24;
        ctx.fillRect(W / 2 - tw / 2, 80, tw, 30);
        ctx.fillStyle = "#ffe082";
        ctx.fillText(sc.toast, W / 2, 100);
        ctx.restore();
      }
      ctx.restore();
    }

    function drawRider33Extras() {
      const sc = rider33Scene;
      if (!sc) return;
      // 兜底画路面，避免整屏只剩背景
      try {
        drawRoad();
      } catch (err) {
        ctx.fillStyle = "#2a2e36";
        ctx.fillRect(0, 300, W, 180);
      }
      const cars = Array.isArray(sc.cars) ? sc.cars : [];
      for (const c of cars) {
        try {
          drawVehicle(c);
        } catch (err) {
          /* 单辆车绘制失败不拖垮全图 */
        }
      }
      try {
        drawRider();
      } catch (err) {
        /* 骑手绘制失败仍保留路面 */
      }
      try {
        drawHUD();
      } catch (err) {
        /* HUD 失败不挡地图 */
      }
    }

    // 道具按钮：每个按钮单独绑定点/触摸，避免被画布或其它层抢走
    function bindItemButtons() {
      const pad = document.getElementById("lv33-item-pad");
      if (!pad) return;
      const buttons = pad.querySelectorAll("[data-rider-item]");
      for (const btn of buttons) {
        if (btn._riderBound) continue;
        btn._riderBound = true;
        btn.type = "button";
        const fire = (e) => {
          if (e && e.preventDefault) e.preventDefault();
          if (e && e.stopPropagation) e.stopPropagation();
          const kind = btn.getAttribute("data-rider-item") || btn.dataset.riderItem;
          try {
            buyRiderItem(kind);
          } catch (err) {
            console.error("道具使用失败", err);
          }
        };
        btn.addEventListener("click", fire);
        btn.addEventListener("pointerup", fire);
        btn.addEventListener("touchend", fire);
      }
      pad._b = true;
    }

    bindItemButtons();

    S.initRider33 = initRider33;
    S.updateRider33 = updateRider33;
    S.drawRider33Extras = drawRider33Extras;
    S.syncRider33OnLeave = syncRider33OnLeave;
    S.tryClickRider33 = tryClickRider33;
    S.buyRiderItem = buyRiderItem;
    S.bindRiderItemButtons = bindItemButtons;
  }
};
