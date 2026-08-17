(() => {
  let ctx = null;
  let master = null;
  let unlocked = false;

  const loops = {
    lava: null,
    city: null,
    zombie: null,
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

  function stopAllAmbience() {
    stopLoop("lava");
    stopLoop("city");
    stopLoop("zombie");
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
        playFootstep();
        footTimer = opts.fast ? 0.22 : 0.32;
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
    playStar,
    playWin,
    playDeath,
    playClick,
    playRocket,
    playZombieBark,
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
