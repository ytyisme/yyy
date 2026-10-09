(() => {
  const $ = (id) => document.getElementById(id);
  const tracks = window.ConcertTracks;
  const audio = $("song-audio");
  let selected = -1;
  let playRequest = 0;
  let cleared = false;
  const buttons = [];
  const formatTime = (seconds) => {
    const whole = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
  };

  function showPlaying(playing) {
    $("stage").classList.toggle("is-playing", playing);
    $("play-toggle").textContent = playing ? "Ⅱ 暂停" : "▶ 播放";
    $("stage-state").textContent = selected < 0 ? "等待你的第一首歌" : playing ? "正在演唱 · 一起挥动荧光棒" : audio.ended ? "演唱结束 · 期待你的下一首" : "已暂停 · 音乐等你回来";
  }

  function updateProgress() {
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    $("seek").disabled = duration <= 0;
    $("seek").max = duration || 100;
    $("seek").value = Math.min(audio.currentTime || 0, duration);
    $("seek").setAttribute("aria-valuetext", `${formatTime(audio.currentTime)} / ${formatTime(duration)}`);
    $("elapsed").textContent = formatTime(audio.currentTime);
    $("duration").textContent = formatTime(duration || (selected < 0 ? 0 : tracks[selected].duration));
  }

  function play() {
    if (selected < 0) return;
    const request = ++playRequest;
    if (audio.ended) audio.currentTime = 0;
    $("status").textContent = `正在准备《${tracks[selected].title}》……`;
    const attempt = audio.play();
    if (attempt) attempt.catch(() => {
      if (request !== playRequest) return;
      showPlaying(false);
      $("status").textContent = "播放未能开始，请点击「播放」再试一次。";
    });
  }

  function selectSong(index) {
    if (!tracks[index]) return;
    $("complete").hidden = true;
    if (selected === index) { if (audio.paused || audio.ended) play(); return; }
    playRequest++;
    audio.pause();
    selected = index;
    audio.src = tracks[index].file;
    audio.load();
    buttons.forEach((button, i) => {
      button.classList.toggle("selected", i === index);
      button.setAttribute("aria-pressed", String(i === index));
    });
    $("song-title").textContent = tracks[index].title;
    $("song-subtitle").textContent = `歌单 ${String(index + 1).padStart(2, "0")} / ${String(tracks.length).padStart(2, "0")} · ${formatTime(tracks[index].duration)}`;
    $("play-toggle").disabled = false;
    $("next-song").disabled = false;
    showPlaying(false);
    updateProgress();
    play();
  }

  document.querySelector(".track-count").textContent = `${String(tracks.length).padStart(2, "0")} 首`;

  tracks.forEach((track, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "song-choice";
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-label", `点歌：${track.title}`);
    const number = document.createElement("span"); number.className = "song-number"; number.textContent = String(index + 1).padStart(2, "0");
    const info = document.createElement("span"); info.className = "song-info";
    const title = document.createElement("span"); title.className = "song-name"; title.textContent = track.title;
    const length = document.createElement("span"); length.className = "song-length"; length.textContent = formatTime(track.duration);
    const icon = document.createElement("span"); icon.className = "song-icon"; icon.textContent = "♫"; icon.setAttribute("aria-hidden", "true");
    info.append(title, length); button.append(number, info, icon);
    button.addEventListener("click", () => selectSong(index));
    buttons.push(button); $("song-list").append(button);
  });

  for (let i = 0; i < 14; i++) {
    const fan = document.createElement("span"); fan.className = "fan";
    fan.style.setProperty("--i", String(i));
    fan.style.setProperty("--glow", ["#f3a2dc", "#93efdd", "#be9aff"][i % 3]);
    fan.style.setProperty("--angle", `${i % 2 ? 24 : -24}deg`);
    $("crowd").append(fan);
  }

  $("play-toggle").addEventListener("click", () => {
    if (selected < 0) return;
    if (audio.paused || audio.ended) play();
    else { playRequest++; audio.pause(); }
  });
  $("next-song").addEventListener("click", () => {
    if (selected >= 0) selectSong((selected + 1) % tracks.length);
  });
  $("seek").addEventListener("input", () => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = Math.max(0, Math.min(audio.duration, Number($("seek").value) || 0));
      updateProgress();
    }
  });
  audio.volume = .8;
  $("volume").addEventListener("input", () => { audio.volume = Math.max(0, Math.min(1, (Number($("volume").value) || 0) / 100)); });
  audio.addEventListener("playing", () => {
    if (selected < 0 || audio.paused) return;
    showPlaying(true);
    $("status").textContent = `正在演唱《${tracks[selected].title}》，也可以随时选择另一首。`;
  });
  audio.addEventListener("pause", () => {
    showPlaying(false);
    if (selected >= 0 && !audio.ended) $("status").textContent = "已暂停，点击「播放」继续听。";
  });
  audio.addEventListener("waiting", () => {
    showPlaying(false);
    if (selected >= 0) $("status").textContent = "正在加载音频，请稍候……";
  });
  ["loadedmetadata", "durationchange", "timeupdate", "seeked"].forEach((event) => audio.addEventListener(event, updateProgress));
  audio.addEventListener("ended", () => {
    if (selected < 0 || !audio.ended) return;
    playRequest++;
    showPlaying(false);
    updateProgress();
    $("status").textContent = `《${tracks[selected].title}》演唱结束！可以继续选歌。`;
    if (!cleared) {
      cleared = true;
      $("complete").hidden = false;
      $("challenge-note").textContent = "已通关！今晚的舞台继续为你开放，自由点歌吧。";
    }
  });
  audio.addEventListener("error", () => {
    if (selected < 0) return;
    playRequest++;
    showPlaying(false);
    $("status").textContent = "这首歌暂时无法加载，请刷新重试，或选择其他歌曲。";
  });
  $("continue").addEventListener("click", () => { $("complete").hidden = true; buttons[Math.max(0, selected)].focus(); });
  window.addEventListener("pagehide", () => { playRequest++; audio.pause(); showPlaying(false); });
})();
