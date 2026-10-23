export const tickleLines=['嘻嘻 好痒！','哼！不跟你玩了！','哈哈哈哈，太痒了'];
const normalize=s=>String(s??'').toLowerCase().replace(/[\s，。？！、,.?!！：:]/g,'');
const chineseNumber=s=>{if(/^\d+$/.test(s))return Number(s);const n={'一':1,'二':2,'两':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9};if(s==='十')return 10;if(s.includes('十')){const [a,b]=s.split('十');return (n[a]||1)*10+(n[b]||0);}return n[s];};
export function answerQuestion(question,knowledge,previousLevel=null){
 const q=normalize(question),explicit=q.match(/第?([0-9一二两三四五六七八九十]{1,3})关/);
 let level=explicit?chineseNumber(explicit[1]):null;
 if(!level){const named=knowledge.find(e=>e.id.startsWith('level-')&&q.includes(normalize(e.title.split(' · ')[1])));level=named?.level??null;}
 if(!level&&previousLevel&&/^(那|这个|这关|它|然后|怎么联机|怎么买房|怎么保存)/.test(q))level=previousLevel;
 if(level&&level>24)return {text:'这关还没有开放，我没有它的玩法资料。蓝色版目前开放第1–24关。',source:'当前关卡列表',level};
 const ranked=knowledge.filter(e=>!level||e.level===level||e.level===null).map(e=>{
  const hits=e.keywords.filter(k=>q.includes(normalize(k)));
  let score=hits.reduce((sum,k)=>sum+Math.min(k.length,8),0);
  if(level&&e.level===level&&!e.id.startsWith('level-')&&hits.length)score+=10;
  if(e.id.startsWith('level-')&&!level)score=0;
  if(level&&e.id==='level-'+level)score=3;
  if(e.id==='skin-sync'&&q.includes('皮肤')&&/不显示|普通|对方|朋友|没有|同步/.test(q))score+=20;
  if(e.id==='yellow-levels'&&/关卡|关|待开放/.test(q)&&/黄|新|没有/.test(q))score+=12;
  return {e,score};
 }).sort((a,b)=>b.score-a.score);
 const best=ranked[0];
 if(!best||best.score<2)return {text:'这个问题我还没有收录到游戏资料里，先不乱猜啦。你可以告诉我“第几关、卡在哪一步”，或者问我皮肤、岩浆币、买房、联机。',source:'未找到可靠资料',level};
 return {text:best.e.text,source:best.e.title,level:best.e.level??level};
}
export function safeLevelHref(value){return typeof value==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_/-]*\.html(?:\?[a-zA-Z0-9_=&%-]*)?$/.test(value)&&!value.includes('..')&&!value.startsWith('//')?value:null;}
