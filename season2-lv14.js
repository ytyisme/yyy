(() => {
  const $ = id => document.getElementById(id);
  const video = $("scene");
  const approachStart = 28, approachEnd = 44;
  let game = CatchBullet.create(), clip = null, generation = 0;
  let pointerHeld = false, moveKeys = new Set(), shotElapsed = 0;
  let seeking = false, playbackToken = 0, pendingSeek = null;
  const labels = { ready: "准备就绪", incoming: "子弹飞来！", catching: "接住子弹", approach: "靠近对手", near: "可以抢枪", grabbing: "抢枪中", armed: "点击任意处攻击", attacking: "反击！", won: "通关", missed: "没接住，再试一次" };

  function render(text) {
    $("phase").textContent = labels[game.phase];
    $("message").textContent = labels[game.phase];
    if (text) $("status").textContent = text;
    for (const [id, phase] of Object.entries({start:"ready", catch:"incoming", approach:"approach", grab:"near", attack:"armed"})) $(id).hidden = game.phase !== phase;
    $("distance").hidden = !["approach", "near"].includes(game.phase);
    $("distance-meter").value = game.distance;
    $("win").hidden = game.phase !== "won";
  }

  function wantsPlayback() {
    return !document.hidden && (clip !== null || (game.phase === "approach" && (pointerHeld || moveKeys.size > 0)));
  }
  function updatePlayback() {
    const token = ++playbackToken;
    if (seeking || !wantsPlayback()) { video.pause(); return; }
    if (game.phase === "approach" && video.currentTime < approachStart - .1) {
      seek(approachStart);
      return;
    }
    video.play().then(() => {
      if (token !== playbackToken && !wantsPlayback()) video.pause();
    }).catch(() => {
      if (token === playbackToken && wantsPlayback()) $("status").textContent = "动画未能播放，请点击场景重试。";
    });
  }
  function seek(time) {
    seeking = true;
    video.pause();
    pendingSeek = time;
    if (video.readyState > 0) video.currentTime = time;
  }
  video.addEventListener("seeked", () => {
    if (pendingSeek !== null && Math.abs(video.currentTime - pendingSeek) > .15) {video.currentTime = pendingSeek; return;}
    pendingSeek = null; seeking = false; updatePlayback();
  });
  function still(time) {
    clip = null;
    video.playbackRate = 1;
    seek(time);
  }
  function playClip(start, end, rate, done) {
    clip = {end, done, generation};
    video.playbackRate = rate;
    seek(start);
  }

  // The decoded video frame is the clock for player position and action completion.
  function onFrame(time) {
    if (seeking || video.seeking) return;
    if (game.phase === "approach") {
      game.syncApproach((time - approachStart) / (approachEnd - approachStart));
      render();
      if (game.phase === "near") {
        pointerHeld = false; moveKeys.clear(); video.pause();
        render("已经靠近！点击「抢枪」。");
      }
    }
    if (clip && time >= clip.end - .035) {
      const finished = clip;
      clip = null;
      video.pause();
      if (finished.generation === generation) finished.done();
    }
  }
  if (video.requestVideoFrameCallback) {
    const frame = (_, metadata) => { onFrame(metadata.mediaTime); video.requestVideoFrameCallback(frame); };
    video.requestVideoFrameCallback(frame);
  } else video.addEventListener("timeupdate", () => { if (video.readyState >= 2) onFrame(video.currentTime); });

  function flash() {
    $("flash").classList.remove("fire");
    void $("flash").offsetWidth;
    $("flash").classList.add("fire");
  }
  function start() {
    if (!game.start()) return;
    shotElapsed = 0;
    flash(); render("对手开枪了！点击「接住」。");
    $("bullet").hidden = false;
    $("bullet").style.transition = "none";
    $("bullet").style.left = "80%";
    playClip(20, 22, 1, () => {});
  }
  function catchBullet() {
    if (!game.catchBullet()) return;
    $("bullet").hidden = true;
    render("正在用屁股接住子弹……");
    playClip(22, 22.65, 1, () => {
      game.caught();
      clip = null; pointerHeld = false; moveKeys.clear();
      video.pause(); video.playbackRate = 3;
      seek(22.65);
      render("已接住 1 颗子弹，动画已暂停。按住「靠近」或 → / D 才继续。");
    });
  }
  function grab() {
    if (!game.grab()) return;
    pointerHeld = false; moveKeys.clear();
    render("抢过对手的枪，装到屁股上……");
    playClip(approachEnd, 54, 3, () => {
      game.armed(); clip = null; video.pause(); video.playbackRate = 1;
      render("枪已装好！点击任意处，立即反击。");
    });
  }
  function attack() {
    if (!game.attack()) return;
    flash(); render("发射！");
    // Continue from the displayed armed pose without jumping back to another shot.
    clip = {end:57, generation, done:() => {game.finish(); render("对手已被击败，第 14 关通关！");}};
    video.playbackRate = 1.8;
    updatePlayback();
  }
  function reset() {
    generation++; playbackToken++;
    pointerHeld = false; moveKeys.clear(); shotElapsed = 0;
    game = CatchBullet.create(); $("bullet").hidden = true;
    still(20); render("点击开始，对手会向你射击。");
  }
  $("start").addEventListener("click", start);
  $("catch").addEventListener("click", catchBullet);
  $("grab").addEventListener("click", grab);
  $("reset").addEventListener("click", e => { e.stopPropagation(); reset(); });
  $("approach").addEventListener("pointerdown", e => {
    e.preventDefault(); pointerHeld = true;
    $("approach").setPointerCapture(e.pointerId); updatePlayback();
  });
  function releasePointer() { pointerHeld = false; updatePlayback(); }
  ["pointerup", "pointercancel", "lostpointercapture"].forEach(event => $("approach").addEventListener(event, releasePointer));
  document.addEventListener("pointerup", releasePointer);
  document.addEventListener("click", e => {
    if (game.phase === "armed" && !e.target.closest("a,#reset")) attack();
    else if (e.target.closest("#arena") && wantsPlayback()) updatePlayback();
  });
  document.addEventListener("keydown", e => {
    if (["ArrowRight", "KeyD"].includes(e.code)) {
      e.preventDefault(); if (!moveKeys.has(e.code)) {moveKeys.add(e.code); updatePlayback();}
    }
    if (e.code === "Space" && !e.repeat) {
      e.preventDefault();
      if (game.phase === "incoming") catchBullet();
      else if (game.phase === "armed") attack();
    }
  });
  document.addEventListener("keyup", e => {
    if (moveKeys.delete(e.code)) updatePlayback();
  });
  function releaseAll() { pointerHeld = false; moveKeys.clear(); updatePlayback(); }
  window.addEventListener("blur", releaseAll);
  document.addEventListener("visibilitychange", () => {releaseAll();});
  window.addEventListener("pagehide", () => {clip = null; releaseAll(); video.pause();});

  // Bullet motion and its miss window pause with a hidden page or buffering video.
  let last = null;
  function tick(now) {
    const dt = last === null ? 0 : Math.min((now - last) / 1000, .05);
    last = now;
    if (game.phase === "incoming" && !document.hidden && !seeking && video.readyState >= 2) {
      shotElapsed += dt;
      $("bullet").style.left = `${80 - Math.min(1, shotElapsed / 5.5) * 65}%`;
      if (shotElapsed >= 5.5 && game.miss()) {
        $("bullet").hidden = true; clip = null; video.pause();
        render("没接住！点击重新开始，再试一次。");
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  video.addEventListener("error", () => {$("status").textContent = "场景无法加载，请刷新页面。";});
  video.addEventListener("loadedmetadata", () => {
    if (pendingSeek !== null) video.currentTime = pendingSeek;
    else if (game.phase === "ready") still(20);
  });
  render();
  $("start").disabled = true;
  $("status").textContent = "正在准备动画……";
  // A local blob supports precise seeking even when the server omits byte ranges.
  fetch(video.dataset.src).then(response => {
    if (!response.ok) throw new Error("Scene unavailable");
    return response.blob();
  }).then(blob => {
    video.src = URL.createObjectURL(blob);
    video.load();
  }).catch(() => {$("status").textContent = "动画加载失败，请刷新重试。";});
  video.addEventListener("loadedmetadata", () => {
    $("start").disabled = false;
    if (game.phase === "ready") $("status").textContent = "点击开始，对手会向你射击。";
  });
})();
