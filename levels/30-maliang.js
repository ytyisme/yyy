// 第 30 关：神笔马良 · 开篇 —— 神笔现世，画桥过岩浆
window.installMaliang30 = function (S) {
  with (S) {
    function mlToast(msg, sec) {
      if (!maliangScene) return;
      maliangScene.toast = msg;
      maliangScene.toastT = sec || 2.6;
    }

    function wantPaint() {
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

    function overlapAny(box) {
      for (const p of platforms) {
        if (rectsOverlap(box, p)) return true;
      }
      return false;
    }

    function paintPlatform() {
      if (!maliangScene || !player || !maliangScene.hasBrush) return;
      if (maliangScene.placeCd > 0 || maliangScene.ink <= 0 || maliangScene.done) return;

      const facing = player.facing >= 0 ? 1 : -1;
      const bw = 70;
      const bh = 18;
      let x = Math.round((player.x + player.w / 2 + facing * 48 - bw / 2) / 4) * 4;
      let y = Math.round((player.onGround ? player.y + player.h : player.y + player.h + 8) / 2) * 2;
      // 悬空时画在脚下略低，方便搭桥
      if (!player.onGround) y = Math.round((player.y + player.h + 20) / 2) * 2;
      else y = maliangScene.groundY;

      // 若前方已有地面，则画高一级台阶
      const probe = { x: x + 10, y: y - 40, w: bw - 20, h: 20 };
      for (const p of platforms) {
        if (p.y < maliangScene.groundY - 10 && rectsOverlap(probe, { x: p.x, y: p.y - 30, w: p.w, h: 60 })) {
          y = p.y - 50;
          break;
        }
      }

      x = clamp(x, 40, worldWidth - bw - 40);
      y = clamp(y, 120, maliangScene.groundY);

      const box = { x, y, w: bw, h: bh };
      if (overlapAny(box)) {
        // 再试身前略高
        box.y = clamp(y - 40, 120, maliangScene.groundY);
        if (overlapAny(box)) {
          mlToast("这里画不下", 1.2);
          maliangScene.placeCd = 0.2;
          return;
        }
      }

      const plat = {
        x: box.x,
        y: box.y,
        w: box.w,
        h: box.h,
        lane: "ground",
        theme: "maliangInk",
        maliangPaint: true,
      };
      platforms.push(plat);
      maliangScene.painted.push(plat);
      maliangScene.ink -= 1;
      maliangScene.placeCd = 0.28;
      shake = Math.max(shake, 4);
      spawnBurst(box.x + box.w / 2, box.y, "#5ce1ff", 10);
      statusLabel.textContent = `神笔 · 墨水 ${maliangScene.ink}/${maliangScene.inkMax}`;
      mlToast("墨迹成真！", 1.1);
      if (window.GameAudio && GameAudio.playClick) GameAudio.playClick();
    }

    function initMaliang30() {
      if (!maliangScene) return;
      maliangScene.hasBrush = false;
      maliangScene.ink = maliangScene.inkMax;
      maliangScene.placeCd = 0;
      maliangScene.painted = [];
      maliangScene.toast = "";
      maliangScene.toastT = 0;
      maliangScene.done = false;
      maliangScene.pulse = 0;
      maliangScene.paintHeld = false;
      maliangScene.brushPickup.taken = false;
      // 清掉上一局画的平台
      for (let i = platforms.length - 1; i >= 0; i--) {
        if (platforms[i].maliangPaint) platforms.splice(i, 1);
      }
      if (player) {
        player.x = 80;
        player.y = maliangScene.groundY - 40;
        player.vx = 0;
        player.vy = 0;
        player.facing = 1;
      }
      if (window.GameAudio && GameAudio.unlock) GameAudio.unlock();
      statusLabel.textContent = "神笔马良 · 去拿神笔";
      mlToast("贫苦少年马良得到一支神笔——画什么都成真！M/↓ 画桥过岩浆", 3.8);
    }

    function syncMaliang30OnLeave() {
      if (!maliangScene) return;
      for (let i = platforms.length - 1; i >= 0; i--) {
        if (platforms[i].maliangPaint) platforms.splice(i, 1);
      }
      maliangScene.painted = [];
    }

    function updateMaliang30(dt) {
      if (!maliangScene || level !== 30 || state !== "playing") return;
      maliangScene.pulse += dt;
      if (maliangScene.toastT > 0) {
        maliangScene.toastT -= dt;
        if (maliangScene.toastT <= 0) maliangScene.toast = "";
      }
      if (maliangScene.placeCd > 0) maliangScene.placeCd -= dt;

      // 捡神笔
      if (player && !maliangScene.brushPickup.taken) {
        const b = maliangScene.brushPickup;
        if (rectsOverlap(player, b)) {
          b.taken = true;
          maliangScene.hasBrush = true;
          mlToast("得到神笔！按 M 或 ↓ 在身前画出台阶/桥", 3.2);
          statusLabel.textContent = `神笔在手 · 墨水 ${maliangScene.ink}`;
          spawnBurst(b.x + 14, b.y + 14, "#ffe27a", 16);
          if (window.GameAudio && GameAudio.playStar) GameAudio.playStar();
        }
      }

      if (maliangScene.hasBrush && wantPaint()) {
        if (!maliangScene.paintHeld) paintPlatform();
        maliangScene.paintHeld = true;
      } else {
        maliangScene.paintHeld = false;
      }

      // 到终点
      if (!maliangScene.done && player && rectsOverlap(player, maliangScene.exit)) {
        maliangScene.done = true;
        statusLabel.textContent = "神笔马良 · 开篇完成！";
        mlToast("神笔显灵，逃出山谷！", 2);
        if (window.GameAudio && GameAudio.playStar) GameAudio.playStar();
        stars += 1;
        saveStars();
        if (starLabel) starLabel.textContent = String(stars);
        setTimeout(() => {
          if (state === "playing" && level === 30) winLevel();
        }, 750);
      }
    }

    function tryClickMaliang30(clientX, clientY) {
      if (!maliangScene || level !== 30 || state !== "playing") return false;
      if (!maliangScene.hasBrush || maliangScene.done) return false;
      // 点击也可画：在点击处附近生成墨桥
      if (maliangScene.placeCd > 0 || maliangScene.ink <= 0) return false;
      const world = clientToWorld(clientX, clientY);
      const bw = 70;
      const bh = 18;
      const box = {
        x: Math.round((world.x - bw / 2) / 4) * 4,
        y: Math.round(world.y / 2) * 2,
        w: bw,
        h: bh,
      };
      box.x = clamp(box.x, 40, worldWidth - bw - 40);
      box.y = clamp(box.y, 120, maliangScene.groundY);
      if (overlapAny(box)) return false;
      const plat = {
        x: box.x,
        y: box.y,
        w: box.w,
        h: box.h,
        lane: "ground",
        theme: "maliangInk",
        maliangPaint: true,
      };
      platforms.push(plat);
      maliangScene.painted.push(plat);
      maliangScene.ink -= 1;
      maliangScene.placeCd = 0.28;
      spawnBurst(box.x + box.w / 2, box.y, "#5ce1ff", 8);
      statusLabel.textContent = `神笔 · 墨水 ${maliangScene.ink}/${maliangScene.inkMax}`;
      if (window.GameAudio && GameAudio.playClick) GameAudio.playClick();
      return true;
    }

    function drawMaliangExtras() {
      if (!maliangScene || level !== 30) return;

      // 山野氛围
      ctx.fillStyle = "rgba(40, 90, 60, 0.12)";
      ctx.fillRect(0, 0, W, H);

      // 神笔拾取物
      const b = maliangScene.brushPickup;
      if (!b.taken) {
        const x = b.x - cameraX;
        const bob = Math.sin(time * 4) * 3;
        ctx.fillStyle = "#2a1810";
        ctx.fillRect(x + 10, b.y + bob + 6, 6, 20);
        ctx.fillStyle = "#5ce1ff";
        ctx.beginPath();
        ctx.moveTo(x + 4, b.y + bob + 8);
        ctx.lineTo(x + 22, b.y + bob + 4);
        ctx.lineTo(x + 18, b.y + bob + 16);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#ffe27a";
        ctx.font = "11px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("神笔", x + 14, b.y + bob - 4);
      }

      // 墨迹平台高光（实体已由 drawBrick 画）
      for (const p of maliangScene.painted) {
        const x = p.x - cameraX;
        ctx.fillStyle = "rgba(92, 225, 255, 0.35)";
        ctx.fillRect(x, p.y, p.w, 3);
      }

      // 出口门
      const ex = maliangScene.exit;
      const dx = ex.x - cameraX;
      ctx.fillStyle = "#3a6a48";
      ctx.fillRect(dx, ex.y, ex.w, ex.h);
      ctx.fillStyle = "#7dff9a";
      ctx.fillRect(dx + 8, ex.y + 10, ex.w - 16, ex.h - 24);
      ctx.fillStyle = "#ffe27a";
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("出谷", dx + ex.w / 2, ex.y - 8);

      // 玩家手里的笔
      if (player && maliangScene.hasBrush) {
        const px = player.x - cameraX + (player.facing >= 0 ? player.w - 2 : -6);
        const py = player.y + 14;
        ctx.fillStyle = "#2a1810";
        ctx.fillRect(px, py, 4, 16);
        ctx.fillStyle = "#5ce1ff";
        ctx.fillRect(px - 2, py - 2, 8, 6);
      }

      // HUD
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(16, 12, 280, 58);
      ctx.fillStyle = "#5ce1ff";
      ctx.font = "13px 'Noto Sans SC', sans-serif";
      ctx.fillText(
        maliangScene.hasBrush
          ? `神笔 · 墨水 ${maliangScene.ink}/${maliangScene.inkMax}`
          : "去左边拿起神笔",
        26,
        34
      );
      ctx.fillStyle = "#ffe27a";
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      ctx.fillText("M / ↓ / 点击空地：画出成真的桥", 26, 54);

      if (maliangScene.toast && maliangScene.toastT > 0) {
        ctx.textAlign = "center";
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(0,0,0,0.75)";
        ctx.fillStyle = "#ffe27a";
        ctx.font = "14px 'Noto Sans SC', sans-serif";
        ctx.strokeText(maliangScene.toast, W / 2, 100);
        ctx.fillText(maliangScene.toast, W / 2, 100);
      }
    }

    S.initMaliang30 = initMaliang30;
    S.updateMaliang30 = updateMaliang30;
    S.drawMaliangExtras = drawMaliangExtras;
    S.syncMaliang30OnLeave = syncMaliang30OnLeave;
    S.tryClickMaliang30 = tryClickMaliang30;
  }
};
