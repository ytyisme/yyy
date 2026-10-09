const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function concert() {
  class Element {
    constructor() {
      this.listeners = new Map(); this.children = []; this.attributes = {};
      this.style = { setProperty() {} }; this.hidden = false; this.paused = true;
      this.duration = NaN; this.currentTime = 0; this.ended = false;
      const classes = new Set();
      this.classList = { toggle(name, on) { if (on) classes.add(name); else classes.delete(name); }, contains: (name) => classes.has(name) };
    }
    addEventListener(name, callback) { this.listeners.set(name, callback); }
    emit(name) { this.listeners.get(name)?.(); }
    append(...children) { this.children.push(...children); }
    setAttribute(name, value) { this.attributes[name] = value; }
    focus() {}
    pause() { this.paused = true; this.emit("pause"); }
    play() { this.paused = false; this.ended = false; return Promise.resolve(); }
    load() { this.duration = NaN; this.currentTime = 0; this.ended = false; }
  }
  const html = fs.readFileSync(path.join(__dirname, "../season2-lv13.html"), "utf8");
  const elements = new Map([...html.matchAll(/<[^>]*\bid="([^"]+)"[^>]*>/g)].map((match) => {
    const element = new Element(); element.hidden = /\bhidden(?:\s|>)/.test(match[0]);
    return [match[1], element];
  }));
  const document = { querySelector: () => new Element(), getElementById: (id) => elements.get(id), createElement: () => new Element() };
  const window = new Element();
  const context = vm.createContext({ window, document });
  for (const file of ["season2-lv13-data.js", "season2-lv13.js"]) vm.runInContext(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), context);
  const $ = (id) => elements.get(id);
  const choose = (index) => $("song-list").children[index].emit("click");
  return { $, choose, window, html, audio: $("song-audio") };
}

test("the nine requested songs use local audio assets with no video or iframe", () => {
  const c = concert();
  assert.doesNotMatch(c.html, /<(?:video|iframe)\b/i);
  assert.deepEqual(Array.from(c.window.ConcertTracks, (track) => track.bvid), ["BV17oHe6UENz", "BV1PK4y1b7dt", "BV1NwHi6PEcZ", "BV1fTpP6YEng", "BV13wrLBaE2E", "BV1DLuS6mEXr", "BV1HkwYzDEg1", "BV1ejADzsEXD", "BV1FuMgziERS"]);
  assert.equal(c.$("song-list").children.length, 9);
  for (const track of c.window.ConcertTracks) assert(fs.statSync(path.join(__dirname, "..", track.file)).size > 10000);
});

test("choosing another song replaces the audio and updates its title and selection", () => {
  const c = concert(); c.choose(0); c.audio.emit("playing");
  assert.match(c.audio.src, /song-1\.m4a$/);
  assert(c.$("stage").classList.contains("is-playing"));
  c.choose(1);
  assert.match(c.audio.src, /song-2\.m4a$/);
  assert.equal(c.$("song-title").textContent, "Mojito");
  assert.equal(c.$("song-list").children[0].attributes["aria-pressed"], "false");
  assert.equal(c.$("song-list").children[1].attributes["aria-pressed"], "true");
  c.audio.emit("playing"); c.$("play-toggle").emit("click");
  assert.equal(c.audio.paused, true);
  assert.equal(c.$("stage").classList.contains("is-playing"), false);
});

test("next song wraps to the first song; volume and seek controls affect playback", () => {
  const c = concert(); c.choose(8); c.$("next-song").emit("click");
  assert.match(c.audio.src, /song-1\.m4a$/);
  c.audio.duration = 226; c.audio.emit("loadedmetadata");
  c.$("seek").value = 72; c.$("seek").emit("input");
  assert.equal(c.audio.currentTime, 72);
  assert.equal(c.$("elapsed").textContent, "1:12");
  c.$("volume").value = 35; c.$("volume").emit("input");
  assert.equal(c.audio.volume, .35);
});

test("only a real song end clears the level, and songs remain selectable afterward", () => {
  const c = concert(); c.choose(2);
  c.audio.emit("waiting"); c.audio.emit("ended");
  assert.equal(c.$("complete").hidden, true);
  c.audio.ended = true; c.audio.emit("ended");
  assert.equal(c.$("complete").hidden, false);
  c.choose(3);
  assert.equal(c.$("complete").hidden, true);
  assert.match(c.audio.src, /song-4\.m4a$/);
});

test("a rejected play from an earlier song cannot overwrite the newly selected song", async () => {
  const c = concert(); let rejectOld;
  c.audio.play = () => new Promise((resolve, reject) => { rejectOld = reject; });
  c.choose(0);
  c.audio.play = () => Promise.resolve(); c.choose(1);
  rejectOld(new Error("old playback canceled")); await Promise.resolve();
  assert.equal(c.$("song-title").textContent, "Mojito");
  assert.doesNotMatch(c.$("status").textContent, /未能开始/);
});

test("leaving the page pauses the music and stage motion", () => {
  const c = concert(); c.choose(0); c.audio.emit("playing"); c.window.emit("pagehide");
  assert.equal(c.audio.paused, true);
  assert.equal(c.$("stage").classList.contains("is-playing"), false);
});
