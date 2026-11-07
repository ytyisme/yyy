let audioCtx;
const status = document.querySelector('#audio-status');
const cotton = 'qwertyuiopaszxcv', macaron = 'fdghjk';
function getType(char) {
  if (cotton.includes(char)) return 'cotton';
  if (macaron.includes(char)) return 'macaron';
  return 'jelly';
}
function playClick(type) {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) { status.textContent = '当前浏览器不支持声音，按键仍然可以使用。'; return; }
  if (!audioCtx) audioCtx = new Audio();
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => { status.textContent = '声音未能播放，请检查浏览器设置。'; });
  const notes = type === 'cotton' ? [['sine',880,220,.14]] : type === 'jelly' ? [['triangle',460,140,.2]] : [['sawtooth',320,80,.28],['square',240,60,.28]];
  for (const [wave,start,end,duration] of notes) {
    const osc=audioCtx.createOscillator(), gain=audioCtx.createGain(), now=audioCtx.currentTime;
    osc.type=wave; osc.frequency.setValueAtTime(start,now); osc.frequency.exponentialRampToValueAtTime(end,now+duration);
    gain.gain.setValueAtTime(type === 'macaron' ? .07 : .12,now); gain.gain.exponentialRampToValueAtTime(.001,now+duration);
    osc.connect(gain);gain.connect(audioCtx.destination);osc.start(now);osc.stop(now+duration);
  }
}
function effect(el,type) {
  const rect=el.getBoundingClientRect(), x=rect.left+rect.width/2, y=rect.top+rect.height/2;
  const color=type==='cotton'?'#ff9fd6':type==='jelly'?'#76d9ff':'#f6c85d';
  for(let i=0;i<9;i++){
    const s=document.createElement('span'),angle=Math.random()*Math.PI*2,distance=22+Math.random()*45;
    s.className='spark';s.style.setProperty('--x',x+'px');s.style.setProperty('--y',y+'px');s.style.setProperty('--color',color);
    s.style.setProperty('--dx',Math.cos(angle)*distance+'px');s.style.setProperty('--dy',Math.sin(angle)*distance+'px');
    s.style.setProperty('--size',(4+Math.random()*6)+'px');s.style.setProperty('--round',type==='macaron'?'2px':'50%');
    document.body.append(s);s.addEventListener('animationend',()=>s.remove(),{once:true});
  }
  const ring=document.createElement('span');ring.className='ripple';ring.style.setProperty('--x',x+'px');ring.style.setProperty('--y',y+'px');ring.style.setProperty('--color',color);document.body.append(ring);ring.addEventListener('animationend',()=>ring.remove(),{once:true});
}
function downKey(el) {
  const type=getType(el.dataset.k);el.classList.add('press');playClick(type);effect(el,type);
  clearTimeout(el.pressTimer);el.pressTimer=setTimeout(()=>el.classList.remove('press'),80);
}
document.querySelectorAll('.key').forEach(key=>{key.classList.add(getType(key.dataset.k));key.addEventListener('click',()=>downKey(key));});
window.addEventListener('keydown',event=>{
  if(!/^[a-z]$/i.test(event.key)||event.ctrlKey||event.metaKey||event.altKey)return;
  const key=document.querySelector(`.key[data-k="${event.key.toLowerCase()}"]`);if(key)downKey(key);
});
