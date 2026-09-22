// 第 31 关：神笔马良 · 画盾挡弹 —— 手绘盾牌需至少两根接地柱子，无支撑会被子弹打倒
window.installMaliang31 = function (S) {
  with (S) {
    const readyBtn = document.getElementById("lv31-ready-btn");
    const STROKE_W = 18;
    const MIN_INK_USED = 40;
    const GROUND_SLACK = 14;
    const PILLAR_MIN_H = 55;
    const PILLAR_X_GAP = 36;
    const CONNECT_DIST = STROKE_W * 1.35;
    const MIN_PILLARS = 2;

    function ml31Toast(msg, sec) {
      if (!ml31Scene) return;
      ml31Scene.toast = msg;
      ml31Scene.toastT = sec || 2.5;
    }

    function syncReadyBtn() {
      if (!readyBtn) return;
      const show =
        state === "playing" &&
        level === 31 &&
        ml31Scene &&
        ml31Scene.phase === "draw" &&
        !ml31Scene.done;
      readyBtn.classList.toggle("hidden", !show);
      readyBtn.setAttribute("aria-hidden", show ? "false" : "true");
    }

    function inkLabel() {
      if (!ml31Scene) return "0";
      if (!Number.isFinite(ml31Scene.ink)) return "∞";
      return String(Math.ceil(ml31Scene.ink));
    }

    function inkUsed() {
      if (!ml31Scene) return 0;
      if (!Number.isFinite(ml31Scene.inkMax)) return ml31Scene.inkSpent || 0;
      return Math.max(0, ml31Scene.inkMax - ml31Scene.ink);
    }

    function clearStrokes() {
      if (!ml31Scene) return;
      ml31Scene.strokes = [];
      ml31Scene.drawing = null;
      ml31Scene.shields = [];
      ml31Scene.falling = [];
      ml31Scene.structure = null;
    }

    function clampDrawPoint(x, y) {
      return {
        x: clamp(x, 40, worldWidth - 40),
        y: clamp(y, 60, ml31Scene.groundY - 4),
      };
    }

    function beginStroke(wx, wy) {
      if (!ml31Scene || ml31Scene.phase !== "draw" || ml31Scene.ink <= 0) return false;
      const p = clampDrawPoint(wx, wy);
      ml31Scene.drawing = {
        points: [p],
        width: STROKE_W,
        supported: true,
        falling: false,
      };
      ml31Scene.strokes.push(ml31Scene.drawing);
      statusLabel.textContent = `手绘盾牌 · 墨水 ${inkLabel()}`;
      return true;
    }

    function extendStroke(wx, wy) {
      if (!ml31Scene || !ml31Scene.drawing || ml31Scene.ink <= 0) return;
      const p = clampDrawPoint(wx, wy);
      const pts = ml31Scene.drawing.points;
      const last = pts[pts.length - 1];
      const dx = p.x - last.x;
      const dy = p.y - last.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 2.5) return;

      let use = dist;
      if (use > ml31Scene.ink) {
        const t = ml31Scene.ink / use;
        p.x = last.x + dx * t;
        p.y = last.y + dy * t;
        use = ml31Scene.ink;
      }
      ml31Scene.ink -= use;
      ml31Scene.inkSpent = (ml31Scene.inkSpent || 0) + use;
      pts.push(p);
      statusLabel.textContent = `手绘盾牌 · 墨水 ${inkLabel()}`;
      if (Number.isFinite(ml31Scene.ink) && ml31Scene.ink <= 0) {
        ml31Scene.ink = 0;
        ml31Scene.drawing = null;
        ml31Toast("墨水用完了", 1.4);
      }
    }

    function endStroke() {
      if (!ml31Scene) return;
      if (ml31Scene.drawing && ml31Scene.drawing.points.length < 2) {
        const i = ml31Scene.strokes.indexOf(ml31Scene.drawing);
        if (i >= 0) ml31Scene.strokes.splice(i, 1);
      }
      ml31Scene.drawing = null;
    }

    function pointSegDist(px, py, ax, ay, bx, by) {
      const abx = bx - ax;
      const aby = by - ay;
      const len2 = abx * abx + aby * aby;
      if (len2 < 1e-6) return Math.hypot(px - ax, py - ay);
      let t = ((px - ax) * abx + (py - ay) * aby) / len2;
      t = clamp(t, 0, 1);
      return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
    }

    function strokeBounds(stroke) {
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const p of stroke.points) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
      return { minX, maxX, minY, maxY, h: maxY - minY, w: maxX - minX };
    }

    function strokesNear(a, b) {
      const ba = strokeBounds(a);
      const bb = strokeBounds(b);
      if (
        ba.maxX + CONNECT_DIST < bb.minX ||
        bb.maxX + CONNECT_DIST < ba.minX ||
        ba.maxY + CONNECT_DIST < bb.minY ||
        bb.maxY + CONNECT_DIST < ba.minY
      ) {
        return false;
      }
      for (const pa of a.points) {
        for (let i = 1; i < b.points.length; i++) {
          if (
            pointSegDist(
              pa.x,
              pa.y,
              b.points[i - 1].x,
              b.points[i - 1].y,
              b.points[i].x,
              b.points[i].y
            ) <= CONNECT_DIST
          ) {
            return true;
          }
        }
      }
      for (const pb of b.points) {
        for (let i = 1; i < a.points.length; i++) {
          if (
            pointSegDist(
              pb.x,
              pb.y,
              a.points[i - 1].x,
              a.points[i - 1].y,
              a.points[i].x,
              a.points[i].y
            ) <= CONNECT_DIST
          ) {
            return true;
          }
        }
      }
      return false;
    }

    // 接地墨迹按 X 聚类；每簇在竖直柱带内抬升够高才算一根柱子
    function findPillars(strokes) {
      const gy = ml31Scene.groundY;
      const groundPts = [];
      for (const s of strokes) {
        if (s.falling) continue;
        for (const p of s.points) {
          if (p.y >= gy - GROUND_SLACK) groundPts.push({ x: p.x, y: p.y });
        }
      }
      if (!groundPts.length) return [];

      groundPts.sort((a, b) => a.x - b.x);
      const clusters = [];
      let cur = { xs: [groundPts[0].x] };
      for (let i = 1; i < groundPts.length; i++) {
        const p = groundPts[i];
        if (p.x - cur.xs[cur.xs.length - 1] <= PILLAR_X_GAP) {
          cur.xs.push(p.x);
        } else {
          clusters.push(cur);
          cur = { xs: [p.x] };
        }
      }
      clusters.push(cur);

      const COL_W = 28;
      const pillars = [];
      for (const c of clusters) {
        let sum = 0;
        for (const x of c.xs) sum += x;
        const cx = sum / c.xs.length;
        let minY = gy;
        const touchStrokes = new Set();
        for (const s of strokes) {
          if (s.falling) continue;
          let nearCol = false;
          for (const p of s.points) {
            if (Math.abs(p.x - cx) <= COL_W) {
              nearCol = true;
              if (p.y < minY) minY = p.y;
            }
          }
          if (nearCol) touchStrokes.add(s);
        }
        const height = gy - minY;
        if (height >= PILLAR_MIN_H && touchStrokes.size) {
          pillars.push({
            x: cx,
            minX: cx - COL_W,
            maxX: cx + COL_W,
            height,
            strokes: touchStrokes,
          });
        }
      }
      return pillars;
    }

    function componentTouchesPillar(group, pillar) {
      for (const s of group) {
        if (pillar.strokes.has(s)) return true;
        for (const p of s.points) {
          if (p.x >= pillar.minX - 8 && p.x <= pillar.maxX + 8) return true;
        }
      }
      return false;
    }

    function connectedComponents(strokes) {
      const alive = strokes.filter((s) => !s.falling && s.points.length >= 2);
      const comps = [];
      const seen = new Set();
      for (const s of alive) {
        if (seen.has(s)) continue;
        const stack = [s];
        const group = [];
        while (stack.length) {
          const cur = stack.pop();
          if (seen.has(cur)) continue;
          seen.add(cur);
          group.push(cur);
          for (const other of alive) {
            if (!seen.has(other) && strokesNear(cur, other)) stack.push(other);
          }
        }
        comps.push(group);
      }
      return comps;
    }

    function analyzeStructure() {
      if (!ml31Scene) return null;
      const strokes = ml31Scene.strokes.filter((s) => !s.falling && s.points.length >= 2);
      const pillars = findPillars(strokes);
      const comps = connectedComponents(strokes);

      for (const s of strokes) {
        s.supported = false;
        s.pillarCount = 0;
      }

      for (const group of comps) {
        let hitPillars = 0;
        for (const pillar of pillars) {
          if (componentTouchesPillar(group, pillar)) hitPillars += 1;
        }
        const ok = hitPillars >= MIN_PILLARS;
        for (const s of group) {
          s.pillarCount = hitPillars;
          s.supported = ok;
        }
      }

      const info = {
        pillars: pillars.length,
        pillarList: pillars,
        supportedStrokes: strokes.filter((s) => s.supported).length,
        totalStrokes: strokes.length,
      };
      ml31Scene.structure = info;
      return info;
    }

    function knockDownStroke(stroke, fromX, fromY) {
      if (!stroke || stroke.falling) return;
      stroke.falling = true;
      stroke.supported = false;
      stroke.fallVy = 40;
      stroke.fallVx = (Math.random() - 0.5) * 60;
      stroke.fallRot = (Math.random() - 0.5) * 1.2;
      if (fromX != null) spawnBurst(fromX, fromY, "#ff8a5c", 10);
      else {
        const b = strokeBounds(stroke);
        spawnBurst((b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2, "#ff8a5c", 8);
      }
      if (window.GameAudio && GameAudio.playClick) GameAudio.playClick();
    }

    function hitStroke(b) {
      const r = b.r + STROKE_W * 0.5;
      for (const stroke of ml31Scene.strokes) {
        if (stroke.falling) continue;
        const pts = stroke.points;
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1];
          const c = pts[i];
          if (pointSegDist(b.x, b.y, a.x, a.y, c.x, c.y) <= r) {
            return stroke;
          }
        }
      }
      return null;
    }

    function startShooting() {
      if (!ml31Scene || ml31Scene.phase !== "draw" || ml31Scene.done) return;
      endStroke();
      if (inkUsed() < MIN_INK_USED) {
        ml31Toast("先按住拖动画出盾牌！", 2);
        return;
      }
      const info = analyzeStructure();
      ml31Scene.phase = "shoot";
      ml31Scene.shootT = 0;
      ml31Scene.fireCd = 0.3;
      ml31Scene.bullets = [];
      if (!info || info.pillars < MIN_PILLARS) {
        ml31Toast(`只有 ${info ? info.pillars : 0} 根柱子！至少要 ${MIN_PILLARS} 根接地柱，不然会被打倒`, 3.2);
      } else {
        ml31Toast(`结构稳固（${info.pillars} 根柱）· 坚持 10 秒！`, 2.5);
      }
      statusLabel.textContent = "射击开始 · 坚持 10 秒";
      syncReadyBtn();
      if (window.GameAudio && GameAudio.playClick) GameAudio.playClick();
    }

    function spawnBullet() {
      if (!ml31Scene || !player) return;
      const n = ml31Scene.npc;
      // 优先瞄准墨迹中部，其次玩家
      let aimX = player.x + player.w / 2;
      let aimY = player.y + player.h * 0.4;
      const alive = ml31Scene.strokes.filter((s) => !s.falling && s.points.length >= 2);
      if (alive.length) {
        const pick = alive[Math.floor(Math.random() * alive.length)];
        const pt = pick.points[Math.floor(Math.random() * pick.points.length)];
        aimX = pt.x;
        aimY = pt.y;
      }
      const dx = aimX - (n.x + 4);
      const dy = aimY - (n.y + 18);
      const len = Math.hypot(dx, dy) || 1;
      const speed = 340 + Math.random() * 90;
      ml31Scene.bullets.push({
        x: n.x + 4,
        y: n.y + 18,
        vx: (dx / len) * speed,
        vy: (dy / len) * speed,
        r: 5,
      });
    }

    function updateFalling(dt) {
      for (let i = ml31Scene.strokes.length - 1; i >= 0; i--) {
        const s = ml31Scene.strokes[i];
        if (!s.falling) continue;
        s.fallVy = (s.fallVy || 0) + 900 * dt;
        const vx = (s.fallVx || 0) * dt;
        const vy = s.fallVy * dt;
        for (const p of s.points) {
          p.x += vx;
          p.y += vy;
        }
        const b = strokeBounds(s);
        if (b.minY > H + 40) {
          ml31Scene.strokes.splice(i, 1);
        }
      }
    }

    function initMaliang31() {
      if (!ml31Scene) return;
      ml31Scene.phase = "draw";
      ml31Scene.hasBrush = true;
      ml31Scene.ink = ml31Scene.inkMax;
      ml31Scene.inkSpent = 0;
      ml31Scene.drawing = null;
      ml31Scene.bullets = [];
      ml31Scene.shootT = 0;
      ml31Scene.fireCd = 0;
      ml31Scene.toast = "";
      ml31Scene.toastT = 0;
      ml31Scene.done = false;
      ml31Scene.pulse = 0;
      ml31Scene.structure = null;
      clearStrokes();
      if (player) {
        player.x = 160;
        player.y = ml31Scene.groundY - 40;
        player.vx = 0;
        player.vy = 0;
        player.facing = 1;
        player.onGround = true;
      }
      if (window.GameAudio && GameAudio.unlock) GameAudio.unlock();
      statusLabel.textContent = "画两根柱子撑盾";
      ml31Toast("至少两根接地柱子撑住盾牌，悬空/单线会被子弹打倒", 3.8);
      syncReadyBtn();
    }

    function syncMaliang31OnLeave() {
      clearStrokes();
      if (ml31Scene) {
        ml31Scene.bullets = [];
        ml31Scene.phase = "draw";
        ml31Scene.drawing = null;
        ml31Scene.structure = null;
      }
      syncReadyBtn();
    }

    function updateMaliang31(dt) {
      if (!ml31Scene || level !== 31 || state !== "playing") {
        syncReadyBtn();
        return;
      }
      ml31Scene.pulse += dt;
      if (ml31Scene.toastT > 0) {
        ml31Scene.toastT -= dt;
        if (ml31Scene.toastT <= 0) ml31Scene.toast = "";
      }

      if (player) {
        player.x = 160;
        player.y = ml31Scene.groundY - player.h;
        player.vx = 0;
        player.vy = 0;
        player.facing = 1;
        player.onGround = true;
      }

      if (ml31Scene.phase === "draw") {
        // 实时预览结构是否稳固
        if (ml31Scene.strokes.length) analyzeStructure();
        syncReadyBtn();
        return;
      }

      if (ml31Scene.phase === "shoot" && !ml31Scene.done) {
        updateFalling(dt);
        ml31Scene.shootT += dt;
        ml31Scene.fireCd -= dt;
        if (ml31Scene.fireCd <= 0) {
          spawnBullet();
          ml31Scene.fireCd = 0.38 + Math.random() * 0.22;
          if (window.GameAudio && GameAudio.playGunShot) GameAudio.playGunShot();
          else if (window.GameAudio && GameAudio.playClick) GameAudio.playClick();
        }

        for (let i = ml31Scene.bullets.length - 1; i >= 0; i--) {
          const b = ml31Scene.bullets[i];
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          const hit = hitStroke(b);
          if (hit) {
            if (hit.supported) {
              spawnBurst(b.x, b.y, "#5ce1ff", 4);
            } else {
              // 无支撑：整段被打倒；同连通块若也无支撑一并塌
              knockDownStroke(hit, b.x, b.y);
              for (const s of ml31Scene.strokes) {
                if (!s.falling && !s.supported && s !== hit && strokesNear(s, hit)) {
                  knockDownStroke(s, b.x, b.y);
                }
              }
            }
            ml31Scene.bullets.splice(i, 1);
            continue;
          }

          if (
            player &&
            b.x + b.r > player.x + 4 &&
            b.x - b.r < player.x + player.w - 4 &&
            b.y + b.r > player.y + 4 &&
            b.y - b.r < player.y + player.h - 4
          ) {
            die("spike");
            return;
          }
          if (b.x < 40 || b.x > 920 || b.y < 40 || b.y > H + 20) {
            ml31Scene.bullets.splice(i, 1);
          }
        }

        const left = Math.max(0, ml31Scene.shootDur - ml31Scene.shootT);
        const info = ml31Scene.structure;
        statusLabel.textContent =
          info && info.pillars >= MIN_PILLARS
            ? `抵挡中 · 剩余 ${left.toFixed(1)} 秒`
            : `结构不稳 · 剩余 ${left.toFixed(1)} 秒`;

        if (ml31Scene.shootT >= ml31Scene.shootDur) {
          ml31Scene.done = true;
          ml31Scene.phase = "done";
          ml31Scene.bullets = [];
          statusLabel.textContent = "挡住了！通关！";
          ml31Toast("神笔护体，逃过一劫！", 2);
          if (window.GameAudio && GameAudio.playStar) GameAudio.playStar();
          stars += 1;
          saveStars();
          if (starLabel) starLabel.textContent = String(stars);
          syncReadyBtn();
          setTimeout(() => {
            if (state === "playing" && level === 31) winLevel();
          }, 750);
        }
      }
    }

    function tryClickMaliang31() {
      return !!(ml31Scene && level === 31 && state === "playing" && ml31Scene.phase === "draw");
    }

    function drawStrokePath(stroke, alpha) {
      const pts = stroke.points;
      if (!pts.length) return;
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const falling = stroke.falling;
      const supported = stroke.supported;
      let col = "92,225,255";
      if (falling) col = "255,120,80";
      else if (ml31Scene.phase === "draw" || ml31Scene.phase === "shoot") {
        if (!supported) col = "255,170,90";
      }
      ctx.globalAlpha = falling ? 0.75 : alpha;
      ctx.strokeStyle = `rgba(${col},${falling ? 0.85 : 0.95})`;
      ctx.lineWidth = stroke.width || STROKE_W;
      ctx.beginPath();
      ctx.moveTo(pts[0].x - cameraX, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x - cameraX, pts[i].y);
      }
      ctx.stroke();
      ctx.strokeStyle = falling
        ? "rgba(255,200,160,0.7)"
        : supported
          ? "rgba(180,245,255,0.95)"
          : "rgba(255,220,180,0.85)";
      ctx.lineWidth = (stroke.width || STROKE_W) * 0.45;
      ctx.stroke();
      ctx.restore();
    }

    function drawPillarMarkers() {
      if (!ml31Scene || !ml31Scene.structure || !ml31Scene.structure.pillarList) return;
      if (ml31Scene.phase !== "draw" && ml31Scene.phase !== "shoot") return;
      for (const p of ml31Scene.structure.pillarList) {
        const x = p.x - cameraX;
        ctx.fillStyle = "rgba(125,255,154,0.85)";
        ctx.beginPath();
        ctx.moveTo(x, ml31Scene.groundY - 6);
        ctx.lineTo(x - 7, ml31Scene.groundY + 6);
        ctx.lineTo(x + 7, ml31Scene.groundY + 6);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#7dff9a";
        ctx.font = "10px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("柱", x, ml31Scene.groundY + 18);
      }
    }

    function drawMaliang31Extras() {
      if (!ml31Scene || level !== 31) return;

      const n = ml31Scene.npc;
      const nx = n.x - cameraX;
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.beginPath();
      ctx.ellipse(nx + 15, n.y + n.h + 3, 14, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#6a3a28";
      ctx.fillRect(nx + 4, n.y + 12, 22, 22);
      ctx.fillStyle = "#f0c8a0";
      ctx.fillRect(nx + 6, n.y, 18, 14);
      ctx.fillStyle = "#2a2018";
      ctx.fillRect(nx + 5, n.y - 2, 20, 8);
      ctx.fillStyle = "#1a1010";
      ctx.fillRect(nx + 8, n.y + 5, 3, 3);
      ctx.fillStyle = "#3a3030";
      ctx.fillRect(nx - 8, n.y + 16, 14, 5);
      ctx.fillStyle = "#ffe27a";
      ctx.font = "11px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("官兵", nx + 15, n.y - 8);

      for (const stroke of ml31Scene.strokes) {
        drawStrokePath(stroke, 0.95);
      }
      drawPillarMarkers();

      for (const b of ml31Scene.bullets) {
        ctx.fillStyle = "#ff5533";
        ctx.beginPath();
        ctx.arc(b.x - cameraX, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffe27a";
        ctx.beginPath();
        ctx.arc(b.x - cameraX - 1, b.y - 1, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      if (player) {
        const px = player.x - cameraX + player.w - 2;
        const py = player.y + 12;
        ctx.fillStyle = "#2a1810";
        ctx.fillRect(px, py, 4, 16);
        ctx.fillStyle = "#5ce1ff";
        ctx.fillRect(px - 2, py - 2, 8, 6);
      }

      const info = ml31Scene.structure;
      const pillars = info ? info.pillars : 0;
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(16, 12, 310, 58);
      ctx.fillStyle = pillars >= MIN_PILLARS ? "#7dff9a" : "#5ce1ff";
      ctx.font = "13px 'Noto Sans SC', sans-serif";
      if (ml31Scene.phase === "draw") {
        ctx.fillText(
          `手绘 · 墨水 ${inkLabel()} · 柱子 ${pillars}/${MIN_PILLARS}`,
          26,
          34
        );
        ctx.fillStyle = pillars >= MIN_PILLARS ? "#7dff9a" : "#ffb070";
        ctx.font = "12px 'Noto Sans SC', sans-serif";
        ctx.fillText(
          pillars >= MIN_PILLARS
            ? "结构稳固 · 可点「我画好了」"
            : "需≥2根接地柱 · 悬空/单线会被打倒",
          26,
          54
        );
      } else if (ml31Scene.phase === "shoot") {
        const left = Math.max(0, ml31Scene.shootDur - ml31Scene.shootT);
        ctx.fillText(`抵挡射击 · ${left.toFixed(1)}s · 柱 ${pillars}`, 26, 34);
        ctx.fillStyle = pillars >= MIN_PILLARS ? "#7dff9a" : "#ff8a8a";
        ctx.fillText(pillars >= MIN_PILLARS ? "有支撑，挡得住！" : "无支撑，一打就塌！", 26, 54);
      } else {
        ctx.fillText("成功挡住子弹！", 26, 40);
      }

      if (ml31Scene.phase === "shoot") {
        const p = clamp(ml31Scene.shootT / ml31Scene.shootDur, 0, 1);
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(W / 2 - 110, 78, 220, 14);
        ctx.fillStyle = "#7dff9a";
        ctx.fillRect(W / 2 - 110, 78, 220 * p, 14);
      }

      if (ml31Scene.toast && ml31Scene.toastT > 0) {
        ctx.textAlign = "center";
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(0,0,0,0.75)";
        ctx.fillStyle = "#ffe27a";
        ctx.font = "14px 'Noto Sans SC', sans-serif";
        ctx.strokeText(ml31Scene.toast, W / 2, 120);
        ctx.fillText(ml31Scene.toast, W / 2, 120);
      }
    }

    if (readyBtn && !readyBtn._ml31Bound) {
      readyBtn._ml31Bound = true;
      readyBtn.addEventListener("click", () => {
        if (level !== 31 || state !== "playing") return;
        startShooting();
      });
    }

    if (canvas && !canvas._ml31DrawBound) {
      canvas._ml31DrawBound = true;
      canvas.addEventListener("pointerdown", (e) => {
        if (level !== 31 || state !== "playing" || !ml31Scene) return;
        if (ml31Scene.phase !== "draw") return;
        if (e.button != null && e.button !== 0) return;
        if (settingsOpen || adOpen || shopOpen || socialOpen) return;
        const world = clientToWorld(e.clientX, e.clientY);
        if (beginStroke(world.x, world.y)) {
          try {
            canvas.setPointerCapture(e.pointerId);
          } catch (_) {}
          e.preventDefault();
        }
      });
      canvas.addEventListener("pointermove", (e) => {
        if (!ml31Scene || !ml31Scene.drawing || level !== 31) return;
        const world = clientToWorld(e.clientX, e.clientY);
        extendStroke(world.x, world.y);
      });
      const stopDraw = () => endStroke();
      canvas.addEventListener("pointerup", stopDraw);
      canvas.addEventListener("pointercancel", stopDraw);
      window.addEventListener("pointerup", stopDraw);
    }

    S.initMaliang31 = initMaliang31;
    S.updateMaliang31 = updateMaliang31;
    S.drawMaliang31Extras = drawMaliang31Extras;
    S.syncMaliang31OnLeave = syncMaliang31OnLeave;
    S.tryClickMaliang31 = tryClickMaliang31;
  }
};
