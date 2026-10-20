import {installMcTouchClient} from './lib/mc-touch.mjs';

const origin=location.origin;
const send=packet=>{if(parent!==window)parent.postMessage(packet,origin==='null'?'*':origin);};
const touch=installMcTouchClient({window,document,notify:send});
window.addEventListener('message',event=>{
 if(event.source!==parent||event.origin!==origin)return;
 const data=event.data;if(data?.type==='mc-touch-config')touch.setEnabled(data.enabled);
 else if(data?.type==='mc-touch-input')touch.input(data.input);
});
send({type:'mc-touch-bridge'});

// Load the unchanged client and assets from the user's selected MCJS site.
// Only our launcher/input bridge is served locally; no game assets are copied.
window.eaglercraftXOpts={demoMode:false,container:'game_frame',assetsURI:'https://playmcjscc.pages.dev/1.12.2wasm/assets.epw',worldsDB:'worlds',logInvalidCerts:false,crashOnUncaughtExceptions:false,allowUpdateDL:false,allowUpdateSvc:false,allowFNAWSkins:false,allowVoiceClient:false,checkRelaysForUpdates:false,enableMinceraft:false,showBootMenuOnLaunch:false,allowBootMenu:false,relays:[{addr:'wss://relay.deev.is/',comment:'lax1dude relay #1',primary:false},{addr:'wss://relay.lax1dude.net/',comment:'lax1dude relay #2',primary:false},{addr:'wss://relay.shhnowisnottheti.me/',comment:'ayunami relay #1',primary:false},{addr:'wss://relay.mcjs.link/',comment:'MCJS Public Remote Relay',primary:true}]};
try{
 await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://playmcjscc.pages.dev/1.12.2wasm/bootstrap.js';script.crossOrigin='anonymous';script.onload=resolve;script.onerror=reject;document.head.append(script);});
 await window.main();
}catch{
 document.getElementById('client-error').hidden=false;send({type:'mc-client-error'});
}
