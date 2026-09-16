// 第 25 关：双人压力板 · 镜像 NPC · 10 秒桥冲终点
window.installTwin25 = function (S) {
  with (S) {
    function twinToast(msg, sec) {
      if (!twinScene) return;
      twinScene.toast = msg;
      twinScene.toastT = sec || 2.4;
    }

    function makeNpc() {
      return {
        x: 80,
        y: twinScene.groundBot - 40,
        w: 28,
        h: 40,
        vx: 0,
        vy: 0,
        onGround: false,
        facing: 1,
        alive: true,
        name: "镜像NPC",
      };
    }

    function onPlate(actor, plate) {
      if (!actor || !plate) return false;
      const feet = {
        x: actor.x + 4,
        y: actor.y + actor.h - 4,
        w: actor.w - 8,
        h: 8,
      };
      return rectsOverlap(feet, { x: plate.x, y: plate.y - 4, w: plate.w, h: plate.h + 8 });
    }

    function clearBridge() {
      if (!twinScene) return;
      for (let i = platforms.length - 1; i >= 0; i--) {
        if (platforms[i].twinBridge) platforms.splice(i, 1);
      }
      twinScene.bridgePlats = [];
      twinScene.bridgeOn = false;
      twinScene.bridgeT = 0;
    }

    function spawnBridge() {
      if (!twinScene || twinScene.bridgeOn || twinScene.done) return;
      clearBridge();
      const { gapL, gapR, groundTop, groundBot } = twinScene;
      const segs = 4;
      const total = gapR - gapL;
      const w = total / segs;
      for (let i = 0; i < segs; i++) {
        const top = {
          x: gapL + i * w,
          y: groundTop,
          w: w + 1,
          h: 18,
          lane: "bridge",
          theme: "twinBridge",
          twinBridge: true,
        };
        const bot = {
          x: gapL + i * w,
          y: groundBot,
          w: w + 1,
          h: 18,
          lane: "bridge",
          theme: "twinBridge",
          twinBridge: true,
        };
        platforms.push(top, bot);
        twinScene.bridgePlats.push(top, bot);
      }
      twinScene.bridgeOn = true;
      twinScene.bridgeT = twinScene.bridgeDur;
      shake = Math.max(shake, 6);
      spawnBurst((gapL + gapR) / 2, groundTop, "#ffe27a", 16);
      twinToast("桥出现了！只有 10 秒，一起冲！", 2.5);
      statusLabel.textContent = "桥已出现 · 快冲终点";
      if (window.GameAudio && GameAudio.playStar) GameAudio.playStar();
    }

    function drawActor(actor, colors) {
      if (!actor) return;
      const x = actor.x - cameraX;
      const y = actor.y;
      if (x < -60 || x > W + 60) return;
      const hop = actor.onGround ? 0 : -2;
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath();
      ctx.ellipse(x + 14, y + actor.h + 4, 14, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.shirt;
      ctx.fillRect(x + 6, y + 10 + hop, 16, 22);
      ctx.fillStyle = colors.skin;
      ctx.fillRect(x + 6, y + hop, 16, 14);
      ctx.fillStyle = "#1a0c08";
      ctx.fillRect(x + (actor.facing >= 0 ? 14 : 8), y + 5 + hop, 3, 3);
      ctx.fillStyle = colors.pants;
      ctx.fillRect(x + 7, y + 30 + hop, 5, 10);
      ctx.fillRect(x + 16, y + 30 + hop, 5, 10);
      if (colors.label) {
        ctx.save();
        ctx.font = "11px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(0,0,0,0.7)";
        ctx.fillStyle = colors.label;
        ctx.strokeText(colors.name || "", x + 14, y - 8 + hop);
        ctx.fillText(colors.name || "", x + 14, y - 8 + hop);
        ctx.restore();
      }
    }

    function initTwin25() {
      if (!twinScene) return;
      clearBridge();
      twinScene.npc = makeNpc();
      twinScene.bridgeOn = false;
      twinScene.bridgeT = 0;
      twinScene.onA = false;
      twinScene.onB = false;
      twinScene.toast = "";
      twinScene.toastT = 0;
      twinScene.done = false;
      twinScene.pulse = 0;
      if (player) {
        player.x = 80;
        player.y = twinScene.groundTop - 40;
        player.vx = 0;
        player.vy = 0;
        player.facing = 1;
      }
      if (window.GameAudio && GameAudio.unlock) GameAudio.unlock();
      statusLabel.textContent = "双人压力板 · NPC 会镜像你的左右";
      twinToast("你走上路，NPC 走下路 · 同时踩压力板出桥", 3.4);
    }

    function syncTwin25OnLeave() {
      clearBridge();
    }

    function updateTwin25(dt) {
      if (!twinScene || level !== 25 || state !== "playing") return;

      twinScene.pulse += dt;
      if (twinScene.toastT > 0) {
        twinScene.toastT -= dt;
        if (twinScene.toastT <= 0) twinScene.toast = "";
      }

      const left =
        keys.has("ArrowLeft") || keys.has("a") || keys.has("A") || touch.left;
      const right =
        keys.has("ArrowRight") || keys.has("d") || keys.has("D") || touch.right;
      const jump =
        keys.has(" ") ||
        keys.has("ArrowUp") ||
        keys.has("w") ||
        keys.has("W") ||
        touch.jump;
      const ax = (right ? 1 : 0) - (left ? 1 : 0);

      // NPC 镜像左右 + 跳跃（与玩家同一输入）
      const npc = twinScene.npc;
      if (npc && npc.alive !== false) {
        const wasGround = !!npc.onGround;
        moveActor(npc, ax, jump, null);
        // 玩家已起跳而 NPC 仍在地：补一次起跳，消除一帧落地差
        if (
          jump &&
          player &&
          !player.onGround &&
          player.vy < 0 &&
          wasGround &&
          npc.onGround
        ) {
          npc.vy = JUMP;
          npc.onGround = false;
        }
        if (npc.alive === false) {
          die("lava");
          return;
        }
      }

      twinScene.onA = !!(player && onPlate(player, twinScene.plateA));
      twinScene.onB = !!(npc && onPlate(npc, twinScene.plateB));

      if (!twinScene.done && !twinScene.bridgeOn && twinScene.onA && twinScene.onB) {
        spawnBridge();
      }

      if (twinScene.bridgeOn) {
        twinScene.bridgeT -= dt;
        if (twinScene.bridgeT <= 0) {
          clearBridge();
          twinToast("桥消失了！重新同时踩压力板", 2.2);
          statusLabel.textContent = "桥已消失 · 再踩一次压力板";
          if (window.GameAudio && GameAudio.playClick) GameAudio.playClick();
        }
      }

      // 终点：玩家踩到目标，且 NPC 也已过桥
      if (!twinScene.done && player && npc) {
        const g = twinScene.goal;
        if (rectsOverlap(player, g) && npc.x + npc.w / 2 >= twinScene.gapR + 20) {
          twinScene.done = true;
          statusLabel.textContent = "双人冲关成功！";
          twinToast("一起到终点了 · 通关！", 2);
          if (window.GameAudio && GameAudio.playStar) GameAudio.playStar();
          stars += 1;
          saveStars();
          if (starLabel) starLabel.textContent = String(stars);
          setTimeout(() => {
            if (state === "playing" && level === 25) winLevel();
          }, 700);
        } else if (rectsOverlap(player, g) && npc.x + npc.w / 2 < twinScene.gapR) {
          twinToast("等 NPC 一起过桥！", 1.2);
        }
      }
    }

    function drawTwinExtras() {
      if (!twinScene || level !== 25) return;
      const { plateA, plateB, goal, gapL, gapR } = twinScene;

      // 岩浆坑（缺口处）
      const lx = gapL - cameraX;
      const lw = gapR - gapL;
      const lavaTop = 200;
      const grad = ctx.createLinearGradient(0, lavaTop, 0, H);
      grad.addColorStop(0, "#ffb347");
      grad.addColorStop(0.35, "#ff5a1f");
      grad.addColorStop(1, "#8a1400");
      ctx.fillStyle = grad;
      ctx.fillRect(lx, lavaTop, lw, H - lavaTop);
      ctx.fillStyle = "rgba(255, 220, 80, 0.28)";
      ctx.beginPath();
      ctx.moveTo(lx, lavaTop);
      for (let x = 0; x <= lw; x += 12) {
        ctx.lineTo(lx + x, lavaTop + Math.sin((x + time * 80) * 0.08) * 5);
      }
      ctx.lineTo(lx + lw, H);
      ctx.lineTo(lx, H);
      ctx.closePath();
      ctx.fill();

      // 压力板
      function drawPlate(p, active, label) {
        const x = p.x - cameraX;
        ctx.fillStyle = active ? "#7dff9a" : "#c9a067";
        ctx.fillRect(x, p.y, p.w, p.h);
        ctx.fillStyle = active ? "#2a8a40" : "#6a4a20";
        ctx.fillRect(x + 2, p.y + 2, p.w - 4, 3);
        ctx.fillStyle = active ? "#b8ffc8" : "#ffe27a";
        ctx.font = "10px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(label, x + p.w / 2, p.y - 6);
      }
      drawPlate(plateA, twinScene.onA, "压力板·你");
      drawPlate(plateB, twinScene.onB, "压力板·NPC");

      // 终点门
      const gx = goal.x - cameraX;
      const gy = goal.y;
      const ready = twinScene.bridgeOn || (twinScene.npc && twinScene.npc.x >= twinScene.gapR);
      ctx.fillStyle = ready ? "rgba(120, 220, 255, 0.35)" : "rgba(80, 80, 100, 0.35)";
      ctx.fillRect(gx, gy, goal.w, goal.h);
      ctx.strokeStyle = ready ? "#7ef0ff" : "#889";
      ctx.lineWidth = 2;
      ctx.strokeRect(gx + 3, gy + 3, goal.w - 6, goal.h - 6);
      ctx.fillStyle = "#fff";
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("终点", gx + goal.w / 2, gy - 8);

      // NPC
      drawActor(twinScene.npc, {
        shirt: "#ff8a5c",
        pants: "#8a3a28",
        skin: "#ffe0b8",
        label: "#ffb090",
        name: "镜像NPC",
      });

      // HUD
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(16, 12, 260, 58);
      ctx.fillStyle = "#ffe27a";
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      const a = twinScene.onA ? "亮" : "暗";
      const b = twinScene.onB ? "亮" : "暗";
      ctx.fillText(`压力板 你:${a}  NPC:${b}`, 26, 32);
      if (twinScene.bridgeOn) {
        ctx.fillStyle = "#7dff9a";
        ctx.fillText(`桥剩余 ${Math.max(0, twinScene.bridgeT).toFixed(1)}s`, 26, 52);
      } else {
        ctx.fillStyle = "rgba(255,200,160,0.9)";
        ctx.fillText("同时踩两块压力板才能出桥", 26, 52);
      }

      if (twinScene.toast && twinScene.toastT > 0) {
        ctx.textAlign = "center";
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(0,0,0,0.75)";
        ctx.fillStyle = "#ffe27a";
        ctx.font = "14px 'Noto Sans SC', sans-serif";
        ctx.strokeText(twinScene.toast, W / 2, 96);
        ctx.fillText(twinScene.toast, W / 2, 96);
      }
    }

    S.initTwin25 = initTwin25;
    S.updateTwin25 = updateTwin25;
    S.drawTwinExtras = drawTwinExtras;
    S.syncTwin25OnLeave = syncTwin25OnLeave;
  }
};
