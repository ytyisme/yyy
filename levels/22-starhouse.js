// 第 22 关：五角星屋 · 喷泉喷星 · 靠近捡拾
window.installStarHouse22 = function (S) {
  with (S) {
    const MAX_STARS = 10000;
    const BURST_COUNT = 10000;
    const GROUND = 400;
    const HUES = ["#ffd24a", "#ffe9a0", "#ff9f3a"];
    const starPool = [];
    let eruptSoundCd = 0;
    let collectFxCd = 0;
    let starSprites = null;

    function ensureStarSprites() {
      if (starSprites) return starSprites;
      starSprites = HUES.map((color) => {
        const c = document.createElement("canvas");
        c.width = 24;
        c.height = 24;
        const g = c.getContext("2d");
        g.translate(12, 12);
        g.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
          const b = a + Math.PI / 5;
          if (i === 0) g.moveTo(Math.cos(a) * 10, Math.sin(a) * 10);
          else g.lineTo(Math.cos(a) * 10, Math.sin(a) * 10);
          g.lineTo(Math.cos(b) * 4.2, Math.sin(b) * 4.2);
        }
        g.closePath();
        g.fillStyle = color;
        g.fill();
        return c;
      });
      return starSprites;
    }

    function starToast(msg, sec) {
      if (!starHouseScene) return;
      starHouseScene.toast = msg;
      starHouseScene.toastT = sec || 2.2;
    }

    function drawStarShape(cx, cy, r, fill, stroke) {
      GameUtil.drawStarShape(ctx, cx, cy, r, fill, stroke);
    }

    function recycleStar(s) {
      starPool.push(s);
    }

    function allocStar(fx, fy, i) {
      const s = starPool.pop() || {};
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.75;
      const speed = 260 + Math.random() * 480;
      s.x = fx + (Math.random() - 0.5) * 28;
      s.y = fy - 36;
      s.vx = Math.cos(ang) * speed * (0.45 + Math.random() * 0.9);
      s.vy = Math.sin(ang) * speed;
      s.r = 4 + Math.random() * 5;
      s.life = 1.4 + Math.random() * 1.1;
      s.bounce = 0;
      s.grounded = false;
      s.hue = i % 3;
      return s;
    }

    function eruptFountain() {
      if (!starHouseScene) return;
      const f = starHouseScene.fountain;
      const list = starHouseScene.stars;
      const count = BURST_COUNT;
      const overflow = list.length + count - MAX_STARS;
      if (overflow > 0) {
        for (let i = 0; i < overflow; i++) recycleStar(list[i]);
        list.splice(0, overflow);
      }

      for (let i = 0; i < count; i++) {
        list.push(allocStar(f.x, f.y, i));
      }

      if (starHouseScene.spray.length < 50) {
        for (let i = 0; i < 10; i++) {
          const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.8;
          const speed = 160 + Math.random() * 220;
          starHouseScene.spray.push({
            x: f.x,
            y: f.y - 40,
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed,
            life: 0.2 + Math.random() * 0.2,
            r: 2 + Math.random() * 2.5,
          });
        }
      }
      if (eruptSoundCd <= 0 && window.GameAudio && GameAudio.playStar) {
        GameAudio.playStar();
        eruptSoundCd = 0.15;
      }
    }

    function collectStar(s) {
      if (!starHouseScene || !s || s.life <= 0) return;
      s.life = 0;
      starHouseScene.collected += 1;
      starHouseScene.sessionGain += 1;
      starHouseScene._gainFrame = (starHouseScene._gainFrame || 0) + 1;
    }

    function initStarHouse22() {
      if (!starHouseScene) return;
      ensureStarSprites();
      const old = starHouseScene.stars || [];
      for (let i = 0; i < old.length; i++) recycleStar(old[i]);
      starHouseScene.stars = [];
      starHouseScene.spray = [];
      starHouseScene.burstT = 0.01;
      starHouseScene.burstEvery = 0.01;
      starHouseScene.pulse = 0;
      starHouseScene.toast = "";
      starHouseScene.toastT = 0;
      starHouseScene.sessionGain = 0;
      eruptSoundCd = 0;
      if (player) {
        player.x = 140;
        player.y = GROUND - 42;
        player.vx = 0;
        player.vy = 0;
      }
      if (window.GameAudio && GameAudio.unlock) GameAudio.unlock();
      statusLabel.textContent = "五角星屋 · 喷泉随时会喷";
      starToast("五角星屋 · 每次喷出 10000 颗，靠近去捡", 3.2);
    }

    function syncStarHouse22OnLeave() {
      // no ambience to stop
    }

    function updateStarHouse22(dt) {
      if (!starHouseScene || level !== 22 || state !== "playing") return;

      starHouseScene.pulse += dt;
      if (eruptSoundCd > 0) eruptSoundCd -= dt;
      if (collectFxCd > 0) collectFxCd -= dt;
      if (starHouseScene.toastT > 0) {
        starHouseScene.toastT -= dt;
        if (starHouseScene.toastT <= 0) starHouseScene.toast = "";
      }

      starHouseScene.burstT -= dt;
      // 每帧最多喷 1 次，保证每次都是满额 10000 颗
      if (starHouseScene.burstT <= 0) {
        eruptFountain();
        starHouseScene.burstT = starHouseScene.burstEvery || 0.01;
      }

      starHouseScene._gainFrame = 0;
      const floorY = GROUND - 6;
      const room = starHouseScene.room;
      const left = room.x + 24;
      const right = room.x + room.w - 24;
      const px = player ? player.x + player.w / 2 : 0;
      const py = player ? player.y + player.h / 2 : 0;
      const list = starHouseScene.stars;
      let write = 0;
      for (let i = 0; i < list.length; i++) {
        const s = list[i];
        s.life -= dt;
        if (s.life <= 0) {
          recycleStar(s);
          continue;
        }
        s.vy += 520 * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vx *= 0.995;

        if (s.y + s.r >= floorY) {
          s.y = floorY - s.r;
          if (Math.abs(s.vy) > 60 && s.bounce < 2) {
            s.vy *= -0.42;
            s.vx *= 0.75;
            s.bounce += 1;
          } else {
            s.vy = 0;
            s.vx *= 0.88;
            s.grounded = true;
          }
        }

        if (s.x < left) {
          s.x = left;
          s.vx = Math.abs(s.vx) * 0.5;
        } else if (s.x > right) {
          s.x = right;
          s.vx = -Math.abs(s.vx) * 0.5;
        }

        if (player) {
          const dx = px - s.x;
          const dy = py - s.y;
          const reach = 32 + s.r;
          if (dx * dx + dy * dy < reach * reach) {
            collectStar(s);
            recycleStar(s);
            continue;
          }
        }
        list[write++] = s;
      }
      list.length = write;

      const gained = starHouseScene._gainFrame || 0;
      if (gained > 0) {
        stars += gained;
        saveStars();
        if (starLabel) starLabel.textContent = String(stars);
        statusLabel.textContent = `五角星屋 · 已捡 ${starHouseScene.sessionGain}`;
        if (collectFxCd <= 0) {
          collectFxCd = 0.08;
          if (typeof spawnBurst === "function") spawnBurst(px, py, "#ffe566", 6);
          if (window.GameAudio && GameAudio.playStar) GameAudio.playStar();
        }
        if (starHouseScene.sessionGain <= gained || starHouseScene.sessionGain % 100 < gained) {
          starToast(`捡到了！本局 +${starHouseScene.sessionGain}`, 1.2);
        }
      }

      const spray = starHouseScene.spray;
      let sw = 0;
      for (let i = 0; i < spray.length; i++) {
        const p = spray[i];
        p.life -= dt;
        if (p.life <= 0) continue;
        p.vy += 380 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        spray[sw++] = p;
      }
      spray.length = sw;
    }

    function drawStarHouseExtras() {
      if (!starHouseScene || level !== 22) return;
      const room = starHouseScene.room;
      const ax = room.x - cameraX;
      const t = starHouseScene.pulse;
      const sprites = ensureStarSprites();

      // 夜空感氛围
      const ambience = ctx.createLinearGradient(0, room.y, 0, room.y + room.h);
      ambience.addColorStop(0, "rgba(28, 22, 58, 0.4)");
      ambience.addColorStop(0.5, "rgba(40, 28, 70, 0.18)");
      ambience.addColorStop(1, "rgba(20, 14, 36, 0.35)");
      ctx.fillStyle = ambience;
      ctx.fillRect(ax, room.y, room.w, room.h);

      // 背景装饰星
      for (let i = 0; i < 18; i++) {
        const sx = room.x + 40 + ((i * 97) % (room.w - 80));
        const sy = room.y + 30 + ((i * 53) % 160);
        const tw = 0.35 + 0.25 * Math.sin(t * 2.2 + i);
        ctx.save();
        ctx.globalAlpha = tw;
        ctx.translate(sx - cameraX, sy);
        drawStarShape(0, 0, 4 + (i % 3), "#ffe9a8", null);
        ctx.restore();
      }

      // 招牌
      const signX = 480 - cameraX;
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(signX - 78, 68, 156, 28);
      ctx.fillStyle = "#ffe27a";
      ctx.font = "bold 16px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("五角星屋", signX, 88);

      // 喷泉底座
      const f = starHouseScene.fountain;
      const fx = f.x - cameraX;
      const fy = f.y;
      ctx.fillStyle = "#3a2a58";
      ctx.beginPath();
      ctx.ellipse(fx, fy, f.r + 10, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#5a4088";
      ctx.beginPath();
      ctx.ellipse(fx, fy - 4, f.r, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#7ec8ff";
      ctx.globalAlpha = 0.55 + Math.sin(t * 4) * 0.1;
      ctx.beginPath();
      ctx.ellipse(fx, fy - 6, f.r - 10, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // 喷泉柱 + 星形喷头
      ctx.fillStyle = "#c9a067";
      ctx.fillRect(fx - 8, fy - 52, 16, 46);
      ctx.save();
      ctx.translate(fx, fy - 58);
      ctx.rotate(t * 0.6);
      drawStarShape(0, 0, 22, "#ffd24a", "#ff9a2a");
      ctx.restore();

      // 水花粒子
      for (const p of starHouseScene.spray) {
        const ppx = p.x - cameraX;
        ctx.globalAlpha = Math.max(0, p.life * 2);
        ctx.fillStyle = "#b8e8ff";
        ctx.beginPath();
        ctx.arc(ppx, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // 飞散五角星：预渲染精灵 + drawImage（支撑单次 10000）
      const starsList = starHouseScene.stars;
      const cam = cameraX;
      const maxX = W + 20;
      for (let i = 0; i < starsList.length; i++) {
        const s = starsList[i];
        const sx = s.x - cam;
        if (sx < -20 || sx > maxX) continue;
        const size = s.r * 2;
        ctx.drawImage(sprites[s.hue], sx - s.r, s.y - s.r, size, size);
      }

      // Toast
      if (starHouseScene.toast && starHouseScene.toastT > 0) {
        ctx.save();
        ctx.font = "14px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(0,0,0,0.75)";
        ctx.fillStyle = "#ffe27a";
        const ty = 120;
        ctx.strokeText(starHouseScene.toast, W / 2, ty);
        ctx.fillText(starHouseScene.toast, W / 2, ty);
        ctx.restore();
      }

      // 本局计数
      ctx.save();
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(255,226,122,0.9)";
      ctx.fillText(`本局捡到 ${starHouseScene.sessionGain}`, 24, 64);
      ctx.restore();
    }

    S.initStarHouse22 = initStarHouse22;
    S.updateStarHouse22 = updateStarHouse22;
    S.drawStarHouseExtras = drawStarHouseExtras;
    S.syncStarHouse22OnLeave = syncStarHouse22OnLeave;
  }
};
