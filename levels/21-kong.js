// 第 21 关：DONKEY KONG · 爬梯躲桶、救出顶层
window.installKong21 = function (S) {
  with (S) {
    const kongToast = GameLevelKit.makeToast(() => kongScene, 2.2);

    function ladderAt(actor) {
      if (!kongScene || !actor) return null;
      const box = {
        x: actor.x + 6,
        y: actor.y + 4,
        w: actor.w - 12,
        h: actor.h - 8,
      };
      for (const lad of kongScene.ladders) {
        const Lbox = {
          x: lad.x,
          y: lad.top,
          w: lad.w,
          h: lad.bottom - lad.top,
        };
        if (rectsOverlap(box, Lbox)) return lad;
      }
      return null;
    }

    function wantClimbUp() {
      return keys.has("ArrowUp") || keys.has("KeyW") || keys.has("w") || keys.has("W");
    }

    function wantClimbDown() {
      return keys.has("ArrowDown") || keys.has("KeyS") || keys.has("s") || keys.has("S");
    }

    function wantLeft() {
      return keys.has("ArrowLeft") || keys.has("a") || keys.has("A") || (touch && touch.left);
    }

    function wantRight() {
      return keys.has("ArrowRight") || keys.has("d") || keys.has("D") || (touch && touch.right);
    }

    function spawnBarrel() {
      if (!kongScene) return;
      const k = kongScene.kong;
      const topFloor = kongScene.floors.length - 1;
      kongScene.barrels.push({
        x: k.x + 40,
        y: floorYFor(topFloor) - 11,
        r: 11,
        vx: 2.6,
        vy: 0,
        floor: topFloor,
        rolling: true,
        life: 40,
      });
      kongScene.kong.throwT = 0.35;
      spawnBurst(k.x + 48, k.y + 40, "#c47a30", 6);
    }

    function floorYFor(idx) {
      const f = kongScene.floors[idx];
      return f ? f.y : 400;
    }

    function floorBounds(idx) {
      const f = kongScene.floors[idx];
      if (!f) return { left: 40, right: 920 };
      return { left: f.x, right: f.x + f.w };
    }

    function updateBarrels(dt) {
      const list = kongScene.barrels;
      for (const b of list) {
        b.life -= dt;
        if (!b.rolling) continue;

        const fy = floorYFor(b.floor) - b.r;
        if (b.y < fy - 1) {
          b.vy += 520 * dt;
          b.y += b.vy * dt;
          if (b.y >= fy) {
            b.y = fy;
            b.vy = 0;
          }
        } else {
          b.y = fy;
          b.x += b.vx * 60 * dt;
          const bound = floorBounds(b.floor);
          const atEnd =
            (b.vx > 0 && b.x + b.r >= bound.right - 8) ||
            (b.vx < 0 && b.x - b.r <= bound.left + 8);
          if (atEnd) {
            if (b.floor <= 0) {
              b.life = 0;
            } else {
              b.floor -= 1;
              b.vy = 90;
              b.vx *= -1;
              b.y += 2;
            }
          }
        }

        if (player && state === "playing" && !kongScene.done && b.life > 0) {
          const hit = {
            x: b.x - b.r + 2,
            y: b.y - b.r + 2,
            w: b.r * 2 - 4,
            h: b.r * 2 - 4,
          };
          const pbox = {
            x: player.x + 4,
            y: player.y + 6,
            w: player.w - 8,
            h: player.h - 10,
          };
          if (rectsOverlap(hit, pbox)) {
            const clearing =
              !player.onGround && player.y + player.h <= b.y - b.r + 10;
            if (!clearing) {
              die("barrel");
              return;
            }
          }
        }
      }
      kongScene.barrels = list.filter((b) => b.life > 0);
    }

    function handleClimb(dt) {
      if (!player || kongScene.done) return;
      const lad = ladderAt(player);
      if (!lad) {
        kongScene.climbing = false;
        return;
      }

      const up = wantClimbUp();
      const down = wantClimbDown();
      const left = wantLeft();
      const right = wantRight();
      const nearCenter =
        Math.abs(player.x + player.w / 2 - (lad.x + lad.w / 2)) < 18;

      // 只在按上下，且靠近梯子中心时才爬；避免跳跃被吸住
      if (!up && !down) {
        kongScene.climbing = false;
        return;
      }
      if (!kongScene.climbing && !nearCenter) return;
      // 在地面按上 + 左右时优先走路/跳，不强制爬
      if (!kongScene.climbing && player.onGround && up && (left || right)) return;

      kongScene.climbing = true;
      const cx = lad.x + lad.w / 2 - player.w / 2;
      player.x += (cx - player.x) * Math.min(1, dt * 10);
      player.vx = 0;
      player.vy = 0;

      const speed = 150;
      if (up) {
        player.y -= speed * dt;
        player.onGround = false;
      }
      if (down) {
        player.y += speed * dt;
        player.onGround = false;
      }

      const topLimit = lad.top - 6;
      const botLimit = lad.bottom - player.h;
      if (player.y < topLimit) {
        player.y = topLimit;
        player.onGround = true;
        kongScene.climbing = false;
      }
      if (player.y > botLimit) {
        player.y = botLimit;
        player.onGround = true;
        kongScene.climbing = false;
      }
    }

    function checkWin() {
      if (!player || kongScene.done) return;
      const g = kongScene.goal;
      if (rectsOverlap(player, g)) {
        kongScene.done = true;
        statusLabel.textContent = "救出！";
        kongToast("DONKEY KONG 通关！", 2.4);
        if (window.GameAudio && GameAudio.playStar) GameAudio.playStar();
        setTimeout(() => {
          if (state === "playing" && level === 21) winLevel();
        }, 700);
      }
    }

    function initKong21() {
      if (!kongScene) return;
      kongScene.barrels = [];
      kongScene.spawnT = 1.0;
      kongScene.kong.throwT = 0;
      kongScene.kong.bob = 0;
      kongScene.toast = "";
      kongScene.toastT = 0;
      kongScene.climbing = false;
      kongScene.done = false;
      statusLabel.textContent = "DONKEY KONG · 爬上去救人";
      kongToast("爬梯子、躲开滚桶，冲到顶层！", 3);
    }

    function syncKong21OnLeave() {
      if (kongScene) kongScene.barrels = [];
    }

    function updateKong21(dt) {
      if (!kongScene || level !== 21 || state !== "playing") return;

      GameLevelKit.tickToast(kongScene, dt);

      kongScene.kong.bob += dt;
      if (kongScene.kong.throwT > 0) kongScene.kong.throwT -= dt;

      handleClimb(dt);

      if (!kongScene.done) {
        kongScene.spawnT -= dt;
        if (kongScene.spawnT <= 0) {
          spawnBarrel();
          kongScene.spawnT = kongScene.spawnEvery + Math.random() * 0.6;
        }
        updateBarrels(dt);
        checkWin();
      }

      if (!kongScene.done && !kongScene.toast) {
        statusLabel.textContent = "DONKEY KONG · 爬到顶层";
      }
    }

    function drawKong(kx, ky) {
      const bob = Math.sin(kongScene.kong.bob * 4) * 2;
      const throwLean = kongScene.kong.throwT > 0 ? 6 : 0;
      // 身体
      ctx.fillStyle = "#6b3a1f";
      ctx.fillRect(kx + 8 + throwLean, ky + 18 + bob, 44, 36);
      // 头
      ctx.fillStyle = "#8b5230";
      ctx.fillRect(kx + 12 + throwLean, ky + bob, 36, 22);
      // 脸
      ctx.fillStyle = "#e8b888";
      ctx.fillRect(kx + 20 + throwLean, ky + 8 + bob, 20, 12);
      // 眼睛
      ctx.fillStyle = "#1a0c08";
      ctx.fillRect(kx + 24 + throwLean, ky + 11 + bob, 4, 4);
      ctx.fillRect(kx + 34 + throwLean, ky + 11 + bob, 4, 4);
      // 手臂
      ctx.fillStyle = "#6b3a1f";
      ctx.fillRect(kx + 48 + throwLean, ky + 22 + bob, 18, 10);
      ctx.fillRect(kx - 4, ky + 24 + bob, 14, 10);
      // 标签
      ctx.fillStyle = "#ffd24a";
      ctx.font = "bold 10px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("KONG", kx + 30, ky - 4 + bob);
    }

    function drawPauline(px, py) {
      ctx.fillStyle = "#ff4f8b";
      ctx.fillRect(px + 6, py + 12, 18, 22);
      ctx.fillStyle = "#ffe0b8";
      ctx.fillRect(px + 6, py, 18, 14);
      ctx.fillStyle = "#3a2a1a";
      ctx.fillRect(px + 5, py - 2, 20, 6);
      ctx.fillStyle = "#1a0c08";
      ctx.fillRect(px + 16, py + 5, 3, 3);
      ctx.fillStyle = "#ffd24a";
      ctx.font = "10px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("HELP!", px + 14, py - 8);
    }

    function drawBarrel(b) {
      const x = b.x - cameraX;
      const y = b.y;
      ctx.fillStyle = "#8a4a18";
      ctx.beginPath();
      ctx.arc(x, y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#5a2e0c";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, b.r - 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#c47a30";
      ctx.beginPath();
      ctx.moveTo(x - b.r + 2, y);
      ctx.lineTo(x + b.r - 2, y);
      ctx.stroke();
    }

    function drawLadder(lad) {
      const x = lad.x - cameraX;
      const top = lad.top;
      const h = lad.bottom - lad.top;
      ctx.fillStyle = "#c9a067";
      ctx.fillRect(x + 2, top, 4, h);
      ctx.fillRect(x + lad.w - 6, top, 4, h);
      for (let y = top + 10; y < lad.bottom - 6; y += 16) {
        ctx.fillRect(x + 2, y, lad.w - 4, 4);
      }
    }

    function drawKongExtras() {
      if (!kongScene || level !== 21) return;

      // 梯子
      for (const lad of kongScene.ladders) drawLadder(lad);

      // Kong & Pauline
      drawKong(kongScene.kong.x - cameraX, kongScene.kong.y);
      drawPauline(kongScene.pauline.x - cameraX, kongScene.pauline.y);

      // 油桶目标高光
      const g = kongScene.goal;
      ctx.strokeStyle = "rgba(255, 210, 74, 0.55)";
      ctx.lineWidth = 2;
      ctx.strokeRect(g.x - cameraX, g.y, g.w, g.h);

      for (const b of kongScene.barrels) drawBarrel(b);

      // HUD
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(16, 16, 340, 48);
      ctx.fillStyle = "#ff5533";
      ctx.font = "bold 14px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("第21关 · DONKEY KONG", 26, 36);
      ctx.fillStyle = "#cde";
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      ctx.fillText("↑贴着梯子爬  ←→移动跳跃  躲开滚桶", 26, 54);

      if (kongScene.toast && kongScene.toastT > 0) {
        ctx.fillStyle = "rgba(0,0,0,0.72)";
        ctx.fillRect(W / 2 - 180, 90, 360, 34);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 13px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(kongScene.toast, W / 2, 112);
      }
    }

    S.initKong21 = initKong21;
    S.updateKong21 = updateKong21;
    S.drawKongExtras = drawKongExtras;
    S.syncKong21OnLeave = syncKong21OnLeave;
  };
};
