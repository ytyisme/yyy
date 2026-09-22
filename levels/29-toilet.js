// 第 29 关：请“排队”上厕所 · 13 把宝剑 · 扭头机制 · 分厕尿尿
window.installToilet29 = function (S) {
  with (S) {
    const toiletToast = GameLevelKit.makeToast(() => toiletScene, 2.5);

    function pointIn(px, py, r) {
      return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
    }

    function livingAhead() {
      return toiletScene.queue.filter((q) => q.alive);
    }

    function resetQueueAlert() {
      for (const q of toiletScene.queue) {
        if (!q.alive) continue;
        q.turned = false;
        q.facing = 1;
        q.alertT = 0;
      }
    }

    function startQueueAlert() {
      for (const q of toiletScene.queue) {
        if (!q.alive) continue;
        q.turned = false;
        q.facing = 1;
        q.alertT = 2.5;
      }
    }

    function buildInside() {
      const gy = toiletScene.groundY;
      const base = toiletScene.doorX + 160;
      toiletScene.fixtures = [];
      toiletScene.peopleInside = [];

      if (toiletScene.gender === "female") {
        // 只有蹲便
        for (let i = 0; i < 4; i++) {
          toiletScene.fixtures.push({
            kind: "squat",
            x: base + i * 90,
            y: gy - 50,
            w: 50,
            h: 50,
          });
        }
        for (let i = 0; i < 5; i++) {
          toiletScene.peopleInside.push({
            x: base + 20 + i * 70,
            y: gy - 40,
            w: 26,
            h: 40,
            female: true,
            shirt: "#ff9ad8",
          });
        }
      } else {
        // 蹲便 + 小便池
        for (let i = 0; i < 3; i++) {
          toiletScene.fixtures.push({
            kind: "squat",
            x: base + i * 90,
            y: gy - 50,
            w: 50,
            h: 50,
          });
        }
        for (let i = 0; i < 3; i++) {
          toiletScene.fixtures.push({
            kind: "urinal",
            x: base + 300 + i * 70,
            y: gy - 70,
            w: 36,
            h: 70,
          });
        }
        for (let i = 0; i < 5; i++) {
          toiletScene.peopleInside.push({
            x: base + 30 + i * 75,
            y: gy - 40,
            w: 26,
            h: 40,
            female: false,
            shirt: "#6ec8ff",
          });
        }
      }
    }

    function drawPerson(x, y, w, h, facing, opts) {
      const female = !!opts.female;
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h + 3, w * 0.4, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = opts.shirt || "#8ab4ff";
      if (female) {
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 12);
        ctx.lineTo(x + w - 4, y + 12);
        ctx.lineTo(x + w - 2, y + h - 10);
        ctx.lineTo(x + 2, y + h - 10);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(x + 4, y + 12, w - 8, h - 22);
      }
      ctx.fillStyle = "#f0c8a0";
      ctx.fillRect(x + 5, y, w - 10, 14);
      // 头发
      ctx.fillStyle = female ? "#4a3020" : "#2a2018";
      ctx.fillRect(x + 4, y - 2, w - 8, 8);
      if (female) ctx.fillRect(x + 2, y + 4, 4, 12);
      ctx.fillStyle = "#1a1010";
      const eyeX = facing >= 0 ? x + w - 12 : x + 6;
      ctx.fillRect(eyeX, y + 5, 3, 3);
      ctx.fillStyle = female ? "#c06090" : "#3a4058";
      ctx.fillRect(x + 6, y + h - 12, 5, 12);
      ctx.fillRect(x + w - 11, y + h - 12, 5, 12);
    }

    function initToilet29() {
      if (!toiletScene) return;
      toiletScene.phase = "queue";
      toiletScene.gender = null;
      toiletScene.swordWasOn = false;
      toiletScene.peeT = 0;
      toiletScene.peeTarget = null;
      toiletScene.fixtures = [];
      toiletScene.peopleInside = [];
      toiletScene.toast = "";
      toiletScene.toastT = 0;
      toiletScene.done = false;
      for (let i = 0; i < toiletScene.queue.length; i++) {
        const q = toiletScene.queue[i];
        q.alive = true;
        q.turned = false;
        q.facing = 1;
        q.alertT = 0;
        q.x = 200 + i * 58;
        q.y = toiletScene.groundY - q.h;
      }
      if (player) {
        player.x = 80;
        player.y = toiletScene.groundY - 40;
        player.vx = 0;
        player.vy = 0;
        player.facing = 1;
      }
      // 本关免费 13 把宝剑（次数）
      levelUses.sword = 13;
      toolMode = null;
      syncItemBar();
      if (window.GameAudio && GameAudio.unlock) GameAudio.unlock();
      statusLabel.textContent = "尿急！排队 · 宝剑×13";
      toiletToast("掏出宝剑后 2.5 秒他们会扭头——扭头后砍不到！快杀！", 3.8);
    }

    function syncToilet29OnLeave() {
      if (toiletScene) {
        toiletScene.phase = "queue";
        toiletScene.peeTarget = null;
      }
    }

    function tryKillQueue(world) {
      if (!toiletScene || toiletScene.phase !== "queue") return false;
      if (toolMode !== "sword" || levelUses.sword <= 0) return false;
      for (let i = toiletScene.queue.length - 1; i >= 0; i--) {
        const q = toiletScene.queue[i];
        if (!q.alive) continue;
        if (!pointIn(world.x, world.y, q)) continue;
        if (q.turned) {
          toiletToast("他扭头看见了！砍不到！", 1.4);
          if (window.GameAudio && GameAudio.playClick) GameAudio.playClick();
          return true;
        }
        q.alive = false;
        levelUses.sword -= 1;
        toolMode = levelUses.sword > 0 ? "sword" : null;
        spawnBurst(q.x + q.w / 2, q.y + q.h / 2, "#ff5533", 16);
        shake = Math.max(shake, 8);
        statusLabel.textContent = `解决一个！宝剑剩余 ${levelUses.sword} · 还剩 ${livingAhead().length} 人`;
        if (window.GameAudio && GameAudio.playClick) GameAudio.playClick();
        syncItemBar();
        if (livingAhead().length === 0) {
          toiletToast("队伍清空！走进厕所门口！", 2.4);
        }
        return true;
      }
      return false;
    }

    function tryClickToilet29(clientX, clientY) {
      if (!toiletScene || level !== 29 || state !== "playing") return false;
      const world = clientToWorld(clientX, clientY);

      if (toiletScene.phase === "queue") {
        if (tryKillQueue(world)) return true;
        // 点门口且队列清空 → 进入选择
        if (
          livingAhead().length === 0 &&
          pointIn(world.x, world.y, toiletScene.door) &&
          player &&
          Math.abs(player.x - toiletScene.doorX) < 140
        ) {
          toiletScene.phase = "choose";
          toiletToast("选男厕还是女厕？", 2.5);
          statusLabel.textContent = "选择厕所";
          return true;
        }
        return false;
      }

      if (toiletScene.phase === "choose") {
        const btns = toiletScene.chooseBtns;
        // 按钮用屏幕坐标点击：client → canvas
        const rect = canvas.getBoundingClientRect();
        const sx = ((clientX - rect.left) / rect.width) * W;
        const sy = ((clientY - rect.top) / rect.height) * H;
        if (pointIn(sx, sy, btns.male)) {
          toiletScene.gender = "male";
          toiletScene.phase = "inside";
          buildInside();
          if (player) player.x = toiletScene.doorX + 130;
          toiletToast("你变成了男生 · 点蹲便或小便池尿尿", 2.8);
          statusLabel.textContent = "男厕 · 点击便器";
          return true;
        }
        if (pointIn(sx, sy, btns.female)) {
          toiletScene.gender = "female";
          toiletScene.phase = "inside";
          buildInside();
          if (player) player.x = toiletScene.doorX + 130;
          toiletToast("你变成了女生 · 点蹲便尿尿", 2.8);
          statusLabel.textContent = "女厕 · 点击蹲便";
          return true;
        }
        return false;
      }

      if (toiletScene.phase === "inside") {
        for (const f of toiletScene.fixtures) {
          if (!pointIn(world.x, world.y, f)) continue;
          toiletScene.phase = "peeing";
          toiletScene.peeT = 0;
          toiletScene.peeTarget = f;
          if (player) {
            player.x = f.x + f.w / 2 - player.w / 2;
            player.vx = 0;
          }
          toiletToast("嘘……坚持 10 秒", 2);
          statusLabel.textContent = "尿尿中…";
          return true;
        }
      }
      return false;
    }

    function updateToilet29(dt) {
      if (!toiletScene || level !== 29 || state !== "playing") return;

      GameLevelKit.tickToast(toiletScene, dt);

      // 宝剑掏出/收起 → 警戒
      const swordOn = toolMode === "sword";
      if (toiletScene.phase === "queue") {
        if (swordOn && !toiletScene.swordWasOn) {
          startQueueAlert();
          toiletToast("他们察觉了！2.5 秒后扭头！", 2);
        }
        if (!swordOn && toiletScene.swordWasOn) {
          resetQueueAlert();
        }
        toiletScene.swordWasOn = swordOn;

        for (const q of toiletScene.queue) {
          if (!q.alive) continue;
          if (q.alertT > 0) {
            q.alertT -= dt;
            if (q.alertT <= 0) {
              q.turned = true;
              q.facing = -1; // 扭头看向玩家
            }
          }
        }

        // 挡住去路
        if (player) {
          for (const q of toiletScene.queue) {
            if (!q.alive) continue;
            if (rectsOverlap(player, q) && player.x + player.w > q.x) {
              player.x = q.x - player.w - 1;
              player.vx = Math.min(0, player.vx);
            }
          }
          // 未清完不能进门太深
          if (livingAhead().length > 0 && player.x > toiletScene.doorX - 30) {
            player.x = toiletScene.doorX - 30;
            player.vx = Math.min(0, player.vx);
          }
        }

        // 走近空门口也可进选择（碰撞）
        if (
          livingAhead().length === 0 &&
          player &&
          rectsOverlap(player, toiletScene.door)
        ) {
          toiletScene.phase = "choose";
          toiletToast("选男厕还是女厕？", 2.5);
        }
      }

      if (toiletScene.phase === "peeing") {
        if (player) {
          player.vx = 0;
          player.vy = 0;
        }
        toiletScene.peeT += dt;
        statusLabel.textContent = `尿尿中 ${toiletScene.peeT.toFixed(1)} / 10 秒`;
        if (toiletScene.peeT >= toiletScene.peeDur) {
          toiletScene.phase = "done";
          toiletScene.done = true;
          statusLabel.textContent = "尿完了！通关！";
          toiletToast("终于舒服了 · 通关！", 2);
          if (window.GameAudio && GameAudio.playStar) GameAudio.playStar();
          stars += 1;
          saveStars();
          if (starLabel) starLabel.textContent = String(stars);
          setTimeout(() => {
            if (state === "playing" && level === 29) winLevel();
          }, 800);
        }
      }

      // 选择界面按钮屏幕位置
      if (toiletScene.phase === "choose") {
        toiletScene.chooseBtns.male.x = W / 2 - 160;
        toiletScene.chooseBtns.male.y = H / 2 - 20;
        toiletScene.chooseBtns.female.x = W / 2 + 20;
        toiletScene.chooseBtns.female.y = H / 2 - 20;
      }
    }

    function drawToiletExtras() {
      if (!toiletScene || level !== 29) return;
      const gy = toiletScene.groundY;

      // 厕所外观
      const dx = toiletScene.door.x - cameraX;
      ctx.fillStyle = "#5a6878";
      ctx.fillRect(dx, toiletScene.door.y, toiletScene.door.w, toiletScene.door.h);
      ctx.fillStyle = livingAhead().length === 0 ? "#7dff9a" : "#8899aa";
      ctx.fillRect(dx + 12, toiletScene.door.y + 16, toiletScene.door.w - 24, toiletScene.door.h - 28);
      ctx.fillStyle = "#ffe27a";
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("厕所", dx + toiletScene.door.w / 2, toiletScene.door.y - 8);

      // 排队的人
      for (const q of toiletScene.queue) {
        if (!q.alive) continue;
        const x = q.x - cameraX;
        drawPerson(x, q.y, q.w, q.h, q.facing, { shirt: q.shirt, female: false });
        if (q.turned) {
          ctx.fillStyle = "#ff5533";
          ctx.font = "10px 'Noto Sans SC', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("！", x + q.w / 2, q.y - 6);
        } else if (q.alertT > 0) {
          ctx.fillStyle = "#ffe27a";
          ctx.font = "10px 'Noto Sans SC', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(q.alertT.toFixed(1), x + q.w / 2, q.y - 6);
        }
      }

      // 室内
      if (toiletScene.phase === "inside" || toiletScene.phase === "peeing" || toiletScene.phase === "done") {
        for (const p of toiletScene.peopleInside) {
          const x = p.x - cameraX;
          drawPerson(x, p.y, p.w, p.h, 1, { shirt: p.shirt, female: p.female });
        }
        for (const f of toiletScene.fixtures) {
          const x = f.x - cameraX;
          if (f.kind === "squat") {
            ctx.fillStyle = "#d8dde8";
            ctx.fillRect(x, f.y, f.w, f.h);
            ctx.fillStyle = "#4a5568";
            ctx.fillRect(x + 10, f.y + 16, f.w - 20, f.h - 22);
            ctx.fillStyle = "#ffe27a";
            ctx.font = "10px 'Noto Sans SC', sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("蹲便", x + f.w / 2, f.y - 4);
          } else {
            ctx.fillStyle = "#c0c8d4";
            ctx.fillRect(x, f.y, f.w, f.h);
            ctx.fillStyle = "#5a6878";
            ctx.fillRect(x + 8, f.y + 10, f.w - 16, 28);
            ctx.fillStyle = "#ffe27a";
            ctx.font = "10px 'Noto Sans SC', sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("小便池", x + f.w / 2, f.y - 4);
          }
        }
      }

      // 玩家造型（分性别）
      if (player && toiletScene.gender) {
        const x = player.x - cameraX;
        drawPerson(x, player.y, player.w, player.h, player.facing || 1, {
          female: toiletScene.gender === "female",
          shirt: toiletScene.gender === "female" ? "#ff9ad8" : "#6ec8ff",
        });
      }

      // 男生尿尿特效：裆上肉色小圆圈喷尿
      if (
        toiletScene.phase === "peeing" &&
        toiletScene.gender === "male" &&
        player
      ) {
        const cx = player.x - cameraX + player.w / 2;
        const cy = player.y + player.h * 0.72;
        ctx.fillStyle = "#e8b898";
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(200,160,120,0.8)";
        ctx.lineWidth = 1;
        ctx.stroke();
        // 尿液喷泉
        ctx.strokeStyle = "rgba(240, 220, 100, 0.75)";
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
          const t = time * 10 + i;
          const ox = Math.sin(t + i) * 3;
          ctx.beginPath();
          ctx.moveTo(cx + ox, cy + 4);
          ctx.quadraticCurveTo(cx + ox * 2, cy + 18 + i * 3, cx + ox * 0.5, cy + 34 + (i % 3) * 4);
          ctx.stroke();
        }
        // 地面小水洼
        ctx.fillStyle = "rgba(220, 200, 80, 0.35)";
        ctx.beginPath();
        ctx.ellipse(cx, gy - 2, 14 + Math.sin(time * 3) * 2, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 女生尿尿：蹲姿提示 + 简单水花（不画圆圈）
      if (
        toiletScene.phase === "peeing" &&
        toiletScene.gender === "female" &&
        player &&
        toiletScene.peeTarget
      ) {
        const fx = toiletScene.peeTarget.x - cameraX + toiletScene.peeTarget.w / 2;
        ctx.fillStyle = "rgba(220, 200, 80, 0.4)";
        ctx.beginPath();
        ctx.ellipse(fx, gy - 4, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 选择 UI
      if (toiletScene.phase === "choose") {
        ctx.fillStyle = "rgba(8,4,2,0.72)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#ffe27a";
        ctx.font = "18px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("请选择厕所", W / 2, H / 2 - 50);
        const m = toiletScene.chooseBtns.male;
        const f = toiletScene.chooseBtns.female;
        ctx.fillStyle = "#3a6aaa";
        ctx.fillRect(m.x, m.y, m.w, m.h);
        ctx.fillStyle = "#aa3a6a";
        ctx.fillRect(f.x, f.y, f.w, f.h);
        ctx.fillStyle = "#fff";
        ctx.font = "16px 'Noto Sans SC', sans-serif";
        ctx.fillText("男厕", m.x + m.w / 2, m.y + 30);
        ctx.fillText("女厕", f.x + f.w / 2, f.y + 30);
      }

      // 尿尿进度条
      if (toiletScene.phase === "peeing") {
        const p = clamp(toiletScene.peeT / toiletScene.peeDur, 0, 1);
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(W / 2 - 110, 70, 220, 18);
        ctx.fillStyle = "#ffe27a";
        ctx.fillRect(W / 2 - 110, 70, 220 * p, 18);
        ctx.fillStyle = "#fff";
        ctx.font = "12px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`尿尿 ${(p * 100) | 0}%`, W / 2, 84);
      }

      // HUD
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(16, 12, 270, 54);
      ctx.fillStyle = "#ffe27a";
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      if (toiletScene.phase === "queue") {
        ctx.fillText(`排队剩余 ${livingAhead().length} / 13 · 宝剑 ${levelUses.sword}`, 26, 34);
        ctx.fillStyle = "#ffb0b0";
        ctx.fillText("掏剑后 2.5 秒扭头，扭头后砍不到", 26, 52);
      } else if (toiletScene.phase === "choose") {
        ctx.fillText("选择男厕 / 女厕", 26, 40);
      } else {
        ctx.fillText(
          toiletScene.gender === "female" ? "女厕 · 点击蹲便" : "男厕 · 点击蹲便/小便池",
          26,
          40
        );
      }

      if (toiletScene.toast && toiletScene.toastT > 0) {
        ctx.textAlign = "center";
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(0,0,0,0.75)";
        ctx.fillStyle = "#ffe27a";
        ctx.font = "14px 'Noto Sans SC', sans-serif";
        ctx.strokeText(toiletScene.toast, W / 2, 120);
        ctx.fillText(toiletScene.toast, W / 2, 120);
      }
    }

    S.initToilet29 = initToilet29;
    S.updateToilet29 = updateToilet29;
    S.drawToiletExtras = drawToiletExtras;
    S.syncToilet29OnLeave = syncToilet29OnLeave;
    S.tryClickToilet29 = tryClickToilet29;
  }
};
