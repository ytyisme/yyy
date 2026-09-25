// 小游戏场景注册表：统一 install / init / update / draw / leave / click 接线
// game.js 只保留场景状态 let（供 with(S) 使用），钩子挂在 S 上由本模块收集。
(function () {
  // 顺序即 tryClick / 部分绘制的优先级，勿随意打乱
  const DEFS = [
    { level: 14, clickOrder: 10, sceneKey: "towerScene", install: "installTower14", init: "initTower14", update: "updateTower14", draw: "drawTowerExtras", leave: "syncTower14OnLeave", click: "tryClickTower14" },
    { level: 15, clickOrder: 11, sceneKey: "subwayScene", install: "installSubway15", init: "initSubway15", update: "updateSubway15", draw: "drawSubwayExtras", leave: "syncSubway15OnLeave", click: "tryClickSubway15", drawAfter: "drawSubwayForeground" },
    { level: 16, sceneKey: "rangeScene", install: "installRange16", init: "initRange16", update: "updateRange16", draw: "drawRangeExtras", leave: "syncRange16OnLeave" },
    { level: 17, sceneKey: "battleScene", install: "installBattle17", init: "initBattle17", update: "updateBattle17", draw: "drawBattleExtras", leave: "syncBattle17OnLeave" },
    { level: 18, sceneKey: "schoolScene", install: "installSchool18", init: "initSchool18", update: "updateSchool18", draw: "drawSchoolExtras", leave: "syncSchool18OnLeave" },
    { level: 19, sceneKey: "musicScene", install: "installMusic19", init: "initMusic19", update: "updateMusic19", draw: "drawMusicExtras", leave: "syncMusic19OnLeave" },
    { level: 20, clickOrder: 12, sceneKey: "dateScene", install: "installDate20", init: "initDate20", update: "updateDate20", draw: "drawDateExtras", leave: "syncDate20OnLeave", click: "tryClickDate20" },
    { level: 21, sceneKey: "kongScene", install: "installKong21", init: "initKong21", update: "updateKong21", draw: "drawKongExtras", leave: "syncKong21OnLeave" },
    { level: 22, sceneKey: "starHouseScene", install: "installStarHouse22", init: "initStarHouse22", update: "updateStarHouse22", draw: "drawStarHouseExtras", leave: "syncStarHouse22OnLeave" },
    { level: 23, sceneKey: "matchScene", install: "installMatch23", init: "initMatch23", update: "updateMatch23", draw: "drawMatchExtras", leave: "syncMatch23OnLeave" },
    { level: 24, sceneKey: "furnaceScene", install: "installFurnace24", init: "initFurnace24", update: "updateFurnace24", draw: "drawFurnaceExtras", leave: "syncFurnace24OnLeave" },
    { level: 25, sceneKey: "twinScene", install: "installTwin25", init: "initTwin25", update: "updateTwin25", draw: "drawTwinExtras", leave: "syncTwin25OnLeave" },
    { level: 26, sceneKey: "planeScene", install: "installPlane26", init: "initPlane26", update: "updatePlane26", draw: "drawPlaneExtras", leave: "syncPlane26OnLeave" },
    { level: 27, sceneKey: "pipeScene", install: "installPipe27", init: "initPipe27", update: "updatePipe27", draw: "drawPipeExtras", leave: "syncPipe27OnLeave" },
    { level: 28, sceneKey: "labScene", install: "installLab28", init: "initLab28", update: "updateLab28", draw: "drawLabExtras", leave: "syncLab28OnLeave" },
    { level: 29, clickOrder: 0, sceneKey: "toiletScene", install: "installToilet29", init: "initToilet29", update: "updateToilet29", draw: "drawToiletExtras", leave: "syncToilet29OnLeave", click: "tryClickToilet29" },
    { level: 30, clickOrder: 1, sceneKey: "maliangScene", install: "installMaliang30", init: "initMaliang30", update: "updateMaliang30", draw: "drawMaliangExtras", leave: "syncMaliang30OnLeave", click: "tryClickMaliang30" },
    { level: 31, clickOrder: 2, sceneKey: "ml31Scene", install: "installMaliang31", init: "initMaliang31", update: "updateMaliang31", draw: "drawMaliang31Extras", leave: "syncMaliang31OnLeave", click: "tryClickMaliang31" },
    { level: 32, clickOrder: 3, sceneKey: "pipe32Scene", install: "installPipe32", init: "initPipe32", update: "updatePipe32", draw: "drawPipe32Extras", leave: "syncPipe32OnLeave", click: "tryClickPipe32" },
    { level: 33, clickOrder: 4, sceneKey: "rider33Scene", install: "installRider33", init: "initRider33", update: "updateRider33", draw: "drawRider33Extras", leave: "syncRider33OnLeave", click: "tryClickRider33" },
    { level: 34, clickOrder: 5, sceneKey: "carrot34Scene", install: "installCarrot34", init: "initCarrot34", update: "updateCarrot34", draw: "drawCarrot34Extras", leave: "syncCarrot34OnLeave", click: "tryClickCarrot34" },
    { level: 35, clickOrder: 6, sceneKey: "pvpScene", install: "installPvp35", init: "initPvp35", update: "updatePvp35", draw: "drawPvp35Extras", leave: "syncPvp35OnLeave", click: "tryClickPvp35" },
  ];
  const CLICK_DEFS = DEFS.filter((d) => d.click)
    .sort((a, b) => (a.clickOrder ?? 50) - (b.clickOrder ?? 50));
  const HOOK_FIELDS = ["init", "update", "draw", "leave", "click", "drawAfter"];

  // game.js 注入的读写器（直接 eval 场景 let）
  let get = null;
  let set = null;
  // install 后从 S 收集的钩子
  const hooks = Object.create(null);

  function bind(access) {
    if (!access || typeof access.get !== "function" || typeof access.set !== "function") {
      throw new TypeError("场景注册表需要 get/set 读写器");
    }
    get = access.get;
    set = access.set;
  }

  function applyOpts(opts) {
    for (const d of DEFS) {
      if (opts[d.sceneKey] !== undefined) set(d.sceneKey, opts[d.sceneKey]);
    }
  }

  function clearScenes() {
    for (const d of DEFS) set(d.sceneKey, null);
  }

  function updateAll(dt) {
    for (const d of DEFS) {
      const sc = get(d.sceneKey);
      const fn = hooks[d.update];
      if (!sc || !fn) continue;
      try {
        fn(dt);
      } catch (err) {
        console.error("场景 update 出错", d.level, err);
      }
    }
  }

  function leaveAll() {
    for (const d of DEFS) {
      const fn = hooks[d.leave];
      if (fn) fn();
    }
  }

  function initLevel(n) {
    // 与旧接线一致：本关 init，其余关 leave（收 UI）
    for (const d of DEFS) {
      if (d.level === n) {
        const fn = hooks[d.init];
        if (fn) fn();
      } else {
        const fn = hooks[d.leave];
        if (fn) fn();
      }
    }
  }

  function drawExtras(n) {
    for (const d of DEFS) {
      if (d.level !== n) continue;
      const sc = get(d.sceneKey);
      const fn = hooks[d.draw];
      const after = hooks[d.drawAfter];
      try {
        if (sc && fn) fn();
        if (sc && after) after();
      } catch (err) {
        console.error("场景 draw 出错", d.level, err);
      }
    }
  }

  // 原接线顺序：厕所/神笔优先于商店和塔楼，用 clickOrder 保持
  function tryClickAll(clientX, clientY) {
    for (const d of CLICK_DEFS) {
      const fn = hooks[d.click];
      if (fn && fn(clientX, clientY)) return true;
    }
    return false;
  }

  function installAll(S) {
    // 先检查脚本是否齐全，避免漏加载时悄悄进入没有逻辑的关卡。
    for (const d of DEFS) {
      if (typeof window[d.install] !== "function") {
        throw new Error(`第 ${d.level} 关缺少安装函数 ${d.install}`);
      }
    }
    for (const d of DEFS) {
      window[d.install](S);
    }
    const nextHooks = Object.create(null);
    for (const d of DEFS) {
      for (const field of HOOK_FIELDS) {
        const name = d[field];
        if (!name) continue;
        if (typeof S[name] !== "function") {
          throw new Error(`第 ${d.level} 关缺少钩子 ${name}`);
        }
        nextHooks[name] = S[name];
      }
    }
    Object.assign(hooks, nextHooks);
  }

  function hookNames() {
    const out = [];
    for (const d of DEFS) {
      for (const field of HOOK_FIELDS) {
        const name = d[field];
        if (name) out.push(name);
      }
    }
    return out;
  }

  window.GameSceneReg = {
    DEFS,
    bind,
    applyOpts,
    clearScenes,
    updateAll,
    leaveAll,
    initLevel,
    drawExtras,
    tryClickAll,
    installAll,
    hookNames,
    hooks,
  };
})();
