// 第 14 关：123 层大厦 · 手机点外卖 · 地图搜机场
window.installTower14 = function (S) {
  with (S) {
    const phoneWrap = document.getElementById("lv14-phone-wrap");
    const phoneScreen = document.getElementById("lv14-phone-screen");
    const phoneBtn = document.getElementById("lv14-phone-btn");
    const phoneClose = document.getElementById("lv14-phone-close");
    let phoneBound = false;
    const MAP_AIRPORT = "跑酷国际机场";

    function towerToast(msg, sec) {
      if (!towerScene) return;
      towerScene.toast = msg;
      towerScene.toastT = sec || 2.5;
    }

    function syncTowerPhoneBtn() {
      if (!phoneBtn) return;
      const show = level === 14 && state === "playing" && towerScene && towerScene.phoneCharged;
      phoneBtn.classList.toggle("hidden", !show);
    }

    function hideTowerPhone() {
      if (!towerScene) return;
      towerScene.phoneOpen = false;
      towerScene.currentApp = null;
      if (phoneWrap) {
        phoneWrap.classList.add("hidden");
        phoneWrap.setAttribute("aria-hidden", "true");
      }
    }

    function renderPhoneHome() {
      if (!phoneScreen || !towerScene) return;
      phoneScreen.className = "lv14-phone-screen lv14-home";
      const mapApp =
        towerScene.phase === "delivery" || towerScene.ordered
          ? `<button type="button" class="lv14-app" data-app="map">
            <span class="lv14-app-icon map">图</span>
            <span>地图</span>
          </button>`
          : "";
      phoneScreen.innerHTML = `
        <div class="lv14-status-bar"><span>100%</span><span>23:14</span></div>
        <div class="lv14-app-grid">
          <button type="button" class="lv14-app" data-app="meitu">
            <span class="lv14-app-icon meitu">美</span>
            <span>美图</span>
          </button>
          <button type="button" class="lv14-app" data-app="jifu">
            <span class="lv14-app-icon jifu">鸡</span>
            <span>鸡付宝</span>
          </button>
          ${mapApp}
        </div>
        <p class="lv14-hint">${towerScene.ordered ? "打开地图，搜索「跑酷国际机场」" : "美图点外卖 · 鸡付宝看余额"}</p>`;
    }

    function renderPhoneDead() {
      if (!phoneScreen) return;
      phoneScreen.className = "lv14-phone-screen lv14-dead";
      phoneScreen.innerHTML = `
        <div class="lv14-dead-battery">🔋 0%</div>
        <p>手机没电了</p>
        <p class="lv14-hint">先点击房间里的充电器</p>`;
    }

    function renderPhoneCharging() {
      if (!phoneScreen) return;
      phoneScreen.className = "lv14-phone-screen lv14-charging";
      const pct = towerScene ? Math.min(100, Math.floor((towerScene.chargeT / 1.6) * 100)) : 0;
      phoneScreen.innerHTML = `
        <div class="lv14-charge-ring">${pct}%</div>
        <p>充电中…</p>`;
    }

    function renderMeitu() {
      if (!phoneScreen || !towerScene) return;
      phoneScreen.className = "lv14-phone-screen lv14-app-view";
      const items = towerScene.menu
        .map(
          (it) =>
            `<button type="button" class="lv14-food" data-item="${it.id}" data-price="${it.price}">
              <span>${it.name}</span><strong>¥${it.price}</strong>
            </button>`
        )
        .join("");
      phoneScreen.innerHTML = `
        <div class="lv14-app-top">
          <button type="button" class="lv14-back" data-back="home">←</button>
          <span>美图外卖</span>
        </div>
        <div class="lv14-food-list">${items}</div>
        <p class="lv14-hint">余额 ¥${towerScene.balance} · 只能买一个汉堡哦</p>`;
    }

    function renderJifu() {
      if (!phoneScreen || !towerScene) return;
      phoneScreen.className = "lv14-phone-screen lv14-app-view";
      const name = playerName || "玩家";
      const balPanel = towerScene.showBalance
        ? `<div class="lv14-balance-panel">余额：<strong>¥${towerScene.balance}</strong></div>`
        : "";
      phoneScreen.innerHTML = `
        <div class="lv14-app-top">
          <button type="button" class="lv14-back" data-back="home">←</button>
          <span>鸡付宝</span>
        </div>
        <div class="lv14-jifu">
          <p class="lv14-jifu-name">${escapeHtml(name)}</p>
          <button type="button" class="lv14-balance-btn" data-action="balance">余额</button>
          ${balPanel}
        </div>`;
    }

    function showMapPlane() {
      if (!towerScene || towerScene.planeGiven) return;
      towerScene.mapPlaneShown = true;
      renderMap();
      if (window.GameAudio) GameAudio.playClick();
    }

    function doMapSearch() {
      if (!towerScene || !phoneScreen) return;
      const input = phoneScreen.querySelector("#lv14-map-search");
      const q = (input ? input.value : towerScene.mapSearch || "").trim();
      towerScene.mapSearch = q;
      if (q.includes("跑酷") || q.includes("国际机场") || q === MAP_AIRPORT) {
        towerScene.mapPlaneShown = true;
        towerToast("找到：跑酷国际机场", 2);
      } else if (q) {
        towerToast("未找到该地点，试试「跑酷国际机场」", 2.5);
      } else {
        towerToast("请输入「跑酷国际机场」", 2);
      }
      renderMap();
      if (window.GameAudio) GameAudio.playClick();
    }

    function givePlaneToDelivery() {
      if (!towerScene || towerScene.planeGiven) return;
      const d = towerScene.delivery;
      if (!d.active || towerScene.phase !== "delivery") {
        towerToast("先点外卖，外卖员到了再呼叫飞机", 2.5);
        return;
      }
      towerScene.planeGiven = true;
      towerScene.mapPlaneShown = true;
      d.hasPlane = true;
      d.flying = true;
      hideTowerPhone();
      statusLabel.textContent = "外卖员起飞了！";
      towerToast("外卖小哥坐上飞机，正飞来！", 2.5);
      if (window.GameAudio) GameAudio.playClick();
      spawnBurst(d.x + d.w / 2, d.y, "#8cf", 14);
      shake = 6;
    }

    function renderMap() {
      if (!phoneScreen || !towerScene) return;
      phoneScreen.className = "lv14-phone-screen lv14-app-view";
      const gone = towerScene.planeGiven;
      const q = escapeHtml(towerScene.mapSearch || "");
      phoneScreen.innerHTML = `
        <div class="lv14-app-top">
          <button type="button" class="lv14-back" data-back="home">←</button>
          <span>地图</span>
        </div>
        <div class="lv14-map">
          ${
            gone
              ? `<p class="lv14-hint">飞机已交给外卖小哥</p>`
              : `
            <div class="lv14-map-search-row">
              <input id="lv14-map-search" type="text" placeholder="搜索地点" value="${q}" autocomplete="off" />
              <button type="button" class="lv14-map-search-btn" data-action="map-search">搜索</button>
            </div>
            <button type="button" class="lv14-plane-shortcut" data-action="map-plane-btn">
              <span class="lv14-plane-shortcut-icon">✈️</span>
              <span>飞机</span>
            </button>
            ${
              towerScene.mapPlaneShown
                ? `<div class="lv14-map-result">
                    <p class="lv14-map-place">${MAP_AIRPORT}</p>
                    <button type="button" id="lv14-map-plane" class="lv14-plane-icon lv14-plane-pick">
                      <span class="lv14-plane-art">✈️</span>
                      <span>点击让外卖小哥坐飞机</span>
                    </button>
                  </div>`
                : `<p class="lv14-hint">搜索「${MAP_AIRPORT}」或点黄色飞机按钮</p>`
            }`
          }
        </div>`;
    }

    function openTowerPhone() {
      if (!towerScene || !phoneWrap) return;
      if (!towerScene.phoneCharged) {
        towerScene.phoneOpen = true;
        phoneWrap.classList.remove("hidden");
        phoneWrap.setAttribute("aria-hidden", "false");
        renderPhoneDead();
        return;
      }
      towerScene.phoneOpen = true;
      towerScene.currentApp = "home";
      phoneWrap.classList.remove("hidden");
      phoneWrap.setAttribute("aria-hidden", "false");
      renderPhoneHome();
    }

    function renderPhoneApp(app) {
      if (!towerScene) return;
      towerScene.currentApp = app;
      if (app === "home") renderPhoneHome();
      else if (app === "meitu") renderMeitu();
      else if (app === "jifu") renderJifu();
      else if (app === "map") renderMap();
    }

    function startCharge() {
      if (!towerScene || towerScene.phoneCharged || towerScene.charging) return;
      towerScene.charging = true;
      towerScene.chargeT = 0;
      statusLabel.textContent = "手机充电中…";
      if (window.GameAudio) GameAudio.playClick();
      if (towerScene.phoneOpen) renderPhoneCharging();
    }

    function finishCharge() {
      if (!towerScene) return;
      towerScene.charging = false;
      towerScene.phoneCharged = true;
      statusLabel.textContent = "手机已充满，掏出来用吧";
      towerToast("手机充满电了！", 2);
      syncTowerPhoneBtn();
      if (towerScene.phoneOpen) renderPhoneHome();
      if (window.GameAudio) GameAudio.playClick();
    }

    function placeOrder(itemId, price) {
      if (!towerScene || towerScene.ordered) return;
      if (towerScene.balance < price) {
        towerToast("手机余额不足，请充值", 2.5);
        if (window.GameAudio) GameAudio.playClick();
        return;
      }
      const item = towerScene.menu.find((m) => m.id === itemId);
      towerScene.balance -= price;
      towerScene.ordered = true;
      towerScene.orderItem = item ? item.name : "汉堡";
      towerScene.phase = "delivery";
      towerScene.cameraTarget = "delivery";
      const d = towerScene.delivery;
      d.active = true;
      d.floor = 1;
      d.y = towerScene.floorY(1) - 40;
      d.cancelled = false;
      d.delivered = false;
      d.hasPlane = false;
      d.flying = false;
      statusLabel.textContent = "外卖员在一楼，快想办法！";
      towerToast(`已下单：${towerScene.orderItem}`, 2);
      hideTowerPhone();
      if (window.GameAudio) GameAudio.playClick();
      shake = 6;
    }

    function cancelOrder() {
      if (!towerScene) return;
      hideTowerPhone();
      towerScene.phase = "failed";
      towerScene.delivery.cancelled = true;
      towerScene.delivery.active = false;
      statusLabel.textContent = "订单已取消";
      state = "dead";
      showOverlay(
        "订单被删除了",
        "外卖小哥爬到 100 层，没有电梯，订单取消了。<br />下次记得：打开<strong>地图</strong>，搜索「跑酷国际机场」，点飞机给外卖小哥！",
        "重试",
        { hideHint: true }
      );
    }

    function winTower() {
      if (!towerScene || towerScene.phase === "won") return;
      towerScene.phase = "won";
      towerScene.delivery.delivered = true;
      towerScene.delivery.active = false;
      statusLabel.textContent = "外卖到手！";
      spawnBurst(player.x + player.w / 2, player.y, "#ffe566", 20);
      if (window.GameAudio) GameAudio.playClick();
      setTimeout(() => winLevel(), 600);
    }

    function bindTowerPhone() {
      if (phoneBound) return;
      phoneBound = true;

      if (phoneBtn) {
        phoneBtn.addEventListener("click", () => {
          if (level !== 14) return;
          playUiClick();
          openTowerPhone();
        });
      }
      if (phoneClose) {
        phoneClose.addEventListener("click", () => {
          playUiClick();
          hideTowerPhone();
        });
      }
      if (phoneScreen) {
        phoneScreen.addEventListener("click", (e) => {
          const t = e.target.closest(
            "[data-app],[data-back],[data-item],[data-action],#lv14-map-plane"
          );
          if (!t || !towerScene) return;
          playUiClick();
          if (t.id === "lv14-map-plane") {
            givePlaneToDelivery();
            return;
          }
          if (t.dataset.app) {
            renderPhoneApp(t.dataset.app);
            return;
          }
          if (t.dataset.back) {
            renderPhoneApp(t.dataset.back);
            return;
          }
          if (t.dataset.action === "balance") {
            towerScene.showBalance = !towerScene.showBalance;
            renderJifu();
            return;
          }
          if (t.dataset.action === "map-search") {
            doMapSearch();
            return;
          }
          if (t.dataset.action === "map-plane-btn") {
            showMapPlane();
            return;
          }
          if (t.dataset.item) {
            placeOrder(t.dataset.item, Number(t.dataset.price) || 99);
          }
        });

        phoneScreen.addEventListener("keydown", (e) => {
          if (e.key !== "Enter") return;
          if (e.target.id === "lv14-map-search") {
            e.preventDefault();
            e.stopPropagation();
            doMapSearch();
          }
        });
      }
    }

    function initTower14() {
      bindTowerPhone();
      hideTowerPhone();
      syncTowerPhoneBtn();
      if (towerScene) {
        towerScene.chargerHit = null;
        towerScene.phoneHit = null;
      }
      statusLabel.textContent = "123层大厦 · 手机没电了，先充电";
    }

    function updateTower14(dt) {
      if (!towerScene || state !== "playing") return;
      const ts = towerScene;

      if (ts.toastT > 0) {
        ts.toastT -= dt;
        if (ts.toastT <= 0) ts.toast = "";
      }

      if (ts.charging) {
        ts.chargeT += dt;
        if (ts.phoneOpen && phoneScreen && phoneScreen.classList.contains("lv14-charging")) {
          const pct = Math.min(100, Math.floor((ts.chargeT / 1.6) * 100));
          const ring = phoneScreen.querySelector(".lv14-charge-ring");
          if (ring) ring.textContent = pct + "%";
        }
        if (ts.chargeT >= 1.6) finishCharge();
      }

      const d = ts.delivery;
      if (d.active && !d.delivered && !d.cancelled) {
        d.bob += dt * 5;
        if (d.flying) {
          d.floor += d.flySpeed * dt;
          if (d.floor >= ts.floors) {
            d.floor = ts.floors;
            d.y = ts.floorY(ts.floors) - 40;
            d.active = false;
            winTower();
          } else {
            d.y = ts.floorY(d.floor) - 40;
          }
        } else {
          d.floor += d.climbSpeed * dt;
          d.y = ts.floorY(d.floor) - 40;
          if (!d.hasPlane && d.floor >= 100) {
            cancelOrder();
          }
        }
      }

      // 垂直镜头：玩家在房间时略向下平移，保证墙上有充电器/手机
      const roomFloor = ts.roomFloorY != null ? ts.roomFloorY : ts.floorY(ts.floors) - 20;
      if (ts.cameraTarget === "delivery" && d.active) {
        ts.camYTarget = clamp(H * 0.42 - (d.y + d.h / 2), -180, 80);
      } else {
        const roomMid = roomFloor - 52;
        ts.camYTarget = clamp(Math.round(H * 0.34 - roomMid), 55, 95);
      }
      ts.camY += (ts.camYTarget - ts.camY) * Math.min(1, dt * 4);

      // 123 层房间内：充电器（左墙）· 手机（桌上）
      ts.chargerHit = { x: ts.towerX + 36, y: roomFloor - 58, w: 46, h: 50 };
      ts.phoneHit = { x: ts.towerX + 118, y: roomFloor - 42, w: 52, h: 40 };
    }

    function roundRect(x, y, w, h, r) {
      const rad = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rad, y);
      ctx.lineTo(x + w - rad, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
      ctx.lineTo(x + w, y + h - rad);
      ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
      ctx.lineTo(x + rad, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
      ctx.lineTo(x, y + rad);
      ctx.quadraticCurveTo(x, y, x + rad, y);
      ctx.closePath();
    }

    function drawRoomCharger(ch, ts) {
      const cx = ch.x - cameraX;
      const cy = ch.y;
      if (cx + ch.w < -20 || cx > W + 20) return;

      // 墙插面板
      ctx.fillStyle = "#ececf0";
      ctx.fillRect(cx + 2, cy + 14, ch.w - 4, ch.h - 16);
      ctx.strokeStyle = "#b0b0b8";
      ctx.lineWidth = 1;
      ctx.strokeRect(cx + 2, cy + 14, ch.w - 4, ch.h - 16);
      ctx.fillStyle = "#2a2a30";
      ctx.fillRect(cx + 10, cy + 24, 9, 12);
      ctx.fillRect(cx + ch.w - 19, cy + 24, 9, 12);

      // 充电头
      ctx.fillStyle = "#f8f8fa";
      ctx.fillRect(cx + 12, cy + 2, 24, 18);
      ctx.strokeStyle = "#999";
      ctx.strokeRect(cx + 12, cy + 2, 24, 18);
      ctx.fillStyle = "#555";
      ctx.fillRect(cx + 20, cy + 7, 8, 5);

      // 指示灯
      ctx.fillStyle = ts.phoneCharged ? "#4ad98a" : ts.charging ? "#5ce1ff" : "#888";
      ctx.beginPath();
      ctx.arc(cx + 30, cy + 8, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // 数据线
      ctx.strokeStyle = ts.charging ? "#5ce1ff" : "#666";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx + 24, cy + 20);
      ctx.quadraticCurveTo(cx + 34, cy + 34, cx + ch.w - 6, cy + ch.h - 6);
      ctx.stroke();

      if (ts.charging) {
        const pct = Math.min(1, ts.chargeT / 1.6);
        ctx.fillStyle = "rgba(92,225,255,0.45)";
        ctx.fillRect(cx + 12, cy + 20 - pct * 10, 24, pct * 10);
        ctx.fillStyle = "#5ce1ff";
        ctx.font = "9px 'Noto Sans SC', sans-serif";
        ctx.fillText("充电中", cx + ch.w / 2, cy + ch.h + 12);
      }

      ctx.fillStyle = "#ffd24a";
      ctx.font = "10px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("充电器", cx + ch.w / 2, cy + ch.h + (ts.charging ? 24 : 12));
    }

    function drawRoomPhone(ph, ts) {
      const px = ph.x - cameraX;
      const py = ph.y;
      if (px + ph.w < -20 || px > W + 20) return;

      // 小桌垫
      ctx.fillStyle = "#6b4a32";
      ctx.fillRect(px - 8, py + ph.h - 2, ph.w + 16, 8);
      ctx.fillStyle = "#8a6248";
      ctx.fillRect(px - 6, py + ph.h, ph.w + 12, 4);

      // 机身
      ctx.fillStyle = "#14141c";
      roundRect(px, py, ph.w, ph.h, 7);
      ctx.fill();
      ctx.strokeStyle = "#888";
      ctx.lineWidth = 2;
      roundRect(px, py, ph.w, ph.h, 7);
      ctx.stroke();

      // 屏幕
      ctx.fillStyle = ts.phoneCharged ? "#152238" : "#08080c";
      roundRect(px + 5, py + 8, ph.w - 10, ph.h - 14, 4);
      ctx.fill();

      // 刘海
      ctx.fillStyle = "#14141c";
      ctx.fillRect(px + ph.w / 2 - 9, py + 8, 18, 5);

      if (!ts.phoneCharged) {
        ctx.fillStyle = "#ff5c5c";
        ctx.font = "bold 10px 'Noto Sans SC', sans-serif";
        ctx.fillText("0%", px + ph.w / 2, py + ph.h / 2 + 2);
        ctx.font = "8px 'Noto Sans SC', sans-serif";
        ctx.fillStyle = "#aaa";
        ctx.fillText("没电", px + ph.w / 2, py + ph.h / 2 + 14);
        // 电池图标
        ctx.strokeStyle = "#ff5c5c";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px + ph.w / 2 - 10, py + ph.h / 2 - 16, 20, 10);
        ctx.fillRect(px + ph.w / 2 + 10, py + ph.h / 2 - 13, 2, 4);
      } else {
        ctx.fillStyle = "#4ad98a";
        ctx.font = "bold 9px 'Noto Sans SC', sans-serif";
        ctx.fillText("100%", px + ph.w / 2, py + ph.h - 12);
        ctx.strokeStyle = "#4ad98a";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px + ph.w / 2 - 10, py + ph.h / 2 - 4, 20, 10);
        ctx.fillStyle = "#4ad98a";
        ctx.fillRect(px + ph.w / 2 - 8, py + ph.h / 2 - 2, 16, 6);
      }

      if (ts.charging && !ts.phoneCharged) {
        ctx.strokeStyle = "rgba(92,225,255,0.7)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px - 2, py + ph.h / 2);
        ctx.lineTo(px - 28, py + ph.h / 2 - 6);
        ctx.stroke();
      }

      ctx.fillStyle = "#ffd24a";
      ctx.font = "10px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("手机", px + ph.w / 2, py + ph.h + 14);
    }

    function stairViewBand(ts) {
      const pad = 80;
      return { top: -ts.camY - pad, bot: H - ts.camY + pad };
    }

    function stairFlightVisible(yUpper, yLower, band) {
      return yLower >= band.top && yUpper <= band.bot;
    }

    function drawStairFlight(innerX, w, yUpper, yLower, flip) {
      const landingH = 10;
      const gapTop = yUpper + landingH;
      const gapBot = yLower;
      const totalH = gapBot - gapTop;
      if (totalH <= 2) return;

      const steps = Math.max(6, Math.min(10, Math.round(totalH / 3)));
      const stepH = totalH / steps;
      const treadW = Math.max(14, w * 0.48);

      for (let i = 0; i < steps; i++) {
        const sy = gapBot - (i + 1) * stepH;
        const fromLeft = flip ? i % 2 === 0 : i % 2 !== 0;
        const sx = fromLeft ? innerX + 3 : innerX + w - treadW - 3;

        ctx.fillStyle = "#6d7585";
        ctx.fillRect(sx - cameraX, sy + stepH * 0.35, treadW, stepH * 0.65 + 1);
        ctx.fillStyle = "#939bab";
        ctx.fillRect(sx - cameraX, sy, treadW, stepH * 0.38);
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.fillRect(sx - cameraX, sy + 1, treadW, 1);
        ctx.fillStyle = "#4a5160";
        ctx.fillRect(sx - cameraX, sy + stepH - 1, treadW, 1);
      }

      // 扶手折线
      ctx.strokeStyle = "rgba(255,210,74,0.75)";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      const railSteps = steps + 2;
      for (let i = 0; i <= railSteps; i++) {
        const t = i / railSteps;
        const sy = gapBot - t * (gapBot - gapTop);
        const fromLeft = flip ? i % 2 === 0 : i % 2 !== 0;
        const px = fromLeft ? innerX + 6 : innerX + w - 6;
        if (i === 0) ctx.moveTo(px - cameraX, sy);
        else ctx.lineTo(px - cameraX, sy);
      }
      ctx.stroke();
    }

    function drawTowerStairwell(ts) {
      const sw = ts.stairWell;
      if (!sw) return;
      const band = stairViewBand(ts);
      const innerX = sw.inner;
      const w = sw.width;
      const yBot = ts.floorY(1) - 6;

      // 每 10 层一段折返楼梯
      for (let f = 1; f < ts.floors; f += 10) {
        const yLower = ts.floorY(f) - 8;
        const yUpper = ts.floorY(Math.min(f + 10, ts.floors)) - 8;
        if (!stairFlightVisible(yUpper, yLower, band)) continue;

        const gapTop = yUpper + 10;
        const gapBot = yLower;
        if (gapBot > gapTop) {
          ctx.fillStyle = "#1a2030";
          ctx.fillRect(sw.left + 2 - cameraX, gapTop, sw.wallR - sw.left - 4, gapBot - gapTop);
        }

        drawStairFlight(innerX, w, yUpper, yLower, (f / 10) % 2 === 0);
      }

      // 中央向上箭头（每段）
      ctx.fillStyle = "rgba(92,225,255,0.35)";
      ctx.font = "8px 'Press Start 2P', monospace";
      ctx.textAlign = "center";
      for (let f = 1; f < ts.floors; f += 20) {
        const yMid = (ts.floorY(f) + ts.floorY(f + 10)) / 2 - 8;
        if (yMid < band.top || yMid > band.bot) continue;
        ctx.fillText("▲", innerX + w / 2 - cameraX, yMid);
      }

      // 一楼入口
      const entY = ts.floorY(1) - 4;
      if (entY >= band.top && entY <= band.bot) {
        const ex = sw.left - cameraX;
        ctx.fillStyle = "#3d4658";
        ctx.fillRect(ex, entY - 18, sw.wallR - sw.left, 22);
        ctx.strokeStyle = "#ffd24a";
        ctx.lineWidth = 2;
        ctx.strokeRect(ex + 2, entY - 16, sw.wallR - sw.left - 4, 18);
        ctx.fillStyle = "#ffd24a";
        ctx.font = "bold 10px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("楼梯", innerX + w / 2 - cameraX, entY - 3);
        ctx.font = "8px 'Noto Sans SC', sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.fillText("无电梯", innerX + w / 2 - cameraX, entY + 10);
      }
    }

    function drawTowerExtras() {
      if (!towerScene || level !== 14) return;
      const ts = towerScene;
      ctx.save();

      // 大厦外立面
      const bx = ts.towerX - 40;
      const by = ts.floorY(ts.floors) - 130;
      const bh = ts.floorY(1) - ts.floorY(ts.floors) + 160;
      ctx.fillStyle = "#2a3548";
      ctx.fillRect(bx, by, ts.towerW + 80, bh);
      ctx.fillStyle = "#3d4f68";
      ctx.fillRect(bx + 8, by + 8, ts.towerW + 64, bh - 16);

      // 楼层刻度
      ctx.font = "9px 'Press Start 2P', monospace";
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(255,210,74,0.55)";
      for (let f = 1; f <= ts.floors; f += 10) {
        const fy = ts.floorY(f);
        ctx.fillText(String(f) + "F", bx - 6, fy + 4);
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.beginPath();
        ctx.moveTo(bx + 12, fy);
        ctx.lineTo(bx + ts.towerW + 68, fy);
        ctx.stroke();
      }
      ctx.fillStyle = "#ffd24a";
      ctx.fillText("123F 你家", ts.towerX + ts.towerW + 72, ts.floorY(ts.floors) + 4);

      drawTowerStairwell(ts);

      // 123 层：充电器 & 手机
      const ch = ts.chargerHit;
      if (ch) drawRoomCharger(ch, ts);
      const ph = ts.phoneHit;
      if (ph) drawRoomPhone(ph, ts);

      // 无电梯提示
      ctx.fillStyle = "rgba(255,120,80,0.85)";
      ctx.font = "11px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("本楼无电梯 · 外卖只能爬楼", bx + 12, ts.floorY(1) + 36);

      // 外卖员
      const d = ts.delivery;
      if (d.active || d.delivered) {
        drawDeliveryGuy(d);
      }

      // 提示 toast
      if (ts.toast) {
        ctx.fillStyle = "rgba(16,8,6,0.88)";
        const tw = Math.min(420, ts.toast.length * 14 + 40);
        ctx.fillRect(W / 2 - tw / 2, H - 72, tw, 36);
        ctx.strokeStyle = "#ffd24a";
        ctx.strokeRect(W / 2 - tw / 2, H - 72, tw, 36);
        ctx.fillStyle = "#fff6d0";
        ctx.font = "13px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(ts.toast, W / 2, H - 50);
      }

      // 外卖阶段 HUD
      if (ts.phase === "delivery" && d.active) {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(16, 56, 200, 52);
        ctx.fillStyle = "#ffd24a";
        ctx.font = "11px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(`外卖员：${Math.floor(d.floor)} 层`, 28, 76);
        ctx.fillStyle = d.hasPlane ? "#8cf" : "#ff9a5c";
        ctx.fillText(d.hasPlane ? "飞行中！" : "100层会删单", 28, 96);
      }

      ctx.restore();
    }

    function drawDeliveryGuy(d) {
      const x = d.x - cameraX;
      const y = d.y + Math.sin(d.bob) * (d.flying ? 4 : 1);

      // 黄衣（略加宽以便印字）
      ctx.fillStyle = "#ffd24a";
      ctx.fillRect(x - 6, y + 12, d.w + 12, d.h - 12);
      ctx.strokeStyle = "#e6b800";
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 6, y + 12, d.w + 12, d.h - 12);

      // 头
      ctx.fillStyle = "#f0c8a8";
      ctx.beginPath();
      ctx.arc(x + d.w / 2, y + 10, 9, 0, Math.PI * 2);
      ctx.fill();

      // 美团色帽子
      ctx.fillStyle = "#ffd24a";
      ctx.fillRect(x + d.w / 2 - 11, y + 1, 22, 6);
      ctx.fillStyle = "#c04020";
      ctx.font = "bold 7px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("美图", x + d.w / 2, y + 6);

      // 衣服标语
      ctx.fillStyle = "#c04020";
      ctx.font = "bold 7px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("美图外卖", x + d.w / 2, y + 24);
      ctx.fillText("为您而来", x + d.w / 2, y + 33);

      // 外卖箱
      ctx.fillStyle = "#c04020";
      ctx.fillRect(x + d.w + 2, y + 22, 14, 16);
      ctx.fillStyle = "#ffd24a";
      ctx.font = "6px 'Noto Sans SC', sans-serif";
      ctx.fillText("美", x + d.w + 9, y + 33);

      if (d.flying) {
        ctx.font = "20px sans-serif";
        ctx.fillText("✈️", x + d.w + 18, y + 18);
      }
      if (d.hasPlane && !d.flying) {
        ctx.fillStyle = "#8cf";
        ctx.font = "10px 'Noto Sans SC', sans-serif";
        ctx.fillText("拿到飞机了", x + d.w / 2, y - 6);
      }
      d.hit = { x: d.x - 6, y: d.y, w: d.w + 12, h: d.h };
    }

    function tryClickTower14(clientX, clientY) {
      if (state !== "playing" || !towerScene || level !== 14) return false;
      const ts = towerScene;
      const world = clientToWorld(clientX, clientY);
      const wx = world.x;
      const wy = world.y - ts.camY;

      if (!ts.phoneCharged && ts.chargerHit && pointInRect(wx, wy, ts.chargerHit)) {
        startCharge();
        return true;
      }

      if (ts.phoneHit && pointInRect(wx, wy, ts.phoneHit)) {
        openTowerPhone();
        return true;
      }

      return false;
    }

    function syncTower14OnLeave() {
      hideTowerPhone();
      if (phoneBtn) phoneBtn.classList.add("hidden");
    }

    S.initTower14 = initTower14;
    S.updateTower14 = updateTower14;
    S.drawTowerExtras = drawTowerExtras;
    S.tryClickTower14 = tryClickTower14;
    S.syncTower14OnLeave = syncTower14OnLeave;
  }
};
