(() => {
  const lines = [
    { prompt: "白菜对", answers: ["我笑"] },
    { prompt: "野生", answers: ["狗奶"] },
    { prompt: "秦始皇骑", answers: ["北极熊"] },
    { prompt: "曾经有座钵钵山", answers: ["长着钵钵"] },
    { prompt: "天雷滚滚我好怕怕", answers: ["劈的浑身掉渣渣", "劈得浑身掉渣渣"] },
  ];
  const $ = (id) => document.getElementById(id);
  const input = $("reply");
  const normalize = (value) => value.normalize("NFKC").replace(/[\s，。！？、,.!?]/g, "");
  let index = 0;

  function addMessage(speaker, text) {
    const message = document.createElement("div");
    message.className = `message ${speaker}`;
    const name = document.createElement("span");
    name.className = "speaker";
    name.textContent = speaker === "system" ? "系统说" : "你接";
    const line = document.createElement("p");
    line.className = "line";
    line.textContent = text;
    message.append(name, line);
    $("conversation").append(message);
  }

  function reset() {
    index = 0;
    $("conversation").replaceChildren();
    $("reply-form").hidden = false;
    $("complete").hidden = true;
    $("status").textContent = "";
    $("progress").textContent = `已接对 0 / ${lines.length} 句`;
    input.value = "";
    input.removeAttribute("aria-invalid");
    addMessage("system", lines[0].prompt);
  }

  $("reply-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (index >= lines.length) return;
    const reply = normalize(input.value);
    if (!reply) {
      $("status").textContent = "先输入你要接的下半句吧。";
      input.focus();
      return;
    }
    if (!lines[index].answers.some((answer) => normalize(answer) === reply)) {
      $("status").textContent = "还没接上，再想一想！";
      input.setAttribute("aria-invalid", "true");
      input.focus();
      return;
    }
    addMessage("player", input.value.trim());
    index++;
    input.value = "";
    input.removeAttribute("aria-invalid");
    $("progress").textContent = `已接对 ${index} / ${lines.length} 句`;
    if (index === lines.length) {
      $("reply-form").hidden = true;
      $("complete").hidden = false;
      $("status").textContent = "全部回答完毕，第 10 关通关！";
      $("retry").focus();
      return;
    }
    $("status").textContent = "接对啦！继续接下一句。";
    addMessage("system", lines[index].prompt);
    input.focus();
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && event.isComposing) event.preventDefault();
  });
  $("retry").addEventListener("click", () => {
    reset();
    input.focus();
  });
  reset();
})();
