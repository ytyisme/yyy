const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const page = fs.readFileSync(path.join(root, "season3-lv2.html"), "utf8");
const home = fs.readFileSync(path.join(root, "season3.html"), "utf8");
const script = fs.readFileSync(path.join(root, "season3-lv2.js"), "utf8");

test("third-season music level has no home entry and only local audio", () => {
  assert.doesNotMatch(home, /href="season3-lv2\.html"/);
  assert.doesNotMatch(page, /<iframe\b/i);
  assert.doesNotMatch(page, /打开原游戏/);
  assert.doesNotMatch(page, /bilibili\.com/i);
  assert.match(page, /background: #fff5c5/);
  assert.match(page, /height: min\(78vh, 850px\); min-height: 430px/);
  assert.match(page, /<canvas\b[^>]*id="beatline"/);
  assert.match(page, /<audio\b[^>]*src="assets\/season3\/dream-wings\.m4a"/);
  assert.match(page, /<script src="season3-lv2\.js"><\/script>/);
  assert.match(script, /requestAnimationFrame/);
  assert.match(script, /BPM = 82/);
  assert(fs.statSync(path.join(root, "assets/season3/dream-wings.m4a")).size > 10000);
});
