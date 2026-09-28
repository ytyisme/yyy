(() => {
  let ctx = null;
  let master = null;
  let unlocked = false;

  const loops = {
    lava: null,
    city: null,
    zombie: null,
    train: null,
  };

  let footTimer = 0;
  let zombieBarkTimer = 0;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.85;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") {
      try {
        const p = ctx.resume();
        if (p && p.catch) p.catch(() => {});
      } catch (e) {
        /* ignore */
      }
    }
    unlocked = true;
    return ctx;
  }

  function now() {
    return ctx ? ctx.currentTime : 0;
  }

  function envGain(duration, peak = 0.2, attack = 0.01) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now());
    g.gain.exponentialRampToValueAtTime(peak, now() + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, now() + duration);
    g.connect(master);
    return g;
  }

  function tone(type, freq, duration, peak = 0.15, slideTo = null) {
    if (!ensure()) return;
    const fire = () => {
      const o = ctx.createOscillator();
      const g = envGain(duration, peak);
      o.type = type;
      o.frequency.setValueAtTime(freq, now());
      if (slideTo != null) {
        o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now() + duration);
      }
      o.connect(g);
      o.start(now());
      o.stop(now() + duration + 0.02);
    };
    if (ctx.state === "running") {
      fire();
    } else {
      // 等 resume 后再响，避免被浏览器静音
      Promise.resolve(ctx.resume())
        .then(fire)
        .catch(fire);
    }
  }

  function noiseBurst(duration, peak = 0.12, filterFreq = 800, type = "bandpass") {
    if (!ensure()) return;
    const len = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = filterFreq;
    filter.Q.value = 0.8;
    const g = envGain(duration, peak, 0.005);
    src.connect(filter);
    filter.connect(g);
    src.start(now());
  }

  function playJump() {
    if (!ensure()) return;
    tone("square", 280, 0.12, 0.1, 520);
    noiseBurst(0.08, 0.06, 1200, "highpass");
  }

  function playFootstep() {
    if (!ensure()) return;
    noiseBurst(0.06, 0.16, 200, "lowpass");
    tone("triangle", 95, 0.06, 0.1);
  }

  /** 踩进水坑：清脆的水花声 */
  function playJellySquish() {
    if (!ensure()) return;
    const t = now();
    const rate = ctx.sampleRate;
    const len = Math.max(1, Math.floor(rate * 0.18));
    const buffer = ctx.createBuffer(1, len, rate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const p = i / len;
      const env = Math.exp(-p * 14) * (1 - p * 0.35);
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 600;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(2400, t);
    bp.frequency.exponentialRampToValueAtTime(900, t + 0.12);
    bp.Q.value = 0.85;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.36, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    src.connect(hp);
    hp.connect(bp);
    bp.connect(g);
    g.connect(master);
    src.start(t);

    // 水花二次溅起
    const len2 = Math.max(1, Math.floor(rate * 0.1));
    const buf2 = ctx.createBuffer(1, len2, rate);
    const d2 = buf2.getChannelData(0);
    for (let i = 0; i < len2; i++) {
      const p = i / len2;
      d2[i] = (Math.random() * 2 - 1) * Math.exp(-p * 20);
    }
    const s2 = ctx.createBufferSource();
    s2.buffer = buf2;
    const f2 = ctx.createBiquadFilter();
    f2.type = "highpass";
    f2.frequency.value = 1400;
    const g2 = ctx.createGain();
    const t2 = t + 0.035;
    g2.gain.setValueAtTime(0.0001, t2);
    g2.gain.exponentialRampToValueAtTime(0.18, t2 + 0.003);
    g2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.09);
    s2.connect(f2);
    f2.connect(g2);
    g2.connect(master);
    s2.start(t2);

    // 清脆的水珠叮一下
    tone("sine", 880 + Math.random() * 220, 0.06, 0.08, 420);
  }

  /** 奥利奥：大声沙沙碎屑声 */
  function playOreoCrunch() {
    if (!ensure()) return;
    const t = now();
    const rate = ctx.sampleRate;
    const sand = (start, dur, peak, freq) => {
      const len = Math.max(1, Math.floor(rate * dur));
      const buffer = ctx.createBuffer(1, len, rate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) {
        const p = i / len;
        // 颗粒感：稀疏尖刺噪声 = 沙沙
        const spike = (i % 3 === 0 ? 1 : i % 7 === 0 ? 0.7 : 0.15);
        data[i] = (Math.random() * 2 - 1) * spike * Math.exp(-p * 8);
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 1800;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = freq;
      bp.Q.value = 0.45;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(peak, start + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      src.connect(hp);
      hp.connect(bp);
      bp.connect(g);
      g.connect(master);
      src.start(start);
    };
    sand(t, 0.14, 0.55, 4500);
    sand(t + 0.03, 0.12, 0.4, 3200);
    sand(t + 0.06, 0.1, 0.28, 5500);
  }

  /** 巧克力裂开：更脆、更大声的咔嚓（冰不碎） */
  function playChocoCrack() {
    if (!ensure()) return;
    const t = now();
    const rate = ctx.sampleRate;
    const burst = (start, dur, peak, freq, q) => {
      const len = Math.max(1, Math.floor(rate * dur));
      const buffer = ctx.createBuffer(1, len, rate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) {
        const p = i / len;
        // 更尖的起音，脆裂感
        const snap = Math.exp(-p * 35) * (1 - p * 0.2);
        data[i] = (Math.random() * 2 - 1) * snap;
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 1200;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = freq;
      bp.Q.value = q;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(peak, start + 0.0015);
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      src.connect(hp);
      hp.connect(bp);
      bp.connect(g);
      g.connect(master);
      src.start(start);
    };
    burst(t, 0.055, 0.62, 3800, 1.4);
    burst(t + 0.018, 0.045, 0.48, 5200, 1.6);
    burst(t + 0.038, 0.06, 0.36, 2800, 1.2);
    burst(t + 0.06, 0.07, 0.28, 6500, 0.9);
    // 脆壳叮一声
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(980, t);
    o.frequency.exponentialRampToValueAtTime(320, t + 0.08);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + 0.1);
  }

  /** 电脑打字声：按下 + 回弹，像笔记本/机械键盘敲击 */
  function playKeyboardTap() {
    if (!ensure()) return;
    const t = now();
    const rate = ctx.sampleRate;
    const makeClick = (start, dur, peak, hiFreq, thock) => {
      const len = Math.max(1, Math.floor(rate * dur));
      const buffer = ctx.createBuffer(1, len, rate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) {
        const p = i / len;
        const env = Math.exp(-p * 18) * (1 - p);
        data[i] =
          (Math.random() * 2 - 1) * env * 0.85 +
          Math.sin(i * thock * 0.08) * env * 0.25;
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = hiFreq;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1800 + Math.random() * 900;
      bp.Q.value = 0.7;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(peak, start + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      src.connect(hp);
      hp.connect(bp);
      bp.connect(g);
      g.connect(master);
      src.start(start);
    };

    // 按下（明显更大）
    makeClick(t, 0.05, 0.48, 900 + Math.random() * 400, 55 + Math.random() * 25);
    // 键帽回弹
    makeClick(t + 0.028 + Math.random() * 0.012, 0.04, 0.26, 1200, 70);

    // 底板闷响
    const o = ctx.createOscillator();
    const og = ctx.createGain();
    o.type = "triangle";
    const f0 = 190 + Math.random() * 80;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(90, t + 0.05);
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.16, t + 0.004);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    o.connect(og);
    og.connect(master);
    o.start(t);
    o.stop(t + 0.07);
  }

  /** 巧克力裂开后的碎屑轻响（冰仍在） */
  function playChocoFlake() {
    if (!ensure()) return;
    const t = now();
    noiseBurst(0.05, 0.28, 4200, "highpass");
    noiseBurst(0.04, 0.2, 2800, "bandpass");
    tone("triangle", 720 + Math.random() * 180, 0.045, 0.1, 280);
  }

  function playSurfaceStep(kind) {
    if (kind === "jelly") playJellySquish();
    else if (kind === "keyboard") playChocoFlake();
    else if (kind === "oreo") playOreoCrunch();
    else if (kind === "chocoice") playKeyboardTap();
    else playFootstep();
  }

  function playStar() {
    if (!ensure()) return;
    const notes = [523, 659, 784, 1046];
    notes.forEach((f, i) => {
      setTimeout(() => tone("sine", f, 0.2, 0.12), i * 60);
    });
  }

  function playWin() {
    if (!ensure()) return;
    const notes = [392, 523, 659, 784, 1046];
    notes.forEach((f, i) => {
      setTimeout(() => {
        tone("triangle", f, 0.28, 0.14);
        tone("sine", f * 2, 0.22, 0.05);
      }, i * 90);
    });
  }

  function playDeath() {
    if (!ensure()) return;
    tone("sawtooth", 320, 0.45, 0.16, 60);
    noiseBurst(0.4, 0.14, 400, "lowpass");
    setTimeout(() => tone("square", 110, 0.3, 0.08, 40), 120);
  }

  function playClick() {
    if (!ensure()) return;
    tone("square", 880, 0.04, 0.07);
    noiseBurst(0.03, 0.04, 2500, "highpass");
  }

  // 钢管落地/互撞：金属铿锵
  function playPipeClang() {
    if (!ensure()) return;
    noiseBurst(0.12, 0.16, 900, "bandpass");
    tone("square", 220, 0.08, 0.1, 80);
    tone("sawtooth", 140, 0.16, 0.12, 50);
    setTimeout(() => {
      tone("triangle", 90, 0.2, 0.08, 40);
      noiseBurst(0.15, 0.1, 400, "lowpass");
    }, 50);
    setTimeout(() => {
      tone("square", 60, 0.12, 0.06);
    }, 110);
  }

  function playRocket() {
    if (!ensure()) return;
    // whoosh lift
    noiseBurst(0.35, 0.1, 600, "bandpass");
    tone("sawtooth", 180, 0.35, 0.08, 60);
    // gulp
    setTimeout(() => {
      tone("sine", 140, 0.12, 0.14, 70);
      noiseBurst(0.1, 0.08, 300, "lowpass");
    }, 400);
    setTimeout(() => {
      tone("triangle", 90, 0.15, 0.1);
      noiseBurst(0.12, 0.09, 200, "lowpass");
    }, 750);
  }

  function playZombieBark() {
    if (!ensure()) return;
    tone("sawtooth", 120 + Math.random() * 40, 0.22, 0.09, 70);
    noiseBurst(0.2, 0.08, 350, "bandpass");
  }

  function stopLoop(name) {
    const L = loops[name];
    if (!L) return;
    try {
      L.nodes.forEach((n) => {
        try {
          if (n.stop) n.stop();
          n.disconnect();
        } catch (_) {}
      });
      if (L.gain) L.gain.disconnect();
    } catch (_) {}
    loops[name] = null;
  }

  function startLavaLoop() {
    if (!ensure() || loops.lava) return;
    const gain = ctx.createGain();
    gain.gain.value = 0.12;
    gain.connect(master);

    const len = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.6;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 220;
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.35;
    lfoGain.gain.value = 80;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    src.connect(filter);
    filter.connect(gain);
    src.start();
    lfo.start();

    // bubble blips
    const bubble = ctx.createOscillator();
    const bubbleGain = ctx.createGain();
    bubble.type = "sine";
    bubble.frequency.value = 55;
    bubbleGain.gain.value = 0.05;
    bubble.connect(bubbleGain);
    bubbleGain.connect(gain);
    bubble.start();

    loops.lava = { nodes: [src, lfo, bubble], gain };
  }

  function startCityLoop() {
    if (!ensure() || loops.city) return;
    const gain = ctx.createGain();
    gain.gain.value = 0.04;
    gain.connect(master);

    // soft drone
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    o1.type = "sine";
    o2.type = "triangle";
    o1.frequency.value = 110;
    o2.frequency.value = 164.8;
    const mix = ctx.createGain();
    mix.gain.value = 0.5;
    o1.connect(mix);
    o2.connect(mix);
    mix.connect(gain);
    o1.start();
    o2.start();

    // distant traffic noise
    const len = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 450;
    filter.Q.value = 0.5;
    const nGain = ctx.createGain();
    nGain.gain.value = 0.35;
    src.connect(filter);
    filter.connect(nGain);
    nGain.connect(gain);
    src.start();

    loops.city = { nodes: [o1, o2, src], gain };
  }

  function startZombieLoop() {
    if (!ensure() || loops.zombie) return;
    const gain = ctx.createGain();
    gain.gain.value = 0.03;
    gain.connect(master);
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = 48;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 180;
    o.connect(filter);
    filter.connect(gain);
    o.start();
    loops.zombie = { nodes: [o], gain };
  }

  function startTrainLoop() {
    if (!ensure() || loops.train) return;
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    gain.connect(master);
    const t0 = now();
    gain.gain.exponentialRampToValueAtTime(0.16, t0 + 0.45);
    const rate = ctx.sampleRate;

    // 轮轨摩擦：中高频沙沙（不用振荡器，避免嗡嗡）
    const roarLen = Math.floor(rate * 1.8);
    const roarBuf = ctx.createBuffer(1, roarLen, rate);
    const roarData = roarBuf.getChannelData(0);
    for (let i = 0; i < roarLen; i++) roarData[i] = Math.random() * 2 - 1;
    const roar = ctx.createBufferSource();
    roar.buffer = roarBuf;
    roar.loop = true;
    const roarHp = ctx.createBiquadFilter();
    roarHp.type = "highpass";
    roarHp.frequency.value = 220;
    const roarBp = ctx.createBiquadFilter();
    roarBp.type = "bandpass";
    roarBp.frequency.value = 950;
    roarBp.Q.value = 0.55;
    const roarGain = ctx.createGain();
    roarGain.gain.value = 0.3;
    roar.connect(roarHp);
    roarHp.connect(roarBp);
    roarBp.connect(roarGain);
    roarGain.connect(gain);

    // 轨缝撞击：周期性双咔嗒（左轮/右轮）
    const clackPeriod = Math.floor(rate * 0.2);
    const clackCycles = 10;
    const clackLen = clackPeriod * clackCycles;
    const clackBuf = ctx.createBuffer(1, clackLen, rate);
    const clackData = clackBuf.getChannelData(0);
    for (let c = 0; c < clackCycles; c++) {
      const base = c * clackPeriod;
      for (const pair of [
        { off: 0, amp: 1 },
        { off: Math.floor(rate * 0.032), amp: 0.72 },
      ]) {
        const start = base + pair.off;
        const dur = Math.floor(rate * 0.03);
        for (let i = 0; i < dur && start + i < clackLen; i++) {
          const p = i / dur;
          const env = Math.exp(-p * 20) * (1 - p * 0.25);
          clackData[start + i] += (Math.random() * 2 - 1) * env * pair.amp;
        }
      }
    }
    const clack = ctx.createBufferSource();
    clack.buffer = clackBuf;
    clack.loop = true;
    clack.playbackRate.value = 1;
    const clackHp = ctx.createBiquadFilter();
    clackHp.type = "highpass";
    clackHp.frequency.value = 450;
    const clackBp = ctx.createBiquadFilter();
    clackBp.type = "bandpass";
    clackBp.frequency.value = 1700;
    clackBp.Q.value = 1.15;
    const clackGain = ctx.createGain();
    clackGain.gain.value = 0.48;
    clack.connect(clackHp);
    clackHp.connect(clackBp);
    clackBp.connect(clackGain);
    clackGain.connect(gain);

    // 车体低沉轰隆：噪声低通，不要锯齿/正弦嗡鸣
    const thumpLen = Math.floor(rate * 2.2);
    const thumpBuf = ctx.createBuffer(1, thumpLen, rate);
    const thumpData = thumpBuf.getChannelData(0);
    for (let i = 0; i < thumpLen; i++) thumpData[i] = Math.random() * 2 - 1;
    const thump = ctx.createBufferSource();
    thump.buffer = thumpBuf;
    thump.loop = true;
    const thumpLp = ctx.createBiquadFilter();
    thumpLp.type = "lowpass";
    thumpLp.frequency.value = 130;
    const thumpGain = ctx.createGain();
    thumpGain.gain.value = 0.16;
    thump.connect(thumpLp);
    thumpLp.connect(thumpGain);
    thumpGain.connect(gain);

    roar.start();
    clack.start();
    thump.start();

    loops.train = {
      nodes: [roar, clack, thump],
      gain,
      clack,
      roarBp,
      clackBp,
      speed: 1,
    };
  }

  function setTrainLoopSpeed(speed) {
    if (!loops.train || !ctx) return;
    const s = Math.max(0.05, Math.min(1.4, Number(speed) || 1));
    loops.train.speed = s;
    const t = now();
    try {
      if (loops.train.clack && loops.train.clack.playbackRate) {
        loops.train.clack.playbackRate.setTargetAtTime(0.55 + s * 0.75, t, 0.12);
      }
      if (loops.train.roarBp) {
        loops.train.roarBp.frequency.setTargetAtTime(520 + s * 680, t, 0.2);
      }
      if (loops.train.clackBp) {
        loops.train.clackBp.frequency.setTargetAtTime(1200 + s * 900, t, 0.2);
      }
      if (loops.train.gain) {
        loops.train.gain.gain.setTargetAtTime(0.05 + s * 0.14, t, 0.2);
      }
    } catch (_) {}
  }

  function stopTrainLoop() {
    if (!loops.train || !ctx) {
      stopLoop("train");
      return;
    }
    const g = loops.train.gain;
    const t = now();
    try {
      if (g) {
        g.gain.cancelScheduledValues(t);
        g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      }
    } catch (_) {}
    const nodes = loops.train.nodes ? loops.train.nodes.slice() : [];
    setTimeout(() => {
      try {
        nodes.forEach((n) => {
          try {
            if (n.stop) n.stop();
            n.disconnect();
          } catch (_) {}
        });
        if (g) g.disconnect();
      } catch (_) {}
    }, 500);
    loops.train = null;
  }

  let musicTrack = null;
  let musicTrackOnEnd = null;

  function stopMusicTrack() {
    if (musicTrack) {
      try {
        musicTrack.onended = null;
        musicTrack.onerror = null;
        musicTrack.pause();
        musicTrack.removeAttribute("src");
        musicTrack.load();
      } catch (_) {}
      musicTrack = null;
    }
    musicTrackOnEnd = null;
  }

  /**
   * 播放真实音频（本地 mp3 / 网上直链）
   * opts: { src, volume, onEnded, onError, onPlay }
   */
  function playMusicTrack(opts) {
    const o = opts || {};
    const src = String(o.src || "").trim();
    if (!src) {
      if (typeof o.onError === "function") o.onError(new Error("empty src"));
      return null;
    }
    ensure();
    stopMusicTrack();
    const el = new Audio();
    el.preload = "auto";
    el.crossOrigin = "anonymous";
    el.volume = Math.max(0, Math.min(1, o.volume != null ? o.volume : 0.75));
    musicTrackOnEnd = typeof o.onEnded === "function" ? o.onEnded : null;
    el.onended = () => {
      const cb = musicTrackOnEnd;
      musicTrackOnEnd = null;
      if (cb) cb();
    };
    el.onerror = () => {
      if (typeof o.onError === "function") o.onError(el.error || new Error("load fail"));
    };
    el.onplay = () => {
      if (typeof o.onPlay === "function") o.onPlay(el);
    };
    el.src = src;
    musicTrack = el;
    const p = el.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        // 需用户手势解锁；再次点击后由关卡重试
        if (typeof o.onError === "function") o.onError(new Error("autoplay blocked"));
      });
    }
    return el;
  }

  function getMusicTrack() {
    return musicTrack;
  }

  function setMusicTrackVolume(v) {
    if (!musicTrack) return;
    musicTrack.volume = Math.max(0, Math.min(1, Number(v) || 0));
  }

  /** 碰壁时给真实音乐一个短暂音量脉冲 */
  function pulseMusicTrack(boost, ms) {
    if (!musicTrack) return;
    const base = musicTrack.volume;
    const up = Math.min(1, base + (boost != null ? boost : 0.18));
    musicTrack.volume = up;
    setTimeout(() => {
      if (musicTrack) musicTrack.volume = base;
    }, ms != null ? ms : 120);
  }

  function stopAllAmbience() {
    stopLoop("lava");
    stopLoop("city");
    stopLoop("zombie");
    stopTrainLoop();
    stopMusicTrack();
    stopDateAmbience();
    footTimer = 0;
    zombieBarkTimer = 0;
  }

  function syncAmbience(opts) {
    if (!unlocked && !opts.force) return;
    if (!ensure()) return;
    if (opts.playing) {
      if (opts.moon) {
        stopLoop("lava");
        stopLoop("city");
        stopLoop("zombie");
      } else {
        if (!loops.lava) startLavaLoop();
        if (opts.city) {
          if (!loops.city) startCityLoop();
        } else {
          stopLoop("city");
        }
        if (opts.zombies) {
          if (!loops.zombie) startZombieLoop();
        } else {
          stopLoop("zombie");
        }
      }
    } else {
      stopAllAmbience();
    }
  }

  function updateGameplay(dt, opts) {
    if (!opts.playing || !unlocked) return;
    syncAmbience(opts);

    if (opts.running) {
      footTimer -= dt;
      if (footTimer <= 0) {
        playSurfaceStep(opts.surface || "ground");
        footTimer = opts.fast
          ? 0.22
          : opts.surface === "jelly"
            ? 0.36
            : opts.surface === "oreo"
              ? 0.28
              : opts.surface === "chocoice"
                ? 0.4
                : 0.32;
      }
    } else {
      footTimer = 0;
    }

    if (opts.zombies) {
      zombieBarkTimer -= dt;
      if (zombieBarkTimer <= 0) {
        playZombieBark();
        zombieBarkTimer = 1.6 + Math.random() * 2.2;
      }
    } else {
      zombieBarkTimer = 0;
    }
  }

  let adBed = null;
  let adStreamDest = null;

  function stopAdBed() {
    if (adBed) {
      try {
        adBed.gain.gain.cancelScheduledValues(now());
        adBed.gain.gain.setValueAtTime(0.0001, now());
      } catch (_) {
        /* ignore */
      }
      for (const n of adBed.nodes) {
        try {
          n.stop();
        } catch (_) {
          /* ignore */
        }
        try {
          n.disconnect();
        } catch (_) {
          /* ignore */
        }
      }
      try {
        adBed.gain.disconnect();
      } catch (_) {
        /* ignore */
      }
      adBed = null;
    }
    if (adStreamDest) {
      try {
        adStreamDest.disconnect();
      } catch (_) {
        /* ignore */
      }
      adStreamDest = null;
    }
  }

  function startAdBed(theme, durationSec = 15) {
    if (!ensure()) return null;
    stopAdBed();
    stopAllAmbience();

    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    gain.gain.exponentialRampToValueAtTime(0.45, now() + 0.08);
    gain.connect(master);

    adStreamDest = ctx.createMediaStreamDestination();
    gain.connect(adStreamDest);

    const nodes = [];
    const t0 = now();
    const patterns = {
      soda: [523, 659, 784, 659, 587, 523, 440, 523],
      food: [392, 494, 587, 494, 440, 392, 330, 392],
      game: [660, 880, 990, 880, 740, 660, 554, 660],
      shop: [349, 440, 523, 440, 392, 349, 294, 349],
    };
    const seq = patterns[theme] || patterns.soda;

    // Soft pad
    const pad = ctx.createOscillator();
    const padGain = ctx.createGain();
    pad.type = "sine";
    pad.frequency.value = theme === "game" ? 110 : 98;
    padGain.gain.value = 0.04;
    pad.connect(padGain);
    padGain.connect(gain);
    pad.start(t0);
    pad.stop(t0 + durationSec + 0.05);
    nodes.push(pad);

    // Melodic jingle loop
    let beat = 0;
    const beatLen = 0.28;
    while (beat * beatLen < durationSec - 0.2) {
      const freq = seq[beat % seq.length];
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = beat % 4 === 0 ? "square" : "triangle";
      const start = t0 + beat * beatLen;
      const dur = 0.2;
      o.frequency.setValueAtTime(freq, start);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      o.connect(g);
      g.connect(gain);
      o.start(start);
      o.stop(start + dur + 0.02);
      nodes.push(o);
      beat += 1;
    }

    // Percussion ticks
    for (let i = 0; i < durationSec * 2; i++) {
      const start = t0 + i * 0.5;
      const len = Math.floor(ctx.sampleRate * 0.04);
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let s = 0; s < len; s++) data[s] = (Math.random() * 2 - 1) * (1 - s / len);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.08, start);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.04);
      src.connect(g);
      g.connect(gain);
      src.start(start);
      nodes.push(src);
    }

    adBed = { gain, nodes };
    return adStreamDest.stream;
  }

  // Unlock audio on first interaction
  function playGunShot() {
    if (!ensure()) return;
    noiseBurst(0.08, 0.22, 900, "bandpass");
    tone("square", 180, 0.06, 0.12, 60);
    setTimeout(() => {
      if (!ctx) return;
      noiseBurst(0.12, 0.1, 400, "lowpass");
      tone("triangle", 90, 0.1, 0.08);
    }, 40);
  }

  function playDoorChime(kind) {
    if (!ensure()) return;
    if (kind === "open") {
      tone("sine", 660, 0.15, 0.1);
      setTimeout(() => tone("sine", 880, 0.2, 0.09), 120);
      setTimeout(() => tone("triangle", 990, 0.25, 0.07), 280);
    } else {
      tone("sine", 880, 0.12, 0.1);
      setTimeout(() => tone("sine", 660, 0.18, 0.09), 100);
      setTimeout(() => tone("triangle", 440, 0.28, 0.08), 240);
    }
  }

  let musicBus = null;
  let musicDelay = null;

  function ensureMusicBus() {
    if (!ensure()) return null;
    if (musicBus) return musicBus;
    musicBus = ctx.createGain();
    musicBus.gain.value = 0.85;
    // 轻延迟：更空灵好听
    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.22;
    const fb = ctx.createGain();
    fb.gain.value = 0.28;
    const wet = ctx.createGain();
    wet.gain.value = 0.28;
    const dry = ctx.createGain();
    dry.gain.value = 0.92;
    const toneFilter = ctx.createBiquadFilter();
    toneFilter.type = "lowpass";
    toneFilter.frequency.value = 4200;
    toneFilter.Q.value = 0.5;

    musicBus.connect(dry);
    dry.connect(master);
    musicBus.connect(delay);
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(toneFilter);
    toneFilter.connect(wet);
    wet.connect(master);
    musicDelay = delay;
    return musicBus;
  }

  /** 音乐关：更空灵好听的纯音乐合成 */
  function playMusicNote(freq, style, duration, meta) {
    if (!ensure()) return;
    const bus = ensureMusicBus();
    if (!bus) return;
    const f = Number(freq) || 0;
    const st = style || "lead";
    const dur = Math.max(0.14, Number(duration) || 0.28);
    const beat = (meta && meta.beat) | 0;
    const accent = beat % 4 === 0;
    const fromWall = !!(meta && meta.fromWall);
    const t0 = now();

    function softVoice(opts) {
      const type = opts.type || "sine";
      const hz = Math.max(20, opts.hz);
      const d = Math.max(0.05, opts.d || dur);
      const peak = opts.peak != null ? opts.peak : 0.1;
      const attack = opts.attack != null ? opts.attack : 0.02;
      const decay = opts.decay != null ? opts.decay : 0.42;
      const filterHz = opts.filterHz || Math.min(4800, hz * 4.2);
      const detune = opts.detune || 0;
      const slide = opts.slide;
      const delay = opts.delay || 0;
      const vib = opts.vib || 0;
      const start = t0 + delay;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const filt = ctx.createBiquadFilter();
      o.type = type;
      o.detune.setValueAtTime(detune, start);
      o.frequency.setValueAtTime(hz, start);
      if (slide) {
        o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), start + d * 0.9);
      }
      if (vib > 0) {
        const lfo = ctx.createOscillator();
        const lfoG = ctx.createGain();
        lfo.frequency.value = 5.2;
        lfoG.gain.value = vib;
        lfo.connect(lfoG);
        lfoG.connect(o.frequency);
        lfo.start(start);
        lfo.stop(start + d + 0.05);
      }
      filt.type = opts.filterType || "lowpass";
      filt.Q.value = opts.q != null ? opts.q : 0.7;
      filt.frequency.setValueAtTime(Math.max(90, filterHz * 0.35), start);
      filt.frequency.exponentialRampToValueAtTime(Math.max(160, filterHz), start + attack + 0.05);
      filt.frequency.exponentialRampToValueAtTime(Math.max(120, filterHz * 0.45), start + d);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), start + attack);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak * decay), start + Math.max(attack + 0.05, d * 0.48));
      g.gain.exponentialRampToValueAtTime(0.0001, start + d);
      o.connect(filt);
      filt.connect(g);
      g.connect(bus);
      o.start(start);
      o.stop(start + d + 0.08);
    }

    function subBass(root) {
      let b = root;
      while (b > 90) b *= 0.5;
      b = Math.max(36, b);
      softVoice({ type: "sine", hz: b, d: dur * 1.35, peak: accent ? 0.16 : 0.11, attack: 0.02, filterHz: 280 });
      softVoice({ type: "triangle", hz: b * 2, d: dur * 1.15, peak: 0.035, attack: 0.03, filterHz: 520 });
    }

    // 大七 / add9，更甜
    function lushChord(root, peak) {
      softVoice({ type: "sine", hz: root, d: dur * 1.35, peak: peak * 0.4, attack: 0.07, filterHz: root * 2.8 });
      softVoice({ type: "sine", hz: root * 1.26, d: dur * 1.3, peak: peak * 0.34, attack: 0.08, filterHz: root * 3.1 });
      softVoice({ type: "sine", hz: root * 1.498, d: dur * 1.25, peak: peak * 0.26, attack: 0.09, filterHz: root * 3.4 });
      softVoice({ type: "sine", hz: root * 1.888, d: dur * 1.15, peak: peak * 0.16, attack: 0.1, filterHz: root * 3.8 }); // maj7
      softVoice({ type: "triangle", hz: root * 2.245, d: dur * 1.05, peak: peak * 0.12, attack: 0.08, filterHz: root * 4.2 }); // add9
    }

    function airySparkle(root, peak) {
      softVoice({ type: "sine", hz: root * 2, d: dur * 0.95, peak: peak * 0.16, delay: 0.03, filterHz: 5600, vib: 1.2 });
      softVoice({ type: "sine", hz: root * 3.01, d: dur * 0.6, peak: peak * 0.06, delay: 0.06, filterHz: 6800 });
    }

    function softKick() {
      softVoice({ type: "sine", hz: 140, slide: 42, d: 0.2, peak: fromWall ? 0.08 : accent ? 0.14 : 0.1, attack: 0.003, decay: 0.18, filterHz: 360 });
    }

    function softHat() {
      if (fromWall) return;
      noiseBurst(0.014, 0.018, 9000, "highpass");
    }

    function softSnare() {
      noiseBurst(0.04, fromWall ? 0.025 : 0.045, 2400, "bandpass");
      softVoice({ type: "triangle", hz: 220, d: 0.05, peak: 0.03, attack: 0.001, filterHz: 900 });
    }

    // 纯音乐：鼓更轻、更散
    if (!fromWall && f > 0) {
      if (beat % 8 === 0) softKick();
      else if (beat % 4 === 2 && st === "batida") softSnare();
      else if (beat % 4 === 3) softHat();
    }

    if (f <= 0) {
      if (accent && !fromWall) lushChord(196, 0.07);
      return;
    }

    subBass(f);
    if (accent) lushChord(f, 0.12);
    else if (beat % 2 === 0) lushChord(f, 0.07);
    airySparkle(f, 0.1);

    if (st === "cool") {
      softVoice({ type: "sine", hz: f, d: dur * 1.05, peak: 0.13, attack: 0.018, filterHz: 3400, vib: 2.5 });
      softVoice({ type: "triangle", hz: f, d: dur, peak: 0.05, detune: 6, filterHz: 2600 });
      softVoice({ type: "sine", hz: f * 2, d: dur * 0.95, peak: 0.06, filterHz: 5000, vib: 1.5 });
      softVoice({ type: "sine", hz: f * 1.498, d: dur * 1.15, peak: 0.04, attack: 0.05, filterHz: 3000 });
    } else if (st === "pluck") {
      softVoice({ type: "triangle", hz: f, d: dur * 1.05, peak: 0.14, attack: 0.004, decay: 0.22, filterHz: 3800, q: 1.2 });
      softVoice({ type: "sine", hz: f * 2.004, d: dur * 0.7, peak: 0.055, attack: 0.003, filterHz: 5600 });
      softVoice({ type: "sine", hz: f * 1.26, d: dur * 1.25, peak: 0.055, attack: 0.04, filterHz: 2800, vib: 1.8 });
      softVoice({ type: "sine", hz: f * 1.888, d: dur * 1.1, peak: 0.03, attack: 0.05, filterHz: 3200 });
    } else if (st === "fly") {
      softVoice({ type: "sawtooth", hz: f, d: dur, peak: accent ? 0.08 : 0.065, filterHz: 2800, q: 0.8, slide: f * 1.02 });
      softVoice({ type: "sine", hz: f, d: dur * 1.1, peak: 0.09, attack: 0.03, filterHz: 3200, vib: 2 });
      softVoice({ type: "sine", hz: f * 2, d: dur * 0.85, peak: 0.05, filterHz: 4800 });
      softVoice({ type: "sine", hz: f * 1.26, d: dur * 1.15, peak: 0.05, attack: 0.05, filterHz: 2800 });
    } else if (st === "batida") {
      softVoice({ type: "sine", hz: Math.max(48, f * (f < 120 ? 1 : 0.5)), d: dur * 1.3, peak: 0.14, filterHz: 480 });
      softVoice({ type: "triangle", hz: f, d: dur * 1.1, peak: 0.08, filterHz: 1200 });
      softVoice({ type: "sine", hz: f * 1.5, d: dur * 0.55, peak: 0.035, filterHz: 2000 });
      if (!fromWall && beat % 4 === 0) softKick();
    } else if (st === "chant") {
      softVoice({ type: "sine", hz: f, d: dur * 1.3, peak: 0.12, attack: 0.06, filterHz: 2800, vib: 3 });
      softVoice({ type: "sine", hz: f * 1.498, d: dur * 1.25, peak: 0.08, attack: 0.07, filterHz: 3000, vib: 2.2 });
      softVoice({ type: "triangle", hz: f * 1.26, d: dur * 1.2, peak: 0.045, attack: 0.08, filterHz: 2600 });
      softVoice({ type: "sine", hz: f * 0.5, d: dur * 1.35, peak: 0.05, filterHz: 800 });
    } else if (st === "bounce") {
      softVoice({ type: "sine", hz: f, d: dur * 1.05, peak: 0.135, attack: 0.008, decay: 0.3, filterHz: 3600, vib: 2 });
      softVoice({ type: "triangle", hz: f * 2, d: dur * 0.8, peak: 0.055, filterHz: 4800 });
      softVoice({ type: "sine", hz: f * 1.26, d: dur * 1.2, peak: 0.05, attack: 0.04, filterHz: 2800 });
      softVoice({ type: "sine", hz: f * 1.888, d: dur * 0.9, peak: 0.03, filterHz: 4000 });
    } else {
      softVoice({ type: "sine", hz: f, d: dur, peak: 0.12, filterHz: 3000, vib: 2 });
      softVoice({ type: "triangle", hz: f * 2, d: dur * 0.85, peak: 0.045, filterHz: 4500 });
    }
  }

  /** 碰壁：轻触感，不抢纯音乐 */
  function playMusicWallHit(style) {
    if (!ensure()) return;
    ensureMusicBus();
    const st = style || "cool";
    if (st === "batida") {
      noiseBurst(0.04, 0.06, 160, "lowpass");
      tone("sine", 80, 0.08, 0.06, 45);
    } else if (st === "chant") {
      tone("sine", 520, 0.1, 0.035);
      tone("sine", 780, 0.12, 0.028);
    } else {
      noiseBurst(0.02, 0.03, 1400, "bandpass");
      tone("sine", 440, 0.08, 0.03);
      tone("sine", 660, 0.1, 0.022);
    }
  }

  let dateAmbTimer = null;
  let dateAmbGain = null;

  function stopDateAmbience() {
    if (dateAmbTimer) {
      clearInterval(dateAmbTimer);
      dateAmbTimer = null;
    }
    if (dateAmbGain) {
      try {
        const t = now();
        dateAmbGain.gain.cancelScheduledValues(t);
        dateAmbGain.gain.setValueAtTime(dateAmbGain.gain.value, t);
        dateAmbGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      } catch (_) {}
      dateAmbGain = null;
    }
  }

  /** 西餐厅：换一曲夜店式柔和爵士氛围 */
  function startDateAmbience() {
    if (!ensure()) return;
    stopDateAmbience();
    const bus = ensureMusicBus() || master;
    dateAmbGain = ctx.createGain();
    dateAmbGain.gain.value = 0.0001;
    dateAmbGain.connect(bus);
    const t0 = now();
    dateAmbGain.gain.exponentialRampToValueAtTime(0.62, t0 + 1.4);

    // Dm7 · G7 · Cmaj7 · Am7 循环，偏晚间酒吧
    const prog = [
      { bass: 146.83, chord: [293.66, 349.23, 440.0, 523.25] }, // D
      { bass: 196.0, chord: [246.94, 293.66, 349.23, 440.0] }, // G
      { bass: 130.81, chord: [261.63, 329.63, 392.0, 493.88] }, // C
      { bass: 110.0, chord: [220.0, 261.63, 329.63, 392.0] }, // A
    ];
    let step = 0;
    let tick = 0;

    function voice(type, hz, d, peak, opts) {
      if (!ctx || !dateAmbGain) return;
      const o = opts || {};
      const start = now() + (o.delay || 0);
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, hz), start);
      if (o.slide) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), start + d * 0.9);
      }
      osc.detune.value = o.detune || 0;
      f.type = "lowpass";
      f.frequency.value = o.filter || 2200;
      f.Q.value = 0.5;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), start + (o.attack || 0.04));
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak * (o.decay || 0.35)), start + d * 0.45);
      g.gain.exponentialRampToValueAtTime(0.0001, start + d);
      osc.connect(f);
      f.connect(g);
      g.connect(dateAmbGain);
      osc.start(start);
      osc.stop(start + d + 0.05);
    }

    function playBar(bar) {
      if (!dateAmbGain) return;
      // 低音拨弦
      voice("triangle", bar.bass, 1.5, 0.1, { filter: 480, attack: 0.02 });
      voice("sine", bar.bass * 2, 1.2, 0.035, { filter: 700, delay: 0.02 });
      // 七和弦垫底
      for (let i = 0; i < bar.chord.length; i++) {
        voice("sine", bar.chord[i], 3.8, 0.045 - i * 0.006, {
          filter: 1800,
          attack: 0.35,
          detune: (i - 1.5) * 3,
          delay: i * 0.03,
        });
      }
      // 轻钢琴点缀
      const mel = [
        bar.chord[2],
        bar.chord[1],
        bar.chord[3],
        bar.chord[2] * 0.75,
      ];
      for (let i = 0; i < 4; i++) {
        voice("triangle", mel[i], 0.55, 0.055, {
          filter: 3200,
          attack: 0.01,
          decay: 0.2,
          delay: 0.45 + i * 0.55,
        });
        voice("sine", mel[i] * 2, 0.35, 0.02, {
          filter: 4500,
          attack: 0.01,
          delay: 0.47 + i * 0.55,
        });
      }
      // 极轻刷镲感
      if (tick % 2 === 0) {
        noiseBurst(0.04, 0.018, 7000, "highpass");
      }
    }

    playBar(prog[0]);
    dateAmbTimer = setInterval(() => {
      if (!dateAmbGain) return;
      step = (step + 1) % prog.length;
      tick += 1;
      playBar(prog[step]);
    }, 3600);
  }

  function playSchoolBell() {
    if (!ensure()) return;
    // 下课铃：两段急促铃声
    const ring = (freq, delay, dur, peak) => {
      setTimeout(() => {
        if (!ctx) return;
        tone("square", freq, dur, peak * 0.55);
        tone("sine", freq * 1.01, dur, peak);
        noiseBurst(0.04, 0.03, 2200, "highpass");
      }, delay);
    };
    ring(880, 0, 0.18, 0.13);
    ring(880, 220, 0.18, 0.12);
    ring(988, 520, 0.2, 0.13);
    ring(988, 760, 0.22, 0.11);
    ring(880, 1100, 0.28, 0.12);
  }

  function playTrainArriveChime() {
    if (!ensure()) return;
    const beat = (freq, delay, dur, peak) => {
      setTimeout(() => {
        if (!ctx) return;
        tone("sine", freq, dur, peak);
        tone("triangle", freq * 1.01, dur * 0.9, peak * 0.45);
      }, delay);
    };
    // 两组进站铃
    beat(784, 0, 0.22, 0.14); // G5
    beat(1047, 220, 0.28, 0.12); // C6
    beat(784, 520, 0.22, 0.13);
    beat(1047, 740, 0.32, 0.11);
    setTimeout(() => {
      if (!ctx) return;
      noiseBurst(0.08, 0.04, 1800, "highpass");
    }, 980);
  }

  let lastDingAt = 0;
  function playSubwayDing() {
    if (!ensure()) return;
    // 限流：太多球同时撞墙时不要打爆音频
    const t = now();
    if (t - lastDingAt < 0.07) return;
    lastDingAt = t;
    if (master) {
      try {
        master.gain.setValueAtTime(1, t);
      } catch (e) {
        master.gain.value = 1;
      }
    }
    // 一声响亮「丁」
    tone("sine", 1480, 0.12, 1);
    tone("triangle", 1976, 0.16, 0.95);
  }

  let subwayUtter = null;

  function stopSubwayAnnounce() {
    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    } catch (e) {}
    subwayUtter = null;
  }

  function playSubwayAnnounce(text) {
    if (!text) return;
    ensure();
    playSubwayDing();
    if (!window.speechSynthesis) return;
    stopSubwayAnnounce();
    const u = new SpeechSynthesisUtterance(String(text));
    u.lang = "zh-CN";
    u.rate = 0.92;
    u.pitch = 1.05;
    u.volume = master ? Math.min(1, Math.max(0.2, master.gain.value * 2.2)) : 0.8;
    subwayUtter = u;
    // 优先中文女声
    try {
      const voices = window.speechSynthesis.getVoices() || [];
      const zh =
        voices.find((v) => /zh[-_]CN/i.test(v.lang) && /female|女|Xiaoxiao|Tingting| Huihui/i.test(v.name)) ||
        voices.find((v) => /zh[-_]CN/i.test(v.lang)) ||
        voices.find((v) => /^zh/i.test(v.lang));
      if (zh) u.voice = zh;
    } catch (e) {}
    window.speechSynthesis.speak(u);
  }

  const unlock = () => {
    ensure();
  };
  ["pointerdown", "keydown", "touchstart"].forEach((ev) => {
    window.addEventListener(ev, unlock, { once: true, passive: true });
  });

  window.GameAudio = {
    unlock: ensure,
    playJump,
    playFootstep,
    playJellySquish,
    playKeyboardTap,
    playOreoCrunch,
    playChocoCrack,
    playChocoFlake,
    playSurfaceStep,
    playStar,
    playWin,
    playDeath,
    playClick,
    playPipeClang,
    playRocket,
    playZombieBark,
    playGunShot,
    playDoorChime,
    playTrainArriveChime,
    playMusicNote,
    playMusicWallHit,
    playMusicTrack,
    stopMusicTrack,
    getMusicTrack,
    setMusicTrackVolume,
    pulseMusicTrack,
    startDateAmbience,
    stopDateAmbience,
    playSchoolBell,
    playSubwayAnnounce,
    stopSubwayAnnounce,
    startTrainLoop,
    stopTrainLoop,
    setTrainLoopSpeed,
    syncAmbience,
    stopAllAmbience,
    updateGameplay,
    startAdBed,
    stopAdBed,
    setVolume(v) {
      const vol = Math.max(0, Math.min(1, Number(v) || 0));
      if (!ensure()) return vol;
      master.gain.value = vol;
      return vol;
    },
    getVolume() {
      return master ? master.gain.value : 0.35;
    },
  };
})();
