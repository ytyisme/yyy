(() => {
  'use strict';

  const checkbox = document.getElementById('login-agreement');
  if (!checkbox) return;
  const version = '2026-10-18';
  const sessionKey = 'lava-agreement-version';
  const message = '请先阅读并勾选同意用户协议和隐私政策';
  const buttons = document.querySelectorAll('[data-agreement-required]');
  const error = document.getElementById('agreement-error');

  const documents = {
    terms: {
      title: '岩浆跑酷·全关联机 用户协议',
      content: `
        <p class="agreement-date">更新日期：2026年10月18日</p>
        <p>欢迎游玩岩浆跑酷·全关联机。请在登录前阅读本协议及隐私政策，自主决定是否勾选同意。未勾选时无法登录；查看或退出协议不会代替你作出同意。</p>
        <h3>一、游戏服务</h3>
        <p>本游戏提供跑酷关卡、自由探索及联机互动等玩法，具体以当前版本为准。部分功能需要网络，网络状况、版本更新和维护可能影响使用。游戏内的演示登录不验证真实身份，演示验证码不发送短信。</p>
        <h3>二、登录与账号安全</h3>
        <p>请妥善保管账号、密码和验证码，不要向他人泄露。演示登录可使用虚拟号码，请勿在昵称、聊天或其他公开内容中填写真实身份证号、密码、手机号等私人信息。使用真实短信登录时，请使用你有权使用的手机号。</p>
        <h3>三、文明游玩</h3>
        <p>请尊重其他玩家，不作弊、不冒用他人身份，不发布违法、辱骂、骚扰、诈骗或侵犯他人隐私和知识产权的内容，不攻击游戏或联机服务。对破坏游戏秩序的行为，管理员可根据具体情况采取禁言、退出登录或限制账号等措施；如有异议，可向提供游戏的作者或管理员反馈。</p>
        <h3>四、游戏进度与内容</h3>
        <p>游戏进度、昵称和设置主要保存在当前设备。清除浏览器数据、更换设备或卸载应用可能导致本地进度丢失；手机号登录不提供跨设备进度同步。游戏内物品和成绩仅用于游戏体验，不承诺兑换现实货币。</p>
        <p>自由创造地图保存后会自动上传到当前游戏服务器，并以“快来和我一起玩吧”为标题发布到游戏圈，其他玩家可以打开地图副本继续建造。游戏圈支持你主动发布标题、文字、表情包、图片和视频；请仅发布你有权分享的内容。</p>
        <h3>五、未成年人使用</h3>
        <p>未成年人请在监护人指导下阅读本协议和隐私政策，合理安排游戏时间。涉及未成年人个人信息的功能，应取得必要的监护人同意；本次勾选不替代依法需要的监护人同意或敏感个人信息单独同意。</p>
        <h3>六、知识产权与第三方内容</h3>
        <p>请尊重游戏及第三方素材的合法权利，未经授权不得将相关内容用于侵权用途。你主动打开的第三方影音、网站或服务适用其各自规则；可自行选择是否使用。</p>
        <h3>七、退出与协议更新</h3>
        <p>你可以随时停止游玩或退出登录。影响你主要权益的协议变更应另行提示并重新征求同意。本协议不排除或限制你依法享有的权利；发生问题时，请联系向你提供游戏访问地址的作者或管理员协商处理。</p>`
    },
    privacy: {
      title: '岩浆跑酷·全关联机 隐私政策',
      content: `
        <p class="agreement-date">更新日期：2026年10月18日</p>
        <p>本政策说明当前游戏的主要信息处理方式。请根据你选择的功能阅读以下说明。本次勾选不授权与游戏无关的信息处理。</p>
        <h3>一、保存在当前设备的信息</h3>
        <p>游戏使用浏览器或应用的本地存储保存玩家昵称、关卡进度、物品、设置及部分社交记录；当前会话会记录已同意的协议版本，用于同一次游玩中的页面跳转。清除对应站点数据或卸载应用可删除设备上的相关数据，同时也可能清除游戏进度。</p>
        <h3>二、演示登录和短信登录</h3>
        <p>普通游戏页的账号、验证码和身份证入口为演示流程，输入内容用于当前页面的判断，不代表真实身份认证；不要填写真实身份证号。独立手机号演示页使用号码生成对应的演示码和玩家名，不发送短信；静态演示流程只在当前页面临时保存完整号码和演示码，登录后在设备保存昵称、号码掩码和到期时间。</p>
        <p>若使用专用手机号服务器，号码及验证码会发送到该服务器进行验证和限流；会话使用有期限的登录凭证，最长保留7天，退出登录会使服务器会话失效。仅在页面明确显示短信模式时，号码才会交给配置的短信服务商用于发送验证码。验证码有效期为5分钟。</p>
        <h3>三、联机与第三方网络服务</h3>
        <p>使用联机功能时，昵称、角色位置、游戏状态及你主动发送的聊天内容可能传给联机服务和其他玩家；请勿发送个人敏感信息。页面加载网络字体、联机资源或第三方影音时，相应服务会收到完成网络请求所需的信息，例如IP地址。第三方内容的信息处理适用其自身隐私政策，请在使用前查看。</p>
        <p>游戏圈将你主动发布的昵称、标题、正文、表情包、图片和视频保存在当前游戏服务器，并向访问该游戏圈的玩家展示。自由创造存档会自动上传并公开地图名称和建造内容。设备保存一个随机发布凭证，用于更新自己的地图和恢复当前设备上传的存档，不与手机号登录绑定。清除站点数据会丢失此凭证；公开的地图和动态不会随本机数据清除而自动删除。</p>
        <h3>四、信息用途与保存</h3>
        <p>上述信息用于提供登录、保存进度、联机互动和维护服务安全。设备上的游戏存档会保留至你清除对应数据；演示登录资料和登录会话最长7天后到期。服务器记录的清理或删除请求，请联系向你提供游戏的作者或管理员处理。请勿在公开聊天中提交此类请求所涉及的私人资料。</p>
        <h3>五、你的选择与未成年人保护</h3>
        <p>你可退出登录、停止使用联机或第三方内容，并通过浏览器的站点数据设置或卸载应用清除本地信息。需要查询、更正、删除服务器信息或撤回同意时，请通过向你提供游戏访问地址的作者或管理员提出；撤回后可停止使用相应功能。未成年人请由监护人指导使用；未满14周岁儿童的信息处理需取得必要的监护人同意。</p>
        <h3>六、政策变更与联系</h3>
        <p>如信息处理目的、方式或范围发生实质变化，应先更新说明并履行相应告知、同意程序。当前为作者提供的游戏体验版本，隐私相关问题请向提供访问地址的作者或管理员反馈。</p>`
    }
  };

  const dialog = document.createElement('dialog');
  dialog.id = 'agreement-dialog';
  dialog.className = 'agreement-dialog';
  dialog.setAttribute('aria-labelledby', 'agreement-title');
  dialog.innerHTML = `
    <div class="agreement-header">
      <h2 id="agreement-title"></h2>
      <button type="button" class="agreement-close" aria-label="退出协议，返回登录">退出</button>
    </div>
    <div class="agreement-content" tabindex="0"></div>
    <div class="agreement-footer"><button type="button" class="agreement-close">退出，返回登录</button></div>`;
  document.body.appendChild(dialog);
  const title = dialog.querySelector('h2');
  const content = dialog.querySelector('.agreement-content');
  let opener;
  document.querySelectorAll('[data-agreement-document]').forEach(button => {
    button.addEventListener('click', () => {
      const entry = documents[button.dataset.agreementDocument];
      if (!entry) return;
      opener = button;
      title.textContent = entry.title;
      content.innerHTML = entry.content;
      dialog.showModal();
      content.scrollTop = 0;
    });
  });
  dialog.querySelectorAll('.agreement-close').forEach(button => {
    button.addEventListener('click', () => dialog.close());
  });
  // Keep the game's shortcuts from handling keys while reading the dialog.
  dialog.addEventListener('keydown', event => event.stopPropagation());
  dialog.addEventListener('close', () => opener?.focus());

  function sync() {
    buttons.forEach(button => { button.disabled = !checkbox.checked; });
    if (checkbox.checked) error.hidden = true;
  }
  checkbox.addEventListener('change', sync);
  checkbox.addEventListener('keydown', event => event.stopPropagation());
  window.GameAgreement = {
    isAccepted: () => checkbox.checked,
    requireAcceptance() {
      if (checkbox.checked) return true;
      error.textContent = message;
      error.hidden = false;
      checkbox.focus();
      return false;
    },
    recordAcceptance() {
      if (!this.requireAcceptance()) return false;
      try { sessionStorage.setItem(sessionKey, version); } catch {}
      return true;
    },
    hasAcceptedSession() {
      try { return sessionStorage.getItem(sessionKey) === version; } catch { return false; }
    },
    reset() {
      checkbox.checked = false;
      error.hidden = true;
      try { sessionStorage.removeItem(sessionKey); } catch {}
      checkbox.dispatchEvent(new Event('change'));
    }
  };
  // Browsers may restore form values on history navigation; require a fresh choice.
  window.addEventListener('pageshow', () => { checkbox.checked = false; sync(); });
  checkbox.checked = false;
  sync();
})();
