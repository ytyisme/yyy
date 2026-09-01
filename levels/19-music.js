// 第 19 关：音乐 · 真曲优先，否则合成音（非原唱）
window.installMusic19 = function (S) {
  with (S) {
    function musicToast(msg, sec) {
      if (!musicScene) return;
      musicScene.toast = msg;
      musicScene.toastT = sec || 2.4;
    }

    function currentSong() {
      if (!musicScene || !musicScene.songs) return null;
      return musicScene.songs[musicScene.songIndex] || null;
    }

    function noteFreq(n) {
      if (n == null) return 0;
      if (typeof n === "number") return n;
      return Number(n.f) || 0;
    }

    function noteBeats(n) {
      if (n == null) return 1;
      if (typeof n === "number") return 1;
      return n.b != null ? n.b : 1;
    }

    function fireNote(n, song, fromWall) {
      if (!window.GameAudio) return;
      const freq = noteFreq(n);
      const beats = noteBeats(n);
      const bpm = (n && n.bpm) || (song && song.bpm) || 120;
      const dur = Math.max(0.1, (60 / bpm) * beats * 0.98);
      const style = (n && n.style) || (song && song.style) || "cool";
      if (n && n.color) musicScene.partColor = n.color;
      if (fromWall && GameAudio.playMusicWallHit) GameAudio.playMusicWallHit(style);
      if (GameAudio.playMusicNote) {
        GameAudio.playMusicNote(freq, style, dur, {
          beat: musicScene.noteIndex || 0,
          fromWall: !!fromWall,
        });
      }
    }

    function candidateSrcs(song) {
      const list = [];
      if (song.url) list.push(song.url);
      if (song.file) list.push(song.file);
      if (song.fileAlt) list.push(...song.fileAlt);
      return list.filter(Boolean);
    }

    async function probeSrc(src) {
      try {
        const res = await fetch(src, { method: "HEAD", cache: "no-store" });
        if (res.ok) return true;
      } catch (_) {}
      try {
        const res = await fetch(src, {
          method: "GET",
          headers: { Range: "bytes=0-1" },
          cache: "no-store",
        });
        if (res.ok || res.status === 206) return true;
      } catch (_) {}
      return false;
    }

    async function resolveSongSrc(song) {
      const cands = candidateSrcs(song);
      for (const src of cands) {
        if (/^https?:\/\//i.test(src)) return src;
        if (await probeSrc(src)) return src;
      }
      return null;
    }

    async function mergePlaylistJson() {
      if (!musicScene || musicScene.playlistLoaded) return;
      musicScene.playlistLoaded = true;
      try {
        const res = await fetch("audio/music/playlist.json?v=" + Date.now(), {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        const rows = Array.isArray(data) ? data : data && data.songs;
        if (!Array.isArray(rows)) return;
        for (const row of rows) {
          if (!row || !row.id) continue;
          const song = musicScene.songs.find((s) => s.id === row.id || s.title === row.title);
          if (!song) continue;
          if (row.url) song.url = String(row.url).trim();
          if (row.file) song.file = String(row.file).trim();
          if (row.title) song.title = String(row.title);
        }
      } catch (_) {}
    }

    function finishSongOrWin() {
      if (!musicScene || musicScene.done) return;
      musicScene.done = true;
      musicScene.playing = false;
      musicScene.trackProgress = 1;
      if (window.GameAudio && GameAudio.stopMusicTrack) GameAudio.stopMusicTrack();
      statusLabel.textContent = "合集播完 · 通关！";
      musicToast("Cursor合集完成 · 通关！", 2.5);
      if (window.GameAudio && GameAudio.playStar) GameAudio.playStar();
      setTimeout(() => {
        if (state === "playing" && level === 19) winLevel();
      }, 900);
    }

    function startSynthMode(song) {
      musicScene.mode = "synth";
      musicScene.playing = true;
      musicScene.noteIndex = 0;
      musicScene.songT = 0;
      musicScene.trackProgress = 0;
      musicScene.missingHint = "";
      musicScene.partTitle = "";
      musicScene.partColor = (song.parts && song.parts[0] && song.parts[0].color) || song.color;
      statusLabel.textContent = `Cursor合集·纯音乐，请欣赏`;
      musicToast("Cursor合集·纯音乐，请欣赏", 2.8);
    }

    async function startCurrentTrack() {
      if (!musicScene || musicScene.done) return;
      const song = currentSong();
      if (!song) return;
      musicScene.playing = false;
      musicScene.missingHint = "";
      musicScene.trackProgress = 0;
      musicScene.trackDuration = 0;
      musicScene.noteIndex = 0;
      musicScene.songT = 0;
      // 合集固定用合成连续演奏
      if (window.GameAudio && GameAudio.unlock) GameAudio.unlock();
      if (window.GameAudio && GameAudio.stopMusicTrack) GameAudio.stopMusicTrack();
      startSynthMode(song);
    }

    function advanceNote(fromWall) {
      const song = currentSong();
      if (!song || musicScene.done || musicScene.mode !== "synth") return;
      const notes = song.notes || [];
      if (musicScene.noteIndex >= notes.length) return;

      const n = notes[musicScene.noteIndex];
      fireNote(n, song, fromWall);
      musicScene.noteIndex += 1;
      musicScene.hitFlash = 0.16;
      musicScene.bounceCount += 1;
      const col = "#3b9eff";
      if (musicScene.ball) {
        spawnBurst(musicScene.ball.x, musicScene.ball.y, col, fromWall ? 10 : 6);
      }
      musicScene.trackProgress = notes.length ? musicScene.noteIndex / notes.length : 0;

      if (musicScene.noteIndex >= notes.length) {
        finishSongOrWin();
      } else {
        statusLabel.textContent = "Cursor合集·纯音乐，请欣赏";
      }
    }

    function tickSequencer(dt) {
      if (!musicScene.playing || musicScene.done || musicScene.mode !== "synth") return;
      const song = currentSong();
      if (!song) return;
      const notes = song.notes || [];
      if (musicScene.noteIndex >= notes.length) return;

      const cur = notes[musicScene.noteIndex];
      const bpm = (cur && cur.bpm) || song.bpm || 120;
      const beatSec = 60 / bpm;
      const need = beatSec * noteBeats(cur);
      musicScene.songT += dt;
      if (musicScene.songT >= need) {
        musicScene.songT -= need;
        advanceNote(false);
      }
    }

    function bounceBall(dt) {
      const b = musicScene.ball;
      if (!b) return;
      const minSpd = 170;
      if (player && !musicScene.done) {
        const dx = b.x - (player.x + player.w / 2);
        const dy = b.y - (player.y + player.h / 2);
        const dist = Math.hypot(dx, dy);
        if (dist < 36 && dist > 1) {
          b.vx += (dx / dist) * 420 * dt;
          b.vy += (dy / dist) * 420 * dt;
        }
      }

      b.vx *= 1 - Math.min(0.12, dt * 0.02);
      b.vy *= 1 - Math.min(0.12, dt * 0.02);
      let spd = Math.hypot(b.vx, b.vy);
      if (spd < minSpd && spd > 0.1) {
        b.vx = (b.vx / spd) * minSpd;
        b.vy = (b.vy / spd) * minSpd;
      } else if (spd < 0.1) {
        b.vx = minSpd * (Math.random() > 0.5 ? 1 : -1);
        b.vy = -minSpd * 0.85;
      }

      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.trail.push({ x: b.x, y: b.y, life: 0.35 });
      if (b.trail.length > 18) b.trail.shift();
      for (const t of b.trail) t.life -= dt;

      let hit = false;
      const r = b.r;
      for (const p of platforms) {
        if (!p.musicHit && p.theme !== "musicWall") continue;
        const nx = Math.max(p.x, Math.min(b.x, p.x + p.w));
        const ny = Math.max(p.y, Math.min(b.y, p.y + p.h));
        const ddx = b.x - nx;
        const ddy = b.y - ny;
        const d2 = ddx * ddx + ddy * ddy;
        if (d2 >= r * r) continue;
        const dist = Math.sqrt(d2) || 0.001;
        const overlap = r - dist;
        const ox = ddx / dist;
        const oy = ddy / dist;
        b.x += ox * overlap;
        b.y += oy * overlap;
        const dot = b.vx * ox + b.vy * oy;
        if (dot < 0) {
          b.vx -= 2 * dot * ox;
          b.vy -= 2 * dot * oy;
        }
        b.vx *= 1.02;
        b.vy *= 1.02;
        hit = true;
        musicScene.sparks.push({
          x: nx,
          y: ny,
          life: 0.25,
          color: "#3b9eff",
        });
      }

      const a = musicScene.arena;
      if (b.x < a.x + r + 16) {
        b.x = a.x + r + 16;
        b.vx = Math.abs(b.vx);
        hit = true;
      }
      if (b.x > a.x + a.w - r - 16) {
        b.x = a.x + a.w - r - 16;
        b.vx = -Math.abs(b.vx);
        hit = true;
      }
      if (b.y < a.y + r + 16) {
        b.y = a.y + r + 16;
        b.vy = Math.abs(b.vy);
        hit = true;
      }
      if (b.y > a.y + a.h - r - 16) {
        b.y = a.y + a.h - r - 16;
        b.vy = -Math.abs(b.vy);
        hit = true;
      }

      if (hit && time - musicScene.lastHitT > 0.09) {
        musicScene.lastHitT = time;
        musicScene.hitFlash = 0.2;
        const song = currentSong();
        const col = "#3b9eff";
        spawnBurst(b.x, b.y, col, 10);
        if (musicScene.mode === "synth") {
          advanceNote(true);
        } else if (window.GameAudio) {
          musicScene.bounceCount += 1;
          if (GameAudio.unlock) GameAudio.unlock();
          const notes = song && song.notes;
          const n = notes && notes[Math.min(musicScene.noteIndex, notes.length - 1)];
          const style = (n && n.style) || (song && song.style) || "cool";
          if (GameAudio.playMusicWallHit) GameAudio.playMusicWallHit(style);
          if (GameAudio.pulseMusicTrack) GameAudio.pulseMusicTrack(0.16, 100);
        }
      }

      spd = Math.hypot(b.vx, b.vy);
      if (spd > 420) {
        b.vx = (b.vx / spd) * 420;
        b.vy = (b.vy / spd) * 420;
      }
    }

    function initMusic19() {
      if (!musicScene) return;
      musicScene.songIndex = 0;
      musicScene.noteIndex = 0;
      musicScene.songT = 0;
      musicScene.done = false;
      musicScene.playing = false;
      musicScene.mode = "synth";
      musicScene.bounceCount = 0;
      musicScene.hitFlash = 0;
      musicScene.lastHitT = 0;
      musicScene.toast = "";
      musicScene.toastT = 0;
      musicScene.sparks = [];
      musicScene.trackProgress = 0;
      musicScene.trackDuration = 0;
      musicScene.missingHint = "";
      musicScene.partTitle = "";
      musicScene.partColor = "#9fd4ff";
      musicScene.playlistLoaded = true;
      musicScene.ball.x = 220;
      musicScene.ball.y = 200;
      musicScene.ball.vx = 240;
      musicScene.ball.vy = -200;
      musicScene.ball.trail = [];
      if (window.GameAudio) {
        if (GameAudio.stopMusicTrack) GameAudio.stopMusicTrack();
        if (GameAudio.unlock) GameAudio.unlock();
      }
      statusLabel.textContent = "Cursor合集·纯音乐，请欣赏";
      musicToast("Cursor合集·纯音乐，请欣赏", 3.5);
      startCurrentTrack();
    }

    function syncMusic19OnLeave() {
      if (window.GameAudio && GameAudio.stopMusicTrack) GameAudio.stopMusicTrack();
    }

    function updateMusic19(dt) {
      if (!musicScene || level !== 19 || state !== "playing") return;
      if (musicScene.toastT > 0) {
        musicScene.toastT -= dt;
        if (musicScene.toastT <= 0) musicScene.toast = "";
      }
      if (musicScene.hitFlash > 0) musicScene.hitFlash -= dt;
      for (const s of musicScene.sparks || []) s.life -= dt;
      musicScene.sparks = (musicScene.sparks || []).filter((s) => s.life > 0);

      if (musicScene.mode === "real") {
        const tr = window.GameAudio && GameAudio.getMusicTrack ? GameAudio.getMusicTrack() : null;
        if (tr && !isNaN(tr.duration) && tr.duration > 0) {
          musicScene.trackDuration = tr.duration;
          musicScene.trackProgress = tr.currentTime / tr.duration;
          const song = currentSong();
          if (song && musicScene.playing) {
            const left = Math.max(0, Math.ceil(tr.duration - tr.currentTime));
            statusLabel.textContent = `${song.title} · 剩余 ${left}s`;
          }
        }
      } else {
        tickSequencer(dt);
      }

      if (!musicScene.done) bounceBall(dt);
    }

    function drawMusicExtras() {
      if (!musicScene || level !== 19) return;
      const BALL_BLUE = "#3b9eff";
      const song = currentSong();
      const partColor = musicScene.partColor || (song && song.color) || "#9fd4ff";
      const a = musicScene.arena;
      const ax = a.x - cameraX;

      ctx.fillStyle = "rgba(20, 16, 40, 0.45)";
      ctx.fillRect(ax, a.y, a.w, a.h);
      if (musicScene.hitFlash > 0) {
        ctx.fillStyle = partColor;
        ctx.globalAlpha = musicScene.hitFlash * 0.35;
        ctx.fillRect(ax, a.y, a.w, a.h);
        ctx.globalAlpha = 1;
      }

      for (const t of musicScene.ball.trail || []) {
        if (t.life <= 0) continue;
        ctx.globalAlpha = Math.max(0, t.life / 0.35) * 0.5;
        ctx.fillStyle = BALL_BLUE;
        ctx.beginPath();
        ctx.arc(t.x - cameraX, t.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      for (const s of musicScene.sparks || []) {
        ctx.globalAlpha = Math.max(0, s.life / 0.25);
        ctx.fillStyle = s.color || "#fff";
        ctx.fillRect(s.x - cameraX - 3, s.y - 3, 6, 6);
      }
      ctx.globalAlpha = 1;

      const b = musicScene.ball;
      const bx = b.x - cameraX;
      const grad = ctx.createRadialGradient(bx - 3, b.y - 3, 2, bx, b.y, b.r);
      grad.addColorStop(0, "#d8ecff");
      grad.addColorStop(0.4, BALL_BLUE);
      grad.addColorStop(1, "#1a4a8a");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(bx, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#a8d4ff";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const topY = 24;
      ctx.fillStyle = "rgba(0,0,0,0.62)";
      ctx.fillRect(16, topY, 420, 92);
      ctx.fillStyle = "#ffd24a";
      ctx.font = "bold 14px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("第19关 · 音乐", 26, topY + 18);
      ctx.fillStyle = "#9fd4ff";
      ctx.font = "bold 12px 'Noto Sans SC', sans-serif";
      ctx.fillText(musicScene.disclaimer || "Cursor合集·纯音乐，请欣赏", 26, topY + 38);
      ctx.fillStyle = partColor;
      ctx.font = "12px 'Noto Sans SC', sans-serif";
      ctx.fillText("Cursor合集·纯音乐，请欣赏", 26, topY + 58);
      ctx.fillStyle = "#222";
      ctx.fillRect(26, topY + 68, 380, 8);
      ctx.fillStyle = partColor;
      ctx.fillRect(26, topY + 68, 380 * Math.max(0, Math.min(1, musicScene.trackProgress || 0)), 8);

      // 底部常驻提示
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(W / 2 - 200, H - 36, 400, 26);
      ctx.fillStyle = "#cdefff";
      ctx.font = "bold 12px 'Noto Sans SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Cursor合集·纯音乐，请欣赏", W / 2, H - 18);

      if (musicScene.toast && musicScene.toastT > 0) {
        ctx.fillStyle = "rgba(0,0,0,0.72)";
        ctx.fillRect(W / 2 - 210, 100, 420, 36);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 13px 'Noto Sans SC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(musicScene.toast, W / 2, 123);
      }
    }

    S.initMusic19 = initMusic19;
    S.updateMusic19 = updateMusic19;
    S.drawMusicExtras = drawMusicExtras;
    S.syncMusic19OnLeave = syncMusic19OnLeave;
  };
};
