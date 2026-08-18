// 好友 / 全服聊天 / 举报 / 封禁
window.installGameSocial = function (S) {
  with (S) {
  function loadFriends() {
    const arr = loadJson("yyy_friends", []);
    friends = Array.isArray(arr)
      ? arr.filter((f) => f && f.id).map((f) => ({ id: String(f.id), name: String(f.name || "玩家") }))
      : [];
  }

  function saveFriends() {
    saveJson("yyy_friends", friends);
  }

  function isFriend(id) {
    return friends.some((f) => f.id === id);
  }

  function addFriend(id, name) {
    if (!id || id === localCoopId()) return;
    const label = String(name || "玩家").slice(0, 16) || "玩家";
    const i = friends.findIndex((f) => f.id === id);
    if (i >= 0) {
      if (label && label !== "玩家") friends[i].name = label;
    } else {
      friends.unshift({ id, name: label });
    }
    saveFriends();
    renderFriendList();
    syncFriendsBtn();
  }

  function friendChatKey(id) {
    return "yyy_fchat_" + id;
  }

  function loadFriendChat(id) {
    const arr = loadJson(friendChatKey(id), []);
    return Array.isArray(arr) ? arr.slice(-80) : [];
  }

  function saveFriendChat(id, logs) {
    saveJson(friendChatKey(id), (logs || []).slice(-80));
  }

  function appendFriendChat(id, from, text) {
    const line = String(text || "").trim().slice(0, 40);
    if (!id || !line) return;
    const logs = loadFriendChat(id);
    logs.push({ from, text: line, t: Date.now() });
    saveFriendChat(id, logs);
    if (selectedFriendId === id) renderFriendChat();
  }

  function sendSocial(msg) {
    if (!window.LevelCoop || typeof LevelCoop.sendSocial !== "function") return;
    LevelCoop.sendSocial(msg);
  }

  function socialToast(text) {
    const line = String(text || "").trim();
    if (!line) return;
    pushJoinNotice(line);
    if (!socialToastEl) return;
    socialToastEl.textContent = line;
    socialToastEl.classList.remove("hidden");
    window.clearTimeout(socialToastTimer);
    socialToastTimer = window.setTimeout(() => {
      socialToastEl.classList.add("hidden");
    }, 2800);
  }

  function unreadTotal() {
    return Object.values(friendUnread).reduce((sum, n) => sum + (Number(n) || 0), 0);
  }

  function syncFriendsBtn() {
    if (!friendsBtn) return;
    const n = unreadTotal();
    friendsBtn.textContent = n > 0 ? `好友中心（${n}）` : "好友中心";
  }

  function peerMap() {
    if (!window.LevelCoop || typeof LevelCoop.peerLevels !== "function") return {};
    try {
      return LevelCoop.peerLevels() || {};
    } catch {
      return {};
    }
  }

  function friendStatusText(id) {
    const peers = peerMap();
    if (!(id in peers)) return { text: "离线", on: false };
    const lv = Number(peers[id]) || 0;
    if (lv < 1) return { text: "在线 · 选关中", on: true };
    return { text: `在线 · 第${lv}关`, on: true };
  }

  function renderFriendList() {
    if (!friendListEl) return;
    if (!friends.length) {
      friendListEl.innerHTML = `<p class="chat-empty">还没有好友<br />点别人头顶的名字申请</p>`;
      return;
    }
    friendListEl.innerHTML = friends
      .map((f) => {
        const st = friendStatusText(f.id);
        const unread = Number(friendUnread[f.id]) || 0;
        const badge = unread > 0 ? `<i class="unread">${unread > 9 ? "9+" : unread}</i>` : "";
        const sel = f.id === selectedFriendId ? " selected" : "";
        return `<button type="button" class="friend-item${sel}" data-id="${escapeHtml(f.id)}"><strong>${escapeHtml(playerLabel(f.name))}${badge}</strong><span class="${st.on ? "on" : ""}">${escapeHtml(st.text)}</span></button>`;
      })
      .join("");
  }

  function renderFriendChat() {
    if (!friendChatLogEl) return;
    if (!selectedFriendId) {
      if (friendChatTitle) friendChatTitle.textContent = "选择一个好友";
      friendChatLogEl.innerHTML = `<p class="chat-empty">选择一个好友发消息或邀请一起玩</p>`;
      if (friendChatInput) friendChatInput.disabled = true;
      if (friendChatSend) friendChatSend.disabled = true;
      if (friendInviteLevel) friendInviteLevel.disabled = true;
      if (friendInviteBtn) friendInviteBtn.disabled = true;
      return;
    }
    const f = friends.find((x) => x.id === selectedFriendId);
    const name = playerLabel(f && f.name);
    if (friendChatTitle) friendChatTitle.textContent = `和 ${name} 聊天`;
    if (friendChatInput) friendChatInput.disabled = false;
    if (friendChatSend) friendChatSend.disabled = false;
    if (friendInviteLevel) friendInviteLevel.disabled = false;
    if (friendInviteBtn) friendInviteBtn.disabled = false;
    const logs = loadFriendChat(selectedFriendId);
    if (!logs.length) {
      friendChatLogEl.innerHTML = `<p class="chat-empty">还没有消息</p>`;
      return;
    }
    const me = localCoopId();
    friendChatLogEl.innerHTML = logs
      .map((m) => {
        const who = m.from === me || m.from === "me" ? "我" : name;
        return `<p><span>${escapeHtml(who)}</span>：${escapeHtml(m.text)}</p>`;
      })
      .join("");
    friendChatLogEl.scrollTop = friendChatLogEl.scrollHeight;
  }

  function selectFriend(id) {
    selectedFriendId = id || "";
    if (selectedFriendId) delete friendUnread[selectedFriendId];
    syncFriendsBtn();
    renderFriendList();
    renderFriendChat();
  }

  function fillInviteLevels() {
    if (!friendInviteLevel) return;
    friendInviteLevel.innerHTML = "";
    for (let i = 1; i <= MAX_PLAYABLE; i++) {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = `第 ${i} 关`;
      friendInviteLevel.appendChild(opt);
    }
  }

  function openFriendCenter() {
    if (!friendCenter) return;
    playUiClick();
    closeGlobalChat();
    closeInboxPanel();
    friendCenterOpen = true;
    renderFriendList();
    renderFriendChat();
    friendCenter.classList.remove("hidden");
    friendCenter.setAttribute("aria-hidden", "false");
  }

  function closeFriendCenter() {
    friendCenterOpen = false;
    if (!friendCenter) return;
    friendCenter.classList.add("hidden");
    friendCenter.setAttribute("aria-hidden", "true");
  }

  function loadGlobalChat() {
    const arr = loadJson("yyy_gchat", []);
    globalChat = Array.isArray(arr)
      ? arr
          .filter((m) => m && String(m.text || "").trim())
          .map((m) => ({
            id: m.id ? String(m.id) : "",
            name: String(m.name || "玩家"),
            text: String(m.text),
          }))
      : [];
  }

  function saveGlobalChat() {
    let arr = globalChat;
    while (arr.length) {
      try {
        localStorage.setItem("yyy_gchat", JSON.stringify(arr));
        return;
      } catch {
        if (arr.length <= 1) return;
        arr = arr.slice(Math.ceil(arr.length / 5));
      }
    }
  }

  function syncGlobalChatBtn() {
    if (!globalChatBtn) return;
    globalChatBtn.textContent =
      globalChatUnread > 0 ? `全游戏聊天（${globalChatUnread}）` : "全游戏聊天";
  }

  function renderGlobalChat() {
    if (!globalChatLogEl) return;
    if (!globalChat.length) {
      globalChatLogEl.innerHTML = `<p class="chat-empty">还没有全服消息</p>`;
      return;
    }
    const me = localCoopId();
    globalChatLogEl.innerHTML = globalChat
      .map((m) => {
        const label = escapeHtml(playerLabel(m.name));
        const nameHtml =
          m.id && m.id !== me
            ? `<button type="button" class="gchat-name" data-id="${escapeHtml(m.id)}" data-name="${escapeHtml(m.name)}">${label}</button>`
            : `<span>${label}</span>`;
        return `<p>${nameHtml}：${escapeHtml(m.text)}</p>`;
      })
      .join("");
    globalChatLogEl.scrollTop = globalChatLogEl.scrollHeight;
  }

  function appendGlobalChat(name, text, id) {
    const line = String(text || "").replace(/^\s+|\s+$/g, "");
    if (!line) return;
    globalChat.push({
      id: id ? String(id) : "",
      name: playerLabel(name),
      text: line,
    });
    saveGlobalChat();
    if (globalChatOpen) renderGlobalChat();
  }

  function openGlobalChat() {
    if (!globalChatPanel) return;
    playUiClick();
    closeFriendCenter();
    closeInboxPanel();
    globalChatOpen = true;
    globalChatUnread = 0;
    syncGlobalChatBtn();
    renderGlobalChat();
    globalChatPanel.classList.remove("hidden");
    globalChatPanel.setAttribute("aria-hidden", "false");
    if (globalChatInput) {
      setTimeout(() => globalChatInput.focus(), 30);
    }
  }

  function closeGlobalChat() {
    globalChatOpen = false;
    closeChatUserFlow();
    if (!globalChatPanel) return;
    globalChatPanel.classList.add("hidden");
    globalChatPanel.setAttribute("aria-hidden", "true");
    if (globalChatInput) globalChatInput.blur();
  }

  function sendGlobalChat() {
    if (!globalChatInput) return;
    if (blockIfMuted()) return;
    const text = (globalChatInput.value || "").replace(/^\s+|\s+$/g, "");
    if (!text) {
      globalChatInput.focus();
      return;
    }
    playUiClick();
    appendGlobalChat(myDisplayName(), text, localCoopId());
    sendSocial({ type: "gchat", text, name: myDisplayName() });
    globalChatInput.value = "";
    globalChatInput.focus();
    renderGlobalChat();
  }

  function hideChatUserDialog() {
    if (chatUserDialog) {
      chatUserDialog.classList.add("hidden");
      chatUserDialog.setAttribute("aria-hidden", "true");
    }
  }

  function hideReportDialog() {
    if (reportDialog) {
      reportDialog.classList.add("hidden");
      reportDialog.setAttribute("aria-hidden", "true");
    }
  }

  function closeChatUserFlow() {
    chatUserTarget = null;
    hideChatUserDialog();
    hideReportDialog();
  }

  function showChatUserDialog(id, name) {
    if (!id || id === localCoopId()) return;
    chatUserTarget = { id, name: name || "玩家" };
    hideReportDialog();
    if (chatUserMsg) {
      chatUserMsg.textContent = `要对「${playerLabel(chatUserTarget.name)}」做什么？`;
    }
    if (chatUserFriend) {
      chatUserFriend.textContent = isFriend(id) ? "已经是好友" : "加好友";
    }
    if (chatUserDialog) {
      chatUserDialog.classList.remove("hidden");
      chatUserDialog.setAttribute("aria-hidden", "false");
    }
  }

  function showReportDialog() {
    if (!chatUserTarget) return;
    hideChatUserDialog();
    if (reportMsg) {
      reportMsg.textContent = `举报「${playerLabel(chatUserTarget.name)}」，请选择原因`;
    }
    if (reportDialog) {
      reportDialog.classList.remove("hidden");
      reportDialog.setAttribute("aria-hidden", "false");
    }
  }

  function submitReport(reason) {
    const target = chatUserTarget;
    if (!target) return;
    const why = String(reason || "其他");
    const packed = {
      type: "reportlog",
      reporter: localCoopId(),
      reporterName: myDisplayName(),
      target: target.id,
      targetName: target.name,
      reason: why,
      at: Date.now(),
    };
    sendSocial(packed);
    if (isOwner()) addInboxReport({ id: localCoopId(), ...packed });
    closeChatUserFlow();
    socialToast(`已举报${playerLabel(target.name)}（${why}）`);
  }

  const OWNER_STORE = "yyy_owner_v2";
  const OWNER_TOKEN = "inbox-v2-yty";
  const OWNER_UNLOCK = "tianyu18";

  function clearOldOwnerMarks() {
    try {
      localStorage.removeItem("yyy_mod");
    } catch {
      /* ignore */
    }
    try {
      document.cookie = "yyy_mod=; Path=/; Max-Age=0";
    } catch {
      /* ignore */
    }
  }

  function markOwner() {
    try {
      localStorage.setItem(OWNER_STORE, OWNER_TOKEN);
    } catch {
      /* ignore */
    }
    clearOldOwnerMarks();
  }

  function isOwner() {
    try {
      const box = new URLSearchParams(location.search).get("box");
      if (box === OWNER_UNLOCK) {
        markOwner();
        try {
          const u = new URL(location.href);
          u.searchParams.delete("box");
          history.replaceState(null, "", u.href);
        } catch {
          /* ignore */
        }
        return true;
      }
      return localStorage.getItem(OWNER_STORE) === OWNER_TOKEN;
    } catch {
      return false;
    }
  }

  function loadInboxReports() {
    if (!isOwner()) {
      inboxReports = [];
      return;
    }
    const arr = loadJson("yyy_inbox_reports", []);
    inboxReports = Array.isArray(arr) ? arr.filter((r) => r && r.reason) : [];
  }

  function saveInboxReports() {
    if (!isOwner()) return;
    saveJson("yyy_inbox_reports", inboxReports.slice(-300));
  }

  function formatReportTime(t) {
    const d = new Date(Number(t) || Date.now());
    if (Number.isNaN(d.getTime())) return "";
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  function syncInboxBtn() {
    if (!isOwner()) {
      if (inboxBtn) {
        inboxBtn.remove();
        inboxBtn = null;
      }
      closeInboxPanel();
      return;
    }
    if (!inboxBtn) {
      inboxBtn = document.createElement("button");
      inboxBtn.id = "inbox-btn";
      inboxBtn.type = "button";
      inboxBtn.textContent = "举报内容";
      if (logoutBtn && logoutBtn.parentNode) {
        logoutBtn.parentNode.insertBefore(inboxBtn, logoutBtn);
      }
      inboxBtn.addEventListener("click", openInboxPanel);
    }
    inboxBtn.hidden = false;
    inboxBtn.classList.remove("hidden");
    inboxBtn.setAttribute("aria-hidden", "false");
    inboxBtn.textContent = inboxUnread > 0 ? `举报内容（${inboxUnread}）` : "举报内容";
  }

  function renderInboxList() {
    if (!inboxListEl) return;
    if (!inboxReports.length) {
      inboxListEl.innerHTML = `<p class="chat-empty">还没有举报</p>`;
      return;
    }
    inboxListEl.innerHTML = inboxReports
      .slice()
      .reverse()
      .map((r) => {
        const who = escapeHtml(playerLabel(r.reporterName));
        const target = escapeHtml(playerLabel(r.targetName));
        const why = escapeHtml(r.reason || "其他");
        const when = escapeHtml(formatReportTime(r.at));
        const rows = [];
        if (r.target) rows.push(modButtons(r.target, r.targetName));
        if (r.reporter && r.reporter !== r.target) rows.push(modButtons(r.reporter, r.reporterName));
        return `<div class="inbox-item"><p>举报者：<strong>${who}</strong></p><p>被举报者：<strong>${target}</strong></p><p>举报内容：<strong>${why}</strong></p><p class="inbox-time">${when}</p>${rows.join("")}</div>`;
      })
      .join("");
  }

  function addInboxReport(msg) {
    if (!isOwner() || !msg) return;
    const row = {
      rid: String(msg.rid || `${msg.id || msg.reporter || ""}-${msg.target || ""}-${msg.at || Date.now()}`),
      reporter: String(msg.reporter || msg.id || ""),
      reporterName: String(msg.reporterName || msg.name || "玩家"),
      target: String(msg.target || ""),
      targetName: String(msg.targetName || "玩家"),
      reason: String(msg.reason || "其他"),
      at: Number(msg.at) || Date.now(),
    };
    if (inboxReports.some((r) => r.rid === row.rid)) return;
    inboxReports.push(row);
    if (inboxReports.length > 300) inboxReports = inboxReports.slice(-300);
    saveInboxReports();
    if (inboxOpen) renderInboxList();
    else {
      inboxUnread += 1;
      syncInboxBtn();
      socialToast(`新举报：${playerLabel(row.reporterName)} 举报 ${playerLabel(row.targetName)}`);
    }
  }

  function openInboxPanel() {
    if (!isOwner() || !inboxPanel) return;
    playUiClick();
    closeFriendCenter();
    closeGlobalChat();
    inboxOpen = true;
    inboxUnread = 0;
    syncInboxBtn();
    renderInboxList();
    inboxPanel.classList.remove("hidden");
    inboxPanel.setAttribute("aria-hidden", "false");
  }

  function closeInboxPanel() {
    inboxOpen = false;
    if (!inboxPanel) return;
    inboxPanel.classList.add("hidden");
    inboxPanel.setAttribute("aria-hidden", "true");
  }

  function modButtons(id, name) {
    if (!id) return "";
    return `<div class="inbox-mod" data-id="${escapeHtml(id)}" data-name="${escapeHtml(name || "玩家")}">
      <p>处理「${escapeHtml(playerLabel(name))}」</p>
      <div class="inbox-mod-row">
        <button type="button" data-mod="ban" data-mins="1">封号1分钟</button>
        <button type="button" data-mod="ban" data-mins="10">封号10分钟</button>
        <button type="button" data-mod="mute">禁言</button>
        <button type="button" data-mod="unmute">解除禁言</button>
        <button type="button" data-mod="kick">退出登录</button>
      </div>
    </div>`;
  }

  function banUntil() {
    try {
      return Number(localStorage.getItem("yyy_ban_until") || 0);
    } catch {
      return 0;
    }
  }

  function isBanned() {
    if (isOwner()) return false;
    return Date.now() < banUntil();
  }

  function isMuted() {
    if (isOwner()) return false;
    try {
      return localStorage.getItem("yyy_mute") === "1";
    } catch {
      return false;
    }
  }

  function setMuted(on) {
    try {
      if (on) localStorage.setItem("yyy_mute", "1");
      else localStorage.removeItem("yyy_mute");
    } catch {
      /* ignore */
    }
  }

  function hideBanScreen() {
    if (banTimerId) {
      window.clearInterval(banTimerId);
      banTimerId = 0;
    }
    if (!banScreen) return;
    banScreen.classList.add("hidden");
    banScreen.setAttribute("aria-hidden", "true");
  }

  function tickBanScreen() {
    const left = Math.max(0, Math.ceil((banUntil() - Date.now()) / 1000));
    if (banLeft) banLeft.textContent = String(left);
    if (left <= 0) {
      try {
        localStorage.removeItem("yyy_ban_until");
      } catch {
        /* ignore */
      }
      hideBanScreen();
      openLoginScreen();
      showLoginError("封号已结束，可以重新登录");
    }
  }

  function showBanScreen(reason) {
    closeFriendCenter();
    closeGlobalChat();
    closeInboxPanel();
    closeChatUserFlow();
    hideOverlay();
    hideLevelSelect();
    closeLoginScreen();
    stopLevelCoop();
    if (window.LevelCoop) {
      try {
        LevelCoop.leave();
      } catch {
        /* ignore */
      }
    }
    loggedIn = false;
    playerName = "";
    state = "login";
    statusLabel.textContent = "封号";
    if (banMsg) banMsg.textContent = reason || "你被封号了";
    if (banScreen) {
      banScreen.classList.remove("hidden");
      banScreen.setAttribute("aria-hidden", "false");
    }
    tickBanScreen();
    if (!banTimerId) banTimerId = window.setInterval(tickBanScreen, 400);
    syncPuzzleTools();
    syncHomeBtn();
  }

  function forceLogout(reason) {
    hideBanScreen();
    closeFriendCenter();
    closeGlobalChat();
    closeInboxPanel();
    closeChatUserFlow();
    stopLevelCoop();
    if (window.LevelCoop) {
      try {
        LevelCoop.leave();
      } catch {
        /* ignore */
      }
    }
    playerName = "";
    loggedIn = false;
    openLoginScreen();
    showLoginError(reason || "你已被要求退出登录");
  }

  function sendModAction(action, id, name, mins) {
    if (!isOwner() || !id) return;
    playUiClick();
    const packed = {
      type: "mod",
      to: id,
      action,
      mins: Number(mins) || 0,
      name: myDisplayName(),
    };
    sendSocial(packed);
    const who = playerLabel(name);
    if (action === "ban") socialToast(`已封号 ${who} ${packed.mins || 1} 分钟`);
    else if (action === "mute") socialToast(`已禁言 ${who}`);
    else if (action === "unmute") socialToast(`已解除 ${who} 的禁言`);
    else if (action === "kick") socialToast(`已让 ${who} 退出登录`);
  }

  function applyModAction(msg) {
    if (!msg || isOwner()) return;
    const act = msg.action;
    if (act === "ban") {
      const mins = Math.max(1, Number(msg.mins) || 1);
      const until = Date.now() + mins * 60 * 1000;
      try {
        localStorage.setItem("yyy_ban_until", String(until));
      } catch {
        /* ignore */
      }
      showBanScreen(`你被封号 ${mins} 分钟`);
      return;
    }
    if (act === "mute") {
      setMuted(true);
      closeChat();
      closeGlobalChat();
      socialToast("你已被禁言，不能发消息");
      return;
    }
    if (act === "unmute") {
      setMuted(false);
      socialToast("禁言已解除");
      return;
    }
    if (act === "kick") {
      forceLogout("你已被要求退出登录");
    }
  }

  function blockIfMuted() {
    if (!isMuted()) return false;
    socialToast("你已被禁言，不能发消息");
    return true;
  }

  function blockIfBanned() {
    if (!isBanned()) return false;
    showBanScreen("你被封号了");
    return true;
  }

  function syncSocialPause() {
    socialOpen = !!(friendReqCurrent || inviteCurrent);
    syncTouchPad();
    syncItemBar();
  }

  function showFriendReq(msg) {
    if (!msg || !msg.id) return;
    if (friendReqCurrent) {
      if (!friendReqQueue.some((q) => q.id === msg.id) && friendReqCurrent.id !== msg.id) {
        friendReqQueue.push(msg);
      }
      return;
    }
    friendReqCurrent = msg;
    if (friendReqMsg) {
      friendReqMsg.textContent = `${playerLabel(msg.name)}想和你成为好友`;
    }
    if (friendReqDialog) {
      friendReqDialog.classList.remove("hidden");
      friendReqDialog.setAttribute("aria-hidden", "false");
    }
    syncSocialPause();
  }

  function hideFriendReq() {
    friendReqCurrent = null;
    if (friendReqDialog) {
      friendReqDialog.classList.add("hidden");
      friendReqDialog.setAttribute("aria-hidden", "true");
    }
    syncSocialPause();
    if (friendReqQueue.length) showFriendReq(friendReqQueue.shift());
  }

  function answerFriendReq(ok) {
    const msg = friendReqCurrent;
    if (!msg) return;
    playUiClick();
    if (ok) {
      addFriend(msg.id, msg.name);
      sendSocial({ type: "friendok", to: msg.id, name: myDisplayName() });
      socialToast(`你和${playerLabel(msg.name)}成为了好友`);
    } else {
      sendSocial({ type: "friendno", to: msg.id, name: myDisplayName() });
    }
    hideFriendReq();
  }

  function showInvite(msg) {
    if (!msg || !msg.id) return;
    if (inviteCurrent) {
      if (!inviteQueue.some((q) => q.id === msg.id && q.lv === msg.lv)) inviteQueue.push(msg);
      return;
    }
    inviteCurrent = msg;
    const lv = Math.max(1, Math.floor(Number(msg.lv) || 1));
    if (inviteMsg) {
      inviteMsg.textContent = `${playerLabel(msg.name)}邀请你一起玩第 ${lv} 关`;
    }
    if (inviteDialog) {
      inviteDialog.classList.remove("hidden");
      inviteDialog.setAttribute("aria-hidden", "false");
    }
    syncSocialPause();
  }

  function hideInvite() {
    inviteCurrent = null;
    if (inviteDialog) {
      inviteDialog.classList.add("hidden");
      inviteDialog.setAttribute("aria-hidden", "true");
    }
    syncSocialPause();
    if (inviteQueue.length) showInvite(inviteQueue.shift());
  }

  function joinInvitedLevel(n) {
    if (blockIfBanned()) return;
    const lv = Math.max(1, Math.min(MAX_PLAYABLE, Math.floor(Number(n) || 1)));
    closeFriendCenter();
    hideUnlockDialog();
    if (!playerName) playerName = "玩家";
    loggedIn = true;
    closeLoginScreen();
    enterLevel(lv);
  }

  function answerInvite(ok) {
    const msg = inviteCurrent;
    if (!msg) return;
    playUiClick();
    const lv = Math.max(1, Math.min(MAX_PLAYABLE, Math.floor(Number(msg.lv) || 1)));
    if (ok) {
      sendSocial({ type: "inviteok", to: msg.id, lv, name: myDisplayName() });
      hideInvite();
      joinInvitedLevel(lv);
      return;
    }
    sendSocial({ type: "inviteno", to: msg.id, lv, name: myDisplayName() });
    hideInvite();
  }

  function requestFriend(rp) {
    if (!rp || !rp.id) return;
    if (rp.id === localCoopId()) return;
    if (isFriend(rp.id)) {
      socialToast("已经是好友了，去主页好友中心发消息");
      return;
    }
    const now = Date.now();
    if (pendingFriend[rp.id] && now - pendingFriend[rp.id] < 8000) {
      socialToast("已经发过申请了，等对方回应");
      return;
    }
    pendingFriend[rp.id] = now;
    sendSocial({ type: "friendreq", to: rp.id, name: myDisplayName() });
    socialToast(`已向${playerLabel(rp.name)}发送好友申请`);
  }

  function sendFriendChat() {
    if (!selectedFriendId || !friendChatInput) return;
    if (blockIfMuted()) return;
    const text = (friendChatInput.value || "").trim().slice(0, 40);
    if (!text) return;
    playUiClick();
    appendFriendChat(selectedFriendId, "me", text);
    sendSocial({ type: "dm", to: selectedFriendId, text, name: myDisplayName() });
    friendChatInput.value = "";
    renderFriendChat();
  }

  function sendFriendInvite() {
    if (!selectedFriendId || !friendInviteLevel) return;
    const lv = Math.max(1, Math.min(MAX_PLAYABLE, Number(friendInviteLevel.value) || 1));
    playUiClick();
    sendSocial({ type: "invite", to: selectedFriendId, lv, name: myDisplayName() });
    socialToast(`已邀请一起玩第 ${lv} 关`);
  }

  function handleSocial(msg) {
    if (!msg || !msg.id || msg.id === localCoopId()) return;
    const type = msg.type;
    if (type === "mod") {
      applyModAction(msg);
      return;
    }
    if (type === "reportlog") {
      if (!isOwner()) return;
      addInboxReport(msg);
      return;
    }
    if (type === "gchat") {
      const text = String(msg.text || "").replace(/^\s+|\s+$/g, "");
      if (!text) return;
      appendGlobalChat(playerLabel(msg.name), text, msg.id);
      if (!globalChatOpen) {
        globalChatUnread += 1;
        syncGlobalChatBtn();
        const preview = text.replace(/\s+/g, " ").slice(0, 40);
        socialToast(`全服「${playerLabel(msg.name)}」：${preview}`);
      }
      return;
    }
    if (type === "friendreq") {
      if (isFriend(msg.id) || pendingFriend[msg.id]) {
        addFriend(msg.id, msg.name);
        sendSocial({ type: "friendok", to: msg.id, name: myDisplayName() });
        delete pendingFriend[msg.id];
        socialToast(`你和${playerLabel(msg.name)}成为了好友`);
        return;
      }
      showFriendReq(msg);
      return;
    }
    if (type === "friendok") {
      addFriend(msg.id, msg.name);
      delete pendingFriend[msg.id];
      socialToast(`${playerLabel(msg.name)}同意了好友申请`);
      return;
    }
    if (type === "friendno") {
      delete pendingFriend[msg.id];
      socialToast(`${playerLabel(msg.name)}拒绝了好友申请`);
      return;
    }
    if (type === "dm") {
      if (!isFriend(msg.id)) return;
      const text = String(msg.text || "").trim().slice(0, 40);
      if (!text) return;
      addFriend(msg.id, msg.name);
      appendFriendChat(msg.id, msg.id, text);
      if (selectedFriendId !== msg.id || !friendCenterOpen) {
        friendUnread[msg.id] = (friendUnread[msg.id] || 0) + 1;
        syncFriendsBtn();
        renderFriendList();
      }
      socialToast(`${playerLabel(msg.name)}：${text}`);
      return;
    }
    if (type === "invite") {
      if (!isFriend(msg.id)) return;
      showInvite(msg);
      return;
    }
    if (type === "inviteok") {
      const lv = Math.max(1, Math.floor(Number(msg.lv) || 1));
      socialToast(`${playerLabel(msg.name)}同意了，一起去第 ${lv} 关`);
      if (state === "select" || state === "login") joinInvitedLevel(lv);
      return;
    }
    if (type === "inviteno") {
      socialToast(`${playerLabel(msg.name)}拒绝了一起玩`);
    }
  }

    S.loadFriends = loadFriends;
    S.saveFriends = saveFriends;
    S.isFriend = isFriend;
    S.addFriend = addFriend;
    S.friendChatKey = friendChatKey;
    S.loadFriendChat = loadFriendChat;
    S.saveFriendChat = saveFriendChat;
    S.appendFriendChat = appendFriendChat;
    S.sendSocial = sendSocial;
    S.socialToast = socialToast;
    S.unreadTotal = unreadTotal;
    S.syncFriendsBtn = syncFriendsBtn;
    S.peerMap = peerMap;
    S.friendStatusText = friendStatusText;
    S.renderFriendList = renderFriendList;
    S.renderFriendChat = renderFriendChat;
    S.selectFriend = selectFriend;
    S.fillInviteLevels = fillInviteLevels;
    S.openFriendCenter = openFriendCenter;
    S.closeFriendCenter = closeFriendCenter;
    S.loadGlobalChat = loadGlobalChat;
    S.saveGlobalChat = saveGlobalChat;
    S.syncGlobalChatBtn = syncGlobalChatBtn;
    S.renderGlobalChat = renderGlobalChat;
    S.appendGlobalChat = appendGlobalChat;
    S.openGlobalChat = openGlobalChat;
    S.closeGlobalChat = closeGlobalChat;
    S.sendGlobalChat = sendGlobalChat;
    S.hideChatUserDialog = hideChatUserDialog;
    S.hideReportDialog = hideReportDialog;
    S.closeChatUserFlow = closeChatUserFlow;
    S.showChatUserDialog = showChatUserDialog;
    S.showReportDialog = showReportDialog;
    S.submitReport = submitReport;
    S.clearOldOwnerMarks = clearOldOwnerMarks;
    S.markOwner = markOwner;
    S.isOwner = isOwner;
    S.loadInboxReports = loadInboxReports;
    S.saveInboxReports = saveInboxReports;
    S.formatReportTime = formatReportTime;
    S.syncInboxBtn = syncInboxBtn;
    S.renderInboxList = renderInboxList;
    S.addInboxReport = addInboxReport;
    S.openInboxPanel = openInboxPanel;
    S.closeInboxPanel = closeInboxPanel;
    S.modButtons = modButtons;
    S.banUntil = banUntil;
    S.isBanned = isBanned;
    S.isMuted = isMuted;
    S.setMuted = setMuted;
    S.hideBanScreen = hideBanScreen;
    S.tickBanScreen = tickBanScreen;
    S.showBanScreen = showBanScreen;
    S.forceLogout = forceLogout;
    S.sendModAction = sendModAction;
    S.applyModAction = applyModAction;
    S.blockIfMuted = blockIfMuted;
    S.blockIfBanned = blockIfBanned;
    S.syncSocialPause = syncSocialPause;
    S.showFriendReq = showFriendReq;
    S.hideFriendReq = hideFriendReq;
    S.answerFriendReq = answerFriendReq;
    S.showInvite = showInvite;
    S.hideInvite = hideInvite;
    S.joinInvitedLevel = joinInvitedLevel;
    S.answerInvite = answerInvite;
    S.requestFriend = requestFriend;
    S.sendFriendChat = sendFriendChat;
    S.sendFriendInvite = sendFriendInvite;
    S.handleSocial = handleSocial;
    S.OWNER_STORE = OWNER_STORE;
    S.OWNER_TOKEN = OWNER_TOKEN;
    S.OWNER_UNLOCK = OWNER_UNLOCK;
  }
};
