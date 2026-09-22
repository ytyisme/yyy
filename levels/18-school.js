// 第 18 关：抢饭 · 教室 → 走廊 → 楼梯 → 马路 → 其他班级 → 直行500米 → 食堂
window.installSchool18 = function (S) {
  with (S) {
    const schoolToast = GameLevelKit.makeToast(() => schoolScene, 2.2);

    function openClassroomDoor() {
      if (!schoolScene || schoolScene.doorOpen) return;
      schoolScene.doorOpen = true;
      const door = schoolScene.door;
      if (door && platforms) {
        const i = platforms.indexOf(door);
        if (i >= 0) platforms.splice(i, 1);
      }
      schoolToast("下课铃响了！冲出教室！", 2.5);
    }

    function playBell() {
      if (window.GameAudio && GameAudio.playSchoolBell) GameAudio.playSchoolBell();
      else if (window.GameAudio && GameAudio.playTrainArriveChime) GameAudio.playTrainArriveChime();
    }

    function zoneAt(x) {
      const sc = schoolScene;
      if (x < 780) return "教室";
      if (x < 1680) return "走廊";
      if (x < (sc.groundStart || 2200)) return "楼梯口";
      if (x < (sc.gateRight || 2520) + 40) return "校门口";
      if (x < (sc.roadEnd || 3600)) return "马路";
      if (x < (sc.otherClassEnd || 5000)) return "其他班级门口";
      if (x < (sc.straightEnd || 17000)) {
        const ppm = sc.pxPerM || 25;
        const gone = Math.max(0, x - (sc.straightStart || 5000));
        const left = Math.max(0, Math.ceil((sc.straightMeters || 500) - gone / ppm));
        return `直行还剩 ${left} 米`;
      }
      return "食堂";
    }

    function spawnCar() {
      if (!schoolScene) return;
      const fromLeft = Math.random() > 0.5;
      const speed = 280 + Math.random() * 220;
      const rs = schoolScene.roadStart || 2580;
      const re = schoolScene.roadEnd || 3600;
      schoolScene.cars.push({
        x: fromLeft ? rs + 20 : re - 20,
        y: schoolScene.groundY - 36,
        w: 90 + Math.random() * 30,
        h: 34,
        vx: fromLeft ? speed : -speed,
        color: ["#e74c3c", "#3498db", "#f1c40f", "#2ecc71", "#9b59b6", "#ecf0f1"][
          (Math.random() * 6) | 0
        ],
      });
    }

    function hitByCar() {
      if (!schoolScene || schoolScene.done || !player) return;
      schoolScene.done = true;
      schoolToast("你撞大运了，哥们！", 3);
      statusLabel.textContent = "你撞大运了，哥们！";
      if (window.GameAudio) GameAudio.playDeath();
      setTimeout(() => {
        if (state === "playing") die("car");
      }, 550);
    }

    function takeMeal(who, idx) {
      if (!schoolScene || schoolScene.done) return false;
      const meal = schoolScene.meals[idx];
      if (!meal || meal.taken) return false;
      meal.taken = true;
      meal.by = who;
      return true;
    }

    function playerGrabMeal() {
      if (!schoolScene || schoolScene.done || !player) return;
      if (schoolScene.gotMeal) return;
      for (let i = 0; i < schoolScene.meals.length; i++) {
        const m = schoolScene.meals[i];
        if (m.taken) continue;
        const box = { x: m.x - 20, y: m.y - 50, w: 50, h: 50 };
        if (!rectsOverlap(player, box)) continue;
        if (!takeMeal("player", i)) continue;
        schoolScene.gotMeal = true;
        schoolScene.done = true;
        schoolScene.phase = "done";
        schoolToast("抢到饭了！通关！", 2);
        statusLabel.textContent = "抢到饭了！";
        spawnBurst(m.x, m.y - 30, "#ffe566", 22);
        if (window.GameAudio) GameAudio.playStar();
        setTimeout(() => winLevel(), 700);
        return;
      }
    }

    function mealsLeft() {
      return (schoolScene.meals || []).filter((m) => !m.taken).length;
    }

    function assignMealTarget(npc) {
      const free = [];
      for (let i = 0; i < schoolScene.meals.length; i++) {
        if (!schoolScene.meals[i].taken) free.push(i);
      }
      if (!free.length) {
        npc.targetMeal = -1;
        return;
      }
      npc.targetMeal = free[(Math.random() * free.length) | 0];
    }

    function updateTeacher(dt) {
      const t = schoolScene.teacher;
      t.bob += dt * 4;
      if (t.state === "teach") {
        t.chalk = (t.chalk || 0) + dt;
        t.vx = 0;
        t.facing = 1;
        // 讲课时在黑板前小幅踱步
        t.x = 90 + Math.sin(t.bob * 0.6) * 18;
      } else if (t.state === "toOffice") {
        const dest = schoolScene.officeX;
        const dx = dest - t.x;
        t.facing = dx >= 0 ? 1 : -1;
        t.vx = t.facing * 95;
        t.x += t.vx * dt;
        if (Math.abs(dx) < 8) {
          t.x = dest;
          t.vx = 0;
          t.state = "office";
          schoolToast("老师回办公室了", 1.8);
        }
      }
      t.y = schoolScene.floor2Y - t.h;
    }

    function updateClassmates(dt) {
      for (const n of schoolScene.classmates || []) {
        n.bob += dt * 5;
        if (schoolScene.phase === "class") {
          n.seated = true;
          n.vx = 0;
          n.y = schoolScene.floor2Y - n.h;
          continue;
        }
        n.seated = false;
        if (n.hasMeal) {
          n.vx = 0;
          continue;
        }
        if (n.targetMeal < 0 || (schoolScene.meals[n.targetMeal] && schoolScene.meals[n.targetMeal].taken)) {
          assignMealTarget(n);
        }
        if (n.targetMeal < 0) {
          n.vx = 0;
          continue;
        }
        const meal = schoolScene.meals[n.targetMeal];
        const destX = meal.x;
        // 简化路径：一直向右跑，靠平台物理下落下楼
        const dx = destX - n.x;
        n.facing = dx >= 0 ? 1 : -1;
        n.vx = n.facing * (175 + (n.id.charCodeAt(1) % 45));
        n.x += n.vx * dt;

        // 简易重力贴地
        let floor = schoolScene.floor2Y;
        if (n.x >= (schoolScene.groundStart || 2200)) floor = schoolScene.groundY;
        else if (n.x > 1680) {
          const span = (schoolScene.groundStart || 2220) - 1680;
          const t = Math.max(0, Math.min(1, (n.x - 1680) / span));
          floor = schoolScene.floor2Y + (schoolScene.groundY - schoolScene.floor2Y) * t;
        }
        n.y = floor - n.h;

        if (Math.abs(n.x - destX) < 28 && n.y + n.h >= schoolScene.groundY - 8) {
          if (takeMeal(n.id, n.targetMeal)) {
            n.hasMeal = true;
            n.vx = 0;
            schoolToast(`同学抢走了一份饭！还剩 ${mealsLeft()} 份`, 2);
            if (mealsLeft() <= 0 && !schoolScene.gotMeal) {
              schoolScene.done = true;
              schoolScene.phase = "done";
              statusLabel.textContent = "饭被抢光了…";
              schoolToast("三份饭都被抢光了！", 2.5);
              setTimeout(() => {
                if (state === "playing") die("hungry");
              }, 900);
            }
          } else {
            assignMealTarget(n);
          }
        }
      }
    }

    function updateCars(dt) {
      schoolScene.carSpawnT -= dt;
      if (schoolScene.carSpawnT <= 0) {
        spawnCar();
        schoolScene.carSpawnT = 1.1 + Math.random() * 1.4;
      }
      for (let i = schoolScene.cars.length - 1; i >= 0; i--) {
        const c = schoolScene.cars[i];
        c.x += c.vx * dt;
        if (c.x < (schoolScene.roadStart || 2580) - 40 || c.x > (schoolScene.roadEnd || 3600) + 40) {
          schoolScene.cars.splice(i, 1);
          continue;
        }
        if (player && !schoolScene.done && schoolScene.phase === "rush") {
          // 只有身子撞上车才算；跳起后脚底高于车顶则可越过
          const carTop = c.y + 6;
          const playerFeet = player.y + player.h;
          const jumpedOver = playerFeet <= carTop + 2 || (!player.onGround && player.y + player.h * 0.45 <= carTop);
          if (jumpedOver) continue;
          const box = { x: c.x + 6, y: c.y + 4, w: c.w - 12, h: c.h - 6 };
          const pb = { x: player.x + 4, y: player.y + 10, w: player.w - 8, h: player.h - 12 };
          if (rectsOverlap(pb, box)) hitByCar();
        }
      }
    }

    function initSchool18() {
      if (!schoolScene) return;
      schoolScene.phase = "class";
      schoolScene.classT = 30;
      schoolScene.bellPlayed = false;
      schoolScene.doorOpen = false;
      schoolScene.done = false;
      schoolScene.gotMeal = false;
      schoolScene.cars = [];
      schoolScene.carSpawnT = 0.8;
      schoolScene.toast = "";
      schoolScene.toastT = 0;
      schoolScene.teacher.state = "teach";
      schoolScene.teacher.x = 90;
      schoolScene.teacher.facing = 1;
      for (const m of schoolScene.meals) {
        m.taken = false;
        m.by = null;
      }
      const deskXs = [180, 260, 340, 420, 500, 580, 200, 280, 360, 440, 520, 600];
      (schoolScene.classmates || []).forEach((n, i) => {
        n.x = deskXs[i] != null ? deskXs[i] : 200 + i * 40;
        n.y = schoolScene.floor2Y - n.h;
        n.vx = 0;
        n.seated = true;
        n.hasMeal = false;
        n.targetMeal = -1;
        n.facing = -1;
      });
      // 确保门挡在 platforms 里
      if (schoolScene.door && platforms && platforms.indexOf(schoolScene.door) < 0) {
        platforms.push(schoolScene.door);
      }
      statusLabel.textContent = "上课中 · 距离下课 30 秒";
      schoolToast("老师正在讲课… 下课铃还有 30 秒", 3);
    }

    function syncSchool18OnLeave() {
      // no-op pad
    }

    function updateSchool18(dt) {
      if (!schoolScene || level !== 18 || state !== "playing") return;
      GameLevelKit.tickToast(schoolScene, dt);

      if (schoolScene.phase === "class") {
        schoolScene.classT -= dt;
        const left = Math.max(0, Math.ceil(schoolScene.classT));
        statusLabel.textContent = `上课中 · 距离下课 ${left} 秒`;
        if (schoolScene.classT <= 0) {
          schoolScene.classT = 0;
          schoolScene.phase = "rush";
          if (!schoolScene.bellPlayed) {
            schoolScene.bellPlayed = true;
            playBell();
          }
          openClassroomDoor();
          schoolScene.teacher.state = "toOffice";
          for (const n of schoolScene.classmates || []) {
            n.seated = false;
            assignMealTarget(n);
          }
          statusLabel.textContent = "下课了！去抢饭！";
        }
      } else if (schoolScene.phase === "rush" && !schoolScene.done) {
        statusLabel.textContent = `抢饭 · 还剩 ${mealsLeft()} 份 · ${schoolScene.zoneHint || ""}`;
        if (player) schoolScene.zoneHint = zoneAt(player.x);
        playerGrabMeal();
        updateCars(dt);
      }

      updateTeacher(dt);
      updateClassmates(dt);

      // 上课时若玩家强行靠近门，提示
      if (
        schoolScene.phase === "class" &&
        player &&
        player.x > 700 &&
        schoolScene.toastT <= 0
      ) {
        schoolToast("还没下课，门是锁着的…", 1.5);
      }
    }

    function drawPerson(x, y, w, h, shirt, facing, bob) {
      const sx = x - cameraX;
      const sy = y;
      ctx.fillStyle = "#f5d0b0";
      ctx.fillRect(sx + 6, sy, 14, 12);
      ctx.fillStyle = shirt;
      ctx.fillRect(sx + 3, sy + 12, w - 6, 18);
      ctx.fillStyle = "#3a3a4a";
      ctx.fillRect(sx + 4, sy + 30, 8, 10);
      ctx.fillRect(sx + w - 12, sy + 30, 8, 10);
      // 面向
      ctx.fillStyle = "#222";
      const eye = facing >= 0 ? sx + 14 : sx + 8;
      ctx.fillRect(eye, sy + 4, 3, 3);
      if (bob != null) {
        ctx.globalAlpha = 0.15;
        ctx.fillRect(sx, sy + h - 2 + Math.sin(bob) * 1.5, w, 2);
        ctx.globalAlpha = 1;
      }
    }

    function drawSchoolExtras() {
      if (!schoolScene || level !== 18) return;
      const f2 = schoolScene.floor2Y;
      const gy = schoolScene.groundY;

      // 教室黑板
      const bx = 40 - cameraX;
      if (bx > -120 && bx < W + 40) {
        ctx.fillStyle = "#1a4a2a";
        ctx.fillRect(bx, f2 - 170, 110, 70);
        ctx.strokeStyle = "#c9a06a";
        ctx.lineWidth = 4;
        ctx.strokeRect(bx, f2 - 170, 110, 70);
        ctx.fillStyle = "#d5e8d5";
        ctx.font = "11px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("今天的作业…", bx + 10, f2 - 140);
        ctx.fillText("下课别跑！", bx + 10, f2 - 122);
      }

      // 课桌
      for (let i = 0; i < 6; i++) {
        const dx = 160 + i * 90 - cameraX;
        if (dx < -60 || dx > W + 40) continue;
        ctx.fillStyle = "#8b5a2b";
        ctx.fillRect(dx, f2 - 28, 56, 10);
        ctx.fillStyle = "#6a3f1a";
        ctx.fillRect(dx + 4, f2 - 18, 6, 18);
        ctx.fillRect(dx + 46, f2 - 18, 6, 18);
      }

      // 走廊标牌 / 办公室
      const ox = 980 - cameraX;
      if (ox > -200 && ox < W + 40) {
        ctx.fillStyle = "#3a4555";
        ctx.fillRect(ox, f2 - 150, 160, 150);
        ctx.fillStyle = "#dce6f0";
        ctx.font = "bold 13px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("教师办公室", ox + 80, f2 - 120);
        ctx.fillStyle = "#2a3340";
        ctx.fillRect(ox + 55, f2 - 90, 50, 90);
      }

      // 楼梯提示
      const stx = 1750 - cameraX;
      if (stx > -80 && stx < W) {
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(stx, f2 - 40, 100, 24);
        ctx.fillStyle = "#ffe566";
        ctx.font = "bold 12px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("楼梯口 ↓", stx + 50, f2 - 24);
      }

      // 校门（纯装饰，中间可通行）
      const gl = (schoolScene.gateLeft != null ? schoolScene.gateLeft : 2380) - cameraX;
      const gr = (schoolScene.gateRight != null ? schoolScene.gateRight : 2520) - cameraX;
      if (gr > -40 && gl < W + 40) {
        const pillarW = 22;
        const pillarH = 150;
        ctx.fillStyle = "#5a5048";
        ctx.fillRect(gl, gy - pillarH, pillarW, pillarH);
        ctx.fillRect(gr, gy - pillarH, pillarW, pillarH);
        // 门楣
        ctx.fillStyle = "#3a3428";
        ctx.fillRect(gl, gy - pillarH - 18, gr - gl + pillarW, 18);
        ctx.fillStyle = "#ffd24a";
        ctx.font = "bold 13px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("学校大门 · 可通行", (gl + gr + pillarW) / 2, gy - pillarH - 4);
      }

      // 马路
      const roadL = (schoolScene.roadStart || 2580) - cameraX;
      const roadR = (schoolScene.roadEnd || 3600) - cameraX;
      if (roadR > 0 && roadL < W) {
        ctx.fillStyle = "#3a3a42";
        ctx.fillRect(Math.max(0, roadL), gy - 6, Math.min(W, roadR) - Math.max(0, roadL), 10);
        ctx.strokeStyle = "#ffd24a";
        ctx.setLineDash([18, 16]);
        ctx.beginPath();
        ctx.moveTo(Math.max(0, roadL), gy - 1);
        ctx.lineTo(Math.min(W, roadR), gy - 1);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#ff6b6b";
        ctx.font = "bold 11px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("注意车辆 · 可跳跃越过", (Math.max(0, roadL) + Math.min(W, roadR)) / 2, gy - 16);
      }

      // 其他班级门口
      for (const oc of schoolScene.otherClasses || []) {
        const ox = oc.x - cameraX;
        if (ox < -160 || ox > W + 40) continue;
        ctx.fillStyle = "#c8b8a0";
        ctx.fillRect(ox, gy - 150, 140, 150);
        ctx.fillStyle = "#6b3f1f";
        ctx.fillRect(ox + 45, gy - 95, 50, 95);
        ctx.fillStyle = "#c9a06a";
        ctx.fillRect(ox + 82, gy - 55, 5, 8);
        ctx.fillStyle = "#2a3340";
        ctx.fillRect(ox + 10, gy - 140, 120, 28);
        ctx.fillStyle = "#ffe566";
        ctx.font = "bold 12px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(oc.label, ox + 70, gy - 121);
      }
      const ocStart = (schoolScene.otherClassStart || 0) - cameraX;
      const ocEnd = (schoolScene.otherClassEnd || 0) - cameraX;
      if (ocEnd > 0 && ocStart < W && schoolScene.otherClasses && schoolScene.otherClasses.length) {
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(Math.max(0, ocStart + 20), gy - 178, 160, 22);
        ctx.fillStyle = "#cde";
        ctx.font = "11px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("经过其他班级门口 →", Math.max(12, ocStart + 28), gy - 163);
      }

      // 直行 500 米（路牌与米数标记）
      const ss = schoolScene.straightStart || 0;
      const se = schoolScene.straightEnd || 0;
      const ppm = schoolScene.pxPerM || 25;
      const totalM = schoolScene.straightMeters || 500;
      const pathL = ss - cameraX;
      const pathR = se - cameraX;
      if (pathR > 0 && pathL < W) {
        ctx.fillStyle = "#5a6a48";
        ctx.fillRect(Math.max(0, pathL), gy - 4, Math.min(W, pathR) - Math.max(0, pathL), 6);
        // 起点牌
        if (pathL > -80 && pathL < W) {
          ctx.fillStyle = "#1a3a1a";
          ctx.fillRect(pathL, gy - 90, 120, 36);
          ctx.fillStyle = "#7dffa0";
          ctx.font = "bold 12px 'Noto Sans SC', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(`直行 ${totalM} 米`, pathL + 60, gy - 68);
        }
        // 每 100 米一块路牌
        for (let km = 100; km < totalM; km += 100) {
          const mx = ss + km * ppm - cameraX;
          if (mx < -40 || mx > W + 40) continue;
          ctx.fillStyle = "#2a2a30";
          ctx.fillRect(mx - 2, gy - 48, 4, 44);
          ctx.fillStyle = "#ffd24a";
          ctx.font = "bold 11px 'Noto Sans SC', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(`${km}m`, mx, gy - 54);
        }
        // 终点提示
        if (pathR > -40 && pathR < W + 80) {
          ctx.fillStyle = "#5a2010";
          ctx.fillRect(pathR - 40, gy - 90, 130, 36);
          ctx.fillStyle = "#ffb070";
          ctx.font = "bold 12px 'Noto Sans SC', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("前方食堂 →", pathR + 25, gy - 68);
        }
      }

      // 食堂
      const cafX = schoolScene.cafeteriaX != null ? schoolScene.cafeteriaX : 4000;
      const cx = cafX - cameraX;
      if (cx > -280 && cx < W) {
        ctx.fillStyle = "#5a3a28";
        ctx.fillRect(cx, gy - 160, 320, 160);
        ctx.fillStyle = "#c0392b";
        ctx.fillRect(cx, gy - 180, 320, 28);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 16px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("学生食堂", cx + 160, gy - 160);
        ctx.font = "12px 'Noto Sans SC', sans-serif";
        ctx.fillText("今日窗口仅剩三份饭", cx + 160, gy - 140);
      }

      // 三份饭
      for (let i = 0; i < schoolScene.meals.length; i++) {
        const m = schoolScene.meals[i];
        const mx = m.x - cameraX;
        if (mx < -40 || mx > W + 40) continue;
        if (m.taken) {
          ctx.fillStyle = "rgba(0,0,0,0.35)";
          ctx.fillRect(mx - 16, gy - 42, 40, 18);
          ctx.fillStyle = "#aaa";
          ctx.font = "10px 'Noto Sans SC', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("已抢", mx + 4, gy - 29);
          continue;
        }
        ctx.fillStyle = "#fff3e0";
        ctx.fillRect(mx - 18, gy - 44, 44, 16);
        ctx.fillStyle = "#e67e22";
        ctx.fillRect(mx - 12, gy - 40, 32, 10);
        ctx.fillStyle = "#27ae60";
        ctx.beginPath();
        ctx.arc(mx + 2, gy - 48, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffd24a";
        ctx.font = "bold 11px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`饭${i + 1}`, mx + 4, gy - 56);
      }

      // 车
      for (const c of schoolScene.cars || []) {
        const sx = c.x - cameraX;
        if (sx < -120 || sx > W + 40) continue;
        ctx.fillStyle = c.color;
        ctx.fillRect(sx, c.y, c.w, c.h);
        ctx.fillStyle = "#88c8ff";
        ctx.fillRect(sx + 12, c.y + 6, 22, 12);
        ctx.fillRect(sx + c.w - 34, c.y + 6, 22, 12);
        ctx.fillStyle = "#222";
        ctx.beginPath();
        ctx.arc(sx + 18, c.y + c.h, 7, 0, Math.PI * 2);
        ctx.arc(sx + c.w - 18, c.y + c.h, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      // 同学
      for (const n of schoolScene.classmates || []) {
        if (n.hasMeal) {
          // 端着盘子站在食堂
          drawPerson(n.x, n.y, n.w, n.h, n.color, n.facing, n.bob);
          ctx.fillStyle = "#fff";
          ctx.fillRect(n.x - cameraX + 4, n.y - 8, 18, 6);
          continue;
        }
        drawPerson(n.x, n.y, n.w, n.h, n.color, n.facing, n.bob);
      }

      // 老师
      const t = schoolScene.teacher;
      drawPerson(t.x, t.y, t.w, t.h, "#2c3e50", t.facing, t.bob);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("老师", t.x - cameraX + t.w / 2, t.y - 6);
      if (t.state === "teach") {
        ctx.fillStyle = "#f5d0b0";
        ctx.fillRect(t.x - cameraX + (t.facing > 0 ? t.w : -10), t.y + 16, 10, 3);
      }

      // 未开门的门视觉
      if (!schoolScene.doorOpen && schoolScene.door) {
        const d = schoolScene.door;
        const dx = d.x - cameraX;
        ctx.fillStyle = "#6b3f1f";
        ctx.fillRect(dx, d.y, d.w, d.h);
        ctx.fillStyle = "#c9a06a";
        ctx.fillRect(dx + d.w - 6, d.y + 50, 4, 8);
        ctx.fillStyle = "#ffe566";
        ctx.font = "10px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("门", dx + d.w / 2, d.y - 6);
      }

      // HUD
      const topY = 28;
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(18, topY, 280, schoolScene.phase === "class" ? 54 : 40);
      ctx.fillStyle = "#ffd24a";
      ctx.font = "bold 14px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("抢饭", 28, topY + 18);
      ctx.fillStyle = "#cde";
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      if (schoolScene.phase === "class") {
        ctx.fillText(`距离下课 ${Math.max(0, Math.ceil(schoolScene.classT))} 秒`, 28, topY + 38);
      } else {
        ctx.fillText(
          `${schoolScene.zoneHint || ""} · 剩饭 ${mealsLeft()}/3`,
          28,
          topY + 36
        );
      }

      if (schoolScene.toast && schoolScene.toastT > 0) {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(W / 2 - 160, 86, 320, 36);
        ctx.fillStyle = schoolScene.toast.includes("撞大运") ? "#ff6b6b" : "#fff";
        ctx.font = "bold 15px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(schoolScene.toast, W / 2, 110);
      }
    }

    S.initSchool18 = initSchool18;
    S.updateSchool18 = updateSchool18;
    S.drawSchoolExtras = drawSchoolExtras;
    S.syncSchool18OnLeave = syncSchool18OnLeave;
  };
};
