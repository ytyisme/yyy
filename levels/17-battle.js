// 第 17 关：战场 · 四队混战（枪 / 小匕首）
window.installBattle17 = function (S) {
  with (S) {
    const battlePad = document.getElementById("lv17-battle-pad");
    const btnGun = document.getElementById("lv17-btn-gun");
    const btnDagger = document.getElementById("lv17-btn-dagger");
    const btnFire = document.getElementById("lv17-btn-fire");
    const btnSlash = document.getElementById("lv17-btn-slash");
    const btnPhase = document.getElementById("lv17-btn-phase");
    const btnMedkit = document.getElementById("lv17-btn-medkit");
    const btnApple = document.getElementById("lv17-btn-apple");
    const btnSummonRed = document.getElementById("lv17-btn-summon-red");
    let bound = false;

    function teamColor(team) {
      if (team === "blue") return "#6eb6ff";
      if (team === "red") return "#ff7a6e";
      if (team === "yellow") return "#f1c40f";
      if (team === "green") return "#2ecc71";
      return "#aaa";
    }

    function teamLabel(team) {
      if (team === "blue") return "蓝队";
      if (team === "red") return "红队";
      if (team === "yellow") return "黄队";
      if (team === "green") return "绿队";
      return "队伍";
    }

    function teamShirt(team) {
      if (team === "blue") return "#3a7bd5";
      if (team === "red") return "#c0392b";
      if (team === "yellow") return "#d4a017";
      if (team === "green") return "#1e8449";
      return "#555";
    }

    function teamPants(team) {
      if (team === "blue") return "#1a4a8a";
      if (team === "red") return "#7a1a1a";
      if (team === "yellow") return "#8a6a00";
      if (team === "green") return "#0e5a30";
      return "#333";
    }

    function battleToast(msg, sec) {
      if (!battleScene) return;
      battleScene.toast = msg;
      battleScene.toastT = sec || 2;
    }

    function syncBattlePad() {
      if (!battlePad) return;
      const show = level === 17 && state === "playing" && battleScene && !battleScene.done;
      battlePad.classList.toggle("hidden", !show);
      battlePad.setAttribute("aria-hidden", show ? "false" : "true");
      if (!battleScene) return;
      if (btnGun) btnGun.classList.toggle("active", battleScene.weapon === "gun");
      if (btnDagger) btnDagger.classList.toggle("active", battleScene.weapon === "dagger");
      if (btnPhase) {
        btnPhase.textContent = `穿透×${battleScene.phaseLeft | 0}`;
        btnPhase.disabled = (battleScene.phaseLeft | 0) <= 0 || battleScene.phaseT > 0;
      }
      if (btnMedkit) {
        btnMedkit.textContent = `医疗包×${battleScene.medkits | 0}`;
        btnMedkit.disabled = (battleScene.medkits | 0) <= 0;
      }
      if (btnApple) {
        btnApple.textContent = `金苹果×${battleScene.apples | 0}`;
        btnApple.disabled = (battleScene.apples | 0) <= 0;
      }
      if (btnSummonRed) {
        const n = battleScene.summonRedCount | 0;
        btnSummonRed.textContent = n > 0 ? `召唤红队×${n} · R` : "召唤红队 · R";
        btnSummonRed.disabled = !!(
          battleScene.playerDown ||
          battleScene.playerHp <= 0 ||
          (battleScene.summonCd || 0) > 0
        );
      }
    }

    function hideBattlePad() {
      if (battlePad) {
        battlePad.classList.add("hidden");
        battlePad.setAttribute("aria-hidden", "true");
      }
      if (player) player.battlePhase = false;
    }

    function setWeapon(w) {
      if (!battleScene || battleScene.done) return;
      battleScene.weapon = w;
      battleToast(w === "gun" ? "已切换：枪" : "已切换：小匕首", 1.2);
      statusLabel.textContent = w === "gun" ? "战场 · 持枪" : "战场 · 持匕首";
      syncBattlePad();
      if (window.GameAudio) GameAudio.playClick();
    }

    const NPC_CHAT = {
      idle: ["盯着点", "别走神", "等命令", "听响动", "换弹中", "前方安全？", "保持队形"],
      fight: ["开火！", "给我冲！", "压住他们", "左翼小心", "别停火", "干翻他们", "掩护我"],
      hurt: ["支援！", "血不多了", "医疗包…", "扛不住了", "先撤一步"],
      guard: ["旗在人在", "谁敢靠近", "守住蓝旗", "警戒中", "不许越线", "发现敌人？"],
      sniper: ["视野清晰", "锁定目标", "再近一点", "枪口热了"],
      cheer: ["干得漂亮", "漂亮！", "继续压", "赢定了"],
      reply: ["收到", "明白", "跟上", "好的", "冲啊", "哈哈哈", "你说得对", "注意掩体"],
      greet: ["你好啊", "你好！", "嗨嗨", "你好呀", "队长好"],
      follow: ["收到！", "跟上队长", "跟你走", "明白", "跟紧了"],
      stop: ["收到，解散", "自由行动", "明白", "那我守这"],
      charge: ["冲啊！", "进攻！", "给我上！", "压过去"],
      thanks: ["不客气", "没事", "应该的", "客气啦"],
      followIdle: ["跟着队长", "保持队形", "你先走", "掩护中"],
    };

    function pickChat(pool) {
      return pool[(Math.random() * pool.length) | 0];
    }

    function normalizeChat(s) {
      return String(s || "")
        .trim()
        .toLowerCase()
        .replace(/[！!？?。.~～、，,\s]/g, "");
    }

    function npcSay(npc, text, sec, forceLog) {
      if (!npc || !npc.alive || !text) return;
      npc.chat = String(text).slice(0, 12);
      npc.chatT = sec || 2.6;
      npc.chatCd = 3 + Math.random() * 6;
      if ((forceLog || Math.random() < 0.35) && typeof announceChat === "function") {
        const who = (npc.name || "玩家").replace(/^蓝队|^红队|^黄队|^绿队/, "").slice(0, 6);
        announceChat(who, npc.chat);
      }
    }

    function nearbyBlue(range) {
      const list = [];
      if (!player || !battleScene) return list;
      for (const n of battleScene.npcs || []) {
        if (!n.alive || n.team !== "blue") continue;
        if (Math.abs(n.x - player.x) > (range || 520)) continue;
        list.push(n);
      }
      return list;
    }

    function replyMany(list, pool, maxN, forceLog) {
      const copy = list.slice();
      const n = Math.min(maxN || 3, copy.length);
      for (let k = 0; k < n && copy.length; k++) {
        const idx = (Math.random() * copy.length) | 0;
        const npc = copy.splice(idx, 1)[0];
        npcSay(npc, pickChat(pool), 2.8, forceLog);
      }
    }

    function maybeNpcChat(npc, foe) {
      if (!npc.alive) return;
      if ((npc.chatT || 0) > 0) return;
      if ((npc.chatCd || 0) > 0) return;
      if (Math.abs(npc.x - (cameraX + W / 2)) > W * 0.85) {
        npc.chatCd = 1.5 + Math.random() * 2;
        return;
      }
      if (Math.random() > 0.4) {
        npc.chatCd = 1.2 + Math.random() * 2.5;
        return;
      }

      let pool = NPC_CHAT.idle;
      if (npc.followPlayer) pool = NPC_CHAT.followIdle;
      else if (npc.flagGuard) pool = NPC_CHAT.guard;
      else if (npc.sniper) pool = NPC_CHAT.sniper;
      else if (npc.hp <= 4) pool = NPC_CHAT.hurt;
      else if (foe && Math.abs(foe.x - npc.x) < 340) pool = NPC_CHAT.fight;
      else if (livingOf("red").length <= 8 && npc.team === "blue") pool = NPC_CHAT.cheer;

      npcSay(npc, pickChat(pool), 2.4 + Math.random());
    }

    function updateNpcChatReplies() {
      if (!battleScene || !player || !localChat) return;
      if (!localChatUntil || time >= localChatUntil) return;
      if (battleScene.heardChat === localChat) return;
      battleScene.heardChat = localChat;

      const raw = localChat;
      const t = normalizeChat(raw);
      const near = nearbyBlue(640);
      const fighters = near.filter((n) => !n.flagGuard);

      // 问候
      if (/你好|嗨|哈喽|hello|hi|早上好|中午好|晚上好|嘿/.test(t)) {
        replyMany(near, NPC_CHAT.greet, 4, true);
        return;
      }
      // 谢谢
      if (/谢谢|感谢|谢啦|多谢/.test(t)) {
        replyMany(near, NPC_CHAT.thanks, 3, true);
        return;
      }
      // 跟随
      if (/跟着我|跟我来|跟上|跟我走|跟紧|全部跟上|跟我|跟过来/.test(t)) {
        let slot = 0;
        for (const n of fighters) {
          n.followPlayer = true;
          n.followSlot = slot++;
          npcSay(n, pickChat(NPC_CHAT.follow), 2.6, slot <= 3);
        }
        // 守卫礼貌拒绝
        for (const n of near) {
          if (!n.flagGuard) continue;
          if (Math.random() < 0.5) npcSay(n, pickChat(["我守旗", "旗不能丢", "你们先走"]), 2.4);
        }
        if (slot > 0) {
          battleToast(`${slot} 名队友跟着你`, 2.2);
          statusLabel.textContent = `战场 · ${slot} 人跟随中`;
        } else {
          battleToast("附近没有可跟随的队友", 2);
        }
        return;
      }
      // 停止跟随
      if (/停下|停止|别跟|解散|自由|散开|别跟着|取消跟随/.test(t)) {
        let n = 0;
        for (const npc of battleScene.npcs || []) {
          if (!npc.followPlayer) continue;
          npc.followPlayer = false;
          npc.followSlot = 0;
          n++;
        }
        replyMany(near, NPC_CHAT.stop, 4, true);
        battleToast(n ? `已解散 ${n} 名跟随` : "当前没有跟随", 2);
        statusLabel.textContent = "战场 · 自由行动";
        return;
      }
      // 冲锋
      if (/冲|进攻|开火|攻击|给我上|压过去/.test(t)) {
        for (const npc of fighters) {
          npc.followPlayer = true;
          npc.aggressive = true;
          npc.aggressiveT = 12;
        }
        replyMany(fighters, NPC_CHAT.charge, 5, true);
        battleToast("队友开始进攻！", 2);
        return;
      }
      // 守住 / 防守
      if (/守住|防守|别冲|稳住|守好/.test(t)) {
        for (const npc of fighters) {
          npc.aggressive = false;
          npc.aggressiveT = 0;
        }
        replyMany(near, ["稳住", "防守！", "收到，守住", "别浪"], 4, true);
        return;
      }
      // 列车相关
      if (/火车|列车|地铁|坐车|上车|怎么去|太远|走不动/.test(t)) {
        replyMany(near, ["去附近站坐车", "列车免费", "1蓝红 2红黄 3黄绿 4互通", "屏蔽门开了上"], 4, true);
        battleToast("1号线蓝↔红 · 2号线红↔黄 · 3号线黄↔绿 · 4号线四队互通", 3);
        return;
      }

      // 随便说：NPC 认真回复（多句里挑贴近的）
      if (near.length) {
        const answers = thoughtfulReplies(raw, t);
        const speakers = near.slice().sort(() => Math.random() - 0.5).slice(0, Math.min(3, near.length));
        speakers.forEach((npc, i) => {
          npcSay(npc, answers[i % answers.length], 3.0, i === 0);
        });
      }
    }

    function thoughtfulReplies(raw, t) {
      const tip = String(raw || "").trim().slice(0, 10);
      if (/饿|吃饭|午饭|晚饭|好饿/.test(t)) return ["战场先撑住", "打完再吃", "我也有点饿", "先喝口水"];
      if (/累|疲惫|睡|困/.test(t)) return ["坚持住", "去列车上歇会", "我扶你一把", "别硬撑"];
      if (/怕|害怕|不敢|慌/.test(t)) return ["我罩着你", "深呼吸", "一起上", "别怕，有我"];
      if (/红队|敌人|僵尸/.test(t)) return ["盯紧红队", "注意掩体", "别暴露", "我掩护"];
      if (/旗|守旗|夺旗/.test(t)) return ["旗很重要", "别让人摘走", "守卫别离岗", "护旗优先"];
      if (/血|疼|受伤|医药/.test(t)) return ["快用医疗包", "金苹果也行", "先撤到掩体", "我掩护你回血"];
      if (/为什么|为啥|怎么|如何|什么|哪|谁|吗|呢/.test(t) || /[？?]/.test(raw)) {
        return ["让我想想…", "听你的判断", "我觉得可行", "先观察一下", "你定，我配合"];
      }
      if (/哈哈|呵呵|嘿嘿|233|笑死/.test(t)) return ["哈哈哈", "笑什么呢", "正经点啦", "我也笑了"];
      if (/加油|冲鸭|必胜/.test(t)) return ["加油！", "蓝队必胜", "一起干", "收到，加油"];
      if (/对不起|抱歉|不好意思/.test(t)) return ["没事", "没关系", "别放心上", "理解"];
      if (/爱|喜欢|亲/.test(t)) return ["先打胜仗", "战场上专心", "……收到", "回头再说"];
      // 通用认真回应
      return [
        tip ? `嗯，${tip}` : "我在听",
        "我认真听了",
        "明白你的意思",
        "说得有道理",
        "好，那我们注意",
        "记下了",
        "我配合你",
        "行，按你说的",
      ];
    }

    // —— 列车系统（1/2/3/4 号线）——
    function allTrains() {
      if (battleScene.trains && battleScene.trains.length) return battleScene.trains;
      return battleScene.train ? [battleScene.train] : [];
    }

    function stationById(id) {
      return (battleScene.stations || []).find((s) => s.id === id) || null;
    }

    function trainRouteStation(tr, idx) {
      const route = tr.route || [];
      const sid = route[idx];
      return sid ? stationById(sid) : null;
    }

    function trainCurrentStation(tr) {
      return trainRouteStation(tr, tr.stationIdx | 0);
    }

    function peekNextStop(tr) {
      const route = tr.route || [];
      const n = route.length;
      const idx = tr.stationIdx | 0;
      if (n < 2) return { idx, dir: tr.routeDir || 1 };
      if (tr.pingPong) {
        let dir = tr.routeDir || 1;
        let nxt = idx + dir;
        if (nxt >= n || nxt < 0) {
          dir = -dir;
          nxt = idx + dir;
        }
        return { idx: Math.max(0, Math.min(n - 1, nxt)), dir };
      }
      return { idx: (idx + 1) % n, dir: 1 };
    }

    function trainNextIdx(tr) {
      return peekNextStop(tr).idx;
    }

    function trainDockX(tr, st) {
      if (!st) return tr.x;
      return st.x + (tr.berth || 0);
    }

    function trainCabinBox(tr) {
      return { x: tr.x + 20, y: tr.y + 18, w: tr.w - 40, h: tr.h - 28 };
    }

    function linesAtStation(stId) {
      const out = [];
      for (const tr of allTrains()) {
        if ((tr.route || []).includes(stId)) out.push(tr);
      }
      return out;
    }

    function findFreeSeat(tr) {
      return (tr.seats || []).find((s) => !s.rider) || null;
    }

    function seatWorld(tr, seat) {
      return { x: tr.x + seat.dx, y: tr.y + seat.dy };
    }

    function alightRider(tr, seat) {
      if (!seat || !seat.rider) return;
      const st = trainCurrentStation(tr);
      const outX = (st ? st.x : tr.x) + 60 + Math.random() * 140;
      if (seat.rider === "player") {
        if (player) {
          player.onTrain = false;
          player.trainSeat = null;
          player.trainId = null;
          player.x = outX;
          player.y = battleScene.groundY - player.h;
          player.vx = 0;
          player.vy = 0;
        }
      } else {
        const npc = (battleScene.npcs || []).find((n) => n.id === seat.rider);
        if (npc) {
          npc.onTrain = false;
          npc.trainSeat = null;
          npc.trainId = null;
          npc.x = outX + Math.random() * 40;
          npc.y = battleScene.groundY - npc.h;
          npc.vx = 0;
          npc.vy = 0;
          npc.onGround = true;
        }
      }
      seat.rider = null;
    }

    function boardEntity(kind, ent, preferTrain) {
      const candidates = (preferTrain ? [preferTrain] : allTrains()).filter(
        (tr) => tr && tr.state === "dock" && tr.doorOpen >= 0.85
      );
      if (kind === "player") {
        if (!player || player.onTrain || battleScene.playerDown) return false;
        if ((player.trainCd || 0) > 0) return false;
        for (const tr of candidates) {
          const cabin = trainCabinBox(tr);
          if (!rectsOverlap(player, { x: cabin.x - 10, y: cabin.y - 20, w: cabin.w + 20, h: cabin.h + 40 }))
            continue;
          const seat = findFreeSeat(tr);
          if (!seat) {
            battleToast(`${tr.lineName}车厢已满`, 1.5);
            continue;
          }
          seat.rider = "player";
          player.onTrain = true;
          player.trainSeat = seat;
          player.trainId = tr.id;
          battleToast(`已上${tr.lineName} · 到站下车`, 2.2);
          statusLabel.textContent = `${tr.lineName} · 到站自动下车`;
          return true;
        }
        return false;
      }
      if (!ent || !ent.alive || ent.onTrain || ent.flagGuard) return false;
      if ((ent.trainCd || 0) > 0) return false;
      for (const tr of candidates) {
        const cabin = trainCabinBox(tr);
        if (!rectsOverlap(ent, { x: cabin.x - 30, y: cabin.y - 30, w: cabin.w + 60, h: cabin.h + 50 }))
          continue;
        const seat = findFreeSeat(tr);
        if (!seat) continue;
        seat.rider = ent.id;
        ent.onTrain = true;
        ent.trainSeat = seat;
        ent.trainId = tr.id;
        ent.followPlayer = false;
        ent.vx = 0;
        npcSay(ent, pickChat(["上车了", `坐${tr.lineName}`, "省脚力", "走起"]), 2.2);
        return true;
      }
      return false;
    }

    function syncTrainRiders(tr) {
      for (const seat of tr.seats || []) {
        if (!seat.rider) continue;
        const pos = seatWorld(tr, seat);
        if (seat.rider === "player") {
          if (!player || battleScene.playerDown) {
            seat.rider = null;
            continue;
          }
          player.x = pos.x;
          player.y = pos.y;
          player.vx = 0;
          player.vy = 0;
          player.onGround = true;
        } else {
          const npc = (battleScene.npcs || []).find((n) => n.id === seat.rider);
          if (!npc || !npc.alive) {
            seat.rider = null;
            continue;
          }
          npc.x = pos.x;
          npc.y = pos.y;
          npc.vx = 0;
          npc.vy = 0;
          npc.onGround = true;
        }
      }
    }

    function trainEtaSecForTrain(tr, stId) {
      const route = tr.route || [];
      const targetIdx = route.indexOf(stId);
      if (targetIdx < 0) return 99;
      const CRUISE = 12000;
      const WAIT = 10;
      const travelIdx = (a, b) => {
        const sa = trainRouteStation(tr, a);
        const sb = trainRouteStation(tr, b);
        if (!sa || !sb) return 8;
        return Math.abs(sa.x - sb.x) / CRUISE;
      };

      // 简化：沿当前方向估算到目标站
      const sim = {
        idx: tr.stationIdx | 0,
        dir: tr.routeDir || 1,
        state: tr.state,
        x: tr.x,
        wait: Math.max(0, tr.waitT || 0),
        goIdx: tr._goIdx,
      };
      let t = 0;
      for (let step = 0; step < 24; step++) {
        if (sim.state === "dock") {
          if (sim.idx === targetIdx) return t;
          t += sim.wait;
          sim.wait = WAIT;
          let nxt;
          let dir = sim.dir;
          if (tr.pingPong) {
            nxt = sim.idx + dir;
            if (nxt >= route.length || nxt < 0) {
              dir = -dir;
              nxt = sim.idx + dir;
            }
          } else {
            nxt = (sim.idx + 1) % route.length;
          }
          sim.dir = dir;
          t += travelIdx(sim.idx, nxt);
          sim.idx = nxt;
          if (sim.idx === targetIdx) return t;
          continue;
        }
        // go → 正在驶往下一站
        const nxt = sim.goIdx != null ? sim.goIdx : (() => {
          if (tr.pingPong) {
            let d = sim.dir;
            let n = sim.idx + d;
            if (n >= route.length || n < 0) {
              d = -d;
              n = sim.idx + d;
            }
            sim.dir = d;
            return n;
          }
          return (sim.idx + 1) % route.length;
        })();
        const dest = trainRouteStation(tr, nxt);
        const remain = dest ? Math.abs(dest.x + (tr.berth || 0) - sim.x) / CRUISE : travelIdx(sim.idx, nxt);
        t += Math.max(0, remain);
        sim.idx = nxt;
        sim.goIdx = null;
        sim.state = "dock";
        sim.wait = WAIT;
        if (sim.idx === targetIdx) return t;
      }
      return t;
    }

    function formatEta(sec) {
      const s = Math.max(0, Math.ceil(sec));
      const m = Math.floor(s / 60);
      const r = s % 60;
      return `${m}:${r < 10 ? "0" : ""}${r}`;
    }

    function lineRouteLabel(tr) {
      if (!tr) return "";
      if (tr.line === 1) return "蓝↔红";
      if (tr.line === 2) return "红↔黄";
      if (tr.line === 3) return "黄↔绿";
      if (tr.line === 4) return "四队互通";
      return (tr.route || []).map((id) => (stationById(id) || {}).label || id).join("→");
    }

    function updateWaitingComplain(dt) {
      const lines = [
        "慢死了，还要等多久啊",
        "车怎么还不来",
        "等到花儿都谢了",
        "还有多久啊",
        "急死了快来吧",
        "换条线试试",
      ];
      const sts = battleScene.stations || [];
      for (const n of battleScene.npcs || []) {
        if (!n.alive || n.onTrain || n.flagGuard) {
          n.platformWait = 0;
          continue;
        }
        const nearSt = sts.find((s) => Math.abs(n.x - (s.x + 240)) < 360);
        if (!nearSt) {
          n.platformWait = 0;
          continue;
        }
        const docked = allTrains().some(
          (tr) =>
            tr.state === "dock" &&
            trainCurrentStation(tr) &&
            trainCurrentStation(tr).id === nearSt.id &&
            tr.doorOpen > 0.55
        );
        if (docked) {
          n.platformWait = 0;
          continue;
        }
        n.platformWait = (n.platformWait || 0) + dt;
        if (n.platformWait > 9 + (n.id.charCodeAt(n.id.length - 1) % 7) && (n.chatT || 0) <= 0) {
          npcSay(n, pickChat(lines), 3.2, Math.random() < 0.4);
          n.platformWait = 3 + Math.random() * 4;
        }
      }
    }

    function syncBattleTrainAudio() {
      if (!window.GameAudio) return;
      const trains = allTrains();
      let focus = null;
      if (player && player.onTrain) {
        focus = trains.find(
          (tr) => tr.state === "go" && (tr.seats || []).some((s) => s.rider === "player")
        );
      }
      if (!focus) {
        let best = 1e15;
        for (const tr of trains) {
          if (tr.state !== "go") continue;
          const d = player ? Math.abs(tr.x + tr.w / 2 - (player.x || 0)) : 0;
          if (d < best) {
            best = d;
            focus = tr;
          }
        }
        if (focus && best > 9000) focus = null;
      }
      if (focus) {
        if (GameAudio.startTrainLoop) GameAudio.startTrainLoop();
        if (GameAudio.setTrainLoopSpeed) {
          let speed = 0.75;
          if (player && player.onTrain && (focus.seats || []).some((s) => s.rider === "player")) {
            speed = 1.15;
          } else if (player) {
            const dist = Math.abs(focus.x + focus.w / 2 - player.x);
            const near = Math.max(0.15, 1 - dist / 5200);
            speed = 0.4 + near * 0.7;
          }
          GameAudio.setTrainLoopSpeed(speed);
        }
      } else if (GameAudio.stopTrainLoop) {
        GameAudio.stopTrainLoop();
      }
    }

    function updateOneTrain(tr, dt) {
      const route = tr.route || [];
      if (route.length < 2) return { justDeparted: false, justArrived: false };

      const DOCK_WAIT = 10;
      const CRUISE = 12000;
      let justDeparted = false;
      let justArrived = false;

      const wantOpen = tr.state === "dock";
      if (wantOpen) tr.doorOpen = Math.min(1, tr.doorOpen + dt * 1.2);
      else tr.doorOpen = Math.max(0, tr.doorOpen - dt * 1.4);

      if (tr.state === "dock") {
        const st = trainCurrentStation(tr);
        const peek = peekNextStop(tr);
        const next = trainRouteStation(tr, peek.idx);
        tr.speed = 0;
        if (st) tr.x = trainDockX(tr, st);
        tr.screenMsg = `${tr.lineName} ${st ? st.label : ""} 停${Math.ceil(Math.max(0, tr.waitT))}s`;
        tr.waitT -= dt;
        if (tr.doorOpen > 0.85) {
          boardEntity("player", null, tr);
          for (const n of battleScene.npcs || []) {
            if (!n.alive || n.onTrain || n.flagGuard) continue;
            const nearDoor = Math.abs(n.x - (tr.x + tr.w / 2)) < 200;
            if (!nearDoor) continue;
            const want =
              (n.followPlayer && player && player.onTrain && player.trainId === tr.id) ||
              Math.random() < 0.01;
            if (want) boardEntity("npc", n, tr);
          }
        }
        if (tr.waitT <= 0 && tr.doorOpen > 0.9 && next) {
          tr.waitT = 0;
          tr.routeDir = peek.dir;
          tr.state = "go";
          tr._goIdx = peek.idx;
          tr.screenMsg = `${tr.lineName} → ${next.label}`;
          justDeparted = true;
        }
      } else if (tr.state === "go") {
        const nextIdx = tr._goIdx != null ? tr._goIdx : peekNextStop(tr).idx;
        const destSt = trainRouteStation(tr, nextIdx);
        if (!destSt) {
          tr.state = "dock";
          return { justDeparted, justArrived };
        }
        const dest = trainDockX(tr, destSt);
        const dir = Math.sign(dest - tr.x) || 1;
        tr.speed = CRUISE;
        tr.x += dir * tr.speed * dt;
        const eta = Math.abs(dest - tr.x) / CRUISE;
        tr.screenMsg = `${tr.lineName}→${destSt.label} ${formatEta(eta)}`;
        if ((dir > 0 && tr.x >= dest) || (dir < 0 && tr.x <= dest)) {
          tr.x = dest;
          tr.stationIdx = nextIdx;
          tr._goIdx = null;
          tr.state = "dock";
          tr.waitT = DOCK_WAIT;
          tr.needAlight = true;
          tr.screenMsg = `${tr.lineName} 到站：${destSt.label}`;
          justArrived = true;
        }
      }

      syncTrainRiders(tr);

      if (tr.needAlight && tr.state === "dock" && tr.doorOpen > 0.85) {
        for (const seat of tr.seats || []) {
          if (!seat.rider) continue;
          if (seat.rider === "player") {
            alightRider(tr, seat);
            if (player) player.trainCd = 1.2;
            battleToast(`${tr.lineName}到站下车`, 1.8);
          } else if (Math.random() < 0.62) {
            const npc = (battleScene.npcs || []).find((n) => n.id === seat.rider);
            alightRider(tr, seat);
            if (npc) npc.trainCd = 1.5;
          }
        }
        tr.needAlight = false;
      }

      return { justDeparted, justArrived };
    }

    function updateTrain(dt) {
      const trains = allTrains();
      if (!trains.length) return;
      let anyArriveNear = false;
      for (const tr of trains) {
        const ev = updateOneTrain(tr, dt);
        if (ev.justArrived && player) {
          const dist = Math.abs(tr.x + tr.w / 2 - player.x);
          if (dist < 1400 || (player.onTrain && player.trainId === tr.id)) anyArriveNear = true;
        }
      }
      updateWaitingComplain(dt);
      syncBattleTrainAudio();
      if (anyArriveNear && window.GameAudio && GameAudio.playTrainArriveChime) {
        GameAudio.playTrainArriveChime();
      }
    }

    function drawOneTrain(tr) {
      const tx = tr.x - cameraX;
      const ty = tr.y;
      if (tx < -tr.w - 40 || tx > W + 40) return;

      const body = tr.color || "#1e3a5f";
      ctx.fillStyle = body;
      ctx.fillRect(tx, ty, tr.w, tr.h);
      ctx.fillStyle = "#ffffff22";
      ctx.fillRect(tx + 4, ty + 4, tr.w - 8, tr.h - 12);
      ctx.fillStyle = "#0a1020";
      ctx.fillRect(tx - 4, ty - 8, tr.w + 8, 12);
      for (let i = 0; i < 6; i++) {
        const wx = tx + 24 + i * 64;
        ctx.fillStyle = "#8ec8ff";
        ctx.globalAlpha = 0.55;
        ctx.fillRect(wx, ty + 16, 36, 26);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "#d8e8ff";
        ctx.strokeRect(wx, ty + 16, 36, 26);
      }
      const od = tr.doorOpen * 20;
      const docked = tr.state === "dock";
      ctx.fillStyle = "#0a1828";
      ctx.fillRect(tx + 160 - od, ty + 44, 22, 50);
      ctx.fillRect(tx + 205 + od, ty + 44, 22, 50);
      ctx.fillRect(tx + 260 - od, ty + 44, 22, 50);
      ctx.fillRect(tx + 305 + od, ty + 44, 22, 50);

      ctx.fillStyle = docked && tr.doorOpen > 0.7 ? "#2ecc71" : docked ? "#f1c40f" : "#e74c3c";
      ctx.fillRect(tx + 178, ty + 38, 8, 6);
      ctx.fillRect(tx + 278, ty + 38, 8, 6);

      const nextIdx = tr.state === "go" && tr._goIdx != null ? tr._goIdx : trainNextIdx(tr);
      const nextSt = trainRouteStation(tr, nextIdx);
      const goingRight = tr.state === "go" && nextSt && trainDockX(tr, nextSt) >= tr.x;
      ctx.fillStyle = tr.state === "go" ? "#ffe566" : "#666";
      ctx.beginPath();
      ctx.arc(tx + (goingRight ? tr.w - 12 : 12), ty + 54, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#031018";
      ctx.fillRect(tx + 100, ty + 6, 230, 24);
      ctx.strokeStyle = "#2a6a4a";
      ctx.strokeRect(tx + 100, ty + 6, 230, 24);
      ctx.fillStyle = "#33ff99";
      ctx.font = "10px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      const blink = Math.floor(time * 2) % 2 === 0 ? "●" : "○";
      ctx.fillText(`${blink} ${tr.screenMsg || tr.lineName}`, tx + 215, ty + 22);

      ctx.fillStyle = "#021018";
      ctx.fillRect(tx + 12, ty + 50, 64, 36);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px 'Noto Sans SC', sans-serif";
      ctx.fillText(tr.lineName, tx + 44, ty + 66);
      ctx.fillStyle = "#cde";
      ctx.font = "9px 'Noto Sans SC', sans-serif";
      ctx.fillText(lineRouteLabel(tr), tx + 44, ty + 80);

      for (const seat of tr.seats || []) {
        if (seat.rider) continue;
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(tx + seat.dx, ty + seat.dy + 18, 22, 10);
      }

      ctx.fillStyle = "#ffd24a";
      ctx.font = "bold 12px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(tr.lineName, tx + 8, ty - 10);
    }

    function drawTrainAndStations() {
      const bs = battleScene;
      const trains = allTrains();
      if (!trains.length) return;
      const gy = bs.groundY;

      for (const st of bs.stations || []) {
        const sx = st.x - cameraX;
        if (sx < -700 || sx > W + 700) continue;

        const dockedHere = trains.filter(
          (tr) => tr.state === "dock" && trainCurrentStation(tr) && trainCurrentStation(tr).id === st.id
        );
        const openTr = dockedHere.find((tr) => tr.doorOpen > 0.55);
        const movingTr = dockedHere.find((tr) => tr.doorOpen > 0.05 && tr.doorOpen < 0.95);
        const doorsOpen = !!openTr;
        const doorsMoving = !!movingTr && !doorsOpen;
        const activeTr = openTr || movingTr || dockedHere[0] || null;
        const doorOpen = activeTr ? activeTr.doorOpen : 0;

        ctx.fillStyle = "#2a3038";
        ctx.fillRect(sx - 40, gy - 14, 900, 16);
        ctx.fillStyle = "#3a4450";
        ctx.fillRect(sx - 40, gy - 14, 900, 4);

        // 到站大屏（多线路）
        ctx.fillStyle = "#050a10";
        ctx.fillRect(sx + 20, gy - 248, 340, 110);
        ctx.strokeStyle = "#3a6a8a";
        ctx.lineWidth = 2;
        ctx.strokeRect(sx + 20, gy - 248, 340, 110);
        ctx.fillStyle = "#1a3a50";
        ctx.fillRect(sx + 26, gy - 242, 328, 18);
        ctx.fillStyle = "#8cf";
        ctx.font = "bold 11px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("到站信息屏 · 多线路", sx + 32, gy - 229);

        const serving = linesAtStation(st.id);
        let rowY = gy - 208;
        for (const tr of serving) {
          const here = dockedHere.includes(tr);
          ctx.fillStyle = tr.color || "#fff";
          ctx.fillRect(sx + 32, rowY - 9, 8, 10);
          ctx.fillStyle = "#33ff99";
          ctx.font = "bold 11px 'Noto Sans SC', sans-serif";
          if (here && tr.doorOpen > 0.5) {
            ctx.fillText(`${tr.lineName} 到站上客  停${Math.ceil(Math.max(0, tr.waitT))}s`, sx + 46, rowY);
          } else if (here) {
            ctx.fillText(`${tr.lineName} 屏蔽门动作中`, sx + 46, rowY);
          } else {
            const eta = trainEtaSecForTrain(tr, st.id);
            ctx.fillText(`${tr.lineName} ${lineRouteLabel(tr)}  ${formatEta(eta)}`, sx + 46, rowY);
          }
          rowY += 18;
        }

        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(sx + 380, gy - 220, 160, 52);
        ctx.fillStyle = "#7ec8ff";
        ctx.font = "bold 14px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(st.label, sx + 460, gy - 196);
        ctx.fillStyle = "#9ab";
        ctx.font = "10px 'Noto Sans SC', sans-serif";
        ctx.fillText(serving.map((t) => t.lineName).join(" · "), sx + 460, gy - 178);

        const gateY = gy - 100;
        for (let i = 0; i < 7; i++) {
          const gx = sx + 40 + i * 90;
          const gap = doorOpen * 28;
          ctx.fillStyle = "#1a222c";
          ctx.fillRect(gx, gateY, 38 - gap, 88);
          ctx.fillRect(gx + 52 + gap, gateY, 38 - gap, 88);
          ctx.strokeStyle = "#5a6a7a";
          ctx.strokeRect(gx, gateY, 38 - gap, 88);
          ctx.strokeRect(gx + 52 + gap, gateY, 38 - gap, 88);
          ctx.fillStyle = "rgba(140,200,255,0.12)";
          ctx.fillRect(gx + 4, gateY + 8, 10, 70);

          let lamp = "#e74c3c";
          if (doorsOpen) lamp = "#2ecc71";
          else if (doorsMoving) lamp = Math.floor(time * 6) % 2 ? "#f1c40f" : "#7a5a00";
          ctx.fillStyle = "#111";
          ctx.fillRect(gx, gateY - 10, 90, 8);
          ctx.fillStyle = lamp;
          ctx.beginPath();
          ctx.arc(gx + 20, gateY - 6, 3.2, 0, Math.PI * 2);
          ctx.arc(gx + 70, gateY - 6, 3.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(gx + 45, gateY - 6, 3.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = doorsOpen ? "rgba(46,204,113,0.9)" : "rgba(231,76,60,0.9)";
        ctx.fillRect(sx + 640, gateY + 20, 36, 50);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 10px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(doorsOpen ? "开门" : doorsMoving ? "请等" : "关门", sx + 658, gateY + 48);
      }

      // 轨道
      ctx.fillStyle = "#3a3428";
      ctx.fillRect(0, gy - 8, W, 6);
      ctx.fillStyle = "#6a5a40";
      for (let i = 0; i < 24; i++) {
        const rx = ((i * 70 - (cameraX % 70)) + W * 2) % (W + 70) - 20;
        ctx.fillRect(rx, gy - 10, 18, 4);
      }

      for (const tr of trains) drawOneTrain(tr);
    }

    function updateFollowNpc(npc, foe, dt) {
      if (!player || battleScene.playerDown || battleScene.playerHp <= 0) {
        npc.followPlayer = false;
        return false;
      }
      if (npc.aggressiveT > 0) npc.aggressiveT -= dt;
      else npc.aggressive = false;

      const slot = npc.followSlot || 0;
      const side = slot % 2 === 0 ? -1 : 1;
      const row = Math.floor(slot / 2);
      const targetX = player.x + side * (36 + row * 32) - 10;
      const dx = targetX - npc.x;
      npc.facing = dx >= 0 ? 1 : -1;

      // 有敌人靠近时边跟边打
      if (foe && Math.abs(foe.x - npc.x) < (npc.aggressive ? 420 : 260)) {
        const fdx = foe.x - npc.x;
        npc.facing = fdx >= 0 ? 1 : -1;
        const dist = Math.abs(fdx);
        if (npc.weapon === "gun") {
          if (dist > 180) npc.vx = npc.facing * 2.5;
          else if (dist < 90) npc.vx = -npc.facing * 1.5;
          else {
            npc.vx = Math.sign(dx) * (Math.abs(dx) > 24 ? 1.6 : 0);
            if (npc.attackCd <= 0) {
              fireGunFrom(
                npc.x + (npc.facing > 0 ? npc.w : -4),
                npc.y + 16,
                npc.facing,
                npc.team,
                12,
                npcKillerInfo(npc)
              );
              npc.attackCd = 0.7 + Math.random() * 0.35;
            }
          }
        } else if (dist > 34) {
          npc.vx = npc.facing * 2.8;
        } else {
          npc.vx = 0;
          if (npc.attackCd <= 0) {
            const killer = npcKillerInfo(npc);
            killer.weapon = "dagger";
            if (foe.isPlayer) hurtPlayer(2, killer);
            else hurtTarget(foe, 2, npc.team, killer);
            npc.attackCd = 0.6 + Math.random() * 0.3;
            checkBattleWin();
          }
        }
        return true;
      }

      if (Math.abs(dx) > 18) npc.vx = Math.sign(dx) * 2.9;
      else npc.vx = 0;
      return true;
    }

    function livingOf(team) {
      return (battleScene.npcs || []).filter((n) => n.alive && n.team === team);
    }

    function livingPlayersOf(team) {
      return (battleScene.npcs || []).filter((n) => n.alive && n.team === team && !n.flagGuard);
    }

    function livingGuardsOf(team) {
      return (battleScene.npcs || []).filter((n) => n.alive && n.team === team && n.flagGuard);
    }

    function isCoverPlat(p) {
      if (!p) return false;
      if (p.blocksShot) return true;
      if (p.theme === "crate" || p.theme === "sandbag") return true;
      return false;
    }

    function stuckInCover(body) {
      if (!body) return false;
      const was = body.battlePhase;
      body.battlePhase = false;
      const hit = solidAt(body, 0, 0);
      body.battlePhase = was;
      return !!(hit && isCoverPlat(hit) && hit.h > 20);
    }

    function tickPhaseState(unit, dt) {
      if (!unit) return;
      if (unit.phaseT > 0) {
        unit.phaseT -= dt;
        unit.battlePhase = true;
        if (unit.phaseT <= 0) {
          unit.phaseT = 0;
          unit.battlePhase = false;
          if (stuckInCover(unit)) {
            unit.phaseExit = true;
            unit.battlePhase = true;
          }
        }
      } else if (unit.phaseExit) {
        unit.battlePhase = true;
        if (!stuckInCover(unit)) {
          unit.phaseExit = false;
          unit.battlePhase = false;
        }
      } else {
        unit.battlePhase = false;
      }
    }

    function startPhase(unit) {
      if (!unit || (unit.phaseLeft | 0) <= 0) return false;
      if (unit.phaseT > 0 || unit.phaseExit) return false;
      unit.phaseLeft -= 1;
      unit.phaseT = 0.95;
      unit.battlePhase = true;
      unit.phaseExit = false;
      spawnBurst(unit.x + unit.w / 2, unit.y + unit.h / 2, "#b8a0ff", 10);
      return true;
    }

    function healMedkit(unit) {
      const maxHp = unit.maxHp || 10;
      const before = unit.hp;
      unit.hp = Math.min(unit.hp + 5, Math.max(maxHp, unit.hp));
      return unit.hp > before;
    }

    function healApple(unit) {
      unit.hp += 10;
      return true;
    }

    function tryPlayerPhase() {
      if (!battleScene || battleScene.done || !player) return;
      if (battleScene.playerDown) return;
      const u = {
        phaseLeft: battleScene.phaseLeft,
        phaseT: battleScene.phaseT,
        phaseExit: battleScene.phaseExit,
        x: player.x,
        y: player.y,
        w: player.w,
        h: player.h,
      };
      if ((u.phaseLeft | 0) <= 0) {
        battleToast("穿透次数用完了", 1.2);
        return;
      }
      if (u.phaseT > 0 || u.phaseExit) return;
      battleScene.phaseLeft -= 1;
      battleScene.phaseT = 0.95;
      battleScene.phaseExit = false;
      player.battlePhase = true;
      spawnBurst(player.x + player.w / 2, player.y + player.h / 2, "#b8a0ff", 10);
      battleToast(`穿透！剩余 ${battleScene.phaseLeft} 次`, 1.2);
      syncBattlePad();
      if (window.GameAudio) GameAudio.playClick();
    }

    function tryPlayerMedkit() {
      if (!battleScene || battleScene.done || !player) return;
      if (battleScene.playerDown) return;
      if ((battleScene.medkits | 0) <= 0) {
        battleToast("没有医疗包了", 1.2);
        return;
      }
      if (battleScene.itemCd > 0) return;
      const fake = { hp: battleScene.playerHp, maxHp: battleScene.playerMaxHp };
      if (!healMedkit(fake)) {
        battleToast("生命已满，医疗包无效", 1.2);
        return;
      }
      battleScene.medkits -= 1;
      battleScene.playerHp = fake.hp;
      battleScene.itemCd = 0.35;
      spawnBurst(player.x + player.w / 2, player.y + 10, "#ff6b6b", 12);
      battleToast(`医疗包 +5 · 剩余 ${battleScene.medkits}`, 1.4);
      syncBattlePad();
      if (window.GameAudio) GameAudio.playClick();
    }

    function tryPlayerApple() {
      if (!battleScene || battleScene.done || !player) return;
      if (battleScene.playerDown) return;
      if ((battleScene.apples | 0) <= 0) {
        battleToast("没有金苹果了", 1.2);
        return;
      }
      if (battleScene.itemCd > 0) return;
      battleScene.apples -= 1;
      battleScene.playerHp += 10;
      battleScene.itemCd = 0.35;
      spawnBurst(player.x + player.w / 2, player.y + 10, "#ffd700", 14);
      battleToast(`金苹果 +10 · 当前 ${battleScene.playerHp} 心`, 1.5);
      syncBattlePad();
      if (window.GameAudio) GameAudio.playClick();
    }

    /** 仅玩家可召唤：无限生成红队单位（旁人/NPC 不能） */
    function trySummonRed() {
      if (!battleScene || battleScene.done || !player) return;
      if (level !== 17 || state !== "playing") return;
      if (battleScene.playerDown || battleScene.playerHp <= 0) {
        battleToast("倒地时不能召唤", 1.2);
        return;
      }
      if ((battleScene.summonCd || 0) > 0) return;
      if (typeof battleScene.makeNpc !== "function") {
        battleToast("召唤失败", 1.2);
        return;
      }

      battleScene.summonRedSeq = (battleScene.summonRedSeq | 0) + 1;
      const seq = battleScene.summonRedSeq;
      const side = seq % 2 === 0 ? 1 : -1;
      const ox = side * (48 + (seq % 5) * 20);
      const sx = player.x + ox;
      const gy = battleScene.groundY || 400;
      const npc = battleScene.makeNpc("red", seq, 0, {
        x: sx,
        floorY: gy,
        weapon: Math.random() > 0.4 ? "gun" : "dagger",
        name: `红队召唤${seq - 9000}`,
      });
      npc.homeX = sx;
      npc.playerSummon = true;
      npc.facing = player.facing >= 0 ? -1 : 1;
      battleScene.npcs.push(npc);
      battleScene.summonRedCount = (battleScene.summonRedCount | 0) + 1;
      battleScene.summonCd = 0.12;
      spawnBurst(npc.x + npc.w / 2, npc.y + 16, "#ff7a6e", 14);
      battleToast(`召唤红队 +1（已召 ${battleScene.summonRedCount}）`, 1.1);
      syncBattlePad();
      if (window.GameAudio) GameAudio.playClick();
    }

    function npcTryItems(npc, foe) {
      if (!npc.alive || npc.itemCd > 0) return;
      const maxHp = npc.maxHp || 10;
      // 残血优先医疗包
      if (npc.hp <= 5 && (npc.medkits | 0) > 0) {
        const fake = { hp: npc.hp, maxHp };
        if (healMedkit(fake)) {
          npc.medkits -= 1;
          npc.hp = fake.hp;
          npc.itemCd = 1.2 + Math.random();
          spawnBurst(npc.x + npc.w / 2, npc.y + 10, "#ff6b6b", 8);
          return;
        }
      }
      // 开战加压或残血时吃金苹果（可超上限）
      if ((npc.apples | 0) > 0 && (npc.hp <= 4 || (npc.hp >= maxHp && foe && Math.abs(foe.x - npc.x) < 360 && Math.random() < 0.01))) {
        npc.apples -= 1;
        npc.hp += 10;
        npc.itemCd = 1.4 + Math.random();
        spawnBurst(npc.x + npc.w / 2, npc.y + 10, "#ffd700", 10);
      }
    }

    function playerKillerInfo() {
      return {
        name: `蓝队${playerName || "玩家"}`,
        team: battleScene.playerTeam || "blue",
        weapon: battleScene.weapon || "gun",
      };
    }

    function npcKillerInfo(npc) {
      return {
        name: npc.name || `${teamLabel(npc.team)}玩家`,
        team: npc.team,
        weapon: npc.weapon || "gun",
      };
    }

    function victimInfoFromNpc(npc) {
      return {
        name: npc.name || `${teamLabel(npc.team)}玩家`,
        team: npc.team,
      };
    }

    function showKillFeed(killer, victim) {
      if (!battleScene || !killer || !victim) return;
      battleScene.killFeed = {
        killerName: killer.name,
        killerTeam: killer.team,
        victimName: victim.name,
        victimTeam: victim.team,
        weapon: killer.weapon === "dagger" ? "dagger" : "gun",
        t: 3,
      };
    }

    function getFlag(team) {
      return (battleScene.flags || []).find((f) => f.team === team) || null;
    }

    /** 某队旗被摘走后，该队不能复活 */
    function teamFlagPlucked(team) {
      const f = getFlag(team);
      return !!(f && f.plucked);
    }

    function canTeamRevive(team) {
      return !teamFlagPlucked(team);
    }

    function canPlayerRevive() {
      if (!battleScene) return false;
      if ((battleScene.revivesLeft | 0) <= 0) return false;
      // 玩家属于蓝队：蓝旗被摘则不能复活
      return canTeamRevive(battleScene.playerTeam || "blue");
    }

    function carrierPos(carrier) {
      if (!carrier) return null;
      if (carrier === "player") {
        if (!player || battleScene.playerDown || battleScene.playerHp <= 0) return null;
        return { x: player.x + player.w / 2, y: player.y + player.h };
      }
      const n = (battleScene.npcs || []).find((x) => x.id === carrier && x.alive);
      if (!n) return null;
      return { x: n.x + n.w / 2, y: n.y + n.h };
    }

    function dropFlagIfCarrier(carrier) {
      for (const f of battleScene.flags || []) {
        if (f.carrier !== carrier) continue;
        f.carrier = null;
        if (carrier === "player" && player) {
          f.x = player.x + player.w / 2;
          f.y = battleScene.groundY;
        } else {
          const n = (battleScene.npcs || []).find((x) => x.id === carrier);
          if (n) {
            f.x = n.x + n.w / 2;
            f.y = battleScene.groundY;
          }
        }
      }
    }

    function tryPickupFlag(flag, carrierId, carrierTeam) {
      if (!flag || flag.carrier) return false;
      // 只能摘对方的旗
      if (flag.team === carrierTeam) return false;
      flag.taken = true;
      flag.plucked = true;
      flag.carrier = carrierId;
      battleToast(`${teamLabel(flag.team)}旗被摘！${teamLabel(flag.team)}不能再复活`, 3);
      if (window.GameAudio) GameAudio.playClick();
      spawnBurst(flag.x, flag.y - 40, teamColor(flag.team), 16);
      // 取消该队正在等待的复活
      for (const n of battleScene.npcs || []) {
        if (n.team === flag.team && !n.alive) n.reviveT = 0;
      }
      checkBattleWin();
      return true;
    }

    function flagTouchBox(flag) {
      const pos = flag.carrier ? carrierPos(flag.carrier) : null;
      const fx = pos ? pos.x : flag.x;
      const fy = pos ? pos.y : flag.y;
      return { x: fx - 16, y: fy - 100, w: 32, h: 100 };
    }

    function updateFlags() {
      if (!battleScene || battleScene.done) return;
      for (const f of battleScene.flags || []) {
        // 更新被扛着的旗坐标
        if (f.carrier) {
          const pos = carrierPos(f.carrier);
          if (!pos) {
            // 持旗者已死，旗掉在地上
            f.carrier = null;
          } else {
            f.x = pos.x;
            f.y = battleScene.groundY;
          }
        }

        const box = flagTouchBox(f);
        // 玩家摘敌方旗
        if (
          !f.carrier &&
          f.team !== (battleScene.playerTeam || "blue") &&
          player &&
          !battleScene.playerDown &&
          battleScene.playerHp > 0 &&
          rectsOverlap(player, box)
        ) {
          tryPickupFlag(f, "player", battleScene.playerTeam || "blue");
        }
        // NPC 摘对方旗
        for (const n of battleScene.npcs || []) {
          if (f.carrier) break;
          if (!n.alive) continue;
          if (n.team === f.team) continue;
          if (rectsOverlap(n, box)) {
            tryPickupFlag(f, n.id, n.team);
            break;
          }
        }
      }
    }

    function startPlayerRevive() {
      if (!battleScene || !canPlayerRevive()) return false;
      battleScene.revivesLeft -= 1;
      battleScene.playerDown = true;
      battleScene.reviveT = 2.2;
      battleScene.done = false;
      dropFlagIfCarrier("player");
      if (player) {
        player.battlePhase = false;
        player.vx = 0;
        player.vy = 0;
        player.x = 40 * (battleScene.pxPerMeter || 25);
        player.y = battleScene.groundY - player.h;
      }
      hideBattlePad();
      statusLabel.textContent = `复活中… 剩余 ${battleScene.revivesLeft} 次`;
      battleToast(`阵亡 · 即将复活（剩 ${battleScene.revivesLeft} 次）`, 2);
      return true;
    }

    function finishPlayerRevive() {
      if (!battleScene || !player) return;
      battleScene.playerDown = false;
      battleScene.reviveT = 0;
      battleScene.playerHp = battleScene.playerMaxHp || 10;
      battleScene.hurtFlash = 0;
      battleScene.cooldown = 0.4;
      player.x = 40 * (battleScene.pxPerMeter || 25);
      player.y = battleScene.groundY - player.h;
      player.vx = 0;
      player.vy = 0;
      player.onGround = true;
      player.battlePhase = false;
      spawnBurst(player.x + player.w / 2, player.y + 20, "#6eb6ff", 18);
      syncBattlePad();
      statusLabel.textContent = "战场 · 已复活";
      battleToast(`复活！还可复活 ${battleScene.revivesLeft} 次`, 2);
    }

    function finishNpcRevive(npc) {
      if (!npc || !battleScene) return;
      if (!canTeamRevive(npc.team)) {
        npc.reviveT = 0;
        return;
      }
      const gy = battleScene.groundY;
      const home = npc.homeX != null ? npc.homeX : npc.guardX != null ? npc.guardX : npc.x;
      npc.alive = true;
      npc.reviveT = 0;
      npc.hp = npc.maxHp || 10;
      npc.x = home;
      npc.y = (npc.floorY != null ? npc.floorY : gy) - npc.h;
      npc.vx = 0;
      npc.vy = 0;
      npc.onGround = true;
      npc.onTrain = false;
      npc.trainSeat = null;
      npc.trainId = null;
      npc.battlePhase = false;
      npc.phaseT = 0;
      npc.phaseExit = false;
      spawnBurst(npc.x + npc.w / 2, npc.y + 20, teamColor(npc.team), 12);
    }

    function hurtTarget(target, dmg, fromTeam, killer) {
      if (!target || !target.alive) return false;
      if (target.onTrain) return false; // 列车上无敌
      // 友军伤害免疫（含玩家对蓝队）
      if (target.team && fromTeam && target.team === fromTeam) return false;
      target.hp -= dmg;
      if (target.hp <= 0) {
        target.hp = 0;
        target.alive = false;
        spawnBurst(target.x + target.w / 2, target.y + target.h / 2, "#ff5533", 14);
        if (killer) showKillFeed(killer, victimInfoFromNpc(target));
        dropFlagIfCarrier(target.id);
        if (canTeamRevive(target.team)) {
          target.reviveT = 2.0 + Math.random() * 0.8;
        } else {
          target.reviveT = 0;
        }
        return true;
      }
      spawnBurst(target.x + target.w / 2, target.y + 10, "#ffd24a", 6);
      return false;
    }

    function hurtPlayer(dmg, killer) {
      if (!battleScene || battleScene.done || !player) return;
      if (battleScene.playerDown || battleScene.reviveT > 0) return;
      if (player.onTrain) return; // 列车上不可被攻击
      battleScene.playerHp -= dmg;
      battleScene.hurtFlash = 0.35;
      shake = Math.max(shake, 10);
      spawnBurst(player.x + player.w / 2, player.y + 12, "#ff5533", 10);
      if (battleScene.playerHp <= 0) {
        battleScene.playerHp = 0;
        if (killer) {
          showKillFeed(killer, {
            name: `蓝队${playerName || "玩家"}`,
            team: battleScene.playerTeam || "blue",
          });
        }
        dropFlagIfCarrier("player");
        if (canPlayerRevive() && startPlayerRevive()) {
          return;
        }
        battleScene.done = true;
        hideBattlePad();
        statusLabel.textContent = "阵亡";
        const teamBlocked = teamFlagPlucked(battleScene.playerTeam || "blue");
        if (teamBlocked) {
          battleToast("蓝队旗已被摘，无法复活…", 2.5);
        } else {
          battleToast("复活次数用尽…", 2);
        }
        setTimeout(() => die("zombie"), 600);
      } else {
        battleToast(`受伤！剩余 ${battleScene.playerHp} 心`, 1.2);
      }
    }

    function teamFightersDefeated(team) {
      const list = (battleScene.npcs || []).filter((n) => n.team === team && !n.flagGuard);
      if (!list.length) return true;
      for (const n of list) {
        if (n.alive) return false;
        if ((n.reviveT || 0) > 0) return false;
      }
      // 还能复活的话，终会被拉起
      return !canTeamRevive(team);
    }

    function checkBattleWin() {
      if (!battleScene || battleScene.done) return;
      if (
        teamFightersDefeated("red") &&
        teamFightersDefeated("yellow") &&
        teamFightersDefeated("green")
      ) {
        battleScene.done = true;
        hideBattlePad();
        statusLabel.textContent = "四队混战 · 胜利！";
        battleToast("敌队全灭 · 通关", 2);
        setTimeout(() => winLevel(), 800);
      }
    }

    function fireGunFrom(sx, sy, facing, team, speed, killer) {
      battleScene.bullets.push({
        x: sx,
        y: sy,
        vx: facing * (speed || 13),
        vy: (Math.random() - 0.5) * 0.4,
        life: 6.5,
        r: 3,
        team,
        dmg: 2,
        killer: killer || null,
      });
    }

    function bulletHitsCover(b) {
      for (const p of platforms) {
        if (!isCoverPlat(p)) continue;
        if (b.x >= p.x && b.x <= p.x + p.w && b.y >= p.y && b.y <= p.y + p.h) return true;
      }
      return false;
    }

    function npcBlocked(npc, nextX) {
      const box = { x: nextX, y: npc.y + 4, w: npc.w, h: npc.h - 8 };
      const was = npc.battlePhase;
      npc.battlePhase = false;
      for (const p of platforms) {
        if (!isCoverPlat(p)) continue;
        if (p.h <= 20) continue;
        if (rectsOverlap(box, p)) {
          npc.battlePhase = was;
          return true;
        }
      }
      npc.battlePhase = was;
      return false;
    }

    function playerAttack() {
      if (!battleScene || battleScene.done || !player) return;
      if (battleScene.playerDown || battleScene.reviveT > 0) return;
      if (player.onTrain) {
        battleToast("列车上不能攻击", 1.2);
        return;
      }
      if (battleScene.cooldown > 0) {
        battleToast("冷却中…", 0.8);
        return;
      }
      const facing = player.facing >= 0 ? 1 : -1;
      if (battleScene.weapon === "gun") {
        const mx = player.x + (facing > 0 ? player.w + 2 : -6);
        const my = player.y + 16;
        fireGunFrom(mx, my, facing, battleScene.playerTeam, 15, playerKillerInfo());
        battleScene.cooldown = 0.45;
        battleScene.muzzleFlash = 0.12;
        shake = Math.max(shake, 4);
        if (window.GameAudio && GameAudio.playGunShot) GameAudio.playGunShot();
        else if (window.GameAudio) GameAudio.playClick();
      } else {
        // 小匕首近战
        const box = {
          x: facing > 0 ? player.x + player.w : player.x - 34,
          y: player.y + 8,
          w: 34,
          h: 28,
        };
        let hitAny = false;
        const killer = playerKillerInfo();
        killer.weapon = "dagger";
        for (const n of battleScene.npcs) {
          if (!n.alive || n.team === battleScene.playerTeam || n.onTrain) continue;
          if (rectsOverlap(box, n)) {
            hurtTarget(n, 3, battleScene.playerTeam, killer);
            hitAny = true;
          }
        }
        battleScene.cooldown = 0.35;
        battleScene.muzzleFlash = 0.1;
        shake = Math.max(shake, hitAny ? 6 : 2);
        if (window.GameAudio) GameAudio.playClick();
        if (hitAny) checkBattleWin();
      }
    }

    function nearestEnemy(npc) {
      let best = null;
      let bestD = 1e9;
      const enemies = battleScene.npcs.filter(
        (n) => n.alive && n.team !== npc.team && !n.onTrain
      );
      for (const e of enemies) {
        const d = Math.abs(e.x - npc.x);
        if (d < bestD) {
          bestD = d;
          best = e;
        }
      }
      // 非蓝队都会打玩家（列车上不可被选为攻击目标）
      if (
        npc.team !== "blue" &&
        player &&
        battleScene.playerHp > 0 &&
        !battleScene.playerDown &&
        !player.onTrain
      ) {
        const d = Math.abs(player.x - npc.x);
        if (d < bestD) {
          bestD = d;
          best = { isPlayer: true, x: player.x, y: player.y, w: player.w, h: player.h, alive: true };
        }
      }
      return best;
    }

    function platformToClimb(npc, dir) {
      const feet = npc.y + npc.h;
      let best = null;
      for (const p of platforms) {
        if (p.theme === "battle" && p.h <= 30 && p.w > 400) continue; // 主地面
        const top = p.y;
        if (top >= feet - 6) continue;
        if (feet - top > 120) continue;
        if (dir >= 0) {
          if (p.x > npc.x - 20 && p.x < npc.x + npc.w + 78) {
            if (!best || top < best.y) best = p;
          }
        } else if (p.x + p.w < npc.x + npc.w + 20 && p.x + p.w > npc.x - 78) {
          if (!best || top < best.y) best = p;
        }
      }
      return best;
    }

    function updateNpc(npc, dt) {
      if (!npc.alive) {
        if ((npc.reviveT || 0) > 0) {
          // 复活等待中若队旗被摘，取消复活
          if (!canTeamRevive(npc.team)) {
            npc.reviveT = 0;
            return;
          }
          npc.reviveT -= dt;
          if (npc.reviveT <= 0) finishNpcRevive(npc);
        }
        return;
      }
      if (npc.vy == null) npc.vy = 0;
      if (npc.onGround == null) npc.onGround = true;
      if (npc.jumpCd == null) npc.jumpCd = 0;
      npc.trainCd = Math.max(0, (npc.trainCd || 0) - dt);

      // 在列车上：只聊天，不走路
      if (npc.onTrain) {
        npc.vx = 0;
        npc.vy = 0;
        npc.bob += dt * 5;
        npc.chatCd = Math.max(0, (npc.chatCd || 0) - dt);
        if (npc.chatT > 0) {
          npc.chatT -= dt;
          if (npc.chatT <= 0) {
            npc.chatT = 0;
            npc.chat = "";
          }
        }
        maybeNpcChat(npc, null);
        return;
      }

      npc.bob += dt * 5;
      npc.attackCd = Math.max(0, npc.attackCd - dt);
      npc.jumpCd = Math.max(0, npc.jumpCd - dt);
      npc.itemCd = Math.max(0, (npc.itemCd || 0) - dt);
      npc.chatCd = Math.max(0, (npc.chatCd || 0) - dt);
      if (npc.chatT > 0) {
        npc.chatT -= dt;
        if (npc.chatT <= 0) {
          npc.chatT = 0;
          npc.chat = "";
        }
      }

      const foe = nearestEnemy(npc);
      let wantJump = false;

      if (npc.followPlayer && npc.team === "blue" && !npc.flagGuard) {
        updateFollowNpc(npc, foe, dt);
        // 跟随中也会翻越掩体
        if (npc.onGround && npcBlocked(npc, npc.x + (npc.facing || 1) * 8)) {
          if ((npc.phaseLeft | 0) > 0 && npc.phaseT <= 0 && !npc.phaseExit) {
            startPhase(npc);
          } else {
            wantJump = true;
          }
        }
      } else if (npc.flagGuard) {
        const home = npc.guardX != null ? npc.guardX : npc.x;
        const foeNear = foe && Math.abs(foe.x - home) < 260;
        if (foeNear) {
          const dx = foe.x - npc.x;
          npc.facing = dx >= 0 ? 1 : -1;
          const dist = Math.abs(dx);
          if (npc.weapon === "gun") {
            if (dist > 140) npc.vx = npc.facing * 2.0;
            else if (dist < 70) npc.vx = -npc.facing * 1.4;
            else {
              npc.vx = Math.sin(npc.bob) * 0.3;
              if (npc.attackCd <= 0) {
                fireGunFrom(
                  npc.x + (npc.facing > 0 ? npc.w : -4),
                  npc.y + 16,
                  npc.facing,
                  npc.team,
                  12,
                  npcKillerInfo(npc)
                );
                npc.attackCd = 0.75 + Math.random() * 0.4;
              }
            }
          } else if (dist > 34) {
            npc.vx = npc.facing * 2.5;
          } else {
            npc.vx = 0;
            if (npc.attackCd <= 0) {
              const killer = npcKillerInfo(npc);
              killer.weapon = "dagger";
              if (foe.isPlayer) hurtPlayer(2, killer);
              else hurtTarget(foe, 2, npc.team, killer);
              npc.attackCd = 0.65 + Math.random() * 0.35;
              checkBattleWin();
            }
          }
          // 不要离岗太远
          if (Math.abs(npc.x - home) > 120) {
            npc.vx = Math.sign(home - npc.x) * 2.4;
          }
        } else {
          const dxh = home - npc.x;
          if (Math.abs(dxh) > 6) {
            npc.facing = dxh >= 0 ? 1 : -1;
            npc.vx = npc.facing * 1.8;
          } else {
            npc.vx = 0;
            npc.x = home;
          }
        }
      } else if (!foe) {
        npc.vx = 0;
      } else {
        const dx = foe.x - npc.x;
        npc.facing = dx >= 0 ? 1 : -1;
        const dist = Math.abs(dx);
        const foeHigher = foe.y + foe.h < npc.y + npc.h - 24;

        if (npc.sniper) {
          npc.vx = 0;
          if (npc.attackCd <= 0 && dist < 900) {
            fireGunFrom(
              npc.x + (npc.facing > 0 ? npc.w : -4),
              npc.y + 14,
              npc.facing,
              npc.team,
              14,
              npcKillerInfo(npc)
            );
            npc.attackCd = 1.0 + Math.random() * 0.6;
          }
          // 敌人在下方较远时，跳下高台参战
          if (npc.onGround && !foeHigher && dist > 420 && foe.y > npc.y + 40) {
            wantJump = true;
            npc.vx = npc.facing * 2.6;
          }
        } else if (npc.weapon === "gun") {
          if (dist > 280) {
            npc.vx = npc.facing * 2.3;
          } else if (dist < 100) {
            npc.vx = -npc.facing * 1.7;
          } else {
            npc.vx = Math.sin(npc.bob) * 0.45;
            if (npc.attackCd <= 0) {
              fireGunFrom(
                npc.x + (npc.facing > 0 ? npc.w : -4),
                npc.y + 16,
                npc.facing,
                npc.team,
                12,
                npcKillerInfo(npc)
              );
              npc.attackCd = 0.85 + Math.random() * 0.5;
            }
          }
          if (foeHigher && dist < 480) wantJump = true;
        } else {
          if (dist > 36) {
            npc.vx = npc.facing * 2.7;
          } else {
            npc.vx = 0;
            if (npc.attackCd <= 0) {
              const killer = npcKillerInfo(npc);
              killer.weapon = "dagger";
              if (foe.isPlayer) hurtPlayer(2, killer);
              else hurtTarget(foe, 2, npc.team, killer);
              npc.attackCd = 0.7 + Math.random() * 0.4;
              checkBattleWin();
            }
          }
          if (foeHigher) wantJump = true;
        }

        // 前方有掩体挡路 → 优先穿透，否则起跳翻越
        if (npc.onGround && npcBlocked(npc, npc.x + npc.facing * 8)) {
          if ((npc.phaseLeft | 0) > 0 && npc.phaseT <= 0 && !npc.phaseExit) {
            startPhase(npc);
            if (Math.abs(npc.vx) < 1.2) npc.vx = npc.facing * 2.6;
          } else {
            wantJump = true;
            if (Math.abs(npc.vx) < 1.2) npc.vx = npc.facing * 2.4;
          }
        }
        // 前方有可攀爬高台
        if (npc.onGround && platformToClimb(npc, npc.facing)) {
          wantJump = true;
          if (Math.abs(npc.vx) < 1) npc.vx = npc.facing * 2.2;
        }
      }

      npcTryItems(npc, foe);
      tickPhaseState(npc, dt);
      maybeNpcChat(npc, foe);

      if (wantJump && npc.onGround && npc.jumpCd <= 0 && !npc.battlePhase) {
        npc.vy = JUMP * (0.9 + Math.random() * 0.12);
        npc.onGround = false;
        npc.jumpCd = 0.5 + Math.random() * 0.25;
        spawnBurst(npc.x + npc.w / 2, npc.y + npc.h, "#ffd27a", 4);
      }

      // 物理：重力 + 平台碰撞
      npc.vy += GRAVITY;
      npc.vy = Math.min(npc.vy, 16);

      npc.x += npc.vx;
      npc.x = clamp(npc.x, 20, worldWidth - 50);
      const hitX = solidAt(npc, 0, 0);
      if (hitX) {
        if (npc.vx > 0) npc.x = hitX.x - npc.w;
        else if (npc.vx < 0) npc.x = hitX.x + hitX.w;
        npc.vx = 0;
        // 贴墙时尽快再跳
        if (npc.onGround && npc.jumpCd > 0.15) npc.jumpCd = 0.12;
        if (npc.onGround && foe && npc.weapon === "gun" && npc.attackCd <= 0) {
          const dist = Math.abs(foe.x - npc.x);
          if (dist < 520) {
            fireGunFrom(
              npc.x + (npc.facing > 0 ? npc.w : -4),
              npc.y + 16,
              npc.facing,
              npc.team,
              12,
              npcKillerInfo(npc)
            );
            npc.attackCd = 0.7 + Math.random() * 0.4;
          }
        }
      }

      npc.y += npc.vy;
      npc.onGround = false;
      const hitY = solidAt(npc, 0, 0);
      if (hitY) {
        if (npc.vy > 0) {
          npc.y = hitY.y - npc.h;
          npc.vy = 0;
          npc.onGround = true;
        } else if (npc.vy < 0) {
          const feet = npc.y + npc.h;
          if (feet > hitY.y + hitY.h * 0.55) {
            npc.y = hitY.y + hitY.h;
            npc.vy = 0;
          }
        }
      }

      // 掉出战场时拉回地面
      if (npc.y > battleScene.groundY + 40) {
        npc.y = battleScene.groundY - npc.h;
        npc.vy = 0;
        npc.onGround = true;
      }
    }

    function bindBattlePad() {
      if (bound) return;
      bound = true;
      if (btnGun) btnGun.addEventListener("click", () => setWeapon("gun"));
      if (btnDagger) btnDagger.addEventListener("click", () => setWeapon("dagger"));
      if (btnFire) {
        btnFire.addEventListener("click", () => {
          if (battleScene && battleScene.weapon !== "gun") setWeapon("gun");
          playerAttack();
        });
      }
      if (btnSlash) {
        btnSlash.addEventListener("click", () => {
          if (battleScene && battleScene.weapon !== "dagger") setWeapon("dagger");
          playerAttack();
        });
      }
      if (btnPhase) btnPhase.addEventListener("click", () => tryPlayerPhase());
      if (btnMedkit) btnMedkit.addEventListener("click", () => tryPlayerMedkit());
      if (btnApple) btnApple.addEventListener("click", () => tryPlayerApple());
      if (btnSummonRed) btnSummonRed.addEventListener("click", () => trySummonRed());
      window.addEventListener("keydown", (e) => {
        if (level !== 17 || state !== "playing" || !battleScene || battleScene.done) return;
        if (e.key === "f" || e.key === "F") {
          e.preventDefault();
          tryPlayerPhase();
        } else if (e.key === "v" || e.key === "V") {
          e.preventDefault();
          tryPlayerMedkit();
        } else if (e.key === "b" || e.key === "B") {
          e.preventDefault();
          tryPlayerApple();
        } else if (e.key === "r" || e.key === "R") {
          e.preventDefault();
          trySummonRed();
        }
      });
    }

    function initBattle17() {
      bindBattlePad();
      syncBattlePad();
      if (battleScene) {
        battleScene.playerHp = 10;
        battleScene.playerMaxHp = 10;
        battleScene.weapon = "gun";
        battleScene.cooldown = 0;
        battleScene.bullets = [];
        battleScene.done = false;
        battleScene.hurtFlash = 0;
        battleScene.phaseLeft = 3;
        battleScene.phaseT = 0;
        battleScene.phaseExit = false;
        battleScene.medkits = 3;
        battleScene.apples = 2;
        battleScene.itemCd = 0;
        battleScene.killFeed = null;
        battleScene.revivesLeft = 3;
        battleScene.reviveT = 0;
        battleScene.playerDown = false;
        battleScene.heardChat = "";
        battleScene.summonRedCount = 0;
        battleScene.summonCd = 0;
        if (battleScene.summonRedSeq == null || battleScene.summonRedSeq < 9000) {
          battleScene.summonRedSeq = 9000;
        }
        // 清掉上次召唤的红队
        if (battleScene.npcs) {
          battleScene.npcs = battleScene.npcs.filter((n) => !n.playerSummon);
        }
        if (battleScene.trains && battleScene.trains.length) {
          for (const tr of battleScene.trains) {
            const st0 = trainRouteStation(tr, 0);
            tr.stationIdx = 0;
            tr.routeDir = 1;
            tr.state = "dock";
            tr.doorOpen = 1;
            tr.waitT = tr.line === 1 ? 8 : tr.line === 2 ? 14 : tr.line === 3 ? 11 : 16;
            tr.speed = 0;
            tr.needAlight = false;
            tr._goIdx = null;
            tr.screenMsg = `${tr.lineName} 待命`;
            if (st0) tr.x = trainDockX(tr, st0);
            (tr.seats || []).forEach((s) => {
              s.rider = null;
            });
          }
          battleScene.train = battleScene.trains[3] || battleScene.trains[0];
          if (window.GameAudio && GameAudio.stopTrainLoop) GameAudio.stopTrainLoop();
        } else if (battleScene.train) {
          const sts = battleScene.stations || [];
          battleScene.train.stationIdx = 0;
          battleScene.train.state = "dock";
          battleScene.train.doorOpen = 1;
          battleScene.train.waitT = 12;
          battleScene.train.speed = 0;
          battleScene.train.needAlight = false;
          battleScene.train.screenMsg = "下一站：黄队站";
          if (sts[0]) battleScene.train.x = sts[0].x;
          (battleScene.train.seats || []).forEach((s) => {
            s.rider = null;
          });
          if (window.GameAudio && GameAudio.stopTrainLoop) GameAudio.stopTrainLoop();
        }
        if (player) {
          player.battlePhase = false;
          player.onTrain = false;
          player.trainSeat = null;
          player.trainId = null;
          player.trainCd = 0;
        }
        (battleScene.flags || []).forEach((f) => {
          f.taken = false;
          f.plucked = false;
          f.carrier = null;
          f.x = f.homeX != null ? f.homeX : f.x;
          f.y = battleScene.groundY;
        });
        battleScene.npcs.forEach((n) => {
          n.alive = true;
          n.reviveT = 0;
          n.hp = 10;
          n.maxHp = 10;
          n.attackCd = 0.5 + Math.random();
          n.vy = 0;
          n.onGround = true;
          n.jumpCd = Math.random() * 0.4;
          n.phaseLeft = 3;
          n.phaseT = 0;
          n.phaseExit = false;
          n.battlePhase = false;
          n.medkits = 3;
          n.apples = 2;
          n.itemCd = 0.6 + Math.random();
          n.chat = "";
          n.chatT = 0;
          n.chatCd = 2 + Math.random() * 8;
          n.followPlayer = false;
          n.followSlot = 0;
          n.aggressive = false;
          n.aggressiveT = 0;
          n.onTrain = false;
          n.trainSeat = null;
          n.trainId = null;
          n.trainCd = 0;
          if (n.homeX != null) n.x = n.homeX;
          else if (n.flagGuard && n.guardX != null) n.x = n.guardX;
          if (n.floorY != null) n.y = n.floorY - n.h;
          else n.y = battleScene.groundY - n.h;
        });
      }
      statusLabel.textContent = "战场 · 四队混战 · 枪 / 小匕首";
      battleToast("聊天随便说 · 1/2/3/4号线换乘", 3.8);
    }

    function updateBattle17(dt) {
      if (!battleScene || state !== "playing" || level !== 17) return;
      const bs = battleScene;
      if (bs.toastT > 0) {
        bs.toastT -= dt;
        if (bs.toastT <= 0) bs.toast = "";
      }
      if (bs.cooldown > 0) bs.cooldown -= dt;
      if (bs.muzzleFlash > 0) bs.muzzleFlash -= dt;
      if (bs.hurtFlash > 0) bs.hurtFlash -= dt;
      if (bs.itemCd > 0) bs.itemCd -= dt;
      if (bs.summonCd > 0) bs.summonCd -= dt;
      if (bs.killFeed) {
        bs.killFeed.t -= dt;
        if (bs.killFeed.t <= 0) bs.killFeed = null;
      }

      // 复活倒计时
      if (bs.playerDown && bs.reviveT > 0) {
        bs.reviveT -= dt;
        statusLabel.textContent = `复活中 ${Math.ceil(bs.reviveT)}s · 剩 ${bs.revivesLeft} 次`;
        if (bs.reviveT <= 0) finishPlayerRevive();
      }

      // 玩家穿透状态
      if (player && !bs.playerDown) {
        const pu = {
          phaseT: bs.phaseT,
          phaseExit: bs.phaseExit,
          battlePhase: false,
          x: player.x,
          y: player.y,
          w: player.w,
          h: player.h,
        };
        if (pu.phaseT > 0) {
          pu.phaseT -= dt;
          pu.battlePhase = true;
          if (pu.phaseT <= 0) {
            pu.phaseT = 0;
            pu.battlePhase = false;
            player.battlePhase = false;
            if (stuckInCover(player)) {
              pu.phaseExit = true;
              pu.battlePhase = true;
            }
          }
        } else if (bs.phaseExit || pu.phaseExit) {
          player.battlePhase = false;
          if (stuckInCover(player)) {
            pu.phaseExit = true;
            pu.battlePhase = true;
          } else {
            pu.phaseExit = false;
            pu.battlePhase = false;
          }
        } else {
          pu.battlePhase = false;
          pu.phaseExit = false;
        }
        bs.phaseT = pu.phaseT;
        bs.phaseExit = !!pu.phaseExit;
        player.battlePhase = !!pu.battlePhase;
      }

      if (bs.done) {
        if (player) player.battlePhase = false;
        syncBattlePad();
        return;
      }

      updateFlags();
      updateNpcChatReplies();
      updateTrain(dt);
      if (player) player.trainCd = Math.max(0, (player.trainCd || 0) - dt);
      for (const n of bs.npcs) updateNpc(n, dt);

      // 子弹
      for (const b of bs.bullets) {
        b.x += b.vx;
        b.y += b.vy;
        b.life -= dt;
        if (bulletHitsCover(b)) {
          b.life = 0;
          spawnBurst(b.x, b.y, "#c4b89a", 4);
          continue;
        }
        // 打 NPC
        for (const n of bs.npcs) {
          if (!n.alive || n.team === b.team || n.onTrain) continue;
          if (
            b.x >= n.x &&
            b.x <= n.x + n.w &&
            b.y >= n.y &&
            b.y <= n.y + n.h
          ) {
            hurtTarget(n, b.dmg, b.team, b.killer || { name: `${teamLabel(b.team)}玩家`, team: b.team, weapon: "gun" });
            b.life = 0;
            checkBattleWin();
            break;
          }
        }
        // 敌方子弹打玩家（非己方队伍）
        if (
          b.life > 0 &&
          b.team !== (bs.playerTeam || "blue") &&
          player &&
          !bs.playerDown &&
          !player.onTrain &&
          bs.playerHp > 0 &&
          b.x >= player.x &&
          b.x <= player.x + player.w &&
          b.y >= player.y &&
          b.y <= player.y + player.h
        ) {
          hurtPlayer(b.dmg, b.killer || { name: `${teamLabel(b.team)}玩家`, team: b.team, weapon: "gun" });
          b.life = 0;
        }
      }
      bs.bullets = bs.bullets.filter((b) => b.life > 0 && b.x > -40 && b.x < worldWidth + 40);

      syncBattlePad();
    }

    function drawHearts(x, y, hp, maxHp, scale) {
      const s = scale || 1;
      const base = maxHp || 10;
      const shown = Math.max(base, Math.ceil(hp));
      for (let i = 0; i < shown; i++) {
        const hx = x + i * (9 * s);
        if (i < base) {
          ctx.fillStyle = i < hp ? "#e74c3c" : "#444";
        } else {
          ctx.fillStyle = i < hp ? "#ffd700" : "#555";
        }
        ctx.fillRect(hx, y, 7 * s, 6 * s);
      }
    }

    function drawBattleUnit(u, isPlayer) {
      const sx = u.x - cameraX;
      const sy = u.y;
      if (sx < -60 || sx > W + 60) return;
      const team = isPlayer ? battleScene.playerTeam : u.team;
      const shirt = teamShirt(team);
      const pants = teamPants(team);
      const hop = isPlayer ? 0 : u.onGround === false ? 0 : Math.sin(u.bob) * 1.2;
      const phasing = isPlayer ? player && player.battlePhase : u.battlePhase;

      ctx.save();
      if (phasing) ctx.globalAlpha = 0.45;

      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath();
      ctx.ellipse(sx + 14, sy + u.h + 3, 12, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = shirt;
      ctx.fillRect(sx + 6, sy + 10 + hop, 16, 22);
      ctx.fillStyle = "#ffe0b8";
      ctx.fillRect(sx + 6, sy + hop, 16, 14);
      ctx.fillStyle = "#1a0c08";
      ctx.fillRect(sx + (u.facing >= 0 ? 14 : 8), sy + 5 + hop, 3, 3);
      ctx.fillStyle = pants;
      ctx.fillRect(sx + 7, sy + 30 + hop, 5, 10);
      ctx.fillRect(sx + 16, sy + 30 + hop, 5, 10);

      // 武器示意
      const wpn = isPlayer ? battleScene.weapon : u.weapon;
      ctx.fillStyle = "#222";
      if (wpn === "gun") {
        const gx = u.facing >= 0 ? sx + 20 : sx - 10;
        ctx.fillRect(gx, sy + 16 + hop, 14, 4);
      } else {
        const dx = u.facing >= 0 ? sx + 22 : sx - 4;
        ctx.fillRect(dx, sy + 14 + hop, 3, 12);
      }

      ctx.restore();

      // 头顶「玩家」
      const label = isPlayer ? playerName || "玩家" : u.name || "玩家";
      ctx.save();
      ctx.font = "11px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0,0,0,0.75)";
      ctx.fillStyle = teamColor(team);
      ctx.strokeText(label, sx + 14, sy - 14 + hop);
      ctx.fillText(label, sx + 14, sy - 14 + hop);
      ctx.restore();

      if (!isPlayer && u.chat && u.chatT > 0 && typeof drawChatBubble === "function") {
        drawChatBubble(sx + 14, sy - 30 + hop, u.chat, teamColor(team));
      }

      drawHearts(sx - 18, sy - 8 + hop, u.hp, u.maxHp || 10, 0.9);
    }

    function drawKillGun(cx, cy, weapon) {
      // 枪尾朝左（击杀者），枪口朝右（被击杀者）
      ctx.save();
      ctx.translate(cx, cy);
      if (weapon === "dagger") {
        ctx.fillStyle = "#c0c0c0";
        ctx.fillRect(-10, -2, 22, 4);
        ctx.fillStyle = "#8b5a2b";
        ctx.fillRect(-14, -5, 6, 10);
        ctx.fillStyle = "#eee";
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(20, -4);
        ctx.lineTo(20, 4);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = "#2a2a2a";
        ctx.fillRect(-18, -4, 30, 8);
        // 枪托（尾部 · 指向击杀者）
        ctx.fillStyle = "#5a3a1a";
        ctx.fillRect(-26, -7, 10, 14);
        ctx.fillRect(-28, -3, 4, 10);
        ctx.fillStyle = "#3a3a3a";
        ctx.fillRect(-4, 2, 6, 10);
        // 枪口（指向被击杀者）
        ctx.fillStyle = "#111";
        ctx.fillRect(12, -3, 14, 6);
        ctx.fillStyle = "#ff9a2a";
        ctx.beginPath();
        ctx.arc(28, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    function drawKillFeedBanner() {
      const kf = battleScene && battleScene.killFeed;
      if (!kf) return;

      const fade = kf.t < 0.4 ? kf.t / 0.4 : kf.t > 2.6 ? (3 - kf.t) / 0.4 : 1;
      const kName = kf.killerName || "玩家";
      const vName = kf.victimName || "玩家";
      const mid = kf.weapon === "dagger" ? "刺死了" : "杀死了";

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, fade));
      ctx.font = "bold 15px 'Noto Sans SC', sans-serif";
      const leftW = ctx.measureText(kName).width;
      const midW = ctx.measureText(mid).width;
      const rightW = ctx.measureText(vName).width;
      const gunW = 64;
      const padX = 18;
      const gap = 10;
      const contentW = leftW + gap + gunW + gap + midW + gap + rightW;
      const bw = Math.min(W - 40, Math.max(420, contentW + padX * 2));
      const bh = 44;
      const bx = (W - bw) / 2;
      const by = 8;

      ctx.fillStyle = "rgba(8, 6, 4, 0.86)";
      ctx.strokeStyle = "rgba(255, 210, 74, 0.55)";
      ctx.lineWidth = 2;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 8);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeRect(bx, by, bw, bh);
      }

      let x = bx + (bw - contentW) / 2;
      const ty = by + 28;

      ctx.textAlign = "left";
      ctx.fillStyle = teamColor(kf.killerTeam);
      ctx.fillText(kName, x, ty);
      x += leftW + gap;

      drawKillGun(x + gunW / 2, by + bh / 2, kf.weapon);
      x += gunW + gap;

      ctx.fillStyle = "#ffd24a";
      ctx.fillText(mid, x, ty);
      x += midW + gap;

      ctx.fillStyle = teamColor(kf.victimTeam);
      ctx.fillText(vName, x, ty);

      ctx.restore();
    }

    function drawTeamFlags(bs) {
      const flags = bs.flags || [];
      const t = typeof time === "number" ? time : performance.now() / 1000;
      for (const f of flags) {
        let worldX = f.x;
        let baseY = f.y || bs.groundY;
        if (f.carrier) {
          const pos = carrierPos(f.carrier);
          if (pos) {
            worldX = pos.x;
            baseY = pos.y;
          }
        }
        const sx = worldX - cameraX;
        if (sx < -80 || sx > W + 80) continue;

        const poleH = f.carrier ? 56 : 110;
        const topY = baseY - poleH;
        const wave = Math.sin(t * 3 + (f.homeX || f.x) * 0.01) * 4;
        const col = teamColor(f.team);
        const short =
          f.team === "blue" ? "蓝" : f.team === "red" ? "红" : f.team === "yellow" ? "黄" : f.team === "green" ? "绿" : "?";

        if (!f.carrier) {
          // 底座
          ctx.fillStyle = "#3a3428";
          ctx.fillRect(sx - 8, baseY - 6, 16, 8);
          ctx.fillStyle = "#5a5040";
          ctx.fillRect(sx - 6, baseY - 4, 12, 4);
        }

        // 旗杆
        ctx.fillStyle = "#c8b89a";
        ctx.fillRect(sx - 2, topY, 4, poleH);
        ctx.fillStyle = "#8a7a5a";
        ctx.fillRect(sx - 2, topY, 1, poleH);

        // 旗帜
        ctx.beginPath();
        ctx.moveTo(sx + 2, topY + 4);
        ctx.lineTo(sx + 48 + wave, topY + 18);
        ctx.lineTo(sx + 2, topY + 36);
        ctx.closePath();
        ctx.fillStyle = teamShirt(f.team);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(sx + 2, topY + 8);
        ctx.lineTo(sx + 36 + wave * 0.7, topY + 18);
        ctx.lineTo(sx + 2, topY + 30);
        ctx.closePath();
        ctx.fillStyle = col;
        ctx.fill();

        ctx.fillStyle = "#fff";
        ctx.font = "bold 10px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(short, sx + 16 + wave * 0.35, topY + 22);

        if (f.plucked && !f.carrier) {
          ctx.fillStyle = "#ffd24a";
          ctx.font = "10px 'Noto Sans SC', sans-serif";
          ctx.fillText("已掉落", sx, topY - 6);
        }
      }
    }

    function drawBattleExtras() {
      if (!battleScene || level !== 17) return;
      const bs = battleScene;
      const topY = bs.killFeed ? 64 : 32;

      // 战场氛围
      ctx.fillStyle = "rgba(40, 30, 20, 0.25)";
      ctx.fillRect(0, 0, W, bs.groundY - 20);

      drawTrainAndStations();

      // 队旗（纯装饰，无碰撞）
      drawTeamFlags(bs);

      ctx.fillStyle = "#ffd24a";
      ctx.font = "bold 14px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("四队混战 · 10000米", 24, topY);
      ctx.fillStyle = "#9ab";
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      const bluePlayers = livingPlayersOf("blue").length + (bs.playerHp > 0 && !bs.playerDown ? 1 : 0);
      const blueGuards = livingGuardsOf("blue").length;
      const blueN = bluePlayers + blueGuards;
      const yellowN = livingPlayersOf("yellow").length;
      const greenN = livingPlayersOf("green").length;
      const redN = livingPlayersOf("red").length;
      const pluckedTeams = (bs.flags || []).filter((f) => f.plucked).map((f) => teamLabel(f.team));
      ctx.fillText(
        `蓝玩家 ${bluePlayers}/100 · 蓝守卫 ${blueGuards}/30 · 黄 ${yellowN}/50 · 绿 ${greenN}/50 · 红 ${redN}/50 · 复活 ${bs.revivesLeft}${
          pluckedTeams.length ? `（${pluckedTeams.join("、")}不可复活）` : ""
        }`,
        24,
        topY + 18
      );

      // 右上角人数
      ctx.textAlign = "right";
      ctx.font = "bold 13px 'Noto Sans SC', sans-serif";
      ctx.fillStyle = teamColor("blue");
      ctx.fillText(`蓝 ${blueN}`, W - 24, topY);
      ctx.fillStyle = teamColor("yellow");
      ctx.fillText(`黄 ${yellowN}`, W - 24, topY + 18);
      ctx.fillStyle = teamColor("green");
      ctx.fillText(`绿 ${greenN}`, W - 24, topY + 36);
      ctx.fillStyle = teamColor("red");
      ctx.fillText(`红 ${redN}`, W - 24, topY + 54);
      ctx.textAlign = "left";

      // 玩家血量条（含超量金心）
      const heartW = Math.max(120, Math.max(bs.playerMaxHp, Math.ceil(bs.playerHp)) * 10 + 40);
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(24, topY + 26, heartW, 18);
      drawHearts(28, topY + 30, bs.playerHp, bs.playerMaxHp, 1.1);
      ctx.fillStyle = bs.playerHp > bs.playerMaxHp ? "#ffd700" : "#fff";
      ctx.font = "10px 'Noto Sans SC', sans-serif";
      ctx.fillText(`${bs.playerHp}/${bs.playerMaxHp}`, 28 + heartW - 36, topY + 39);

      // 物品栏
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(24, topY + 48, 240, 18);
      ctx.fillStyle = "#cbb8ff";
      ctx.font = "11px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(
        `穿透 ${bs.phaseLeft}  医疗包 ${bs.medkits}  金苹果 ${bs.apples}  复活 ${bs.revivesLeft}  · 1/2/3/4号线`,
        30,
        topY + 61
      );

      for (const n of bs.npcs) {
        if (n.alive) drawBattleUnit(n, false);
      }

      // 子弹
      for (const b of bs.bullets) {
        ctx.fillStyle = teamColor(b.team);
        ctx.beginPath();
        ctx.arc(b.x - cameraX, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (bs.muzzleFlash > 0 && player) {
        const facing = player.facing >= 0 ? 1 : -1;
        const mx = player.x - cameraX + (facing > 0 ? player.w + 4 : -4);
        ctx.fillStyle = "#ff9a2a";
        ctx.beginPath();
        ctx.arc(mx, player.y + 16, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      if (bs.hurtFlash > 0) {
        ctx.fillStyle = `rgba(200,0,0,${bs.hurtFlash * 0.45})`;
        ctx.fillRect(0, 0, W, H);
      }

      // 重新画玩家（蓝队皮肤），盖住默认外观
      if (player && bs.playerHp > 0 && !bs.playerDown) {
        drawBattleUnit(
          {
            x: player.x,
            y: player.y,
            w: player.w,
            h: player.h,
            facing: player.facing,
            hp: bs.playerHp,
            maxHp: bs.playerMaxHp,
            team: bs.playerTeam,
            bob: 0,
            weapon: bs.weapon,
            name: playerName || "玩家",
            battlePhase: player.battlePhase,
          },
          true
        );
      }

      if (bs.toast) {
        ctx.fillStyle = "rgba(0,0,0,0.72)";
        ctx.fillRect(W / 2 - 180, H - 72, 360, 36);
        ctx.fillStyle = "#ffd24a";
        ctx.font = "12px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(bs.toast, W / 2, H - 48);
      }

      // 击杀弹窗：画面正上方，持续 3 秒
      drawKillFeedBanner();
    }

    function syncBattle17OnLeave() {
      hideBattlePad();
      if (player) player.battlePhase = false;
    }

    S.initBattle17 = initBattle17;
    S.updateBattle17 = updateBattle17;
    S.drawBattleExtras = drawBattleExtras;
    S.syncBattle17OnLeave = syncBattle17OnLeave;
  }
};
