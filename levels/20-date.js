// 第 20 关：西餐厅约会 · 选性别 · 放松纯音乐
window.installDate20 = function (S) {
  with (S) {
    const dateToast = GameLevelKit.makeToast(() => dateScene, 2.4);

    function seatPlayer() {
      if (!dateScene || !player) return;
      const s = dateScene.playerSeat;
      player.x = s.x;
      player.y = s.y;
      player.vx = 0;
      player.vy = 0;
      player.facing = 1;
    }

    function startDining() {
      if (!dateScene || dateScene.dining) return;
      dateScene.choosing = false;
      dateScene.dining = true;
      dateScene.course = 0;
      dateScene.courseT = 0;
      dateScene.dineProgress = 0;
      seatPlayer();
      if (window.GameAudio) {
        if (GameAudio.unlock) GameAudio.unlock();
        if (GameAudio.startDateAmbience) GameAudio.startDateAmbience();
      }
      const g = dateScene.gender === "f" ? "女士" : "男士";
      const other = dateScene.gender === "f" ? "男士" : "女士";
      statusLabel.textContent = "西餐厅 · 约会中";
      dateToast(`你是${g} · 对面是${other}，请慢慢享用`, 3.2);
    }

    function pickGender(g) {
      if (!dateScene || !dateScene.choosing || dateScene.done) return;
      dateScene.gender = g;
      startDining();
    }

    function finishDate() {
      if (!dateScene || dateScene.done) return;
      dateScene.done = true;
      dateScene.dining = false;
      if (window.GameAudio && GameAudio.stopDateAmbience) GameAudio.stopDateAmbience();
      statusLabel.textContent = "约会圆满结束";
      dateToast("这顿饭很舒服 · 通关！", 2.4);
      if (window.GameAudio && GameAudio.playStar) GameAudio.playStar();
      setTimeout(() => {
        if (state === "playing" && level === 20) winLevel();
      }, 900);
    }

    function initDate20() {
      if (!dateScene) return;
      dateScene.gender = null;
      dateScene.choosing = true;
      dateScene.dining = false;
      dateScene.done = false;
      dateScene.course = 0;
      dateScene.courseT = 0;
      dateScene.dineProgress = 0;
      dateScene.toast = "";
      dateScene.toastT = 0;
      dateScene.candleFlicker = 0;
      dateScene.softTalk = 0;
      dateScene.hearts = [];
      dateScene.kissCd = 0;
      dateScene.partnerSay = "";
      dateScene.partnerSayT = 0;
      seatPlayer();
      if (window.GameAudio) {
        if (GameAudio.stopDateAmbience) GameAudio.stopDateAmbience();
        if (GameAudio.unlock) GameAudio.unlock();
      }
      statusLabel.textContent = "请选择你的性别";
      dateToast("西餐厅约会 · 先选择性别", 3);
    }

    function spawnKissHearts(x, y) {
      if (!dateScene) return;
      for (let i = 0; i < 10; i++) {
        dateScene.hearts.push({
          x: x + (Math.random() - 0.5) * 36,
          y: y - 10 - Math.random() * 20,
          vx: (Math.random() - 0.5) * 60,
          vy: -40 - Math.random() * 80,
          life: 0.9 + Math.random() * 0.5,
          size: 8 + Math.random() * 8,
        });
      }
      if (typeof spawnBurst === "function") {
        spawnBurst(x, y, "#ff6aa8", 12);
      }
    }

    function tryKissPartner() {
      if (!dateScene || !dateScene.dining || dateScene.done || !player) return;
      if (dateScene.kissCd > 0) return;
      const ds = dateScene.dateSeat;
      const partner = { x: ds.x, y: ds.y, w: 28, h: 42 };
      if (!rectsOverlap(player, partner)) return;
      dateScene.kissCd = 1.2;
      dateScene.partnerSay = "我好爱你";
      dateScene.partnerSayT = 2.4;
      spawnKissHearts(ds.x + 14, ds.y + 8);
      dateToast("亲到了 · 我好爱你", 2);
      statusLabel.textContent = "约会对象：我好爱你";
      if (window.GameAudio && GameAudio.playStar) GameAudio.playStar();
    }

    function syncDate20OnLeave() {
      if (window.GameAudio && GameAudio.stopDateAmbience) GameAudio.stopDateAmbience();
    }

    function updateDate20(dt) {
      if (!dateScene || level !== 20 || state !== "playing") return;
      GameLevelKit.tickToast(dateScene, dt);
      if (dateScene.partnerSayT > 0) {
        dateScene.partnerSayT -= dt;
        if (dateScene.partnerSayT <= 0) dateScene.partnerSay = "";
      }
      if (dateScene.kissCd > 0) dateScene.kissCd -= dt;
      dateScene.candleFlicker += dt;
      dateScene.partnerBlink -= dt;
      if (dateScene.partnerBlink < -0.08) dateScene.partnerBlink = 2.4 + Math.random() * 2;

      for (const h of dateScene.hearts || []) {
        h.life -= dt;
        h.x += h.vx * dt;
        h.y += h.vy * dt;
        h.vy -= 20 * dt;
      }
      dateScene.hearts = (dateScene.hearts || []).filter((h) => h.life > 0);

      if (dateScene.choosing) {
        seatPlayer();
        return;
      }

      if (!dateScene.dining || dateScene.done) return;

      // 可走到对面去亲
      if (player) {
        const room = dateScene.room;
        const minX = room.x + 24;
        const maxX = room.x + room.w - 24 - player.w;
        if (player.x < minX) {
          player.x = minX;
          player.vx = 0;
        }
        if (player.x > maxX) {
          player.x = maxX;
          player.vx = 0;
        }
      }

      tryKissPartner();

      dateScene.courseT += dt;
      dateScene.dineProgress = Math.min(1, dateScene.dineProgress + dt / dateScene.winAt);
      dateScene.softTalk += dt;

      const courses = [
        { at: 0, msg: "服务员端上开胃沙拉" },
        { at: 12, msg: "主厨推荐的牛排来了" },
        { at: 28, msg: "甜点与咖啡，灯光更柔了" },
        { at: 42, msg: "走到对面就能亲到约会对象" },
      ];
      if (dateScene.course < courses.length && dateScene.courseT >= courses[dateScene.course].at) {
        dateToast(courses[dateScene.course].msg, 2.6);
        dateScene.course += 1;
      }

      if (!dateScene.partnerSay) {
        statusLabel.textContent = `西餐厅约会 · ${Math.floor(dateScene.dineProgress * 100)}%`;
      }
      if (dateScene.dineProgress >= 1) finishDate();
    }

    function drawDatePerson(px, py, opts) {
      const shirt = opts.shirt || "#3ec6ff";
      const pants = opts.pants || "#245a8a";
      const hair = opts.hair || "#3a2a1a";
      const facing = opts.facing != null ? opts.facing : 1;
      const blink = !!opts.blink;
      const hop = opts.hop || 0;

      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.beginPath();
      ctx.ellipse(px + 14, py + 42, 14, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = shirt;
      ctx.fillRect(px + 6, py + 10 + hop, 16, 22);
      ctx.fillStyle = "#ffe0b8";
      ctx.fillRect(px + 6, py + hop, 16, 14);
      ctx.fillStyle = hair;
      ctx.fillRect(px + 5, py - 2 + hop, 18, 6);
      if (opts.longHair) {
        ctx.fillRect(px + 4, py + 4 + hop, 4, 12);
        ctx.fillRect(px + 20, py + 4 + hop, 4, 12);
      }
      if (!blink) {
        ctx.fillStyle = "#1a0c08";
        ctx.fillRect(px + (facing >= 0 ? 14 : 8), py + 5 + hop, 3, 3);
      }
      ctx.fillStyle = pants;
      ctx.fillRect(px + 7, py + 30 + hop, 5, 10);
      ctx.fillRect(px + 16, py + 30 + hop, 5, 10);

      if (opts.label) {
        ctx.save();
        ctx.font = "11px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(0,0,0,0.7)";
        ctx.fillStyle = "#ffe27a";
        ctx.strokeText(opts.label, px + 14, py - 10 + hop);
        ctx.fillText(opts.label, px + 14, py - 10 + hop);
        ctx.restore();
      }
    }

    function drawDateExtras() {
      if (!dateScene || level !== 20) return;
      const room = dateScene.room;
      const ax = room.x - cameraX;

      // 暖色餐厅氛围
      const ambience = ctx.createLinearGradient(0, room.y, 0, room.y + room.h);
      ambience.addColorStop(0, "rgba(80, 36, 28, 0.35)");
      ambience.addColorStop(0.45, "rgba(40, 22, 18, 0.2)");
      ambience.addColorStop(1, "rgba(20, 12, 10, 0.35)");
      ctx.fillStyle = ambience;
      ctx.fillRect(ax, room.y, room.w, room.h);

      // 窗户
      function drawWindow(wx) {
        const x = wx - cameraX;
        ctx.fillStyle = "#1a3048";
        ctx.fillRect(x, 90, 100, 100);
        const night = ctx.createLinearGradient(x, 90, x, 190);
        night.addColorStop(0, "#2a4a6a");
        night.addColorStop(1, "#0e1a28");
        ctx.fillStyle = night;
        ctx.fillRect(x + 6, 96, 88, 88);
        ctx.strokeStyle = "#c9a067";
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 6, 96, 88, 88);
        ctx.beginPath();
        ctx.moveTo(x + 50, 96);
        ctx.lineTo(x + 50, 184);
        ctx.moveTo(x + 6, 140);
        ctx.lineTo(x + 94, 140);
        ctx.stroke();
      }
      drawWindow(140);
      drawWindow(720);

      // 吊灯
      const lx = 480 - cameraX;
      ctx.strokeStyle = "#d4b48a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx, 68);
      ctx.lineTo(lx, 110);
      ctx.stroke();
      ctx.fillStyle = "#f0d9a0";
      ctx.beginPath();
      ctx.moveTo(lx - 28, 110);
      ctx.lineTo(lx + 28, 110);
      ctx.lineTo(lx + 18, 128);
      ctx.lineTo(lx - 18, 128);
      ctx.closePath();
      ctx.fill();
      const glow = 0.18 + Math.sin(dateScene.candleFlicker * 3) * 0.04;
      ctx.fillStyle = `rgba(255, 210, 120, ${glow})`;
      ctx.beginPath();
      ctx.arc(lx, 150, 70, 0, Math.PI * 2);
      ctx.fill();

      // 桌子
      const t = dateScene.table;
      const tx = t.x - cameraX;
      ctx.fillStyle = "#5a3420";
      ctx.fillRect(tx, t.y, t.w, t.h);
      ctx.fillStyle = "#7a4a2a";
      ctx.fillRect(tx + 4, t.y + 2, t.w - 8, 8);
      ctx.fillStyle = "#3a2214";
      const legH = Math.max(12, 400 - (t.y + t.h));
      ctx.fillRect(tx + 28, t.y + t.h, 14, legH);
      ctx.fillRect(tx + t.w - 42, t.y + t.h, 14, legH);

      // 桌布
      ctx.fillStyle = "#f4eee4";
      ctx.fillRect(tx + 10, t.y - 2, t.w - 20, 8);

      // 蜡烛
      const cx = tx + t.w / 2;
      const cy = t.y - 8;
      ctx.fillStyle = "#f2e6c8";
      ctx.fillRect(cx - 4, cy - 22, 8, 22);
      const flick = 1 + Math.sin(dateScene.candleFlicker * 8) * 0.15;
      ctx.fillStyle = "#ffb347";
      ctx.beginPath();
      ctx.ellipse(cx, cy - 28, 5 * flick, 8 * flick, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 180, 80, 0.2)";
      ctx.beginPath();
      ctx.arc(cx, cy - 28, 26, 0, Math.PI * 2);
      ctx.fill();

      // 餐盘
      ctx.fillStyle = "#ece6de";
      ctx.beginPath();
      ctx.ellipse(tx + 70, t.y - 4, 28, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(tx + t.w - 70, t.y - 4, 28, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      if (dateScene.dining) {
        ctx.fillStyle = dateScene.course >= 2 ? "#c45a3a" : dateScene.course >= 1 ? "#6aaa4a" : "#d8e8a8";
        ctx.beginPath();
        ctx.ellipse(tx + 70, t.y - 6, 14, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(tx + t.w - 70, t.y - 6, 14, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 酒杯
      ctx.strokeStyle = "#cde";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(tx + 110, t.y - 28, 10, 18);
      ctx.strokeRect(tx + t.w - 120, t.y - 28, 10, 18);
      ctx.fillStyle = "rgba(180, 40, 50, 0.55)";
      ctx.fillRect(tx + 111, t.y - 16, 8, 6);
      ctx.fillRect(tx + t.w - 119, t.y - 16, 8, 6);

      // 约会对象（对面）
      if (dateScene.gender) {
        const ds = dateScene.dateSeat;
        const partnerFemale = dateScene.gender === "m";
        const blink = dateScene.partnerBlink < 0;
        drawDatePerson(ds.x - cameraX, ds.y, {
          shirt: partnerFemale ? "#ff7eb6" : "#3b8cff",
          pants: partnerFemale ? "#c44f88" : "#245a8a",
          hair: partnerFemale ? "#5a3a28" : "#2a1c14",
          longHair: partnerFemale,
          facing: -1,
          blink,
          label: "约会对象",
          hop: Math.sin(time * 2) * 0.5,
        });

        if (dateScene.partnerSay && dateScene.partnerSayT > 0) {
          const bx = ds.x - cameraX + 14;
          const by = ds.y - 28;
          ctx.font = "bold 13px 'Noto Sans SC', sans-serif";
          const tw = ctx.measureText(dateScene.partnerSay).width;
          const bw = tw + 20;
          ctx.fillStyle = "rgba(255, 240, 248, 0.95)";
          ctx.strokeStyle = "#ff6aa8";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect
            ? ctx.roundRect(bx - bw / 2, by - 22, bw, 28, 8)
            : ctx.rect(bx - bw / 2, by - 22, bw, 28);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#d63384";
          ctx.textAlign = "center";
          ctx.fillText(dateScene.partnerSay, bx, by - 2);
        }
      }

      // 爱心
      for (const h of dateScene.hearts || []) {
        const a = Math.max(0, Math.min(1, h.life));
        const hx = h.x - cameraX;
        const hy = h.y;
        const s = h.size * (0.7 + (1 - a) * 0.4);
        ctx.globalAlpha = a;
        ctx.fillStyle = "#ff4f8b";
        ctx.beginPath();
        ctx.moveTo(hx, hy + s * 0.3);
        ctx.bezierCurveTo(hx, hy, hx - s * 0.55, hy, hx - s * 0.55, hy + s * 0.35);
        ctx.bezierCurveTo(hx - s * 0.55, hy + s * 0.7, hx, hy + s * 0.95, hx, hy + s * 1.15);
        ctx.bezierCurveTo(hx, hy + s * 0.95, hx + s * 0.55, hy + s * 0.7, hx + s * 0.55, hy + s * 0.35);
        ctx.bezierCurveTo(hx + s * 0.55, hy, hx, hy, hx, hy + s * 0.3);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // HUD
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(16, 20, 360, 58);
      ctx.fillStyle = "#ffd24a";
      ctx.font = "bold 14px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("第20关 · 西餐厅", 26, 40);
      ctx.fillStyle = "#e8d4c0";
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      if (dateScene.choosing) {
        ctx.fillText("请选择你的性别，开始约会", 26, 60);
      } else {
        ctx.fillText("走到对面碰到对象就能亲", 26, 60);
      }

      if (dateScene.dining && !dateScene.done) {
        ctx.fillStyle = "#222";
        ctx.fillRect(26, 68, 320, 7);
        ctx.fillStyle = "#ffb4d0";
        ctx.fillRect(26, 68, 320 * dateScene.dineProgress, 7);
      }

      // 性别选择
      if (dateScene.choosing) {
        ctx.fillStyle = "rgba(0,0,0,0.62)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "rgba(40, 22, 18, 0.92)";
        ctx.fillRect(W / 2 - 210, 140, 420, 180);
        ctx.strokeStyle = "#c9a067";
        ctx.lineWidth = 2;
        ctx.strokeRect(W / 2 - 210, 140, 420, 180);
        ctx.fillStyle = "#ffe7c2";
        ctx.font = "bold 18px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("今晚你是？", W / 2, 178);
        ctx.fillStyle = "#c9a67a";
        ctx.font = "12px 'Noto Sans SC', sans-serif";
        ctx.fillText("选择后会换上对应衣服，对面坐着约会对象", W / 2, 200);

        const bf = dateScene.genderBtns.f;
        const bm = dateScene.genderBtns.m;
        ctx.fillStyle = "#ff7eb6";
        ctx.fillRect(bf.x, bf.y, bf.w, bf.h);
        ctx.fillStyle = "#3b8cff";
        ctx.fillRect(bm.x, bm.y, bm.w, bm.h);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 16px 'Noto Sans SC', sans-serif";
        ctx.fillText("女 · 粉衣", bf.x + bf.w / 2, bf.y + 34);
        ctx.fillText("男 · 蓝衣", bm.x + bm.w / 2, bm.y + 34);
      }

      if (dateScene.toast && dateScene.toastT > 0) {
        ctx.fillStyle = "rgba(0,0,0,0.72)";
        ctx.fillRect(W / 2 - 210, 100, 420, 36);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 13px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(dateScene.toast, W / 2, 123);
      }
    }

    function tryClickDate20(clientX, clientY) {
      if (!dateScene || level !== 20 || state !== "playing" || !dateScene.choosing) return false;
      const rect = canvas.getBoundingClientRect();
      const sx = ((clientX - rect.left) / rect.width) * W;
      const sy = ((clientY - rect.top) / rect.height) * H;
      const bf = dateScene.genderBtns.f;
      const bm = dateScene.genderBtns.m;
      if (sx >= bf.x && sx <= bf.x + bf.w && sy >= bf.y && sy <= bf.y + bf.h) {
        pickGender("f");
        return true;
      }
      if (sx >= bm.x && sx <= bm.x + bm.w && sy >= bm.y && sy <= bm.y + bm.h) {
        pickGender("m");
        return true;
      }
      return false;
    }

    S.initDate20 = initDate20;
    S.updateDate20 = updateDate20;
    S.drawDateExtras = drawDateExtras;
    S.syncDate20OnLeave = syncDate20OnLeave;
    S.tryClickDate20 = tryClickDate20;
  };
};
