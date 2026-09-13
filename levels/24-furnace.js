// 第 24 关：倒计时熔炉 · 岩浆上涨 · 向上建造 · 集星开传送门
window.installFurnace24 = function (S) {
  with (S) {
    function furnaceToast(msg, sec) {
      if (!furnaceScene) return;
      furnaceScene.toast = msg;
      furnaceScene.toastT = sec || 2.4;
    }

    function wantPlace() {
      return (
        keys.has("KeyM") ||
        keys.has("m") ||
        keys.has("M") ||
        keys.has("KeyE") ||
        keys.has("e") ||
        keys.has("E") ||
        keys.has("ArrowDown") ||
        keys.has("s") ||
        keys.has("S") ||
        (touch && touch.dig) ||
        (touch && touch.down)
      );
    }

    function syncCam(dt) {
      if (!furnaceScene || !player) return;
      const mid = player.y + player.h / 2;
      furnaceScene.camYTarget = clamp(H * 0.55 - mid, -furnaceScene.floorY + H - 40, 40);
      furnaceScene.camY += (furnaceScene.camYTarget - furnaceScene.camY) * Math.min(1, dt * 5);
    }

    function overlapPlat(box) {
      for (const p of platforms) {
        if (rectsOverlap(box, p)) return true;
      }
      return false;
    }

    function tryPlaceBlock() {
      if (!furnaceScene || !player || furnaceScene.done || furnaceScene.placeCd > 0) return;
      const bw = furnaceScene.blockW;
      const bh = furnaceScene.blockH;
      const facing = player.facing >= 0 ? 1 : -1;
      let x;
      let y;
      if (player.onGround) {
        // 站立时往前上方搭一级（约半个跳跃高度），方便接着跳上去
        x = player.x + player.w / 2 + facing * (bw * 0.85) - bw / 2;
        y = player.y + player.h - 70;
      } else {
        x = player.x + player.w / 2 + facing * (player.w * 0.6 + bw * 0.35) - bw / 2;
        y = player.y + player.h - bh;
      }
      x = Math.round(x / 4) * 4;
      y = Math.round(y / 2) * 2;

      // 限制在竖井内
      x = clamp(x, 120, 960 - 120 - bw);
      y = clamp(y, furnaceScene.topY + 40, furnaceScene.floorY - bh);

      const box = { x, y, w: bw, h: bh };
      if (overlapPlat(box)) {
        // 再试脚下
        const under = {
          x: Math.round((player.x + player.w / 2 - bw / 2) / 4) * 4,
          y: Math.round((player.y + player.h) / 2) * 2,
          w: bw,
          h: bh,
        };
        under.x = clamp(under.x, 120, 960 - 120 - bw);
        if (overlapPlat(under)) {
          furnaceToast("这里放不下", 1);
          furnaceScene.placeCd = 0.2;
          return;
        }
        Object.assign(box, under);
      }

      platforms.push({
        x: box.x,
        y: box.y,
        w: box.w,
        h: box.h,
        lane: "ground",
        theme: "furnaceBrick",
        furnaceBuilt: true,
      });
      furnaceScene.placeCd = 0.22;
      spawnBurst(box.x + box.w / 2, box.y, "#c4b48a", 8);
      if (window.GameAudio && GameAudio.playClick) GameAudio.playClick();
      statusLabel.textContent = "放置方块 · 往上逃！";
    }

    function syncLavaY() {
      if (!furnaceScene) return;
      // 用本关岩浆面驱动全局 LAVA_Y，避免 fakeLava「掉出屏幕=烫死」误杀
      LAVA_Y = furnaceScene.lavaY;
    }

    function riseLava() {
      if (!furnaceScene || furnaceScene.done) return;
      if (furnaceScene.layersRisen >= furnaceScene.maxLayers) return;
      furnaceScene.lavaY -= furnaceScene.layer;
      furnaceScene.layersRisen += 1;
      furnaceScene.riseT = furnaceScene.riseEvery;
      syncLavaY();
      shake = Math.max(shake, 8);
      spawnBurst(480, furnaceScene.lavaY, "#ff6a2a", 16);
      furnaceToast(`岩浆上涨！下一波 ${furnaceScene.riseEvery | 0} 秒后`, 2.2);
      statusLabel.textContent = `倒计时熔炉 · 岩浆已涨 ${furnaceScene.layersRisen} 层`;
      if (window.GameAudio && GameAudio.playClick) GameAudio.playClick();
    }

    function spawnLavaStar() {
      if (!furnaceScene) return;
      const x = 160 + Math.random() * 640;
      furnaceScene.pickups.push({
        id: furnaceScene.nextStarId++,
        x,
        y: furnaceScene.lavaY - 16,
        r: 14,
        collected: false,
        pulse: Math.random() * Math.PI,
        onLava: true,
      });
    }

    function collectPickup(p) {
      if (!p || p.collected) return;
      p.collected = true;
      furnaceScene.starsGot += 1;
      stars += 1;
      saveStars();
      if (starLabel) starLabel.textContent = String(stars);
      spawnBurst(p.x, p.y, "#ffe566", 14);
      if (window.GameAudio && GameAudio.playStar) GameAudio.playStar();
      furnaceToast(`五角星 ${furnaceScene.starsGot}/${furnaceScene.needStars}`, 1.4);
      if (!furnaceScene.portalOpen && furnaceScene.starsGot >= furnaceScene.needStars) {
        furnaceScene.portalOpen = true;
        furnaceToast("传送门已激活！冲向顶点", 2.6);
        statusLabel.textContent = "传送门已开启";
      } else {
        statusLabel.textContent = `倒计时熔炉 · 星星 ${furnaceScene.starsGot}/${furnaceScene.needStars}`;
      }
    }

    function tryEnterPortal() {
      if (!furnaceScene || furnaceScene.done || !player) return;
      const p = furnaceScene.portal;
      const box = { x: p.x, y: p.y, w: p.w, h: p.h };
      if (!rectsOverlap(player, box)) return;
      if (!furnaceScene.portalOpen) {
        furnaceToast(`还要 ${furnaceScene.needStars - furnaceScene.starsGot} 颗五角星才能开启`, 1.6);
        return;
      }
      furnaceScene.done = true;
      statusLabel.textContent = "逃出熔炉！";
      furnaceToast("倒计时熔炉通关！", 2);
      if (window.GameAudio && GameAudio.playStar) GameAudio.playStar();
      setTimeout(() => {
        if (state === "playing" && level === 24) winLevel();
      }, 700);
    }

    function drawStarShape(cx, cy, r, fill) {
      GameUtil.drawStarShape(ctx, cx, cy, r, fill);
    }

    function initFurnace24() {
      if (!furnaceScene) return;
      furnaceScene.riseT = furnaceScene.riseEvery;
      furnaceScene.lavaY = furnaceScene.floorY + 28;
      furnaceScene.layersRisen = 0;
      syncLavaY();
      furnaceScene.camY = 0;
      furnaceScene.camYTarget = 0;
      furnaceScene.starsGot = 0;
      furnaceScene.portalOpen = false;
      furnaceScene.done = false;
      furnaceScene.toast = "";
      furnaceScene.toastT = 0;
      furnaceScene.placeCd = 0;
      furnaceScene.placeHeld = false;
      furnaceScene.lavaStarT = 6;
      furnaceScene.pulse = 0;
      for (const p of furnaceScene.pickups) {
        if (p.onLava) p.collected = true;
        else p.collected = false;
      }
      furnaceScene.pickups = furnaceScene.pickups.filter((p) => !p.onLava);
      // 清掉上一局建造的砖
      for (let i = platforms.length - 1; i >= 0; i--) {
        if (platforms[i].furnaceBuilt) platforms.splice(i, 1);
      }
      if (player) {
        player.x = 460;
        player.y = furnaceScene.floorY - 42;
        player.vx = 0;
        player.vy = 0;
      }
      if (window.GameAudio && GameAudio.unlock) GameAudio.unlock();
      statusLabel.textContent = "倒计时熔炉 · 每 30 秒岩浆上涨";
      furnaceToast("M/↓ 放置方块往上逃 · 集齐 3 星开传送门", 3.5);
    }

    function syncFurnace24OnLeave() {}

    function updateFurnace24(dt) {
      if (!furnaceScene || level !== 24 || state !== "playing") return;

      furnaceScene.pulse += dt;
      if (furnaceScene.toastT > 0) {
        furnaceScene.toastT -= dt;
        if (furnaceScene.toastT <= 0) furnaceScene.toast = "";
      }
      if (furnaceScene.placeCd > 0) furnaceScene.placeCd -= dt;

      syncCam(dt);
      syncLavaY();

      if (!furnaceScene.done) {
        furnaceScene.riseT -= dt;
        if (furnaceScene.riseT <= 0) riseLava();

        furnaceScene.lavaStarT -= dt;
        if (furnaceScene.lavaStarT <= 0) {
          spawnLavaStar();
          furnaceScene.lavaStarT = 7 + Math.random() * 5;
        }

        // 岩浆面上的星跟随液面
        for (const p of furnaceScene.pickups) {
          if (p.collected || !p.onLava) continue;
          p.y = furnaceScene.lavaY - 16;
          p.pulse += dt * 4;
        }

        const place = wantPlace();
        if (place && !furnaceScene.placeHeld) tryPlaceBlock();
        furnaceScene.placeHeld = place;

        // 捡星
        if (player) {
          for (const p of furnaceScene.pickups) {
            if (p.collected) continue;
            p.pulse += dt * 4;
            const box = { x: p.x - p.r, y: p.y - p.r, w: p.r * 2, h: p.r * 2 };
            if (rectsOverlap(player, box)) collectPickup(p);
          }
          tryEnterPortal();
        }
      }
    }

    function drawFurnaceExtras() {
      if (!furnaceScene || level !== 24) return;
      const cam = furnaceScene.camY;
      const lavaY = furnaceScene.lavaY;

      // 竖井氛围（世界坐标，外层已 translate camY）
      ctx.fillStyle = "rgba(40, 12, 8, 0.25)";
      ctx.fillRect(116 - cameraX, furnaceScene.topY, 728, furnaceScene.floorY - furnaceScene.topY);

      const ly = lavaY;
      const screenLy = ly + cam;
      if (screenLy < H + 40) {
        const grad = ctx.createLinearGradient(0, ly - 10, 0, ly + H);
        grad.addColorStop(0, "#ffb347");
        grad.addColorStop(0.25, "#ff5a1f");
        grad.addColorStop(1, "#8a1400");
        ctx.fillStyle = grad;
        ctx.fillRect(116 - cameraX, ly, 728, H + 120);

        ctx.beginPath();
        ctx.moveTo(116 - cameraX, ly);
        for (let x = 116; x <= 844; x += 14) {
          const wave = Math.sin(x * 0.05 + time * 4) * 5 + Math.sin(x * 0.02 + time * 2) * 3;
          ctx.lineTo(x - cameraX, ly + wave);
        }
        ctx.lineTo(844 - cameraX, ly + H + 40);
        ctx.lineTo(116 - cameraX, ly + H + 40);
        ctx.closePath();
        ctx.fillStyle = "rgba(255, 220, 80, 0.32)";
        ctx.fill();

        const glow = ctx.createLinearGradient(0, ly - 50, 0, ly);
        glow.addColorStop(0, "rgba(255,80,20,0)");
        glow.addColorStop(1, "rgba(255,60,10,0.3)");
        ctx.fillStyle = glow;
        ctx.fillRect(116 - cameraX, ly - 50, 728, 50);
      }

      for (const p of furnaceScene.pickups) {
        if (p.collected) continue;
        const sx = p.x - cameraX;
        const sy = p.y + Math.sin(p.pulse) * 4;
        if (sy + cam < -30 || sy + cam > H + 30) continue;
        ctx.save();
        ctx.shadowColor = "rgba(255,220,80,0.55)";
        ctx.shadowBlur = 12;
        drawStarShape(sx, sy, p.r, "#ffd24a");
        ctx.restore();
      }

      const portal = furnaceScene.portal;
      const px = portal.x - cameraX;
      const py = portal.y;
      const open = furnaceScene.portalOpen;
      ctx.fillStyle = open ? "rgba(80, 200, 255, 0.35)" : "rgba(60, 60, 80, 0.45)";
      ctx.fillRect(px, py, portal.w, portal.h);
      const ring = ctx.createRadialGradient(
        px + portal.w / 2,
        py + portal.h / 2,
        6,
        px + portal.w / 2,
        py + portal.h / 2,
        40
      );
      ring.addColorStop(0, open ? "rgba(180,255,255,0.8)" : "rgba(120,120,140,0.35)");
      ring.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = ring;
      ctx.beginPath();
      ctx.ellipse(px + portal.w / 2, py + portal.h / 2, 36, 28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = open ? "#7ef0ff" : "#666880";
      ctx.lineWidth = 3;
      ctx.strokeRect(px + 4, py + 4, portal.w - 8, portal.h - 8);
      ctx.fillStyle = open ? "#e8ffff" : "#aaa";
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(open ? "传送门 · 已激活" : `传送门 · 需${furnaceScene.needStars}星`, px + portal.w / 2, py - 8);

      // HUD（抵消 cam 平移，固定在屏幕上）
      ctx.save();
      ctx.translate(0, -cam);
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(16, 12, 230, 64);
      ctx.fillStyle = "#ffe27a";
      ctx.font = "13px 'Noto Sans SC', sans-serif";
      ctx.fillText(`五角星 ${furnaceScene.starsGot}/${furnaceScene.needStars}`, 26, 34);
      ctx.fillText(`岩浆上涨倒计时 ${Math.max(0, Math.ceil(furnaceScene.riseT))}s`, 26, 54);
      ctx.fillStyle = "rgba(255,200,160,0.85)";
      ctx.font = "11px 'Noto Sans SC', sans-serif";
      ctx.fillText("M / ↓ 放置方块", 26, 70);

      if (furnaceScene.toast && furnaceScene.toastT > 0) {
        ctx.textAlign = "center";
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(0,0,0,0.75)";
        ctx.fillStyle = "#ffe27a";
        ctx.font = "14px 'Noto Sans SC', sans-serif";
        ctx.strokeText(furnaceScene.toast, W / 2, 100);
        ctx.fillText(furnaceScene.toast, W / 2, 100);
      }
      ctx.restore();
    }

    S.initFurnace24 = initFurnace24;
    S.updateFurnace24 = updateFurnace24;
    S.drawFurnaceExtras = drawFurnaceExtras;
    S.syncFurnace24OnLeave = syncFurnace24OnLeave;
    S.furnaceCamY = () => (furnaceScene ? furnaceScene.camY : 0);
  }
};
