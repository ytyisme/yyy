// 画布绘制与关卡点击
window.installGameDraw = function (S) {
  with (S) {
  function drawChatBubble(cx, cy, text, color) {
    if (!text) return;
    ctx.save();
    ctx.font = "13px 'Noto Sans SC', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const label = String(text).slice(0, 12);
    const w = Math.min(170, Math.max(28, ctx.measureText(label).width + 16));
    const h = 22;
    const x = cx - w / 2;
    const y = cy - 20;
    ctx.fillStyle = "rgba(16, 8, 6, 0.88)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = color || "#ffd24a";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = "#fff6d0";
    ctx.fillText(label, cx, y + h / 2 + 0.5);
    ctx.restore();
  }

  function drawMoonBackground() {
    if (!moonSkyGrad) {
      moonSkyGrad = ctx.createLinearGradient(0, 0, 0, H);
      moonSkyGrad.addColorStop(0, "#070814");
      moonSkyGrad.addColorStop(0.45, "#121528");
      moonSkyGrad.addColorStop(1, "#2a2a32");
    }
    ctx.fillStyle = moonSkyGrad;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#d8d8e8";
    const starShift = (cameraX * 0.06) | 0;
    for (let i = 0; i < 18; i++) {
      const ax = ((i * 137 - starShift) % (W + 20) + (W + 20)) % (W + 20) - 10;
      const ay = (i * 47) % ((H * 0.62) | 0);
      ctx.fillRect(ax, ay, 1, 1);
    }

    const ex = W * 0.78;
    const ey = H * 0.18;
    if (!moonEarthGrad) {
      moonEarthGrad = ctx.createRadialGradient(ex, ey, 6, ex, ey, 28);
      moonEarthGrad.addColorStop(0, "#7ec8ff");
      moonEarthGrad.addColorStop(0.5, "#3a7ab8");
      moonEarthGrad.addColorStop(1, "rgba(20, 40, 80, 0)");
    }
    ctx.fillStyle = moonEarthGrad;
    ctx.fillRect(ex - 28, ey - 28, 56, 56);
    ctx.fillStyle = "#4aa0e0";
    ctx.fillRect(ex - 12, ey - 12, 24, 24);
    ctx.fillStyle = "#3d8a4a";
    ctx.fillRect(ex - 8, ey - 2, 8, 8);

    ctx.fillStyle = "rgba(160, 160, 168, 0.22)";
    const hillShift = cameraX * 0.18;
    for (let i = 0; i < 6; i++) {
      const bx = i * 340 - hillShift;
      ctx.fillRect(bx + 40, 278, 160, 40);
      ctx.fillRect(bx + 190, 248, 90, 28);
    }
  }

  function drawBackground() {
    if (level === 11) {
      drawMoonBackground();
      return;
    }
    if (level === 8) {
      drawCityBackground();
      return;
    }
    if (level === 14) {
      drawCityBackground();
      ctx.fillStyle = "rgba(8, 12, 28, 0.55)";
      ctx.fillRect(0, 0, W, H);
      return;
    }
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#24100c");
    g.addColorStop(0.55, "#1a0b08");
    g.addColorStop(1, "#3a1208");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Distant cliffs
    ctx.save();
    ctx.translate(-cameraX * 0.2, 0);
    ctx.fillStyle = "rgba(60, 24, 16, 0.55)";
    for (let i = 0; i < 12; i++) {
      const bx = i * 280;
      ctx.beginPath();
      ctx.moveTo(bx, 280);
      ctx.lineTo(bx + 80, 160 + (i % 3) * 20);
      ctx.lineTo(bx + 180, 250);
      ctx.lineTo(bx + 260, 190);
      ctx.lineTo(bx + 320, 300);
      ctx.lineTo(bx, 300);
      ctx.fill();
    }
    ctx.restore();

    // Ash particles
    ctx.fillStyle = "rgba(255, 180, 120, 0.25)";
    for (let i = 0; i < 30; i++) {
      const ax = ((i * 97 + time * (20 + (i % 5))) % (W + 40)) - 20;
      const ay = (i * 53 + Math.sin(time + i) * 20) % H;
      ctx.fillRect(ax, ay, 2, 2);
    }
  }

  function drawCityBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#1a2744");
    sky.addColorStop(0.45, "#2a3a55");
    sky.addColorStop(1, "#3a2a28");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // distant city glow
    const glow = ctx.createRadialGradient(W * 0.7, H * 0.55, 20, W * 0.7, H * 0.7, 280);
    glow.addColorStop(0, "rgba(255, 160, 60, 0.2)");
    glow.addColorStop(1, "rgba(255, 100, 40, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(-cameraX * 0.35, 0);
    for (let i = 0; i < 18; i++) {
      const bx = i * 160 - 40;
      const bh = 120 + (i % 5) * 35 + (i % 3) * 20;
      const by = LAVA_Y - 8 - bh;
      ctx.fillStyle = i % 2 === 0 ? "#1c2438" : "#151c2c";
      ctx.fillRect(bx, by, 120, bh);
      // windows
      for (let wy = by + 12; wy < by + bh - 20; wy += 18) {
        for (let wx = bx + 10; wx < bx + 110; wx += 16) {
          const lit = ((i * 13 + wx + Math.floor(wy)) % 7) !== 0;
          ctx.fillStyle = lit ? "rgba(255, 210, 120, 0.55)" : "rgba(40, 50, 70, 0.5)";
          ctx.fillRect(wx, wy, 8, 10);
        }
      }
    }
    ctx.restore();

    // street lights dust
    ctx.fillStyle = "rgba(200, 220, 255, 0.2)";
    for (let i = 0; i < 20; i++) {
      const ax = ((i * 113 + time * 15) % (W + 30)) - 10;
      const ay = 80 + (i * 37) % 200;
      ctx.fillRect(ax, ay, 2, 2);
    }
  }

  function drawLava() {
    if (level === 11) {
      drawMoonVoid();
      return;
    }
    if (level === 24 && furnaceScene) return;
    const base = LAVA_Y;
    const under =
      fakeLava && player && player.y + player.h > LAVA_Y + 4;
    const lavaGrad = ctx.createLinearGradient(0, base - 10, 0, H);
    lavaGrad.addColorStop(0, "#ffb347");
    lavaGrad.addColorStop(0.25, "#ff5a1f");
    lavaGrad.addColorStop(1, "#8a1400");
    ctx.save();
    // From above it looks real; only thin out once you've jumped in
    if (under) ctx.globalAlpha = 0.42;
    ctx.fillStyle = lavaGrad;
    ctx.fillRect(0, base, W, H - base);

    ctx.beginPath();
    ctx.moveTo(0, base);
    for (let x = 0; x <= W; x += 16) {
      const wave =
        Math.sin(x * 0.04 + time * 4) * 5 +
        Math.sin(x * 0.01 + time * 2.2) * 3;
      ctx.lineTo(x, base + wave);
    }
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 220, 80, 0.35)";
    ctx.fill();
    ctx.restore();

    // Heat glow
    const glow = ctx.createLinearGradient(0, base - 60, 0, base);
    glow.addColorStop(0, "rgba(255, 80, 20, 0)");
    glow.addColorStop(1, under ? "rgba(255, 60, 10, 0.14)" : "rgba(255, 60, 10, 0.28)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, base - 60, W, 60);

    // Drained magma pockets (bucket)
    for (const d of lavaDrains) {
      const x = d.x - cameraX;
      if (x + d.w < 0 || x > W) continue;
      ctx.fillStyle = "#1a100c";
      ctx.fillRect(x, base - 2, d.w, H - base + 2);
      ctx.fillStyle = "rgba(80, 140, 180, 0.25)";
      ctx.fillRect(x, base - 2, d.w, 10);
      ctx.fillStyle = "rgba(160, 210, 255, 0.35)";
      ctx.font = "11px 'Noto Sans SC', sans-serif";
      ctx.fillText("已吸干", x + 8, base + 14);
    }
  }

  function drawMoonVoid() {
    const base = LAVA_Y;
    if (!moonVoidGrad) {
      moonVoidGrad = ctx.createLinearGradient(0, base - 30, 0, H);
      moonVoidGrad.addColorStop(0, "rgba(8, 8, 14, 0)");
      moonVoidGrad.addColorStop(0.2, "#14141c");
      moonVoidGrad.addColorStop(1, "#050508");
    }
    ctx.fillStyle = moonVoidGrad;
    ctx.fillRect(0, base - 8, W, H - base + 8);

    ctx.fillStyle = "#2a2a34";
    for (const c of craters) {
      const x = c.x - cameraX;
      if (x + c.w < -20 || x > W + 20) continue;
      ctx.fillRect(x, base - 4, c.w, 18);
    }
  }

  function drawBrick(p) {
    const x = p.x - cameraX;
    const y = p.y;
    if (x + p.w < -20 || x > W + 20) return;

    if (p.theme === "tower") {
      ctx.fillStyle = "#4a5568";
      ctx.fillRect(x, y, p.w, p.h + 4);
      ctx.fillStyle = "#6b7280";
      ctx.fillRect(x + 3, y + 2, p.w - 6, p.h - 4);
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(x + 3, y + 2, p.w - 6, 3);
      return;
    }
    if (p.theme === "towerWall") {
      ctx.fillStyle = "#374151";
      ctx.fillRect(x, y, p.w, p.h);
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(x + p.w - 4, y, 4, p.h);
      return;
    }
    if (p.theme === "towerStair") {
      ctx.fillStyle = "#7a8494";
      ctx.fillRect(x, y, p.w, p.h);
      ctx.fillStyle = "#9aa3b2";
      ctx.fillRect(x + 2, y + 1, p.w - 4, p.h - 4);
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(x + 2, y + 1, p.w - 4, 2);
      ctx.fillStyle = "#5c6575";
      ctx.fillRect(x, y + p.h - 2, p.w, 2);
      // 防滑纹
      ctx.strokeStyle = "rgba(0,0,0,0.12)";
      ctx.lineWidth = 1;
      for (let i = 6; i < p.w - 4; i += 8) {
        ctx.beginPath();
        ctx.moveTo(x + i, y + 3);
        ctx.lineTo(x + i + 3, y + p.h - 4);
        ctx.stroke();
      }
      return;
    }
    if (p.theme === "towerShaft") {
      ctx.fillStyle = "#252b38";
      ctx.fillRect(x, y, p.w, p.h);
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      for (let sy = y + 6; sy < y + p.h; sy += 14) {
        ctx.fillRect(x + 1, sy, p.w - 2, 5);
      }
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(x, y, 2, p.h);
      return;
    }

    if (p.theme === "moon") {
      ctx.fillStyle = "#6d6d74";
      ctx.fillRect(x, y, p.w, p.h + 8);
      ctx.fillStyle = "#9a9aa3";
      ctx.fillRect(x + 2, y + 2, p.w - 4, p.h - 4);
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      ctx.fillRect(x + 2, y + 2, p.w - 4, 3);
      return;
    }

    if (p.theme === "battle") {
      ctx.fillStyle = "#3a3428";
      ctx.fillRect(x, y, p.w, p.h + 6);
      ctx.fillStyle = "#5a5040";
      ctx.fillRect(x + 2, y + 2, p.w - 4, p.h - 4);
      ctx.fillStyle = "rgba(255,210,74,0.12)";
      ctx.fillRect(x + 2, y + 2, p.w - 4, 3);
      return;
    }

    if (p.theme === "school") {
      ctx.fillStyle = "#c4a574";
      ctx.fillRect(x, y, p.w, p.h);
      ctx.fillStyle = "#a88858";
      for (let i = 0; i < p.w; i += 48) ctx.fillRect(x + i, y, 2, p.h);
      ctx.fillStyle = "#8a6a40";
      ctx.fillRect(x, y, p.w, 3);
      return;
    }
    if (p.theme === "schoolWall") {
      ctx.fillStyle = "#d8c8b0";
      ctx.fillRect(x, y, p.w, p.h);
      ctx.fillStyle = "#c0b098";
      ctx.fillRect(x, y, Math.min(p.w, 4), p.h);
      return;
    }
    if (p.theme === "schoolDoor") {
      ctx.fillStyle = "#6b3f1f";
      ctx.fillRect(x, y, p.w, p.h);
      return;
    }
    if (p.theme === "musicWall") {
      ctx.fillStyle = "#3a2a55";
      ctx.fillRect(x, y, p.w, p.h);
      ctx.fillStyle = "#6a4a88";
      ctx.fillRect(x + 1, y + 1, Math.max(0, p.w - 2), Math.max(0, p.h - 2));
      return;
    }
    if (p.theme === "musicFloor") {
      ctx.fillStyle = "#2a2438";
      ctx.fillRect(x, y, p.w, p.h);
      ctx.fillStyle = "#4a3a5a";
      ctx.fillRect(x, y, p.w, 3);
      return;
    }
    if (p.theme === "dateFloor") {
      ctx.fillStyle = "#3a2418";
      ctx.fillRect(x, y, p.w, p.h);
      ctx.fillStyle = "#5a3a28";
      for (let i = 0; i < p.w; i += 48) {
        ctx.fillRect(x + i, y, 22, p.h);
      }
      ctx.fillStyle = "#8a5a38";
      ctx.fillRect(x, y, p.w, 3);
      return;
    }
    if (p.theme === "dateWall") {
      ctx.fillStyle = "#4a2a22";
      ctx.fillRect(x, y, p.w, p.h);
      ctx.fillStyle = "#6a4030";
      ctx.fillRect(x + 1, y + 1, Math.max(0, p.w - 2), Math.max(0, p.h - 2));
      return;
    }
    if (p.theme === "dateShelf") {
      ctx.fillStyle = "#6b4423";
      ctx.fillRect(x, y, p.w, p.h);
      ctx.fillStyle = "#8b5a2b";
      ctx.fillRect(x + 2, y + 2, p.w - 4, Math.max(2, p.h - 4));
      return;
    }
    if (p.theme === "kongGirder") {
      ctx.fillStyle = "#b33a2e";
      ctx.fillRect(x, y, p.w, p.h);
      ctx.fillStyle = "#e85a45";
      ctx.fillRect(x, y, p.w, 4);
      ctx.fillStyle = "#7a2218";
      for (let i = 0; i < p.w; i += 18) {
        ctx.fillRect(x + i, y + 4, 2, p.h - 4);
      }
      return;
    }
    if (p.theme === "kongWall") {
      ctx.fillStyle = "#2a2040";
      ctx.fillRect(x, y, p.w, p.h);
      return;
    }
    if (p.theme === "starFloor") {
      ctx.fillStyle = "#2a1848";
      ctx.fillRect(x, y, p.w, p.h);
      ctx.fillStyle = "#4a3070";
      for (let i = 0; i < p.w; i += 40) {
        ctx.fillRect(x + i, y, 18, p.h);
      }
      ctx.fillStyle = "#ffd24a";
      ctx.fillRect(x, y, p.w, 3);
      return;
    }
    if (p.theme === "starWall") {
      ctx.fillStyle = "#241838";
      ctx.fillRect(x, y, p.w, p.h);
      ctx.fillStyle = "#3a2858";
      ctx.fillRect(x + 1, y + 1, Math.max(0, p.w - 2), Math.max(0, p.h - 2));
      return;
    }
    if (p.theme === "starShelf") {
      ctx.fillStyle = "#5a4080";
      ctx.fillRect(x, y, p.w, p.h);
      ctx.fillStyle = "#ffd24a";
      ctx.fillRect(x + 2, y + 2, p.w - 4, Math.max(2, p.h - 4));
      return;
    }
    if (p.theme === "matchFloor") {
      ctx.fillStyle = "#1a2030";
      ctx.fillRect(x, y, p.w, p.h);
      ctx.fillStyle = "#3a4868";
      ctx.fillRect(x, y, p.w, 3);
      return;
    }
    if (p.theme === "matchWall") {
      ctx.fillStyle = "#141824";
      ctx.fillRect(x, y, p.w, p.h);
      ctx.fillStyle = "#2a3348";
      ctx.fillRect(x + 1, y + 1, Math.max(0, p.w - 2), Math.max(0, p.h - 2));
      return;
    }
    if (p.theme === "furnaceWall") {
      ctx.fillStyle = "#3a2218";
      ctx.fillRect(x, y, p.w, p.h);
      ctx.fillStyle = "#5a3828";
      for (let i = 0; i < p.h; i += 22) {
        ctx.fillRect(x + 2, y + i, p.w - 4, 10);
      }
      return;
    }
    if (p.theme === "furnaceStone") {
      ctx.fillStyle = "#6a6058";
      ctx.fillRect(x, y, p.w, p.h);
      ctx.fillStyle = "#8a8078";
      ctx.fillRect(x, y, p.w, 4);
      ctx.fillStyle = "#4a443c";
      for (let i = 0; i < p.w; i += 16) {
        ctx.fillRect(x + i, y + 4, 2, p.h - 4);
      }
      return;
    }
    if (p.theme === "furnaceBrick") {
      ctx.fillStyle = "#a87848";
      ctx.fillRect(x, y, p.w, p.h);
      ctx.fillStyle = "#c89868";
      ctx.fillRect(x + 1, y + 1, p.w - 2, 4);
      ctx.fillStyle = "#805828";
      ctx.fillRect(x + 2, y + p.h - 4, p.w - 4, 3);
      return;
    }

    if (p.theme === "crate") {
      ctx.fillStyle = "#6b4423";
      ctx.fillRect(x, y, p.w, p.h);
      ctx.fillStyle = "#8b5a2b";
      ctx.fillRect(x + 2, y + 2, p.w - 4, p.h - 4);
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 4, y + 4, p.w - 8, p.h - 8);
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 4);
      ctx.lineTo(x + p.w - 4, y + p.h - 4);
      ctx.moveTo(x + p.w - 4, y + 4);
      ctx.lineTo(x + 4, y + p.h - 4);
      ctx.stroke();
      return;
    }

    if (p.theme === "sandbag") {
      ctx.fillStyle = "#5a5240";
      ctx.fillRect(x, y, p.w, p.h);
      ctx.fillStyle = "#7a7058";
      const rows = Math.max(1, Math.floor(p.h / 14));
      for (let r = 0; r < rows; r++) {
        const ry = y + p.h - (r + 1) * 14;
        const odd = r % 2;
        for (let c = odd ? -0.5 : 0; c < p.w / 22 + 1; c++) {
          const cx = x + c * 22 + 2;
          if (cx + 18 < x || cx > x + p.w) continue;
          const bw = Math.min(18, x + p.w - cx - 2);
          if (bw < 6) continue;
          ctx.fillRect(cx, ry + 2, bw, 11);
          ctx.fillStyle = "#8a8068";
          ctx.fillRect(cx + 1, ry + 3, Math.max(2, bw - 4), 3);
          ctx.fillStyle = "#7a7058";
        }
      }
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, p.w - 1, p.h - 1);
      return;
    }

    if (p.theme === "jelly") {
      const wobble = Math.sin(performance.now() / 280 + p.x * 0.02) * (1.2 - (p.squish || 0));
      const squish = p.squish || 0;
      const pressX = p.pressX != null ? p.pressX : 0.5;
      const dip = squish * 11;
      const bulge = squish * 6;
      const topAt = (t) => {
        const d = Math.exp(-Math.pow((t - pressX) * 5.2, 2));
        return y + wobble + dip * d;
      };
      ctx.save();
      ctx.beginPath();
      const steps = 12;
      ctx.moveTo(x, topAt(0) + 4);
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        ctx.lineTo(x + p.w * t, topAt(t));
      }
      ctx.lineTo(x + p.w + bulge * 0.4, y + p.h);
      ctx.lineTo(x - bulge * 0.4, y + p.h);
      ctx.closePath();
      const midY = topAt(pressX);
      const grad = ctx.createLinearGradient(x, midY, x, y + p.h);
      grad.addColorStop(0, "rgba(255, 170, 220, 0.95)");
      grad.addColorStop(0.45, "rgba(255, 110, 190, 0.9)");
      grad.addColorStop(1, "rgba(210, 70, 160, 0.88)");
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
      ctx.beginPath();
      ctx.ellipse(x + p.w * 0.28, topAt(0.28) + 6, p.w * 0.18, 3.5 - squish, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    if (p.theme === "keyboard") {
      ctx.fillStyle = "#1c1e24";
      ctx.fillRect(x, y, p.w, p.h + 6);
      const keyW = 22;
      const gap = 3;
      const cols = Math.max(1, Math.floor((p.w - 6) / (keyW + gap)));
      const labels = "QWERTYUIOPASDFGHJKLZXCVBNM".split("");
      const pressed = p.pressedKey;
      const squish = p.squish || 0;
      for (let i = 0; i < cols; i++) {
        const kx = x + 4 + i * (keyW + gap);
        const down = pressed === i ? 5 * Math.max(squish, 0.55) : 0;
        const ky = y + 3 + down;
        const kh = p.h - 2 - down;
        ctx.fillStyle = down > 0 ? "#22262e" : "#2e323c";
        ctx.fillRect(kx, ky, keyW, Math.max(8, kh));
        if (down <= 0) {
          ctx.fillStyle = "#4a5160";
          ctx.fillRect(kx + 1, ky + 1, keyW - 2, 4);
        } else {
          // 凹下去的键：更深阴影
          ctx.fillStyle = "rgba(0,0,0,0.35)";
          ctx.fillRect(kx, y + 3, keyW, down);
        }
        ctx.fillStyle = down > 0 ? "#9aa3b5" : "#d7dce8";
        ctx.font = "8px 'Press Start 2P', monospace";
        ctx.textAlign = "center";
        ctx.fillText(labels[(i + Math.floor(p.x / 17)) % labels.length], kx + keyW / 2, ky + 14);
      }
      ctx.textAlign = "left";
      return;
    }

    if (p.theme === "oreo") {
      const squish = p.squish || 0;
      const pressX = p.pressX != null ? p.pressX : 0.5;
      const dip = squish * 9;
      const topAt = (t) => {
        const d = Math.exp(-Math.pow((t - pressX) * 5, 2));
        return y + dip * d;
      };
      const h = p.h + 4;
      ctx.save();
      // 用分层路径画出压弯的奥利奥
      const drawLayer = (y0, y1, color) => {
        ctx.beginPath();
        const steps = 10;
        ctx.moveTo(x + 2, topAt(0) + y0);
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          ctx.lineTo(x + 2 + (p.w - 4) * t, topAt(t) + y0);
        }
        for (let i = steps; i >= 0; i--) {
          const t = i / steps;
          ctx.lineTo(x + 2 + (p.w - 4) * t, topAt(t) + y1);
        }
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      };
      drawLayer(0, h * 0.32, "#2a221c");
      drawLayer(h * 0.3, h * 0.58, "#f4f0e8");
      drawLayer(h * 0.55, h, "#1a1410");
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      for (let i = 0; i < Math.floor(p.w / 14); i++) {
        const t = (10 + i * 14) / p.w;
        ctx.beginPath();
        ctx.arc(x + 10 + i * 14, topAt(t) + 6, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    if (p.theme === "chocoice") {
      // 冰块本体（不碎）
      ctx.fillStyle = "rgba(160, 220, 255, 0.85)";
      ctx.fillRect(x, y + 8, p.w, p.h);
      ctx.fillStyle = "rgba(210, 245, 255, 0.55)";
      ctx.fillRect(x + 2, y + 10, p.w - 4, 5);
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 1, y + 9, p.w - 2, p.h - 2);
      // 表层巧克力
      const chY = y;
      const chH = 10;
      ctx.fillStyle = p.chocolateCracked ? "#5a2e18" : "#4a2414";
      ctx.fillRect(x - 1, chY, p.w + 2, chH);
      ctx.fillStyle = p.chocolateCracked ? "#7a4228" : "#6b341c";
      ctx.fillRect(x + 1, chY + 1, p.w - 2, 3);
      if (p.chocolateCracked) {
        ctx.strokeStyle = "rgba(20, 8, 4, 0.85)";
        ctx.lineWidth = 1.5;
        const cx = x + p.w * 0.5;
        ctx.beginPath();
        ctx.moveTo(cx - 8, chY + 1);
        ctx.lineTo(cx + 2, chY + 5);
        ctx.lineTo(cx - 4, chY + 9);
        ctx.moveTo(cx + 10, chY + 1);
        ctx.lineTo(cx + 4, chY + 6);
        ctx.lineTo(cx + 14, chY + 9);
        ctx.moveTo(x + 8, chY + 2);
        ctx.lineTo(x + 18, chY + 8);
        ctx.moveTo(x + p.w - 10, chY + 2);
        ctx.lineTo(x + p.w - 20, chY + 8);
        ctx.stroke();
        // 露出一点冰
        ctx.fillStyle = "rgba(190, 235, 255, 0.7)";
        ctx.fillRect(cx - 3, chY + 3, 6, 4);
      } else {
        ctx.fillStyle = "rgba(255, 220, 180, 0.25)";
        ctx.fillRect(x + 4, chY + 2, p.w * 0.35, 2);
      }
      return;
    }

    if (p.lane === "secret") {
      ctx.fillStyle = "#2a1810";
      ctx.fillRect(x, y, p.w, p.h);
      ctx.fillStyle = "#4a3020";
      ctx.fillRect(x + 2, y + 2, p.w - 4, p.h - 5);
      ctx.fillStyle = "rgba(255, 120, 40, 0.12)";
      ctx.fillRect(x + 2, y + 2, p.w - 4, 3);
      return;
    }

    if (p.lane === "bridge") {
      ctx.fillStyle = "#3a2418";
      ctx.fillRect(x, y, p.w, p.h + 10);
      ctx.fillStyle = "#24140e";
      ctx.fillRect(x + 2, y + 2, p.w - 4, p.h + 6);
      ctx.strokeStyle = "#8a5a28";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, p.w - 2, p.h + 8);
      ctx.fillStyle = "#ffd24a";
      ctx.font = "9px 'Press Start 2P', monospace";
      ctx.textAlign = "center";
      ctx.fillText(p.label || "砖", x + p.w / 2, y + 18);
      ctx.textAlign = "left";
      return;
    }

    const roof = p.lane === "roof";
    ctx.fillStyle = roof ? "#3a2818" : "#5a2e20";
    ctx.fillRect(x, y, p.w, p.h);
    ctx.fillStyle = roof ? "#5a4030" : "#7a4430";
    ctx.fillRect(x + 2, y + 2, p.w - 4, p.h - 6);

    const cols = Math.max(1, Math.floor(p.w / 28));
    const bw = p.w / cols;
    ctx.strokeStyle = "rgba(30, 12, 8, 0.55)";
    ctx.lineWidth = 1;
    for (let i = 1; i < cols; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * bw, y + 2);
      ctx.lineTo(x + i * bw, y + p.h - 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(x + 2, y + p.h / 2);
    ctx.lineTo(x + p.w - 2, y + p.h / 2);
    ctx.stroke();

    ctx.fillStyle = roof
      ? "rgba(180, 80, 60, 0.22)"
      : "rgba(255, 200, 150, 0.18)";
    ctx.fillRect(x + 2, y + 2, p.w - 4, 4);

    if (roof) {
      ctx.fillStyle = "rgba(40, 20, 12, 0.7)";
      for (let i = 0; i < cols; i++) {
        const tx = x + i * bw + bw * 0.45;
        ctx.beginPath();
        ctx.moveTo(tx - 3, y + p.h);
        ctx.lineTo(tx + 3, y + p.h);
        ctx.lineTo(tx, y + p.h + 7);
        ctx.fill();
      }
    }
  }

  function drawPlayer() {
    const x = player.x - cameraX;
    let sink = 0;
    if (player.onGround) {
      for (const pl of platforms) {
        if (pl.theme !== "jelly" && pl.theme !== "oreo") continue;
        if (rectsOverlap(
          { x: player.x + 2, y: player.y + player.h - 2, w: player.w - 4, h: 6 },
          pl
        )) {
          sink = (pl.squish || 0) * 8;
          break;
        }
      }
    }
    const y = player.y + sink;
    const hop = player.onGround ? 0 : -2;

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(x + 14, y + player.h + 4, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    let shirt = speedBoost > 0 ? "#7aefff" : "#3ec6ff";
    let pants = "#245a8a";
    if (level === 20 && dateScene && dateScene.gender === "f") {
      shirt = speedBoost > 0 ? "#ffb0d8" : "#ff7eb6";
      pants = "#c44f88";
    } else if (level === 20 && dateScene && dateScene.gender === "m") {
      shirt = speedBoost > 0 ? "#7ab8ff" : "#3b8cff";
      pants = "#245a8a";
    }
    ctx.fillStyle = shirt;
    ctx.fillRect(x + 6, y + 10 + hop, 16, 22);
    // Head
    ctx.fillStyle = "#ffe0b8";
    ctx.fillRect(x + 6, y + hop, 16, 14);
    if (level === 20 && dateScene && dateScene.gender === "f") {
      ctx.fillStyle = "#5a3a28";
      ctx.fillRect(x + 5, y - 2 + hop, 18, 6);
      ctx.fillRect(x + 4, y + 4 + hop, 4, 12);
      ctx.fillRect(x + 20, y + 4 + hop, 4, 12);
    }
    // Eyes
    ctx.fillStyle = "#1a0c08";
    ctx.fillRect(x + (player.facing >= 0 ? 14 : 8), y + 5 + hop, 3, 3);
    // Legs
    const swing = player.onGround && Math.abs(player.vx) > 0.2
      ? Math.sin(time * 14) * 4
      : 0;
    ctx.fillStyle = pants;
    ctx.fillRect(x + 7, y + 30 + hop, 5, 10 + swing);
    ctx.fillRect(x + 16, y + 30 + hop, 5, 10 - swing);

    if (playerName || level >= 5) {
      const raw = playerName || "???";
      const label = raw.length > 16 ? `${raw.slice(0, 16)}…` : raw;
      ctx.save();
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0, 0, 0, 0.75)";
      ctx.fillStyle = "#ffe27a";
      const labelX = x + player.w / 2;
      const labelY = y - 10 + hop;
      ctx.strokeText(label, labelX, labelY);
      ctx.fillText(label, labelX, labelY);
      ctx.restore();
      if (localChat && time < localChatUntil) {
        drawChatBubble(x + player.w / 2, y - 18 + hop, localChat, "#ffe07a");
      }
    }
  }

  function drawZombie(z) {
    const x = z.x - cameraX;
    const y = z.y + Math.sin(z.bob) * 1.5;
    if (x < -80 || x > W + 80) return;
    const above = z.mode === "above";
    const big = !!z.big;
    const s = big ? 2.15 : 1;

    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(
      x + (big ? 32 : 15),
      z.y + z.h + 3,
      big ? 28 : 12,
      big ? 6 : 3,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    const bodyX = x + (big ? 10 : 5);
    const bodyY = y + (big ? 22 : 10);
    // Body
    const bodyColor = z.fake
      ? "#4a7a38"
      : above
        ? "#3d5a28"
        : big
          ? "#2f5a22"
          : "#4a7a38";
    const headColor = z.fake
      ? "#6aaa4a"
      : above
        ? "#8bcc3a"
        : big
          ? "#6db84a"
          : "#6aaa4a";
    ctx.fillStyle = bodyColor;
    ctx.fillRect(bodyX, bodyY, 20 * s, 20 * s * 0.85);
    ctx.fillStyle = headColor;
    ctx.fillRect(x + (big ? 8 : 4), y, 22 * s * 0.95, 14 * s);

    ctx.fillStyle = z.fake ? "#ff3030" : above ? "#ffee44" : "#ff3030";
    const eyeY = y + (big ? 10 : 4);
    ctx.fillRect(x + (big ? 16 : 8), eyeY, big ? 8 : 4, big ? 8 : 4);
    ctx.fillRect(x + (big ? 36 : 16), eyeY, big ? 8 : 4, big ? 8 : 4);

    ctx.fillStyle = z.fake ? "#4a7a38" : above ? "#3d5a28" : big ? "#2f5a22" : "#4a7a38";
    if (above && !z.fake) {
      const hang = 8 + Math.sin(z.bob * 1.8) * 4;
      ctx.fillRect(x + 2, y + 14, 5, hang);
      ctx.fillRect(x + 23, y + 14, 5, hang);
      ctx.fillStyle = "#c8e060";
      ctx.fillRect(x + 1, y + 14 + hang, 7, 3);
      ctx.fillRect(x + 22, y + 14 + hang, 7, 3);
    } else if (big) {
      const reach = 14 + Math.sin(z.bob * 1.5) * 5;
      ctx.fillRect(x + 52, y + 30, reach, 10);
      ctx.fillRect(x - reach + 8, y + 34, reach, 10);
      ctx.fillStyle = "#c8e060";
      ctx.fillRect(x + 52 + reach - 2, y + 28, 8, 14);
    } else {
      const reach = 6 + Math.sin(z.bob * 1.5) * 3;
      ctx.fillRect(x + 22, y + 14, reach, 5);
      ctx.fillRect(x - reach + 4, y + 16, reach, 5);
    }

    ctx.fillStyle = "#2f4f22";
    const swing = Math.sin(z.bob * 2) * (big ? 5 : 3);
    if (big) {
      ctx.fillRect(x + 16, y + 58, 12, 20 + swing);
      ctx.fillRect(x + 36, y + 58, 12, 20 - swing);
    } else {
      ctx.fillRect(x + 8, y + 28, 6, 10 + swing);
      ctx.fillRect(x + 16, y + 28, 6, 10 - swing);
    }
  }

  function drawCrate() {
    if (!crate) return;
    const x = crate.x - cameraX;
    const y = crate.y;
    if (x < -50 || x > W + 50) return;

    ctx.fillStyle = "#6b4226";
    ctx.fillRect(x, y, crate.w, crate.h);
    ctx.fillStyle = "#8b5a32";
    ctx.fillRect(x + 3, y + 3, crate.w - 6, crate.h - 6);
    ctx.strokeStyle = "#3a2414";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, crate.w - 2, crate.h - 2);
    ctx.beginPath();
    ctx.moveTo(x + crate.w / 2, y + 3);
    ctx.lineTo(x + crate.w / 2, y + crate.h - 3);
    ctx.moveTo(x + 3, y + crate.h / 2);
    ctx.lineTo(x + crate.w - 3, y + crate.h / 2);
    ctx.stroke();
    // Metal latch
    ctx.fillStyle = crate.open ? "#888" : "#ffd24a";
    ctx.fillRect(x + crate.w / 2 - 4, y + crate.h / 2 - 4, 8, 8);

    if (!crate.open) {
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "10px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("箱子", x + crate.w / 2, y - 6);
      ctx.textAlign = "left";
    }
  }

  function drawPotion() {
    if (!potion) return;
    const x = potion.x - cameraX;
    const y = potion.y + Math.sin(potion.bob) * 4;
    if (x < -40 || x > W + 40) return;

    ctx.fillStyle = "rgba(92, 225, 255, 0.25)";
    ctx.beginPath();
    ctx.arc(x + 11, y + 16, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#e8f7ff";
    ctx.fillRect(x + 7, y, 8, 8);
    ctx.fillStyle = "#5ce1ff";
    ctx.fillRect(x + 4, y + 8, 14, 18);
    ctx.fillStyle = "#9af0ff";
    ctx.fillRect(x + 6, y + 10, 5, 10);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 4, y + 8, 14, 18);

    ctx.fillStyle = "#ffe27a";
    ctx.font = "10px 'Noto Sans SC', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("速度药水", x + 11, y - 6);
    ctx.textAlign = "left";
  }

  function drawStar() {
    if (!star || star.collected) return;
    const x = star.x - cameraX;
    const y = star.y + Math.sin(star.pulse) * 6;
    if (x < -40 || x > W + 40) return;

    ctx.save();
    ctx.translate(x, y);
    if (level !== 11) {
      const glow = 0.45 + Math.sin(star.pulse * 1.5) * 0.25;
      ctx.shadowColor = `rgba(255, 220, 80, ${glow})`;
      ctx.shadowBlur = 24 + Math.sin(star.pulse) * 10;
      const rg = ctx.createRadialGradient(0, 0, 2, 0, 0, 40);
      rg.addColorStop(0, `rgba(255, 240, 120, ${0.35 + glow * 0.3})`);
      rg.addColorStop(1, "rgba(255, 160, 40, 0)");
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(0, 0, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      const b = a + Math.PI / 5;
      const r1 = star.r + 4;
      const r2 = star.r * 0.42;
      ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.lineTo(Math.cos(b) * r2, Math.sin(b) * r2);
    }
    ctx.closePath();
    ctx.fillStyle = "#ffd24a";
    ctx.fill();
    ctx.restore();
  }

  function drawPickupStars() {
    if (level !== 11) return;
    ctx.fillStyle = "#ffe566";
    for (const p of pickups) {
      if (p.collected) continue;
      const x = p.x - cameraX;
      if (x < -20 || x > W + 20) continue;
      const y = p.y + Math.sin(p.pulse) * 2;
      ctx.fillRect(x - 4, y - 4, 8, 8);
    }
  }

  function drawRemotePlayers() {
    for (const rp of remotePlayers.values()) {
      if (rp.x == null || rp.y == null) continue;
      const x = (rp.drawX != null ? rp.drawX : rp.x) - cameraX;
      const y = rp.drawY != null ? rp.drawY : rp.y;
      if (x < -80 || x > W + 80) continue;
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(x + 4, y + 40, 20, 4);
      ctx.fillStyle = rp.color || "#ff8a5c";
      ctx.fillRect(x + 6, y + 10, 16, 22);
      ctx.fillStyle = "#ffe0b8";
      ctx.fillRect(x + 6, y, 16, 14);
      ctx.fillStyle = "#1a0c08";
      ctx.fillRect(x + ((rp.facing || 1) >= 0 ? 14 : 8), y + 5, 3, 3);
      ctx.fillStyle = "#3a3a48";
      ctx.fillRect(x + 7, y + 30, 5, 10);
      ctx.fillRect(x + 16, y + 30, 5, 10);
      const label = String(rp.name || "玩家").slice(0, 16);
      ctx.save();
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0, 0, 0, 0.75)";
      ctx.fillStyle = rp.color || "#ffe27a";
      ctx.strokeText(label, x + 14, y - 10);
      ctx.fillText(label, x + 14, y - 10);
      ctx.restore();
      if (rp.chat && time < (rp.chatUntil || 0)) {
        drawChatBubble(x + 14, y - 18, rp.chat, rp.color || "#ffe07a");
      }
    }
  }

  function updateShopScene(dt) {
    if (!shopScene || state !== "playing") return;
    const s = shopScene;
    s.pulse += dt * 3;
    s.talkTimer += dt;

    // Advance shop clock from 11:58 toward noon (and a bit past)
    if (s.phase === "waiting" || s.phase === "rush") {
      s.clockAcc += dt * s.timeScale;
      while (s.clockAcc >= 1) {
        s.clockAcc -= 1;
        s.second += 1;
        if (s.second >= 60) {
          s.second = 0;
          s.minute += 1;
          if (s.minute >= 60) {
            s.minute = 0;
            s.hour = (s.hour + 1) % 24;
          }
        }
      }
    }

    if (s.phase === "waiting" && s.hour >= 12) {
      s.phase = "rush";
      s.doorOpen = true;
      s.talk = "开门啦！快来买五角星！";
      statusLabel.textContent = "12:00 开门！";
      if (window.GameAudio) GameAudio.playClick();
      for (const c of s.customers) {
        c.vx = -5.5 - Math.random() * 2.5;
        c.leave = false;
      }
      shake = 8;
    }

    if (s.phase === "rush") {
      for (const c of s.customers) {
        if (c.leave) {
          c.x += 360 * dt;
          continue;
        }
        c.x += c.vx;
        if (!c.inShop && c.x <= c.targetX) {
          c.x = c.targetX;
          c.vx = 0;
          c.inShop = true;
          if (s.stock > 0) {
            s.stock -= 1;
            spawnBurst(s.x + s.w * 0.5, s.y - 90, "#ffe566", 8);
            if (window.GameAudio) GameAudio.playClick();
          }
          c.bought = true;
          c.leave = true;
        }
      }
      if (s.stock <= 0) {
        s.phase = "soldout";
        s.talk = "排到你了……五角星卖完了";
        statusLabel.textContent = "五角星卖完了";
      }
    }
  }

  function drawShopClock(s, cx, cy) {
    const r = 28;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = "#f5e6c8";
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#5a3020";
    ctx.lineWidth = 3;
    ctx.stroke();
    // ticks
    ctx.strokeStyle = "#3a2010";
    ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (r - 6), Math.sin(a) * (r - 6));
      ctx.lineTo(Math.cos(a) * (r - 2), Math.sin(a) * (r - 2));
      ctx.stroke();
    }
    const mins = s.minute + s.second / 60;
    const hours = (s.hour % 12) + mins / 60;
    const ha = (hours / 12) * Math.PI * 2 - Math.PI / 2;
    const ma = (mins / 60) * Math.PI * 2 - Math.PI / 2;
    ctx.strokeStyle = "#2a1208";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(ha) * 14, Math.sin(ha) * 14);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(ma) * 20, Math.sin(ma) * 20);
    ctx.stroke();
    ctx.fillStyle = "#c04020";
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Digital readout under clock
    const hh = String(s.hour).padStart(2, "0");
    const mm = String(s.minute).padStart(2, "0");
    const ss = String(s.second).padStart(2, "0");
    ctx.fillStyle = "rgba(18, 8, 6, 0.75)";
    ctx.fillRect(cx - 36, cy + r + 6, 72, 18);
    ctx.fillStyle = "#ffd24a";
    ctx.font = "11px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${hh}:${mm}:${ss}`, cx, cy + r + 15);
  }

  function drawShopNpc(s) {
    const bx = s.x + 36 - cameraX;
    const by = s.y - 40;
    const bob = Math.sin(s.pulse * 1.5) * 1.5;
    // body pink
    ctx.fillStyle = "#ff8ab8";
    ctx.fillRect(bx + 4, by - 22 + bob, 22, 26);
    // head
    ctx.fillStyle = "#f0c8a8";
    ctx.beginPath();
    ctx.arc(bx + 15, by - 30 + bob, 11, 0, Math.PI * 2);
    ctx.fill();
    // orange hair
    ctx.fillStyle = "#ff7a1a";
    ctx.beginPath();
    ctx.ellipse(bx + 15, by - 36 + bob, 13, 9, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(bx + 3, by - 36 + bob, 6, 14);
    ctx.fillRect(bx + 21, by - 36 + bob, 6, 14);
    // eyes
    ctx.fillStyle = "#2a1208";
    ctx.fillRect(bx + 10, by - 32 + bob, 3, 3);
    ctx.fillRect(bx + 17, by - 32 + bob, 3, 3);
    // smile
    ctx.strokeStyle = "#2a1208";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(bx + 15, by - 27 + bob, 3, 0.1, Math.PI - 0.1);
    ctx.stroke();
    // legs
    ctx.fillStyle = "#5a3a28";
    ctx.fillRect(bx + 6, by + 4 + bob, 6, 10);
    ctx.fillRect(bx + 18, by + 4 + bob, 6, 10);

    // speech bubble
    if (s.talk) {
      const tx = bx + 40;
      const ty = by - 58 + bob;
      ctx.font = "13px 'Noto Sans SC', sans-serif";
      const tw = Math.min(160, ctx.measureText(s.talk).width + 16);
      ctx.fillStyle = "rgba(255, 248, 235, 0.95)";
      ctx.fillRect(tx, ty, tw, 28);
      ctx.strokeStyle = "#8a5a28";
      ctx.strokeRect(tx, ty, tw, 28);
      ctx.beginPath();
      ctx.moveTo(tx + 8, ty + 28);
      ctx.lineTo(tx + 4, ty + 36);
      ctx.lineTo(tx + 18, ty + 28);
      ctx.fill();
      ctx.fillStyle = "#2a1208";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(s.talk, tx + 8, ty + 14);
    }
  }

  function drawShopCustomer(c) {
    const x = c.x - cameraX;
    const y = c.y;
    if (x < -40 || x > W + 40) return;
    ctx.fillStyle = c.color;
    ctx.fillRect(x, y - c.h + 12, c.w, c.h - 12);
    ctx.fillStyle = "#f0c8a8";
    ctx.beginPath();
    ctx.arc(x + c.w / 2, y - c.h + 8, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c.hair;
    ctx.beginPath();
    ctx.ellipse(x + c.w / 2, y - c.h + 4, 9, 6, 0, Math.PI, 0);
    ctx.fill();
  }

  function drawShopScene() {
    if (!shopScene) return;
    const s = shopScene;
    const x = s.x - cameraX;
    const y = s.y;
    if (x > W + 80 || x + s.w < -80) {
      s.starHit = null;
      return;
    }

    // Building
    ctx.fillStyle = "#5a2e1c";
    ctx.fillRect(x, y - s.h, s.w, s.h);
    ctx.fillStyle = "#7a3d24";
    ctx.fillRect(x + 8, y - s.h + 8, s.w - 16, s.h - 16);
    // awning
    ctx.fillStyle = "#c04040";
    ctx.fillRect(x - 10, y - s.h - 8, s.w + 20, 18);
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? "#f0e0c0" : "#c04040";
      ctx.fillRect(x - 10 + i * ((s.w + 20) / 8), y - s.h + 6, (s.w + 20) / 8, 10);
    }
    // door
    ctx.fillStyle = s.doorOpen ? "#1a0c08" : "#3a2218";
    ctx.fillRect(x + s.w * 0.55, y - 78, 52, 78);
    if (!s.doorOpen) {
      ctx.strokeStyle = "#8a5a28";
      ctx.strokeRect(x + s.w * 0.55, y - 78, 52, 78);
      ctx.fillStyle = "#ffd24a";
      ctx.beginPath();
      ctx.arc(x + s.w * 0.55 + 40, y - 40, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // window shelves with stars (stock)
    ctx.fillStyle = "#87ceeb";
    ctx.globalAlpha = 0.35;
    ctx.fillRect(x + 18, y - 120, 90, 70);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#ffe07a";
    ctx.strokeRect(x + 18, y - 120, 90, 70);
    const showStars = Math.max(0, Math.min(6, s.stock));
    for (let i = 0; i < showStars; i++) {
      const sx = x + 30 + (i % 3) * 26;
      const sy = y - 100 + Math.floor(i / 3) * 28;
      drawMiniStar(sx, sy, 7, "#ffe566");
    }
    if (s.phase === "soldout") {
      ctx.fillStyle = "rgba(20,8,6,0.7)";
      ctx.fillRect(x + 18, y - 120, 90, 70);
      ctx.fillStyle = "#ff7a5c";
      ctx.font = "bold 14px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("售罄", x + 63, y - 82);
    }

    // Sign: 五角星专卖店 — 五角星 is clickable
    ctx.font = "bold 20px 'Noto Sans SC', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    const mid = "五角星";
    const suffix = "专卖店";
    const w1 = ctx.measureText(mid).width;
    const w2 = ctx.measureText(suffix).width;
    const signX = x + (s.w - (w1 + w2)) / 2;
    const signY = y - s.h - 18;
    ctx.fillStyle = "rgba(18, 8, 6, 0.85)";
    ctx.fillRect(signX - 12, signY - 26, w1 + w2 + 24, 36);
    ctx.strokeStyle = "#ffd24a";
    ctx.lineWidth = 2;
    ctx.strokeRect(signX - 12, signY - 26, w1 + w2 + 24, 36);

    const glow = 0.4 + Math.sin(s.pulse * 2) * 0.25;
    ctx.fillStyle = `rgba(255, 210, 74, ${0.8 + glow * 0.2})`;
    ctx.fillText(mid, signX, signY);
    ctx.fillStyle = "#fff3e6";
    ctx.fillText(suffix, signX + w1, signY);

    s.starHit = {
      x: s.x + (s.w - (w1 + w2)) / 2,
      y: s.y - s.h - 44,
      w: w1,
      h: 34,
    };

    // Clock beside shop
    drawShopClock(s, x - 48, y - s.h + 40);

    // Boss NPC
    drawShopNpc(s);

    // Customers
    for (const c of s.customers) drawShopCustomer(c);

    // Sold-out banner
    if (s.phase === "soldout") {
      ctx.fillStyle = "rgba(255, 120, 60, 0.9)";
      ctx.font = "bold 16px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("排到你了：五角星已经卖完了", x + s.w / 2, y - s.h - 52);
    }
  }

  function drawMiniStar(cx, cy, r, color) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      const b = a + Math.PI / 5;
      const x1 = Math.cos(a) * r;
      const y1 = Math.sin(a) * r;
      const x2 = Math.cos(b) * r * 0.4;
      const y2 = Math.sin(b) * r * 0.4;
      if (i === 0) ctx.moveTo(x1, y1);
      else ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function tryClickShopStar(clientX, clientY) {
    if (state !== "playing" || !shopScene || !shopScene.starHit) return false;
    const world = clientToWorld(clientX, clientY);
    const h = shopScene.starHit;
    if (
      world.x >= h.x &&
      world.x <= h.x + h.w &&
      world.y >= h.y &&
      world.y <= h.y + h.h
    ) {
      if (window.GameAudio) GameAudio.playClick();
      stars += 1;
      saveStars();
      starLabel.textContent = String(stars);
      spawnBurst(h.x + h.w / 2, h.y + h.h / 2, "#ffe566", 24);
      spawnBurst(h.x + h.w / 2, h.y + h.h / 2, "#ff9a2a", 14);
      shake = 10;
      statusLabel.textContent = "点到五角星了！";
      winLevel();
      return true;
    }
    return false;
  }

  function hoverShopStar(clientX, clientY) {
    if (state !== "playing" || !shopScene || !shopScene.starHit) return false;
    const world = clientToWorld(clientX, clientY);
    const h = shopScene.starHit;
    return (
      world.x >= h.x &&
      world.x <= h.x + h.w &&
      world.y >= h.y &&
      world.y <= h.y + h.h
    );
  }

  function drawEndSign() {
    if (!endSign) return;
    const prefix = "这里没有";
    const mid = "五角星";
    const suffix = "哦";
    const sx = endSign.x - cameraX;
    const sy = endSign.y + Math.sin(endSign.pulse) * 2;
    if (sx < -280 || sx > W + 40) {
      endSign.hit = null;
      return;
    }

    ctx.save();
    ctx.font = "bold 26px 'Noto Sans SC', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    const w1 = ctx.measureText(prefix).width;
    const w2 = ctx.measureText(mid).width;
    const w3 = ctx.measureText(suffix).width;
    const total = w1 + w2 + w3;

    // Soft board behind the sentence
    ctx.fillStyle = "rgba(20, 8, 6, 0.55)";
    ctx.fillRect(sx - 14, sy - 34, total + 28, 48);
    ctx.strokeStyle = "rgba(122, 61, 36, 0.8)";
    ctx.lineWidth = 2;
    ctx.strokeRect(sx - 14, sy - 34, total + 28, 48);

    ctx.fillStyle = "#c9a48a";
    ctx.fillText(prefix, sx, sy);

    // The clickable words look almost like normal text, with a subtle gold hint
    const glow = 0.35 + Math.sin(endSign.pulse * 2) * 0.2;
    ctx.fillStyle = `rgba(255, 210, 74, ${0.75 + glow * 0.25})`;
    ctx.fillText(mid, sx + w1, sy);
    ctx.strokeStyle = `rgba(255, 210, 74, ${0.35 + glow * 0.3})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx + w1, sy + 6);
    ctx.lineTo(sx + w1 + w2, sy + 6);
    ctx.stroke();

    ctx.fillStyle = "#c9a48a";
    ctx.fillText(suffix, sx + w1 + w2, sy);
    ctx.restore();

    endSign.hit = {
      x: endSign.x + w1,
      y: endSign.y - 28,
      w: w2,
      h: 36,
    };
  }

  function drawSpikes() {
    for (const s of spikes) {
      const x = s.x - cameraX;
      const y = s.y;
      if (x + s.w < -10 || x > W + 10) continue;
      ctx.beginPath();
      ctx.moveTo(x, y + s.h);
      ctx.lineTo(x + s.w / 2, y);
      ctx.lineTo(x + s.w, y + s.h);
      ctx.closePath();
      const g = ctx.createLinearGradient(x, y, x, y + s.h);
      g.addColorStop(0, "#e8e8f0");
      g.addColorStop(0.45, "#a0a0b8");
      g.addColorStop(1, "#5a5a70");
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = "rgba(20, 10, 8, 0.55)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#3a2a22";
      ctx.fillRect(x - 1, y + s.h - 2, s.w + 2, 4);
    }
  }

  function maceBall(m) {
    return {
      x: m.x + Math.cos(m.angle) * m.len,
      y: m.y + Math.sin(m.angle) * m.len,
    };
  }

  function distPointToSegment(px, py, x1, y1, x2, y2) {
    const vx = x2 - x1;
    const vy = y2 - y1;
    const wx = px - x1;
    const wy = py - y1;
    const c1 = vx * wx + vy * wy;
    if (c1 <= 0) return Math.hypot(px - x1, py - y1);
    const c2 = vx * vx + vy * vy;
    if (c2 <= c1) return Math.hypot(px - x2, py - y2);
    const t = c1 / c2;
    return Math.hypot(px - (x1 + t * vx), py - (y1 + t * vy));
  }

  function hitByMace(playerBox, m) {
    const ball = maceBall(m);
    const pcx = playerBox.x + playerBox.w / 2;
    const pcy = playerBox.y + playerBox.h / 2;
    const ballHit = Math.hypot(pcx - ball.x, pcy - ball.y) < m.ballR + 16;
    const shaftHit =
      distPointToSegment(pcx, pcy, m.x, m.y, ball.x, ball.y) < (m.shaftW || 20);
    return ballHit || shaftHit;
  }

  function drawMaces() {
    for (const m of maces) {
      const ball = maceBall(m);
      const px = m.x - cameraX;
      const py = m.y;
      const bx = ball.x - cameraX;
      const by = ball.y;
      if (px < -120 && bx < -120) continue;
      if (px > W + 120 && bx > W + 120) continue;

      // shaft
      ctx.strokeStyle = "#5a4030";
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.strokeStyle = "#8a6040";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(bx, by);
      ctx.stroke();

      // pivot
      ctx.fillStyle = "#3a2818";
      ctx.beginPath();
      ctx.arc(px, py, 16, 0, Math.PI * 2);
      ctx.fill();

      // spiked ball
      ctx.fillStyle = "#6a6a78";
      ctx.beginPath();
      ctx.arc(bx, by, m.ballR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#2a2a32";
      ctx.lineWidth = 3;
      ctx.stroke();

      for (let i = 0; i < 10; i++) {
        const a = m.angle + (i * Math.PI) / 5;
        const x1 = bx + Math.cos(a) * (m.ballR - 4);
        const y1 = by + Math.sin(a) * (m.ballR - 4);
        const x2 = bx + Math.cos(a) * (m.ballR + 22);
        const y2 = by + Math.sin(a) * (m.ballR + 22);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = "#d0d0dc";
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 + Math.cos(a - 0.35) * 9, y2 + Math.sin(a - 0.35) * 9);
        ctx.lineTo(x2 + Math.cos(a + 0.35) * 9, y2 + Math.sin(a + 0.35) * 9);
        ctx.closePath();
        ctx.fillStyle = "#e8e8f0";
        ctx.fill();
      }
    }
  }

  function drawBackpack() {
    if (state !== "playing") return;
    if (level === 6) {
      const x = 24;
      const y = H - 108;
      ctx.fillStyle = "rgba(18, 8, 6, 0.75)";
      ctx.fillRect(x, y, 168, 84);
      ctx.strokeStyle = "#8a5a28";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, 168, 84);

      ctx.fillStyle = "#ffd24a";
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      ctx.fillText("背包", x + 12, y + 18);

      ctx.fillStyle = "#fff3e6";
      ctx.font = "13px 'Noto Sans SC', sans-serif";
      ctx.fillText(`击杀僵尸 × ${backpack.zombiesKilled}`, x + 12, y + 42);
      ctx.fillText(`尖刺 × ${backpack.spikes}`, x + 12, y + 66);

      const left = zombies.filter((z) => z.alive !== false).length;
      ctx.fillStyle = left > 0 ? "#ff9a7a" : "#7dffb0";
      ctx.font = "11px 'Noto Sans SC', sans-serif";
      ctx.fillText(left > 0 ? `剩余僵尸 ${left}` : "可拆尖刺", x + 12, y + 80);
      return;
    }

    // Level 7: backpack only appears after first secret dismantle
    if (level === 7 && backpack.revealed) {
      const x = 24;
      const y = H - 78;
      ctx.fillStyle = "rgba(18, 8, 6, 0.75)";
      ctx.fillRect(x, y, 168, 54);
      ctx.strokeStyle = "#8a5a28";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, 168, 54);
      ctx.fillStyle = "#ffd24a";
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      ctx.fillText("背包", x + 12, y + 20);
      ctx.fillStyle = "#fff3e6";
      ctx.font = "14px 'Noto Sans SC', sans-serif";
      ctx.fillText(`狼牙棒 × ${backpack.maces}`, x + 12, y + 42);
    }
  }

  function pointInRect(px, py, r) {
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  }

  function tryClickLevel6(clientX, clientY) {
    if (state !== "playing" || level !== 6) return false;
    const world = clientToWorld(clientX, clientY);

    for (let i = zombies.length - 1; i >= 0; i--) {
      const z = zombies[i];
      if (z.alive === false) continue;
      if (pointInRect(world.x, world.y, z)) {
        spawnBurst(z.x + z.w / 2, z.y + z.h / 2, "#6aaa4a", 22);
        spawnBurst(z.x + z.w / 2, z.y + z.h / 2, "#ff5533", 12);
        shake = 10;
        zombies.splice(i, 1);
        backpack.zombiesKilled += 1;
        if (window.GameAudio) GameAudio.playClick();
        const left = zombies.length;
        statusLabel.textContent =
          left > 0
            ? `击杀僵尸！剩余 ${left} 只`
            : "僵尸已清空！现在可以拆尖刺了";
        return true;
      }
    }

    for (let i = spikes.length - 1; i >= 0; i--) {
      const s = spikes[i];
      const hit = {
        x: s.x - 6,
        y: s.y - 8,
        w: s.w + 12,
        h: s.h + 14,
      };
      if (pointInRect(world.x, world.y, hit)) {
        if (zombies.some((z) => z.alive !== false)) {
          statusLabel.textContent = "先把僵尸全部打死，才能拆尖刺！";
          shake = Math.max(shake, 4);
          return true;
        }
        spikes.splice(i, 1);
        backpack.spikes += 1;
        if (window.GameAudio) GameAudio.playClick();
        spawnBurst(s.x + s.w / 2, s.y + 4, "#c8c8d8", 14);
        spawnBurst(s.x + s.w / 2, s.y + 4, "#ffd24a", 8);
        statusLabel.textContent = `尖刺已拆下，装进背包（${backpack.spikes}）`;
        return true;
      }
    }
    return false;
  }

  function tryClickLevel7(clientX, clientY) {
    if (state !== "playing" || level !== 7) return false;
    const world = clientToWorld(clientX, clientY);

    for (let i = maces.length - 1; i >= 0; i--) {
      const m = maces[i];
      const ball = maceBall(m);
      const dx = world.x - ball.x;
      const dy = world.y - ball.y;
      const pivotDx = world.x - m.x;
      const pivotDy = world.y - m.y;
      const hitBall = dx * dx + dy * dy <= (m.ballR + 16) * (m.ballR + 16);
      const hitShaft =
        Math.abs(pivotDx * Math.sin(m.angle) - pivotDy * Math.cos(m.angle)) < 14 &&
        pivotDx * Math.cos(m.angle) + pivotDy * Math.sin(m.angle) > 0 &&
        pivotDx * Math.cos(m.angle) + pivotDy * Math.sin(m.angle) < m.len + 10;
      if (hitBall || hitShaft) {
        maces.splice(i, 1);
        backpack.maces += 1;
        backpack.revealed = true;
        if (window.GameAudio) GameAudio.playClick();
        spawnBurst(ball.x, ball.y, "#c8c8d8", 18);
        spawnBurst(ball.x, ball.y, "#8a6040", 10);
        shake = 8;
        statusLabel.textContent = `狼牙棒拆下了！装进背包（${backpack.maces}）`;
        return true;
      }
    }
    return false;
  }

  function hoverLevel6Target(clientX, clientY) {
    if (state !== "playing" || level !== 6) return false;
    const world = clientToWorld(clientX, clientY);
    for (const z of zombies) {
      if (z.alive === false) continue;
      if (pointInRect(world.x, world.y, z)) return true;
    }
    for (const s of spikes) {
      const hit = {
        x: s.x - 6,
        y: s.y - 8,
        w: s.w + 12,
        h: s.h + 14,
      };
      if (pointInRect(world.x, world.y, hit)) return true;
    }
    return false;
  }

  function rocketContents(index) {
    const pool = ["燃料罐", "螺丝钉", "星尘碎片", "压缩饼干", "小旗子"];
    return pool[index % pool.length];
  }

  function updateEatAnim(dt) {
    if (!eatAnim) return;
    eatAnim.t += dt;
    const r = eatAnim.rocket;
    const p = player;
    const handX = p.x + p.w / 2 - r.w * eatAnim.scale * 0.5;
    const handY = p.y - 10 - r.h * eatAnim.scale * 0.15;
    const mouthX = p.x + (p.facing >= 0 ? p.w - 4 : -4) - r.w * eatAnim.scale * 0.5;
    const mouthY = p.y + 2;

    if (eatAnim.t < 0.45) {
      const u = eatAnim.t / 0.45;
      const e = 1 - Math.pow(1 - u, 3);
      r.drawX = eatAnim.fromX + (handX - eatAnim.fromX) * e;
      r.drawY = eatAnim.fromY + (handY - eatAnim.fromY) * e;
      eatAnim.scale = 1;
      player.facing = r.x + r.w / 2 >= p.x ? 1 : -1;
    } else if (eatAnim.t < 0.85) {
      const u = (eatAnim.t - 0.45) / 0.4;
      const e = 1 - Math.pow(1 - u, 2);
      r.drawX = handX + (mouthX - handX) * e;
      r.drawY = handY + (mouthY - handY) * e;
      eatAnim.scale = 1 - e * 0.55;
      if (Math.random() < 0.5) {
        spawnBurst(mouthX + r.w * 0.3, mouthY + 8, "#ffb347", 2);
      }
    } else if (eatAnim.t < 1.15) {
      const u = (eatAnim.t - 0.85) / 0.3;
      r.drawX = mouthX;
      r.drawY = mouthY;
      eatAnim.scale = Math.max(0.05, 0.45 * (1 - u));
      spawnBurst(mouthX + 10, mouthY + 6, "#ffe07a", 1);
    } else {
      // Finish eating — stomach contents appear
      r.eaten = true;
      r.eating = false;
      const item = rocketContents(belly.items.length);
      belly.items.push(item);
      belly.revealed = true;
      spawnBurst(p.x + p.w / 2, p.y, "#ff9a2a", 16);
      spawnBurst(p.x + p.w / 2, p.y + 10, "#5ce1ff", 10);
      statusLabel.textContent = `吃掉火箭！肚子里出现了：${item}`;
      shake = 8;
      eatAnim = null;
    }
  }

  function startEatRocket(r) {
    if (eatAnim || r.eaten || r.eating) return;
    r.eating = true;
    eatAnim = {
      rocket: r,
      t: 0,
      fromX: r.x,
      fromY: r.y,
      scale: 1,
    };
    r.drawX = r.x;
    r.drawY = r.y;
    statusLabel.textContent = r.big ? "举起超级大火箭……" : "举起火箭……";
    if (window.GameAudio) GameAudio.playRocket();
  }

  function drawRocket(r, x, y, w, h) {
    // body
    const bodyGrad = ctx.createLinearGradient(x, y, x + w, y);
    bodyGrad.addColorStop(0, "#d8dde8");
    bodyGrad.addColorStop(0.5, "#f4f7ff");
    bodyGrad.addColorStop(1, "#a8b0c0");
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, y);
    ctx.quadraticCurveTo(x + w * 1.05, y + h * 0.2, x + w * 0.85, y + h * 0.55);
    ctx.lineTo(x + w * 0.85, y + h * 0.82);
    ctx.lineTo(x + w * 0.15, y + h * 0.82);
    ctx.lineTo(x + w * 0.15, y + h * 0.55);
    ctx.quadraticCurveTo(x - w * 0.05, y + h * 0.2, x + w * 0.5, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#5a6578";
    ctx.lineWidth = 2;
    ctx.stroke();

    // window
    ctx.fillStyle = "#7ec8ff";
    ctx.beginPath();
    ctx.arc(x + w * 0.5, y + h * 0.32, w * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#2a4060";
    ctx.stroke();

    // fins
    ctx.fillStyle = "#e85a3a";
    ctx.beginPath();
    ctx.moveTo(x + w * 0.15, y + h * 0.7);
    ctx.lineTo(x - w * 0.2, y + h * 0.95);
    ctx.lineTo(x + w * 0.2, y + h * 0.82);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + w * 0.85, y + h * 0.7);
    ctx.lineTo(x + w * 1.2, y + h * 0.95);
    ctx.lineTo(x + w * 0.8, y + h * 0.82);
    ctx.closePath();
    ctx.fill();

    // flame
    const flicker = 0.7 + Math.sin(time * 14 + x) * 0.3;
    ctx.fillStyle = `rgba(255, 160, 40, ${0.55 * flicker})`;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.3, y + h * 0.82);
    ctx.lineTo(x + w * 0.5, y + h * 0.82 + 28 * flicker);
    ctx.lineTo(x + w * 0.7, y + h * 0.82);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = `rgba(255, 240, 120, ${0.7 * flicker})`;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.38, y + h * 0.82);
    ctx.lineTo(x + w * 0.5, y + h * 0.82 + 16 * flicker);
    ctx.lineTo(x + w * 0.62, y + h * 0.82);
    ctx.closePath();
    ctx.fill();
  }

  function drawRockets() {
    for (const r of rockets) {
      if (r.eaten || r.eating) continue;
      const x = r.x - cameraX;
      const y = r.y;
      const w = r.w;
      const h = r.h;
      if (x + w < -40 || x > W + 40) continue;
      drawRocket(r, x, y, w, h);
      if (r.big) {
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.font = "12px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("超级大火箭", x + w / 2, y - 8);
        ctx.textAlign = "left";
      }
    }
  }

  function drawBelly() {
    if (level !== 8 || state !== "playing" || !belly.revealed) return;
    const x = 24;
    const y = H - 120;
    const h = 96;
    ctx.fillStyle = "rgba(18, 8, 6, 0.78)";
    ctx.fillRect(x, y, 210, h);
    ctx.strokeStyle = "#8a5a28";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 210, h);
    ctx.fillStyle = "#ffd24a";
    ctx.font = "12px 'Noto Sans SC', sans-serif";
    ctx.fillText("肚子里的东西", x + 12, y + 20);
    ctx.fillStyle = "#fff3e6";
    ctx.font = "12px 'Noto Sans SC', sans-serif";
    if (!belly.items.length) {
      ctx.fillText("（空）", x + 12, y + 48);
    } else {
      belly.items.forEach((item, i) => {
        ctx.fillText(`${i + 1}. ${item}`, x + 12, y + 42 + i * 16);
      });
    }
  }

  function tryClickLevel8(clientX, clientY) {
    if (state !== "playing" || level !== 8 || eatAnim) return false;
    const world = clientToWorld(clientX, clientY);
    // Prefer topmost / biggest rocket under cursor
    let best = null;
    for (const r of rockets) {
      if (r.eaten || r.eating) continue;
      if (pointInRect(world.x, world.y, r)) {
        if (!best || r.w * r.h > best.w * best.h) best = r;
      }
    }
    if (best) {
      startEatRocket(best);
      return true;
    }
    return false;
  }

  function hoverLevel8Target(clientX, clientY) {
    if (state !== "playing" || level !== 8 || eatAnim) return false;
    const world = clientToWorld(clientX, clientY);
    return rockets.some(
      (r) => !r.eaten && !r.eating && pointInRect(world.x, world.y, r)
    );
  }

  function hoverLevel7Target(clientX, clientY) {
    if (state !== "playing" || level !== 7) return false;
    const world = clientToWorld(clientX, clientY);
    for (const m of maces) {
      const ball = maceBall(m);
      const dx = world.x - ball.x;
      const dy = world.y - ball.y;
      if (dx * dx + dy * dy <= (m.ballR + 16) * (m.ballR + 16)) return true;
    }
    return false;
  }

  function drawComingSoon() {
    if (!comingSoon) return;
    const sx = comingSoon.x - cameraX;
    const sy = comingSoon.y + Math.sin(comingSoon.pulse) * 3;
    if (sx < -420 || sx > W + 40) return;

    ctx.save();
    ctx.font = "bold 28px 'Noto Sans SC', sans-serif";
    const text = comingSoon.text;
    const tw = ctx.measureText(text).width;
    comingSoon.w = tw + 36;

    ctx.fillStyle = "rgba(20, 8, 6, 0.6)";
    ctx.fillRect(sx - 18, sy - 36, tw + 36, 56);
    ctx.strokeStyle = "rgba(255, 180, 80, 0.45)";
    ctx.lineWidth = 2;
    ctx.strokeRect(sx - 18, sy - 36, tw + 36, 56);

    ctx.fillStyle = "#ffd24a";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(text, sx, sy);
    ctx.restore();
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = clamp(p.life / 0.6, 0, 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - cameraX, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  function drawUI() {
    let progress = 0;
    const goalX = star
      ? star.x
      : endSign
        ? endSign.x
        : shopScene
          ? shopScene.x
          : comingSoon
            ? comingSoon.x
            : 1;
    if (reverseGoal && star) {
      const total = Math.max(1, spawnX - star.x);
      progress = clamp((spawnX - player.x) / total, 0, 1);
    } else {
      progress = clamp(player.x / Math.max(1, goalX), 0, 1);
    }
    const barX = puzzleMode ? W - 220 : 24;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(barX, 16, 180, 8);
    ctx.fillStyle = "#ffd24a";
    ctx.fillRect(barX, 16, 180 * progress, 8);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "10px 'Press Start 2P', monospace";
    ctx.fillText(reverseGoal ? "???" : "终点", barX + 186, 24);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "11px 'Noto Sans SC', sans-serif";
    ctx.fillText(
      coopCount > 1 || remotePlayers.size > 0
        ? `同行 ${Math.max(coopCount, remotePlayers.size + 1)} 人`
        : "现在只有你 · 手机和电脑都可以加入",
      barX,
      40
    );
  }

  function draw() {
    ctx.save();
    if (shake > 0.5) {
      ctx.translate(rand(-shake, shake), rand(-shake, shake));
    }

    drawBackground();

    if (level === 14 && towerScene) ctx.translate(0, towerScene.camY | 0);
    if (level === 24 && furnaceScene) ctx.translate(0, furnaceScene.camY | 0);

    for (const p of platforms) {
      if (p.lane !== "secret") drawBrick(p);
    }
    drawSpikes();
    drawMaces();
    drawRockets();
    drawCrate();
    drawPotion();
    drawShopScene();
    drawPickupStars();
    if (!(fakeLava && star && star.y + star.r > LAVA_Y - 20)) drawStar();
    drawEndSign();
    drawComingSoon();
    for (const z of zombies) drawZombie(z);
    drawRemotePlayers();
    if (player && player.y + player.h <= LAVA_Y + 8 && !(level === 17 && battleScene) && level !== 23) drawPlayer();
    if (eatAnim && eatAnim.rocket && !eatAnim.rocket.eaten) {
      const r = eatAnim.rocket;
      const s = eatAnim.scale;
      drawRocket(
        r,
        (r.drawX ?? r.x) - cameraX,
        r.drawY ?? r.y,
        r.w * s,
        r.h * s
      );
    }
    drawLava();
    // Reveal secret path only after jumping into the fake lava
    const revealSecret =
      fakeLava && player && player.y + player.h > LAVA_Y + 4;
    if (revealSecret) {
      for (const p of platforms) {
        if (p.lane === "secret") drawBrick(p);
      }
      drawStar();
      drawPlayer();
    }
    drawParticles();
    if (level === 14 && towerScene) drawTowerExtras();
    if (level === 15 && subwayScene) drawSubwayExtras();
    if (level === 15 && subwayScene && player && !subwayScene.onTrain) drawPlayer();
    if (level === 15 && subwayScene && drawSubwayForeground) drawSubwayForeground();
    if (level === 16 && rangeScene && drawRangeExtras) drawRangeExtras();
    if (level === 17 && battleScene && drawBattleExtras) drawBattleExtras();
    if (level === 18 && schoolScene && drawSchoolExtras) drawSchoolExtras();
    if (level === 19 && musicScene && drawMusicExtras) drawMusicExtras();
    if (level === 20 && dateScene && drawDateExtras) drawDateExtras();
    if (level === 21 && kongScene && drawKongExtras) drawKongExtras();
    if (level === 22 && starHouseScene && drawStarHouseExtras) drawStarHouseExtras();
    if (level === 23 && matchScene && drawMatchExtras) drawMatchExtras();
    if (level === 24 && furnaceScene && drawFurnaceExtras) drawFurnaceExtras();
    if (state === "playing") drawUI();
    drawBackpack();
    drawBelly();
    if (state === "playing" && speedBoost > 0) {
      ctx.fillStyle = "rgba(92, 225, 255, 0.9)";
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      ctx.fillText(`加速 ${speedBoost.toFixed(1)}s`, 24, 48);
    }

    ctx.restore();
  }

  function tryClickEndSign(clientX, clientY) {
    if (state !== "playing" || !endSign || !endSign.hit) return false;
    const world = clientToWorld(clientX, clientY);
    const h = endSign.hit;
    if (
      world.x >= h.x &&
      world.x <= h.x + h.w &&
      world.y >= h.y &&
      world.y <= h.y + h.h
    ) {
      if (window.GameAudio) GameAudio.playClick();
      stars += 1;
      saveStars();
      starLabel.textContent = String(stars);
      spawnBurst(h.x + h.w / 2, h.y + h.h / 2, "#ffe566", 24);
      spawnBurst(h.x + h.w / 2, h.y + h.h / 2, "#ff9a2a", 14);
      shake = 10;
      statusLabel.textContent = "点到了！";
      winLevel();
      return true;
    }
    return false;
  }

    S.drawChatBubble = drawChatBubble;
    S.drawMoonBackground = drawMoonBackground;
    S.drawBackground = drawBackground;
    S.drawCityBackground = drawCityBackground;
    S.drawLava = drawLava;
    S.drawMoonVoid = drawMoonVoid;
    S.drawBrick = drawBrick;
    S.drawPlayer = drawPlayer;
    S.drawZombie = drawZombie;
    S.drawCrate = drawCrate;
    S.drawPotion = drawPotion;
    S.drawStar = drawStar;
    S.drawPickupStars = drawPickupStars;
    S.drawRemotePlayers = drawRemotePlayers;
    S.updateShopScene = updateShopScene;
    S.drawShopClock = drawShopClock;
    S.drawShopNpc = drawShopNpc;
    S.drawShopCustomer = drawShopCustomer;
    S.drawShopScene = drawShopScene;
    S.drawMiniStar = drawMiniStar;
    S.tryClickShopStar = tryClickShopStar;
    S.hoverShopStar = hoverShopStar;
    S.drawEndSign = drawEndSign;
    S.drawSpikes = drawSpikes;
    S.maceBall = maceBall;
    S.distPointToSegment = distPointToSegment;
    S.hitByMace = hitByMace;
    S.drawMaces = drawMaces;
    S.drawBackpack = drawBackpack;
    S.pointInRect = pointInRect;
    S.tryClickLevel6 = tryClickLevel6;
    S.tryClickLevel7 = tryClickLevel7;
    S.hoverLevel6Target = hoverLevel6Target;
    S.rocketContents = rocketContents;
    S.updateEatAnim = updateEatAnim;
    S.startEatRocket = startEatRocket;
    S.drawRocket = drawRocket;
    S.drawRockets = drawRockets;
    S.drawBelly = drawBelly;
    S.tryClickLevel8 = tryClickLevel8;
    S.hoverLevel8Target = hoverLevel8Target;
    S.hoverLevel7Target = hoverLevel7Target;
    S.drawComingSoon = drawComingSoon;
    S.drawParticles = drawParticles;
    S.drawUI = drawUI;
    S.draw = draw;
    S.tryClickEndSign = tryClickEndSign;
  }
};
