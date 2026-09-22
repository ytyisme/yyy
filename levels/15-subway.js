// 第 15 关：挤地铁 · 城市电梯 · 购票乘车
window.installSubway15 = function (S) {
  with (S) {
    const phoneWrap = document.getElementById("lv14-phone-wrap");
    const phoneScreen = document.getElementById("lv14-phone-screen");
    const phoneBtn = document.getElementById("lv14-phone-btn");
    const phoneClose = document.getElementById("lv14-phone-close");
    const ticketWrap = document.getElementById("lv15-ticket-wrap");
    const ticketScreen = document.getElementById("lv15-ticket-screen");
    const ticketClose = document.getElementById("lv15-ticket-close");
    const ticketBack = document.getElementById("lv15-ticket-back");
    const elevWrap = document.getElementById("lv15-elev-wrap");
    const elevTitle = document.getElementById("lv15-elev-title");
    const elevFloors = document.getElementById("lv15-elev-floors");
    const elevClose = document.getElementById("lv15-elev-close");
    const announceEl = document.getElementById("lv15-announce");
    let phoneBound = false;
    let ticketBound = false;
    let elevBound = false;

    const subwayToast = GameLevelKit.makeToast(() => subwayScene, 2.5);

    function subwayAnnounce(msg, sec) {
      if (!subwayScene) return;
      subwayScene.announce = msg;
      subwayScene.announceT = sec || 4;
      if (announceEl) {
        announceEl.textContent = msg;
        announceEl.classList.remove("hidden");
      }
      if (window.GameAudio && typeof GameAudio.playSubwayAnnounce === "function") {
        GameAudio.playSubwayAnnounce(msg);
      }
    }

    function clearAnnounce() {
      if (announceEl) {
        announceEl.classList.add("hidden");
        announceEl.textContent = "";
      }
      if (window.GameAudio && typeof GameAudio.stopSubwayAnnounce === "function") {
        GameAudio.stopSubwayAnnounce();
      }
    }

    function syncSubwayPhoneBtn() {
      if (!phoneBtn) return;
      const show =
        level === 15 &&
        state === "playing" &&
        subwayScene &&
        subwayScene.phase !== "done" &&
        !subwayScene.onTrain;
      phoneBtn.classList.toggle("hidden", !show);
    }

    function hideSubwayPhone() {
      if (!subwayScene) return;
      subwayScene.phoneOpen = false;
      subwayScene.phoneApp = null;
      subwayScene.scanMode = false;
      if (phoneWrap) {
        phoneWrap.classList.add("hidden");
        phoneWrap.setAttribute("aria-hidden", "true");
      }
    }

    function hideTicketPanel() {
      if (!subwayScene) return;
      subwayScene.ticketPanelOpen = false;
      if (ticketWrap) {
        ticketWrap.classList.add("hidden");
        ticketWrap.setAttribute("aria-hidden", "true");
      }
    }

    function hideElevPanel() {
      if (!subwayScene) return;
      subwayScene.elevPanelOpen = false;
      subwayScene.elevKind = null;
      if (elevWrap) {
        elevWrap.classList.add("hidden");
        elevWrap.setAttribute("aria-hidden", "true");
      }
    }

    function teleportToZone(zone) {
      if (!subwayScene || !player) return;
      subwayScene.zone = zone;
      subwayScene.onPlatform = zone === "B2";
      player.x = zone === "B1" ? 200 : zone === "B2" ? 160 : 120;
      player.y = subwayScene.groundY - 40;
      player.vx = 0;
      player.vy = 0;
      player.onGround = true;
    }

    function renderPhoneHome() {
      if (!phoneScreen || !subwayScene) return;
      phoneScreen.className = "lv14-phone-screen lv15-phone-home";
      const name = escapeHtml(playerName || "玩家");
      phoneScreen.innerHTML = `
        <div class="lv15-phone-name">${name}</div>
        <div class="lv14-status-bar"><span>100%</span><span>15:20</span></div>
        <div class="lv14-app-grid lv15-app-grid">
          <button type="button" class="lv14-app" data-app="jifu">
            <span class="lv14-app-icon jifu">鸡</span>
            <span>鸡付宝</span>
          </button>
        </div>
        <p class="lv14-hint">选好站点后，点击二维码支付</p>`;
    }

    function renderJifu() {
      if (!phoneScreen || !subwayScene) return;
      phoneScreen.className = "lv14-phone-screen lv14-app-view";
      const name = escapeHtml(playerName || "玩家");
      const balPanel = subwayScene.showBalance
        ? `<div class="lv14-balance-panel">余额：<strong>¥${subwayScene.balance}</strong></div>`
        : "";
      phoneScreen.innerHTML = `
        <div class="lv14-app-top">
          <button type="button" class="lv14-back" data-back="home">←</button>
          <span>鸡付宝</span>
        </div>
        <div class="lv14-jifu">
          <p class="lv14-jifu-name">${name}</p>
          <button type="button" class="lv14-balance-btn" data-action="balance">余额</button>
          <button type="button" class="lv15-scan-btn" data-action="scan">扫一扫</button>
          ${balPanel}
        </div>`;
    }

    function renderScan() {
      if (!phoneScreen || !subwayScene) return;
      phoneScreen.className = "lv14-phone-screen lv15-scan-view";
      const canScan = subwayScene.qrActive && !subwayScene.paid;
      phoneScreen.innerHTML = `
        <div class="lv14-app-top">
          <button type="button" class="lv14-back" data-back="jifu">←</button>
          <span>扫一扫</span>
        </div>
        <div class="lv15-scan-frame">
          <div class="lv15-scan-box"></div>
          <p class="lv14-hint">${canScan ? "对准售票机二维码，点击扫描" : "请先在售票机选择「蓝月桥」"}</p>
          ${canScan ? `<button type="button" class="lv15-scan-go" data-action="do-scan">扫描</button>` : ""}
        </div>
        ${
          subwayScene.paymentFlash > 0
            ? `<div class="lv15-pay-ok"><span class="lv15-check">✓</span><p>支付成功</p></div>`
            : ""
        }`;
    }

    function openSubwayPhone() {
      if (!subwayScene || !phoneWrap) return;
      subwayScene.phoneOpen = true;
      renderPhoneHome();
      phoneWrap.classList.remove("hidden");
      phoneWrap.setAttribute("aria-hidden", "false");
      if (window.GameAudio) GameAudio.playClick();
    }

    function renderPhoneApp(app) {
      if (!subwayScene) return;
      subwayScene.phoneApp = app;
      subwayScene.scanMode = app === "scan";
      if (app === "home") renderPhoneHome();
      else if (app === "jifu") renderJifu();
      else if (app === "scan") renderScan();
    }

    function doScanPay() {
      if (!subwayScene || subwayScene.paid) return;
      if (!subwayScene.qrActive) {
        subwayToast("请先选择「蓝月桥」", 2);
        return;
      }
      if (subwayScene.balance < subwayScene.ticketPrice) {
        subwayToast("余额不足，请充值", 2);
        return;
      }
      subwayScene.balance -= subwayScene.ticketPrice;
      subwayScene.paid = true;
      subwayScene.hasTicket = true;
      subwayScene.paymentFlash = 2.5;
      if (subwayScene.scanMode) renderScan();
      renderTicketPanel();
      subwayToast("支付成功！请取地铁票", 2.5);
      statusLabel.textContent = "去闸机刷票进站";
      if (window.GameAudio) GameAudio.playClick();
      spawnBurst(player.x + player.w / 2, player.y, "#4ade80", 12);
    }

    function renderTicketPanel() {
      if (!ticketScreen || !subwayScene) return;
      const line1Btns = subwayScene.line1
        .map(
          (st, i) =>
            `<button type="button" class="lv15-station locked" disabled title="未开放">${i + 1}. ${st} <span>未开放</span></button>`
        )
        .join("");
      const line2Btns = subwayScene.line2
        .map((st, i) => {
          if (i === 0) {
            return `<button type="button" class="lv15-station current" disabled>${st}（本站）</button>`;
          }
          return `<button type="button" class="lv15-station" data-line="2" data-station="${st}">${st}</button>`;
        })
        .join("");
      const qrBlock =
        subwayScene.qrActive && !subwayScene.paid
          ? `<button type="button" class="lv15-qr-block" data-action="pay-qr">
              <div class="lv15-qr-art" id="lv15-qr-code"></div>
              <p>点击二维码支付</p>
            </button>`
          : subwayScene.paid && subwayScene.paymentFlash > 0
            ? `<div class="lv15-pay-ok-inline"><span class="lv15-check">✓</span><p>支付成功</p></div>`
            : "";
      const ticketOut = subwayScene.hasTicket
        ? `<div class="lv15-ticket-out">🎫 地铁票 · 二号线 → 蓝月桥</div>`
        : "";
      ticketScreen.innerHTML = `
        <div class="lv15-ticket-tabs">
          <span class="lv15-tab active">一号线</span>
          <span class="lv15-tab active">二号线</span>
        </div>
        <div class="lv15-ticket-body">
          <div class="lv15-line">
            <p class="lv15-line-title">一号线 · 5 站</p>
            ${line1Btns}
          </div>
          <div class="lv15-line">
            <p class="lv15-line-title">二号线 · 2 站</p>
            ${line2Btns}
          </div>
          ${qrBlock}
          ${ticketOut}
        </div>`;
      drawQrPattern();
    }

    function drawQrPattern() {
      const el = document.getElementById("lv15-qr-code");
      if (!el) return;
      let html = "";
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          const on = (r * 3 + c * 5 + r * c) % 3 !== 0;
          html += `<span class="${on ? "b" : ""}"></span>`;
        }
      }
      el.innerHTML = html;
    }

    function openTicketPanel() {
      if (!subwayScene || !ticketWrap) return;
      subwayScene.ticketPanelOpen = true;
      renderTicketPanel();
      ticketWrap.classList.remove("hidden");
      ticketWrap.setAttribute("aria-hidden", "false");
      if (window.GameAudio) GameAudio.playClick();
    }

    function openElevPanel(kind) {
      if (!subwayScene || !elevWrap || !elevFloors) return;
      subwayScene.elevPanelOpen = true;
      subwayScene.elevKind = kind;
      const cur = subwayScene.zone;
      if (elevTitle) {
        elevTitle.textContent = kind === "city" ? "选择楼层" : "乘车层电梯";
      }
      let floors = [];
      if (kind === "city") {
        floors = [
          { id: "1F", label: "1 层", cur: cur === "1F" },
          { id: "B1", label: "B1 层", cur: cur === "B1" },
        ];
      } else {
        floors = [
          { id: "B1", label: "B1 站厅", cur: cur === "B1" && !subwayScene.onPlatform },
          { id: "B2", label: "B2 乘车层", cur: cur === "B2" },
        ];
      }
      elevFloors.innerHTML = floors
        .map(
          (f) =>
            `<button type="button" class="lv15-floor-btn${f.cur ? " current" : ""}" data-floor="${f.id}">${f.label}${f.cur ? " · 当前" : ""}</button>`
        )
        .join("");
      elevWrap.classList.remove("hidden");
      elevWrap.setAttribute("aria-hidden", "false");
      if (window.GameAudio) GameAudio.playClick();
    }

    function selectElevFloor(floorId) {
      if (!subwayScene) return;
      const kind = subwayScene.elevKind;
      hideElevPanel();
      if (kind === "city") {
        if (floorId === "1F") teleportToZone("1F");
        else if (floorId === "B1") {
          teleportToZone("B1");
          statusLabel.textContent = "B1 地铁站 · 去售票机买票";
          subwayToast("到达 B1 地铁站", 2);
        }
      } else if (kind === "platform") {
        if (floorId === "B1") {
          teleportToZone("B1");
          subwayScene.onPlatform = false;
          statusLabel.textContent = "B1 站厅";
        } else if (floorId === "B2") {
          teleportToZone("B2");
          statusLabel.textContent = "候车 · 等第 4 列地铁";
          subwayToast("到达乘车层，人很多…", 2.5);
        }
      }
      if (window.GameAudio) GameAudio.playClick();
    }

    function bindSubwayPhone() {
      if (phoneBound) return;
      phoneBound = true;
      if (phoneBtn) {
        phoneBtn.addEventListener("click", () => {
          if (level !== 15 || !subwayScene) return;
          if (subwayScene.phoneOpen) hideSubwayPhone();
          else openSubwayPhone();
        });
      }
      if (phoneClose) {
        phoneClose.addEventListener("click", () => {
          if (level !== 15) return;
          hideSubwayPhone();
        });
      }
      if (phoneScreen) {
        phoneScreen.addEventListener("click", (e) => {
          const t = e.target.closest("[data-app],[data-back],[data-action]");
          if (!t || !subwayScene || level !== 15) return;
          playUiClick();
          if (t.dataset.app) {
            renderPhoneApp(t.dataset.app);
            return;
          }
          if (t.dataset.back) {
            if (t.dataset.back === "home") renderPhoneApp("home");
            else if (t.dataset.back === "jifu") renderPhoneApp("jifu");
            return;
          }
          if (t.dataset.action === "balance") {
            subwayScene.showBalance = !subwayScene.showBalance;
            renderJifu();
            return;
          }
          if (t.dataset.action === "scan") {
            renderPhoneApp("scan");
            return;
          }
          if (t.dataset.action === "do-scan") {
            doScanPay();
          }
        });
      }
    }

    function bindTicketPanel() {
      if (ticketBound || !ticketScreen) return;
      ticketBound = true;
      const closeTicket = () => {
        playUiClick();
        hideTicketPanel();
      };
      if (ticketClose) ticketClose.addEventListener("click", closeTicket);
      if (ticketBack) ticketBack.addEventListener("click", closeTicket);
      if (ticketWrap) {
        ticketWrap.addEventListener("click", (e) => {
          if (e.target === ticketWrap) closeTicket();
        });
      }
      ticketScreen.addEventListener("click", (e) => {
        if (!subwayScene) return;
        const qr = e.target.closest("[data-action='pay-qr']");
        if (qr) {
          playUiClick();
          doScanPay();
          return;
        }
        const st = e.target.closest("[data-station]");
        if (!st) return;
        playUiClick();
        if (st.dataset.station === "蓝月桥") {
          subwayScene.qrActive = true;
          renderTicketPanel();
          subwayToast("点击二维码即可支付", 2);
        }
      });
    }

    function bindElevPanel() {
      if (elevBound || !elevFloors) return;
      elevBound = true;
      if (elevClose) {
        elevClose.addEventListener("click", (e) => {
          e.stopPropagation();
          playUiClick();
          hideElevPanel();
        });
      }
      if (elevWrap) {
        elevWrap.addEventListener("click", (e) => {
          if (e.target === elevWrap) {
            playUiClick();
            hideElevPanel();
          }
        });
      }
      elevFloors.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-floor]");
        if (!btn || !subwayScene) return;
        e.stopPropagation();
        playUiClick();
        selectElevFloor(btn.dataset.floor);
      });
    }

    function initSubway15() {
      bindSubwayPhone();
      bindTicketPanel();
      bindElevPanel();
      hideSubwayPhone();
      hideTicketPanel();
      hideElevPanel();
      clearAnnounce();
      syncSubwayPhoneBtn();
      if (subwayScene) {
        subwayScene.zone = "1F";
        subwayScene.onPlatform = false;
      }
      statusLabel.textContent = "城市 · 点击电梯前往 B1 地铁";
    }

    function tryPassGate() {
      if (!subwayScene) return;
      if (!subwayScene.hasTicket) {
        subwayToast("还没有地铁票，先去售票机买票", 2.5);
        return;
      }
      subwayScene.gatePassed = true;
      subwayScene.onPlatform = false;
      player.x = 520;
      player.y = subwayScene.groundY - 40;
      subwayToast("闸机通过！去找乘车层电梯", 2.5);
      statusLabel.textContent = "去乘车层电梯";
      if (window.GameAudio) GameAudio.playClick();
    }

    const TRAIN_DOOR_W = 40;
    // 相对车头的车门左缘；停车后与站台屏蔽门对齐
    const TRAIN_DOOR_OFFSETS = [50, 140, 230, 320];

    function doorWorldBays(parkX) {
      return TRAIN_DOOR_OFFSETS.map((off) => ({
        x: parkX + off,
        w: TRAIN_DOOR_W,
      }));
    }

    function buildCabinPassengers() {
      const colors = ["#e67e22", "#3498db", "#9b59b6", "#1abc9c", "#e74c3c", "#f1c40f", "#e91e63"];
      const doors = [
        { x: 335, y: 250 },
        { x: 485, y: 250 },
        { x: 635, y: 250 },
      ];
      const list = [];
      let n = 0;
      for (let i = 0; i < 8; i++) {
        const sx = 60 + i * 105;
        const seats = [
          { x: sx + 8, y: 228 },
          { x: sx + 36, y: 228 },
          { x: sx + 8, y: 358 },
          { x: sx + 36, y: 358 },
        ];
        for (const s of seats) {
          const door = doors[n % 3];
          list.push({
            seatX: s.x,
            seatY: s.y,
            x: s.x,
            y: s.y,
            color: colors[n % colors.length],
            doorX: door.x,
            doorY: door.y,
            delay: (n % 8) * 0.06,
            hopped: false,
            gone: false,
          });
          n += 1;
        }
      }
      return list;
    }

    function drawPassengerFig(px, py, color, scale) {
      const s = scale || 1;
      ctx.fillStyle = "#333";
      ctx.fillRect(px + 4 * s, py - 6 * s, 12 * s, 10 * s);
      ctx.fillStyle = color;
      ctx.fillRect(px + 2 * s, py + 4 * s, 16 * s, 18 * s);
      ctx.fillStyle = "#2c3e50";
      ctx.fillRect(px + 4 * s, py + 20 * s, 12 * s, 10 * s);
    }

    function drawPlayerSkin(px, py, facing, opts) {
      facing = facing == null ? 1 : facing;
      const hop = (opts && opts.hop) || 0;
      const swing = (opts && opts.swing) || 0;
      // 与关卡内 drawPlayer 同一套皮肤
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath();
      ctx.ellipse(px + 14, py + 40 + 4 + hop, 14, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3ec6ff";
      ctx.fillRect(px + 6, py + 10 + hop, 16, 22);
      ctx.fillStyle = "#ffe0b8";
      ctx.fillRect(px + 6, py + hop, 16, 14);
      ctx.fillStyle = "#1a0c08";
      ctx.fillRect(px + (facing >= 0 ? 14 : 8), py + 5 + hop, 3, 3);
      ctx.fillStyle = "#245a8a";
      ctx.fillRect(px + 7, py + 30 + hop, 5, 10 + swing);
      ctx.fillRect(px + 16, py + 30 + hop, 5, 10 - swing);
      const raw = playerName || "玩家";
      const label = raw.length > 16 ? `${raw.slice(0, 16)}…` : raw;
      ctx.save();
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0, 0, 0, 0.75)";
      ctx.fillStyle = "#ffe27a";
      ctx.strokeText(label, px + 14, py - 10 + hop);
      ctx.fillText(label, px + 14, py - 10 + hop);
      ctx.restore();
    }

    function startTrainRide() {
      if (!subwayScene || !player) return;
      subwayScene.onTrain = true;
      subwayScene.trainPhase = "tunnel";
      subwayScene.rideT = 0;
      subwayScene.tunnelScroll = 0;
      subwayScene.pushFx = 0;
      subwayScene.rushT = 0;
      subwayScene.interiorDoorOpen = 0;
      subwayScene.doorOpen = 0;
      subwayScene.screenDoorOpen = 0;
      subwayScene.doorLight = "red";
      subwayScene.cabinPassengers = buildCabinPassengers();
      hideSubwayPhone();
      hideTicketPanel();
      hideElevPanel();
      player.x = 400;
      player.y = subwayScene.groundY - 80;
      statusLabel.textContent = "地铁启动了…";
      if (window.GameAudio && GameAudio.startTrainLoop) {
        GameAudio.startTrainLoop();
        GameAudio.setTrainLoopSpeed(1);
      }
      subwayAnnounce(
        "列车启动，请您站稳扶好，本次列车开往蓝月桥，下一站蓝月桥站。",
        5
      );
    }

    function beginPushOut() {
      if (!subwayScene) return;
      if (subwayScene.trainPhase === "rush" || subwayScene.trainPhase === "pushed") return;
      subwayScene.trainPhase = "rush";
      subwayScene.rushT = 0;
      subwayScene.pushFx = 0;
      subwayToast("乘客冲向车门！", 2);
      statusLabel.textContent = "人群冲向车门…";
      if (window.GameAudio) GameAudio.playClick();
    }

    function beginPlayerSqueezed() {
      if (!subwayScene || subwayScene.trainPhase === "pushed") return;
      subwayScene.trainPhase = "pushed";
      subwayScene.pushFx = 1.8;
      subwayToast("你被挤出列车！", 2);
      statusLabel.textContent = "蓝月桥站 · 被挤出车厢";
      shake = Math.max(shake, 18);
      if (window.GameAudio) GameAudio.playClick();
      setTimeout(() => finishSubwayLevel(), 1800);
    }

    function finishSubwayLevel() {
      if (!subwayScene || subwayScene.phase === "done") return;
      subwayScene.phase = "done";
      subwayScene.trainPhase = "done";
      if (window.GameAudio && GameAudio.stopTrainLoop) GameAudio.stopTrainLoop();
      hideSubwayPhone();
      hideTicketPanel();
      hideElevPanel();
      clearAnnounce();
      syncSubwayPhoneBtn();
      statusLabel.textContent = "到达蓝月桥！";
      winLevel();
    }

    function updateSubway15(dt) {
      if (!subwayScene || state !== "playing" || level !== 15) return;
      const ts = subwayScene;

      GameLevelKit.tickToast(ts, dt);
      if (ts.announceT > 0) {
        ts.announceT -= dt;
        if (ts.announceT <= 0) {
          ts.announce = "";
          clearAnnounce();
        }
      }
      if (ts.paymentFlash > 0) {
        ts.paymentFlash -= dt;
        if (subwayScene.ticketPanelOpen) renderTicketPanel();
      }

      if (ts.onTrain) {
        ts.rideT += dt;
        if (player) {
          player.vx = 0;
          player.vy = 0;
        }
        if (ts.pushFx > 0) ts.pushFx = Math.max(0, ts.pushFx - dt);

        const phase = ts.trainPhase;
        if (phase === "tunnel") {
          // 站距拉长：隧道行驶约 14 秒
          ts.tunnelScroll += dt * 420;
          if (window.GameAudio && GameAudio.setTrainLoopSpeed) GameAudio.setTrainLoopSpeed(1);
          if (ts.rideT > 14) {
            ts.trainPhase = "arrive";
            if (window.GameAudio && GameAudio.playTrainArriveChime) {
              GameAudio.playTrainArriveChime();
            }
            subwayAnnounce(
              "蓝月桥站到了，请做好准备下车，因本站是终点站，请全员下车。",
              5
            );
          }
        } else if (phase === "arrive") {
          ts.tunnelScroll += dt * 180;
          if (window.GameAudio && GameAudio.setTrainLoopSpeed) GameAudio.setTrainLoopSpeed(0.45);
          if (ts.rideT > 17) {
            ts.trainPhase = "cabStop";
            ts.doorLight = "red";
            subwayToast("列车到站停车", 1.5);
            if (window.GameAudio && GameAudio.stopTrainLoop) GameAudio.stopTrainLoop();
          }
        } else if (phase === "cabStop") {
          ts.tunnelScroll += dt * 20;
          if (ts.rideT > 18) {
            ts.trainPhase = "cabOpen";
            ts.doorLight = "green";
            if (window.GameAudio && GameAudio.playDoorChime) GameAudio.playDoorChime("open");
          }
        } else if (phase === "cabOpen") {
          ts.interiorDoorOpen = Math.min(1, (ts.interiorDoorOpen || 0) + dt * 1.2);
          ts.doorOpen = ts.interiorDoorOpen;
          ts.screenDoorOpen = ts.interiorDoorOpen;
          if (ts.interiorDoorOpen >= 1 && ts.rideT > 20) {
            beginPushOut();
          }
        } else if (phase === "rush") {
          ts.interiorDoorOpen = 1;
          ts.rushT += dt;
          const pax = ts.cabinPassengers || [];
          for (const p of pax) {
            if (p.gone) continue;
            const localT = ts.rushT - p.delay;
            if (localT < 0) continue;
            if (localT < 0.28) {
              // 蹦下座位
              p.hopped = true;
              const u = localT / 0.28;
              p.x = p.seatX;
              p.y = p.seatY - Math.sin(u * Math.PI) * 28 - u * 10;
            } else {
              const u = Math.min(1, (localT - 0.28) / 0.85);
              p.x = p.seatX + (p.doorX - p.seatX) * u;
              p.y = p.seatY - 10 + (p.doorY - (p.seatY - 10)) * u;
              if (u >= 1) p.gone = true;
            }
          }
          if (ts.rushT > 1.35) beginPlayerSqueezed();
        } else if (phase === "pushed") {
          ts.interiorDoorOpen = 1;
          const pax = ts.cabinPassengers || [];
          for (const p of pax) {
            if (!p.gone) {
              p.x += (p.doorX - p.x) * Math.min(1, dt * 8);
              p.y += (p.doorY - 40 - p.y) * Math.min(1, dt * 8);
              if (Math.hypot(p.x - p.doorX, p.y - (p.doorY - 40)) < 12) p.gone = true;
            }
          }
        }
        return;
      }

      if (ts.zone === "B2" && ts.onPlatform && !ts.onTrain) {
        ts.trainTimer += dt;
        if (ts.trainPhase === "idle" && ts.trainTimer > 7) {
          ts.trainCount += 1;
          ts.trainTimer = 0;
          ts.trainArriving = true;
          ts.trainPhase = "approach";
          ts.trainT = 0;
          ts.trainX = -420;
          ts.doorOpen = 0;
          ts.screenDoorOpen = 0;
          ts.doorLight = "red";
          if (window.GameAudio && GameAudio.startTrainLoop) {
            GameAudio.startTrainLoop();
            GameAudio.setTrainLoopSpeed(0.85);
          }
          if (window.GameAudio && GameAudio.playTrainArriveChime) {
            GameAudio.playTrainArriveChime();
          }
        }

        if (ts.trainPhase === "approach") {
          ts.trainT += dt;
          ts.trainX += dt * 260;
          if (window.GameAudio && GameAudio.setTrainLoopSpeed) GameAudio.setTrainLoopSpeed(0.7);
          if (ts.trainX >= ts.trainParkX) {
            ts.trainX = ts.trainParkX;
            ts.trainPhase = "stop";
            ts.trainT = 0;
            subwayToast("列车已停车", 1.2);
            if (window.GameAudio) {
              if (GameAudio.stopTrainLoop) GameAudio.stopTrainLoop();
              GameAudio.playClick();
            }
          }
        } else if (ts.trainPhase === "stop") {
          ts.trainT += dt;
          if (ts.trainT > 0.6) {
            ts.trainPhase = "open";
            ts.trainT = 0;
            ts.doorLight = "green";
            subwayToast("开门请上下客", 1.5);
            if (window.GameAudio && GameAudio.playDoorChime) GameAudio.playDoorChime("open");
          }
        } else if (ts.trainPhase === "open") {
          ts.trainT += dt;
          ts.doorOpen = Math.min(1, ts.doorOpen + dt * 1.4);
          ts.screenDoorOpen = Math.min(1, ts.screenDoorOpen + dt * 1.4);
          if (ts.doorOpen >= 1) {
            ts.trainPhase = "dwell";
            ts.trainT = 0;
          }
        } else if (ts.trainPhase === "dwell") {
          ts.trainT += dt;
          ts.doorOpen = 1;
          ts.screenDoorOpen = 1;
          if (ts.trainT > 2.2) {
            ts.trainPhase = "close";
            ts.trainT = 0;
            ts.doorLight = "red";
            subwayToast("车门关闭，请勿靠近", 1.5);
            if (window.GameAudio && GameAudio.playDoorChime) GameAudio.playDoorChime("close");
          }
        } else if (ts.trainPhase === "close") {
          ts.trainT += dt;
          ts.doorOpen = Math.max(0, ts.doorOpen - dt * 1.5);
          ts.screenDoorOpen = Math.max(0, ts.screenDoorOpen - dt * 1.5);
          if (ts.doorOpen <= 0) {
            ts.trainPhase = "depart";
            ts.trainT = 0;
            if (window.GameAudio && GameAudio.startTrainLoop) {
              GameAudio.startTrainLoop();
              GameAudio.setTrainLoopSpeed(0.55);
            }
          }
        } else if (ts.trainPhase === "depart") {
          ts.trainT += dt;
          ts.trainX += dt * 280;
          if (window.GameAudio && GameAudio.setTrainLoopSpeed) {
            GameAudio.setTrainLoopSpeed(Math.min(1.1, 0.55 + ts.trainT * 0.2));
          }
          if (ts.trainX > 1100) {
            ts.trainArriving = false;
            ts.trainPhase = "idle";
            ts.trainTimer = 0;
            ts.doorOpen = 0;
            ts.screenDoorOpen = 0;
            ts.doorLight = "red";
            if (window.GameAudio && GameAudio.stopTrainLoop) GameAudio.stopTrainLoop();
            if (ts.trainCount < 4) {
              subwayToast(`第 ${ts.trainCount} 列地铁 · 人太多了，挤不上`, 2.5);
            } else {
              subwayToast("终于挤上了第 4 列地铁！", 2);
              startTrainRide();
            }
          }
        }
      }

      const gy = ts.groundY;
      if (ts.zone === "1F") {
        ts.elevatorHit = { x: 740, y: gy - 180, w: 80, h: 180 };
        ts.ticketHit = null;
        ts.gateHit = null;
        ts.platElevHit = null;
      } else if (ts.zone === "B1") {
        // 过闸前：右侧电梯回 1F；过闸后：同一位置变为乘车层电梯去 B2
        ts.elevatorHit = ts.gatePassed ? null : { x: 740, y: gy - 180, w: 80, h: 180 };
        ts.ticketHit = ts.gatePassed ? null : { x: 320, y: gy - 130, w: 100, h: 120 };
        ts.gateHit = ts.gatePassed ? null : { x: 520, y: gy - 100, w: 50, h: 90 };
        ts.platElevHit = ts.gatePassed ? { x: 740, y: gy - 180, w: 80, h: 180 } : null;
      } else if (ts.zone === "B2") {
        ts.elevatorHit = null;
        ts.ticketHit = null;
        ts.gateHit = null;
        ts.platElevHit = { x: 70, y: gy - 180, w: 80, h: 180 };
      } else {
        ts.elevatorHit = ts.ticketHit = ts.gateHit = ts.platElevHit = null;
      }

      syncSubwayPhoneBtn();
    }

    function drawSubwayExtras() {
      if (!subwayScene || level !== 15) return;
      const ts = subwayScene;
      const cam = cameraX;

      if (ts.onTrain) {
        drawTrainInterior(ts, cam);
        if (ts.toast) drawSubwayToast(ts);
        return;
      }

      if (ts.zone === "1F") drawCitySkyline(cam);
      if (ts.zone === "B1") drawSubwayLobbyBg(ts, cam);
      if (ts.zone === "B2") drawPlatformBg(ts, cam);
      if (ts.toast) drawSubwayToast(ts);
    }

    function drawSubwayForeground() {
      if (!subwayScene || level !== 15 || subwayScene.onTrain) return;
      const ts = subwayScene;
      const cam = cameraX;

      if (ts.zone === "1F") {
        drawElevatorShaft(ts, cam, "city");
      } else if (ts.zone === "B1") {
        if (!ts.gatePassed) {
          drawTicketMachine(320 - cam, ts.groundY - 130);
          drawGate(520 - cam, ts.groundY - 100, ts.hasTicket);
          drawElevatorShaft(ts, cam, "city");
        } else {
          drawElevatorShaft(ts, cam, "platform");
          ctx.fillStyle = "#4ade80";
          ctx.font = "11px 'Noto Sans SC', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("✓ 已进站 · 点右侧电梯去 B2", 480 - cam + cameraX, ts.groundY - 60);
        }
      } else if (ts.zone === "B2") {
        drawElevatorShaft(ts, cam, "platform-left");
        drawTrainBoard(ts, cam);
      }
    }

    function drawCitySkyline(cam) {
      ctx.fillStyle = "#1a2844";
      ctx.fillRect(0 - cam, 80, 400, 120);
      ctx.fillStyle = "#243656";
      ctx.fillRect(420 - cam, 100, 180, 100);
      ctx.fillStyle = "#ffd24a";
      ctx.font = "11px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("城市 · 1 层", 24 - cam + cameraX, 60);
    }

    function drawElevatorShaft(ts, cam, kind) {
      const specs = {
        city: { x: 760, label: "电梯", hint: "B1 ↓" },
        platform: { x: 760, label: "乘车层", hint: "B2 ↓" },
        "platform-left": { x: 80, label: "乘车层", hint: "B1 ↑" },
      };
      const spec = specs[kind] || specs.city;
      const ex = spec.x - cam;
      const baseY = ts.groundY - 180;
      ctx.fillStyle = "#555";
      ctx.fillRect(ex, baseY, 64, 180);
      ctx.fillStyle = "#888";
      ctx.fillRect(ex + 6, baseY + 8, 52, 164);
      ctx.fillStyle = "#ffd24a";
      ctx.fillRect(ex + 4, baseY + 4, 56, 14);
      ctx.fillStyle = "#222";
      ctx.font = "bold 9px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(spec.label, ex + 32, baseY + 14);
      ctx.fillStyle = "#333";
      ctx.font = "10px 'Noto Sans SC', sans-serif";
      ctx.fillText("点击选层", ex + 32, baseY + 30);
      ctx.fillStyle = "#ffd24a";
      ctx.beginPath();
      ctx.moveTo(ex + 32, baseY + 150);
      ctx.lineTo(ex + 22, baseY + 138);
      ctx.lineTo(ex + 42, baseY + 138);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px 'Noto Sans SC', sans-serif";
      ctx.fillText(spec.hint, ex + 32, baseY + 134);
    }

    function drawSubwayLobbyBg(ts, cam) {
      const y = ts.groundY - 140;
      ctx.fillStyle = "#1a3a4a";
      ctx.fillRect(0, 0, W, ts.groundY - 42);
      ctx.fillStyle = "#2a6b8a";
      ctx.fillRect(40 - cam, y, 880, 30);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🚇 跑酷地铁 · B1 站厅", 480 - cam + cameraX, y + 20);
    }

    function drawPlatformBg(ts, cam) {
      const py = ts.groundY;
      // 站台黄线
      ctx.fillStyle = "#ffd24a";
      ctx.fillRect(0 - cam, py - 8, 960, 4);
      ctx.fillStyle = "#fff";
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("B2 乘车层 · 二号线", 24 - cam + cameraX, py - 20);

      // 列车在屏蔽门 / 人群 / 玩家后面
      if (ts.trainPhase !== "idle" && ts.trainArriving) {
        drawTrainCar(ts.trainX - cam, py - 78, ts);
      }

      // 屏蔽门（站台边缘）
      drawScreenDoors(ts, cam, py);

      for (const c of ts.crowd) {
        const bob = Math.sin(time * 2 + c.bob) * 2;
        const cx = c.x - cam;
        const cy = py - 36 + bob;
        ctx.fillStyle = "#ff9966";
        ctx.fillRect(cx, cy, 14, 22);
        ctx.fillStyle = "#333";
        ctx.fillRect(cx + 2, cy - 8, 10, 8);
      }
    }

    function drawTrainBoard(ts, cam) {
      const bx = 280 - cam;
      const by = 70;
      const bw = 400;
      const bh = 72;
      ctx.fillStyle = "#1a1f28";
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = "#3a8fd9";
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.fillStyle = "#0d3a2a";
      ctx.fillRect(bx + 8, by + 8, bw - 16, bh - 16);

      let line = "";
      const phase = ts.trainPhase;
      if (phase === "approach") line = "列车进站中…";
      else if (phase === "stop") line = "列车停车中";
      else if (phase === "open" || phase === "dwell") line = "车门已开 · 请上下客";
      else if (phase === "close") line = "车门关闭中";
      else if (phase === "depart") line = "列车离站中…";
      else {
        const remain = Math.max(0, Math.ceil(7 - (ts.trainTimer || 0)));
        line = `下次列车进站时间为 ${remain} 秒`;
      }
      ctx.fillStyle = "#4ade80";
      ctx.font = "bold 16px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(line, bx + bw / 2, by + 42);
      ctx.fillStyle = "#9ab";
      ctx.font = "11px 'Noto Sans SC', sans-serif";
      const nextNo = Math.min(4, (ts.trainCount || 0) + 1);
      const shown = phase === "idle" ? nextNo : Math.min(4, Math.max(1, ts.trainCount || 1));
      ctx.fillText(`二号线 · 开往蓝月桥 · 第 ${shown} / 4 列`, bx + bw / 2, by + 60);
    }

    function drawScreenDoors(ts, cam, py) {
      const open = ts.screenDoorOpen || 0;
      const doorH = 70;
      const doorY = py - doorH - 6;
      // 与停车时车门世界坐标对齐
      const bays = doorWorldBays(ts.trainParkX || 160);
      const spanL = bays[0].x - 20;
      const spanR = bays[bays.length - 1].x + bays[bays.length - 1].w + 20;

      ctx.fillStyle = "rgba(180, 200, 220, 0.28)";
      ctx.fillRect(spanL - cam, doorY, spanR - spanL, doorH);
      ctx.strokeStyle = "#8aa";
      ctx.lineWidth = 2;
      ctx.strokeRect(spanL - cam, doorY, spanR - spanL, doorH);

      for (const bay of bays) {
        const half = (bay.w / 2) * (1 - open);
        const leftX = bay.x - cam;
        const mid = leftX + bay.w / 2;
        ctx.fillStyle = "rgba(200, 220, 240, 0.82)";
        ctx.fillRect(leftX, doorY + 2, half, doorH - 4);
        ctx.fillRect(mid + (bay.w / 2 - half), doorY + 2, half, doorH - 4);
        ctx.strokeStyle = "#6a8";
        ctx.strokeRect(leftX, doorY + 2, half, doorH - 4);
        ctx.strokeRect(mid + (bay.w / 2 - half), doorY + 2, half, doorH - 4);

        const lightOn = ts.doorLight === "green" ? "#3d3" : "#e33";
        const blink =
          (ts.trainPhase === "open" || ts.trainPhase === "close") && Math.floor(time * 6) % 2 === 0;
        ctx.fillStyle = blink ? "#fff" : lightOn;
        ctx.beginPath();
        ctx.arc(mid, doorY - 8, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ccc";
        ctx.font = "8px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(ts.doorLight === "green" ? "开" : "关", mid, doorY - 16);
      }

      if (ts.trainPhase === "open" || ts.trainPhase === "dwell") {
        ctx.fillStyle = "#3d3";
        ctx.font = "bold 11px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("▲ 开门 ▲", 480 - cam + cameraX, doorY - 28);
      } else if (ts.trainPhase === "close") {
        ctx.fillStyle = "#e44";
        ctx.fillText("▼ 关门 ▼", 480 - cam + cameraX, doorY - 28);
      }
    }

    function drawTrainCar(sx, sy, ts) {
      const tw = 420;
      const th = 72;
      ctx.fillStyle = "#c0392b";
      ctx.fillRect(sx, sy, tw, th);
      ctx.fillStyle = "#a93226";
      ctx.fillRect(sx, sy + th - 10, tw, 10);
      ctx.fillStyle = "#ffe566";
      ctx.fillRect(sx + tw - 14, sy + 18, 8, 12);
      ctx.fillRect(sx + tw - 14, sy + 36, 8, 12);

      const open = ts.doorOpen || 0;
      // 车窗（门之间）
      const winGaps = [
        [8, 36],
        [98, 34],
        [188, 34],
        [278, 34],
        [368, 36],
      ];
      for (const [wx, ww] of winGaps) {
        ctx.fillStyle = "#1a2a3a";
        ctx.fillRect(sx + wx, sy + 14, ww, 28);
        ctx.fillStyle = "rgba(120, 190, 230, 0.55)";
        ctx.fillRect(sx + wx + 2, sy + 16, ww - 4, 24);
      }

      for (const off of TRAIN_DOOR_OFFSETS) {
        const dx = sx + off;
        const half = (TRAIN_DOOR_W / 2) * (1 - open);
        ctx.fillStyle = "#1a1a22";
        ctx.fillRect(dx, sy + 10, TRAIN_DOOR_W, 50);
        ctx.fillStyle = "#ecf0f1";
        ctx.fillRect(dx, sy + 10, half, 50);
        ctx.fillRect(dx + TRAIN_DOOR_W - half, sy + 10, half, 50);
        const light = ts.doorLight === "green" ? "#2ecc71" : "#e74c3c";
        ctx.fillStyle = light;
        ctx.fillRect(dx + TRAIN_DOOR_W / 2 - 4, sy + 2, 8, 6);
      }

      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("2号线 · 蓝月桥", sx + tw / 2, sy + 44);
    }

    function drawTunnelThroughWindow(x, y, w, h, scroll, arriving) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      ctx.fillStyle = arriving ? "#2a3540" : "#12161c";
      ctx.fillRect(x, y, w, h);
      const speed = scroll || 0;
      // 隧道壁环
      for (let i = -1; i < 8; i++) {
        const rx = x + ((i * 70 - (speed % 70) + 70) % (w + 70)) - 20;
        ctx.fillStyle = arriving ? "#3a4652" : "#1c222a";
        ctx.fillRect(rx, y, 18, h);
        ctx.fillStyle = arriving ? "#ffd24a" : "#445";
        ctx.fillRect(rx + 6, y + h * 0.35, 4, 8);
      }
      // 轨道线
      ctx.strokeStyle = arriving ? "#888" : "#333";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y + h - 8);
      ctx.lineTo(x + w, y + h - 8);
      ctx.stroke();
      if (arriving) {
        ctx.fillStyle = "rgba(255, 210, 74, 0.35)";
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = "#ffd24a";
        ctx.font = "10px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("蓝月桥站", x + w / 2, y + h / 2 + 4);
      }
      ctx.restore();
      ctx.strokeStyle = "#89a";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
    }

    function drawTrainInterior(ts, cam) {
      const phase = ts.trainPhase;
      const arriving =
        phase === "arrive" ||
        phase === "cabStop" ||
        phase === "cabOpen" ||
        phase === "rush" ||
        phase === "pushed";
      const doorOpen = ts.interiorDoorOpen || 0;
      const rushing = phase === "rush" || phase === "pushed";
      const pax = ts.cabinPassengers || [];

      // 车厢墙
      ctx.fillStyle = "#2c3440";
      ctx.fillRect(0, 0, W, H);

      // 车顶到站屏幕
      ctx.fillStyle = "#111820";
      ctx.fillRect(120, 24, 720, 56);
      ctx.strokeStyle = "#3a8fd9";
      ctx.lineWidth = 2;
      ctx.strokeRect(120, 24, 720, 56);
      ctx.fillStyle = "#0a2a1a";
      ctx.fillRect(128, 32, 704, 40);
      let boardMsg = "下一站：蓝月桥站";
      if (phase === "tunnel") boardMsg = "运行中 · 开往蓝月桥";
      else if (phase === "arrive") boardMsg = "即将到站：蓝月桥";
      else if (phase === "cabStop" || phase === "cabOpen") boardMsg = "本站：蓝月桥（终点站）请下车";
      else if (phase === "rush") boardMsg = "请有序下车 · 乘客冲向车门";
      else if (phase === "pushed") boardMsg = "蓝月桥站 · 请全员下车";
      ctx.fillStyle = "#4ade80";
      ctx.font = "bold 18px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(boardMsg, W / 2, 58);

      // 车窗
      const winY = 100;
      const winH = 110;
      const windows = [
        { x: 40, w: 100 },
        { x: 160, w: 100 },
        { x: 700, w: 100 },
        { x: 820, w: 100 },
      ];
      for (const win of windows) {
        drawTunnelThroughWindow(win.x, winY, win.w, winH, ts.tunnelScroll, arriving && phase !== "tunnel");
      }

      // 蓝色地板
      ctx.fillStyle = "#1e5f9a";
      ctx.fillRect(0, 320, W, H - 320);
      ctx.fillStyle = "#2470b5";
      for (let i = 0; i < 12; i++) {
        ctx.fillRect(i * 90, 320, 40, H - 320);
      }
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(0, 320, W, 6);

      // 座椅（空座位或仍坐着的乘客）
      for (let i = 0; i < 8; i++) {
        const sx = 60 + i * 105;
        ctx.fillStyle = "#34495e";
        ctx.fillRect(sx, 230, 70, 36);
        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(sx, 218, 70, 14);
        ctx.fillStyle = "#34495e";
        ctx.fillRect(sx, 360, 70, 36);
        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(sx, 348, 70, 14);
      }

      if (!rushing) {
        for (const p of pax) {
          drawPassengerFig(p.seatX, p.seatY, p.color);
        }
      }

      // 站立乘客（非冲门阶段）
      if (!rushing) {
        for (let i = 0; i < 14; i++) {
          const cx = 100 + (i % 7) * 110 + Math.sin(time * 2 + i) * 3;
          const cy = 280 + (i > 6 ? 30 : 0);
          drawPassengerFig(cx, cy, "#888");
        }
      }

      // 车内屏蔽门
      const doorY = 200;
      const doorH = 140;
      const doorBays = [
        { x: 300, w: 70 },
        { x: 450, w: 70 },
        { x: 600, w: 70 },
      ];
      for (const bay of doorBays) {
        const half = (bay.w / 2) * (1 - doorOpen);
        const mid = bay.x + bay.w / 2;
        ctx.fillStyle = arriving ? "#3a4a3a" : "#0d1014";
        ctx.fillRect(bay.x, doorY, bay.w, doorH);
        if (arriving && doorOpen > 0.3) {
          ctx.fillStyle = "#ffd24a";
          ctx.font = "10px 'Noto Sans SC', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("站台", mid, doorY + doorH / 2);
        }
        ctx.fillStyle = "rgba(190, 210, 230, 0.9)";
        ctx.fillRect(bay.x, doorY, half, doorH);
        ctx.fillRect(mid + (bay.w / 2 - half), doorY, half, doorH);
        ctx.strokeStyle = "#7a9";
        ctx.strokeRect(bay.x, doorY, half, doorH);
        ctx.strokeRect(mid + (bay.w / 2 - half), doorY, half, doorH);
        ctx.fillStyle = ts.doorLight === "green" ? "#2ecc71" : "#e74c3c";
        ctx.beginPath();
        ctx.arc(mid, doorY - 10, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // 冲门中的乘客（蹦下座位 → 冲向门）
      if (rushing) {
        for (const p of pax) {
          if (p.gone) continue;
          drawPassengerFig(p.x, p.y, p.color);
        }
      }

      // 玩家：正常皮肤
      if (player && phase !== "pushed") {
        const swing =
          rushing && Math.abs(0.2) > 0 ? Math.sin(time * 16) * 4 : 0;
        drawPlayerSkin(W / 2 - 14, 286, 1, { swing });
        if (!rushing) {
          ctx.fillStyle = "#ffe27a";
          ctx.font = "11px 'Noto Sans SC', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("无座", W / 2, 340);
        }
      }

      // 玩家被挤出
      if (phase === "pushed") {
        const t = ts.pushFx || 0;
        const force = 1 - Math.min(1, t / 1.8);
        ctx.fillStyle = `rgba(255, 80, 40, ${0.12 + force * 0.2})`;
        ctx.fillRect(0, 0, W, H);
        // 乘客继续涌出门外
        for (const p of pax) {
          if (p.gone) {
            const outX = p.doorX + force * 40 + Math.sin(p.seatX) * 10;
            const outY = p.doorY - 20 - force * 60;
            drawPassengerFig(outX, outY, p.color, 0.9);
          }
        }
        const flyX = W / 2 - 14 + force * 260;
        const flyY = 260 + force * 90;
        drawPlayerSkin(flyX, flyY, 1, {
          hop: Math.sin(force * Math.PI) * -8,
          swing: Math.sin(time * 20) * 5,
        });
        ctx.fillStyle = "#fff";
        ctx.font = "bold 22px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.strokeStyle = "rgba(0,0,0,0.7)";
        ctx.lineWidth = 4;
        ctx.strokeText("被挤出去了！", W / 2, 120);
        ctx.fillText("被挤出去了！", W / 2, 120);
      }

      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      if (phase === "tunnel") {
        ctx.fillText("车厢拥挤 · 透过车窗可见隧道飞速掠过", W / 2, H - 24);
      } else if (phase === "cabOpen") {
        ctx.fillText("屏蔽门打开…", W / 2, H - 24);
      } else if (phase === "rush") {
        ctx.fillText("座位上的乘客蹦下来，冲向车门！", W / 2, H - 24);
      }
    }

    function drawTicketMachine(sx, sy) {
      ctx.fillStyle = "#444";
      ctx.fillRect(sx, sy, 100, 120);
      ctx.fillStyle = "#222";
      ctx.fillRect(sx + 8, sy + 10, 84, 50);
      ctx.fillStyle = "#5ce1ff";
      ctx.font = "10px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("售票机", sx + 50, sy + 38);
      ctx.fillStyle = "#ffd24a";
      ctx.fillRect(sx + 20, sy + 70, 60, 14);
      ctx.fillStyle = "#222";
      ctx.font = "9px 'Noto Sans SC', sans-serif";
      ctx.fillText("点击购票", sx + 50, sy + 80);
    }

    function drawGate(sx, sy, hasTicket) {
      ctx.fillStyle = hasTicket ? "#4ade80" : "#888";
      ctx.fillRect(sx, sy, 50, 90);
      ctx.strokeStyle = "#ccc";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx + 25, sy);
      ctx.lineTo(sx + 25, sy + 90);
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "9px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(hasTicket ? "刷票进站" : "闸机", sx + 25, sy + 50);
    }

    function drawSubwayToast(ts) {
      ctx.fillStyle = "rgba(0,0,0,0.72)";
      ctx.fillRect(W / 2 - 160, H - 72, 320, 36);
      ctx.fillStyle = "#ffd24a";
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(ts.toast, W / 2, H - 48);
    }

    function tryClickSubway15(clientX, clientY) {
      if (state !== "playing" || !subwayScene || level !== 15) return false;
      const ts = subwayScene;
      if (ts.onTrain || ts.elevPanelOpen || ts.ticketPanelOpen) return false;

      const world = clientToWorld(clientX, clientY);
      const wy = world.y;
      const wx = world.x;

      function hit(h) {
        return h && wx >= h.x && wx <= h.x + h.w && wy >= h.y && wy <= h.y + h.h;
      }

      // 城市电梯（1F / B1 过闸前）：选 1F ↔ B1
      if (hit(ts.elevatorHit)) {
        openElevPanel("city");
        return true;
      }
      // 乘车层电梯（B1 过闸后 / B2）：选 B1 ↔ B2
      if (hit(ts.platElevHit)) {
        openElevPanel("platform");
        return true;
      }
      if (hit(ts.ticketHit)) {
        openTicketPanel();
        return true;
      }
      if (hit(ts.gateHit)) {
        tryPassGate();
        return true;
      }
      return false;
    }

    function syncSubway15OnLeave() {
      hideSubwayPhone();
      hideTicketPanel();
      hideElevPanel();
      clearAnnounce();
      syncSubwayPhoneBtn();
      if (window.GameAudio && GameAudio.stopTrainLoop) GameAudio.stopTrainLoop();
    }

    S.initSubway15 = initSubway15;
    S.updateSubway15 = updateSubway15;
    S.drawSubwayExtras = drawSubwayExtras;
    S.drawSubwayForeground = drawSubwayForeground;
    S.tryClickSubway15 = tryClickSubway15;
    S.syncSubway15OnLeave = syncSubway15OnLeave;
  }
};
