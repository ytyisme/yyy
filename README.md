# 游戏代码维护说明

## 启动与验证

启动静态服务：`python3 server.py`，然后访问 `http://127.0.0.1:8080/`。

运行回归测试：`node --test tests/*.test.cjs`（Node.js 18 或以上，无需安装依赖）。
测试覆盖存档容错、场景调度、绘画墨水与指针生命周期，并检查页面引用的本地
JavaScript 语法、32 个关卡注册及实际场景安装函数。画面效果、音频和联机仍需浏览器验证。

## 模块职责

| 文件 | 职责 |
| --- | --- |
| `game.js` | 游戏主循环、共享运行状态、入口和 UI 协调 |
| `levels/boot.js` | 关卡注册、地形生成和角色构造工具 |
| `levels/NN.js` | 每关初始地图和场景数据 |
| `levels/NN-*.js` | 特殊关卡玩法及其生命周期钩子 |
| `lib/scenes.js` | 特殊关卡安装、初始化、更新、绘制、离开和点击调度 |
| `lib/levelkit.js` | 场景提示、手绘笔画、指针绑定、准备按钮和笔画几何工具 |
| `lib/progress.js` | 存档读取与字段校验；兼容现有 `yyy_*` 存储键 |
| `lib/util.js` | 数学、HTML 转义、基础存储和共享作用域适配 |
| `lib/draw.js` | 主画面绘制和已有场景交互 |
| `lib/social.js` / `coop.js` | 社交 UI / 联机通信 |
| `audio.js` | 音效与环境声音 |

脚本仍通过 `window` 暴露接口，无需打包。`index.html` 应先加载 `lib/util.js`，
再加载 `lib/progress.js`；关卡脚本和所有公共模块必须在 `game.js` 前加载。
关卡安装函数在主入口运行时才执行，因此此时 `GameLevelKit` 必须已就绪。

## 增加或维护关卡

1. 在 `levels/NN.js` 调用 `GameLevels.register` 注册构建函数。
2. 有独立玩法时，提供 `installXxx(S)`，把生命周期函数挂到 `S` 上，并在
   `lib/scenes.js` 的 `DEFS` 配置钩子。配置中的钩子缺失会在启动时明确报错。
3. 在主入口声明场景状态并加入 `GameUtil.liveScope` 的共享名称，再把关卡脚本加入
   `index.html`。同时检查关卡数量常量、选关配置和测试中的关卡上限。
4. 点击优先级用 `clickOrder` 指定，数字越小越先处理，`0` 是有效优先级。
   `drawAfter` 在该关卡的 `draw` 后调用，适合前景绘制。

现有安装函数通过 `with (S)` 使用共享状态；这些脚本不能直接改成严格模式或
ES module。新增通用逻辑优先通过参数和回调传入依赖，避免继续扩大共享作用域。

## 复用公共工具

- 提示：`GameLevelKit.makeToast(() => scene, 默认秒数)` 创建提示函数；在关卡更新中
  调用 `GameLevelKit.tickToast(scene, dt)`。各关原有默认持续时间应保留。
- 手绘：`createStrokeTool` 负责开始、延长、结束笔画及墨水计量；通过 `makeStroke`
  添加玩法属性，例如盾牌的 `supported` 和水管的 `wet`。
- 指针：`bindDrawPointer` 的 `sceneRef` 仅在对应关卡可绘画时返回场景；用 `isBlocked`
  指定弹窗等阻塞状态，用唯一 `boundKey` 避免重复监听。它只接受发起绘画的指针，
  并处理取消、失焦和指针捕获丢失；返回的清理函数用于卸载监听。
- 存档：新加背包物品时更新主入口的背包默认字段。`GameProgress.load` 只读取这些字段，
  拒绝数组、非法数字和未知物品；写入继续使用现有 `saveJson` / `saveStr`。
