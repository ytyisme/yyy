(() => {
  // 题目及首个展示答案按原文收录，另补充可接受的答案。
  // 来源：https://www.toutiao.com/article/7622265584809558568/
  const questions = [
    {
      "question": "什么门永远关不上？",
      "answers": [
        "球门",
        "脑门"
      ]
    },
    {
      "question": "什么球不能玩？",
      "answers": [
        "地球",
        "眼球"
      ]
    },
    {
      "question": "什么布剪不断？",
      "answers": [
        "瀑布"
      ]
    },
    {
      "question": "什么路最窄？",
      "answers": [
        "冤家路窄"
      ]
    },
    {
      "question": "什么书里毛病最多？",
      "answers": [
        "医学书",
        "医书"
      ]
    },
    {
      "question": "什么水永远用不完？",
      "answers": [
        "泪水",
        "口水"
      ]
    },
    {
      "question": "什么瓜不能吃？",
      "answers": [
        "傻瓜",
        "笨瓜"
      ]
    },
    {
      "question": "什么船从来不下水？",
      "answers": [
        "宇宙飞船",
        "航天飞船"
      ]
    },
    {
      "question": "什么贼不偷东西？",
      "answers": [
        "卖国贼",
        "乌贼"
      ]
    },
    {
      "question": "什么蛋打不烂煮不熟？",
      "aliases": [
        "零蛋",
        "考卷上的0",
        "试卷上的零蛋"
      ],
      "answers": [
        "考卷上的零蛋",
        "核弹",
        "子弹",
        "笨蛋"
      ]
    },
    {
      "question": "什么人始终不敢洗澡？",
      "answers": [
        "泥人",
        "纸人"
      ]
    },
    {
      "question": "什么车寸步难行？",
      "answers": [
        "风车",
        "水车",
        "纺车"
      ]
    },
    {
      "question": "什么池里没有水？",
      "answers": [
        "电池"
      ]
    },
    {
      "question": "什么笔不能写字？",
      "answers": [
        "电笔",
        "录音笔"
      ]
    },
    {
      "question": "什么果不能吃？",
      "answers": [
        "后果",
        "结果",
        "成果",
        "恶果"
      ]
    },
    {
      "question": "什么河没有水？",
      "answers": [
        "银河",
        "星河"
      ]
    },
    {
      "question": "什么床不能睡？",
      "answers": [
        "牙床",
        "机床",
        "河床"
      ]
    },
    {
      "question": "什么虎不吃人？",
      "answers": [
        "壁虎",
        "纸老虎"
      ]
    },
    {
      "question": "什么鼠比猫大？",
      "answers": [
        "袋鼠"
      ]
    },
    {
      "question": "什么鸟不会飞？",
      "answers": [
        "鸵鸟",
        "企鹅",
        "几维鸟"
      ]
    },
    {
      "question": "什么鱼不在水里游？",
      "answers": [
        "木鱼",
        "咸鱼",
        "干鱼"
      ]
    },
    {
      "question": "什么羊不吃草？",
      "answers": [
        "替罪羊"
      ]
    },
    {
      "question": "什么马不吃草？",
      "answers": [
        "海马",
        "木马"
      ]
    },
    {
      "question": "什么牛不吃草？",
      "answers": [
        "蜗牛",
        "铁牛"
      ]
    },
    {
      "question": "什么狼不吃羊？",
      "answers": [
        "黄鼠狼"
      ]
    },
    {
      "question": "什么鸡没有翅膀？",
      "answers": [
        "田鸡",
        "手机"
      ]
    },
    {
      "question": "什么猫不吃鱼？",
      "answers": [
        "熊猫"
      ]
    },
    {
      "question": "什么狗不咬人？",
      "answers": [
        "热狗",
        "机器狗",
        "玩具狗"
      ]
    },
    {
      "question": "什么兔不蹦跳？",
      "answers": [
        "死兔"
      ]
    },
    {
      "question": "什么虫不是虫？",
      "answers": [
        "毛毛虫"
      ]
    },
    {
      "question": "太平洋中间是什么？",
      "answers": [
        "平"
      ]
    },
    {
      "question": "全世界通用的字是什么？",
      "answers": [
        "阿拉伯数字"
      ]
    },
    {
      "question": "什么东西越洗越脏？",
      "answers": [
        "水"
      ]
    },
    {
      "question": "什么东西越擦越小？",
      "answers": [
        "橡皮",
        "橡皮擦"
      ]
    },
    {
      "question": "什么东西越用越有钱？",
      "answers": [
        "存钱罐"
      ]
    },
    {
      "question": "什么东西越热越爱出来？",
      "answers": [
        "汗",
        "汗水"
      ]
    },
    {
      "question": "什么东西倒立后会增加一半？",
      "aliases": [
        "6",
        "六",
        "数字六"
      ],
      "answers": [
        "数字6"
      ]
    },
    {
      "question": "什么东西只能加不能减？",
      "answers": [
        "年龄",
        "岁数",
        "年纪"
      ]
    },
    {
      "question": "什么东西有头无尾？",
      "answers": [
        "枕头",
        "馒头",
        "石头"
      ]
    },
    {
      "question": "什么东西有脚不能走？",
      "aliases": [
        "桌子",
        "椅子",
        "桌椅",
        "桌子和椅子"
      ],
      "answers": [
        "桌子、椅子",
        "桌子",
        "椅子",
        "凳子"
      ]
    },
    {
      "question": "什么东西有眼无眉？",
      "answers": [
        "针"
      ]
    },
    {
      "question": "什么东西有翅难飞？",
      "answers": [
        "风筝",
        "企鹅",
        "鸵鸟"
      ]
    },
    {
      "question": "什么东西满屋走却碰不着？",
      "answers": [
        "声音",
        "空气"
      ]
    },
    {
      "question": "什么东西越站越短？",
      "answers": [
        "蜡烛"
      ]
    },
    {
      "question": "什么东西越放越不值钱？",
      "answers": [
        "旧报纸"
      ]
    },
    {
      "question": "什么东西别人请你吃但你自己付钱？",
      "answers": [
        "吃亏"
      ]
    },
    {
      "question": "什么东西掉进水里不会湿？",
      "answers": [
        "影子"
      ]
    },
    {
      "question": "什么东西天气越热爬得越高？",
      "answers": [
        "温度计"
      ]
    },
    {
      "question": "什么东西有口无牙？",
      "answers": [
        "杯子",
        "瓶子",
        "茶壶",
        "水壶"
      ]
    },
    {
      "question": "什么东西有手无脚？",
      "answers": [
        "钟表",
        "手表",
        "时钟"
      ]
    }
  ];
  const $ = (id) => document.getElementById(id);
  const input = $("answer");
  let index = 0;
  let solved = 0;
  const answered = new Set();
  let queue = questions.map((_, i) => i);
  let cursor = 0;
  let roundEnded = false;
  let revealed = false;
  let resolved = false;
  let finished = false;
  const normalize = (value) => value.normalize("NFKC").replace(/[\s，。！？、,.!?]/g, "");

  function render() {
    roundEnded = false;
    revealed = false;
    resolved = false;
    $("answer-form").hidden = false;
    input.disabled = false;
    input.value = "";
    input.readOnly = false;
    $("status").textContent = "";
    $("progress").textContent = `第 ${index + 1} / ${questions.length} 题 · 已完成 ${answered.size} / ${questions.length} 题`;
    $("question").textContent = questions[index].question;
    $("submit").disabled = false;
    $("skip").disabled = false;
    $("reveal").disabled = false;
    $("next").hidden = true;
    $("next").textContent = "下一题";
  }

  function win() {
    finished = true;
    $("question").textContent = "恭喜过关！";
    $("progress").textContent = `已完成 ${questions.length} / ${questions.length} 题`;
    $("status").textContent = `全部问题都回答完啦！其中 ${solved} 题是独立答对的。`;
    $("answer-form").hidden = true;
  }

  function advance() {
    if (finished || roundEnded) return;
    cursor++;
    if (cursor < queue.length) {
      index = queue[cursor];
      render();
      input.focus();
      return;
    }
    roundEnded = true;
    $("question").textContent = "本轮没有新问题了";
    $("progress").textContent = `已完成 ${answered.size} / ${questions.length} 题`;
    $("status").textContent = answered.size === 0
      ? "全部题目都不会？可以继续回答跳过的题目，点“答案”学习后再提交。全部回答完成才能过关。"
      : `还有 ${questions.length - answered.size} 道跳过的题目，全部回答完成才能过关。`;
    input.value = "";
    input.disabled = true;
    for (const id of ["submit", "skip", "reveal"]) $(id).disabled = true;
    $("next").textContent = "继续回答跳过的题目";
    $("next").hidden = false;
  }

  $("answer-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (finished || roundEnded || resolved) return;
    if (!normalize(input.value)) {
      $("status").textContent = "先在输入框里写下你的答案吧。";
      return;
    }
    const current = questions[index];
    const acceptedAnswers = [...current.answers, ...(current.aliases || [])];
    if (!acceptedAnswers.some((answer) => normalize(input.value) === normalize(answer))) {
      $("status").textContent = "再换个角度想想，也可以跳过或查看答案。";
      return;
    }
    resolved = true;
    if (!revealed) solved++;
    answered.add(index);
    if (answered.size === questions.length) {
      win();
      return;
    }
    input.readOnly = true;
    $("submit").disabled = true;
    $("skip").disabled = true;
    $("reveal").disabled = true;
    $("progress").textContent = `已完成 ${answered.size} / ${questions.length} 题`;
    $("status").textContent = "答对啦！";
    $("next").hidden = false;
  });
  $("skip").addEventListener("click", advance);
  $("next").addEventListener("click", () => {
    if (finished) return;
    if (roundEnded) {
      queue = questions.map((_, i) => i).filter((i) => !answered.has(i));
      cursor = 0;
      index = queue[0];
      render();
      input.focus();
    } else if (resolved) advance();
  });
  $("reveal").addEventListener("click", () => {
    if (finished || roundEnded || resolved) return;
    revealed = true;
    const answers = questions[index].answers;
    input.value = answers[0];
    input.readOnly = true;
    $("status").textContent = answers.length > 1
      ? `可接受的答案：${answers.join("、")}。填入其中一个并提交即可。`
      : "答案已填入，读一读，再点“提交答案”完成这道题。";
  });
  render();
})();
