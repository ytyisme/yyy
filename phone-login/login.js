(() => {
  'use strict';
  const form=document.getElementById('phone-form'),phone=document.getElementById('phone'),code=document.getElementById('code');
  const send=document.getElementById('send-code'),submit=document.getElementById('phone-submit'),status=document.getElementById('phone-status'),demoOutput=document.getElementById('demo-code');
  const appRoot=new URL('../',location.href),demoKey='lava-demo-phone-session';
  let mode=document.body.dataset.phoneMode||'demo',server=false,ready=false,busy=false,until=0,challenge=null;
  const validPhone=()=>/^1[3-9]\d{9}$/.test(phone.value.trim());
  function message(text,tone=''){status.textContent=text;status.dataset.tone=tone;}
  function refresh(){const left=Math.max(0,Math.ceil((until-Date.now())/1000));send.disabled=!ready||busy||left>0;submit.disabled=!ready||busy||!window.GameAgreement?.isAccepted();document.getElementById('login-agreement').disabled=busy;send.textContent=left?`${left} 秒后重发`:(mode==='demo'?'获取演示码':'获取验证码');}
  document.getElementById('login-agreement').addEventListener('change',refresh);
  window.addEventListener('pageshow',refresh);
  function setMode(value){mode=value;document.getElementById('phone-mode').textContent=mode==='demo'?'演示登录':'欢迎回来';document.getElementById('code-label').textContent=mode==='demo'?'演示验证码':'短信验证码';document.getElementById('phone-private').textContent=mode==='demo'?'演示模式 · 不发送短信':'私人游戏 · 仅已授权的手机号可以登录';document.getElementById('phone-note').textContent=mode==='demo'?'演示码 5 分钟内有效，输入正确后即可试玩。':'验证码 5 分钟内有效。登录状态保留 7 天。';}
  function nextPath(){
    const fallback=new URL('app.html',appRoot);
    try{const target=new URL(new URLSearchParams(location.search).get('next')||'app.html',appRoot);const allowed=location.protocol==='file:'?target.protocol==='file:'&&target.pathname.startsWith(appRoot.pathname):target.origin===location.origin;return allowed&&!target.pathname.includes('/phone-login/')?target.href:fallback.href;}catch{return fallback.href;}
  }
  async function api(path,data){
    let response,body;
    try{response=await fetch(new URL('api/phone/'+path,appRoot),{method:data?'POST':'GET',headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined,credentials:'same-origin',cache:'no-store'});body=await response.json();}
    catch{throw new Error('无法连接登录服务，请检查网络后重试');}
    if(!response.ok){if(body.retryAfter)until=Date.now()+body.retryAfter*1000;throw new Error(body.error||'登录服务暂时不可用');}return body;
  }
  function makeDemoCode(){const values=new Uint32Array(1);crypto.getRandomValues(values);return String(values[0]%1000000).padStart(6,'0');}
  send.addEventListener('click',async()=>{
    if(!validPhone()){message('请输入正确的 11 位手机号','error');phone.focus();return;}
    busy=true;refresh();message(mode==='demo'?'正在生成演示码…':'正在发送短信…');
    try{
      let result;
      if(server)result=await api('send',{phone:phone.value.trim()});
      else{const value=makeDemoCode();challenge={phone:phone.value.trim(),code:value,expires:Date.now()+300000};result={demoCode:value,retryAfter:60};}
      until=Date.now()+result.retryAfter*1000;
      if(mode==='demo'){demoOutput.textContent='演示码：'+result.demoCode;demoOutput.hidden=false;message('输入上面的演示码即可登录，不会发送短信。','success');}
      else message('短信已发送，请查看手机上的 6 位验证码','success');
      code.focus();
    }
    catch(error){message(error.message,'error');}finally{busy=false;refresh();}
  });
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(!ready||busy)return;
    if(!window.GameAgreement?.requireAcceptance())return;
    if(!validPhone()){message('请输入正确的 11 位手机号','error');phone.focus();return;}
    if(!/^\d{6}$/.test(code.value.trim())){message('请输入 6 位验证码','error');code.focus();return;}
    busy=true;refresh();message('正在验证…');
    try{
      if(server)await api('verify',{phone:phone.value.trim(),code:code.value.trim(),agreementAccepted:true});
      else{
        if(!challenge||challenge.phone!==phone.value.trim()||challenge.expires<=Date.now()||challenge.code!==code.value.trim())throw new Error('演示码错误或已过期，请使用本次获取的演示码');
        const number=phone.value.trim();challenge=null;
        const profile={displayName:'玩家'+number.slice(-4),maskedPhone:number.slice(0,3)+'****'+number.slice(-4),expires:Date.now()+7*86400000};
        try{localStorage.setItem(demoKey,JSON.stringify(profile));}catch{}
      }
      window.GameAgreement.recordAcceptance();
      code.value='';location.replace(nextPath());
    }
    catch(error){message(error.message,'error');busy=false;refresh();}
  });
  setInterval(refresh,1000);
  setMode(mode);
  async function boot(){
    if(location.protocol!=='file:'){
      try{const session=await api('session');server=true;setMode(session.mode||'sms');if(session.authenticated&&window.GameAgreement?.hasAcceptedSession()){location.replace(nextPath());return;}ready=session.ready;}
      catch(error){if(mode==='sms'){message(error.message,'error');return;}}
    }
    if(!server)ready=mode==='demo';
    message(ready?(mode==='demo'?'填写手机号，点击获取演示码。':'填写已授权的手机号，获取短信验证码。'):'手机号登录尚未启用，管理员正在开通短信服务。',ready?'':'error');refresh();
  }
  boot();
})();
