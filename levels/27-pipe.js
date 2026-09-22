// 第 27 关：钢管大战 · 吃豆升级 · 挑战超级钢管 BOSS
window.installPipe27 = function (S) {
  with (S) {
    const bossBtn = document.getElementById("lv27-boss-btn");

    function pipeToast(msg, sec) {
      if (!pipeScene) return;
      pipeScene.toast = msg;
      pipeScene.toastT = sec || 2.4;
    }

    function syncBossBtn() {
      if (!bossBtn) return;
      const show =
        state === "playing" &&
        level === 27 &&
        pipeScene &&
        !pipeScene.bossSummoned &&
        !pipeScene.done;
      bossBtn.classList.toggle("hidden", !show);
      bossBtn.setAttribute("aria-hidden", show ? "false" : "true");
    }

    function pipeScale(lv) {
      // 体积随等级无限增长（无上限）
      const n = Math.max(1, lv);
      return Math.max(0.55, 0.4 + Math.log10(n) * 0.65 + Math.pow(n, 0.28) * 0.012);
    }

    function resizePlayerPipe() {
      if (!player || !pipeScene) return;
      const s = pipeScale(pipeScene.level);
      const feet = player.y + player.h;
      player.w = Math.max(10, Math.round(18 * s));
      player.h = Math.max(16, Math.round(36 * s));
      player.y = pipeScene.groundY - player.h;
      // 超大时仍尽量留在地图内
      if (worldWidth) {
        player.x = clamp(player.x, 0, Math.max(0, worldWidth - player.w));
      }
    }

    const beanColors = ["#ff4d5a", "#3ecf5a", "#ff9a2a", "#b46aff", "#5ce1ff", "#ffe27a"];

    function respawnBean(bean) {
      bean.taken = false;
      bean.x = 60 + Math.random() * Math.max(200, (worldWidth || 2200) - 120);
      bean.y = pipeScene.groundY - 14 - Math.random() * 10;
      bean.color = beanColors[(Math.random() * beanColors.length) | 0];
      bean.id = (bean.id || 0) + 1000 + ((Math.random() * 1000) | 0);
    }

    function summonBoss() {
      if (!pipeScene || pipeScene.bossSummoned || pipeScene.done) return;
      pipeScene.bossSummoned = true;
      const s = pipeScale(10000);
      const bw = Math.round(28 * s);
      const bh = Math.round(56 * s);
      pipeScene.boss = {
        x: Math.min((player ? player.x : 400) + 280, worldWidth - bw - 40),
        y: pipeScene.groundY - bh,
        w: bw,
        h: bh,
        level: 10000,
        vx: 0,
        facing: -1,
        alive: true,
        atkCd: 1.0,
        pulse: 0,
      };
      shake = Math.max(shake, 10);
      spawnBurst(pipeScene.boss.x + bw / 2, pipeScene.boss.y + bh / 2, "#ff3355", 24);
      pipeToast("超级钢管出现！等级 10000", 2.8);
      statusLabel.textContent = "超级钢管 · Lv.10000";
      syncBossBtn();
      if (window.GameAudio && GameAudio.playPipeClang) GameAudio.playPipeClang();
      else if (window.GameAudio && GameAudio.playClick) GameAudio.playClick();
    }

    function wantAttack() {
      return (
        keys.has(" ") ||
        keys.has("Space") ||
        keys.has("ArrowUp") ||
        keys.has("w") ||
        keys.has("W") ||
        keys.has("KeyJ") ||
        keys.has("j") ||
        keys.has("J") ||
        (touch && touch.jump)
      );
    }

    function tryAttackBoss() {
      if (!pipeScene || !pipeScene.boss || !pipeScene.boss.alive || !player) return;
      if (pipeScene.atkCd > 0) return;
      const b = pipeScene.boss;
      const reach = {
        x: player.x - 10,
        y: player.y,
        w: player.w + 20,
        h: player.h,
      };
      if (!rectsOverlap(reach, b)) return;
      pipeScene.atkCd = 0.35;

      if (pipeScene.level > b.level) {
        b.alive = false;
        pipeScene.done = true;
        spawnBurst(b.x + b.w / 2, b.y + b.h / 2, "#ffe27a", 28);
        shake = Math.max(shake, 12);
        pipeToast("等级碾压！秒掉超级钢管！", 2.2);
        statusLabel.textContent = "钢管大战通关！";
        if (window.GameAudio && GameAudio.playStar) GameAudio.playStar();
        stars += 1;
        saveStars();
        if (starLabel) starLabel.textContent = String(stars);
        syncBossBtn();
        setTimeout(() => {
          if (state === "playing" && level === 27) winLevel();
        }, 800);
      } else {
        pipeToast(`等级不够！你 Lv.${pipeScene.level} < BOSS Lv.${b.level}`, 1.6);
        spawnBurst(b.x + b.w / 2, b.y + 10, "#8899aa", 6);
        if (window.GameAudio && GameAudio.playClick) GameAudio.playClick();
      }
    }

    function bossHitPlayer() {
      if (!pipeScene || !player || pipeScene.hurtCd > 0 || pipeScene.done) return;
      pipeScene.hurtCd = 0.9;
      pipeScene.hp = Math.max(0, pipeScene.hp - 22);
      shake = Math.max(shake, 8);
      spawnBurst(player.x + player.w / 2, player.y + player.h / 2, "#ff5533", 12);
      if (window.GameAudio && GameAudio.playPipeClang) GameAudio.playPipeClang();
      else if (window.GameAudio && GameAudio.playDeath) GameAudio.playDeath();
      if (pipeScene.hp <= 0) {
        die("mace");
      }
    }

    function drawPipeBody(x, y, w, h, facing, color, accent) {
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h + 3, w * 0.45, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = accent;
      ctx.fillRect(x + 2, y + 2, Math.max(2, w * 0.22), h - 4);
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(x, y + h - 6, w, 6);
      // 管口
      ctx.fillStyle = "#1a1c22";
      ctx.fillRect(facing >= 0 ? x + w - 5 : x, y + h * 0.28, 5, h * 0.44);
    }

    function initPipe27() {
      if (!pipeScene) return;
      pipeScene.level = 1;
      pipeScene.hp = 100;
      pipeScene.hpMax = 100;
      pipeScene.boss = null;
      pipeScene.bossSummoned = false;
      pipeScene.atkCd = 0;
      pipeScene.hurtCd = 0;
      pipeScene.toast = "";
      pipeScene.toastT = 0;
      pipeScene.done = false;
      pipeScene.pulse = 0;
      for (const b of pipeScene.beans) {
        b.taken = false;
        respawnBean(b);
      }
      if (player) {
        player.x = 80;
        player.facing = 1;
        resizePlayerPipe();
        player.y = pipeScene.groundY - player.h;
        player.vx = 0;
        player.vy = 0;
      }
      if (window.GameAudio && GameAudio.unlock) GameAudio.unlock();
      statusLabel.textContent = "钢管大战 · Lv.1 · 吃豆升级";
      pipeToast("豆子无限刷新 · 体积无限变大 · 点红色按钮挑战 BOSS", 3.8);
      syncBossBtn();
    }

    function syncPipe27OnLeave() {
      if (pipeScene) {
        pipeScene.boss = null;
        pipeScene.bossSummoned = false;
      }
      syncBossBtn();
    }

    function updatePipe27(dt) {
      if (!pipeScene || level !== 27 || state !== "playing") {
        syncBossBtn();
        return;
      }
      pipeScene.pulse += dt;
      if (pipeScene.toastT > 0) {
        pipeScene.toastT -= dt;
        if (pipeScene.toastT <= 0) pipeScene.toast = "";
      }
      if (pipeScene.atkCd > 0) pipeScene.atkCd -= dt;
      if (pipeScene.hurtCd > 0) pipeScene.hurtCd -= dt;

      resizePlayerPipe();

      // 吃豆子（无限：吃掉立刻在别处刷新）
      if (player) {
        for (const bean of pipeScene.beans) {
          if (bean.taken) continue;
          const box = { x: bean.x - bean.r, y: bean.y - bean.r, w: bean.r * 2, h: bean.r * 2 };
          if (rectsOverlap(player, box)) {
            const bx = bean.x;
            const by = bean.y;
            const col = bean.color;
            pipeScene.level += 500;
            resizePlayerPipe();
            respawnBean(bean);
            spawnBurst(bx, by, col, 10);
            pipeToast(`等级 +500！当前 Lv.${pipeScene.level}`, 1.2);
            statusLabel.textContent = `钢管 · Lv.${pipeScene.level} · HP ${pipeScene.hp}`;
            if (window.GameAudio && GameAudio.playStar) GameAudio.playStar();
          }
        }
      }

      // 攻击 BOSS（跳跃/靠近）
      if (pipeScene.boss && pipeScene.boss.alive && wantAttack()) {
        tryAttackBoss();
      }

      // BOSS AI
      const boss = pipeScene.boss;
      if (boss && boss.alive && player) {
        boss.pulse += dt;
        if (boss.atkCd > 0) boss.atkCd -= dt;
        const dx = player.x + player.w / 2 - (boss.x + boss.w / 2);
        boss.facing = dx >= 0 ? 1 : -1;
        const speed = 95;
        if (Math.abs(dx) > 20) {
          boss.vx = Math.sign(dx) * speed;
          boss.x += boss.vx * dt;
        } else {
          boss.vx = 0;
        }
        boss.y = pipeScene.groundY - boss.h;

        const hitBox = {
          x: boss.x + 8,
          y: boss.y + 10,
          w: boss.w - 16,
          h: boss.h - 12,
        };
        const pb = {
          x: player.x + 2,
          y: player.y + 4,
          w: player.w - 4,
          h: player.h - 6,
        };
        if (rectsOverlap(hitBox, pb) && boss.atkCd <= 0) {
          boss.atkCd = 1.15;
          bossHitPlayer();
        }
      }

      statusLabel.textContent = `钢管 · Lv.${pipeScene.level} · HP ${Math.max(0, pipeScene.hp | 0)}`;
      syncBossBtn();
    }

    function drawPipeExtras() {
      if (!pipeScene || level !== 27) return;

      // 豆子
      for (const bean of pipeScene.beans) {
        if (bean.taken) continue;
        const x = bean.x - cameraX;
        const y = bean.y + Math.sin(time * 4 + bean.id) * 2;
        ctx.fillStyle = bean.color;
        ctx.beginPath();
        ctx.arc(x, y, bean.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.beginPath();
        ctx.arc(x - 2, y - 3, bean.r * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }

      // 玩家钢管（替代默认角色绘制）
      if (player) {
        const x = player.x - cameraX;
        const flash = pipeScene.hurtCd > 0 && ((time * 20) | 0) % 2 === 0;
        drawPipeBody(
          x,
          player.y,
          player.w,
          player.h,
          player.facing || 1,
          flash ? "#ff8899" : "#8a93a8",
          flash ? "#ffd0d8" : "#c5cede"
        );
        ctx.fillStyle = "#ffe27a";
        ctx.font = "11px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(0,0,0,0.65)";
        const label = `Lv.${pipeScene.level}`;
        ctx.strokeText(label, x + player.w / 2, player.y - 8);
        ctx.fillText(label, x + player.w / 2, player.y - 8);
      }

      // BOSS
      const boss = pipeScene.boss;
      if (boss && boss.alive) {
        const x = boss.x - cameraX;
        drawPipeBody(x, boss.y, boss.w, boss.h, boss.facing, "#c62828", "#ff8a80");
        ctx.fillStyle = "#ff3355";
        ctx.font = "13px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.strokeStyle = "rgba(0,0,0,0.7)";
        ctx.lineWidth = 3;
        const bl = `超级钢管 Lv.${boss.level}`;
        ctx.strokeText(bl, x + boss.w / 2, boss.y - 10);
        ctx.fillText(bl, x + boss.w / 2, boss.y - 10);
      }

      // HUD
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(16, 12, 260, 70);
      ctx.fillStyle = "#ffe27a";
      ctx.font = "13px 'Noto Sans SC', sans-serif";
      ctx.fillText(`等级 Lv.${pipeScene.level}`, 26, 34);
      ctx.fillStyle = "#ff8a8a";
      ctx.fillText(`血量 ${pipeScene.hp}/${pipeScene.hpMax}`, 26, 54);
      ctx.fillStyle = "#b8ffc8";
      ctx.font = "11px 'Noto Sans SC', sans-serif";
      ctx.fillText(`豆子无限 · 体积无限 · 碰 BOSS 并按跳跃攻击`, 26, 72);

      // HP 条
      ctx.fillStyle = "#3a2020";
      ctx.fillRect(16, 88, 200, 10);
      ctx.fillStyle = "#ff4d5a";
      ctx.fillRect(16, 88, 200 * (pipeScene.hp / pipeScene.hpMax), 10);

      if (pipeScene.toast && pipeScene.toastT > 0) {
        ctx.textAlign = "center";
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(0,0,0,0.75)";
        ctx.fillStyle = "#ffe27a";
        ctx.font = "14px 'Noto Sans SC', sans-serif";
        ctx.strokeText(pipeScene.toast, W / 2, 120);
        ctx.fillText(pipeScene.toast, W / 2, 120);
      }
    }

    if (bossBtn && !bossBtn._pipeBound) {
      bossBtn._pipeBound = true;
      bossBtn.addEventListener("click", () => {
        if (level !== 27 || state !== "playing") return;
        summonBoss();
      });
    }

    S.initPipe27 = initPipe27;
    S.updatePipe27 = updatePipe27;
    S.drawPipeExtras = drawPipeExtras;
    S.syncPipe27OnLeave = syncPipe27OnLeave;
    S.syncPipe27BossBtn = syncBossBtn;
  }
};
