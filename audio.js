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
      master.gain.value = 0.35;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
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
    gain.gain.exponentialRampToValueAtTime(0.14, t0 + 0.6);

    // 低频车体震动
    const rumble = ctx.createOscillator();
    rumble.type = "sawtooth";
    rumble.frequency.value = 42;
    const rumbleFilter = ctx.createBiquadFilter();
    rumbleFilter.type = "lowpass";
    rumbleFilter.frequency.value = 120;
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0.55;
    rumble.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(gain);

    // 轨道摩擦噪声
    const len = Math.floor(ctx.sampleRate * 2.5);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const nFilter = ctx.createBiquadFilter();
    nFilter.type = "bandpass";
    nFilter.frequency.value = 380;
    nFilter.Q.value = 0.7;
    const nGain = ctx.createGain();
    nGain.gain.value = 0.4;
    noise.connect(nFilter);
    nFilter.connect(nGain);
    nGain.connect(gain);

    // 轮轨节奏（哒哒）
    const click = ctx.createOscillator();
    click.type = "square";
    click.frequency.value = 8;
    const clickFilter = ctx.createBiquadFilter();
    clickFilter.type = "highpass";
    clickFilter.frequency.value = 600;
    const clickGain = ctx.createGain();
    clickGain.gain.value = 0.045;
    click.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(gain);

    // 轻微电机嗡鸣
    const hum = ctx.createOscillator();
    hum.type = "sine";
    hum.frequency.value = 95;
    const humGain = ctx.createGain();
    humGain.gain.value = 0.08;
    hum.connect(humGain);
    humGain.connect(gain);

    rumble.start();
    noise.start();
    click.start();
    hum.start();

    loops.train = {
      nodes: [rumble, noise, click, hum],
      gain,
      rumble,
      click,
      nFilter,
      speed: 1,
    };
  }

  function setTrainLoopSpeed(speed) {
    if (!loops.train || !ctx) return;
    const s = Math.max(0.05, Math.min(1.4, Number(speed) || 1));
    loops.train.speed = s;
    const t = now();
    try {
      if (loops.train.rumble) {
        loops.train.rumble.frequency.setTargetAtTime(36 + s * 28, t, 0.15);
      }
      if (loops.train.click) {
        loops.train.click.frequency.setTargetAtTime(3 + s * 10, t, 0.12);
      }
      if (loops.train.nFilter) {
        loops.train.nFilter.frequency.setTargetAtTime(220 + s * 280, t, 0.2);
      }
      if (loops.train.gain) {
        loops.train.gain.gain.setTargetAtTime(0.04 + s * 0.12, t, 0.2);
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

  function stopAllAmbience() {
    stopLoop("lava");
    stopLoop("city");
    stopLoop("zombie");
    stopTrainLoop();
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

  /** 列车进站提示音（叮咚 · 叮咚） */
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

  function playSubwayDing() {
    if (!ensure()) return;
    tone("sine", 880, 0.18, 0.12);
    setTimeout(() => {
      if (!ctx) return;
      tone("sine", 1175, 0.22, 0.1);
    }, 140);
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
    playRocket,
    playZombieBark,
    playGunShot,
    playDoorChime,
    playTrainArriveChime,
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
