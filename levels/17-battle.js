// 第 17 关：战场 · 蓝红对战（枪 / 小匕首）
window.installBattle17 = function (S) {
  with (S) {
    const battlePad = document.getElementById("lv17-battle-pad");
    const btnGun = document.getElementById("lv17-btn-gun");
    const btnDagger = document.getElementById("lv17-btn-dagger");
    const btnFire = document.getElementById("lv17-btn-fire");
    const btnSlash = document.getElementById("lv17-btn-slash");
    let bound = false;

    function battleToast(msg, sec) {
      if (!battleScene) return;
      battleScene.toast = msg;
      battleScene.toastT = sec || 2;
    }

    function syncBattlePad() {
      if (!battlePad) return;
      const show = level === 17 && state === "playing" && battleScene && !battleScene.done;
      battlePad.classList.toggle("hidden", !show);
      battlePad.setAttribute("aria-hidden", show ? "false" : "true");
      if (!battleScene) return;
      if (btnGun) btnGun.classList.toggle("active", battleScene.weapon === "gun");
      if (btnDagger) btnDagger.classList.toggle("active", battleScene.weapon === "dagger");
    }

    function hideBattlePad() {
      if (battlePad) {
        battlePad.classList.add("hidden");
        battlePad.setAttribute("aria-hidden", "true");
      }
    }

    function setWeapon(w) {
      if (!battleScene || battleScene.done) return;
      battleScene.weapon = w;
      battleToast(w === "gun" ? "已切换：枪" : "已切换：小匕首", 1.2);
      statusLabel.textContent = w === "gun" ? "战场 · 持枪" : "战场 · 持匕首";
      syncBattlePad();
      if (window.GameAudio) GameAudio.playClick();
    }

    function livingOf(team) {
      return (battleScene.npcs || []).filter((n) => n.alive && n.team === team);
    }

    function hurtTarget(target, dmg, fromTeam) {
      if (!target || !target.alive) return false;
      // 友军伤害免疫（含玩家对蓝队）
      if (target.team && fromTeam && target.team === fromTeam) return false;
      target.hp -= dmg;
      if (target.hp <= 0) {
        target.hp = 0;
        target.alive = false;
        spawnBurst(target.x + target.w / 2, target.y + target.h / 2, "#ff5533", 14);
        return true;
      }
      spawnBurst(target.x + target.w / 2, target.y + 10, "#ffd24a", 6);
      return false;
    }

    function hurtPlayer(dmg) {
      if (!battleScene || battleScene.done || !player) return;
      battleScene.playerHp -= dmg;
      battleScene.hurtFlash = 0.35;
      shake = Math.max(shake, 10);
      spawnBurst(player.x + player.w / 2, player.y + 12, "#ff5533", 10);
      if (battleScene.playerHp <= 0) {
        battleScene.playerHp = 0;
        battleScene.done = true;
        hideBattlePad();
        statusLabel.textContent = "阵亡";
        battleToast("你被击败了…", 2);
        setTimeout(() => die("zombie"), 600);
      } else {
        battleToast(`受伤！剩余 ${battleScene.playerHp} 心`, 1.2);
      }
    }

    function checkBattleWin() {
      if (!battleScene || battleScene.done) return;
      if (livingOf("red").length === 0) {
        battleScene.done = true;
        hideBattlePad();
        statusLabel.textContent = "蓝队胜利！";
        battleToast("红队全灭 · 通关！", 2);
        setTimeout(() => winLevel(), 800);
      }
    }

    function fireGunFrom(sx, sy, facing, team, speed) {
      battleScene.bullets.push({
        x: sx,
        y: sy,
        vx: facing * (speed || 13),
        vy: (Math.random() - 0.5) * 0.4,
        life: 1.8,
        r: 3,
        team,
        dmg: 2,
      });
    }

    function playerAttack() {
      if (!battleScene || battleScene.done || !player) return;
      if (battleScene.cooldown > 0) {
        battleToast("冷却中…", 0.8);
        return;
      }
      const facing = player.facing >= 0 ? 1 : -1;
      if (battleScene.weapon === "gun") {
        const mx = player.x + (facing > 0 ? player.w + 2 : -6);
        const my = player.y + 16;
        fireGunFrom(mx, my, facing, battleScene.playerTeam, 15);
        battleScene.cooldown = 0.45;
        battleScene.muzzleFlash = 0.12;
        shake = Math.max(shake, 4);
        if (window.GameAudio && GameAudio.playGunShot) GameAudio.playGunShot();
        else if (window.GameAudio) GameAudio.playClick();
      } else {
        // 小匕首近战
        const box = {
          x: facing > 0 ? player.x + player.w : player.x - 34,
          y: player.y + 8,
          w: 34,
          h: 28,
        };
        let hitAny = false;
        for (const n of battleScene.npcs) {
          if (!n.alive || n.team === battleScene.playerTeam) continue;
          if (rectsOverlap(box, n)) {
            hurtTarget(n, 3, battleScene.playerTeam);
            hitAny = true;
          }
        }
        battleScene.cooldown = 0.35;
        battleScene.muzzleFlash = 0.1;
        shake = Math.max(shake, hitAny ? 6 : 2);
        if (window.GameAudio) GameAudio.playClick();
        if (hitAny) checkBattleWin();
      }
    }

    function nearestEnemy(npc) {
      let best = null;
      let bestD = 1e9;
      const enemies = battleScene.npcs.filter((n) => n.alive && n.team !== npc.team);
      for (const e of enemies) {
        const d = Math.abs(e.x - npc.x);
        if (d < bestD) {
          bestD = d;
          best = e;
        }
      }
      // 红队也会打玩家
      if (npc.team === "red" && player && battleScene.playerHp > 0) {
        const d = Math.abs(player.x - npc.x);
        if (d < bestD) {
          bestD = d;
          best = { isPlayer: true, x: player.x, y: player.y, w: player.w, h: player.h, alive: true };
        }
      }
      return best;
    }

    function updateNpc(npc, dt) {
      if (!npc.alive) return;
      npc.bob += dt * 5;
      npc.attackCd = Math.max(0, npc.attackCd - dt);
      npc.thinkT -= dt;
      const foe = nearestEnemy(npc);
      if (!foe) {
        npc.vx = 0;
        return;
      }
      const dx = foe.x - npc.x;
      npc.facing = dx >= 0 ? 1 : -1;
      const dist = Math.abs(dx);

      if (npc.weapon === "gun") {
        if (dist > 220) {
          npc.vx = npc.facing * 2.2;
        } else if (dist < 120) {
          npc.vx = -npc.facing * 1.6;
        } else {
          npc.vx = Math.sin(npc.bob) * 0.4;
          if (npc.attackCd <= 0) {
            fireGunFrom(
              npc.x + (npc.facing > 0 ? npc.w : -4),
              npc.y + 16,
              npc.facing,
              npc.team,
              12
            );
            npc.attackCd = 0.9 + Math.random() * 0.5;
          }
        }
      } else {
        if (dist > 36) {
          npc.vx = npc.facing * 2.6;
        } else {
          npc.vx = 0;
          if (npc.attackCd <= 0) {
            if (foe.isPlayer) hurtPlayer(2);
            else hurtTarget(foe, 2, npc.team);
            npc.attackCd = 0.7 + Math.random() * 0.4;
            checkBattleWin();
          }
        }
      }

      npc.x += npc.vx;
      npc.x = clamp(npc.x, 20, worldWidth - 50);
      npc.y = battleScene.groundY - npc.h;
    }

    function bindBattlePad() {
      if (bound) return;
      bound = true;
      if (btnGun) btnGun.addEventListener("click", () => setWeapon("gun"));
      if (btnDagger) btnDagger.addEventListener("click", () => setWeapon("dagger"));
      if (btnFire) {
        btnFire.addEventListener("click", () => {
          if (battleScene && battleScene.weapon !== "gun") setWeapon("gun");
          playerAttack();
        });
      }
      if (btnSlash) {
        btnSlash.addEventListener("click", () => {
          if (battleScene && battleScene.weapon !== "dagger") setWeapon("dagger");
          playerAttack();
        });
      }
    }

    function initBattle17() {
      bindBattlePad();
      syncBattlePad();
      if (battleScene) {
        battleScene.playerHp = 10;
        battleScene.weapon = "gun";
        battleScene.cooldown = 0;
        battleScene.bullets = [];
        battleScene.done = false;
        battleScene.hurtFlash = 0;
        battleScene.npcs.forEach((n) => {
          n.alive = true;
          n.hp = 10;
          n.attackCd = 0.5 + Math.random();
        });
      }
      statusLabel.textContent = "战场 · 你是蓝队 · 枪 / 小匕首";
      battleToast("消灭全部红队！友军不会攻击你", 3);
    }

    function updateBattle17(dt) {
      if (!battleScene || state !== "playing" || level !== 17) return;
      const bs = battleScene;
      if (bs.toastT > 0) {
        bs.toastT -= dt;
        if (bs.toastT <= 0) bs.toast = "";
      }
      if (bs.cooldown > 0) bs.cooldown -= dt;
      if (bs.muzzleFlash > 0) bs.muzzleFlash -= dt;
      if (bs.hurtFlash > 0) bs.hurtFlash -= dt;
      if (bs.done) {
        syncBattlePad();
        return;
      }

      for (const n of bs.npcs) updateNpc(n, dt);

      // 子弹
      for (const b of bs.bullets) {
        b.x += b.vx;
        b.y += b.vy;
        b.life -= dt;
        // 打 NPC
        for (const n of bs.npcs) {
          if (!n.alive || n.team === b.team) continue;
          if (
            b.x >= n.x &&
            b.x <= n.x + n.w &&
            b.y >= n.y &&
            b.y <= n.y + n.h
          ) {
            hurtTarget(n, b.dmg, b.team);
            b.life = 0;
            checkBattleWin();
            break;
          }
        }
        // 红队子弹打玩家
        if (
          b.life > 0 &&
          b.team === "red" &&
          player &&
          b.x >= player.x &&
          b.x <= player.x + player.w &&
          b.y >= player.y &&
          b.y <= player.y + player.h
        ) {
          hurtPlayer(b.dmg);
          b.life = 0;
        }
      }
      bs.bullets = bs.bullets.filter((b) => b.life > 0 && b.x > -40 && b.x < worldWidth + 40);

      syncBattlePad();
    }

    function drawHearts(x, y, hp, maxHp, scale) {
      const s = scale || 1;
      for (let i = 0; i < maxHp; i++) {
        const hx = x + i * (9 * s);
        ctx.fillStyle = i < hp ? "#e74c3c" : "#444";
        ctx.fillRect(hx, y, 7 * s, 6 * s);
      }
    }

    function drawBattleUnit(u, isPlayer) {
      const sx = u.x - cameraX;
      const sy = u.y;
      if (sx < -60 || sx > W + 60) return;
      const team = isPlayer ? battleScene.playerTeam : u.team;
      const shirt = team === "blue" ? "#3a7bd5" : "#c0392b";
      const pants = team === "blue" ? "#1a4a8a" : "#7a1a1a";
      const hop = isPlayer ? 0 : Math.sin(u.bob) * 1.2;

      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath();
      ctx.ellipse(sx + 14, sy + u.h + 3, 12, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = shirt;
      ctx.fillRect(sx + 6, sy + 10 + hop, 16, 22);
      ctx.fillStyle = "#ffe0b8";
      ctx.fillRect(sx + 6, sy + hop, 16, 14);
      ctx.fillStyle = "#1a0c08";
      ctx.fillRect(sx + (u.facing >= 0 ? 14 : 8), sy + 5 + hop, 3, 3);
      ctx.fillStyle = pants;
      ctx.fillRect(sx + 7, sy + 30 + hop, 5, 10);
      ctx.fillRect(sx + 16, sy + 30 + hop, 5, 10);

      // 武器示意
      const wpn = isPlayer ? battleScene.weapon : u.weapon;
      ctx.fillStyle = "#222";
      if (wpn === "gun") {
        const gx = u.facing >= 0 ? sx + 20 : sx - 10;
        ctx.fillRect(gx, sy + 16 + hop, 14, 4);
      } else {
        const dx = u.facing >= 0 ? sx + 22 : sx - 4;
        ctx.fillRect(dx, sy + 14 + hop, 3, 12);
      }

      // 头顶「玩家」
      const label = isPlayer ? playerName || "玩家" : u.name || "玩家";
      ctx.save();
      ctx.font = "11px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0,0,0,0.75)";
      ctx.fillStyle = team === "blue" ? "#8cf" : "#f99";
      ctx.strokeText(label, sx + 14, sy - 14 + hop);
      ctx.fillText(label, sx + 14, sy - 14 + hop);
      ctx.restore();

      drawHearts(sx - 18, sy - 8 + hop, u.hp, u.maxHp || 10, 0.9);
    }

    function drawBattleExtras() {
      if (!battleScene || level !== 17) return;
      const bs = battleScene;

      // 战场氛围
      ctx.fillStyle = "rgba(40, 30, 20, 0.25)";
      ctx.fillRect(0, 0, W, bs.groundY - 20);

      ctx.fillStyle = "#ffd24a";
      ctx.font = "bold 14px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("战场 · 蓝队 vs 红队", 24, 32);
      ctx.fillStyle = "#9ab";
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      ctx.fillText(
        `蓝 ${livingOf("blue").length}/10 · 红 ${livingOf("red").length}/10 · 你是蓝队`,
        24,
        50
      );

      // 玩家血量条
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(24, 58, 120, 18);
      drawHearts(28, 62, bs.playerHp, bs.playerMaxHp, 1.1);
      ctx.fillStyle = "#fff";
      ctx.font = "10px 'Noto Sans SC', sans-serif";
      ctx.fillText(`${bs.playerHp}/10`, 128, 71);

      for (const n of bs.npcs) {
        if (n.alive) drawBattleUnit(n, false);
      }

      // 子弹
      for (const b of bs.bullets) {
        ctx.fillStyle = b.team === "blue" ? "#8cf" : "#f66";
        ctx.beginPath();
        ctx.arc(b.x - cameraX, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (bs.muzzleFlash > 0 && player) {
        const facing = player.facing >= 0 ? 1 : -1;
        const mx = player.x - cameraX + (facing > 0 ? player.w + 4 : -4);
        ctx.fillStyle = "#ff9a2a";
        ctx.beginPath();
        ctx.arc(mx, player.y + 16, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      if (bs.hurtFlash > 0) {
        ctx.fillStyle = `rgba(200,0,0,${bs.hurtFlash * 0.45})`;
        ctx.fillRect(0, 0, W, H);
      }

      // 重新画玩家（蓝队皮肤），盖住默认外观
      if (player && bs.playerHp > 0) {
        drawBattleUnit(
          {
            x: player.x,
            y: player.y,
            w: player.w,
            h: player.h,
            facing: player.facing,
            hp: bs.playerHp,
            maxHp: bs.playerMaxHp,
            team: bs.playerTeam,
            bob: 0,
            weapon: bs.weapon,
            name: playerName || "玩家",
          },
          true
        );
      }

      if (bs.toast) {
        ctx.fillStyle = "rgba(0,0,0,0.72)";
        ctx.fillRect(W / 2 - 160, H - 72, 320, 36);
        ctx.fillStyle = "#ffd24a";
        ctx.font = "12px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(bs.toast, W / 2, H - 48);
      }
    }

    function syncBattle17OnLeave() {
      hideBattlePad();
    }

    S.initBattle17 = initBattle17;
    S.updateBattle17 = updateBattle17;
    S.drawBattleExtras = drawBattleExtras;
    S.syncBattle17OnLeave = syncBattle17OnLeave;
  }
};
