const encoder=new TextEncoder(),decoder=new TextDecoder();
const base64=bytes=>btoa(Array.from(bytes,b=>String.fromCharCode(b)).join(''));
const bytes=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));

// The JS fallback keeps the same AES-GCM wire format on HTTP LAN pages.
export async function createRoomCipher({code,id,scope='level16',subtle=globalThis.crypto?.subtle,native=globalThis.webkit?.messageHandlers?.roomCrypto}) {
  if(!['level16','city15','build18'].includes(scope))throw new Error('不支持的联机房间');
  let fallback;
  if(!subtle&&!native) {
    const [{gcm},{sha256}]=await Promise.all([import('./vendor/noble-ciphers/aes.js'),import('./vendor/noble-hashes/sha2.js')]);
    fallback={gcm,sha256};
  }
  const bridge=async payload=>bytes(await native.postMessage(payload));
  const digest=async input=>subtle?new Uint8Array(await subtle.digest('SHA-256',input)):native?bridge({op:'digest',data:base64(input)}):fallback.sha256(input);
  const hash=await digest(encoder.encode(`yyy-${scope}-v2:`+code));
  const topicHash=await digest(encoder.encode(`yyy-${scope}-topic-v2:`+code));
  const topic=`yyy/${scope}/v2/`+Array.from(topicHash,b=>b.toString(16).padStart(2,'0')).join('');
  const key=subtle?await subtle.importKey('raw',hash,{name:'AES-GCM'},false,['encrypt','decrypt']):null;
  return {
    topic,
    async seal(message) {
      const iv=crypto.getRandomValues(new Uint8Array(12)),plain=encoder.encode(JSON.stringify({...message,id}));
      const body=subtle?new Uint8Array(await subtle.encrypt({name:'AES-GCM',iv},key,plain)):native?await bridge({op:'seal',key:base64(hash),iv:base64(iv),data:base64(plain)}):fallback.gcm(hash,iv).encrypt(plain);
      const result=new Uint8Array(iv.length+body.length);result.set(iv);result.set(body,iv.length);return base64(result);
    },
    async open(body) {
      try {
        const input=bytes(body);if(input.length<29||input.length>12000)return null;
        const iv=input.slice(0,12),cipher=input.slice(12);
        const plain=subtle?await subtle.decrypt({name:'AES-GCM',iv},key,cipher):native?await bridge({op:'open',key:base64(hash),iv:base64(iv),data:base64(cipher)}):fallback.gcm(hash,iv).decrypt(cipher);
        return JSON.parse(decoder.decode(plain));
      } catch {return null;}
    }
  };
}
