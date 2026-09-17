(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true }) || canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayMsg = document.getElementById("overlay-msg");
  const startBtn = document.getElementById("start-btn");
  const levelLabel = document.getElementById("level-label");
  const starLabel = document.getElementById("star-label");
  const statusLabel = document.getElementById("status-label");
  const puzzleTools = document.getElementById("puzzle-tools");
  const fakeButtons = [...puzzleTools.querySelectorAll(".fake-btn")];
  const chatBtn = document.getElementById("chat-btn");
  const chatDock = document.getElementById("chat-dock");
  const joinNoticesEl = document.getElementById("join-notices");
  const chatPanel = document.getElementById("chat-panel");
  const chatInput = document.getElementById("chat-input");
  const chatSend = document.getElementById("chat-send");
  const chatClose = document.getElementById("chat-close");
  const chatLogEl = document.getElementById("chat-log");
  const nameForm = document.getElementById("name-form");
  const nameInput = document.getElementById("player-name-input");
  const overlayHint = document.getElementById("overlay-hint");
  const cornerActions = document.getElementById("corner-actions");
  const homeBtn = document.getElementById("home-btn");
  const settingsBtn = document.getElementById("settings-btn");
  const settingsPanel = document.getElementById("settings-panel");
  const settingsClose = document.getElementById("settings-close");
  const brightnessSlider = document.getElementById("brightness-slider");
  const volumeSlider = document.getElementById("volume-slider");
  const brightnessValue = document.getElementById("brightness-value");
  const volumeValue = document.getElementById("volume-value");
  const skipBtn = document.getElementById("skip-btn");
  const shopBtn = document.getElementById("shop-btn");
  const shopPanel = document.getElementById("shop-panel");
  const shopClose = document.getElementById("shop-close");
  const shopStarCount = document.getElementById("shop-star-count");
  const shopTip = document.getElementById("shop-tip");
  const itemBar = document.getElementById("item-bar");
  const levelSelect = document.getElementById("level-select");
  const homeNoticesEl = document.getElementById("home-notices");
  const levelGrid = document.getElementById("level-grid");
  const levelTip = document.getElementById("level-tip");
  const logoutBtn = document.getElementById("logout-btn");
  const friendsBtn = document.getElementById("friends-btn");
  const globalChatBtn = document.getElementById("global-chat-btn");
  const globalChatPanel = document.getElementById("global-chat-panel");
  const globalChatLogEl = document.getElementById("global-chat-log");
  const globalChatInput = document.getElementById("global-chat-input");
  const globalChatSend = document.getElementById("global-chat-send");
  const globalChatClose = document.getElementById("global-chat-close");
  let inboxBtn = document.getElementById("inbox-btn");
  const inboxPanel = document.getElementById("inbox-panel");
  const inboxListEl = document.getElementById("inbox-list");
  const inboxClose = document.getElementById("inbox-close");
  const inboxClear = document.getElementById("inbox-clear");
  const chatUserDialog = document.getElementById("chat-user-dialog");
  const chatUserMsg = document.getElementById("chat-user-msg");
  const chatUserFriend = document.getElementById("chat-user-friend");
  const chatUserReport = document.getElementById("chat-user-report");
  const chatUserCancel = document.getElementById("chat-user-cancel");
  const reportDialog = document.getElementById("report-dialog");
  const reportMsg = document.getElementById("report-msg");
  const reportCancel = document.getElementById("report-cancel");
  const friendCenter = document.getElementById("friend-center");
  const friendsClose = document.getElementById("friends-close");
  const friendListEl = document.getElementById("friend-list");
  const friendChatTitle = document.getElementById("friend-chat-title");
  const friendChatLogEl = document.getElementById("friend-chat-log");
  const friendChatInput = document.getElementById("friend-chat-input");
  const friendChatSend = document.getElementById("friend-chat-send");
  const friendInviteLevel = document.getElementById("friend-invite-level");
  const friendInviteBtn = document.getElementById("friend-invite-btn");
  const friendReqDialog = document.getElementById("friend-req-dialog");
  const friendReqMsg = document.getElementById("friend-req-msg");
  const friendReqYes = document.getElementById("friend-req-yes");
  const friendReqNo = document.getElementById("friend-req-no");
  const inviteDialog = document.getElementById("invite-dialog");
  const inviteMsg = document.getElementById("invite-msg");
  const inviteYes = document.getElementById("invite-yes");
  const inviteNo = document.getElementById("invite-no");
  const socialToastEl = document.getElementById("social-toast");
  const moonCoopBtn = document.getElementById("moon-coop-btn");
  const craftCoopBtn = document.getElementById("craft-coop-btn");
  const loginMoonBtn = document.getElementById("login-moon-btn");
  const sandboxModeEl = document.getElementById("sandbox-mode");
  const sandboxSurvival = document.getElementById("sandbox-survival");
  const sandboxCreative = document.getElementById("sandbox-creative");
  const unlockDialog = document.getElementById("unlock-dialog");
  const unlockMsg = document.getElementById("unlock-msg");
  const unlockSkipBtn = document.getElementById("unlock-skip");
  const unlockCancelBtn = document.getElementById("unlock-cancel");
  const portraitDialog = document.getElementById("portrait-dialog");
  const portraitDecline = document.getElementById("portrait-decline");
  const portraitAccept = document.getElementById("portrait-accept");
  const loginScreen = document.getElementById("login-screen");
  const banScreen = document.getElementById("ban-screen");
  const banMsg = document.getElementById("ban-msg");
  const banLeft = document.getElementById("ban-left");
  const loginUser = document.getElementById("login-user");
  const loginPass = document.getElementById("login-pass");
  const loginPhone = document.getElementById("login-phone");
  const loginSms = document.getElementById("login-sms");
  const loginIdcard = document.getElementById("login-idcard");
  const loginError = document.getElementById("login-error");
  const loginSubmit = document.getElementById("login-submit");
  const smsBtn = document.getElementById("sms-btn");
  const minorNotice = document.getElementById("minor-notice");
  const minorOk = document.getElementById("minor-ok");
  const loginTabs = [...document.querySelectorAll(".login-tab")];
  const loginPaneAccount = document.getElementById("login-pane-account");
  const loginPanePhone = document.getElementById("login-pane-phone");
  const loginPaneIdcard = document.getElementById("login-pane-idcard");
  const touchPad = document.getElementById("touch-pad");

  const DESIGN_W = 960;
  const DESIGN_H = 540;
  const PORTRAIT_W = 720;
  let W = canvas.width;
  let H = canvas.height;
  const GRAVITY = 0.55;
  const JUMP = -11.2;
  const MOVE = 4.2;
  const ZOMBIE_COUNT = 5;
  let LAVA_Y = H - 52;
  const PORTRAIT_PROMPT_KEY = "lava-parkour-portrait-dismissed";
  let portraitPromptOpen = false;

  const keys = new Set();
  const touch = { left: false, right: false, jump: false, up: false, down: false, dig: false };
  let settingsOpen = false;
  let shopOpen = false;
  let socialOpen = false;
  let adOpen = false;
  let brightness = 100;
  let volumePct = 35;
  let inventory = {
    skipCard: 0,
    potion: 0,
    sword: 0,
    pickaxe: 0,
    bucket: 0,
  };
  let levelUses = {
    potion: 0,
    sword: 0,
    pickaxe: 0,
    bucket: 0,
  };
  let toolMode = null; // sword | pickaxe | null
  let lavaDrains = [];

  const SHOP_CATALOG = {
    skipCard: { cost: 5, name: "免费跳过关卡卡" },
    potion: { cost: 10, name: "加速药水" },
    sword: { cost: 19, name: "宝剑" },
    pickaxe: { cost: 35, name: "稿子" },
    bucket: { cost: 17, name: "桶" },
  };

  let state = "login"; // login | select | menu | naming | playing | dead | win
  let level = 1;
  let stars = 0;
  let playerName = "";
  let loggedIn = false;
  let maxCleared = 0; // highest cleared level; level 1 always open
  let pendingUnlockLevel = 0;
  let levelPlayerCounts = {};
  let friends = [];
  let selectedFriendId = "";
  let friendUnread = {};
  let pendingFriend = {};
  let friendReqQueue = [];
  let friendReqCurrent = null;
  let inviteQueue = [];
  let inviteCurrent = null;
  let friendCenterOpen = false;
  let socialToastTimer = 0;
  let globalChat = [];
  let globalChatOpen = false;
  let globalChatUnread = 0;
  let chatUserTarget = null;
  let inboxReports = [];
  let inboxOpen = false;
  let inboxUnread = 0;
  let homeNotices = [];
  let homePeerQuietUntil = 0;
  let homePeerReady = false;
  let banTimerId = 0;
  const TOTAL_LEVELS = 35;
  const MAX_PLAYABLE = 27;
  let cameraX = 0;
  let worldMin = 0;
  let worldWidth = 3200;
  let reverseGoal = false;
  let fakeLava = false;
  let spawnX = 80;
  let puzzleMode = false;
  let pitStart = 0;
  let pitWidth = 0;
  let bridgePieceW = 92;
  let bridgeY = 380;
  let platforms = [];
  let player = null;
  let zombies = [];
  let star = null;
  let endSign = null;
  let comingSoon = null;
  let shopScene = null; // level 10 star shop
  let towerScene = null; // level 14 tower delivery
  let subwayScene = null; // level 15 subway
  let rangeScene = null; // level 16 shooting range
  let battleScene = null; // level 17 battlefield
  let schoolScene = null; // level 18 school rush
  let musicScene = null; // level 19 music room
  let dateScene = null; // level 20 restaurant date
  let kongScene = null; // level 21 donkey kong
  let starHouseScene = null; // level 22 star house fountain
  let matchScene = null; // level 23 match-3 shooter
  let furnaceScene = null; // level 24 countdown furnace
  let twinScene = null; // level 25 twin pressure plates
  let planeScene = null; // level 26 plane crash skydive
  let pipeScene = null; // level 27 steel pipe battle
  let initTower14 = null;
  let updateTower14 = null;
  let drawTowerExtras = null;
  let tryClickTower14 = null;
  let syncTower14OnLeave = null;
  let initSubway15 = null;
  let updateSubway15 = null;
  let drawSubwayExtras = null;
  let drawSubwayForeground = null;
  let tryClickSubway15 = null;
  let syncSubway15OnLeave = null;
  let initRange16 = null;
  let updateRange16 = null;
  let drawRangeExtras = null;
  let syncRange16OnLeave = null;
  let initBattle17 = null;
  let updateBattle17 = null;
  let drawBattleExtras = null;
  let syncBattle17OnLeave = null;
  let initSchool18 = null;
  let updateSchool18 = null;
  let drawSchoolExtras = null;
  let syncSchool18OnLeave = null;
  let initMusic19 = null;
  let updateMusic19 = null;
  let drawMusicExtras = null;
  let syncMusic19OnLeave = null;
  let initDate20 = null;
  let updateDate20 = null;
  let drawDateExtras = null;
  let syncDate20OnLeave = null;
  let tryClickDate20 = null;
  let initKong21 = null;
  let updateKong21 = null;
  let drawKongExtras = null;
  let syncKong21OnLeave = null;
  let initStarHouse22 = null;
  let updateStarHouse22 = null;
  let drawStarHouseExtras = null;
  let syncStarHouse22OnLeave = null;
  let initMatch23 = null;
  let updateMatch23 = null;
  let drawMatchExtras = null;
  let syncMatch23OnLeave = null;
  let initFurnace24 = null;
  let updateFurnace24 = null;
  let drawFurnaceExtras = null;
  let syncFurnace24OnLeave = null;
  let initTwin25 = null;
  let updateTwin25 = null;
  let drawTwinExtras = null;
  let syncTwin25OnLeave = null;
  let initPlane26 = null;
  let updatePlane26 = null;
  let drawPlaneExtras = null;
  let syncPlane26OnLeave = null;
  let initPipe27 = null;
  let updatePipe27 = null;
  let drawPipeExtras = null;
  let syncPipe27OnLeave = null;
  let homeMode = false;
  let spikes = [];
  let maces = [];
  let rockets = [];
  let belly = { items: [], revealed: false };
  let eatAnim = null;
  let backpack = { spikes: 0, zombiesKilled: 0, maces: 0, revealed: false };
  let pickups = [];
  let craters = [];
  let remotePlayers = new Map();
  let coopCount = 1;
  let coopAcc = 0;
  let lastCoopPos = { x: 0, y: 0 };
  let remoteCamX = null;
  let lastMapSendAt = 0;
  let localChat = "";
  let localChatUntil = 0;
  let joinNotices = [];
  let coopAnnounceAt = 0;
  let chatLog = [];
  let chatLogLevel = 0;
  const COOP_COLORS = ["#ff8a5c", "#b8ff6a", "#d47aff", "#ffd36a", "#6ad4ff"];
  let moonSkyGrad = null;
  let moonVoidGrad = null;
  let moonEarthGrad = null;
  let crate = null;
  let potion = null;
  let speedBoost = 0;
  let particles = [];
  let shake = 0;
  let time = 0;
  let lastTs = 0;
  let mapRngFn = null;

  const {
    clamp,
    rand,
    seededRng,
    rectsOverlap,
    escapeHtml,
    loadJson,
    saveJson,
    loadStr,
    saveStr,
  } = window.GameUtil;

  function mapRand(a, b) {
    const u = mapRngFn ? mapRngFn() : Math.random();
    return a + u * (b - a);
  }

  function mapChance(p) {
    const u = mapRngFn ? mapRngFn() : Math.random();
    return u < p;
  }

  function preferTouchControls() {
    return (
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(max-width: 920px)").matches
    );
  }

  function isDevicePortrait() {
    const type = screen.orientation && screen.orientation.type;
    if (typeof type === "string") return type.startsWith("portrait");
    if (window.matchMedia("(orientation: portrait)").matches) return true;
    return window.innerHeight >= window.innerWidth;
  }

  function isMobileLike() {
    return (
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(max-width: 920px)").matches ||
      window.matchMedia("(max-height: 920px)").matches ||
      (navigator.maxTouchPoints || 0) > 0 ||
      "ontouchstart" in window
    );
  }

  function isPortraitPlay() {
    return isDevicePortrait() && isMobileLike();
  }

  function syncViewport() {
    const nextW = DESIGN_W;
    const nextH = DESIGN_H;
    const mobile = isMobileLike();
    document.body.classList.toggle("is-portrait", isPortraitPlay());
    document.body.classList.toggle("is-landscape", !isPortraitPlay());
    document.body.classList.toggle("is-mobile", mobile);
    document.body.classList.toggle("is-desktop", !mobile);
    maybeShowPortraitPrompt();
    const sizeChanged = canvas.width !== nextW || canvas.height !== nextH || W !== nextW || H !== nextH;
    if (sizeChanged) {
      W = nextW;
      H = nextH;
      LAVA_Y = H - 52;
      canvas.width = W;
      canvas.height = H;
      if (player) cameraX = cameraForView();
    }
    if (window.CraftWorld && CraftWorld.active()) CraftWorld.resize(W, H);
  }

  function hidePortraitPrompt() {
    if (!portraitDialog) return;
    portraitPromptOpen = false;
    portraitDialog.classList.add("hidden");
    portraitDialog.setAttribute("aria-hidden", "true");
    syncTouchPad();
    syncItemBar();
  }

  function showPortraitPrompt() {
    if (!portraitDialog) return;
    portraitPromptOpen = true;
    portraitDialog.classList.remove("hidden");
    portraitDialog.setAttribute("aria-hidden", "false");
    syncTouchPad();
    syncItemBar();
  }

  function portraitPromptDismissed() {
    try {
      return sessionStorage.getItem(PORTRAIT_PROMPT_KEY) === "1";
    } catch {
      return false;
    }
  }

  function maybeShowPortraitPrompt() {
    if (!isPortraitPlay()) {
      hidePortraitPrompt();
      return;
    }
    if (portraitPromptDismissed()) {
      hidePortraitPrompt();
      return;
    }
    showPortraitPrompt();
  }

  async function requestLandscapePlay() {
    const tryLock = async () => {
      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock("landscape");
      }
    };
    try {
      await tryLock();
    } catch {
      try {
        const root = document.documentElement;
        if (!document.fullscreenElement && root.requestFullscreen) {
          await root.requestFullscreen();
        }
        await tryLock();
      } catch {
        /* iOS 等环境无法强制横屏，等待玩家自己转过来 */
      }
    }
    maybeShowPortraitPrompt();
  }

  function controlHintText() {
    return preferTouchControls()
      ? "竖屏/横屏均可 · 下方按钮移动和跳跃"
      : "← → / A D 移动 · 空格 / W / ↑ 跳跃 · R 重开";
  }

  function pushZombie(opts) {
    zombies.push({
      w: 30,
      h: 38,
      vx: 0,
      vy: 0,
      onGround: false,
      bob: rand(0, Math.PI * 2),
      pounceCd: 0,
      preferRoof: false,
      mode: "behind",
      ...opts,
    });
  }

  function applyLevelOpts(opts) {
    if (!opts) return;
    if (opts.spawnX != null) spawnX = opts.spawnX;
    if (opts.worldWidth != null) worldWidth = opts.worldWidth;
    if (opts.worldMin != null) worldMin = opts.worldMin;
    if (opts.reverseGoal != null) reverseGoal = opts.reverseGoal;
    if (opts.fakeLava != null) fakeLava = opts.fakeLava;
    if (opts.puzzleMode != null) puzzleMode = opts.puzzleMode;
    if (opts.homeMode != null) homeMode = opts.homeMode;
    if (opts.pitStart != null) pitStart = opts.pitStart;
    if (opts.pitWidth != null) pitWidth = opts.pitWidth;
    if (opts.bridgeY != null) bridgeY = opts.bridgeY;
    if (opts.bridgePieceW != null) bridgePieceW = opts.bridgePieceW;
    if (opts.crate !== undefined) crate = opts.crate;
    if (opts.potion !== undefined) potion = opts.potion;
    if (opts.speedBoost != null) speedBoost = opts.speedBoost;
    if (opts.endSign !== undefined) endSign = opts.endSign;
    if (opts.comingSoon !== undefined) comingSoon = opts.comingSoon;
    if (opts.shopScene !== undefined) shopScene = opts.shopScene;
    if (opts.towerScene !== undefined) towerScene = opts.towerScene;
    if (opts.subwayScene !== undefined) subwayScene = opts.subwayScene;
    if (opts.rangeScene !== undefined) rangeScene = opts.rangeScene;
    if (opts.battleScene !== undefined) battleScene = opts.battleScene;
    if (opts.schoolScene !== undefined) schoolScene = opts.schoolScene;
    if (opts.musicScene !== undefined) musicScene = opts.musicScene;
    if (opts.dateScene !== undefined) dateScene = opts.dateScene;
    if (opts.kongScene !== undefined) kongScene = opts.kongScene;
    if (opts.starHouseScene !== undefined) starHouseScene = opts.starHouseScene;
    if (opts.matchScene !== undefined) matchScene = opts.matchScene;
    if (opts.furnaceScene !== undefined) furnaceScene = opts.furnaceScene;
    if (opts.twinScene !== undefined) twinScene = opts.twinScene;
    if (opts.planeScene !== undefined) planeScene = opts.planeScene;
    if (opts.pipeScene !== undefined) pipeScene = opts.pipeScene;
    if (opts.player) player = opts.player;
    if ("star" in opts) star = opts.star;
  }

  function makeLevel(n) {
    platforms = [];
    zombies = [];
    reverseGoal = false;
    fakeLava = false;
    lavaDrains = [];
    toolMode = null;
    puzzleMode = false;
    pitStart = 0;
    pitWidth = 0;
    worldMin = 0;
    crate = null;
    potion = null;
    speedBoost = 0;
    endSign = null;
    comingSoon = null;
    shopScene = null;
    towerScene = null;
    subwayScene = null;
    rangeScene = null;
    battleScene = null;
    schoolScene = null;
    musicScene = null;
    dateScene = null;
    kongScene = null;
    starHouseScene = null;
    matchScene = null;
    furnaceScene = null;
    twinScene = null;
    planeScene = null;
    pipeScene = null;
    homeMode = false;
    spikes = [];
    maces = [];
    rockets = [];
    belly = { items: [], revealed: false };
    eatAnim = null;
    backpack = { spikes: 0, zombiesKilled: 0, maces: 0, revealed: false };
    pickups = [];
    craters = [];
    mapRngFn = seededRng(11000 + n * 131);
    GameLevels.build(n, {
      n,
      startY: 380,
      roofY: 150,
      zombieCount: ZOMBIE_COUNT,
      clamp,
      mapRand,
      mapChance,
      seededRng,
      pushZombie,
      makePlayer: GameLevels.makePlayer,
      makeStar: GameLevels.makeStar,
      platforms,
      zombies,
      spikes,
      maces,
      rockets,
      pickups,
      craters,
      set: applyLevelOpts,
    });
    particles = [];
    cameraX = 0;
    shake = 0;
  }

  function localCoopId() {
    try {
      let id = localStorage.getItem("yyy_coop_id") || sessionStorage.getItem("yyy_coop_id");
      if (!id) {
        id = "p" + Math.random().toString(36).slice(2, 10);
      }
      localStorage.setItem("yyy_coop_id", id);
      return id;
    } catch {
      return "p" + Math.random().toString(36).slice(2, 10);
    }
  }

  function colorForCoopId(id) {
    let h = 0;
    for (let i = 0; i < String(id).length; i++) {
      h = (h * 31 + id.charCodeAt(i)) | 0;
    }
    return COOP_COLORS[Math.abs(h) % COOP_COLORS.length];
  }

  function applyLevelCounts(counts) {
    levelPlayerCounts = counts || {};
    if (levelGrid) {
      for (const btn of levelGrid.querySelectorAll(".level-cell")) {
        const n = Number(btn.dataset.level);
        const el = btn.querySelector(".online");
        if (el) el.textContent = `${levelPlayerCounts[n] || 0}人在玩`;
      }
    }
    const moonOnline = document.getElementById("moon-online");
    if (moonOnline) moonOnline.textContent = `${levelPlayerCounts[11] || 0}人在玩`;
    const craftOnline = document.getElementById("craft-online");
    if (craftOnline) craftOnline.textContent = `${levelPlayerCounts[12] || 0}人在玩`;
    if (friendCenterOpen) renderFriendList();
  }

  function watchLobbyCounts() {
    if (!window.LevelCoop || typeof LevelCoop.watch !== "function") return;
    if (!homePeerReady) homePeerQuietUntil = Date.now() + 3500;
    if (typeof LevelCoop.setName === "function") LevelCoop.setName(myDisplayName());
    LevelCoop.watch(localCoopId(), {
      onPresence: applyLevelCounts,
      onSocial: handleSocial,
      onPeer: handleHomePeer,
      name: myDisplayName(),
    });
  }

  function renderHomeNotices() {
    if (!homeNoticesEl) return;
    const now = Date.now();
    homeNotices = homeNotices.filter((n) => now < n.until);
    homeNoticesEl.innerHTML = homeNotices
      .map((n) => `<p class="${n.off ? "off" : ""}">${escapeHtml(n.text)}</p>`)
      .join("");
  }

  function pushHomeNotice(text, off) {
    if (state !== "select") return;
    const line = String(text || "").trim();
    if (!line) return;
    homeNotices.unshift({ text: line, off: !!off, until: Date.now() + 4200 });
    homeNotices = homeNotices.slice(0, 4);
    renderHomeNotices();
    window.setTimeout(renderHomeNotices, 4300);
  }

  function handleHomePeer(ev) {
    if (!ev || ev.id === localCoopId()) return;
    if (!homePeerReady && Date.now() < homePeerQuietUntil) return;
    homePeerReady = true;
    if (state !== "select") return;
    const name = playerLabel(ev.name);
    if (ev.type === "online") pushHomeNotice(`${name}上线了`, false);
    else if (ev.type === "offline") pushHomeNotice(`${name}下线了`, true);
  }

  function myDisplayName() {
    return (playerName || "玩家").slice(0, 12);
  }


  function hitRemotePlayer(world) {
    ctx.save();
    ctx.font = "12px 'Noto Sans SC', sans-serif";
    let found = null;
    for (const rp of remotePlayers.values()) {
      if (rp.x == null || rp.y == null) continue;
      const px = rp.drawX != null ? rp.drawX : rp.x;
      const py = rp.drawY != null ? rp.drawY : rp.y;
      const label = String(rp.name || "玩家").slice(0, 16);
      const tw = Math.max(ctx.measureText(label).width, 36);
      const nx = px + 14 - tw / 2;
      const ny = py - 28;
      const inName = world.x >= nx && world.x <= nx + tw && world.y >= ny && world.y <= ny + 22;
      const inBody = world.x >= px + 4 && world.x <= px + 24 && world.y >= py && world.y <= py + 42;
      if (inName || inBody) {
        found = rp;
        break;
      }
    }
    ctx.restore();
    return found;
  }

  function tryClickPlayerName(clientX, clientY) {
    if (state !== "playing") return false;
    const world = clientToWorld(clientX, clientY);
    const rp = hitRemotePlayer(world);
    if (!rp) return false;
    requestFriend(rp);
    return true;
  }

  function stopLevelCoop() {
    hideSandboxMode();
    if (window.CraftWorld) CraftWorld.stop();
    if (window.LevelCoop) {
      if (typeof LevelCoop.leaveLevel === "function") LevelCoop.leaveLevel();
      else LevelCoop.leave();
    }
    remotePlayers = new Map();
    coopCount = 1;
    coopAcc = 0;
    remoteCamX = null;
    localChat = "";
    localChatUntil = 0;
    joinNotices = [];
    renderJoinNotices();
    closeChat();
  }

  function playerLabel(name) {
    const raw = String(name || "玩家").trim() || "玩家";
    return raw.length > 12 ? `${raw.slice(0, 12)}…` : raw;
  }

  function renderJoinNotices() {
    if (!joinNoticesEl) return;
    const live = joinNotices.filter((n) => time < n.until);
    joinNotices = live;
    joinNoticesEl.innerHTML = live
      .map((n) => `<p>${escapeHtml(n.text)}</p>`)
      .join("");
  }

  function pushJoinNotice(text) {
    if (state !== "playing") return;
    joinNotices.unshift({ text, until: time + 4.2 });
    joinNotices = joinNotices.slice(0, 3);
    renderJoinNotices();
  }

  function announceJoin(name) {
    if (time < coopAnnounceAt) return;
    pushJoinNotice(`${playerLabel(name)}加入了游戏`);
  }

  function announceLeave(name) {
    if (time < coopAnnounceAt) return;
    pushJoinNotice(`${playerLabel(name)}退出了游戏`);
  }

  function deathLine(name, cause) {
    const who = playerLabel(name);
    if (cause === "zombie") return `${who}被僵尸吃掉了`;
    if (cause === "spike") return `${who}被尖刺扎死了`;
    if (cause === "mace") return `${who}被狼牙棒砸中了`;
    if (cause === "crater") return `${who}掉进陨石坑了`;
    if (cause === "car") return `你撞大运了，哥们！`;
    if (cause === "hungry") return `${who}没抢到饭…`;
    if (cause === "barrel") return `${who}被大木桶砸中了`;
    return `${who}烫死了`;
  }

  function announceChat(name, text) {
    const line = String(text || "").trim();
    if (!line) return;
    const who = playerLabel(name);
    chatLog.push({ name: who, text: line.slice(0, 12) });
    if (chatLog.length > 40) chatLog = chatLog.slice(-40);
    renderChatLog();
    pushJoinNotice(`「${who}」：${line}`);
  }

  function renderChatLog() {
    if (!chatLogEl) return;
    if (!chatLog.length) {
      chatLogEl.innerHTML = `<p class="chat-empty">还没有消息</p>`;
      return;
    }
    chatLogEl.innerHTML = chatLog
      .map((m) => `<p><span>「${escapeHtml(m.name)}」：</span>${escapeHtml(m.text)}</p>`)
      .join("");
    chatLogEl.scrollTop = chatLogEl.scrollHeight;
  }

  function announceDeath(name, cause) {
    pushJoinNotice(deathLine(name, cause));
  }

  function coopHostId() {
    let host = localCoopId();
    for (const id of remotePlayers.keys()) {
      if (String(id) < String(host)) host = id;
    }
    return host;
  }

  function isCoopHost() {
    return coopHostId() === localCoopId();
  }

  function coopAnchorX() {
    const xs = [];
    if (player && player.alive !== false) xs.push(player.x);
    for (const rp of remotePlayers.values()) {
      if (rp.alive === false || rp.dead) continue;
      const px = rp.drawX != null ? rp.drawX : rp.x;
      if (px != null) xs.push(px);
    }
    if (!xs.length) return player ? player.x : 0;
    if (xs.length === 1) return xs[0];
    return (Math.min(...xs) + Math.max(...xs)) / 2;
  }

  function cameraForView() {
    if (level === 14 && towerScene) {
      const cx = (towerScene.towerX + towerScene.towerW / 2 - W / 2) | 0;
      return clamp(cx, worldMin, Math.max(worldMin, worldWidth - W));
    }
    const look = remotePlayers.size > 0 ? 0.48 : 0.35;
    let target = coopAnchorX() - W * look;
    if (remotePlayers.size > 0 && remoteCamX != null && !isCoopHost()) {
      target = remoteCamX;
    }
    return clamp(target, worldMin, Math.max(worldMin, worldWidth - W)) | 0;
  }

  function packMap() {
    const lanes = { ground: 0, roof: 1, mid: 2, secret: 3 };
    return {
      type: "map",
      lv: level,
      w: worldWidth | 0,
      m: worldMin | 0,
      p: platforms.map((pl) => [
        pl.x | 0,
        pl.y | 0,
        pl.w | 0,
        pl.h | 0,
        lanes[pl.lane] || 0,
        pl.theme === "moon"
          ? 1
          : pl.theme === "jelly"
            ? 2
            : pl.theme === "keyboard"
              ? 3
              : pl.theme === "oreo"
                ? 4
                : pl.theme === "chocoice"
                  ? 5
                  : 0,
      ]),
      k: spikes.map((s) => [s.x | 0, s.y | 0, s.w | 0, s.h | 0]),
      c: craters.map((d) => [d.x | 0, d.w | 0]),
      sx: star ? star.x | 0 : null,
      sy: star ? star.y | 0 : null,
    };
  }

  function applyCoopMap(msg) {
    if (!msg || Number(msg.lv) !== level) return;
    const laneNames = ["ground", "roof", "mid", "secret"];
    if (Array.isArray(msg.p) && msg.p.length) {
      platforms = msg.p.map((a) => ({
        x: a[0],
        y: a[1],
        w: a[2],
        h: a[3],
        lane: laneNames[a[4] || 0] || "ground",
        theme: themeFromCode(a[5]),
        chocolateCracked: false,
      }));
    }
    if (Array.isArray(msg.k)) {
      spikes = msg.k.map((a) => ({ x: a[0], y: a[1], w: a[2], h: a[3] }));
    }
    if (Array.isArray(msg.c)) {
      craters = msg.c.map((a) => ({ x: a[0], w: a[1] }));
    }
    if (msg.w != null) worldWidth = msg.w;
    if (msg.m != null) worldMin = msg.m;
    if (star && msg.sx != null) {
      star.x = msg.sx;
      star.y = msg.sy;
    }
  }

  function maybeSendMap(force) {
    if (!window.LevelCoop || !LevelCoop.isJoined() || !isCoopHost()) return;
    if (!force && time - lastMapSendAt < 1.6) return;
    lastMapSendAt = time;
    LevelCoop.send(packMap());
  }

  function nearestHuntTarget(from) {
    let best = player;
    let bestD = player ? Math.abs((player.x || 0) - from.x) : Infinity;
    for (const rp of remotePlayers.values()) {
      if (rp.alive === false || rp.dead) continue;
      const px = rp.drawX != null ? rp.drawX : rp.x;
      if (px == null) continue;
      const d = Math.abs(px - from.x);
      if (d < bestD) {
        bestD = d;
        best = {
          x: px,
          y: rp.drawY != null ? rp.drawY : rp.y,
        w: 28,
        h: 40,
        };
      }
    }
    return best;
  }

  function syncCoopStatus() {
    if (state !== "playing") return;
    const n = remotePlayers.size + 1;
    const text = n > 1 ? `联机 ${n} 人` : "独自闯关 · 可与手机/电脑联机";
    if (statusLabel.textContent !== text) statusLabel.textContent = text;
  }

  function handleCoopMessage(msg) {
    if (window.CraftWorld && CraftWorld.active()) CraftWorld.onNet(msg);
    if (msg && msg.lv != null && Number(msg.lv) !== level) return;
    if (!msg || msg.type === "bye") {
      if (msg && msg.id) {
        const gone = remotePlayers.get(msg.id);
        if (gone && !gone.dead) announceLeave(gone.name);
        remotePlayers.delete(msg.id);
      }
      syncCoopStatus();
      return;
    }
    if (msg.type === "dead") {
      const prev = remotePlayers.get(msg.id);
      const name = msg.name || (prev && prev.name) || "玩家";
      if (prev) prev.dead = true;
      announceDeath(name, msg.cause);
      return;
    }
    if (msg.type === "pickup" && msg.starId != null) {
      const p = pickups.find((s) => s.id === msg.starId);
      if (p && !p.collected) {
        p.collected = true;
        spawnBurst(p.x, p.y, "#ffe566", 6);
      }
      return;
    }
    if (msg.type === "chat" && msg.text) {
      const prev = remotePlayers.get(msg.id) || { id: msg.id, color: colorForCoopId(msg.id) };
      const text = String(msg.text).slice(0, 12);
      prev.chat = text;
      prev.chatUntil = time + 4.5;
      if (msg.name) prev.name = msg.name;
      remotePlayers.set(msg.id, prev);
      announceChat(prev.name || msg.name || "玩家", text);
      return;
    }
    if (msg.type === "map") {
      if (String(msg.id || "") <= String(localCoopId())) applyCoopMap(msg);
      return;
    }
    if (msg.type === "hello" || msg.type === "state") {
      const existed = remotePlayers.has(msg.id);
      const prev = remotePlayers.get(msg.id) || {};
      const nx = msg.x != null ? msg.x : prev.x;
      const ny = msg.y != null ? msg.y : prev.y;
      remotePlayers.set(msg.id, {
        ...prev,
        id: msg.id,
        x: nx,
        y: ny,
        drawX: prev.drawX != null ? prev.drawX : nx,
        drawY: prev.drawY != null ? prev.drawY : ny,
        vx: msg.vx || 0,
        vy: msg.vy || 0,
        facing: msg.facing || prev.facing || 1,
        alive: msg.alive !== false,
        name: msg.name || prev.name || "玩家",
        color: prev.color || colorForCoopId(msg.id),
        pendingJoin: existed ? prev.pendingJoin && !msg.name : !msg.name,
        last: time,
      });
      if (msg.cam != null && String(msg.id) === String(coopHostId())) {
        remoteCamX = msg.cam;
      }
      if (!existed) {
        syncCoopStatus();
        if (msg.name) announceJoin(msg.name);
        window.setTimeout(() => maybeSendMap(true), 80);
      } else if (prev.pendingJoin && msg.name) {
        announceJoin(msg.name);
      }
    }
  }

  function startLevelCoop() {
    remotePlayers = new Map();
    coopCount = 1;
    coopAcc = 0;
    remoteCamX = null;
    lastMapSendAt = 0;
    coopAnnounceAt = time + 1.2;
    joinNotices = [];
    renderJoinNotices();
    if (chatLogLevel !== level) {
      chatLog = [];
      chatLogLevel = level;
      renderChatLog();
    }
    if (!window.LevelCoop) return;
    LevelCoop.join(localCoopId(), {
      level,
      onMessage: handleCoopMessage,
      onPresence: applyLevelCounts,
      onSocial: handleSocial,
      onPeer: handleHomePeer,
      name: myDisplayName(),
      onCount: (n) => {
        coopCount = Math.max(1, Number(n) || 1);
      },
      onStatus: (status) => {
        if (state !== "playing") return;
        if (status === "connecting") {
          if (statusLabel.textContent !== "正在连接联机…") {
            statusLabel.textContent = "正在连接联机…";
          }
          return;
        }
        syncCoopStatus();
      },
    });
    statusLabel.textContent = "正在连接联机…";
  }

  function updateCoop(dt) {
    if (state !== "playing" || !window.LevelCoop || !LevelCoop.isJoined()) {
      return;
    }
    coopAcc += dt;
    const moved =
      !player ||
      Math.abs(player.x - lastCoopPos.x) > 0.8 ||
      Math.abs(player.y - lastCoopPos.y) > 0.8;
    if (coopAcc >= (moved ? 0.08 : 0.32) && player) {
      coopAcc = 0;
      lastCoopPos = { x: player.x, y: player.y };
      LevelCoop.send({
        type: "state",
        lv: level,
        x: player.x | 0,
        y: player.y | 0,
        vx: Math.round((player.vx || 0) * 10) / 10,
        vy: Math.round((player.vy || 0) * 10) / 10,
        facing: player.facing,
        alive: player.alive !== false,
        name: (playerName || "玩家").slice(0, 12),
        cam: isCoopHost() ? cameraX | 0 : undefined,
      });
      maybeSendMap(false);
    }
    const follow = Math.min(1, dt * 14);
    for (const [id, rp] of [...remotePlayers]) {
      if (time - (rp.last || 0) > 4) {
        announceLeave(rp.name);
        remotePlayers.delete(id);
        continue;
      }
      if (rp.x == null || rp.y == null) continue;
      const predX = rp.x + (rp.vx || 0) * 2;
      const predY = rp.y + (rp.vy || 0) * 2;
      rp.drawX = rp.drawX == null ? rp.x : rp.drawX + (predX - rp.drawX) * follow;
      rp.drawY = rp.drawY == null ? rp.y : rp.drawY + (predY - rp.drawY) * follow;
    }
    if (localChat && time > localChatUntil) localChat = "";
    if (joinNotices.length && joinNotices.some((n) => time >= n.until)) renderJoinNotices();
  }

  function coopFurthestX() {
    let x = player ? player.x : 0;
    for (const rp of remotePlayers.values()) {
      const px = rp.drawX != null ? rp.drawX : rp.x;
      if (px != null) x = Math.max(x, px);
    }
    return x;
  }

  function extendEndlessParkour() {
    if (!reverseGoal || !player) return;
    // Keep generating bricks ahead so the right path never ends
    while (worldWidth - coopFurthestX() < 1400) {
      const roofY = 150;
      let lastGround = null;
      for (let i = platforms.length - 1; i >= 0; i--) {
        if (platforms[i].lane === "ground") {
          lastGround = platforms[i];
          break;
        }
      }
      if (!lastGround) break;
      const gap = 65 + mapRand(15, 50);
      const w = mapRand(80, 150);
      const x = lastGround.x + lastGround.w + gap;
      const y = clamp(lastGround.y + mapRand(-55, 55), 280, 420);
      platforms.push({ x, y, w, h: 28, lane: "ground" });
      platforms.push({
        x: x - mapRand(8, 30),
        y: roofY + mapRand(-8, 16),
        w: w + mapRand(30, 90),
        h: 22,
        lane: "roof",
      });
      if (mapChance(0.45)) {
        platforms.push({
          x: x + w * 0.2,
          y: clamp(y - 90, 200, 300),
          w: mapRand(55, 85),
          h: 22,
          lane: "mid",
        });
      }
      worldWidth = x + w + 900;
      maybeSendMap(true);
    }
  }

  function spawnBurst(x, y, color, count = 12) {
    if (level === 11) count = Math.min(count, 6);
    if (particles.length > 48) return;
    for (let i = 0; i < count; i++) {
      particles.push({
        x,
        y,
        vx: rand(-3, 3),
        vy: rand(-5, -1),
        life: rand(0.4, 0.9),
        max: 1,
        color,
        size: rand(2, 5),
      });
    }
  }

  function themeFromCode(code) {
    if (code === 1) return "moon";
    if (code === 2) return "jelly";
    if (code === 3) return "keyboard";
    if (code === 4) return "oreo";
    if (code === 5) return "chocoice";
    return undefined;
  }

  function surfaceUnderPlayer() {
    if (!player || !player.onGround) return null;
    const foot = {
      x: player.x + 2,
      y: player.y + player.h,
      w: player.w - 4,
      h: 4,
    };
    for (const p of platforms) {
      if (rectsOverlap(foot, p)) return p;
    }
    return solidAt(player, 0, 1);
  }

  function surfaceKind(plat) {
    if (!plat) return "ground";
    if (
      plat.theme === "jelly" ||
      plat.theme === "keyboard" ||
      plat.theme === "oreo" ||
      plat.theme === "chocoice"
    ) {
      return plat.theme;
    }
    return "ground";
  }

  function updateSoftPlatformFx(dt) {
    if (!player) return;
    const under = surfaceUnderPlayer();
    for (const p of platforms) {
      if (p.theme !== "jelly" && p.theme !== "oreo" && p.theme !== "keyboard") continue;
      const on = under === p && player.onGround;
      const target = on ? 1 : 0;
      p.squish = (p.squish || 0) + (target - (p.squish || 0)) * Math.min(1, dt * 16);
      if (on) {
        p.pressX = clamp((player.x + player.w * 0.5 - p.x) / Math.max(1, p.w), 0.1, 0.9);
      }
      if (p.theme === "keyboard") {
        if (on) {
          const keyW = 22;
          const gap = 3;
          const cols = Math.max(1, Math.floor((p.w - 6) / (keyW + gap)));
          const localX = player.x + player.w * 0.5 - p.x - 4;
          p.pressedKey = Math.max(0, Math.min(cols - 1, Math.floor(localX / (keyW + gap))));
        } else if ((p.squish || 0) < 0.12) {
          p.pressedKey = -1;
        }
      }
    }
  }

  function solidAt(body, dx, dy) {
    const box = { x: body.x + dx, y: body.y + dy, w: body.w, h: body.h };
    for (const p of platforms) {
      // 第 17 关战场：穿透状态下可穿过箱子/沙袋等高掩体（地面与薄高台仍可站立）
      if (
        body.battlePhase &&
        p.h > 20 &&
        (p.theme === "crate" || p.theme === "sandbag" || p.blocksShot)
      ) {
        continue;
      }
      if (rectsOverlap(box, p)) return p;
    }
    return null;
  }

  function findRoofAhead(actor, dir) {
    const probeX = actor.x + actor.w / 2 + dir * 40;
    let best = null;
    for (const p of platforms) {
      if (p.lane !== "roof" && p.lane !== "mid") continue;
      if (probeX >= p.x - 10 && probeX <= p.x + p.w + 10) {
        if (!best || p.y < best.y) best = p;
      }
    }
    return best;
  }

  function moveActor(actor, ax, wantsJump, chaseTarget) {
    if (actor.delayed && actor.delayed > 0) {
      actor.delayed -= 1 / 60;
      return;
    }

    if (chaseTarget) {
      const dx = chaseTarget.x - actor.x;
      const aboveMode = actor.mode === "above";

      if (Math.abs(dx) > 4) {
        actor.vx = Math.sign(dx) * actor.speed;
        actor.facing = Math.sign(dx);
      } else {
        actor.vx = 0;
      }

      if (aboveMode) {
        if (actor.pounceCd > 0) actor.pounceCd -= 1 / 60;

        const aligned = Math.abs(dx) < 55;
        const higher = actor.y + actor.h < chaseTarget.y - 10;
        // Drop-pounce when hovering above the player
        if (aligned && higher && actor.pounceCd <= 0 && actor.onGround) {
          actor.vy = 2.5;
          actor.onGround = false;
          actor.preferRoof = false;
          actor.pounceCd = 2.2;
          spawnBurst(actor.x + actor.w / 2, actor.y + actor.h, "#6aaa4a", 8);
        }

        // After pouncing / falling, climb back to roof when possible
        if (actor.onGround && !actor.preferRoof && actor.y > 210) {
          actor.preferRoof = true;
          actor.pounceCd = Math.max(actor.pounceCd, 0.9);
        }

        if (actor.onGround) {
          const dir = actor.facing || 1;
          const roof = findRoofAhead(actor, dir);
          const under = solidAt(actor, actor.vx * 10, 2);
          if (!under) {
            // Leap along upper path
            actor.vy = JUMP * 0.88;
            actor.onGround = false;
          } else if (actor.preferRoof && roof && roof.y + 8 < actor.y + actor.h - 6) {
            actor.vy = JUMP * 1.05;
            actor.onGround = false;
          } else if (
            actor.preferRoof &&
            under.lane === "ground" &&
            Math.abs(dx) > 30
          ) {
            // Stuck on ground lane — jump toward roof height
            actor.vy = JUMP * 1.1;
            actor.onGround = false;
          }
        }
      } else if (actor.onGround) {
        const ahead = actor.x + actor.w + 18;
        const footY = actor.y + actor.h + 2;
        let land = null;
        for (const p of platforms) {
          if (p.x <= ahead && p.x + p.w >= ahead - 10 && Math.abs(p.y - footY) < 120) {
            land = p;
            break;
          }
        }
        const under = solidAt(actor, actor.vx * 8, 2);
        if (!under || (land && land.y + 8 < actor.y + actor.h)) {
          actor.vy = JUMP * 0.92;
          actor.onGround = false;
        }
      }
    } else {
      actor.vx = ax * MOVE * (speedBoost > 0 ? 1.85 : 1);
      if (ax) actor.facing = ax;
      // 跳跃放到落地判定之后处理，避免果冻弹起吞掉跳跃
    }

    actor.vy += level === 11 && actor === player ? GRAVITY * 0.45 : GRAVITY;
    actor.vy = Math.min(actor.vy, level === 11 && actor === player ? 12 : 16);

    // Horizontal
    actor.x += actor.vx;
    const hitX = solidAt(actor, 0, 0);
    if (hitX) {
      if (actor.vx > 0) actor.x = hitX.x - actor.w;
      else if (actor.vx < 0) actor.x = hitX.x + hitX.w;
      actor.vx = 0;
    }

    // Vertical
    const wasGround = actor.onGround;
    actor.y += actor.vy;
    actor.onGround = false;
    let landPlat = null;
    const hitY = solidAt(actor, 0, 0);
    if (hitY) {
      if (actor.vy > 0) {
        const fallSpeed = actor.vy;
        actor.y = hitY.y - actor.h;
        actor.vy = 0;
        actor.onGround = true;
        landPlat = hitY;
        if (actor === player && !wasGround) {
          const kind = surfaceKind(hitY);
          if (window.GameAudio) {
            if (kind === "jelly") GameAudio.playJellySquish();
            else if (kind === "keyboard") GameAudio.playChocoCrack();
            else if (kind === "oreo") GameAudio.playOreoCrunch();
            else if (kind === "chocoice") {
              if (!hitY.chocolateCracked) hitY.chocolateCracked = true;
              GameAudio.playKeyboardTap();
            }
          }
          // 果冻：像史莱姆方块，落地弹起；若本帧按着跳则优先起跳
          if (kind === "jelly" && fallSpeed > 3.2 && !chaseTarget) {
            if (wantsJump) {
              actor.vy = JUMP * 1.45;
              actor.onGround = false;
              landPlat = null;
              spawnBurst(actor.x + actor.w / 2, actor.y + actor.h, "#ff9ad8", 8);
              if (window.GameAudio) GameAudio.playJump();
            } else {
              actor.vy = -Math.min(8.2, 3.2 + fallSpeed * 0.38);
              actor.onGround = false;
              actor.jellyCoyote = 0.14;
            }
          }
        }
      } else if (actor.vy < 0) {
        // 只有从下方顶到平台才当天花板；站在上表面起跳时不要卡死
        const feet = actor.y + actor.h;
        if (feet > hitY.y + hitY.h * 0.55) {
        actor.y = hitY.y + hitY.h;
        actor.vy = 0;
        }
      }
    }

    // 玩家与镜像 NPC 等受控角色都可跳跃（僵尸走 chaseTarget 分支）
    if (!chaseTarget) {
      if (actor.jellyCoyote == null) actor.jellyCoyote = 0;
      if (actor.jellyCoyote > 0) actor.jellyCoyote -= 1 / 60;
      const under = landPlat || solidAt(actor, 0, 2);
      const onJelly = under && surfaceKind(under) === "jelly";
      const canJump = actor.onGround || actor.jellyCoyote > 0;
      if (wantsJump && canJump) {
        actor.vy = onJelly ? JUMP * 1.35 : JUMP;
        actor.onGround = false;
        actor.jellyCoyote = 0;
        if (actor === player) {
          spawnBurst(
            actor.x + actor.w / 2,
            actor.y + actor.h,
            onJelly ? "#ff9ad8" : "#ffd27a",
            6
          );
          if (window.GameAudio) {
            if (onJelly) GameAudio.playJellySquish();
            GameAudio.playJump();
          }
        }
      }
    }

    if (actor.y + actor.h > LAVA_Y) {
      if (fakeLava) {
        // Fake magma — fall through onto the secret path
        if (actor.y > H + 120) {
          actor.alive = false;
        }
      } else if (lavaDrainAt(actor.x + actor.w / 2)) {
        actor.y = LAVA_Y - actor.h;
        actor.vy = 0;
        actor.onGround = true;
      } else {
        actor.alive = false;
        actor.y = LAVA_Y - actor.h;
      }
    }
  }

  function update(dt) {
    time += dt;
    if (state !== "playing" || settingsOpen || adOpen || shopOpen || portraitPromptOpen || socialOpen) {
      updateParticles(dt);
      if (!settingsOpen && !adOpen && !shopOpen && !socialOpen && window.GameAudio) {
        GameAudio.stopAllAmbience();
      }
      return;
    }

    const left =
      keys.has("ArrowLeft") ||
      keys.has("a") ||
      keys.has("A") ||
      touch.left;
    const right =
      keys.has("ArrowRight") ||
      keys.has("d") ||
      keys.has("D") ||
      touch.right;
    const jump =
      keys.has(" ") ||
      keys.has("ArrowUp") ||
      keys.has("w") ||
      keys.has("W") ||
      touch.jump;
    let ax = (right ? 1 : 0) - (left ? 1 : 0);

    // Eating animation locks player movement
    if (eatAnim) {
      ax = 0;
      updateEatAnim(dt);
    }

    // 第 17 关复活等待中 / 列车上 锁定操作
    if (level === 17 && battleScene && (battleScene.playerDown || (player && player.onTrain))) {
      ax = 0;
      moveActor(player, 0, false, null);
      player.vx = 0;
      if (battleScene.playerDown) {
        player.x = 1000;
        player.y = battleScene.groundY - player.h;
        player.onGround = true;
      }
    } else if (level === 26 && planeScene && planeScene.phase !== "cabin") {
      // 下落/着陆由 updatePlane26 接管
    } else if (level === 26 && planeScene && planeScene.phase === "cabin") {
      // 舱内可左右走，跳跃键只用于跳机（不普通起跳）
      moveActor(player, eatAnim ? 0 : ax, false, null);
    } else {
      moveActor(player, eatAnim ? 0 : ax, eatAnim ? false : jump, null);
    }
    extendEndlessParkour();

    if (speedBoost > 0) {
      speedBoost -= dt;
      if (Math.random() < 0.45) {
        spawnBurst(
          player.x + player.w / 2,
          player.y + player.h - 4,
          "#5ce1ff",
          2
        );
      }
    }

    // Crate + speed potion (level 4)
    if (crate && !crate.open && rectsOverlap(player, crate)) {
      crate.open = true;
      potion = {
        x: crate.x + 6,
        y: crate.y - 28,
        w: 22,
        h: 28,
        bob: 0,
      };
      spawnBurst(crate.x + crate.w / 2, crate.y, "#d4a574", 12);
      statusLabel.textContent = "开箱！";
    }
    if (potion && rectsOverlap(player, potion)) {
      potion = null;
      speedBoost = 7.5;
      spawnBurst(player.x + player.w / 2, player.y + 10, "#5ce1ff", 20);
      statusLabel.textContent = "加速！";
    }
    if (potion) potion.bob += dt * 5;

    if (level === 11 && pickups.length) {
      for (const p of pickups) {
        if (p.collected) continue;
        p.pulse += dt * 4;
        const box = {
          x: p.x - p.r,
          y: p.y - p.r,
          w: p.r * 2,
          h: p.r * 2,
        };
        if (rectsOverlap(player, box)) {
          p.collected = true;
          stars += 1;
          saveStars();
          starLabel.textContent = String(stars);
          spawnBurst(p.x, p.y, "#ffe566", 6);
          if (window.GameAudio) GameAudio.playStar();
          if (window.LevelCoop) LevelCoop.send({ type: "pickup", lv: level, starId: p.id });
        }
      }
    }

    for (const z of zombies) {
      if (!z.alive && z.alive !== false) z.alive = true;
      moveActor(z, 0, false, nearestHuntTarget(z));
      z.bob += dt * 8;
      if (z.alive !== false && rectsOverlap(player, z)) {
        if (z.fake) {
          // Harmless scare zombie
          if (!z.scaredAt || time - z.scaredAt > 1.2) {
            z.scaredAt = time;
            shake = Math.max(shake, 6);
            statusLabel.textContent = "假的！虚惊一场";
            spawnBurst(z.x + z.w / 2, z.y + 10, "#9bbb6a", 8);
          }
        } else {
          die("zombie");
          return;
        }
      }
    }

    // Spikes
    for (const s of spikes) {
      const hit = {
        x: s.x + 2,
        y: s.y + 4,
        w: s.w - 4,
        h: s.h - 2,
      };
      if (rectsOverlap(player, hit)) {
        die("spike");
        return;
      }
    }

    // Rotating maces (level 7) — oversized; blocks path unless dismantled
    for (const m of maces) {
      m.angle += m.spin;
      if (hitByMace(player, m)) {
        die("mace");
        return;
      }
    }

    // All uneaten rockets block the path (level 8)
    for (const r of rockets) {
      if (r.eaten || r.eating) continue;
      if (rectsOverlap(player, r)) {
        if (player.x + player.w / 2 < r.x + r.w / 2) {
          player.x = r.x - player.w;
        } else {
          player.x = r.x + r.w;
        }
        player.vx = 0;
      }
    }

    if (player.alive === false) {
      die(level === 11 ? "crater" : "lava");
      return;
    }

    // Star collect (normal levels only)
    if (star) {
      const starBox = {
        x: star.x - star.r,
        y: star.y - star.r,
        w: star.r * 2,
        h: star.r * 2,
      };
      star.pulse += dt * 4;
      if (!star.collected && rectsOverlap(player, starBox)) {
        star.collected = true;
        stars += 1;
        saveStars();
        starLabel.textContent = String(stars);
        spawnBurst(star.x, star.y, "#ffe566", 28);
        spawnBurst(star.x, star.y, "#ff9a2a", 16);
        shake = 10;
        winLevel();
        return;
      }
    }
    if (endSign) endSign.pulse += dt * 3;
    if (comingSoon) comingSoon.pulse += dt * 2;
    if (shopScene) updateShopScene(dt);
    if (towerScene && updateTower14) updateTower14(dt);
    if (subwayScene && updateSubway15) updateSubway15(dt);
    if (rangeScene && updateRange16) updateRange16(dt);
    if (battleScene && updateBattle17) updateBattle17(dt);
    if (schoolScene && updateSchool18) updateSchool18(dt);
    if (musicScene && updateMusic19) updateMusic19(dt);
    if (dateScene && updateDate20) updateDate20(dt);
    if (kongScene && updateKong21) updateKong21(dt);
    if (starHouseScene && updateStarHouse22) updateStarHouse22(dt);
    if (matchScene && updateMatch23) updateMatch23(dt);
    if (furnaceScene && updateFurnace24) updateFurnace24(dt);
    if (twinScene && updateTwin25) updateTwin25(dt);
    if (planeScene && updatePlane26) updatePlane26(dt);
    if (pipeScene && updatePipe27) updatePipe27(dt);

    updateCoop(dt);
    cameraX = cameraForView();
    if (shake > 0) shake *= 0.88;
    updateParticles(dt);
    updateSoftPlatformFx(dt);

    if (window.GameAudio) {
      const surf = surfaceUnderPlayer();
      const kind = surfaceKind(surf);
      const running =
        player &&
        player.onGround &&
        Math.abs(player.vx) > 0.4 &&
        !eatAnim;
      GameAudio.updateGameplay(dt, {
        playing: true,
        city: level === 8,
        moon: level === 11,
        zombies: zombies.some((z) => z.alive !== false),
        running,
        fast: speedBoost > 0,
        surface: kind,
      });
    }
  }

  function updateParticles(dt) {
    for (const p of particles) {
      p.life -= dt;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 8 * dt;
    }
    particles = particles.filter((p) => p.life > 0);
  }

  function leaveSpecialLevels() {
    if (syncTower14OnLeave) syncTower14OnLeave();
    if (syncSubway15OnLeave) syncSubway15OnLeave();
    if (syncRange16OnLeave) syncRange16OnLeave();
    if (syncBattle17OnLeave) syncBattle17OnLeave();
    if (syncSchool18OnLeave) syncSchool18OnLeave();
    if (syncMusic19OnLeave) syncMusic19OnLeave();
    if (syncDate20OnLeave) syncDate20OnLeave();
    if (syncKong21OnLeave) syncKong21OnLeave();
    if (syncStarHouse22OnLeave) syncStarHouse22OnLeave();
    if (syncMatch23OnLeave) syncMatch23OnLeave();
    if (syncFurnace24OnLeave) syncFurnace24OnLeave();
    if (syncTwin25OnLeave) syncTwin25OnLeave();
    if (syncPlane26OnLeave) syncPlane26OnLeave();
    if (syncPipe27OnLeave) syncPipe27OnLeave();
  }

  function die(cause) {
    leaveSpecialLevels();
    const name = playerName || "玩家";
    if (window.LevelCoop && LevelCoop.isJoined()) {
      LevelCoop.send({ type: "dead", lv: level, cause, name: name.slice(0, 12) });
    }
    announceDeath(name, cause);
    stopLevelCoop();
    state = "dead";
    statusLabel.textContent = "失败";
    shake = 14;
    spawnBurst(player.x + player.w / 2, player.y + player.h / 2, "#ff5533", 20);
    if (window.GameAudio) {
      GameAudio.stopAllAmbience();
      GameAudio.playDeath();
    }
    syncPuzzleTools();
    syncHomeBtn();

    if (playerName) {
      showOverlay(deathLine(playerName, cause), `关卡 ${level} · 已收集 ${stars} 颗五角星`, "重生", {
        showName: false,
        hideHint: true,
      });
      return;
    }

    const reason =
      cause === "zombie"
        ? "僵尸抓住了你！"
        : cause === "spike"
          ? "踩到尖刺了！"
          : cause === "mace"
            ? "被旋转的狼牙棒砸中了！"
            : cause === "crater"
              ? "掉进陨石坑了！"
              : cause === "car"
                ? "你撞大运了，哥们！"
                : cause === "hungry"
                  ? "三份饭都被抢光了！"
                  : cause === "barrel"
                    ? "被大木桶砸中了！"
                    : "掉进岩浆了！";
    showOverlay(cause === "car" ? "你撞大运了，哥们！" : "游戏结束", `${reason}<br />关卡 ${level} · 已收集 ${stars} 颗五角星`, "再试一次");
  }

  function winLevel() {
    leaveSpecialLevels();
    stopLevelCoop();
    state = "win";
    statusLabel.textContent = "通关";
    markLevelCleared(level);
    if (window.GameAudio) {
      GameAudio.stopAllAmbience();
      GameAudio.playStar();
      setTimeout(() => GameAudio.playWin(), 280);
    }
    syncPuzzleTools();
    syncHomeBtn();

    if (level >= MAX_PLAYABLE) {
      showOverlay(
        "到达终点！",
        `第 ${level} 关完成！<br />第 27 关「钢管大战」是目前的终点，后面作者还在做，敬请期待。`,
        "回主页",
        { hideHint: true }
      );
      return;
    }

    const next = level + 1;
    let warn = "";
    if (next === 2) {
      warn =
        `<br /><span style="color:#ffb347">警告：第 2 关有 20 只僵尸从上方追击……终点似乎不太对劲。</span>`;
    } else if (next === 3) {
      warn =
        `<br /><span style="color:#ffb347">第 3 关没有僵尸……但好像少了点什么。</span>`;
    } else if (next === 4) {
      warn =
        `<br /><span style="color:#ffb347">第 4 关：平路逃亡。身后有大僵尸——旁边的箱子也许能救命。</span>`;
    } else if (next === 5) {
      warn =
        `<br /><span style="color:#ffb347">第 5 关：简单跑酷。终点……好像有点不对劲？</span>`;
    } else if (next === 6) {
      warn =
        `<br /><span style="color:#ffb347">第 6 关：尖刺缝隙。上方有僵尸……也许点一点？</span>`;
    } else if (next === 7) {
      warn =
        `<br /><span style="color:#ffb347">第 7 关：狼牙棒挡路。有的东西……可以拆？</span>`;
    } else if (next === 8) {
      warn =
        `<br /><span style="color:#ffb347">第 8 关：城市里的火箭。试试点击？</span>`;
    } else if (next === 9) {
      warn =
        `<br /><span style="color:#ffb347">第 9 关：路断了……岩浆下也许有秘密。</span>`;
    } else if (next === 10) {
      warn =
        `<br /><span style="color:#ffb347">第 10 关：五角星专卖店。现在是 11:58……</span>`;
    } else if (next === 11) {
      warn =
        `<br /><span style="color:#ffb347">第 11 关：月球跑酷。没有僵尸，可以和其他玩家一起跳过陨石坑。</span>`;
    } else if (next === 12) {
      warn =
        `<br /><span style="color:#ffb347">第 12 关：沙盒世界。进关后选择生存或创造，可以挖方块、开门、联机建造。</span>`;
    } else if (next === 13) {
      warn =
        `<br /><span style="color:#ffb347">第 13 关：解压跑酷。果冻、键盘、奥利奥、巧克力冰块——没有僵尸。</span>`;
    } else if (next === 14) {
      warn =
        `<br /><span style="color:#ffb347">第 14 关：123 层大厦。手机没电了——充电、点外卖，再在地图里搜索机场给外卖小哥叫飞机。</span>`;
    } else if (next === 15) {
      warn =
        `<br /><span style="color:#ffb347">第 15 关：挤地铁。坐电梯去 B1，买票扫码过闸，挤上第 4 列地铁到蓝月桥。</span>`;
    } else if (next === 16) {
      warn =
        `<br /><span style="color:#ffb347">第 16 关：练枪。射击场打靶——瞄准、发射、下趴、潜行，打中全部 5 个靶通关。</span>`;
    } else if (next === 17) {
      warn =
        `<br /><span style="color:#ffb347">第 17 关：战场。蓝队 vs 红队，只有枪和小匕首，消灭全部红队通关。</span>`;
    } else if (next === 18) {
      warn =
        `<br /><span style="color:#ffb347">第 18 关：抢饭。下课铃一响就往食堂冲，过马路、经班级门口、直行 500 米抢三份饭。</span>`;
    } else if (next === 19) {
      warn =
        `<br /><span style="color:#ffb347">第 19 关：音乐。Cursor合集纯音乐，请欣赏。</span>`;
    } else if (next === 20) {
      warn =
        `<br /><span style="color:#ffb347">第 20 关：西餐厅。选性别、换装，和约会对象一起放松用餐。</span>`;
    } else if (next === 21) {
      warn =
        `<br /><span style="color:#ffb347">第 21 关：DONKEY KONG。爬梯子、躲开滚桶，冲到顶层救人。</span>`;
    } else if (next === 22) {
      warn =
        `<br /><span style="color:#ffb347">第 22 关：五角星屋。喷泉会喷出大量五角星，靠近去捡。</span>`;
    } else if (next === 23) {
      warn =
        `<br /><span style="color:#ffb347">第 23 关：消消乐。顶上炮台瞄准发射，三连同色消除，清空 90 行过关。</span>`;
    } else if (next === 24) {
      warn =
        `<br /><span style="color:#ffb347">第 24 关：倒计时熔炉。岩浆每 30 秒上涨，向上建造，集齐 3 星开启传送门。</span>`;
    } else if (next === 25) {
      warn =
        `<br /><span style="color:#ffb347">第 25 关：双人板。你走上路、镜像 NPC 走下路，同时踩压力板出桥，10 秒内一起冲终点。</span>`;
    } else if (next === 26) {
      warn =
        `<br /><span style="color:#ffb347">第 26 关：飞机事故。海拔 9000 米，按跳跃跳下飞机，躲避障碍安全落地。</span>`;
    } else if (next === 27) {
      warn =
        `<br /><span style="color:#ffb347">第 27 关：钢管大战。吃豆子升级，点红色按钮挑战超级钢管 BOSS。</span>`;
    }

    showOverlay(
      "通关！",
      `第 ${level} 关完成！五角星 +1${warn}`,
      "下一关"
    );
  }

  function showOverlay(title, msg, btn, opts = {}) {
    overlayTitle.textContent = title;
    overlayMsg.innerHTML = msg;
    startBtn.textContent = btn;
    const showName = !!opts.showName;
    nameForm.classList.toggle("hidden", !showName);
    if (overlayHint) {
      if (showName) {
        overlayHint.classList.remove("hidden");
        overlayHint.textContent = "名字会出现在你的头顶上";
      } else if (opts.hideHint) {
        overlayHint.classList.add("hidden");
      } else {
        overlayHint.classList.remove("hidden");
        overlayHint.textContent = controlHintText();
      }
    }
    overlay.classList.remove("hidden");
    syncPuzzleTools();
    syncTouchPad();
    if (showName) {
      nameInput.value = playerName || "";
      if (!preferTouchControls()) setTimeout(() => nameInput.focus(), 50);
    }
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
    nameForm.classList.add("hidden");
  }

  function syncPuzzleTools() {
    if (!puzzleTools) return;
    const show = puzzleMode && state === "playing";
    puzzleTools.classList.toggle("hidden", !show);
    puzzleTools.setAttribute("aria-hidden", show ? "false" : "true");
  }

  function syncHomeBtn() {
    const show = state === "playing";
    if (cornerActions) {
      cornerActions.classList.toggle("hidden", !show);
      cornerActions.setAttribute("aria-hidden", show ? "false" : "true");
    } else if (homeBtn) {
      homeBtn.classList.toggle("hidden", !show);
    }
    if (!show) {
      closeSettings();
      closeShop();
      closeChat();
      }
    syncTouchPad();
    syncItemBar();
    syncChatBtn();
  }

  function syncChatBtn() {
    if (!chatBtn && !chatDock) return;
    const show = state === "playing" && !adOpen && !settingsOpen && !shopOpen && !socialOpen;
    if (chatDock) chatDock.classList.toggle("hidden", !show);
    else if (chatBtn) chatBtn.classList.toggle("hidden", !show);
    if (!show) closeChat();
  }

  function openChat() {
    if (!chatPanel || state !== "playing") return;
    chatPanel.classList.remove("hidden");
    chatPanel.setAttribute("aria-hidden", "false");
    renderChatLog();
    if (chatInput) {
      chatInput.value = "";
      setTimeout(() => {
        chatInput.focus();
        renderChatLog();
      }, 30);
    }
  }

  function closeChat() {
    if (!chatPanel) return;
    chatPanel.classList.add("hidden");
    chatPanel.setAttribute("aria-hidden", "true");
    if (chatInput) chatInput.blur();
  }

  function sendChat() {
    if (blockIfMuted()) return;
    const maxLen = level === 17 ? 24 : 12;
    const text = ((chatInput && chatInput.value) || "").trim().slice(0, maxLen);
    if (!text) {
      if (chatInput) chatInput.focus();
      return;
    }
    localChat = text;
    localChatUntil = time + 4.5;
    const name = playerName || "玩家";
    announceChat(name, text);
    if (window.LevelCoop && LevelCoop.isJoined()) {
      LevelCoop.send({ type: "chat", lv: level, text, name: name.slice(0, 12) });
    }
    if (window.GameAudio) GameAudio.playClick();
    if (chatInput) {
      chatInput.value = "";
      chatInput.focus();
    }
  }


  function applyBrightness(v) {
    brightness = clamp(Math.round(Number(v) || 100), 40, 150);
    const filter = brightness === 100 ? "none" : `brightness(${brightness}%)`;
    canvas.style.filter = filter;
    const craftGl = document.getElementById("craft-gl");
    if (craftGl) craftGl.style.filter = filter;
    if (brightnessSlider) brightnessSlider.value = String(brightness);
    if (brightnessValue) brightnessValue.textContent = `${brightness}%`;
    saveStr("yyy_brightness", brightness);
  }

  function applyVolume(v) {
    volumePct = clamp(Math.round(Number(v) || 0), 0, 100);
    if (volumeSlider) volumeSlider.value = String(volumePct);
    if (volumeValue) volumeValue.textContent = `${volumePct}%`;
    if (window.GameAudio) GameAudio.setVolume(volumePct / 100);
    saveStr("yyy_volume", volumePct);
  }

  function loadSettings() {
    const b = Number(loadStr("yyy_brightness", "100"));
    const vol = Number(loadStr("yyy_volume", "35"));
    applyBrightness(Number.isFinite(b) ? b : 100);
    applyVolume(Number.isFinite(vol) ? vol : 35);
  }

  function saveStars() {
    saveStr("yyy_stars", stars);
    if (starLabel) starLabel.textContent = String(stars);
  }

  function saveInventory() {
    saveJson("yyy_inventory", inventory);
  }

  function loadProgress() {
    const s = loadStr("yyy_stars", null);
      if (s != null && Number.isFinite(Number(s))) stars = Math.max(0, Math.floor(Number(s)));
    const parsed = loadJson("yyy_inventory", null);
    if (parsed && typeof parsed === "object") {
        for (const key of Object.keys(inventory)) {
          const n = Math.floor(Number(parsed[key]) || 0);
          inventory[key] = Math.max(0, n);
        }
      }
    const cleared = loadStr("yyy_cleared", null);
      if (cleared != null && Number.isFinite(Number(cleared))) {
        maxCleared = Math.max(0, Math.floor(Number(cleared)));
    }
    if (starLabel) starLabel.textContent = String(stars);
  }

  function saveCleared() {
    saveStr("yyy_cleared", maxCleared);
  }

  function markLevelCleared(n) {
    const lv = Math.floor(Number(n) || 0);
    if (lv > maxCleared) {
      maxCleared = lv;
      saveCleared();
    }
  }

  function isLevelUnlocked(n) {
    if (n <= 1 || n === 11 || n === 12 || n === 22) return true;
    return maxCleared >= n - 1;
  }

  function resetLevelUses() {
    levelUses = {
      potion: inventory.potion * 1,
      sword: inventory.sword * 2,
      pickaxe: inventory.pickaxe * 25,
      bucket: inventory.bucket * 10,
    };
    toolMode = null;
    syncItemBar();
  }

  function lavaDrainAt(x) {
    for (const d of lavaDrains) {
      if (x >= d.x && x <= d.x + d.w) return true;
    }
    return false;
  }

  function remainingFor(item) {
    if (item === "skipCard") return inventory.skipCard;
    return levelUses[item] || 0;
  }

  function syncItemBar() {
    if (!itemBar) return;
    const show = state === "playing" && level !== 12 && !adOpen && !settingsOpen && !shopOpen && !portraitPromptOpen && !socialOpen;
    itemBar.classList.toggle("hidden", !show);
    itemBar.setAttribute("aria-hidden", show ? "false" : "true");
    if (!show) return;
    for (const btn of itemBar.querySelectorAll(".item-btn")) {
      const key = btn.dataset.use;
      const countEl = btn.querySelector("[data-count]");
      const left = remainingFor(key);
      if (countEl) countEl.textContent = String(left);
      btn.disabled = left <= 0;
      btn.classList.toggle("active", toolMode === key);
    }
  }

  function refreshShopUI() {
    if (shopStarCount) shopStarCount.textContent = String(stars);
    if (!shopPanel) return;
    for (const btn of shopPanel.querySelectorAll(".shop-buy")) {
      const key = btn.dataset.buy;
      const item = SHOP_CATALOG[key];
      if (!item) continue;
      btn.disabled = stars < item.cost;
      const owned = inventory[key] || 0;
      btn.textContent = `${item.cost}★ 兑换（拥有 ${owned}）`;
    }
  }

  function buyItem(key) {
    const item = SHOP_CATALOG[key];
    if (!item) return;
    if (stars < item.cost) {
      if (shopTip) shopTip.textContent = "五角星不够！";
      return;
    }
    stars -= item.cost;
    inventory[key] = (inventory[key] || 0) + 1;
    saveStars();
    saveInventory();
    // Refresh this level's remaining uses for newly bought gear
    if (key === "potion") levelUses.potion += 1;
    if (key === "sword") levelUses.sword += 2;
    if (key === "pickaxe") levelUses.pickaxe += 25;
    if (key === "bucket") levelUses.bucket += 10;
    if (shopTip) shopTip.textContent = `已兑换：${item.name}`;
    refreshShopUI();
    syncItemBar();
    if (window.GameAudio) GameAudio.playStar();
  }

  function openShop() {
    if (state !== "playing" || !shopPanel || adOpen) return;
    closeSettings();
    shopOpen = true;
    toolMode = null;
    clearInput();
    if (shopTip) shopTip.textContent = "";
    refreshShopUI();
    shopPanel.classList.remove("hidden");
    shopPanel.setAttribute("aria-hidden", "false");
    statusLabel.textContent = "商城";
    syncTouchPad();
    syncItemBar();
    syncChatBtn();
  }

  function closeShop() {
    shopOpen = false;
    if (shopPanel) {
      shopPanel.classList.add("hidden");
      shopPanel.setAttribute("aria-hidden", "true");
    }
    if (state === "playing" && !adOpen && !settingsOpen) {
      statusLabel.textContent = "逃亡中";
    }
    syncTouchPad();
    syncItemBar();
    syncChatBtn();
  }

  function useSkipCard() {
    if (inventory.skipCard <= 0) {
      statusLabel.textContent = "没有跳过卡";
      return;
    }
    inventory.skipCard -= 1;
    saveInventory();
    syncItemBar();
    closeShop();
    closeSettings();
    statusLabel.textContent = "使用跳过卡";
    if (window.GameAudio) GameAudio.playWin();
    finishSkipAd();
  }

  function usePotionItem() {
    if (levelUses.potion <= 0) {
      statusLabel.textContent = "本关加速次数用完了";
      return;
    }
    levelUses.potion -= 1;
    speedBoost = Math.max(speedBoost, 7.5);
    statusLabel.textContent = "加速药水！";
    spawnBurst(player.x + player.w / 2, player.y, "#7aefff", 16);
    if (window.GameAudio) GameAudio.playClick();
    syncItemBar();
  }

  function useBucketItem() {
    if (levelUses.bucket <= 0) {
      statusLabel.textContent = "本关桶次数用完了";
      return;
    }
    if (fakeLava) {
      statusLabel.textContent = "这里的岩浆吸不动…";
      return;
    }
    levelUses.bucket -= 1;
    const dir = player.facing || 1;
    const x = player.x + player.w / 2 + dir * 40 - 60;
    lavaDrains.push({ x, w: 140 });
    spawnBurst(x + 70, LAVA_Y - 10, "#6ec8ff", 20);
    shake = 6;
    statusLabel.textContent = `吸走岩浆！剩余 ${levelUses.bucket} 次`;
    if (window.GameAudio) GameAudio.playClick();
    syncItemBar();
  }

  function armSword() {
    if (levelUses.sword <= 0) {
      statusLabel.textContent = "本关宝剑次数用完了";
      return;
    }
    toolMode = toolMode === "sword" ? null : "sword";
    statusLabel.textContent = toolMode === "sword" ? "宝剑已举起：点击僵尸" : "取消宝剑";
    syncItemBar();
  }

  function armPickaxe() {
    if (levelUses.pickaxe <= 0) {
      statusLabel.textContent = "本关稿子次数用完了";
      return;
    }
    toolMode = toolMode === "pickaxe" ? null : "pickaxe";
    statusLabel.textContent = toolMode === "pickaxe" ? "稿子已举起：点击拆除" : "取消稿子";
    syncItemBar();
  }

  function killZombieWithSword(world) {
    if (levelUses.sword <= 0) return false;
    for (let i = zombies.length - 1; i >= 0; i--) {
      const z = zombies[i];
      if (z.alive === false) continue;
      if (!pointInRect(world.x, world.y, z)) continue;
      // Harmless scare zombies on level 6 still killable by sword
      spawnBurst(z.x + z.w / 2, z.y + z.h / 2, "#ffe566", 20);
      spawnBurst(z.x + z.w / 2, z.y + z.h / 2, "#ff5533", 14);
      shake = 10;
      zombies.splice(i, 1);
      levelUses.sword -= 1;
      toolMode = levelUses.sword > 0 ? "sword" : null;
      statusLabel.textContent = `斩杀！宝剑剩余 ${levelUses.sword}`;
      if (window.GameAudio) GameAudio.playClick();
      syncItemBar();
      return true;
    }
    statusLabel.textContent = "没有点到僵尸";
    return true; // consumed the click while armed
  }

  function breakWithPickaxe(world) {
    if (levelUses.pickaxe <= 0) return false;

    const tryBreak = (list, hitFn, onBreak) => {
      for (let i = list.length - 1; i >= 0; i--) {
        const obj = list[i];
        if (!hitFn(obj)) continue;
        onBreak(obj, i);
        return true;
      }
      return false;
    };

    let broke = false;
    broke =
      tryBreak(
        rockets,
        (r) => !r.eaten && pointInRect(world.x, world.y, r),
        (r, i) => {
          spawnBurst(r.x + r.w / 2, r.y + r.h / 2, "#ff9a2a", 18);
          rockets.splice(i, 1);
        }
      ) ||
      tryBreak(
        maces,
        (m) => pointInRect(world.x, world.y, { x: m.x - 20, y: m.y - 20, w: 80, h: 120 }),
        (_m, i) => {
          const m = maces[i];
          spawnBurst(m.x + 20, m.y + 40, "#c0c0c0", 18);
          maces.splice(i, 1);
        }
      ) ||
      tryBreak(
        spikes,
        (s) => pointInRect(world.x, world.y, { x: s.x - 6, y: s.y - 8, w: s.w + 12, h: s.h + 12 }),
        (s, i) => {
          spawnBurst(s.x + s.w / 2, s.y, "#d0d0d0", 14);
          spikes.splice(i, 1);
        }
      ) ||
      tryBreak(
        platforms,
        (p) => pointInRect(world.x, world.y, p),
        (p, i) => {
          spawnBurst(p.x + p.w / 2, p.y + 8, "#c47a30", 16);
          platforms.splice(i, 1);
        }
      );

    if (crate && pointInRect(world.x, world.y, crate)) {
      spawnBurst(crate.x + crate.w / 2, crate.y + crate.h / 2, "#c47a30", 14);
      crate = null;
      broke = true;
    }

    if (!broke) {
      statusLabel.textContent = "没有点到可拆的东西";
      return true;
    }

    levelUses.pickaxe -= 1;
    toolMode = levelUses.pickaxe > 0 ? "pickaxe" : null;
    statusLabel.textContent = `拆掉了！稿子剩余 ${levelUses.pickaxe}`;
    shake = 8;
    if (window.GameAudio) GameAudio.playClick();
    syncItemBar();
    return true;
  }

  function tryUseToolClick(clientX, clientY) {
    if (state !== "playing" || !toolMode) return false;
    const world = clientToWorld(clientX, clientY);
    if (toolMode === "sword") return killZombieWithSword(world);
    if (toolMode === "pickaxe") return breakWithPickaxe(world);
    return false;
  }

  function useInventoryItem(key) {
    if (state !== "playing" || adOpen || settingsOpen || shopOpen) return;
    if (key === "skipCard") useSkipCard();
    else if (key === "potion") usePotionItem();
    else if (key === "sword") armSword();
    else if (key === "pickaxe") armPickaxe();
    else if (key === "bucket") useBucketItem();
  }

  function openSettings() {
    if (state !== "playing" || !settingsPanel || adOpen || shopOpen) return;
    settingsOpen = true;
    settingsPanel.classList.remove("hidden");
    settingsPanel.setAttribute("aria-hidden", "false");
    if (brightnessSlider) brightnessSlider.value = String(brightness);
    if (volumeSlider) volumeSlider.value = String(volumePct);
    if (brightnessValue) brightnessValue.textContent = `${brightness}%`;
    if (volumeValue) volumeValue.textContent = `${volumePct}%`;
    clearInput();
    statusLabel.textContent = "设置";
    syncTouchPad();
    syncItemBar();
    syncChatBtn();
  }

  function closeSettings() {
    settingsOpen = false;
    if (settingsPanel) {
      settingsPanel.classList.add("hidden");
      settingsPanel.setAttribute("aria-hidden", "true");
    }
    if (state === "playing" && !adOpen && !shopOpen) statusLabel.textContent = "逃亡中";
    syncTouchPad();
    syncItemBar();
    syncChatBtn();
  }


  function syncTouchPad() {
    if (!touchPad) return;
    const show =
      state === "playing" &&
      preferTouchControls() &&
      !adOpen &&
      !settingsOpen &&
      !shopOpen &&
      !socialOpen &&
      !portraitPromptOpen;
    touchPad.classList.toggle("hidden", !show);
    touchPad.setAttribute("aria-hidden", show ? "false" : "true");
    if (!show) {
      touch.left = false;
      touch.right = false;
      touch.jump = false;
      touch.up = false;
      touch.down = false;
      touch.dig = false;
      for (const btn of touchPad.querySelectorAll(".touch-btn")) {
        btn.classList.remove("pressed");
      }
    }
  }

  function clearInput() {
    keys.clear();
    touch.left = false;
    touch.right = false;
    touch.jump = false;
    touch.up = false;
    touch.down = false;
    touch.dig = false;
    if (touchPad) {
      for (const btn of touchPad.querySelectorAll(".touch-btn")) {
        btn.classList.remove("pressed");
      }
    }
  }

  function setupTouchControls() {
    if (!touchPad) return;

    const bindHold = (btn, setOn) => {
      const press = (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.classList.add("pressed");
        setOn(true);
        if (window.GameAudio) GameAudio.unlock();
        try {
          btn.setPointerCapture(e.pointerId);
        } catch (_) {
          /* ignore */
        }
      };
      const release = () => {
        btn.classList.remove("pressed");
        setOn(false);
      };
      btn.addEventListener("pointerdown", press);
      btn.addEventListener("pointerup", release);
      btn.addEventListener("pointercancel", release);
      btn.addEventListener("lostpointercapture", release);
    };

    const leftBtn = touchPad.querySelector('[data-dir="left"]');
    const rightBtn = touchPad.querySelector('[data-dir="right"]');
    const upBtn = touchPad.querySelector('[data-dir="up"]');
    const downBtn = touchPad.querySelector('[data-dir="down"]');
    const jumpBtn = touchPad.querySelector('[data-action="jump"]');
    if (leftBtn) bindHold(leftBtn, (v) => (touch.left = v));
    if (rightBtn) bindHold(rightBtn, (v) => (touch.right = v));
    if (upBtn) bindHold(upBtn, (v) => (touch.up = v));
    if (downBtn) bindHold(downBtn, (v) => (touch.down = v));
    if (jumpBtn) bindHold(jumpBtn, (v) => (touch.jump = v));
    const digBtn = document.getElementById("craft-dig");
    if (digBtn) bindHold(digBtn, (v) => (touch.dig = v));

    touchPad.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  function hideLevelSelect() {
    if (!levelSelect) return;
    levelSelect.classList.add("hidden");
    levelSelect.setAttribute("aria-hidden", "true");
    if (levelTip) {
      levelTip.classList.add("hidden");
      levelTip.textContent = "";
    }
  }

  function buildLevelGrid() {
    if (!levelGrid) return;
    levelGrid.innerHTML = "";
    const LEVEL_BADGES = {
      11: "月球",
      12: "沙盒",
      13: "解压",
      14: "大厦",
      15: "挤地铁",
      16: "练枪",
      17: "战场",
      18: "抢饭",
      19: "音乐",
      20: "西餐厅",
      21: "DONKEY KONG",
      22: "五角星屋",
      23: "消消乐",
      24: "倒计时熔炉",
      25: "双人板",
      26: "飞机事故",
      27: "钢管大战",
    };
    for (let i = 1; i <= TOTAL_LEVELS; i++) {
      if (i === 1) {
        const sep = document.createElement("div");
        sep.className = "level-section-sep";
        sep.setAttribute("aria-hidden", "true");
        sep.innerHTML = "<span>娱乐</span>";
        levelGrid.appendChild(sep);
      }
      if (i === 19) {
        const sep = document.createElement("div");
        sep.className = "level-section-sep";
        sep.setAttribute("aria-hidden", "true");
        sep.innerHTML = "<span>休闲</span>";
        levelGrid.appendChild(sep);
      }
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "level-cell";
      btn.dataset.level = String(i);
      if (i > MAX_PLAYABLE) {
        btn.classList.add("locked");
        btn.innerHTML = `${i}<span class="badge">未开放</span>`;
      } else if (!isLevelUnlocked(i)) {
        btn.classList.add("locked-progress");
        btn.innerHTML = `${i}<span class="badge">未解锁</span>`;
      } else if (LEVEL_BADGES[i]) {
        btn.classList.add("endpoint");
        btn.innerHTML = `${i}<span class="badge">${LEVEL_BADGES[i]}</span>`;
      } else if (maxCleared >= i) {
        btn.classList.add("playable");
        btn.innerHTML = `${i}<span class="badge">已通关</span>`;
      } else {
        btn.classList.add("playable");
        btn.innerHTML = `${i}`;
      }
      const online = document.createElement("span");
      online.className = "online";
      online.textContent = `${levelPlayerCounts[i] || 0}人在玩`;
      btn.appendChild(online);
      btn.addEventListener("click", () => selectLevel(i));
      levelGrid.appendChild(btn);
    }
  }

  function showUnlockDialog(n) {
    pendingUnlockLevel = n;
    const prev = Math.max(1, n - 1);
    if (unlockMsg) {
      unlockMsg.textContent = `您上一关还没有通关，请通关第${prev}关`;
    }
    if (unlockDialog) {
      unlockDialog.classList.remove("hidden");
      unlockDialog.setAttribute("aria-hidden", "false");
    }
  }

  function hideUnlockDialog() {
    pendingUnlockLevel = 0;
    if (unlockDialog) {
      unlockDialog.classList.add("hidden");
      unlockDialog.setAttribute("aria-hidden", "true");
    }
  }

  function skipPreviousAndEnter() {
    const n = pendingUnlockLevel;
    if (!n || n < 2) {
      hideUnlockDialog();
      return;
    }
    hideUnlockDialog();
    markLevelCleared(Math.max(1, n - 1));
    enterLevel(n);
  }


  function finishSkipAd() {
    markLevelCleared(level);
    if (window.GameAudio) GameAudio.stopAllAmbience();
    if (level >= MAX_PLAYABLE) {
      statusLabel.textContent = "已是终点";
      showLevelSelect();
      if (levelTip) {
        levelTip.textContent = "已经是目前最后一关啦";
        levelTip.classList.remove("hidden");
      }
      return;
    }
    startGame("next");
  }

  function enterLevel(n) {
    if (blockIfBanned()) return;
    if (levelTip) {
      levelTip.classList.add("hidden");
    }
    closeFriendCenter();
    closeGlobalChat();
    closeInboxPanel();
    hideLevelSelect();
    hideUnlockDialog();
    level = n;
    levelLabel.textContent = String(level);
    if (needsPlayerName(level) && !playerName) {
      showNamePrompt();
      return;
    }
    beginPlaying();
  }

  function showLevelSelect() {
    closeLoginScreen();
    hideOverlay();
    hideLevelSelect();
    hideUnlockDialog();
    leaveSpecialLevels();
    state = "select";
    statusLabel.textContent = "选关";
    watchLobbyCounts();
    buildLevelGrid();
    applyLevelCounts(levelPlayerCounts);
    levelSelect.classList.remove("hidden");
    levelSelect.setAttribute("aria-hidden", "false");
    syncPuzzleTools();
    syncHomeBtn();
    maybeShowPortraitPrompt();
    syncInboxBtn();
    renderHomeNotices();
  }

  function needsPlayerName(n) {
    return n === 4 || n >= 5;
  }

  function playUiClick() {
    if (window.GameAudio) GameAudio.playClick();
  }

  function playMoonCoopNow() {
    playUiClick();
    if (blockIfBanned()) return;
    loggedIn = true;
    if (!playerName) playerName = "玩家";
    closeLoginScreen();
    hideUnlockDialog();
    hidePortraitPrompt();
    enterLevel(11);
  }

  function playCraftCoopNow() {
    playUiClick();
    if (blockIfBanned()) return;
    loggedIn = true;
    if (!playerName) playerName = "玩家";
    closeLoginScreen();
    hideUnlockDialog();
    hidePortraitPrompt();
    enterLevel(12);
  }

  function hideSandboxMode() {
    if (!sandboxModeEl) return;
    sandboxModeEl.classList.add("hidden");
    sandboxModeEl.setAttribute("aria-hidden", "true");
  }

  function showSandboxMode() {
    if (!sandboxModeEl) {
      startCraftWorld("survival");
      return;
    }
    sandboxModeEl.classList.remove("hidden");
    sandboxModeEl.setAttribute("aria-hidden", "false");
    if (statusLabel) statusLabel.textContent = "选择模式";
  }

  function startCraftWorld(mode) {
    hideSandboxMode();
    if (!window.CraftWorld) {
      statusLabel.textContent = "缺少 3D 模块";
      return;
    }
    const ok = CraftWorld.start({
      w: W,
      h: H,
      name: playerName || "玩家",
      mode: mode === "creative" ? "creative" : "survival",
      onStatus: (t) => {
        if (statusLabel) statusLabel.textContent = t;
      },
    });
    if (ok) markLevelCleared(12);
    if (!ok) statusLabel.textContent = "这台电脑不支持 3D";
  }

  function selectLevel(n) {
    playUiClick();
    if (n > MAX_PLAYABLE) {
      levelTip.textContent = "后面作者还在做，敬请期待（第 27 关「钢管大战」是目前终点）";
      levelTip.classList.remove("hidden");
      return;
    }
    if (!isLevelUnlocked(n)) {
      showUnlockDialog(n);
      return;
    }
    enterLevel(n);
  }

  function openLoginScreen() {
    leaveSpecialLevels();
    if (isBanned()) {
      showBanScreen("你被封号了");
      return;
    }
    hideBanScreen();
    state = "login";
    loggedIn = false;
    statusLabel.textContent = "登录";
    syncPuzzleTools();
    syncHomeBtn();
    hideOverlay();
    hideLevelSelect();
    hideUnlockDialog();
    maybeShowPortraitPrompt();
    loginError.classList.add("hidden");
    minorNotice.classList.add("hidden");
    loginSubmit.classList.remove("hidden");
    loginUser.value = "";
    loginPass.value = "";
    loginPhone.value = "";
    loginSms.value = "";
    loginIdcard.value = "";
    mockSmsCode = "";
    setLoginMode("account");
    loginScreen.classList.remove("hidden");
    loginScreen.setAttribute("aria-hidden", "false");
    setTimeout(() => loginUser.focus(), 50);
  }

  function closeLoginScreen() {
    loginScreen.classList.add("hidden");
    loginScreen.setAttribute("aria-hidden", "true");
  }

  function goHome() {
    leaveSpecialLevels();
    stopLevelCoop();
    closeSettings();
    closeShop();
    if (loggedIn) showLevelSelect();
    else openLoginScreen();
  }

  function returnToHomeMenu() {
    if (blockIfBanned()) return;
    loggedIn = true;
    closeLoginScreen();
    stopLevelCoop();
    // Keep collected stars; reset only on logout
    statusLabel.textContent = "选关";
    homeMode = false;
    puzzleMode = false;
    makeLevel(1);
    resetPuzzleButtons();
    syncPuzzleTools();
    syncHomeBtn();
    showLevelSelect();
  }

  let loginMode = "account";
  let mockSmsCode = "";
  let smsCooldown = 0;
  let smsTimer = null;

  function setLoginMode(mode) {
    loginMode = mode;
    for (const tab of loginTabs) {
      tab.classList.toggle("active", tab.dataset.mode === mode);
    }
    loginPaneAccount.classList.toggle("hidden", mode !== "account");
    loginPanePhone.classList.toggle("hidden", mode !== "phone");
    loginPaneIdcard.classList.toggle("hidden", mode !== "idcard");
    loginError.classList.add("hidden");
    minorNotice.classList.add("hidden");
    loginSubmit.classList.remove("hidden");
  }

  function showLoginError(msg) {
    loginError.textContent = msg;
    loginError.classList.remove("hidden");
  }

  function parseIdAge(id) {
    const s = String(id).trim().toUpperCase();
    let birth = null;
    if (/^\d{17}[\dX]$/.test(s)) {
      birth = s.slice(6, 14); // YYYYMMDD
    } else if (/^\d{15}$/.test(s)) {
      birth = `19${s.slice(6, 12)}`;
    } else {
      return null;
    }
    const y = Number(birth.slice(0, 4));
    const m = Number(birth.slice(4, 6));
    const d = Number(birth.slice(6, 8));
    if (!y || m < 1 || m > 12 || d < 1 || d > 31) return null;
    const birthday = new Date(y, m - 1, d);
    if (Number.isNaN(birthday.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - y;
    const md = now.getMonth() + 1 - m;
    if (md < 0 || (md === 0 && now.getDate() < d)) age -= 1;
    return age;
  }

  function showMinorNotice() {
    minorNotice.classList.remove("hidden");
    loginSubmit.classList.add("hidden");
    loginError.classList.add("hidden");
    statusLabel.textContent = "防沉迷";
  }

  function sendSmsCode() {
    const phone = (loginPhone.value || "").trim();
    if (!/^1\d{10}$/.test(phone)) {
      showLoginError("请输入正确的 11 位手机号");
      return;
    }
    if (smsCooldown > 0) return;
    mockSmsCode = String(Math.floor(100000 + Math.random() * 900000));
    showLoginError(`验证码已发送（演示码：${mockSmsCode}）`);
    loginError.style.color = "#7dffb0";
    smsCooldown = 60;
    smsBtn.disabled = true;
    smsBtn.textContent = `${smsCooldown}s`;
    clearInterval(smsTimer);
    smsTimer = setInterval(() => {
      smsCooldown -= 1;
      if (smsCooldown <= 0) {
        clearInterval(smsTimer);
        smsBtn.disabled = false;
        smsBtn.textContent = "获取验证码";
      } else {
        smsBtn.textContent = `${smsCooldown}s`;
      }
    }, 1000);
  }

  function submitLogin() {
    loginError.style.color = "#ff7a5c";
    if (blockIfBanned()) return;
    if (loginMode === "account") {
      const user = (loginUser.value || "").trim();
      const pass = loginPass.value || "";
      if (!user || !pass) {
        showLoginError("请输入账号和密码");
        return;
      }
      returnToHomeMenu();
      return;
    }

    if (loginMode === "phone") {
      const phone = (loginPhone.value || "").trim();
      const code = (loginSms.value || "").trim();
      if (!/^1\d{10}$/.test(phone)) {
        showLoginError("请输入正确的 11 位手机号");
        return;
      }
      if (!mockSmsCode) {
        showLoginError("请先获取验证码");
        return;
      }
      if (code !== mockSmsCode) {
        showLoginError("验证码错误");
        return;
      }
      returnToHomeMenu();
      return;
    }

    if (loginMode === "idcard") {
      const id = (loginIdcard.value || "").trim().toUpperCase();
      if (!/^\d{17}[\dX]$/.test(id) && !/^\d{15}$/.test(id)) {
        showLoginError("请输入正确的身份证号码");
        return;
      }
      const age = parseIdAge(id);
      if (age == null) {
        showLoginError("身份证号码无效");
        return;
      }
      if (age < 18) {
        showMinorNotice();
        return;
      }
      returnToHomeMenu();
    }
  }

  function resetPuzzleButtons() {
    for (const btn of fakeButtons) {
      btn.classList.remove("used", "dragging", "locked");
      btn.style.transform = "";
      btn.style.left = "";
      btn.style.top = "";
      btn.style.position = "";
      btn.style.width = "";
      btn.style.zIndex = "";
    }
  }

  function canvasScale() {
    const rect = canvas.getBoundingClientRect();
    return {
      rect,
      sx: rect.width / W,
      sy: rect.height / H,
    };
  }

  function clientToWorld(clientX, clientY) {
    const { rect, sx, sy } = canvasScale();
    return {
      x: (clientX - rect.left) / sx + cameraX,
      y: (clientY - rect.top) / sy,
    };
  }

  function placeBridgeButton(btn, clientX, clientY) {
    const world = clientToWorld(clientX, clientY);
    const label = btn.dataset.label || "砖";
    // Snap onto the pit height; length of three pieces exactly fills the gap
    let x = world.x - bridgePieceW / 2;
    const y = bridgeY;

    // Magnetic snap into the three ordered slots across the pit
    const slots = [0, 1, 2].map((i) => pitStart + i * bridgePieceW);
    const taken = new Set(
      platforms.filter((p) => p.lane === "bridge").map((p) => Math.round(p.x))
    );
    let best = null;
    let bestDist = Infinity;
    for (const slot of slots) {
      if (taken.has(Math.round(slot))) continue;
      const d = Math.abs(x - slot);
      if (d < bestDist) {
        bestDist = d;
        best = slot;
      }
    }
    // Also allow free-ish placement if dropped near the pit band
    const nearPit =
      world.x > pitStart - 80 &&
      world.x < pitStart + pitWidth + 80 &&
      world.y > bridgeY - 120 &&
      world.y < bridgeY + 80;

    if (!nearPit || best == null) {
      // Bounce back — not a valid build spot
      return false;
    }

    x = best;
    platforms.push({
      x,
      y,
      w: bridgePieceW,
      h: 28,
      lane: "bridge",
      label,
    });
    spawnBurst(x + bridgePieceW / 2, y, "#ffd24a", 10);
    btn.classList.add("used");
    statusLabel.textContent = "搭路中";
    return true;
  }

  function setupPuzzleDrag() {
    let drag = null;

    for (const btn of fakeButtons) {
      // Never activate as real UI — click does nothing useful
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
      });

      btn.addEventListener("pointerdown", (e) => {
        if (state !== "playing" || !puzzleMode || btn.classList.contains("used")) return;
        e.preventDefault();
        btn.setPointerCapture(e.pointerId);
        const rect = btn.getBoundingClientRect();
        drag = {
          btn,
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          moved: false,
          offsetX: e.clientX - rect.left,
          offsetY: e.clientY - rect.top,
        };
        btn.classList.add("dragging");
        btn.style.position = "fixed";
        btn.style.left = `${rect.left}px`;
        btn.style.top = `${rect.top}px`;
        btn.style.width = `${rect.width}px`;
        btn.style.zIndex = "30";
      });
    }

    window.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.pointerId) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (Math.hypot(dx, dy) > 6) drag.moved = true;
      drag.btn.style.left = `${e.clientX - drag.offsetX}px`;
      drag.btn.style.top = `${e.clientY - drag.offsetY}px`;
    });

    window.addEventListener("pointerup", (e) => {
      if (!drag || e.pointerId !== drag.pointerId) return;
      const { btn, moved } = drag;
      btn.classList.remove("dragging");
      try {
        btn.releasePointerCapture(e.pointerId);
      } catch (_) {}

      btn.style.position = "";
      btn.style.left = "";
      btn.style.top = "";
      btn.style.width = "";
      btn.style.zIndex = "";

      if (!moved) {
        btn.classList.remove("locked");
        void btn.offsetWidth;
        btn.classList.add("locked");
        statusLabel.textContent = "打不开…";
        setTimeout(() => btn.classList.remove("locked"), 400);
        drag = null;
        return;
      }

      const ok = placeBridgeButton(btn, e.clientX, e.clientY);
      if (!ok) statusLabel.textContent = "拖到坑上才能搭路";
      drag = null;
    });
  }

  function beginPlaying() {
    levelLabel.textContent = String(level);
    statusLabel.textContent = "逃亡中";
    makeLevel(level);
    resetPuzzleButtons();
    resetLevelUses();
    state = "playing";
    hideOverlay();
    hideLevelSelect();
    syncPuzzleTools();
    syncHomeBtn();
    syncItemBar();
    maybeShowPortraitPrompt();
    startLevelCoop();
    if (level === 12) showSandboxMode();
    if (level === 14 && initTower14) initTower14();
    else if (syncTower14OnLeave) syncTower14OnLeave();
    if (level === 15 && initSubway15) initSubway15();
    else if (syncSubway15OnLeave) syncSubway15OnLeave();
    if (level === 16 && initRange16) initRange16();
    else if (syncRange16OnLeave) syncRange16OnLeave();
    if (level === 17 && initBattle17) initBattle17();
    else if (syncBattle17OnLeave) syncBattle17OnLeave();
    if (level === 18 && initSchool18) initSchool18();
    else if (syncSchool18OnLeave) syncSchool18OnLeave();
    if (level === 19 && initMusic19) initMusic19();
    else if (syncMusic19OnLeave) syncMusic19OnLeave();
    if (level === 20 && initDate20) initDate20();
    else if (syncDate20OnLeave) syncDate20OnLeave();
    if (level === 21 && initKong21) initKong21();
    else if (syncKong21OnLeave) syncKong21OnLeave();
    if (level === 22 && initStarHouse22) initStarHouse22();
    else if (syncStarHouse22OnLeave) syncStarHouse22OnLeave();
    if (level === 23 && initMatch23) initMatch23();
    else if (syncMatch23OnLeave) syncMatch23OnLeave();
    if (level === 24 && initFurnace24) initFurnace24();
    else if (syncFurnace24OnLeave) syncFurnace24OnLeave();
    if (level === 25 && initTwin25) initTwin25();
    else if (syncTwin25OnLeave) syncTwin25OnLeave();
    if (level === 26 && initPlane26) initPlane26();
    else if (syncPlane26OnLeave) syncPlane26OnLeave();
    if (level === 27 && initPipe27) initPipe27();
    else if (syncPipe27OnLeave) syncPipe27OnLeave();
    if (window.GameAudio) {
      GameAudio.unlock();
      GameAudio.syncAmbience({
        playing: true,
        force: true,
        city: level === 8,
        moon: level === 11 || level === 19 || level === 20 || level === 21 || level === 22 || level === 23,
        zombies: zombies.length > 0,
      });
    }
  }

  function showNamePrompt() {
    state = "naming";
    levelLabel.textContent = String(level);
    statusLabel.textContent = "起名";
    makeLevel(level);
    resetPuzzleButtons();
    syncPuzzleTools();
    syncHomeBtn();
    hideLevelSelect();
    const msg =
      level >= 5
        ? `第 ${level} 关起，名字会一直显示在头顶。<br />请先给自己的玩家起个名字。`
        : "先给自己的玩家起个名字。<br />平路上有一只大僵尸在追你——旁边的箱子里藏着速度药水。";
    showOverlay(`第 ${level} 关`, msg, "确认名字", { showName: true });
    maybeShowPortraitPrompt();
  }

  function confirmPlayerName() {
    const name = (nameInput.value || "").trim().slice(0, 30000);
    if (!name) {
      nameInput.focus();
      statusLabel.textContent = "先起个名字";
      return false;
    }
    playerName = name;
    if (window.LevelCoop && typeof LevelCoop.setName === "function") {
      LevelCoop.setName(myDisplayName());
    }
    beginPlaying();
    return true;
  }

  function startGame(mode) {
    // mode: fresh | retry | next
    if (mode === "fresh") {
      if (loggedIn) {
        showLevelSelect();
        return;
      }
      openLoginScreen();
      return;
    } else if (mode === "next") {
      if (level >= MAX_PLAYABLE) {
        showLevelSelect();
        return;
      }
      level += 1;
    }

    if (needsPlayerName(level) && !playerName) {
      showNamePrompt();
      return;
    }

    beginPlaying();
  }

  const S = GameUtil.liveScope(
    (n) => eval(n),
    (n, value) => eval(n + " = value"),
    "COOP_COLORS,DESIGN_H,DESIGN_W,GRAVITY,H,JUMP,LAVA_Y,MAX_PLAYABLE,MOVE,PORTRAIT_PROMPT_KEY,PORTRAIT_W,SHOP_CATALOG,TOTAL_LEVELS,W,ZOMBIE_COUNT,adOpen,announceChat,announceDeath,announceJoin,announceLeave,applyBrightness,applyCoopMap,applyLevelCounts,applyLevelOpts,applyVolume,armPickaxe,armSword,backpack,banLeft,banMsg,banScreen,banTimerId,beginPlaying,belly,breakWithPickaxe,bridgePieceW,bridgeY,brightness,brightnessSlider,brightnessValue,buildLevelGrid,buyItem,cameraForView,cameraX,canvas,canvasScale,chatBtn,chatClose,chatDock,chatInput,chatLog,chatLogEl,chatLogLevel,chatPanel,chatSend,chatUserCancel,chatUserDialog,chatUserFriend,chatUserMsg,chatUserReport,chatUserTarget,clamp,clearInput,clientToWorld,closeChat,closeLoginScreen,closeSettings,closeShop,colorForCoopId,comingSoon,confirmPlayerName,controlHintText,coopAcc,coopAnchorX,coopAnnounceAt,coopCount,coopFurthestX,coopHostId,cornerActions,craftCoopBtn,crate,craters,ctx,deathLine,die,eatAnim,endSign,enterLevel,escapeHtml,extendEndlessParkour,fakeButtons,fakeLava,findRoofAhead,friendCenter,friendCenterOpen,friendChatInput,friendChatLogEl,friendChatSend,friendChatTitle,friendInviteBtn,friendInviteLevel,friendListEl,friendReqCurrent,friendReqDialog,friendReqMsg,friendReqNo,friendReqQueue,friendReqYes,friendUnread,friends,friendsBtn,friendsClose,gameTitle,globalChat,globalChatBtn,globalChatClose,globalChatInput,globalChatLogEl,globalChatOpen,globalChatPanel,globalChatSend,globalChatUnread,goHome,handleCoopMessage,handleHomePeer,hideLevelSelect,hideOverlay,hidePortraitPrompt,hideSandboxMode,hideUnlockDialog,hitRemotePlayer,homeBtn,homeMode,homeNotices,homeNoticesEl,homePeerQuietUntil,homePeerReady,inboxBtn,inboxClear,inboxClose,inboxListEl,inboxOpen,inboxPanel,inboxReports,inboxUnread,inventory,inviteCurrent,inviteDialog,inviteMsg,inviteNo,inviteQueue,inviteYes,isCoopHost,isDevicePortrait,isLevelUnlocked,isMobileLike,isPortraitPlay,itemBar,joinNotices,joinNoticesEl,keys,killZombieWithSword,lastCoopPos,lastMapSendAt,lastTs,lavaDrainAt,lavaDrains,level,levelGrid,levelLabel,levelPlayerCounts,levelSelect,levelTip,levelUses,loadJson,loadProgress,loadSettings,loadStr,localChat,localChatUntil,localCoopId,loggedIn,loginError,loginIdcard,loginMode,loginMoonBtn,loginPaneAccount,loginPaneIdcard,loginPanePhone,loginPass,loginPhone,loginScreen,loginSms,loginSubmit,loginTabs,loginUser,logoutBtn,loop,maces,makeLevel,mapChance,mapRand,mapRngFn,markLevelCleared,maxCleared,maybeSendMap,maybeShowPortraitPrompt,minorNotice,minorOk,mockSmsCode,moonCoopBtn,moonEarthGrad,moonSkyGrad,moonVoidGrad,moveActor,myDisplayName,nameForm,nameInput,nearestHuntTarget,needsPlayerName,onViewportChange,openChat,openLoginScreen,openSettings,openShop,overlay,overlayHint,overlayMsg,overlayTitle,packMap,parseIdAge,particles,pendingFriend,pendingUnlockLevel,pickups,pitStart,pitWidth,placeBridgeButton,platforms,playCraftCoopNow,playMoonCoopNow,playUiClick,player,playerLabel,playerName,portraitAccept,portraitDecline,portraitDialog,portraitPromptDismissed,portraitPromptOpen,potion,preferTouchControls,pushHomeNotice,pushJoinNotice,pushZombie,puzzleMode,puzzleTools,rand,rectsOverlap,refreshShopUI,remainingFor,remoteCamX,remotePlayers,renderChatLog,renderHomeNotices,renderJoinNotices,reportCancel,reportDialog,reportMsg,resetLevelUses,resetPuzzleButtons,returnToHomeMenu,reverseGoal,rockets,sandboxCreative,sandboxModeEl,sandboxSurvival,saveCleared,saveInventory,saveJson,saveStars,saveStr,seededRng,selectLevel,selectedFriendId,sendChat,sendSmsCode,setLoginMode,settingsBtn,settingsClose,settingsOpen,settingsPanel,setupPuzzleDrag,setupTouchControls,shake,shopBtn,shopClose,shopOpen,shopPanel,shopScene,shopStarCount,shopTip,showLevelSelect,towerScene,subwayScene,rangeScene,battleScene,schoolScene,musicScene,dateScene,kongScene,starHouseScene,matchScene,furnaceScene,twinScene,planeScene,pipeScene,showLoginError,showMinorNotice,showNamePrompt,showOverlay,showPhoneJoin,showPortraitPrompt,showSandboxMode,showUnlockDialog,skipBtn,skipPreviousAndEnter,smsBtn,smsCooldown,smsTimer,socialOpen,socialToastEl,socialToastTimer,solidAt,spawnBurst,spawnX,speedBoost,spikes,star,starLabel,stars,startBtn,startCraftWorld,startGame,startLevelCoop,state,statusLabel,stopLevelCoop,submitLogin,syncChatBtn,syncCoopStatus,syncHomeBtn,syncItemBar,syncPuzzleTools,syncTouchPad,syncViewport,time,toolMode,touch,touchPad,tryClickPlayerName,tryUseToolClick,unlockCancelBtn,unlockDialog,unlockMsg,unlockOnce,unlockSkipBtn,update,updateCoop,updateParticles,useBucketItem,useInventoryItem,usePotionItem,useSkipCard,volumePct,volumeSlider,volumeValue,watchLobbyCounts,winLevel,worldMin,worldWidth,zombies"
  );
  window.installGameSocial(S);
  window.installGameDraw(S);
  if (typeof window.installTower14 === "function") window.installTower14(S);
  if (typeof window.installSubway15 === "function") window.installSubway15(S);
  if (typeof window.installRange16 === "function") window.installRange16(S);
  if (typeof window.installBattle17 === "function") window.installBattle17(S);
  if (typeof window.installSchool18 === "function") window.installSchool18(S);
  if (typeof window.installMusic19 === "function") window.installMusic19(S);
  if (typeof window.installDate20 === "function") window.installDate20(S);
  if (typeof window.installKong21 === "function") window.installKong21(S);
  if (typeof window.installStarHouse22 === "function") window.installStarHouse22(S);
  if (typeof window.installMatch23 === "function") window.installMatch23(S);
  if (typeof window.installFurnace24 === "function") window.installFurnace24(S);
  if (typeof window.installTwin25 === "function") window.installTwin25(S);
  if (typeof window.installPlane26 === "function") window.installPlane26(S);
  if (typeof window.installPipe27 === "function") window.installPipe27(S);
  initTower14 = S.initTower14 || null;
  updateTower14 = S.updateTower14 || null;
  drawTowerExtras = S.drawTowerExtras || null;
  tryClickTower14 = S.tryClickTower14 || null;
  syncTower14OnLeave = S.syncTower14OnLeave || null;
  initSubway15 = S.initSubway15 || null;
  updateSubway15 = S.updateSubway15 || null;
  drawSubwayExtras = S.drawSubwayExtras || null;
  drawSubwayForeground = S.drawSubwayForeground || null;
  tryClickSubway15 = S.tryClickSubway15 || null;
  syncSubway15OnLeave = S.syncSubway15OnLeave || null;
  initRange16 = S.initRange16 || null;
  updateRange16 = S.updateRange16 || null;
  drawRangeExtras = S.drawRangeExtras || null;
  syncRange16OnLeave = S.syncRange16OnLeave || null;
  initBattle17 = S.initBattle17 || null;
  updateBattle17 = S.updateBattle17 || null;
  drawBattleExtras = S.drawBattleExtras || null;
  syncBattle17OnLeave = S.syncBattle17OnLeave || null;
  initSchool18 = S.initSchool18 || null;
  updateSchool18 = S.updateSchool18 || null;
  drawSchoolExtras = S.drawSchoolExtras || null;
  syncSchool18OnLeave = S.syncSchool18OnLeave || null;
  initMusic19 = S.initMusic19 || null;
  updateMusic19 = S.updateMusic19 || null;
  drawMusicExtras = S.drawMusicExtras || null;
  syncMusic19OnLeave = S.syncMusic19OnLeave || null;
  initDate20 = S.initDate20 || null;
  updateDate20 = S.updateDate20 || null;
  drawDateExtras = S.drawDateExtras || null;
  syncDate20OnLeave = S.syncDate20OnLeave || null;
  tryClickDate20 = S.tryClickDate20 || null;
  initKong21 = S.initKong21 || null;
  updateKong21 = S.updateKong21 || null;
  drawKongExtras = S.drawKongExtras || null;
  syncKong21OnLeave = S.syncKong21OnLeave || null;
  initStarHouse22 = S.initStarHouse22 || null;
  updateStarHouse22 = S.updateStarHouse22 || null;
  drawStarHouseExtras = S.drawStarHouseExtras || null;
  syncStarHouse22OnLeave = S.syncStarHouse22OnLeave || null;
  initMatch23 = S.initMatch23 || null;
  updateMatch23 = S.updateMatch23 || null;
  drawMatchExtras = S.drawMatchExtras || null;
  syncMatch23OnLeave = S.syncMatch23OnLeave || null;
  initFurnace24 = S.initFurnace24 || null;
  updateFurnace24 = S.updateFurnace24 || null;
  drawFurnaceExtras = S.drawFurnaceExtras || null;
  syncFurnace24OnLeave = S.syncFurnace24OnLeave || null;
  initTwin25 = S.initTwin25 || null;
  updateTwin25 = S.updateTwin25 || null;
  drawTwinExtras = S.drawTwinExtras || null;
  syncTwin25OnLeave = S.syncTwin25OnLeave || null;
  initPlane26 = S.initPlane26 || null;
  updatePlane26 = S.updatePlane26 || null;
  drawPlaneExtras = S.drawPlaneExtras || null;
  syncPlane26OnLeave = S.syncPlane26OnLeave || null;
  initPipe27 = S.initPipe27 || null;
  updatePipe27 = S.updatePipe27 || null;
  drawPipeExtras = S.drawPipeExtras || null;
  syncPipe27OnLeave = S.syncPipe27OnLeave || null;
  const {
    loadFriends,
    syncFriendsBtn,
    renderFriendList,
    selectFriend,
    fillInviteLevels,
    openFriendCenter,
    closeFriendCenter,
    loadGlobalChat,
    syncGlobalChatBtn,
    openGlobalChat,
    closeGlobalChat,
    sendGlobalChat,
    hideChatUserDialog,
    hideReportDialog,
    closeChatUserFlow,
    showChatUserDialog,
    showReportDialog,
    submitReport,
    clearOldOwnerMarks,
    markOwner,
    isOwner,
    loadInboxReports,
    saveInboxReports,
    syncInboxBtn,
    renderInboxList,
    closeInboxPanel,
    isBanned,
    hideBanScreen,
    showBanScreen,
    sendModAction,
    blockIfMuted,
    blockIfBanned,
    answerFriendReq,
    answerInvite,
    requestFriend,
    sendFriendChat,
    sendFriendInvite,
    handleSocial,
    OWNER_UNLOCK,
    updateShopScene,
    tryClickShopStar,
    hoverShopStar,
    hitByMace,
    pointInRect,
    tryClickLevel6,
    tryClickLevel7,
    hoverLevel6Target,
    updateEatAnim,
    tryClickLevel8,
    hoverLevel8Target,
    draw,
    tryClickEndSign
  } = S;

  function loop(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.033, (ts - lastTs) / 1000);
    lastTs = ts;
    if (level === 12 && state === "playing" && window.CraftWorld && CraftWorld.active()) {
      const chatOpen = chatPanel && !chatPanel.classList.contains("hidden");
      CraftWorld.tick(dt, {
        keys,
        touch,
        paused: settingsOpen || adOpen || shopOpen || socialOpen || portraitPromptOpen || chatOpen,
      });
    } else {
    update(dt);
      if (level !== 12) draw();
    }
    requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", (e) => {
    if (chatPanel && !chatPanel.classList.contains("hidden")) {
      if (e.key === "Escape") {
        closeChat();
      e.preventDefault();
      }
      return;
    }
    keys.add(e.key);
    if (e.code) keys.add(e.code);
    if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Space"].includes(e.key) ||
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "KeyW", "KeyA", "KeyS", "KeyD"].includes(e.code)
    ) {
      if (state === "playing") e.preventDefault();
    }
    if ((e.key === "r" || e.key === "R") && state === "playing") {
      if (level === 12 && window.CraftWorld && CraftWorld.active()) {
        CraftWorld.reset();
        startLevelCoop();
        statusLabel.textContent = "重开";
      } else {
      makeLevel(level);
      resetPuzzleButtons();
      syncPuzzleTools();
      syncHomeBtn();
        startLevelCoop();
      statusLabel.textContent = "重开";
      }
    }
    if (e.key === "Enter" && state !== "playing" && state !== "login" && state !== "select") {
      if (state === "naming") {
        confirmPlayerName();
      } else if (state === "win") {
        if (level >= MAX_PLAYABLE) showLevelSelect();
        else startGame("next");
      } else if (state === "dead") startGame("retry");
      else startGame("fresh");
    }
  });

  window.addEventListener("keyup", (e) => {
    keys.delete(e.key);
    if (e.code) keys.delete(e.code);
  });

  startBtn.addEventListener("click", () => {
    playUiClick();
    if (state === "naming") confirmPlayerName();
    else if (state === "win") {
      if (level >= MAX_PLAYABLE) showLevelSelect();
      else startGame("next");
    } else if (state === "dead") startGame("retry");
    else startGame("fresh");
  });

  nameInput.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      confirmPlayerName();
    }
  });


  canvas.addEventListener("pointerup", (e) => {
    if (e.button != null && e.button !== 0) return;
    if (settingsOpen || adOpen || shopOpen || socialOpen) return;
    if (!toolMode && tryClickPlayerName(e.clientX, e.clientY)) return;
    if (tryUseToolClick(e.clientX, e.clientY)) return;
    if (tryClickShopStar(e.clientX, e.clientY)) return;
    if (tryClickTower14 && tryClickTower14(e.clientX, e.clientY)) return;
    if (tryClickSubway15 && tryClickSubway15(e.clientX, e.clientY)) return;
    if (tryClickDate20 && tryClickDate20(e.clientX, e.clientY)) return;
    if (tryClickLevel6(e.clientX, e.clientY)) return;
    if (tryClickLevel7(e.clientX, e.clientY)) return;
    if (tryClickLevel8(e.clientX, e.clientY)) return;
    tryClickEndSign(e.clientX, e.clientY);
  });

  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    if (state !== "playing") {
      canvas.style.cursor = "default";
      return;
    }
    if (
      hoverLevel6Target(e.clientX, e.clientY) ||
      hoverLevel8Target(e.clientX, e.clientY) ||
      hoverShopStar(e.clientX, e.clientY) ||
      hitRemotePlayer(clientToWorld(e.clientX, e.clientY))
    ) {
      canvas.style.cursor = "pointer";
      return;
    }
    // Level 7 maces: no pointer cursor — dismantle is a secret
    if (endSign && endSign.hit) {
      const world = clientToWorld(e.clientX, e.clientY);
      const h = endSign.hit;
      const over =
        world.x >= h.x &&
        world.x <= h.x + h.w &&
        world.y >= h.y &&
        world.y <= h.y + h.h;
      canvas.style.cursor = over ? "pointer" : "default";
      return;
    }
    canvas.style.cursor = "default";
  });

  homeBtn.addEventListener("click", () => {
    playUiClick();
    if (state === "playing") goHome();
  });
  homeBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (state === "playing") goHome();
    }
  });

  if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
      playUiClick();
      if (adOpen || shopOpen) return;
      if (settingsOpen) closeSettings();
      else openSettings();
    });
  }
  if (skipBtn) {
    skipBtn.addEventListener("click", () => {
      playUiClick();
      if (shopOpen) return;
      if (state !== "playing") return;
      finishSkipAd();
    });
  }
  if (shopBtn) {
    shopBtn.addEventListener("click", () => {
      playUiClick();
      if (adOpen) return;
      if (shopOpen) closeShop();
      else openShop();
    });
  }
  if (shopClose) {
    shopClose.addEventListener("click", () => {
      playUiClick();
      closeShop();
    });
  }
  if (shopPanel) {
    shopPanel.addEventListener("click", (e) => {
      if (e.target === shopPanel) {
        playUiClick();
        closeShop();
      }
    });
    for (const btn of shopPanel.querySelectorAll(".shop-buy")) {
      btn.addEventListener("click", () => {
        playUiClick();
        buyItem(btn.dataset.buy);
      });
    }
  }
  if (itemBar) {
    for (const btn of itemBar.querySelectorAll(".item-btn")) {
      btn.addEventListener("click", () => {
        playUiClick();
        useInventoryItem(btn.dataset.use);
      });
    }
  }
  if (settingsClose) {
    settingsClose.addEventListener("click", () => {
      playUiClick();
      closeSettings();
    });
  }
  if (settingsPanel) {
    settingsPanel.addEventListener("click", (e) => {
      if (e.target === settingsPanel) {
        playUiClick();
        closeSettings();
      }
    });
  }
  if (brightnessSlider) {
    brightnessSlider.addEventListener("input", () => {
      applyBrightness(brightnessSlider.value);
    });
  }
  if (volumeSlider) {
    volumeSlider.addEventListener("input", () => {
      applyVolume(volumeSlider.value);
      if (window.GameAudio) {
        GameAudio.unlock();
        GameAudio.playClick();
      }
    });
  }

  function showPhoneJoin(urls) {
    const url = urls && urls[0];
    const text = url
      ? `手机请用相机扫下面二维码，或在 Safari 输入这个地址（必须带 http://）：\n${url}`
      : "手机请和电脑连同一个 WiFi，用电脑屏幕上显示的地址打开最新版";
    document.querySelectorAll("[data-phone-url]").forEach((el) => {
      el.textContent = text;
    });
    document.querySelectorAll("[data-phone-qr]").forEach((img) => {
      if (!url) {
        img.hidden = true;
        return;
      }
      img.hidden = false;
      img.src =
        "https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=" +
        encodeURIComponent(url);
    });
  }

  fetch("lan.json?t=" + Date.now())
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => showPhoneJoin(data && data.urls))
    .catch(() => showPhoneJoin(null));

  if (chatBtn) {
    chatBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      playUiClick();
      openChat();
    });
  }
  if (chatSend) {
    chatSend.addEventListener("click", () => {
      playUiClick();
      sendChat();
    });
  }
  if (chatClose) {
    chatClose.addEventListener("click", () => {
      playUiClick();
      closeChat();
    });
  }
  if (chatPanel) {
    chatPanel.addEventListener("click", (e) => {
      if (e.target === chatPanel) {
        playUiClick();
        closeChat();
      }
    });
  }
  if (chatInput) {
    chatInput.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") {
        e.preventDefault();
        sendChat();
      } else if (e.key === "Escape") {
        e.preventDefault();
        closeChat();
      }
    });
  }

  if (moonCoopBtn) {
    moonCoopBtn.addEventListener("click", () => {
      playMoonCoopNow();
    });
  }
  if (craftCoopBtn) {
    craftCoopBtn.addEventListener("click", () => {
      playCraftCoopNow();
    });
  }
  if (sandboxSurvival) {
    sandboxSurvival.addEventListener("click", () => {
      playUiClick();
      startCraftWorld("survival");
    });
  }
  if (sandboxCreative) {
    sandboxCreative.addEventListener("click", () => {
      playUiClick();
      startCraftWorld("creative");
    });
  }
  if (loginMoonBtn) {
    loginMoonBtn.addEventListener("click", playMoonCoopNow);
  }

  logoutBtn.addEventListener("click", () => {
    playUiClick();
    stars = 0;
    inventory = { skipCard: 0, potion: 0, sword: 0, pickaxe: 0, bucket: 0 };
    maxCleared = 0;
    saveStars();
    saveInventory();
    saveCleared();
    playerName = "";
    homePeerReady = false;
    homeNotices = [];
    renderHomeNotices();
    starLabel.textContent = "0";
    levelLabel.textContent = "1";
    closeFriendCenter();
    closeGlobalChat();
    closeInboxPanel();
    closeChatUserFlow();
    friendReqQueue = [];
    inviteQueue = [];
    friendReqCurrent = null;
    inviteCurrent = null;
    if (friendReqDialog) {
      friendReqDialog.classList.add("hidden");
      friendReqDialog.setAttribute("aria-hidden", "true");
    }
    if (inviteDialog) {
      inviteDialog.classList.add("hidden");
      inviteDialog.setAttribute("aria-hidden", "true");
    }
    socialOpen = false;
    if (window.LevelCoop) LevelCoop.leave();
    openLoginScreen();
  });

  if (friendsBtn) {
    friendsBtn.addEventListener("click", openFriendCenter);
  }
  if (globalChatBtn) {
    globalChatBtn.addEventListener("click", openGlobalChat);
  }
  if (globalChatClose) {
    globalChatClose.addEventListener("click", () => {
      playUiClick();
      closeGlobalChat();
    });
  }
  if (globalChatPanel) {
    globalChatPanel.addEventListener("click", (e) => {
      if (e.target === globalChatPanel) {
        playUiClick();
        closeGlobalChat();
      }
    });
  }
  if (globalChatSend) {
    globalChatSend.addEventListener("click", sendGlobalChat);
  }
  if (inboxClose) {
    inboxClose.addEventListener("click", () => {
      playUiClick();
      closeInboxPanel();
    });
  }
  if (inboxClear) {
    inboxClear.addEventListener("click", () => {
      if (!isOwner()) return;
      playUiClick();
      inboxReports = [];
      inboxUnread = 0;
      saveInboxReports();
      renderInboxList();
      syncInboxBtn();
    });
  }
  if (inboxPanel) {
    inboxPanel.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-mod]");
      if (btn) {
        const wrap = btn.closest(".inbox-mod");
        if (!wrap) return;
        sendModAction(btn.dataset.mod, wrap.dataset.id, wrap.dataset.name, Number(btn.dataset.mins) || 0);
        return;
      }
      if (e.target === inboxPanel) {
        playUiClick();
        closeInboxPanel();
      }
    });
  }
  if (globalChatInput) {
    globalChatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        sendGlobalChat();
      }
    });
  }
  if (globalChatLogEl) {
    globalChatLogEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".gchat-name");
      if (!btn) return;
      e.preventDefault();
      playUiClick();
      showChatUserDialog(btn.dataset.id, btn.dataset.name);
    });
  }
  if (chatUserFriend) {
    chatUserFriend.addEventListener("click", () => {
      const target = chatUserTarget;
      if (!target) return;
      playUiClick();
      hideChatUserDialog();
      requestFriend(target);
    });
  }
  if (chatUserReport) {
    chatUserReport.addEventListener("click", () => {
      playUiClick();
      showReportDialog();
    });
  }
  if (chatUserCancel) {
    chatUserCancel.addEventListener("click", () => {
      playUiClick();
      closeChatUserFlow();
    });
  }
  if (chatUserDialog) {
    chatUserDialog.addEventListener("click", (e) => {
      if (e.target === chatUserDialog) {
        playUiClick();
        closeChatUserFlow();
      }
    });
  }
  if (reportDialog) {
    reportDialog.addEventListener("click", (e) => {
      const reasonBtn = e.target.closest(".report-reason");
      if (reasonBtn) {
        playUiClick();
        submitReport(reasonBtn.dataset.reason);
        return;
      }
      if (e.target === reportDialog) {
        playUiClick();
        hideReportDialog();
        if (chatUserTarget) showChatUserDialog(chatUserTarget.id, chatUserTarget.name);
      }
    });
  }
  if (reportCancel) {
    reportCancel.addEventListener("click", () => {
      playUiClick();
      hideReportDialog();
      if (chatUserTarget) showChatUserDialog(chatUserTarget.id, chatUserTarget.name);
    });
  }
  if (friendsClose) {
    friendsClose.addEventListener("click", () => {
      playUiClick();
      closeFriendCenter();
    });
  }
  if (friendCenter) {
    friendCenter.addEventListener("click", (e) => {
      if (e.target === friendCenter) {
        playUiClick();
        closeFriendCenter();
      }
    });
  }
  if (friendListEl) {
    friendListEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".friend-item");
      if (!btn) return;
      playUiClick();
      selectFriend(btn.dataset.id);
    });
  }
  if (friendChatSend) {
    friendChatSend.addEventListener("click", sendFriendChat);
  }
  if (friendChatInput) {
    friendChatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendFriendChat();
      }
    });
  }
  if (friendInviteBtn) {
    friendInviteBtn.addEventListener("click", sendFriendInvite);
  }
  if (friendReqYes) {
    friendReqYes.addEventListener("click", () => answerFriendReq(true));
  }
  if (friendReqNo) {
    friendReqNo.addEventListener("click", () => answerFriendReq(false));
  }
  if (inviteYes) {
    inviteYes.addEventListener("click", () => answerInvite(true));
  }
  if (inviteNo) {
    inviteNo.addEventListener("click", () => answerInvite(false));
  }

  if (unlockSkipBtn) {
    unlockSkipBtn.addEventListener("click", () => {
      playUiClick();
      skipPreviousAndEnter();
    });
  }
  if (unlockCancelBtn) {
    unlockCancelBtn.addEventListener("click", () => {
      playUiClick();
      hideUnlockDialog();
    });
  }
  if (unlockDialog) {
    unlockDialog.addEventListener("click", (e) => {
      if (e.target === unlockDialog) {
        playUiClick();
        hideUnlockDialog();
      }
    });
  }
  if (portraitDecline) {
    portraitDecline.addEventListener("click", () => {
      playUiClick();
      try {
        sessionStorage.setItem(PORTRAIT_PROMPT_KEY, "1");
      } catch {
        /* ignore */
      }
      hidePortraitPrompt();
    });
  }
  if (portraitAccept) {
    portraitAccept.addEventListener("click", () => {
      playUiClick();
      requestLandscapePlay();
    });
  }

  loginSubmit.addEventListener("click", () => {
    playUiClick();
    submitLogin();
  });
  smsBtn.addEventListener("click", () => {
    playUiClick();
    sendSmsCode();
  });
  minorOk.addEventListener("click", () => {
    playUiClick();
    minorNotice.classList.add("hidden");
    loginSubmit.classList.remove("hidden");
    loginIdcard.value = "";
    showLoginError("未成年人仅可在周五至周日 20:00–21:00 游玩");
  });
  for (const tab of loginTabs) {
    tab.addEventListener("click", () => {
      playUiClick();
      setLoginMode(tab.dataset.mode);
    });
  }
  loginPass.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      submitLogin();
    }
  });
  loginUser.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      loginPass.focus();
    }
  });
  loginSms.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      submitLogin();
    }
  });
  loginPhone.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      loginSms.focus();
    }
  });
  loginIdcard.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      submitLogin();
    }
  });

  window.addEventListener("blur", () => clearInput());
  const onViewportChange = () => {
    syncViewport();
    syncTouchPad();
  };
  window.addEventListener("resize", onViewportChange);
  window.addEventListener("orientationchange", () => {
    onViewportChange();
    setTimeout(onViewportChange, 250);
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", onViewportChange);
  }
  if (screen.orientation && screen.orientation.addEventListener) {
    screen.orientation.addEventListener("change", onViewportChange);
  }
  try {
    const portraitMq = window.matchMedia("(orientation: portrait)");
    if (portraitMq.addEventListener) {
      portraitMq.addEventListener("change", onViewportChange);
    } else if (portraitMq.addListener) {
      portraitMq.addListener(onViewportChange);
    }
  } catch {
    /* ignore */
  }

  // Unlock audio on first interaction (needed on mobile)
  const unlockOnce = () => {
    if (window.GameAudio) GameAudio.unlock();
  };
  window.addEventListener("pointerdown", unlockOnce, { once: true });
  window.addEventListener("keydown", unlockOnce, { once: true });

  // Prep first level visuals; login is required before playing
  setupPuzzleDrag();
  setupTouchControls();
  loadSettings();
  loadProgress();
  loadFriends();
  loadGlobalChat();
  clearOldOwnerMarks();
  loadInboxReports();
  fillInviteLevels();
  syncFriendsBtn();
  syncGlobalChatBtn();
  syncInboxBtn();
  const gameTitle = document.querySelector(".top h1");
  if (gameTitle) {
    let titleClicks = 0;
    let titleClickTimer = 0;
    gameTitle.addEventListener("click", () => {
      window.clearTimeout(titleClickTimer);
      titleClicks += 1;
      titleClickTimer = window.setTimeout(() => {
        titleClicks = 0;
      }, 2500);
      if (titleClicks < 10) return;
      titleClicks = 0;
      const pass = window.prompt("管理口令");
      if (pass === OWNER_UNLOCK) {
        markOwner();
        syncInboxBtn();
      }
    });
  }
  syncViewport();
  makeLevel(1);
  levelLabel.textContent = "1";
  starLabel.textContent = String(stars);
  statusLabel.textContent = "登录";
  syncPuzzleTools();
  syncHomeBtn();
  setLoginMode("account");
  if (isBanned()) {
    showBanScreen("你被封号了");
  } else if (!preferTouchControls()) {
    setTimeout(() => loginUser.focus(), 50);
  }
  requestAnimationFrame(loop);
})();
