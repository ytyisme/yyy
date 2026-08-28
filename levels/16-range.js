// 第 16 关：练枪 · 射击场
window.installRange16 = function (S) {
  with (S) {
    const rangePad = document.getElementById("lv16-range-pad");
    const btnAim = document.getElementById("lv16-btn-aim");
    const btnFire = document.getElementById("lv16-btn-fire");
    const btnProne = document.getElementById("lv16-btn-prone");
    const btnSneak = document.getElementById("lv16-btn-sneak");
    const aimAdjust = document.getElementById("lv16-aim-adjust");
    const btnAimUp = document.getElementById("lv16-aim-up");
    const btnAimDown = document.getElementById("lv16-aim-down");
    const btnAimLeft = document.getElementById("lv16-aim-left");
    const btnAimRight = document.getElementById("lv16-aim-right");
    let bound = false;

    function rangeToast(msg, sec) {
      if (!rangeScene) return;
      rangeScene.toast = msg;
      rangeScene.toastT = sec || 2;
    }

    function clampAim() {
      if (!rangeScene) return;
      rangeScene.aimPitch = clamp(rangeScene.aimPitch, -48, 32);
      rangeScene.aimYaw = clamp(rangeScene.aimYaw, -36, 36);
    }

    function nudgeAim(dpitch, dyaw) {
      if (!rangeScene || !rangeScene.aiming) return;
      rangeScene.aimPitch += dpitch;
      rangeScene.aimYaw += dyaw;
      clampAim();
    }

    function syncRangePad() {
      if (!rangePad) return;
      const show = level === 16 && state === "playing" && rangeScene && !rangeScene.done;
      rangePad.classList.toggle("hidden", !show);
      rangePad.setAttribute("aria-hidden", show ? "false" : "true");
      if (btnAim) btnAim.classList.toggle("active", !!(rangeScene && rangeScene.aiming));
      if (btnProne) btnProne.classList.toggle("active", !!(rangeScene && rangeScene.prone));
      if (btnSneak) btnSneak.classList.toggle("active", !!(rangeScene && rangeScene.sneak));
      if (aimAdjust) {
        const on = !!(rangeScene && rangeScene.aiming);
        aimAdjust.classList.toggle("hidden", !on);
      }
    }

    function hideRangePad() {
      if (rangePad) {
        rangePad.classList.add("hidden");
        rangePad.setAttribute("aria-hidden", "true");
      }
      if (aimAdjust) aimAdjust.classList.add("hidden");
    }

    function toggleAim() {
      if (!rangeScene || rangeScene.done) return;
      rangeScene.aiming = !rangeScene.aiming;
      rangeScene.aimDrag = null;
      if (rangeScene.aiming) {
        if (rangeScene.aimPitch == null) rangeScene.aimPitch = -8;
        if (rangeScene.aimYaw == null) rangeScene.aimYaw = 0;
        clampAim();
        rangeToast("枪械视角 · 拖动画布或点仰角/俯角调节", 2.5);
        statusLabel.textContent = "枪械瞄准";
      } else {
        statusLabel.textContent = "练枪中";
      }
      syncRangePad();
      if (window.GameAudio) GameAudio.playClick();
    }

    function toggleProne() {
      if (!rangeScene || rangeScene.done || !player) return;
      if (rangeScene.aiming) {
        rangeToast("请先退出瞄准", 1.2);
        return;
      }
      rangeScene.prone = !rangeScene.prone;
      if (rangeScene.prone) {
        rangeScene.sneak = false;
        player.h = 22;
        player.y = rangeScene.groundY - player.h;
        rangeToast("下趴 · 移动更慢，不易被发现", 2);
        statusLabel.textContent = "下趴";
      } else {
        player.h = 40;
        player.y = rangeScene.groundY - player.h;
        statusLabel.textContent = "练枪中";
      }
      syncRangePad();
      if (window.GameAudio) GameAudio.playClick();
    }

    function toggleSneak() {
      if (!rangeScene || rangeScene.done) return;
      if (rangeScene.aiming) {
        rangeToast("请先退出瞄准", 1.2);
        return;
      }
      rangeScene.sneak = !rangeScene.sneak;
      if (rangeScene.sneak) {
        rangeScene.prone = false;
        if (player && player.h < 40) {
          player.h = 40;
          player.y = rangeScene.groundY - player.h;
        }
        rangeToast("潜行 · 脚步更轻，移动稍慢", 2);
        statusLabel.textContent = "潜行";
      } else {
        statusLabel.textContent = "练枪中";
      }
      syncRangePad();
      if (window.GameAudio) GameAudio.playClick();
    }

    function fireGun() {
      if (!rangeScene || rangeScene.done || !player) return;
      if (rangeScene.cooldown > 0) {
        rangeToast("枪管过热，稍等…", 1);
        return;
      }
      const facing = player.facing >= 0 ? 1 : -1;
      const muzzleX = player.x + (facing > 0 ? player.w + 4 : -8);
      const muzzleY = player.y + (rangeScene.prone ? 10 : rangeScene.aiming ? 14 : 18);

      let vx;
      let vy;
      let speed;
      if (rangeScene.aiming) {
        const pitch = ((rangeScene.aimPitch || 0) * Math.PI) / 180;
        const yaw = ((rangeScene.aimYaw || 0) * Math.PI) / 180;
        speed = 18;
        // 侧视：yaw 影响水平，pitch 影响上下（画布 y 向下为正）
        vx = facing * Math.cos(yaw) * Math.cos(pitch) * speed;
        vy = Math.sin(pitch) * speed;
      } else {
        speed = 11;
        vx = facing * speed;
        vy = (Math.random() - 0.5) * 1.2;
      }

      rangeScene.bullets.push({
        x: muzzleX,
        y: muzzleY,
        vx,
        vy,
        life: rangeScene.aiming ? 2.2 : 1.6,
        r: 3,
      });
      rangeScene.cooldown = rangeScene.aiming ? 0.4 : 0.55;
      rangeScene.muzzleFlash = 0.14;
      shake = Math.max(shake, rangeScene.aiming ? 4 : 5);
      if (window.GameAudio && GameAudio.playGunShot) GameAudio.playGunShot();
      else if (window.GameAudio) GameAudio.playClick();
    }

    function checkWin() {
      if (!rangeScene || rangeScene.done) return;
      const left = rangeScene.targets.filter((t) => !t.hit).length;
      if (left === 0) {
        rangeScene.done = true;
        rangeScene.aiming = false;
        syncRangePad();
        statusLabel.textContent = "靶全中！";
        rangeToast("全部命中！通关！", 2);
        setTimeout(() => winLevel(), 700);
      } else {
        statusLabel.textContent = `命中 ${rangeScene.hits}/5`;
      }
    }

    function bindRangePad() {
      if (bound) return;
      bound = true;
      if (btnAim) btnAim.addEventListener("click", () => toggleAim());
      if (btnFire) btnFire.addEventListener("click", () => fireGun());
      if (btnProne) btnProne.addEventListener("click", () => toggleProne());
      if (btnSneak) btnSneak.addEventListener("click", () => toggleSneak());

      const holdNudge = (btn, dp, dy) => {
        if (!btn) return;
        let timer = null;
        const tick = () => {
          nudgeAim(dp, dy);
          timer = setTimeout(tick, 50);
        };
        const start = (e) => {
          e.preventDefault();
          nudgeAim(dp, dy);
          timer = setTimeout(tick, 180);
        };
        const stop = () => {
          if (timer) clearTimeout(timer);
          timer = null;
        };
        btn.addEventListener("pointerdown", start);
        btn.addEventListener("pointerup", stop);
        btn.addEventListener("pointerleave", stop);
        btn.addEventListener("pointercancel", stop);
      };
      holdNudge(btnAimUp, -1.6, 0);
      holdNudge(btnAimDown, 1.6, 0);
      holdNudge(btnAimLeft, 0, -1.6);
      holdNudge(btnAimRight, 0, 1.6);

      // 枪械视角：拖动画布调节角度
      if (canvas) {
        canvas.addEventListener("pointerdown", (e) => {
          if (level !== 16 || !rangeScene || !rangeScene.aiming || rangeScene.done) return;
          if (e.button != null && e.button !== 0) return;
          rangeScene.aimDrag = { x: e.clientX, y: e.clientY };
        });
      }
      window.addEventListener(
        "pointermove",
        (e) => {
          if (!rangeScene || !rangeScene.aiming || !rangeScene.aimDrag) return;
          const dx = e.clientX - rangeScene.aimDrag.x;
          const dy = e.clientY - rangeScene.aimDrag.y;
          rangeScene.aimDrag.x = e.clientX;
          rangeScene.aimDrag.y = e.clientY;
          // 上拖仰角，下拖俯角；左右拖偏航
          nudgeAim(dy * 0.12, dx * 0.1);
        },
        { passive: true }
      );
      window.addEventListener("pointerup", () => {
        if (rangeScene) rangeScene.aimDrag = null;
      });
    }

    function initRange16() {
      bindRangePad();
      syncRangePad();
      if (rangeScene) {
        rangeScene.aiming = false;
        rangeScene.prone = false;
        rangeScene.sneak = false;
        rangeScene.aimPitch = -8;
        rangeScene.aimYaw = 0;
        rangeScene.aimDrag = null;
        rangeScene.cooldown = 0;
        rangeScene.bullets = [];
        rangeScene.hits = 0;
        rangeScene.done = false;
        rangeScene.targets.forEach((t) => {
          t.hit = false;
        });
      }
      if (player) {
        player.h = 40;
        player.y = (rangeScene ? rangeScene.groundY : 400) - 40;
      }
      statusLabel.textContent = "练枪场 · 点瞄准进入枪械视角";
      rangeToast("瞄准进入枪视角，拖动调节角度后发射", 3);
    }

    function updateRange16(dt) {
      if (!rangeScene || state !== "playing" || level !== 16) return;
      const rs = rangeScene;

      if (rs.toastT > 0) {
        rs.toastT -= dt;
        if (rs.toastT <= 0) rs.toast = "";
      }
      if (rs.cooldown > 0) rs.cooldown -= dt;
      if (rs.muzzleFlash > 0) rs.muzzleFlash -= dt;
      rs.crosshairPulse += dt * 6;

      // 键盘微调角度（瞄准时）
      if (rs.aiming) {
        const step = 40 * dt;
        if (keys.has("ArrowUp") || keys.has("w") || keys.has("W") || touch.up) nudgeAim(-step, 0);
        if (keys.has("ArrowDown") || keys.has("s") || keys.has("S") || touch.down) nudgeAim(step, 0);
        if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A") || touch.left) nudgeAim(0, -step);
        if (keys.has("ArrowRight") || keys.has("d") || keys.has("D") || touch.right) nudgeAim(0, step);
      }

      if (player && player.alive) {
        if (rs.aiming) {
          player.vx = 0;
          player.vy = Math.max(player.vy, 0);
        } else {
          let mul = 1;
          if (rs.sneak) mul *= 0.55;
          if (rs.prone) mul *= 0.3;
          player.vx *= mul;
          if (rs.prone) {
            player.vy = Math.max(player.vy, 0);
            player.h = 22;
            player.y = rs.groundY - player.h;
          }
        }
      }

      for (const t of rs.targets) {
        if (!t.hit) t.bob += dt * 2.2;
      }

      for (const b of rs.bullets) {
        b.x += b.vx;
        b.y += b.vy;
        b.life -= dt;
        for (const t of rs.targets) {
          if (t.hit) continue;
          const ty = t.y + Math.sin(t.bob) * 6;
          const dx = b.x - t.x;
          const dy = b.y - ty;
          if (dx * dx + dy * dy <= (t.r + b.r) * (t.r + b.r)) {
            t.hit = true;
            b.life = 0;
            rs.hits += 1;
            spawnBurst(t.x, ty, "#ffd24a", 16);
            spawnBurst(t.x, ty, "#ff5533", 10);
            shake = Math.max(shake, 8);
            rangeToast(`命中靶 ${t.id}！还剩 ${5 - rs.hits} 个`, 1.8);
            if (window.GameAudio) GameAudio.playStar();
            checkWin();
            break;
          }
        }
      }
      rs.bullets = rs.bullets.filter((b) => b.life > 0 && b.x > -40 && b.x < worldWidth + 40);

      syncRangePad();
    }

    function drawGunView(rs) {
      if (!player) return;
      const pitch = rs.aimPitch || 0;
      const yaw = rs.aimYaw || 0;
      const facing = player.facing >= 0 ? 1 : -1;

      // 全屏压暗 + 瞄准镜圆形视野
      ctx.fillStyle = "rgba(0,0,0,0.72)";
      ctx.fillRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2 - 20;
      const R = Math.min(W, H) * 0.38;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      // 镜内天空 / 场地
      const sky = ctx.createLinearGradient(0, cy - R, 0, cy + R);
      sky.addColorStop(0, "#6a8aaa");
      sky.addColorStop(0.55, "#8aaa6a");
      sky.addColorStop(1, "#5a6a3a");
      ctx.fillStyle = sky;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

      // 地面线随俯仰移动
      const groundLine = cy + 40 + pitch * 3.2;
      ctx.fillStyle = "#6a5a32";
      ctx.fillRect(cx - R, groundLine, R * 2, R * 2);

      // 靶子投影到枪视角（相对瞄准角）
      for (const t of rs.targets) {
        const ty = t.y + (t.hit ? 0 : Math.sin(t.bob) * 6);
        const dx = t.x - (player.x + player.w / 2);
        const dy = ty - (player.y + 14);
        const dist = Math.hypot(dx, dy) || 1;
        const angPitch = (Math.atan2(dy, Math.abs(dx)) * 180) / Math.PI;
        const angYaw = (Math.atan2(0, dx * facing) * 180) / Math.PI; // roughly
        // 更直观：水平位置用世界 x 差，垂直用 y 差，再减去当前瞄准角
        const screenX = cx + ((dx * facing) / 8 - yaw * 4.5);
        const screenY = cy + (dy / 5 - pitch * 4.5);
        const scale = clamp(180 / dist, 0.35, 1.4);
        const rad = t.r * scale * 1.3;

        if (t.hit) {
          ctx.globalAlpha = 0.35;
          ctx.fillStyle = "#666";
          ctx.beginPath();
          ctx.arc(screenX, screenY, rad, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          continue;
        }
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(screenX, screenY, rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#e74c3c";
        ctx.beginPath();
        ctx.arc(screenX, screenY, rad * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(screenX, screenY, rad * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#c0392b";
        ctx.beginPath();
        ctx.arc(screenX, screenY, rad * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffd24a";
        ctx.font = `${Math.max(10, 12 * scale)}px 'Noto Sans SC', sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(String(t.id), screenX, screenY - rad - 6);
      }

      ctx.restore();

      // 瞄准镜外框
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#555";
      ctx.lineWidth = 4;
      ctx.stroke();

      // 准星
      const pulse = 1 + Math.sin(rs.crosshairPulse) * 0.05;
      ctx.strokeStyle = "#4ade80";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 28 * pulse, cy);
      ctx.lineTo(cx - 10, cy);
      ctx.moveTo(cx + 10, cy);
      ctx.lineTo(cx + 28 * pulse, cy);
      ctx.moveTo(cx, cy - 28 * pulse);
      ctx.lineTo(cx, cy - 10);
      ctx.moveTo(cx, cy + 10);
      ctx.lineTo(cx, cy + 28 * pulse);
      ctx.stroke();
      ctx.fillStyle = "#4ade80";
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fill();

      // 底部枪身（随俯仰轻微倾斜）
      ctx.save();
      ctx.translate(cx, H - 40);
      ctx.rotate((pitch * Math.PI) / 180 * 0.35);
      ctx.fillStyle = "#2a2a2a";
      ctx.fillRect(-70, -36, 140, 70);
      ctx.fillStyle = "#444";
      ctx.fillRect(-20, -70, 40, 40);
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(-8, -110, 16, 50);
      // 枪管
      ctx.fillStyle = "#333";
      ctx.fillRect(-6, -200 - pitch * 0.8, 12, 95);
      if (rs.muzzleFlash > 0) {
        ctx.fillStyle = "#ff9a2a";
        ctx.beginPath();
        ctx.arc(0, -205 - pitch * 0.8, 16, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // HUD
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillRect(16, 16, 260, 72);
      ctx.fillStyle = "#ffd24a";
      ctx.font = "bold 14px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("枪械视角", 28, 38);
      ctx.fillStyle = "#9fe";
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      ctx.fillText(`仰俯角 ${(-pitch).toFixed(0)}° · 偏航 ${yaw.toFixed(0)}°`, 28, 58);
      ctx.fillText("拖动屏幕 / WASD / 下方按钮调节", 28, 76);

      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(W - 150, 16, 134, 36);
      ctx.fillStyle = "#5ce1ff";
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`命中 ${rs.hits}/5`, W - 83, 38);

      if (rs.toast) {
        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.fillRect(W / 2 - 180, H - 100, 360, 36);
        ctx.fillStyle = "#ffd24a";
        ctx.font = "12px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(rs.toast, W / 2, H - 76);
      }
    }

    function drawRangeExtras() {
      if (!rangeScene || level !== 16) return;
      const rs = rangeScene;
      const cam = cameraX;

      if (rs.aiming) {
        drawGunView(rs);
        return;
      }

      ctx.fillStyle = "rgba(60, 80, 50, 0.35)";
      ctx.fillRect(700 - cam, 80, 560, rs.groundY - 90);
      ctx.fillStyle = "#8a6a3a";
      ctx.fillRect(700 - cam, rs.groundY - 16, 560, 16);

      ctx.fillStyle = "#ffd24a";
      ctx.font = "bold 14px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("射击场 · 打中全部 5 个靶通关", 24, 36);
      ctx.fillStyle = "#9ab";
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      ctx.fillText(`命中 ${rs.hits}/5`, 24, 56);

      for (const t of rs.targets) {
        const ty = t.y + (t.hit ? 0 : Math.sin(t.bob) * 6);
        const sx = t.x - cam;
        ctx.strokeStyle = "#666";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sx, ty + t.r);
        ctx.lineTo(sx, rs.groundY - 8);
        ctx.stroke();
        if (t.hit) {
          ctx.fillStyle = "rgba(80,80,80,0.5)";
          ctx.beginPath();
          ctx.arc(sx, ty, t.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#888";
          ctx.font = "10px 'Noto Sans SC', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("破", sx, ty + 4);
          continue;
        }
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(sx, ty, t.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#e74c3c";
        ctx.beginPath();
        ctx.arc(sx, ty, t.r * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(sx, ty, t.r * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#c0392b";
        ctx.beginPath();
        ctx.arc(sx, ty, t.r * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffd24a";
        ctx.font = "10px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(String(t.id), sx, ty - t.r - 8);
      }

      for (const b of rs.bullets) {
        ctx.fillStyle = "#ffe566";
        ctx.beginPath();
        ctx.arc(b.x - cam, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,200,80,0.5)";
        ctx.beginPath();
        ctx.moveTo(b.x - cam - b.vx * 2, b.y - b.vy * 2);
        ctx.lineTo(b.x - cam, b.y);
        ctx.stroke();
      }

      if (rs.muzzleFlash > 0 && player) {
        const facing = player.facing >= 0 ? 1 : -1;
        const mx = player.x - cam + (facing > 0 ? player.w + 6 : -6);
        const my = player.y + (rs.prone ? 10 : 16);
        ctx.fillStyle = "#ff9a2a";
        ctx.beginPath();
        ctx.arc(mx, my, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      if (rs.prone || rs.sneak) {
        const tags = [];
        if (rs.prone) tags.push("下趴");
        if (rs.sneak) tags.push("潜行");
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(W - 140, 28, 120, 28);
        ctx.fillStyle = "#5ce1ff";
        ctx.font = "12px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(tags.join(" · "), W - 80, 46);
      }

      if (rs.toast) {
        ctx.fillStyle = "rgba(0,0,0,0.72)";
        ctx.fillRect(W / 2 - 170, H - 72, 340, 36);
        ctx.fillStyle = "#ffd24a";
        ctx.font = "12px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(rs.toast, W / 2, H - 48);
      }
    }

    function syncRange16OnLeave() {
      hideRangePad();
      if (rangeScene && player) {
        rangeScene.aiming = false;
        rangeScene.prone = false;
        rangeScene.sneak = false;
        rangeScene.aimDrag = null;
        player.h = 40;
      }
    }

    S.initRange16 = initRange16;
    S.updateRange16 = updateRange16;
    S.drawRangeExtras = drawRangeExtras;
    S.syncRange16OnLeave = syncRange16OnLeave;
  }
};
