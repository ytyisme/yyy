// 第 23 关：消消乐 · 顶上炮台瞄准发射 · 90 行方块消完过关
window.installMatch23 = function (S) {
  with (S) {
    function matchToast(msg, sec) {
      if (!matchScene) return;
      matchScene.toast = msg;
      matchScene.toastT = sec || 2.2;
    }

    function cellAt(c, r) {
      if (!matchScene) return -1;
      if (c < 0 || r < 0 || c >= matchScene.cols || r >= matchScene.rows) return -1;
      return matchScene.grid[r * matchScene.cols + c];
    }

    function setCell(c, r, v) {
      matchScene.grid[r * matchScene.cols + c] = v;
    }

    function countRemaining() {
      let n = 0;
      const g = matchScene.grid;
      for (let i = 0; i < g.length; i++) if (g[i] >= 0) n++;
      return n;
    }

    function topFilledRow() {
      const { cols, rows, grid } = matchScene;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r * cols + c] >= 0) return r;
        }
      }
      return rows;
    }

    function syncScroll() {
      const top = topFilledRow();
      // 让最上方有方块的行落在炮台下方
      const target = Math.max(0, top * matchScene.cell - 8);
      matchScene.scrollY += (target - matchScene.scrollY) * 0.18;
    }

    function randColor() {
      return (Math.random() * 4) | 0;
    }

    function popNext() {
      matchScene.current = matchScene.next;
      matchScene.next = randColor();
    }

    function wantLeft() {
      return keys.has("ArrowLeft") || keys.has("a") || keys.has("A") || (touch && touch.left);
    }

    function wantRight() {
      return keys.has("ArrowRight") || keys.has("d") || keys.has("D") || (touch && touch.right);
    }

    function wantShoot() {
      return (
        keys.has("Space") ||
        keys.has("ArrowUp") ||
        keys.has("w") ||
        keys.has("W") ||
        keys.has("Enter") ||
        (touch && touch.jump)
      );
    }

    function fireShot() {
      if (!matchScene || matchScene.done || matchScene.shot || matchScene.cooldown > 0) return;
      const ang = Math.PI / 2 + matchScene.aim; // 0 aim = straight down
      const speed = 520;
      const can = matchScene.cannon;
      matchScene.shot = {
        x: can.x,
        y: can.y + 18,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        color: matchScene.current,
        r: matchScene.cell * 0.42,
      };
      popNext();
      matchScene.cooldown = 0.18;
      if (window.GameAudio && GameAudio.playClick) GameAudio.playClick();
    }

    function worldCellPos(c, r) {
      return {
        x: matchScene.originX + c * matchScene.cell + matchScene.cell / 2,
        y: matchScene.originY + r * matchScene.cell + matchScene.cell / 2 - matchScene.scrollY,
      };
    }

    function findAttachCell(hitC, hitR, px, py) {
      // 优先落在碰撞格的相邻空位；否则找最近空位
      const dirs = [
        [0, -1],
        [0, 1],
        [-1, 0],
        [1, 0],
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ];
      let best = null;
      let bestD = 1e9;
      for (const [dc, dr] of dirs) {
        const c = hitC + dc;
        const r = hitR + dr;
        if (cellAt(c, r) !== -1) continue;
        if (c < 0 || r < 0 || c >= matchScene.cols || r >= matchScene.rows) continue;
        const p = worldCellPos(c, r);
        const d = (p.x - px) * (p.x - px) + (p.y - py) * (p.y - py);
        if (d < bestD) {
          bestD = d;
          best = { c, r };
        }
      }
      if (best) return best;
      // 若撞到空位本身
      if (cellAt(hitC, hitR) < 0 && hitC >= 0 && hitR >= 0 && hitC < matchScene.cols && hitR < matchScene.rows) {
        return { c: hitC, r: hitR };
      }
      return null;
    }

    function floodGroup(sc, sr, color) {
      const list = [];
      const seen = new Set();
      const stack = [[sc, sr]];
      const cols = matchScene.cols;
      while (stack.length) {
        const [c, r] = stack.pop();
        const key = r * cols + c;
        if (seen.has(key)) continue;
        if (cellAt(c, r) !== color) continue;
        seen.add(key);
        list.push({ c, r });
        stack.push([c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]);
      }
      return list;
    }

    function spawnClearFx(cells, color) {
      const hex = matchScene.colors[color].hex;
      for (const { c, r } of cells) {
        const p = worldCellPos(c, r);
        matchScene.particles.push({
          x: p.x,
          y: p.y + matchScene.scrollY,
          vx: (Math.random() - 0.5) * 180,
          vy: -80 - Math.random() * 140,
          life: 0.45 + Math.random() * 0.25,
          color: hex,
          s: 6 + Math.random() * 6,
        });
        if (typeof spawnBurst === "function") spawnBurst(p.x, p.y, hex, 4);
      }
    }

    function applyGravity() {
      const { cols, rows, grid } = matchScene;
      for (let c = 0; c < cols; c++) {
        let write = rows - 1;
        for (let r = rows - 1; r >= 0; r--) {
          const v = grid[r * cols + c];
          if (v >= 0) {
            grid[write * cols + c] = v;
            if (write !== r) grid[r * cols + c] = -1;
            write--;
          }
        }
        for (let r = write; r >= 0; r--) grid[r * cols + c] = -1;
      }
    }

    function resolvePlacement(c, r, color) {
      setCell(c, r, color);
      const group = floodGroup(c, r, color);
      if (group.length >= 3) {
        spawnClearFx(group, color);
        for (const cell of group) setCell(cell.c, cell.r, -1);
        matchScene.cleared += group.length;
        applyGravity();
        // 连锁：重力后若还有 ≥3 同色相连则继续消
        let again = true;
        let guard = 0;
        while (again && guard++ < 40) {
          again = false;
          const seen = new Set();
          for (let rr = 0; rr < matchScene.rows; rr++) {
            for (let cc = 0; cc < matchScene.cols; cc++) {
              const key = rr * matchScene.cols + cc;
              if (seen.has(key)) continue;
              const col = cellAt(cc, rr);
              if (col < 0) continue;
              const g = floodGroup(cc, rr, col);
              for (const x of g) seen.add(x.r * matchScene.cols + x.c);
              if (g.length >= 3) {
                spawnClearFx(g, col);
                for (const cell of g) setCell(cell.c, cell.r, -1);
                matchScene.cleared += g.length;
                again = true;
              }
            }
          }
          if (again) applyGravity();
        }
        if (window.GameAudio && GameAudio.playStar) GameAudio.playStar();
        matchToast(`消除 ${group.length} 块！`, 1.2);
      }
      matchScene.remaining = countRemaining();
      statusLabel.textContent = `消消乐 · 剩余 ${matchScene.remaining}`;
      if (matchScene.remaining <= 0) {
        finishMatch();
      }
    }

    function finishMatch() {
      if (!matchScene || matchScene.done) return;
      matchScene.done = true;
      matchScene.shot = null;
      statusLabel.textContent = "消消乐通关！";
      matchToast("90 行全部清空 · 通关！", 2.5);
      if (window.GameAudio && GameAudio.playStar) GameAudio.playStar();
      setTimeout(() => {
        if (state === "playing" && level === 23) winLevel();
      }, 900);
    }

    function placeShotOnGrid(shot) {
      const cell = matchScene.cell;
      const localY = shot.y + matchScene.scrollY - matchScene.originY;
      const localX = shot.x - matchScene.originX;
      let c = Math.floor(localX / cell);
      let r = Math.floor(localY / cell);
      c = Math.max(0, Math.min(matchScene.cols - 1, c));
      r = Math.max(0, Math.min(matchScene.rows - 1, r));

      // 若当前格有方块，找相邻空位；若为空直接放
      let target = null;
      if (cellAt(c, r) < 0) target = { c, r };
      else target = findAttachCell(c, r, shot.x, shot.y);

      if (!target) {
        // 挤到顶部空行
        for (let rr = 0; rr < matchScene.rows; rr++) {
          if (cellAt(c, rr) < 0) {
            target = { c, r: rr };
            break;
          }
        }
      }
      if (target) resolvePlacement(target.c, target.r, shot.color);
      matchScene.shot = null;
    }

    function updateShot(dt) {
      const shot = matchScene.shot;
      if (!shot) return;
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;

      const left = matchScene.originX;
      const right = matchScene.originX + matchScene.cols * matchScene.cell;
      if (shot.x - shot.r < left) {
        shot.x = left + shot.r;
        shot.vx = Math.abs(shot.vx);
      } else if (shot.x + shot.r > right) {
        shot.x = right - shot.r;
        shot.vx = -Math.abs(shot.vx);
      }

      // 出底界
      const bottom =
        matchScene.originY + matchScene.rows * matchScene.cell - matchScene.scrollY + 40;
      if (shot.y > bottom || shot.y > H + 40) {
        matchScene.shot = null;
        matchToast("打偏了", 1);
        return;
      }

      const cell = matchScene.cell;
      const localY = shot.y + matchScene.scrollY - matchScene.originY;
      const localX = shot.x - matchScene.originX;
      const c0 = Math.floor(localX / cell);
      const r0 = Math.floor(localY / cell);
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const c = c0 + dc;
          const r = r0 + dr;
          if (cellAt(c, r) < 0) continue;
          const p = worldCellPos(c, r);
          const hx = Math.max(p.x - cell / 2, Math.min(shot.x, p.x + cell / 2));
          const hy = Math.max(p.y - cell / 2, Math.min(shot.y, p.y + cell / 2));
          const dx = shot.x - hx;
          const dy = shot.y - hy;
          if (dx * dx + dy * dy <= shot.r * shot.r) {
            placeShotOnGrid(shot);
            return;
          }
        }
      }
    }

    function initMatch23() {
      if (!matchScene) return;
      const g = matchScene.grid;
      const emptyTop = 3;
      for (let r = 0; r < matchScene.rows; r++) {
        for (let c = 0; c < matchScene.cols; c++) {
          g[r * matchScene.cols + c] = r < emptyTop ? -1 : randColor();
        }
      }
      matchScene.aim = 0;
      matchScene.current = randColor();
      matchScene.next = randColor();
      matchScene.shot = null;
      matchScene.cooldown = 0;
      matchScene.scrollY = 0;
      matchScene.toast = "";
      matchScene.toastT = 0;
      matchScene.cleared = 0;
      matchScene.remaining = countRemaining();
      matchScene.done = false;
      matchScene.particles = [];
      matchScene.shootHeld = false;
      // 本关不显示角色，移出画面
      if (player) {
        player.x = -999;
        player.y = -999;
        player.vx = 0;
        player.vy = 0;
      }
      if (window.GameAudio && GameAudio.unlock) GameAudio.unlock();
      statusLabel.textContent = `消消乐 · 剩余 ${matchScene.remaining}`;
      matchToast("左右瞄准，空格/跳 发射 · 三连同色消除 · 消完过关", 3.4);
    }

    function syncMatch23OnLeave() {}

    function updateMatch23(dt) {
      if (!matchScene || level !== 23 || state !== "playing") return;

      if (matchScene.toastT > 0) {
        matchScene.toastT -= dt;
        if (matchScene.toastT <= 0) matchScene.toast = "";
      }
      if (matchScene.cooldown > 0) matchScene.cooldown -= dt;

      // 本关无角色，仅炮台操作
      if (player) {
        player.x = -999;
        player.y = -999;
        player.vx = 0;
        player.vy = 0;
      }

      if (!matchScene.done) {
        const turn = 2.2 * dt;
        if (wantLeft()) matchScene.aim = Math.max(matchScene.aimMin, matchScene.aim - turn);
        if (wantRight()) matchScene.aim = Math.min(matchScene.aimMax, matchScene.aim + turn);

        const shoot = wantShoot();
        if (shoot && !matchScene.shootHeld) fireShot();
        matchScene.shootHeld = shoot;

        updateShot(dt);
        syncScroll();
      }

      for (const p of matchScene.particles) {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 420 * dt;
      }
      matchScene.particles = matchScene.particles.filter((p) => p.life > 0);
    }

    function drawMatchExtras() {
      if (!matchScene || level !== 23) return;
      const {
        room,
        cols,
        rows,
        cell,
        originX,
        originY,
        colors,
        grid,
        scrollY,
        cannon,
        aim,
      } = matchScene;

      // 场地背景
      const ax = room.x - cameraX;
      ctx.fillStyle = "rgba(18, 22, 40, 0.55)";
      ctx.fillRect(ax, room.y, room.w, room.h);

      // 棋盘底板
      const boardW = cols * cell;
      const boardH = rows * cell;
      const bx = originX - cameraX;
      const by = originY - scrollY;
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(bx - 4, Math.max(room.y, by) - 4, boardW + 8, Math.min(boardH + 8, room.h));

      // 只画可见行
      const viewTop = room.y;
      const viewBot = room.y + room.h;
      const r0 = Math.max(0, Math.floor((viewTop - by) / cell) - 1);
      const r1 = Math.min(rows - 1, Math.ceil((viewBot - by) / cell) + 1);
      for (let r = r0; r <= r1; r++) {
        for (let c = 0; c < cols; c++) {
          const v = grid[r * cols + c];
          if (v < 0) continue;
          const x = bx + c * cell;
          const y = by + r * cell;
          if (y + cell < viewTop || y > viewBot) continue;
          ctx.fillStyle = colors[v].hex;
          ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
          ctx.fillStyle = "rgba(255,255,255,0.22)";
          ctx.fillRect(x + 2, y + 2, cell - 4, 4);
        }
      }

      // 炮台
      const cx = cannon.x - cameraX;
      const cy = cannon.y;
      ctx.fillStyle = "#2a3148";
      ctx.fillRect(cx - 28, cy - 14, 56, 28);
      ctx.fillStyle = "#4a5678";
      ctx.beginPath();
      ctx.arc(cx, cy, 16, 0, Math.PI * 2);
      ctx.fill();

      const ang = Math.PI / 2 + aim;
      const len = 34;
      ctx.strokeStyle = "#d8e0ff";
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(ang) * len, cy + Math.sin(ang) * len);
      ctx.stroke();

      // 瞄准虚线
      ctx.strokeStyle = "rgba(255,255,255,0.28)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * 20, cy + Math.sin(ang) * 20);
      ctx.lineTo(cx + Math.cos(ang) * 160, cy + Math.sin(ang) * 160);
      ctx.stroke();
      ctx.setLineDash([]);

      // 炮口与「下一个」框：都显示即将发射的颜色
      const cur = colors[matchScene.current];
      ctx.fillStyle = cur.hex;
      ctx.fillRect(cx - 10, cy - 10, 20, 20);

      const nx = cx + 70;
      const ny = cy - 8;
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(nx - 8, ny - 28, 86, 52);
      ctx.fillStyle = "#ffe27a";
      ctx.font = "11px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("下一个", nx, ny - 12);
      ctx.fillStyle = cur.hex;
      ctx.fillRect(nx, ny, 22, 22);
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 2;
      ctx.strokeRect(nx, ny, 22, 22);
      ctx.fillStyle = "#fff";
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      ctx.fillText(cur.name, nx + 28, ny + 16);

      // 飞行中的方块
      if (matchScene.shot) {
        const s = matchScene.shot;
        ctx.fillStyle = colors[s.color].hex;
        ctx.fillRect(s.x - cameraX - s.r, s.y - s.r, s.r * 2, s.r * 2);
      }

      // 粒子
      for (const p of matchScene.particles) {
        ctx.globalAlpha = Math.max(0, p.life * 2);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - cameraX - p.s / 2, p.y - scrollY - p.s / 2, p.s, p.s);
      }
      ctx.globalAlpha = 1;

      // HUD
      ctx.fillStyle = "rgba(255,226,122,0.92)";
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`剩余 ${matchScene.remaining} / ${cols * rows}`, 24, 64);
      ctx.fillText(`已消 ${matchScene.cleared}`, 24, 82);

      if (matchScene.toast && matchScene.toastT > 0) {
        ctx.textAlign = "center";
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(0,0,0,0.75)";
        ctx.fillStyle = "#ffe27a";
        ctx.font = "14px 'Noto Sans SC', sans-serif";
        ctx.strokeText(matchScene.toast, W / 2, 118);
        ctx.fillText(matchScene.toast, W / 2, 118);
      }
    }

    S.initMatch23 = initMatch23;
    S.updateMatch23 = updateMatch23;
    S.drawMatchExtras = drawMatchExtras;
    S.syncMatch23OnLeave = syncMatch23OnLeave;
  }
};
