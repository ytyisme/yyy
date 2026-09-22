// 第 32 关：手绘水管 · 把左下角的杯子接满水。墨水无限，画完点「我画好了」放水。
window.installPipe32 = function (S) {
  with (S) {
    const readyBtn = document.getElementById("lv32-ready-btn");
    const STROKE_W = 16;
    const CONNECT_DIST = STROKE_W * 1.5;
    const MIN_PTS = 2;

    const p32Toast = GameLevelKit.makeToast(() => pipe32Scene);

    function syncReadyBtn() {
      GameLevelKit.syncReadyButton(
        readyBtn,
        !!(state === "playing" && level === 32 && pipe32Scene && pipe32Scene.phase === "draw" && !pipe32Scene.done)
      );
    }

    function inkLabel() {
      return GameLevelKit.inkLabel(pipe32Scene);
    }

    function clearStrokes() {
      if (!pipe32Scene) return;
      pipe32Scene.strokes = [];
      pipe32Scene.drawing = null;
      pipe32Scene.pipeLit = [];
      pipe32Scene.water = null;
      pipe32Scene.fx = { drops: [], splashes: [], bubbles: [], sparkles: [] };
    }

    function clampDrawPoint(x, y) {
      return {
        x: clamp(x, 40, worldWidth - 40),
        y: clamp(y, 50, pipe32Scene.groundY - 4),
      };
    }

    const strokeTool = GameLevelKit.createStrokeTool({
      sceneRef: () => pipe32Scene,
      strokeWidth: STROKE_W,
      minPts: MIN_PTS,
      clampPoint: clampDrawPoint,
      onStatus: () => {
        statusLabel.textContent = `画水管 · 墨水 ${inkLabel()}`;
      },
      onInkOut: () => p32Toast("墨水用完了", 1.4),
    });
    const endStroke = strokeTool.end;

    const strokeNearPoint = GameLevelKit.strokeNearPoint;
    const strokesTouch = GameLevelKit.strokesTouch;

    function sourcePoint() {
      const s = pipe32Scene.source;
      return { x: s.x + s.w * 0.5, y: s.y + s.h };
    }

    function cupPoint() {
      const c = pipe32Scene.cup;
      return { x: c.x + c.w * 0.5, y: c.y };
    }

    function strokeTouchesSource(stroke) {
      const sp = sourcePoint();
      return strokeNearPoint(stroke, sp.x, sp.y, CONNECT_DIST + 8);
    }

    function strokeTouchesCup(stroke) {
      const cp = cupPoint();
      return strokeNearPoint(stroke, cp.x, cp.y, CONNECT_DIST + 8);
    }

    // BFS：从接触水源的笔画，沿互相接触的笔画连通，是否能碰到杯子
    function analyzeFlow() {
      const strokes = pipe32Scene.strokes.filter((s) => s.points.length >= MIN_PTS);
      if (!strokes.length) return { ok: false, path: [] };

      const seeds = strokes.filter(strokeTouchesSource);
      if (!seeds.length) return { ok: false, path: [] };

      const seen = new Set();
      const parent = new Map();
      const q = [];
      for (const s of seeds) {
        seen.add(s);
        q.push(s);
      }

      let hitCup = null;
      while (q.length) {
        const cur = q.shift();
        if (strokeTouchesCup(cur)) {
          hitCup = cur;
          break;
        }
        for (const nx of strokes) {
          if (seen.has(nx)) continue;
          if (strokesTouch(cur, nx)) {
            seen.add(nx);
            parent.set(nx, cur);
            q.push(nx);
          }
        }
      }

      if (!hitCup) return { ok: false, path: [] };

      const path = [];
      let node = hitCup;
      while (node) {
        path.unshift(node);
        node = parent.get(node);
      }
      for (const s of seeds) seen.add(s);
      pipe32Scene.pipeLit = path.slice();
      return { ok: true, path };
    }

    function startFlow() {
      if (!pipe32Scene || pipe32Scene.phase !== "draw") return;
      endStroke();
      const info = analyzeFlow();
      if (!info.ok) {
        p32Toast("水还过不去，再把水管接上水源和杯子", 2.8);
        return;
      }
      pipe32Scene.phase = "flow";
      pipe32Scene.water = { path: info.path, seg: 0, t: 0, speed: 2.6 };
      pipe32Scene.cup.fill = 0;
      pipe32Scene.fx = { drops: [], splashes: [], bubbles: [], sparkles: [] };
      statusLabel.textContent = "放水中……";
      if (window.GameAudio && GameAudio.playClick) GameAudio.playClick();
      syncReadyBtn();
    }

    function initPipe32() {
      if (!pipe32Scene) return;
      pipe32Scene.phase = "draw";
      pipe32Scene.ink = pipe32Scene.inkMax;
      pipe32Scene.inkSpent = 0;
      pipe32Scene.strokes = [];
      pipe32Scene.drawing = null;
      pipe32Scene.pipeLit = [];
      pipe32Scene.water = null;
      pipe32Scene.cup.fill = 0;
      pipe32Scene.done = false;
      pipe32Scene.toast = "";
      pipe32Scene.toastT = 0;
      pipe32Scene.fx = { drops: [], splashes: [], bubbles: [], sparkles: [] };
      statusLabel.textContent = "画水管 · 墨水 ∞";
      syncReadyBtn();
    }

    function syncPipe32OnLeave() {
      if (readyBtn) {
        readyBtn.classList.add("hidden");
        readyBtn.setAttribute("aria-hidden", "true");
      }
    }

    function waterHeadPos() {
      const w = pipe32Scene && pipe32Scene.water;
      if (!w || !w.path || w.seg >= w.path.length) return null;
      const stroke = w.path[w.seg];
      const pts = stroke.points;
      if (pts.length < 2) return null;
      return GameLevelKit.sampleStroke(stroke, w.t);
    }

    function spawnDrop(x, y, vx, vy, life, r, color) {
      if (!pipe32Scene.fx) return;
      pipe32Scene.fx.drops.push({ x, y, vx, vy, life, max: life, r, color: color || "#4fc3f7" });
    }

    function spawnSplash(x, y) {
      if (!pipe32Scene.fx) return;
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI * 0.15 - Math.random() * Math.PI * 0.7;
        const sp = 40 + Math.random() * 80;
        pipe32Scene.fx.splashes.push({
          x,
          y,
          vx: Math.cos(a) * sp * (Math.random() < 0.5 ? -1 : 1),
          vy: Math.sin(a) * sp,
          life: 0.45 + Math.random() * 0.35,
          max: 0.8,
          r: 2 + Math.random() * 2.5,
        });
      }
    }

    function spawnBubble() {
      if (!pipe32Scene.fx || !pipe32Scene.cup) return;
      const c = pipe32Scene.cup;
      const fh = (c.fill / c.fillMax) * (c.h - 6);
      if (fh < 6) return;
      pipe32Scene.fx.bubbles.push({
        x: c.x + 8 + Math.random() * (c.w - 16),
        y: c.y + c.h - 4 - Math.random() * fh * 0.7,
        r: 1.5 + Math.random() * 2.5,
        life: 0.6 + Math.random() * 0.8,
        max: 1.4,
        wob: Math.random() * Math.PI * 2,
      });
    }

    function spawnSparkle(x, y) {
      if (!pipe32Scene.fx) return;
      pipe32Scene.fx.sparkles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        life: 0.5 + Math.random() * 0.4,
        max: 0.9,
        r: 1.5 + Math.random() * 2,
      });
    }

    function updateFx(dt) {
      const fx = pipe32Scene.fx;
      if (!fx) return;
      const g = 220;
      for (const arr of [fx.drops, fx.splashes]) {
        for (let i = arr.length - 1; i >= 0; i--) {
          const p = arr[i];
          p.life -= dt;
          if (p.life <= 0) {
            arr.splice(i, 1);
            continue;
          }
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += g * dt;
        }
      }
      for (let i = fx.bubbles.length - 1; i >= 0; i--) {
        const b = fx.bubbles[i];
        b.life -= dt;
        if (b.life <= 0) {
          fx.bubbles.splice(i, 1);
          continue;
        }
        b.y -= 28 * dt;
        b.wob += dt * 6;
        b.x += Math.sin(b.wob) * 8 * dt;
      }
      for (let i = fx.sparkles.length - 1; i >= 0; i--) {
        const sp = fx.sparkles[i];
        sp.life -= dt;
        if (sp.life <= 0) fx.sparkles.splice(i, 1);
      }
    }

    function updatePipe32(dt) {
      if (!pipe32Scene) return;
      pipe32Scene.pulse += dt * 2;
      if (!pipe32Scene.fx) pipe32Scene.fx = { drops: [], splashes: [], bubbles: [], sparkles: [] };
      GameLevelKit.tickToast(pipe32Scene, dt);
      updateFx(dt);

      if (pipe32Scene.phase === "flow" && pipe32Scene.water && !pipe32Scene.done) {
        const w = pipe32Scene.water;
        w.t += dt * w.speed;
        // 水头拖尾水珠
        const hp = waterHeadPos();
        if (hp && Math.random() < 0.55) {
          spawnDrop(
            hp.x + (Math.random() - 0.5) * 4,
            hp.y + (Math.random() - 0.5) * 4,
            -hp.dx * 0.8 + (Math.random() - 0.5) * 20,
            -hp.dy * 0.8 + (Math.random() - 0.5) * 20,
            0.35 + Math.random() * 0.25,
            1.5 + Math.random() * 2
          );
        }
        if (hp && Math.random() < 0.2) spawnSparkle(hp.x, hp.y);
        while (w.t >= 1) {
          w.t -= 1;
          w.seg += 1;
          if (w.seg >= w.path.length - 1) {
            pipe32Scene.phase = "fill";
            statusLabel.textContent = "正在接水……";
            const cup = pipe32Scene.cup;
            spawnSplash(cup.x + cup.w * 0.5, cup.y + 4);
            break;
          }
        }
      } else if (pipe32Scene.phase === "fill" && !pipe32Scene.done) {
        pipe32Scene.cup.fill += dt * 42;
        const cup = pipe32Scene.cup;
        const surfY = cup.y + cup.h - 4 - (cup.fill / cup.fillMax) * (cup.h - 6);
        // 入杯水柱溅花 + 气泡
        if (Math.random() < 0.7) {
          spawnDrop(
            cup.x + cup.w * 0.5 + (Math.random() - 0.5) * 6,
            cup.y - 6,
            (Math.random() - 0.5) * 30,
            30 + Math.random() * 40,
            0.3 + Math.random() * 0.2,
            1.5 + Math.random() * 2,
            "#81d4fa"
          );
        }
        if (Math.random() < 0.35) spawnSplash(cup.x + cup.w * 0.5, surfY);
        if (Math.random() < 0.4) spawnBubble();
        if (Math.random() < 0.15) spawnSparkle(cup.x + cup.w * 0.5, surfY);

        if (cup.fill >= cup.fillMax) {
          cup.fill = cup.fillMax;
          pipe32Scene.phase = "done";
          pipe32Scene.done = true;
          statusLabel.textContent = "杯子接满了！";
          p32Toast("杯子接满啦！", 2);
          for (let i = 0; i < 14; i++) spawnSparkle(cup.x + cup.w * 0.5, cup.y + 8);
          spawnSplash(cup.x + cup.w * 0.5, cup.y + 2);
          if (window.GameAudio && GameAudio.playStar) GameAudio.playStar();
          syncReadyBtn();
          if (state === "playing" && level === 32) winLevel();
        } else {
          statusLabel.textContent = `正在接水 ${Math.floor(cup.fill)}%`;
        }
      } else if (pipe32Scene.phase === "done") {
        // 结束后杯口偶尔闪光
        if (Math.random() < 0.12) {
          const cup = pipe32Scene.cup;
          spawnSparkle(cup.x + cup.w * 0.5, cup.y + 6);
        }
        if (Math.random() < 0.2) spawnBubble();
      }
    }

    function tryClickPipe32() {
      return !!(pipe32Scene && level === 32 && state === "playing" && pipe32Scene.phase === "draw");
    }

    function drawStrokePath(stroke, alpha) {
      const pts = stroke.points;
      if (pts.length < 2) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = stroke.wet ? "#4fc3f7" : "#3d2b1f";
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(pts[0].x - cameraX, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x - cameraX, pts[i].y);
      ctx.stroke();
      // 管壁高光
      ctx.strokeStyle = stroke.wet ? "#b3e5fc" : "#8d6e63";
      ctx.lineWidth = stroke.width * 0.35;
      ctx.beginPath();
      ctx.moveTo(pts[0].x - cameraX, pts[0].y - 2);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x - cameraX, pts[i].y - 2);
      ctx.stroke();
      ctx.restore();
    }

    function drawSourceAndCup() {
      const s = pipe32Scene.source;
      // 水箱 / 管口
      ctx.save();
      ctx.fillStyle = "#78909c";
      ctx.fillRect(s.x - cameraX - 18, s.y - 40, s.w + 36, 42);
      ctx.fillStyle = "#546e7a";
      ctx.fillRect(s.x - cameraX, s.y - 8, s.w, s.h + 8);
      // 出水口
      ctx.fillStyle = "#26a69a";
      ctx.beginPath();
      ctx.arc(s.x - cameraX + s.w * 0.5, s.y + s.h + 2, 8, 0, Math.PI * 2);
      ctx.fill();
      if (pipe32Scene.phase === "flow" || pipe32Scene.phase === "fill" || pipe32Scene.phase === "done") {
        // 滴水
        const d = Math.sin(pipe32Scene.pulse * 3) * 4;
        ctx.fillStyle = "#4fc3f7";
        ctx.beginPath();
        ctx.arc(s.x - cameraX + s.w * 0.5, s.y + s.h + 12 + d, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#eceff1";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("水源", s.x - cameraX + s.w * 0.5, s.y - 48);
      ctx.restore();

      // 杯子（左下角）
      const c = pipe32Scene.cup;
      ctx.save();
      // 杯身
      ctx.fillStyle = "#eceff1";
      ctx.strokeStyle = "#90a4ae";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(c.x - cameraX, c.y);
      ctx.lineTo(c.x - cameraX + 4, c.y + c.h);
      ctx.lineTo(c.x - cameraX + c.w - 4, c.y + c.h);
      ctx.lineTo(c.x - cameraX + c.w, c.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // 水位
      const fh = (c.fill / c.fillMax) * (c.h - 6);
      if (fh > 0) {
        ctx.fillStyle = "#29b6f6";
        ctx.beginPath();
        ctx.moveTo(c.x - cameraX + 3 + (c.w - 6) * 0.02, c.y + c.h - fh);
        ctx.lineTo(c.x - cameraX + 3 + (c.w - 6) * 0.02 + (c.w - 8) * (1 - fh / c.h) * 0.04, c.y + c.h - fh);
        ctx.lineTo(c.x - cameraX + c.w - 5, c.y + c.h - fh);
        ctx.lineTo(c.x - cameraX + c.w - 5, c.y + c.h - 2);
        ctx.lineTo(c.x - cameraX + 5, c.y + c.h - 2);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = "#455a64";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("杯子", c.x - cameraX + c.w * 0.5, c.y + c.h + 14);
      ctx.restore();
    }

    function strokePolyline(stroke) {
      const pts = stroke.points;
      if (pts.length < 2) return;
      ctx.moveTo(pts[0].x - cameraX, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x - cameraX, pts[i].y);
    }

    function drawFlowStripes(stroke, phase) {
      // 管内流动光带：沿路径的虚线高光，看起来像水在冲
      const pts = stroke.points;
      if (pts.length < 2) return;
      ctx.save();
      ctx.strokeStyle = "#e1f5fe";
      ctx.lineWidth = stroke.width * 0.45;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.setLineDash([10, 14]);
      ctx.lineDashOffset = -phase * 40;
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      strokePolyline(stroke);
      ctx.stroke();
      // 内芯更亮
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = stroke.width * 0.18;
      ctx.setLineDash([6, 18]);
      ctx.lineDashOffset = -phase * 55 + 4;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      strokePolyline(stroke);
      ctx.stroke();
      ctx.restore();
    }

    function drawWetPipeGlow(stroke) {
      ctx.save();
      ctx.strokeStyle = "rgba(79,195,247,0.25)";
      ctx.lineWidth = stroke.width + 8;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      strokePolyline(stroke);
      ctx.stroke();
      ctx.restore();
    }

    function pourStream() {
      // 杯口上方注水水柱
      const c = pipe32Scene.cup;
      const x = c.x + c.w * 0.5 - cameraX;
      const top = c.y - 28;
      const bottom = c.y + 2;
      const t = pipe32Scene.pulse * 8;
      ctx.save();
      // 外层柔光
      ctx.strokeStyle = "rgba(129,212,250,0.35)";
      ctx.lineWidth = 10;
      ctx.lineCap = "round";
      ctx.beginPath();
      for (let i = 0; i <= 8; i++) {
        const y = top + (bottom - top) * (i / 8);
        const wob = Math.sin(t + i * 0.7) * 1.8;
        if (i === 0) ctx.moveTo(x + wob, y);
        else ctx.lineTo(x + wob, y);
      }
      ctx.stroke();
      // 水柱本体
      ctx.strokeStyle = "#4fc3f7";
      ctx.lineWidth = 5;
      ctx.beginPath();
      for (let i = 0; i <= 8; i++) {
        const y = top + (bottom - top) * (i / 8);
        const wob = Math.sin(t + i * 0.7) * 1.8;
        if (i === 0) ctx.moveTo(x + wob, y);
        else ctx.lineTo(x + wob, y);
      }
      ctx.stroke();
      // 高光芯
      ctx.strokeStyle = "#e1f5fe";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i <= 8; i++) {
        const y = top + (bottom - top) * (i / 8);
        const wob = Math.sin(t + i * 0.7) * 1.8;
        if (i === 0) ctx.moveTo(x + wob - 1, y);
        else ctx.lineTo(x + wob - 1, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    function drawCupWaterSurface() {
      const c = pipe32Scene.cup;
      const fh = (c.fill / c.fillMax) * (c.h - 6);
      if (fh <= 2) return;
      const x0 = c.x - cameraX + 5;
      const x1 = c.x - cameraX + c.w - 5;
      const baseY = c.y + c.h - 2 - fh;
      ctx.save();
      // 波浪水面
      ctx.beginPath();
      ctx.moveTo(x0, baseY);
      const segs = 10;
      for (let i = 1; i <= segs; i++) {
        const x = x0 + (x1 - x0) * (i / segs);
        const y = baseY + Math.sin(pipe32Scene.pulse * 4 + i * 0.9) * 2.2;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(x1, c.y + c.h - 2);
      ctx.lineTo(x0, c.y + c.h - 2);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, baseY, 0, c.y + c.h);
      grad.addColorStop(0, "rgba(41,182,246,0.95)");
      grad.addColorStop(1, "rgba(2,136,209,0.9)");
      ctx.fillStyle = grad;
      ctx.fill();
      // 水面亮线
      ctx.beginPath();
      for (let i = 0; i <= segs; i++) {
        const x = x0 + (x1 - x0) * (i / segs);
        const y = baseY + Math.sin(pipe32Scene.pulse * 4 + i * 0.9) * 2.2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(255,255,255,0.65)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    function drawParticles() {
      const fx = pipe32Scene.fx;
      if (!fx) return;
      ctx.save();
      for (const p of fx.drops) {
        const a = Math.max(0, p.life / p.max);
        ctx.globalAlpha = a * 0.9;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x - cameraX, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const p of fx.splashes) {
        const a = Math.max(0, p.life / p.max);
        ctx.globalAlpha = a;
        ctx.fillStyle = "#81d4fa";
        ctx.beginPath();
        ctx.arc(p.x - cameraX, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const b of fx.bubbles) {
        const a = Math.max(0, b.life / b.max) * 0.7;
        ctx.globalAlpha = a;
        ctx.strokeStyle = "#b3e5fc";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(b.x - cameraX, b.y, b.r, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (const sp of fx.sparkles) {
        const a = Math.max(0, sp.life / sp.max);
        ctx.globalAlpha = a;
        ctx.fillStyle = "#fff9c4";
        const x = sp.x - cameraX;
        const y = sp.y;
        const r = sp.r * (0.6 + a * 0.8);
        // 四角星
        ctx.beginPath();
        ctx.moveTo(x, y - r * 2);
        ctx.lineTo(x + r * 0.5, y - r * 0.4);
        ctx.lineTo(x + r * 2, y);
        ctx.lineTo(x + r * 0.5, y + r * 0.4);
        ctx.lineTo(x, y + r * 2);
        ctx.lineTo(x - r * 0.5, y + r * 0.4);
        ctx.lineTo(x - r * 2, y);
        ctx.lineTo(x - r * 0.5, y - r * 0.4);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    function drawWater() {
      const w = pipe32Scene.water;
      const flowing =
        pipe32Scene.phase === "flow" ||
        pipe32Scene.phase === "fill" ||
        pipe32Scene.phase === "done";
      if (!w || !w.path || !w.path.length) {
        if (flowing) drawParticles();
        return;
      }
      for (const s of w.path) s.wet = true;

      // 已通水的管道：辉光 + 流光
      const stripesPhase = pipe32Scene.pulse;
      for (let i = 0; i < w.path.length; i++) {
        const stroke = w.path[i];
        const isCurrent = pipe32Scene.phase === "flow" && i === w.seg;
        drawWetPipeGlow(stroke);
        drawStrokePath(stroke, 1);
        if (flowing && !isCurrent) drawFlowStripes(stroke, stripesPhase + i * 0.3);
      }

      // 当前流动段：半截水 + 水头光球
      if (pipe32Scene.phase === "flow" && w.seg < w.path.length) {
        const stroke = w.path[w.seg];
        const pts = stroke.points;
        if (pts.length >= 2) {
          const total = pts.length - 1;
          const f = w.t * total;
          const i0 = Math.min(Math.floor(f), total - 1);
          const lt = f - i0;
          const hx = pts[i0].x + (pts[i0 + 1].x - pts[i0].x) * lt;
          const hy = pts[i0].y + (pts[i0 + 1].y - pts[i0].y) * lt;
          // 已流过前缀
          ctx.save();
          ctx.strokeStyle = "#29b6f6";
          ctx.lineWidth = stroke.width * 0.7;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(pts[0].x - cameraX, pts[0].y);
          for (let i = 1; i <= i0; i++) ctx.lineTo(pts[i].x - cameraX, pts[i].y);
          ctx.lineTo(hx - cameraX, hy);
          ctx.stroke();
          ctx.restore();
          drawFlowStripes(stroke, stripesPhase);

          // 水头光球
          ctx.save();
          const pulse = 1 + Math.sin(pipe32Scene.pulse * 6) * 0.15;
          ctx.fillStyle = "rgba(79,195,247,0.25)";
          ctx.beginPath();
          ctx.arc(hx - cameraX, hy, 14 * pulse, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#4fc3f7";
          ctx.beginPath();
          ctx.arc(hx - cameraX, hy, 7 * pulse, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#e1f5fe";
          ctx.beginPath();
          ctx.arc(hx - cameraX - 1.5, hy - 1.5, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // 入杯注水
      if (pipe32Scene.phase === "fill") pourStream();

      drawCupWaterSurface();
      drawParticles();
    }

    function drawPipe32Extras() {
      if (!pipe32Scene) return;
      drawSourceAndCup();

      // 画笔画
      for (const s of pipe32Scene.strokes) {
        const onPath = pipe32Scene.pipeLit.includes(s);
        if (onPath) s.wet = true;
        drawStrokePath(s, pipe32Scene.drawing === s ? 0.95 : 1);
      }
      if (pipe32Scene.drawing) drawStrokePath(pipe32Scene.drawing, 0.95);

      drawWater();

      // 提示
      ctx.save();
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      if (pipe32Scene.phase === "draw") {
        ctx.fillStyle = "#fff59d";
        ctx.fillText("用手指画水管，把水源接到左下角杯子 · 墨水无限", W / 2, 36);
        ctx.fillStyle = "#cfd8dc";
        ctx.font = "12px sans-serif";
        ctx.fillText("画好后点「我画好了」放水", W / 2, 56);
      } else if (pipe32Scene.phase === "flow") {
        ctx.fillStyle = "#81d4fa";
        ctx.fillText("水正在管子里流……", W / 2, 42);
      } else if (pipe32Scene.phase === "fill") {
        ctx.fillStyle = "#80cbc4";
        ctx.fillText("正在接水……", W / 2, 42);
      }
      if (pipe32Scene.toast) {
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        const tw = ctx.measureText(pipe32Scene.toast).width + 24;
        ctx.fillRect(W / 2 - tw * 0.5, 70, tw, 30);
        ctx.fillStyle = "#ffe082";
        ctx.fillText(pipe32Scene.toast, W / 2, 90);
      }
      ctx.restore();
    }

    GameLevelKit.bindDrawPointer({
      canvas,
      sceneRef: () => (level === 32 && state === "playing" && pipe32Scene && pipe32Scene.phase === "draw" ? pipe32Scene : null),
      clientToWorld,
      isBlocked: () => !!(settingsOpen || adOpen || shopOpen || socialOpen),
      tool: strokeTool,
      boundKey: "_p32DrawBound",
    });

    GameLevelKit.bindReadyButton(readyBtn, () => {
      if (state !== "playing" || level !== 32 || !pipe32Scene) return;
      startFlow();
    });

    S.initPipe32 = initPipe32;
    S.updatePipe32 = updatePipe32;
    S.drawPipe32Extras = drawPipe32Extras;
    S.syncPipe32OnLeave = syncPipe32OnLeave;
    S.tryClickPipe32 = tryClickPipe32;
  }
};
