const KEY='lava-theme-music-v1';
export const tracks=[
  {id:'BV1faak6AEzm',title:'视频 1'},
  {id:'BV1ExpA6aE3U',title:'视频 2'}
];
export function readMusicSettings(storage){
  try{const saved=JSON.parse(storage.getItem(KEY));return {enabled:saved?.enabled===true,track:tracks.some(t=>t.id===saved?.track)?saved.track:tracks[0].id};}
  catch{return {enabled:false,track:tracks[0].id};}
}
export function musicPlayerUrl(track){return `https://player.bilibili.com/player.html?bvid=${encodeURIComponent(track)}&autoplay=0`;}
export function installThemeMusic(doc=document,storage=localStorage,win=window){
  if(doc.getElementById('game-theme-music'))return;
  let settings=readMusicSettings(storage);
  const root=doc.createElement('section');root.id='game-theme-music';root.className='theme-music';root.setAttribute('aria-label','游戏音乐');
  root.innerHTML='<button type="button" class="theme-toggle" aria-expanded="false">🎵 音乐</button><div class="theme-panel" hidden><div class="theme-head"><strong>🎵 游戏音乐</strong><button type="button" class="theme-collapse" aria-label="收起音乐">收起</button></div><p>选择视频，点击开关，再在播放器中点击播放。</p><label>选择音乐 <select class="theme-track"><option value="BV1faak6AEzm">视频 1</option><option value="BV1ExpA6aE3U">视频 2</option></select></label><button type="button" class="theme-power"></button><div class="theme-video"></div><p class="theme-note">视频由哔哩哔哩提供，需要网络。换页后请重新点击播放；暂不支持自动切歌。</p></div>';
  const style=doc.createElement('style');style.textContent='.theme-music{position:fixed;left:12px;bottom:12px;z-index:10000;color:#173445;font:14px system-ui,sans-serif}.theme-music button,.theme-music select{font:inherit;cursor:pointer;border:1px solid #7796a3;border-radius:9px;padding:8px;background:#fff;color:#173445}.theme-toggle{box-shadow:0 3px 12px #0003}.theme-panel{width:min(340px,calc(100vw - 24px));max-height:75vh;overflow:auto;padding:12px;border-radius:14px;background:#fff;box-shadow:0 6px 24px #0005}.theme-head{display:flex;align-items:center;justify-content:space-between}.theme-panel p{margin:8px 0;line-height:1.4}.theme-panel label{display:flex;gap:8px;align-items:center}.theme-power{margin-top:8px}.theme-video iframe{display:block;width:100%;height:190px;margin-top:8px;border:0}.theme-note{font-size:12px;color:#4e626b}';doc.head.append(style);doc.body.append(root);
  const toggle=root.querySelector('.theme-toggle'),panel=root.querySelector('.theme-panel'),power=root.querySelector('.theme-power'),select=root.querySelector('.theme-track'),video=root.querySelector('.theme-video');
  function render(){select.value=settings.track;power.textContent=settings.enabled?'关闭音乐':'开启音乐';power.setAttribute('aria-pressed',String(settings.enabled));video.replaceChildren();if(settings.enabled){const frame=doc.createElement('iframe');frame.title='哔哩哔哩音乐播放器';frame.src=musicPlayerUrl(settings.track);frame.allow='autoplay; fullscreen';frame.referrerPolicy='strict-origin-when-cross-origin';video.append(frame);}}
  function save(){try{storage.setItem(KEY,JSON.stringify(settings));}catch{}render();}
  toggle.onclick=()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));};
  root.querySelector('.theme-collapse').onclick=()=>{panel.hidden=true;toggle.setAttribute('aria-expanded','false');};
  power.onclick=()=>{settings.enabled=!settings.enabled;save();};
  select.onchange=()=>{if(tracks.some(t=>t.id===select.value)){settings.track=select.value;save();}};
  win.addEventListener('storage',event=>{if(event.key===KEY){settings=readMusicSettings(storage);render();}});
  render();
}
