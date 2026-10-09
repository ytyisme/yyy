// Original lounge music, a separate studio fanfare, and letter impact sounds.
(() => {
  function create(onState = () => {}) {
    let context, output, timer;
    let wanted = false;
    let nextNote = 0, beat = 0;
    let introScheduled = false, introWallStart = 0;
    const voices = new Set();
    const chords = [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65]];
    const step = .36;
    function note(midi, at, duration, volume, brass = false) {
      const envelope = context.createGain();
      envelope.gain.setValueAtTime(0, at);
      envelope.gain.linearRampToValueAtTime(volume, at + (brass ? .12 : .018));
      envelope.gain.exponentialRampToValueAtTime(.0001, at + duration);
      envelope.connect(output);
      let left = 3;
      [1, 2, 3].forEach((harmonic, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = brass && index === 0 ? "triangle" : "sine";
        oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12) * harmonic;
        gain.gain.value = [1, .18, .045][index];
        oscillator.connect(gain);
        gain.connect(envelope);
        voices.add(oscillator);
        oscillator.onended = () => {
          voices.delete(oscillator);
          oscillator.disconnect();
          gain.disconnect();
          if (--left === 0) envelope.disconnect();
        };
        oscillator.start(at);
        oscillator.stop(at + duration + .03);
      });
    }
    function schedule() {
      if (!wanted || context.state !== "running" || timer) return;
      if (wanted === "intro") {
        if (introScheduled) return;
        introScheduled = true;
        output.gain.cancelScheduledValues(context.currentTime);
        output.gain.setValueAtTime(.38, context.currentTime);
        const elapsed = (Date.now() - introWallStart) / 1000;
        // A rising, warm fanfare replaces the lobby piano during the logo.
        const score = [[0, [48, 55, 60], 1.5], [.65, [50, 57, 62], 1.25], [1.25, [52, 59, 64], 1.2], [2.25, [55, 62, 67], 1.4], [3.1, [48, 55, 60, 64, 67, 72], 1.5]];
        for (const [offset, pitches, duration] of score) {
          if (offset < elapsed - .15) continue;
          pitches.forEach((pitch, i) => note(pitch, context.currentTime + Math.max(.01, offset - elapsed) + i * .018, duration, .06, true));
        }
        return;
      }
      output.gain.cancelScheduledValues(context.currentTime);
      output.gain.setValueAtTime(0, context.currentTime);
      output.gain.linearRampToValueAtTime(.28, context.currentTime + .5);
      nextNote = context.currentTime + .06;
      beat = 0;
      const tick = () => {
        if (!wanted || context.state !== "running") return;
        // Don't replay a backlog after a background tab was throttled.
        nextNote = Math.max(nextNote, context.currentTime);
        while (nextNote < context.currentTime + .3) {
          const chord = chords[Math.floor(beat / 16) % chords.length];
          note(chord[[0, 2, 1, 3, 2, 1, 3, 2][beat % 8]] + 12, nextNote, 1.45, .11);
          if (beat % 8 === 0) {
            note(chord[0] - 12, nextNote, 2.3, .12);
            chord.forEach((pitch, i) => note(pitch, nextNote + i * .025, 2, .035));
          }
          beat++;
          nextNote += step;
        }
      };
      tick();
      timer = setInterval(tick, 100);
      onState(true);
    }
    function stop() {
      wanted = false;
      clearInterval(timer);
      timer = null;
      if (context && output) {
        output.gain.cancelScheduledValues(context.currentTime);
        output.gain.setValueAtTime(0, context.currentTime);
      }
      for (const voice of voices) { try { voice.stop(); } catch (_) {} }
      voices.clear();
      onState(false);
    }
    function startMode(mode) {
      wanted = mode;
      try {
        if (!context) {
          const Audio = window.AudioContext || window.webkitAudioContext;
          if (!Audio) { onState(false); return; }
          context = new Audio();
          output = context.createGain();
          output.gain.value = 0;
          output.connect(context.destination);
          context.onstatechange = () => {
            if (wanted && context.state === "running") schedule();
            else if (context.state !== "running") {
              clearInterval(timer);
              timer = null;
              onState(false);
            }
          };
        }
        if (context.state === "running") schedule();
        else context.resume().then(() => { if (wanted) schedule(); }).catch(() => onState(false));
      } catch (_) { stop(); }
    }
    function startIntro() {
      stop();
      introScheduled = false;
      introWallStart = Date.now();
      startMode("intro");
    }
    function impact(index = 0) {
      if (wanted !== "intro" || !context || context.state !== "running") return;
      const at = context.currentTime;
      const hit = context.createOscillator();
      const gain = context.createGain();
      hit.type = "sine";
      hit.frequency.setValueAtTime(165 + index * 13, at);
      hit.frequency.exponentialRampToValueAtTime(42 + index * 3, at + .19);
      gain.gain.setValueAtTime(.0001, at);
      gain.gain.exponentialRampToValueAtTime(.28, at + .006);
      gain.gain.exponentialRampToValueAtTime(.0001, at + .27);
      hit.connect(gain); gain.connect(output); voices.add(hit);
      hit.onended = () => { voices.delete(hit); hit.disconnect(); gain.disconnect(); };
      hit.start(at); hit.stop(at + .3);
      // A short wooden clack gives each landing a clear edge above the bass.
      note(77 + index * 2, at, .1, .1);
    }
    return { start: () => startMode("lobby"), startIntro, impact, stop };
  }
  window.CinemaAudio = { create };
})();
