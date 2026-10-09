(() => {
  const $ = (id) => document.getElementById(id);
  const films = [
    { bvid: "BV146YJ6pETw", label: "第一部" },
    { bvid: "BV1HqaN6NEpE", label: "第二部" },
    { bvid: "BV1Z8gP6eEFL", label: "第三部" },
  ];
  const player = $("movie-player");
  const localMovie = $("local-movie");
  const ending = $("ending-video");
  const ticket = $("ticket-dialog");
  const choices = [...document.querySelectorAll(".film-choice")];
  let selected = 0;
  let phase = "lobby";
  let introTimer;
  let playbackRun = 0;
  let musicEnabled = true;
  let musicPlaying = false;
  const intro = $("studio-intro");
  const logoLetters = [...intro.querySelectorAll(".logo-letter")];
  const landedLetters = new Set();
  const isWaiting = () => phase === "lobby" || phase === "complete";
  const music = window.CinemaAudio.create((active) => {
    musicPlaying = active;
    $("music-toggle").setAttribute("aria-pressed", String(active));
    $("music-toggle").textContent = active ? "♫ 关闭候场音乐" : musicEnabled ? "♫ 开启候场音乐" : "♫ 候场音乐已关闭";
  });

  function setPhase(next) {
    phase = next;
    $("cinema").classList.toggle("lights-on", phase === "lobby" || phase === "intro" || phase === "complete");
    $("light-status").textContent = phase === "movie" || phase === "outro" ? "放映中 · 灯光已调暗" : phase === "intro" ? "开场中 · 灯光明亮" : phase === "complete" ? "散场中 · 灯光明亮" : "候场中 · 灯光明亮";
    $("music-toggle").hidden = !isWaiting();
    $("next-film").hidden = phase !== "movie" || selected === films.length - 1;
    $("next-film").textContent = "下一部 →";
    $("movie-controls").hidden = phase === "outro" || phase === "complete";
    $("hall-footer").hidden = phase === "outro" || phase === "complete";
    if (isWaiting() && musicEnabled && !document.hidden) music.start();
    else if (phase !== "intro") music.stop();
  }

  function stopFilm() {
    playbackRun++;
    player.removeAttribute("src");
    player.hidden = true;
    localMovie.pause();
    localMovie.currentTime = 0;
    localMovie.hidden = true;
    clearTimeout(introTimer);
    intro.classList.remove("is-running");
    intro.hidden = true;
    ending.pause();
    ending.currentTime = 0;
    ending.hidden = true;
    $("screen-goodbye").hidden = true;
    landedLetters.clear();
  }

  function syncFilm(index) {
    selected = index;
    choices.forEach((button, i) => {
      button.classList.toggle("selected", i === selected);
      button.setAttribute("aria-pressed", String(i === selected));
    });
    $("original-film").href = `https://www.bilibili.com/video/${films[selected].bvid}/`;
    $("welcome-title").textContent = `今日影片 · ${films[selected].label}`;
  }

  function selectFilm(index) {
    if (!films[index] || index === selected) return;
    const inShow = phase === "movie";
    stopFilm();
    syncFilm(index);
    if (inShow) { playFilm(); return; }
    $("screen-welcome").hidden = false;
    setPhase("lobby");
    $("play-status").textContent = `已选择${films[selected].label}，点击「开始放映」。`;
  }

  function playFilm() {
    if (phase === "complete") return;
    stopFilm();
    const film = films[selected];
    setPhase("movie");
    $("screen-welcome").hidden = true;
    if (selected === films.length - 1) {
      localMovie.hidden = false;
      const run = playbackRun;
      $("play-status").textContent = "正在放映第三部，播完后会自动播放片尾。";
      const attempt = localMovie.play();
      if (attempt) attempt.catch(() => {
        if (phase === "movie" && run === playbackRun) $("play-status").textContent = "请点击银幕内播放键开始第三部；播完后会自动播放片尾。";
      });
      return;
    }
    player.title = `${film.label}影片 · B站播放器`;
    player.src = `https://player.bilibili.com/player.html?bvid=${film.bvid}&p=1&autoplay=1&danmaku=0`;
    player.hidden = false;
    $("play-status").textContent = `正在放映${film.label}。若浏览器拦截自动播放，请点击银幕内播放键；无法播放时可在 B站打开。`;
  }

  function finishIntro() {
    if (phase === "intro") playFilm();
  }
  intro.addEventListener("animationend", (event) => {
    if (phase !== "intro") return;
    const index = logoLetters.indexOf(event.target);
    if (event.animationName === "studio-fall" && index !== -1 && !landedLetters.has(event.target)) {
      landedLetters.add(event.target);
      music.impact(index);
    }
    if (event.animationName === "studio-arrange" && event.target === logoLetters[logoLetters.length - 1]) finishIntro();
  });
  $("play-film").addEventListener("click", () => {
    if (phase !== "lobby") return;
    setPhase("intro");
    music.startIntro();
    $("screen-welcome").hidden = true;
    intro.hidden = false;
    intro.classList.add("is-running");
    $("play-status").textContent = "岩浆跑酷影业 · 开场动画结束后开始放映。";
    // The fallback covers missed animation events; this never times the films.
    introTimer = setTimeout(finishIntro, 5200);
  });
  $("next-film").addEventListener("click", () => {
    if (phase === "outro") { startOutro(); return; }
    if (phase !== "movie") return;
    if (selected < films.length - 1) selectFilm(selected + 1);
    else startOutro();
  });
  player.addEventListener("error", () => {
    if (phase === "movie") $("play-status").textContent = "播放器暂时无法连接，请点击「在 B站打开本片」观看。";
  });
  localMovie.addEventListener("ended", () => {
    if (phase === "movie" && selected === films.length - 1 && localMovie.ended) startOutro();
  });
  localMovie.addEventListener("error", () => {
    if (phase === "movie" && selected === films.length - 1) $("play-status").textContent = "第三部暂时无法播放，请刷新重试，或点击「在 B站打开本片」。";
  });
  choices.forEach((button) => button.addEventListener("click", () => selectFilm(Number(button.dataset.film))));

  $("music-toggle").addEventListener("click", () => {
    if (!isWaiting()) return;
    musicEnabled = !musicPlaying;
    if (musicEnabled) music.start();
    else music.stop();
  });
  function unlockMusic(event) {
    if (event.target.closest && event.target.closest("#music-toggle, #play-film")) return;
    if (isWaiting() && musicEnabled) music.start();
  }
  document.addEventListener("pointerdown", unlockMusic);
  document.addEventListener("keydown", unlockMusic);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) music.stop();
    else if (isWaiting() && musicEnabled) music.start();
  });
  window.addEventListener("pagehide", () => {
    stopFilm();
    music.stop();
  });
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    if (phase === "complete") { setPhase("complete"); return; }
    $("screen-welcome").hidden = false;
    setPhase("lobby");
  });

  $("ticket-button").addEventListener("click", () => ticket.showModal());
  $("close-ticket").addEventListener("click", () => ticket.close());
  ticket.addEventListener("click", (event) => {
    if (event.target !== ticket) return;
    const rect = ticket.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) ticket.close();
  });

  const outfits = ["#718d86", "#b58a55", "#73658e", "#637caa", "#a16374", "#8e9870"];
  const hair = ["#292634", "#604136", "#353342", "#83674d", "#242735"];
  const snacks = [{ icon: "🍿", action: "吃爆米花" }, { icon: "🥤", action: "喝可乐" }, { icon: "🍟", action: "吃薯条" }];
  for (let row = 0; row < 3; row++) {
    const letter = "ABC"[row];
    const seats = document.createElement("div");
    seats.className = "seat-row";
    const rowLabel = document.createElement("span");
    rowLabel.className = "row-letter";
    rowLabel.textContent = letter;
    rowLabel.setAttribute("aria-hidden", "true");
    seats.append(rowLabel);
    for (let number = 1; number <= 8; number++) {
      if (number === 5) {
        const aisle = document.createElement("div");
        aisle.className = "aisle";
        aisle.setAttribute("aria-hidden", "true");
        seats.append(aisle);
      }
      const yours = row === 0 && number === 3;
      const id = row * 8 + number;
      const snack = snacks[(id + row) % snacks.length];
      const hasSnack = !yours && id % 4 !== 0;
      const seat = document.createElement("div");
      seat.className = `seat${yours ? " yours" : ""}`;
      seat.setAttribute("role", "img");
      seat.setAttribute("aria-label", `${letter}排${number}座：${yours ? "你" : hasSnack ? `NPC 正在${snack.action}` : "NPC 正在看电影"}`);
      seat.style.setProperty("--shirt", outfits[id % outfits.length]);
      seat.style.setProperty("--hair", hair[id % hair.length]);
      seat.style.setProperty("--skin", id % 3 ? "#dfaf8d" : "#bd896f");
      seat.style.setProperty("--delay", `${-id * .63}s`);
      seat.innerHTML = `<div class="spectator"><div class="npc-body"></div><div class="npc-head"></div></div><div class="seat-back"></div>${hasSnack ? `<span class="snack">${snack.icon}</span>` : ""}<span class="seat-label">${yours ? "你 · A3" : `${letter}${number}`}</span>`;
      seats.append(seat);
    }
    $("seat-rows").append(seats);
  }

  function completeShow() {
    if (phase !== "outro") return;
    stopFilm();
    musicEnabled = true;
    setPhase("complete");
    $("screen-welcome").hidden = true;
    $("screen-goodbye").hidden = false;
    $("complete").hidden = false;
    $("play-status").textContent = "片尾播放完毕，灯光已亮起，候场音乐自动开启。第 12 关通关！";
    $("screen-goodbye").focus({ preventScroll: true });
  }
  function startOutro() {
    if (phase === "complete") return;
    stopFilm();
    setPhase("outro");
    $("screen-welcome").hidden = true;
    ending.hidden = false;
    $("play-status").textContent = "片尾放映中，请稍候；播放完毕后会自动亮灯。";
    const attempt = ending.play();
    if (attempt) attempt.catch(() => {
      if (phase !== "outro") return;
      $("play-status").textContent = "片尾未能开始播放，请重试。";
      $("next-film").hidden = false;
      $("next-film").textContent = "重试片尾";
    });
  }
  ending.addEventListener("ended", completeShow);
  $("finish").addEventListener("click", startOutro);
  $("again").addEventListener("click", () => {
    $("complete").hidden = true;
    $("cinema").hidden = false;
    syncFilm(0);
    $("screen-welcome").hidden = false;
    setPhase("lobby");
    $("play-status").textContent = "欢迎再次入座，点击「开始放映」再看一场。";
    $("play-film").focus();
  });
  setPhase("lobby");
})();
