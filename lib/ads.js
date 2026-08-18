// 假广告播放
window.installGameAds = function (S) {
  with (S) {
  function pickRandomAd() {
    return ADS[Math.floor(Math.random() * ADS.length)];
  }

  function themeColors(theme) {
    if (theme === "soda") return { a: "#123048", b: "#1a6088", text: "#9ef0ff", accent: "#ffe08a" };
    if (theme === "food") return { a: "#4a1808", b: "#8a3010", text: "#ffb070", accent: "#ffe07a" };
    if (theme === "game") return { a: "#201038", b: "#5030a0", text: "#e0b0ff", accent: "#ffd24a" };
    return { a: "#103020", b: "#206040", text: "#a8ffc0", accent: "#ffe07a" };
  }

  function drawAdVideoFrame(t) {
    if (!adDrawCtx || !adCurrent || !adCanvas) return;
    const w = adCanvas.width;
    const h = adCanvas.height;
    const c = adDrawCtx;
    const colors = themeColors(adCurrent.theme);
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, colors.a);
    g.addColorStop(0.55, "#0a0604");
    g.addColorStop(1, colors.b);
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);

    // Moving light sweep
    const sweep = ((t * 0.35) % 1) * (w + 200) - 100;
    const lg = c.createLinearGradient(sweep, 0, sweep + 180, 0);
    lg.addColorStop(0, "rgba(255,255,255,0)");
    lg.addColorStop(0.5, "rgba(255,255,255,0.12)");
    lg.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = lg;
    c.fillRect(0, 0, w, h);

    // Theme particles
    for (let i = 0; i < 18; i++) {
      const px = ((i * 97 + t * (40 + i * 3)) % (w + 40)) - 20;
      const py = (i * 53 + Math.sin(t * 2 + i) * 30 + h * 0.35) % h;
      c.fillStyle =
        adCurrent.theme === "soda"
          ? "rgba(160, 230, 255, 0.45)"
          : adCurrent.theme === "food"
            ? "rgba(255, 140, 60, 0.4)"
            : adCurrent.theme === "game"
              ? "rgba(200, 140, 255, 0.4)"
              : "rgba(140, 255, 180, 0.4)";
      c.beginPath();
      c.arc(px, py, 3 + (i % 4), 0, Math.PI * 2);
      c.fill();
    }

    // Brand mark
    const bounce = Math.sin(t * 4) * 8;
    c.fillStyle = colors.text;
    c.font = "bold 54px 'Noto Sans SC', sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.shadowColor = colors.accent;
    c.shadowBlur = 18;
    c.fillText(adCurrent.mark, w / 2, h * 0.34 + bounce);
    c.shadowBlur = 0;

    // Title
    c.fillStyle = colors.accent;
    c.font = "bold 28px 'Noto Sans SC', sans-serif";
    c.fillText(adCurrent.title, w / 2, h * 0.58);

    // Scrolling desc
    c.save();
    c.beginPath();
    c.rect(40, h * 0.68, w - 80, 36);
    c.clip();
    c.fillStyle = "rgba(255, 243, 230, 0.9)";
    c.font = "18px 'Noto Sans SC', sans-serif";
    const scrollX = w - ((t * 90) % (w + c.measureText(adCurrent.desc).width + 80));
    c.textAlign = "left";
    c.fillText(adCurrent.desc, scrollX, h * 0.68 + 24);
    c.restore();

    // Fake player chrome
    c.fillStyle = "rgba(0,0,0,0.45)";
    c.fillRect(0, h - 28, w, 28);
    c.fillStyle = "#ffd24a";
    c.font = "12px 'Noto Sans SC', sans-serif";
    c.textAlign = "left";
    c.fillText("▶ 视频广告播放中", 12, h - 10);
    const left = Math.max(0, Math.ceil((adEndsAt - Date.now()) / 1000));
    c.textAlign = "right";
    c.fillText(`${left}s`, w - 12, h - 10);
    c.fillStyle = "rgba(255, 210, 74, 0.85)";
    c.fillRect(0, h - 3, w * (1 - left / AD_DURATION), 3);
  }

  function loopAdVideo() {
    if (!adOpen) return;
    const t = (performance.now() - adStartPerf) / 1000;
    drawAdVideoFrame(t);
    adAnimId = requestAnimationFrame(loopAdVideo);
  }

  function stopAdVoice() {
    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    } catch (_) {
      /* ignore */
    }
  }

  function playAdVoice(ad) {
    stopAdVoice();
    if (!window.speechSynthesis || volumePct <= 0) return;
    try {
      const u = new SpeechSynthesisUtterance(`${ad.title}。${ad.desc}。现在下单更划算。`);
      u.lang = "zh-CN";
      u.rate = 1.05;
      u.pitch = 1.05;
      u.volume = Math.max(0, Math.min(1, volumePct / 100));
      window.speechSynthesis.speak(u);
    } catch (_) {
      /* ignore */
    }
  }

  function stopAdMedia() {
    if (adAnimId) {
      cancelAnimationFrame(adAnimId);
      adAnimId = 0;
    }
    stopAdVoice();
    if (window.GameAudio) GameAudio.stopAdBed();
    if (adVideo) {
      try {
        adVideo.pause();
      } catch (_) {
        /* ignore */
      }
      adVideo.removeAttribute("src");
      adVideo.srcObject = null;
      try {
        adVideo.load();
      } catch (_) {
        /* ignore */
      }
    }
    adCurrent = null;
  }

  function startAdMedia(ad) {
    stopAdMedia();
    adCurrent = ad;
    adStartPerf = performance.now();

    if (!adCanvas) {
      adCanvas = document.createElement("canvas");
      adCanvas.width = 640;
      adCanvas.height = 360;
      adDrawCtx = adCanvas.getContext("2d");
    }

    let audioStream = null;
    if (window.GameAudio) {
      GameAudio.unlock();
      GameAudio.stopAllAmbience();
      audioStream = GameAudio.startAdBed(ad.theme, AD_DURATION);
    }

    const videoStream = adCanvas.captureStream(30);
    if (audioStream) {
      try {
        const tracks = audioStream.getAudioTracks();
        if (tracks[0]) videoStream.addTrack(tracks[0]);
      } catch (_) {
        /* some browsers reject mixed tracks; WebAudio still plays */
      }
    }

    if (adVideo) {
      adVideo.srcObject = videoStream;
      adVideo.muted = false;
      adVideo.volume = Math.max(0, Math.min(1, volumePct / 100));
      const playPromise = adVideo.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(() => {
          // If element autoplay-with-sound fails, keep picture; bed still via WebAudio
          adVideo.muted = true;
          adVideo.play().catch(() => {});
        });
      }
    }

    playAdVoice(ad);
    loopAdVideo();
  }

  function cancelAd(advance) {
    if (adTimerId) {
      clearInterval(adTimerId);
      adTimerId = null;
    }
    stopAdMedia();
    adOpen = false;
    adEndsAt = 0;
    if (adPanel) {
      adPanel.classList.add("hidden");
      adPanel.setAttribute("aria-hidden", "true");
    }
    if (adProgressBar) adProgressBar.style.width = "0%";
    const mode = adMode;
    const target = adTargetLevel;
    adMode = "level";
    adTargetLevel = 0;
    if (advance) {
      finishAdSuccess(mode, target);
    } else if (state === "playing" && !settingsOpen && !shopOpen) {
      statusLabel.textContent = "逃亡中";
    }
    syncTouchPad();
    syncItemBar();
  }

  function finishAdSuccess(mode, target) {
    if (mode === "unlock") {
      const n = target || 1;
      markLevelCleared(Math.max(1, n - 1));
      enterLevel(n);
      return;
    }
    finishSkipAd();
  }

  function closeAdEarly() {
    if (!adOpen) return;
    const mode = adMode;
    const target = adTargetLevel;
    cancelAd(false);
    if (mode === "unlock") {
      // Back to the previous level of the one you wanted to enter
      const prev = Math.max(1, (target || 2) - 1);
      if (isLevelUnlocked(prev)) {
        enterLevel(prev);
      } else {
        showLevelSelect();
        showUnlockDialog(prev);
      }
      return;
    }
    // In-level skip cancelled — stay on current level
    if (state === "playing") statusLabel.textContent = "已取消跳过";
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

  function tickAd() {
    if (!adOpen) return;
    const leftMs = Math.max(0, adEndsAt - Date.now());
    const leftSec = Math.ceil(leftMs / 1000);
    if (adCountdown) adCountdown.textContent = String(leftSec);
    const done = 1 - leftMs / (AD_DURATION * 1000);
    if (adProgressBar) {
      adProgressBar.style.width = `${clamp(done * 100, 0, 100)}%`;
    }
    if (leftMs <= 0) {
      cancelAd(true);
    }
  }

  function beginAdPlayback(mode, targetLevel, timerHint) {
    if (adOpen || !adPanel) return;
    closeSettings();
    closeShop();
    clearInput();
    adMode = mode;
    adTargetLevel = targetLevel || 0;
    const ad = pickRandomAd();
    adOpen = true;
    adEndsAt = Date.now() + AD_DURATION * 1000;
    if (adTitle) adTitle.textContent = ad.title;
    if (adDesc) adDesc.textContent = ad.desc;
    if (adCountdown) adCountdown.textContent = String(AD_DURATION);
    if (adTimerHint) adTimerHint.textContent = timerHint;
    if (adProgressBar) adProgressBar.style.width = "0%";
    adPanel.classList.remove("hidden");
    adPanel.setAttribute("aria-hidden", "false");
    statusLabel.textContent = "广告中";
    startAdMedia(ad);
    if (adTimerId) clearInterval(adTimerId);
    adTimerId = setInterval(tickAd, 200);
    tickAd();
    syncTouchPad();
    syncItemBar();
  }

  function startSkipAd() {
    if (state !== "playing" || adOpen) return;
    beginAdPlayback("level", 0, "观看完整广告后进入下一关");
  }

  function startUnlockSkipAd(targetLevel) {
    if (adOpen || !targetLevel) return;
    hideUnlockDialog();
    hideLevelSelect();
    beginAdPlayback("unlock", targetLevel, "观看完整广告后解锁并进入关卡");
  }

    S.pickRandomAd = pickRandomAd;
    S.themeColors = themeColors;
    S.drawAdVideoFrame = drawAdVideoFrame;
    S.loopAdVideo = loopAdVideo;
    S.stopAdVoice = stopAdVoice;
    S.playAdVoice = playAdVoice;
    S.stopAdMedia = stopAdMedia;
    S.startAdMedia = startAdMedia;
    S.cancelAd = cancelAd;
    S.finishAdSuccess = finishAdSuccess;
    S.closeAdEarly = closeAdEarly;
    S.finishSkipAd = finishSkipAd;
    S.tickAd = tickAd;
    S.beginAdPlayback = beginAdPlayback;
    S.startSkipAd = startSkipAd;
    S.startUnlockSkipAd = startUnlockSkipAd;
  }
};
