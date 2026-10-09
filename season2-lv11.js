(() => {
  const $ = (id) => document.getElementById(id);
  const input = $("reply");
  const normalize = (value) => value.normalize("NFKC").replace(/[\s，。！？、,.!?]/g, "");
  const words = [...new Set(window.IdiomRelayWords)];
  const dictionary = new Map(words.map((word) => [normalize(word), word]));
  const starts = new Map();
  for (const word of words) {
    const first = normalize(word).slice(0, 1);
    if (!starts.has(first)) starts.set(first, []);
    starts.get(first).push(word);
  }
  const last = (word) => normalize(word).slice(-1);
  const candidates = (word) => (starts.get(last(word)) || []).filter((next) => next !== word);
  const available = words.filter((word) => candidates(word).length);
  let round = [];
  let index = 0;
  let used = new Set();

  function render() {
    const current = round[index];
    const chars = Array.from(current);
    const tail = document.createElement("strong");
    tail.textContent = chars.pop();
    $("idiom").textContent = chars.join("");
    $("idiom").append(tail);
    $("clue").textContent = `接一个以“${last(current)}”开头的成语`;
    $("progress").textContent = `第 ${index + 1} / 5 题 · 已接对 ${index} 题`;
    input.value = "";
    input.removeAttribute("aria-invalid");
  }

  function reset() {
    const shuffled = available.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    // 不同末字保证五题各自都有可用答案，不会被前面的回答耗尽。
    const endings = new Set();
    round = shuffled.filter((word) => {
      const ending = last(word);
      if (endings.has(ending)) return false;
      endings.add(ending);
      return true;
    }).slice(0, 5);
    index = 0;
    used = new Set();
    $("history").replaceChildren();
    $("status").textContent = "";
    $("challenge").hidden = false;
    $("complete").hidden = true;
    render();
  }

  $("reply-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (index >= round.length) return;
    const answer = normalize(input.value);
    let error = "";
    if (!answer) error = "先输入你要接的成语吧。";
    else if (answer[0] !== last(round[index])) error = `要以“${last(round[index])}”开头，才能接上哦。`;
    else if (!dictionary.has(answer)) error = "本关暂未收录这个成语，换一个试试，也可以查看提示。";
    else if (answer === normalize(round[index])) error = "请接一个不同的成语，不能重复系统这句。";
    else if (used.has(answer)) error = "这个成语本轮已经用过啦，换一个吧。";
    if (error) {
      $("status").textContent = error;
      input.setAttribute("aria-invalid", "true");
      input.focus();
      return;
    }
    used.add(answer);
    const item = document.createElement("li");
    item.textContent = `${round[index]} → ${dictionary.get(answer)}`;
    $("history").append(item);
    index++;
    if (index === 5) {
      $("progress").textContent = "已接对 5 / 5 题";
      $("challenge").hidden = true;
      $("complete").hidden = false;
      $("status").textContent = "五个成语全部接上，第 11 关通关！";
      $("retry").focus();
      return;
    }
    render();
    $("status").textContent = "接对啦！来接下一题。";
    input.focus();
  });
  $("hint").addEventListener("click", () => {
    if (index >= round.length) return;
    const answer = candidates(round[index]).find((word) => !used.has(normalize(word)));
    $("status").textContent = `提示：可以接“${answer}”。输入后点击“接龙”即可。`;
    input.focus();
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && event.isComposing) event.preventDefault();
  });
  $("retry").addEventListener("click", () => { reset(); input.focus(); });
  reset();
})();
