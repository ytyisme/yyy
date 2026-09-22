// 第 28 关：病毒爆发 · 跟科学家逃出实验室 · 僵尸在 50 米外追来
window.installLab28 = function (S) {
  with (S) {
    function labToast(msg, sec) {
      if (!labScene) return;
      labScene.toast = msg;
      labScene.toastT = sec || 2.6;
    }

    function packX() {
      if (!labScene) return 0;
      let sum = 0;
      let n = 0;
      for (const s of labScene.scientists) {
        if (s.escaped) continue;
        sum += s.x;
        n++;
      }
      if (n === 0) return labScene.exitX;
      return sum / n;
    }

    function distZombieM() {
      if (!labScene || !player || !labScene.zombies.length) return 50;
      let nearest = 1e9;
      for (const z of labScene.zombies) {
        if (!z.alive) continue;
        nearest = Math.min(nearest, player.x - (z.x + z.w));
      }
      return Math.max(0, nearest / labScene.pxPerM);
    }

    function spawnZombieWave() {
      if (!labScene) return;
      labScene.zombies = [];
      const pack = packX();
      const behind = 50 * labScene.pxPerM; // 50 米
      for (let i = 0; i < 10; i++) {
        labScene.zombies.push({
          x: pack - behind - i * 36 - Math.random() * 40,
          y: labScene.groundY - 38,
          w: 28,
          h: 38,
          speed: 135 + Math.random() * 25,
          alive: true,
          hop: Math.random() * Math.PI * 2,
        });
      }
    }

    function drawPerson(x, y, w, h, facing, shirt, pants, skin) {
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h + 3, w * 0.4, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = shirt;
      ctx.fillRect(x + 4, y + 12, w - 8, h - 22);
      ctx.fillStyle = skin || "#f0c8a0";
      ctx.fillRect(x + 5, y, w - 10, 14);
      ctx.fillStyle = "#1a1010";
      ctx.fillRect(x + (facing >= 0 ? w - 12 : 6), y + 5, 3, 3);
      ctx.fillStyle = pants || "#3a4050";
      ctx.fillRect(x + 6, y + h - 14, 5, 14);
      ctx.fillRect(x + w - 11, y + h - 14, 5, 14);
    }

    function drawBubble(cx, cy, text) {
      if (!text) return;
      ctx.save();
      ctx.font = "11px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      const tw = Math.min(160, ctx.measureText(text).width + 14);
      const bx = cx - tw / 2;
      const by = cy - 28;
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.strokeStyle = "rgba(20,20,40,0.55)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect
        ? ctx.roundRect(bx, by, tw, 20, 4)
        : ctx.rect(bx, by, tw, 20);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 4, by + 20);
      ctx.lineTo(cx, by + 26);
      ctx.lineTo(cx + 4, by + 20);
      ctx.fill();
      ctx.fillStyle = "#1a2030";
      ctx.fillText(text, cx, by + 14);
      ctx.restore();
    }

    function initLab28() {
      if (!labScene) return;
      labScene.done = false;
      labScene.toast = "";
      labScene.toastT = 0;
      labScene.followWarnT = 0;
      labScene.pulse = 0;
      labScene.siren = 0;
      for (let i = 0; i < labScene.scientists.length; i++) {
        const s = labScene.scientists[i];
        s.x = 220 + i * 48;
        s.y = labScene.groundY - s.h;
        s.vx = 0;
        s.escaped = false;
        s.chat = "";
        s.chatT = 0;
        s.chatCd = 0.3 + i * 0.4;
        s.lineIdx = i % labScene.lines.length;
        s.facing = 1;
      }
      if (player) {
        player.x = 160;
        player.y = labScene.groundY - 40;
        player.vx = 0;
        player.vy = 0;
        player.facing = 1;
      }
      spawnZombieWave();
      if (window.GameAudio && GameAudio.unlock) GameAudio.unlock();
      statusLabel.textContent = "病毒爆发 · 跟上科学家！";
      labToast("实验失败了！跟着科学家跑向出口——僵尸在约 50 米外！", 3.8);
    }

    function syncLab28OnLeave() {
      if (labScene) labScene.zombies = [];
    }

    function updateLab28(dt) {
      if (!labScene || level !== 28 || state !== "playing") return;
      labScene.pulse += dt;
      labScene.siren += dt;
      if (labScene.toastT > 0) {
        labScene.toastT -= dt;
        if (labScene.toastT <= 0) labScene.toast = "";
      }

      if (labScene.done) return;

      // 科学家冲向出口
      for (const s of labScene.scientists) {
        if (s.escaped) continue;
        s.chatCd -= dt;
        if (s.chatT > 0) {
          s.chatT -= dt;
          if (s.chatT <= 0) s.chat = "";
        } else if (s.chatCd <= 0) {
          s.chat = labScene.lines[s.lineIdx % labScene.lines.length];
          s.lineIdx++;
          s.chatT = 1.6;
          s.chatCd = 2.2 + Math.random() * 2.4;
        }

        const target = labScene.exitX + 10;
        if (s.x + s.w / 2 >= target) {
          s.escaped = true;
          s.vx = 0;
          s.chat = "";
          continue;
        }
        s.facing = 1;
        s.vx = s.speed;
        s.x += s.vx * dt;
        // 简单贴地
        s.y = labScene.groundY - s.h;
      }

      // 跟随检测：掉队太远会警告，更远则更容易被僵尸追上（僵尸加速）
      let followBoost = 1;
      if (player) {
        const px = packX();
        const lag = px - (player.x + player.w);
        if (lag > 220) {
          labScene.followWarnT += dt;
          followBoost = 1.35;
          if (labScene.followWarnT > 1.2 && (!labScene.toast || labScene.toastT < 0.3)) {
            labToast("别掉队！科学家知道出口在哪！", 1.8);
          }
        } else {
          labScene.followWarnT = Math.max(0, labScene.followWarnT - dt);
        }
      }

      // 僵尸从后方追
      for (const z of labScene.zombies) {
        if (!z.alive) continue;
        z.hop += dt * 8;
        const chaseX = player ? player.x : packX();
        if (z.x + z.w < chaseX + 40) {
          z.x += z.speed * followBoost * dt;
        }
        z.y = labScene.groundY - z.h + Math.sin(z.hop) * 1.5;
        if (player && rectsOverlap(player, { x: z.x + 4, y: z.y + 6, w: z.w - 8, h: z.h - 8 })) {
          die("zombie");
          return;
        }
      }

      // 到出口通关
      if (player && rectsOverlap(player, labScene.exit)) {
        labScene.done = true;
        statusLabel.textContent = "逃出实验室！";
        labToast("你跟着科学家逃出来了！", 2);
        if (window.GameAudio && GameAudio.playStar) GameAudio.playStar();
        stars += 1;
        saveStars();
        if (starLabel) starLabel.textContent = String(stars);
        setTimeout(() => {
          if (state === "playing" && level === 28) winLevel();
        }, 750);
        return;
      }

      const dm = distZombieM();
      statusLabel.textContent = `跟上科学家 · 僵尸约 ${dm.toFixed(0)} 米`;
    }

    function drawLabExtras() {
      if (!labScene || level !== 28) return;

      // 实验室氛围：红警灯光
      const alarm = 0.08 + 0.1 * Math.abs(Math.sin(labScene.siren * 4));
      ctx.fillStyle = `rgba(180, 20, 30, ${alarm})`;
      ctx.fillRect(0, 0, W, H);

      // 远景墙柜
      for (let i = 0; i < 12; i++) {
        const wx = 80 + i * 260 - cameraX;
        if (wx < -80 || wx > W + 80) continue;
        ctx.fillStyle = "rgba(60, 70, 90, 0.55)";
        ctx.fillRect(wx, 120, 70, 180);
        ctx.fillStyle = "rgba(120, 200, 220, 0.15)";
        ctx.fillRect(wx + 8, 130, 54, 40);
        ctx.fillRect(wx + 8, 180, 54, 40);
      }

      // 出口门
      const ex = labScene.exit;
      const doorX = ex.x - cameraX;
      ctx.fillStyle = "#2a8a40";
      ctx.fillRect(doorX, ex.y, ex.w, ex.h);
      ctx.fillStyle = "#7dff9a";
      ctx.fillRect(doorX + 8, ex.y + 10, ex.w - 16, ex.h - 24);
      ctx.fillStyle = "#ffe27a";
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("出口", doorX + ex.w / 2, ex.y - 8);

      // 科学家
      for (const s of labScene.scientists) {
        if (s.escaped) continue;
        const x = s.x - cameraX;
        if (x < -40 || x > W + 40) continue;
        drawPerson(x, s.y, s.w, s.h, s.facing, s.coat, "#2a3348", "#e8c4a0");
        // 眼镜
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 6, s.y + 4, 6, 4);
        ctx.strokeRect(x + 14, s.y + 4, 6, 4);
        drawBubble(x + s.w / 2, s.y, s.chat);
      }

      // 僵尸群
      for (const z of labScene.zombies) {
        if (!z.alive) continue;
        const x = z.x - cameraX;
        if (x < -50 || x > W + 50) continue;
        drawPerson(x, z.y, z.w, z.h, 1, "#4a6a3a", "#2a3a20", "#8aaa60");
        ctx.fillStyle = "#c04040";
        ctx.fillRect(x + 8, z.y + 6, 4, 3);
        ctx.fillRect(x + 16, z.y + 6, 4, 3);
      }

      // HUD
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(16, 12, 280, 58);
      ctx.fillStyle = "#ff8a8a";
      ctx.font = "13px 'Noto Sans SC', sans-serif";
      ctx.fillText(`僵尸距离约 ${distZombieM().toFixed(0)} 米`, 26, 34);
      ctx.fillStyle = "#ffe27a";
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      ctx.fillText("跟着科学家冲向出口！", 26, 54);

      if (labScene.toast && labScene.toastT > 0) {
        ctx.textAlign = "center";
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(0,0,0,0.75)";
        ctx.fillStyle = "#ffe27a";
        ctx.font = "14px 'Noto Sans SC', sans-serif";
        ctx.strokeText(labScene.toast, W / 2, 100);
        ctx.fillText(labScene.toast, W / 2, 100);
      }
    }

    S.initLab28 = initLab28;
    S.updateLab28 = updateLab28;
    S.drawLabExtras = drawLabExtras;
    S.syncLab28OnLeave = syncLab28OnLeave;
  }
};
