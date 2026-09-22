// 第 26 关：飞机事故 · 9000 米跳伞 · 躲障碍落地过关
window.installPlane26 = function (S) {
  with (S) {
    const planeToast = GameLevelKit.makeToast(() => planeScene, 2.6);

    function wantJump() {
      return (
        keys.has(" ") ||
        keys.has("Space") ||
        keys.has("ArrowUp") ||
        keys.has("w") ||
        keys.has("W") ||
        (touch && touch.jump)
      );
    }

    function wantLeft() {
      return keys.has("ArrowLeft") || keys.has("a") || keys.has("A") || (touch && touch.left);
    }

    function wantRight() {
      return keys.has("ArrowRight") || keys.has("d") || keys.has("D") || (touch && touch.right);
    }

    function altitudeM() {
      if (!planeScene || !player) return 9000;
      const span = planeScene.groundY - planeScene.planeFloorY;
      const t = clamp((planeScene.groundY - (player.y + player.h)) / span, 0, 1);
      return Math.round(t * planeScene.altMax);
    }

    function syncCam(dt) {
      if (!planeScene || !player) return;
      const mid = player.y + player.h / 2;
      planeScene.camYTarget = clamp(H * 0.42 - mid, -(planeScene.groundY - H + 80), 60);
      planeScene.camY += (planeScene.camYTarget - planeScene.camY) * Math.min(1, dt * 5.5);
    }

    function syncLava() {
      // 岩浆面放在地面以下，避免摔死误判 / 隐藏玩家
      if (planeScene) LAVA_Y = planeScene.groundY + 400;
    }

    function stripCabinFloors() {
      for (let i = platforms.length - 1; i >= 0; i--) {
        if (platforms[i].planeCabin) platforms.splice(i, 1);
      }
    }

    function jumpOffPlane() {
      if (!planeScene || planeScene.phase !== "cabin" || !player) return;
      planeScene.phase = "falling";
      planeScene.chuteOpen = false;
      planeScene.chuteT = 0.55; // 短暂自由落体后自动开伞
      stripCabinFloors();
      player.onGround = false;
      player.vy = 40;
      player.vx = (player.facing || 1) * 40;
      // 最后一个降落伞被拿走
      if (planeScene.chutes[4]) planeScene.chutes[4].taken = true;
      shake = Math.max(shake, 8);
      planeScene.shakePlane = 0.8;
      spawnBurst(player.x + player.w / 2, player.y + player.h, "#cfe8ff", 14);
      planeToast("跳下去了！躲避障碍，安全落地！", 2.8);
      statusLabel.textContent = "自由落体 · 即将开伞";
      if (window.GameAudio && GameAudio.playJump) GameAudio.playJump();
    }

    function spawnObstacle() {
      if (!planeScene || !player) return;
      const kinds = ["crate", "wing", "bird", "cloud"];
      const kind = kinds[(Math.random() * kinds.length) | 0];
      const w = kind === "bird" ? 36 : kind === "cloud" ? 70 : kind === "wing" ? 90 : 44;
      const h = kind === "bird" ? 22 : kind === "cloud" ? 28 : kind === "wing" ? 18 : 40;
      const margin = 50;
      planeScene.obstacles.push({
        kind,
        x: margin + Math.random() * (960 - margin * 2 - w),
        y: player.y + H * 0.75 + Math.random() * 160,
        w,
        h,
        vx: (Math.random() - 0.5) * (kind === "bird" ? 120 : 40),
        rot: Math.random() * Math.PI,
      });
    }

    function initPlane26() {
      if (!planeScene) return;
      planeScene.phase = "cabin";
      planeScene.chuteOpen = false;
      planeScene.chuteT = 0;
      planeScene.jumpHeld = false;
      planeScene.obstacles = [];
      planeScene.spawnAcc = 0;
      planeScene.toast = "";
      planeScene.toastT = 0;
      planeScene.done = false;
      planeScene.shakePlane = 0;
      planeScene.wind = 0;
      planeScene.camY = 0;
      planeScene.camYTarget = 0;
      for (let i = 0; i < planeScene.chutes.length; i++) {
        planeScene.chutes[i].taken = i < 4;
      }
      if (player) {
        player.x = planeScene.cabinX + planeScene.cabinW * 0.55;
        player.y = planeScene.planeFloorY - 40;
        player.vx = 0;
        player.vy = 0;
        player.onGround = true;
        player.facing = 1;
      }
      syncLava();
      syncCam(1);
      if (window.GameAudio && GameAudio.unlock) GameAudio.unlock();
      statusLabel.textContent = "飞机事故 · 海拔 9000 米";
      planeToast("飞机损坏了！4 人已跳伞 · 按跳跃键跳下飞机", 3.6);
    }

    function syncPlane26OnLeave() {
      if (planeScene) {
        planeScene.obstacles = [];
        planeScene.phase = "cabin";
      }
    }

    function updatePlane26(dt) {
      if (!planeScene || level !== 26 || state !== "playing") return;
      syncLava();

      GameLevelKit.tickToast(planeScene, dt);
      if (planeScene.shakePlane > 0) planeScene.shakePlane -= dt;
      planeScene.wind += dt;

      // 已跳伞的 4 人继续下落（装饰）
      for (const j of planeScene.jumpers) {
        j.phase += dt * 2;
        j.x += j.vx * dt;
        j.y += j.vy * dt;
        j.vx += Math.sin(j.phase) * 20 * dt;
        if (j.y > planeScene.groundY - 40) {
          j.y = planeScene.planeFloorY + 200 + Math.random() * 400;
          j.x = 80 + Math.random() * 800;
        }
      }

      const jump = wantJump();
      if (planeScene.phase === "cabin") {
        // 舱内左右仍由主循环 moveActor；跳跃键只用于跳机
        if (jump && !planeScene.jumpHeld && player && player.onGround) {
          jumpOffPlane();
        }
        planeScene.jumpHeld = jump;
        syncCam(dt);
        statusLabel.textContent = `机舱内 · 海拔 ${altitudeM()} 米 · 跳跃跳下`;
        return;
      }

      if (planeScene.phase === "landed" || planeScene.done) {
        syncCam(dt);
        return;
      }

      // —— 下落阶段 ——
      planeScene.jumpHeld = jump;

      if (!planeScene.chuteOpen) {
        planeScene.chuteT -= dt;
        if (planeScene.chuteT <= 0) {
          planeScene.chuteOpen = true;
          planeToast("降落伞打开！左右躲避障碍", 2.2);
          statusLabel.textContent = "开伞滑翔中";
          spawnBurst(player.x + player.w / 2, player.y, "#ffe27a", 12);
          if (window.GameAudio && GameAudio.playStar) GameAudio.playStar();
        }
      }

      const left = wantLeft();
      const right = wantRight();
      const ax = (right ? 1 : 0) - (left ? 1 : 0);
      const steer = planeScene.chuteOpen ? 210 : 140;
      player.vx = ax * steer;
      if (ax) player.facing = ax;

      const g = planeScene.chuteOpen ? 220 : 520;
      const vmax = planeScene.chuteOpen ? 155 : 420;
      player.vy += g * dt;
      player.vy = Math.min(player.vy, vmax);
      // 开伞后略受风
      if (planeScene.chuteOpen) {
        player.vx += Math.sin(planeScene.wind * 1.7) * 18;
      }

      player.x += player.vx * dt;
      player.y += player.vy * dt;
      player.x = clamp(player.x, 20, 960 - player.w - 20);
      player.onGround = false;

      // 障碍
      planeScene.spawnAcc += dt;
      const spawnEvery = planeScene.chuteOpen ? 0.85 : 0.55;
      if (planeScene.spawnAcc >= spawnEvery) {
        planeScene.spawnAcc = 0;
        if (player.y < planeScene.groundY - 280) spawnObstacle();
      }
      for (const o of planeScene.obstacles) {
        o.x += o.vx * dt;
        o.rot += dt * 1.2;
        if (o.x < 10 || o.x + o.w > 950) o.vx *= -1;
      }
      planeScene.obstacles = planeScene.obstacles.filter(
        (o) => o.y > player.y - 80 && o.y < player.y + H + 200
      );

      for (const o of planeScene.obstacles) {
        const box = { x: o.x + 4, y: o.y + 4, w: o.w - 8, h: o.h - 8 };
        const pb = { x: player.x + 4, y: player.y + 6, w: player.w - 8, h: player.h - 10 };
        if (rectsOverlap(pb, box)) {
          die(o.kind === "bird" ? "spike" : "lava");
          return;
        }
      }

      // 落地
      if (player.y + player.h >= planeScene.groundY) {
        player.y = planeScene.groundY - player.h;
        player.vy = 0;
        player.vx = 0;
        player.onGround = true;
        planeScene.phase = "landed";
        planeScene.done = true;
        planeScene.obstacles = [];
        statusLabel.textContent = "安全着陆！";
        planeToast("成功落地 · 通关！", 2);
        spawnBurst(player.x + player.w / 2, player.y + player.h, "#7dff9a", 18);
        if (window.GameAudio && GameAudio.playStar) GameAudio.playStar();
        stars += 1;
        saveStars();
        if (starLabel) starLabel.textContent = String(stars);
        setTimeout(() => {
          if (state === "playing" && level === 26) winLevel();
        }, 750);
      } else {
        statusLabel.textContent = `海拔 ${altitudeM()} 米 · ${
          planeScene.chuteOpen ? "开伞中" : "自由落体"
        }`;
      }

      syncCam(dt);
    }

    function drawChuteAt(x, y, open, color) {
      if (open) {
        ctx.fillStyle = color || "#e8f4ff";
        ctx.beginPath();
        ctx.ellipse(x, y - 28, 28, 16, 0, Math.PI, 0);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 22, y - 24);
        ctx.lineTo(x - 6, y);
        ctx.moveTo(x + 22, y - 24);
        ctx.lineTo(x + 6, y);
        ctx.moveTo(x, y - 28);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else {
        ctx.fillStyle = "#6a7a90";
        ctx.fillRect(x - 8, y - 14, 16, 18);
      }
    }

    function drawPlaneExtras() {
      if (!planeScene || level !== 26) return;
      const cam = planeScene.camY | 0;

      // 世界坐标绘制（外层已 translate camY）
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      for (let i = 0; i < 10; i++) {
        const cy = ((i * 340 + time * 12) % (planeScene.groundY + 200)) - 40;
        const cx = 60 + (i * 97) % 820;
        ctx.beginPath();
        ctx.ellipse(cx - cameraX, cy, 50 + (i % 3) * 12, 16, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      if (planeScene.phase === "cabin" || (player && player.y < planeScene.planeFloorY + 240)) {
        const px = planeScene.cabinX - 40 - cameraX;
        const py = planeScene.planeFloorY - 70;
        const shakeX = planeScene.shakePlane > 0 ? Math.sin(time * 40) * 3 : Math.sin(time * 8) * 1.2;
        ctx.save();
        ctx.translate(shakeX, 0);
        ctx.fillStyle = "#8a93a8";
        ctx.fillRect(px, py + 40, planeScene.cabinW + 80, 50);
        ctx.fillStyle = "#5a6478";
        ctx.fillRect(px + 20, py + 20, planeScene.cabinW + 40, 28);
        ctx.fillStyle = "#6a7388";
        ctx.fillRect(px - 60, py + 52, 70, 14);
        ctx.fillRect(px + planeScene.cabinW + 70, py + 52, 70, 14);
        ctx.strokeStyle = "#2a1820";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(px + 120, py + 28);
        ctx.lineTo(px + 150, py + 55);
        ctx.lineTo(px + 190, py + 40);
        ctx.stroke();
        ctx.fillStyle = "rgba(40,20,20,0.55)";
        ctx.fillRect(px + 200, py + 44, 36, 18);
        ctx.fillStyle = "#9ad8ff";
        for (let i = 0; i < 5; i++) {
          ctx.fillRect(px + 50 + i * 90, py + 28, 28, 14);
        }
        ctx.restore();

        for (let i = 0; i < planeScene.chutes.length; i++) {
          const c = planeScene.chutes[i];
          const x = c.x - cameraX;
          const y = c.y;
          ctx.fillStyle = "#3a4050";
          ctx.fillRect(x - 14, y + 20, 28, 8);
          if (!c.taken) {
            ctx.fillStyle = "#d8e8ff";
            ctx.fillRect(x - 10, y, 20, 22);
            ctx.fillStyle = "#ffe27a";
            ctx.font = "10px 'Noto Sans SC', sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("伞", x, y - 4);
          } else {
            ctx.fillStyle = "rgba(255,120,100,0.7)";
            ctx.font = "10px 'Noto Sans SC', sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("空", x, y + 14);
          }
        }
      }

      for (const j of planeScene.jumpers) {
        if (!player || j.y < player.y - 120 || j.y > player.y + H + 100) continue;
        const x = j.x - cameraX;
        const y = j.y;
        drawChuteAt(x + 10, y, true, "#c8dff5");
        ctx.fillStyle = "#ffb090";
        ctx.fillRect(x + 4, y, 14, 18);
      }

      for (const o of planeScene.obstacles) {
        const x = o.x - cameraX;
        const y = o.y;
        const sy = y + cam;
        if (sy < -50 || sy > H + 50) continue;
        ctx.save();
        ctx.translate(x + o.w / 2, y + o.h / 2);
        ctx.rotate(o.rot * 0.15);
        if (o.kind === "crate") {
          ctx.fillStyle = "#8a5a2b";
          ctx.fillRect(-o.w / 2, -o.h / 2, o.w, o.h);
          ctx.strokeStyle = "#3a2010";
          ctx.strokeRect(-o.w / 2 + 2, -o.h / 2 + 2, o.w - 4, o.h - 4);
        } else if (o.kind === "wing") {
          ctx.fillStyle = "#6a7388";
          ctx.fillRect(-o.w / 2, -o.h / 2, o.w, o.h);
          ctx.fillStyle = "#ff5533";
          ctx.fillRect(-o.w / 2, -2, o.w, 4);
        } else if (o.kind === "bird") {
          ctx.fillStyle = "#2a2a30";
          ctx.beginPath();
          ctx.ellipse(0, 0, o.w / 2, o.h / 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#1a1a20";
          ctx.beginPath();
          ctx.moveTo(-o.w / 2, 0);
          ctx.quadraticCurveTo(0, -16, o.w / 2, 0);
          ctx.stroke();
        } else {
          ctx.fillStyle = "rgba(255,255,255,0.55)";
          ctx.beginPath();
          ctx.ellipse(0, 0, o.w / 2, o.h / 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#4a5568";
          ctx.fillRect(-8, -4, 16, 12);
        }
        ctx.restore();
      }

      const gy = planeScene.groundY;
      if (gy + cam < H + 40) {
        ctx.fillStyle = "#3a7a38";
        ctx.fillRect(0, gy, W, 220);
        ctx.fillStyle = "#2a5a28";
        ctx.fillRect(0, gy, W, 10);
        ctx.fillStyle = "#c8e89a";
        for (let i = 0; i < 20; i++) {
          ctx.fillRect((i * 53) % W, gy + 14 + (i % 5) * 8, 4, 8);
        }
      }

      if (player && planeScene.phase === "falling") {
        const x = player.x - cameraX + player.w / 2;
        const y = player.y;
        drawChuteAt(x, y, planeScene.chuteOpen, "#ffe27a");
      }

      // HUD 抵消 cam，固定屏幕
      ctx.save();
      ctx.translate(0, -cam);
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(16, 12, 250, 58);
      ctx.fillStyle = "#e8f4ff";
      ctx.font = "13px 'Noto Sans SC', sans-serif";
      ctx.fillText(`海拔 ${altitudeM()} 米`, 26, 34);
      ctx.fillStyle = "#ffe27a";
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      if (planeScene.phase === "cabin") {
        ctx.fillText("按跳跃键跳下飞机", 26, 54);
      } else if (planeScene.phase === "falling") {
        ctx.fillText(planeScene.chuteOpen ? "左右躲避 · 目标：落地" : "开伞中…", 26, 54);
      } else {
        ctx.fillText("安全着陆", 26, 54);
      }

      if (planeScene.toast && planeScene.toastT > 0) {
        ctx.textAlign = "center";
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(0,0,0,0.75)";
        ctx.fillStyle = "#ffe27a";
        ctx.font = "14px 'Noto Sans SC', sans-serif";
        ctx.strokeText(planeScene.toast, W / 2, 100);
        ctx.fillText(planeScene.toast, W / 2, 100);
      }
      ctx.restore();
    }

    S.initPlane26 = initPlane26;
    S.updatePlane26 = updatePlane26;
    S.drawPlaneExtras = drawPlaneExtras;
    S.syncPlane26OnLeave = syncPlane26OnLeave;
  }
};
