const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

function cinema() {
  class Element {
    constructor() {
      this.listeners = new Map(); this.attributes = {}; this.children = [];
      this.hidden = false; this.dataset = {}; this.style = { setProperty() {} };
      const classes = new Set();
      this.classList = {
        add: (name) => classes.add(name), remove: (name) => classes.delete(name),
        contains: (name) => classes.has(name),
        toggle(name, on) { if (on) classes.add(name); else classes.delete(name); },
      };
    }
    addEventListener(name, callback) { this.listeners.set(name, callback); }
    emit(name, event = {}) { this.listeners.get(name)?.(event); }
    setAttribute(name, value) { this.attributes[name] = value; }
    removeAttribute(name) { delete this.attributes[name]; if (name === "src") this.src = undefined; }
    append(child) { this.children.push(child); }
    focus() {}
    querySelector() { return this.lastLetter; }
    querySelectorAll() { return this.letters || []; }
    pause() { this.ended = false; }
    play() { return Promise.resolve(); }
  }
  const html = fs.readFileSync(path.join(__dirname, "../season2-lv12.html"), "utf8");
  const elements = new Map([...html.matchAll(/<[^>]*\bid="([^"]+)"[^>]*>/g)].map((match) => {
    const element = new Element(); element.hidden = /\bhidden(?:\s|>)/.test(match[0]);
    return [match[1], element];
  }));
  const choices = Array.from({ length: 3 }, (_, i) => Object.assign(new Element(), { dataset: { film: String(i) } }));
  elements.get("studio-intro").letters = Array.from({ length: 6 }, () => new Element());
  elements.get("studio-intro").lastLetter = elements.get("studio-intro").letters[5];
  const document = Object.assign(new Element(), {
    getElementById: (id) => elements.get(id), querySelectorAll: () => choices,
    createElement: () => new Element(), hidden: false,
  });
  const window = new Element();
  const audio = { active: false, mode: null, impacts: [] };
  window.CinemaAudio = { create(callback) { return {
    start() { audio.active = true; audio.mode = "lobby"; callback(true); },
    startIntro() { audio.active = true; audio.mode = "intro"; callback(false); },
    impact(index) { audio.impacts.push(index); },
    stop() { audio.active = false; audio.mode = null; callback(false); },
  }; } };
  const timers = new Map(); let timerId = 0;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../season2-lv12.js"), "utf8"), {
    window, document, setTimeout(callback) { timers.set(++timerId, callback); return timerId; },
    clearTimeout(id) { timers.delete(id); },
  });
  const $ = (id) => elements.get(id);
  const click = (id) => $(id).emit("click");
  const land = () => $("studio-intro").emit("animationend", { animationName: "studio-arrange", target: $("studio-intro").lastLetter });
  return { $, click, land, choices, audio, timers, document };
}

test("the six-letter introduction finishes before the first film, music stops and lights dim", () => {
  const c = cinema();
  assert(c.$("cinema").classList.contains("lights-on"));
  c.click("play-film");
  assert.equal(c.$("movie-player").src, undefined);
  assert.equal(c.$("studio-intro").hidden, false);
  c.$("studio-intro").emit("animationend", { animationName: "studio-caption", target: {} });
  assert.equal(c.$("movie-player").src, undefined);
  c.land();
  assert.match(c.$("movie-player").src, /bvid=BV146YJ6pETw.*autoplay=1/);
  assert.equal(c.$("cinema").classList.contains("lights-on"), false);
  assert.equal(c.audio.active, false);
  assert.equal(c.timers.size, 0);
});

test("the third film's real end automatically starts the unnumbered ending", () => {
  const c = cinema(); c.click("play-film"); c.land();
  c.click("next-film");
  assert.match(c.$("movie-player").src, /BV1HqaN6NEpE/);
  c.click("next-film");
  assert.equal(c.$("local-movie").hidden, false);
  assert.equal(c.$("next-film").hidden, true);
  assert.equal(c.$("ending-video").hidden, true);
  c.$("local-movie").ended = true;
  c.$("local-movie").emit("ended");
  assert.equal(c.$("movie-player").src, undefined);
  assert.equal(c.$("ending-video").hidden, false);
  assert.equal(c.$("movie-controls").hidden, true);
});

test("switching during the introduction cancels its pending playback", () => {
  const c = cinema(); c.click("play-film");
  const staleCallback = [...c.timers.values()][0];
  c.choices[2].emit("click"); staleCallback(); c.land();
  assert.equal(c.$("movie-player").src, undefined);
  assert.equal(c.$("studio-intro").hidden, true);
  assert(c.$("cinema").classList.contains("lights-on"));
  assert.match(c.$("original-film").href, /BV1Z8gP6eEFL/);
});

test("leaving during the introduction cannot start a film after completion; re-entry resets the show", () => {
  const c = cinema(); c.click("play-film");
  const staleCallback = [...c.timers.values()][0];
  c.click("finish"); staleCallback();
  assert.equal(c.$("movie-player").src, undefined);
  assert.equal(c.$("complete").hidden, true);
  assert.equal(c.$("ending-video").hidden, false);
  c.$("ending-video").emit("ended");
  assert.equal(c.$("complete").hidden, false);
  assert.equal(c.audio.active, true);
  c.click("again");
  assert.equal(c.$("cinema").hidden, false);
  assert(c.$("cinema").classList.contains("lights-on"));
  assert.match(c.$("original-film").href, /BV146YJ6pETw/);
});

test("each letter plays one impact on its actual landing, with a separate introduction score", () => {
  const c = cinema(); c.click("play-film");
  assert.equal(c.audio.mode, "intro");
  for (const letter of c.$("studio-intro").letters) {
    const event = { animationName: "studio-fall", target: letter };
    c.$("studio-intro").emit("animationend", event);
    c.$("studio-intro").emit("animationend", event);
  }
  assert.deepEqual(c.audio.impacts, [0, 1, 2, 3, 4, 5]);
  assert.equal(c.$("movie-player").src, undefined);
  c.land();
  assert.equal(c.audio.mode, null);
});

test("the hall stays dark during the ending and relights only on its real ended event", () => {
  const c = cinema(); c.click("play-film"); c.land(); c.click("finish");
  assert.equal(c.$("cinema").classList.contains("lights-on"), false);
  assert.equal(c.$("complete").hidden, true);
  assert.equal(c.$("movie-controls").hidden, true);
  c.$("ending-video").emit("ended");
  assert.equal(c.$("cinema").classList.contains("lights-on"), true);
  assert.equal(c.$("cinema").hidden, false);
  assert.equal(c.$("screen-goodbye").hidden, false);
  const html = fs.readFileSync(path.join(__dirname, "../season2-lv12.html"), "utf8");
  const videoTag = html.match(/<video\b[^>]*id="ending-video"[^>]*>/)[0];
  assert.doesNotMatch(videoTag, /\bcontrols\b/);
  assert.equal((html.match(/data-film=/g) || []).length, 3);
});

test("pause, buffering and stale third-film events cannot interrupt another film", () => {
  const c = cinema(); c.choices[2].emit("click"); c.click("play-film"); c.land();
  c.$("local-movie").emit("pause");
  c.$("local-movie").emit("waiting");
  c.$("local-movie").emit("ended"); // A synthetic event without an ended media state is ignored.
  assert.equal(c.$("ending-video").hidden, true);
  c.choices[0].emit("click");
  c.$("local-movie").ended = true;
  c.$("local-movie").emit("ended");
  assert.equal(c.$("ending-video").hidden, true);
  assert.match(c.$("movie-player").src, /BV146YJ6pETw/);
});

test("ending completion enables lobby music automatically and keeps its control usable", () => {
  const c = cinema(); c.click("music-toggle");
  assert.equal(c.audio.active, false);
  c.choices[2].emit("click"); c.click("play-film"); c.land();
  c.$("local-movie").ended = true; c.$("local-movie").emit("ended");
  assert.equal(c.audio.active, false);
  c.$("ending-video").emit("ended");
  assert.equal(c.audio.mode, "lobby");
  assert.equal(c.$("music-toggle").hidden, false);
  c.document.hidden = true; c.document.emit("visibilitychange");
  assert.equal(c.audio.active, false);
  c.document.hidden = false; c.document.emit("visibilitychange");
  assert.equal(c.audio.mode, "lobby");
  c.click("music-toggle"); assert.equal(c.audio.active, false);
});

test("music remains off after the user disables it and stops when the page is hidden", () => {
  const c = cinema();
  assert.equal(c.audio.active, true);
  c.click("music-toggle");
  c.document.emit("pointerdown", { target: {} });
  assert.equal(c.audio.active, false);
  c.click("music-toggle");
  assert.equal(c.audio.active, true);
  c.document.hidden = true; c.document.emit("visibilitychange");
  assert.equal(c.audio.active, false);
  c.document.hidden = false; c.document.emit("visibilitychange");
  assert.equal(c.audio.active, true);
});

test("a delayed browser audio unlock cannot restart music after it was stopped", async () => {
  let context, resume, intervalCount = 0;
  class AudioContext {
    constructor() { context = this; this.state = "suspended"; this.currentTime = 0; }
    createGain() { return { gain: { value: 0, cancelScheduledValues() {}, setValueAtTime() {} }, connect() {} }; }
    resume() { return new Promise((resolve) => { resume = resolve; }); }
  }
  const window = { AudioContext };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../lib/cinema-audio.js"), "utf8"), {
    window, setInterval() { intervalCount++; return 1; }, clearInterval() {},
  });
  const audio = window.CinemaAudio.create();
  audio.start(); audio.stop();
  context.state = "running"; context.onstatechange(); resume();
  await Promise.resolve();
  assert.equal(intervalCount, 0);
});

test("the real audio module replaces piano voices with a fanfare, emits impacts and cleans them up", () => {
  const voices = [], timers = new Set();
  const parameter = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {} });
  class AudioContext {
    constructor() { this.state = "running"; this.currentTime = 0; }
    createGain() { return { gain: parameter(), connect() {}, disconnect() {} }; }
    createOscillator() {
      const voice = { frequency: parameter(), connect() {}, disconnect() {}, start() {}, stops: 0, stop() { this.stops++; } };
      voices.push(voice); return voice;
    }
  }
  const window = { AudioContext };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../lib/cinema-audio.js"), "utf8"), {
    window, setInterval() { const id = timers.size + 1; timers.add(id); return id; }, clearInterval(id) { timers.delete(id); },
  });
  const audio = window.CinemaAudio.create(); audio.start();
  const lobbyVoices = voices.slice();
  assert.equal(timers.size, 1);
  audio.startIntro();
  assert.equal(timers.size, 0);
  assert(lobbyVoices.every((voice) => voice.stops === 2));
  assert(voices.some((voice) => voice.type === "triangle"));
  const beforeImpact = voices.length;
  audio.impact(4);
  assert.equal(voices.length, beforeImpact + 4);
  audio.stop();
  assert(voices.every((voice) => voice.stops === 2));
  const afterStop = voices.length;
  audio.impact(1);
  assert.equal(voices.length, afterStop);
});
