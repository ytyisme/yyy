// Procedural audio: the engine runs once and changes power through the flight.
export function createCitySound(host){
 let context=null,enabled=true,motor=null;
 function unlock(){if(!enabled)return;try{const Audio=host.AudioContext||host.webkitAudioContext;if(!Audio)return;context??=new Audio();if(context.state==='suspended')context.resume().catch(()=>{});}catch{}}
 function tone(f,duration=.1,type='sine',volume=.05){if(!enabled||context?.state!=='running')return;const osc=context.createOscillator(),gain=context.createGain(),now=context.currentTime;osc.type=type;osc.frequency.setValueAtTime(f,now);gain.gain.setValueAtTime(volume,now);gain.gain.exponentialRampToValueAtTime(.001,now+duration);osc.connect(gain);gain.connect(context.destination);osc.start(now);osc.stop(now+duration);}
 function noise(duration,volume,frequency){if(!enabled||context?.state!=='running')return;const source=context.createBufferSource(),buffer=context.createBuffer(1,Math.ceil(context.sampleRate*duration),context.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.min(1,i/(context.sampleRate*.025));source.buffer=buffer;const filter=context.createBiquadFilter(),gain=context.createGain(),now=context.currentTime;filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=.6;gain.gain.setValueAtTime(volume,now);gain.gain.exponentialRampToValueAtTime(.001,now+duration);source.connect(filter);filter.connect(gain);gain.connect(context.destination);source.start();source.stop(now+duration);}
 function stopEngine(){if(!motor)return;for(const source of motor.sources){try{source.stop();source.disconnect();}catch{}}motor.gain.disconnect();motor=null;}
 function speak(text){
  if(!enabled||!text||!host.speechSynthesis||!host.SpeechSynthesisUtterance)return false;
  try{const utterance=new host.SpeechSynthesisUtterance(text);utterance.lang='zh-CN';utterance.rate=.95;const voice=host.speechSynthesis.getVoices().find(v=>/^zh[-_]/i.test(v.lang));if(voice)utterance.voice=voice;host.speechSynthesis.cancel();host.speechSynthesis.speak(utterance);return true;}catch{return false;}
 }
 function engine(stage,velocity=0){
  if(!enabled||['docking','disembark'].includes(stage)){stopEngine();return;}unlock();if(context?.state!=='running')return;
  if(!motor){
   const gain=context.createGain();gain.gain.value=0;gain.connect(context.destination);
   const source=context.createBufferSource(),buffer=context.createBuffer(1,context.sampleRate*2,context.sampleRate),data=buffer.getChannelData(0);let last=0;for(let i=0;i<data.length;i++){last=.94*last+.06*(Math.random()*2-1);data[i]=last*3;}source.buffer=buffer;source.loop=true;const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=800;source.connect(filter);filter.connect(gain);source.start();
   const hum=context.createOscillator();hum.type='sawtooth';hum.frequency.value=55;const humGain=context.createGain();humGain.gain.value=.08;hum.connect(humGain);humGain.connect(gain);hum.start();motor={gain,filter,hum,sources:[source,hum]};
  }
  const power=stage==='takeoff'?.4+velocity/300*.45:stage==='climb'?.75:stage==='cruise'?.5:stage==='landing'?.35:stage==='boarding'?.1:.23;
  motor.gain.gain.setTargetAtTime(power*.25,context.currentTime,.3);motor.filter.frequency.setTargetAtTime(350+power*1400,context.currentTime,.4);motor.hum.frequency.setTargetAtTime(45+power*95,context.currentTime,.4);
 }
 return {unlock,engine,stopEngine,speak,play(kind){unlock();if(kind==='indicator')tone(800,.06,'triangle',.04);if(kind==='crossing')tone(740,.3,'sine',.045);if(kind==='brake'){tone(160,.2,'sawtooth',.035);tone(90,.24,'triangle',.03);}if(kind==='eat'){tone(260,.08,'sawtooth',.02);tone(390,.12,'triangle',.02);}if(kind==='toll')tone(1040,.18,'sine',.07);if(kind==='flight')tone(600,.4,'sine',.03);if(kind==='touchdown'){noise(1.4,.6,2400);tone(480,.55,'sawtooth',.055);tone(85,.4,'triangle',.08);}},toggle(){enabled=!enabled;if(!enabled){host.speechSynthesis?.cancel();stopEngine();context?.suspend().catch(()=>{});}else unlock();return enabled;},get engineRunning(){return !!motor}};
}
