// 第 35 关：玩家PVP —— 至少 2 人；匹配 → 红蓝 VS 开场 → 500 米障碍竞速
window.installPvp35 = function (S) {
  with (S) {
    const toast = GameLevelKit.makeToast(() => pvpScene);

    function syncMatchHint() {
      // 由 draw 同步状态栏
    }

    function teamColor(team) {
      return team === "red" ? "#e63946" : team === "blue" ? "#457b9d" : "#f1faee";
    }

    function playerCount() {
      return remotePlayers.size + 1;
    }

    function pickTeams() {
      if (!pvpScene || pvpScene.teamsReady) return;
      const ids = [String(localCoopId())];
      for (const id of remotePlayers.keys()) ids.push(String(id));
      ids.sort();
      // 两边用同样 id 集合算哈希，随机但一致
      let h = 0;
      for (let i = 0; i < ids.length; i++) {
        for (let j = 0; j < ids[i].length; j++) {
          h = (h * 31 + ids[i].charCodeAt(j)) | 0;
        }
      }
      const iAmBlue = (h & 1) === 0;
      pvpScene.myTeam = iAmBlue ? "blue" : "red";
      pvpScene.foeTeam = iAmBlue ? "red" : "blue";
      // 对手名
      let name = "";
      for (const rp of remotePlayers.values()) {
        name = playerLabel(rp.name || "玩家");
        break;
      }
      pvpScene.foeName = name || "对手";
      pvpScene.teamsReady = true;
    }

    function startIntro() {
      if (!pvpScene || pvpScene.phase !== "match") return;
      pickTeams();
      pvpScene.phase = "intro";
      pvpScene.introT = 0;
      pvpScene.vsY = -80;
      statusLabel.textContent = "PVP 开场";
      if (window.GameAudio && GameAudio.playClick) GameAudio.playClick();
    }

    function startRace() {
      if (!pvpScene) return;
      pvpScene.phase = "race";
      pvpScene.introT = 0;
      statusLabel.textContent = "PVP 竞速 · 冲向终点！";
      toast("GO！冲向 500 米终点", 2);
      if (window.GameAudio && GameAudio.playStar) GameAudio.playStar();
    }

    function freezePlayer() {
      if (!player) return;
      player.vx = 0;
      player.vy = 0;
      player.x = pvpScene.raceStartX;
      player.y = pvpScene.groundY - player.h;
      player.onGround = true;
    }

    function initPvp35() {
      if (!pvpScene) return;
      pvpScene.phase = "match";
      pvpScene.matchT = 0;
      pvpScene.introT = 0;
      pvpScene.vsY = -80;
      pvpScene.myTeam = null;
      pvpScene.foeTeam = null;
      pvpScene.teamsReady = false;
      pvpScene.foeName = "";
      pvpScene.winner = null;
      pvpScene.toast = "";
      pvpScene.toastT = 0;
      freezePlayer();
      statusLabel.textContent = "匹配队员中...";
    }

    function syncPvp35OnLeave() {
      /* 无 DOM 按钮 */
    }

    function checkFinish() {
      if (!pvpScene || pvpScene.phase !== "race" || pvpScene.winner) return;
      if (player && player.x >= pvpScene.finishX) {
        pvpScene.winner = "me";
        pvpScene.phase = "done";
        statusLabel.textContent = "你先到终点！PVP 获胜";
        toast("PVP 获胜！", 2.5);
        spawnBurst(player.x + 14, player.y, "#ffe566", 28);
        if (window.GameAudio && GameAudio.playStar) GameAudio.playStar();
        if (window.LevelCoop && LevelCoop.send) {
          LevelCoop.send({ type: "pvp-finish", lv: 35 });
        }
        if (state === "playing" && level === 35) winLevel();
        return;
      }
      for (const rp of remotePlayers.values()) {
        const px = rp.drawX != null ? rp.drawX : rp.x;
        if (px != null && px >= pvpScene.finishX && !pvpScene.winner) {
          pvpScene.winner = "foe";
          pvpScene.phase = "done";
          statusLabel.textContent = `${pvpScene.foeName || "对手"}先到终点`;
          toast("对手获胜…", 2.5);
          syncPvp35OnLeave();
        }
      }
    }

    function updatePvp35(dt) {
      if (!pvpScene || state !== "playing" || level !== 35) return;
      pvpScene.pulse += dt;
      GameLevelKit.tickToast(pvpScene, dt);

      // 对手信息同步
      if (!pvpScene.foeName && remotePlayers.size) {
        for (const rp of remotePlayers.values()) {
          pvpScene.foeName = playerLabel(rp.name || "玩家");
          break;
        }
      }

      if (pvpScene.phase === "match") {
        pvpScene.matchT += dt;
        freezePlayer();
        statusLabel.textContent = "匹配队员中...";
        if (playerCount() >= 2) startIntro();
        return;
      }

      if (pvpScene.phase === "intro") {
        pvpScene.introT += dt;
        freezePlayer();
        // VS 下落：从白区上方落到两人中间
        const t = clamp(pvpScene.introT / 1.4, 0, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        pvpScene.vsY = -80 + eased * (H * 0.42 + 80);
        if (pvpScene.introT >= pvpScene.introDur) startRace();
        return;
      }

      if (pvpScene.phase === "race") {
        checkFinish();
      }
    }

    function tryClickPvp35() {
      return false;
    }

    // ── 绘制 ──
    function drawFinishLine() {
      const fx = pvpScene.finishX - cameraX;
      if (fx < -40 || fx > W + 40) return;
      const y0 = pvpScene.groundY - 120;
      ctx.save();
      // 旗杆
      ctx.fillStyle = "#eee";
      ctx.fillRect(fx, y0, 6, 120);
      // 方格旗
      const sz = 10;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 6; c++) {
          ctx.fillStyle = (r + c) % 2 ? "#111" : "#f5f5f5";
          ctx.fillRect(fx + 6 + c * sz, y0 + r * sz, sz, sz);
        }
      }
      ctx.fillStyle = "#ffd24a";
      ctx.font = "14px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("终点 500m", fx + 30, y0 - 10);
      ctx.textAlign = "left";
      ctx.restore();
    }

    function drawMeterMarks() {
      ctx.save();
      ctx.font = "10px 'Noto Sans SC', sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      for (let m = 50; m <= 500; m += 50) {
        const x = m * 10 - cameraX;
        if (x < 0 || x > W) continue;
        ctx.fillRect(x, pvpScene.groundY + 30, 2, 8);
        ctx.fillText(`${m}m`, x - 10, pvpScene.groundY + 52);
      }
      ctx.restore();
    }

    function drawNameTag(wx, wy, text, color) {
      const x = wx - cameraX;
      ctx.save();
      ctx.font = "13px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0,0,0,0.75)";
      ctx.fillStyle = color || "#fff";
      ctx.strokeText(text, x, wy);
      ctx.fillText(text, x, wy);
      ctx.restore();
    }

    function drawTeamRing(wx, wy, team) {
      const x = wx - cameraX;
      ctx.save();
      ctx.strokeStyle = teamColor(team);
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.ellipse(x, wy + 4, 18, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    function drawMatchScreen() {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffd24a";
      ctx.font = "700 28px 'Noto Sans SC', sans-serif";
      const dots = ".".repeat(1 + (Math.floor(pvpScene.matchT * 2) % 3));
      ctx.fillText(`匹配队员中${dots}`, W / 2, H * 0.4);
      ctx.fillStyle = "#cfd8dc";
      ctx.font = "14px 'Noto Sans SC', sans-serif";
      ctx.fillText("玩家PVP · 至少 2 人 · 500 米障碍竞速", W / 2, H * 0.4 + 36);
      ctx.fillText("等待另一位玩家加入（手机/电脑联机）", W / 2, H * 0.4 + 60);
      ctx.restore();
    }

    function drawVsIntro() {
      // 半屏蓝 | 中间白 | 半屏红；白不是队伍
      const midX = W * 0.5;
      const band = Math.min(90, W * 0.12);
      ctx.save();

      // 左半：我方色 / 右半：对方色（随机红蓝，白区只是分隔）
      const leftTeam = pvpScene.myTeam;
      const rightTeam = pvpScene.foeTeam;
      ctx.fillStyle = teamColor(leftTeam);
      ctx.fillRect(0, 0, midX - band / 2, H);
      ctx.fillStyle = teamColor(rightTeam);
      ctx.fillRect(midX + band / 2, 0, W - midX - band / 2, H);

      // 中间白色区域（不属于任何队）
      ctx.fillStyle = "#f1faee";
      ctx.fillRect(midX - band / 2, 0, band, H);

      // 渐隐黑底压一点，字更清楚
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(0, 0, W, H);

      // 名字：左「我」，右对手名
      ctx.textAlign = "center";
      ctx.font = "700 26px 'Noto Sans SC', sans-serif";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(0,0,0,0.55)";
      const ny = H * 0.42;
      ctx.strokeText("我", midX * 0.5, ny);
      ctx.fillStyle = "#fff";
      ctx.fillText("我", midX * 0.5, ny);
      const foe = pvpScene.foeName || "对手";
      ctx.strokeText(foe, midX * 1.5, ny);
      ctx.fillText(foe, midX * 1.5, ny);

      // 队标
      ctx.font = "14px 'Noto Sans SC', sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillText(leftTeam === "red" ? "红队" : "蓝队", midX * 0.5, ny + 28);
      ctx.fillText(rightTeam === "red" ? "红队" : "蓝队", midX * 1.5, ny + 28);

      // 白区上方落下 VS → 两人中间
      const vsX = midX;
      const vsY = pvpScene.vsY;
      ctx.font = "700 56px 'Press Start 2P', monospace";
      ctx.fillStyle = "#111";
      ctx.fillText("VS", vsX + 3, vsY + 3);
      ctx.fillStyle = "#ffd24a";
      ctx.fillText("VS", vsX, vsY);

      // 白区提示
      ctx.font = "11px 'Noto Sans SC', sans-serif";
      ctx.fillStyle = "rgba(40,40,40,0.7)";
      ctx.fillText("白区非队伍", vsX, H - 24);

      ctx.restore();
    }

    function drawPvp35Extras() {
      if (!pvpScene) return;
      drawMeterMarks();
      drawFinishLine();

      // 起点线
      const sx = pvpScene.raceStartX - cameraX;
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(sx - 20, pvpScene.groundY);
      ctx.lineTo(sx - 20, pvpScene.groundY - 80);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 头上标签 + 队色圈
      if (pvpScene.phase === "race" || pvpScene.phase === "done") {
        if (player) {
          drawTeamRing(player.x + player.w / 2, player.y + player.h, pvpScene.myTeam);
          drawNameTag(player.x + player.w / 2, player.y - 10, "我", teamColor(pvpScene.myTeam));
        }
        for (const rp of remotePlayers.values()) {
          const px = (rp.drawX != null ? rp.drawX : rp.x) + 14;
          const py = rp.drawY != null ? rp.drawY : rp.y;
          if (px == null) continue;
          drawTeamRing(px, py + 40, pvpScene.foeTeam);
          drawNameTag(px, py - 12, pvpScene.foeName || playerLabel(rp.name || "玩家"), teamColor(pvpScene.foeTeam));
        }
      }

      if (pvpScene.phase === "match") {
        drawMatchScreen();
      } else if (pvpScene.phase === "intro") {
        drawVsIntro();
      } else if (pvpScene.phase === "done") {
        ctx.save();
        ctx.textAlign = "center";
        ctx.font = "700 22px 'Noto Sans SC', sans-serif";
        ctx.fillStyle = pvpScene.winner === "me" ? "#ffe566" : "#ff8a80";
        ctx.fillText(
          pvpScene.winner === "me" ? "PVP 获胜！" : `${pvpScene.foeName || "对手"}获胜`,
          W / 2,
          56
        );
        ctx.restore();
      }

      if (pvpScene.toast) {
        ctx.save();
        ctx.textAlign = "center";
        ctx.font = "14px 'Noto Sans SC', sans-serif";
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        const tw = ctx.measureText(pvpScene.toast).width + 24;
        ctx.fillRect(W / 2 - tw / 2, 70, tw, 30);
        ctx.fillStyle = "#ffe082";
        ctx.fillText(pvpScene.toast, W / 2, 90);
        ctx.restore();
      }
    }

    // 处理对手冲线
    const _origUpdate = updatePvp35;

    S.initPvp35 = initPvp35;
    S.updatePvp35 = updatePvp35;
    S.drawPvp35Extras = drawPvp35Extras;
    S.syncPvp35OnLeave = syncPvp35OnLeave;
    S.tryClickPvp35 = tryClickPvp35;
  }
};
