import {createRoomCipher} from './room-crypto.mjs';
// A room uses one shared broker. Its prefix keeps all devices on the same relay.
export const ROOM_PATTERN=/^[12][A-HJ-NP-Z2-9]{7}$/;
export const ROOM_BROKERS=['wss://broker.emqx.io:8084/mqtt','wss://broker.hivemq.com:8884/mqtt'];
export function makePlayerId(){return Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');}
export function makeRoomCode(broker=0){const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',bytes=crypto.getRandomValues(new Uint8Array(7));return String(broker+1)+Array.from(bytes,b=>alphabet[b%32]).join('');}
const enc=new TextEncoder(),dec=new TextDecoder();
function cat(...parts){const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let offset=0;for(const p of parts){out.set(p,offset);offset+=p.length;}return out;}
function str(s){const b=enc.encode(s);return cat(new Uint8Array([b.length>>8,b.length&255]),b);}
function packet(header,body){let n=body.length,bytes=[];do{let b=n%128;n=Math.floor(n/128);bytes.push(b|(n?128:0));}while(n);return cat(new Uint8Array([header,...bytes]),body);}
export function parsePackets(buffer){let offset=0;const packets=[];while(offset+2<=buffer.length){let pos=offset+1,size=0,mul=1,count=0,complete=false;while(pos<buffer.length&&count++<4){const b=buffer[pos++];size+=(b&127)*mul;if(!(b&128)){complete=true;break;}mul*=128;}if(!complete||pos+size>buffer.length)break;if(size>65536)throw new Error('MQTT packet too large');packets.push({type:buffer[offset]>>4,flags:buffer[offset]&15,payload:buffer.slice(pos,pos+size)});offset=pos+size;}return {packets,remaining:buffer.slice(offset)};}
export async function connectRoom({code,id,scope='level16',onMessage=()=>{},onStatus=()=>{},WebSocketClass=globalThis.WebSocket}){
  if(!ROOM_PATTERN.test(code))throw new Error('房间码是8位，以1或2开头');
  const cipher=await createRoomCipher({code,id,scope});
  const {topic}=cipher,seal=message=>cipher.seal(message),unseal=body=>cipher.open(body);
  const will=await seal({type:'bye'});let ws=null,closed=false,online=false,buffer=new Uint8Array(),retry=0,timeout=0,ping=0,reconnect=0;
  const report=s=>{online=s==='online';onStatus(s);};
  function write(bytes){if(ws?.readyState!==1)return false;try{ws.send(bytes);return true;}catch{return false;}}
  function subscribe(){write(packet(0x82,cat(new Uint8Array([0,1]),str(topic),new Uint8Array([0]))));}
  async function process(bytes,socket){if(socket!==ws)return;buffer=cat(buffer,bytes);const parsed=parsePackets(buffer);buffer=parsed.remaining;for(const p of parsed.packets){if(p.type===2){if(p.payload[1]!==0){socket.close();return;}subscribe();}else if(p.type===9){if(p.payload.length<3||p.payload[2]===128){socket.close();return;}clearTimeout(timeout);retry=0;report('online');}else if(p.type===3){const size=(p.payload[0]<<8)|p.payload[1];if(dec.decode(p.payload.slice(2,2+size))!==topic)continue;const skip=(p.flags&6)?2:0;const message=await unseal(dec.decode(p.payload.slice(2+size+skip)));if(socket===ws&&!closed&&message&&message.id!==id)onMessage(message);}}}
  function open(){if(closed)return;report('connecting');buffer=new Uint8Array();const socket=new WebSocketClass(ROOM_BROKERS[Number(code[0])-1],['mqtt']);ws=socket;socket.binaryType='arraybuffer';timeout=setTimeout(()=>socket.close(),9000);
    socket.onopen=()=>{write(packet(0x10,cat(str('MQTT'),new Uint8Array([4,6,0,30]),str('lc'+id.replace(/[^a-zA-Z0-9]/g,'').slice(0,20)),str(topic),str(will))));ping=setInterval(()=>write(new Uint8Array([0xc0,0])),18000);};
    socket.onmessage=event=>{Promise.resolve(event.data instanceof Blob?event.data.arrayBuffer():event.data).then(data=>process(data instanceof ArrayBuffer?new Uint8Array(data):enc.encode(String(data)),socket)).catch(()=>socket.close());};
    socket.onerror=()=>{};socket.onclose=()=>{if(socket!==ws)return;clearTimeout(timeout);clearInterval(ping);ws=null;report('offline');if(!closed)reconnect=setTimeout(open,Math.min(5000,800*2**retry++));};
  }
  open();
  return {code,get online(){return online;},async send(message){if(!online||closed)return false;const sealed=await seal(message);return !closed&&online&&write(packet(0x30,cat(str(topic),enc.encode(sealed))));},close(){if(closed)return;write(packet(0x30,cat(str(topic),enc.encode(will))));closed=true;clearTimeout(timeout);clearTimeout(reconnect);clearInterval(ping);write(new Uint8Array([0xe0,0]));ws?.close();ws=null;online=false;}};
}
