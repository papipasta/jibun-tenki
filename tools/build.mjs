// 使い方: node tools/build.mjs <元のHTML> <パスワードのファイル>  → index.html（鍵付き）を書き出す
import { readFileSync, writeFileSync } from 'node:fs';
const [src, pwFile] = process.argv.slice(2);
const plain = readFileSync(src, 'utf8'), pw = readFileSync(pwFile, 'utf8').trim();
const ITER = 600000, enc = new TextEncoder(), b64 = u => Buffer.from(u).toString('base64');
const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plain)));
const payload = JSON.stringify({ v: 1, it: ITER, s: b64(salt), i: b64(iv), c: b64(ct) });
const page = `<!DOCTYPE html>
<html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow,noarchive">
<meta name="theme-color" content="#f4efe4">
<title>じぶん天気</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Zen+Antique&family=Kiwi+Maru:wght@400;500&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;min-width:0}
html,body{margin:0;height:100%}
body{background:#f4efe4;color:#2a2320;font:16px/1.6 'Kiwi Maru',serif;display:grid;place-items:center;padding:24px max(20px,env(safe-area-inset-left)) calc(24px + env(safe-area-inset-bottom))}
form{width:100%;max-width:340px;background:#fffaf0;border:1.5px solid #e2d8c6;border-radius:20px;padding:28px 22px 22px;text-align:center}
h1{font:400 2rem/1.1 'Zen Antique',serif;margin:0 0 6px}
p{margin:0 0 18px;color:#7a6e66;font-size:.9rem}
input[type=password]{width:100%;min-height:48px;font:inherit;font-size:16px;border:1.5px solid #e2d8c6;border-radius:12px;background:#fff;padding:0 14px;text-align:center;letter-spacing:.05em}
input[type=password]:focus{outline:2px solid #a8323a;outline-offset:1px}
label{display:flex;align-items:center;justify-content:center;gap:8px;margin:14px 0 16px;font-size:.9rem;min-height:44px;cursor:pointer}
label input{width:20px;height:20px;accent-color:#a8323a}
button{width:100%;min-height:48px;border:0;border-radius:12px;background:#a8323a;color:#fff;font:inherit;font-weight:500;cursor:pointer}
button:disabled{opacity:.6}
#e{min-height:1.5em;margin:12px 0 0;color:#a8323a;font-size:.88rem}
</style></head><body>
<form id="f" autocomplete="off"><h1>じぶん天気</h1><p>パスワードを入れて開きます</p>
<input type="password" id="p" aria-label="パスワード" autocomplete="current-password" required>
<label><input type="checkbox" id="r" checked>この端末で記憶する</label>
<button id="b">ひらく</button><div id="e" role="alert"></div></form>
<script>
{
const P=${payload},K='jibun-tenki-key',u=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function open(key){const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:u(P.i)},key,u(P.c));const h=new TextDecoder().decode(pt);document.open();document.write(h);document.close()}
async function fromRaw(raw){return crypto.subtle.importKey('raw',u(raw),'AES-GCM',true,['decrypt'])}
(async()=>{let raw=null;try{raw=localStorage.getItem(K)}catch(e){}
  if(raw){try{await open(await fromRaw(raw));return}catch(e){try{localStorage.removeItem(K)}catch(_){}}}
  document.getElementById('p').focus()})();
document.getElementById('f').addEventListener('submit',async ev=>{ev.preventDefault();const b=document.getElementById('b'),E=document.getElementById('e');
  b.disabled=true;b.textContent='確かめています…';E.textContent='';
  try{const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(document.getElementById('p').value.trim()),'PBKDF2',false,['deriveKey']);
    const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:u(P.s),iterations:P.it,hash:'SHA-256'},base,{name:'AES-GCM',length:256},true,['decrypt']);
    const raw=new Uint8Array(await crypto.subtle.exportKey('raw',key));
    await crypto.subtle.decrypt({name:'AES-GCM',iv:u(P.i)},key,u(P.c));
    if(document.getElementById('r').checked){try{localStorage.setItem(K,btoa(String.fromCharCode(...raw)))}catch(e){}}
    await open(key)}
  catch(e){E.textContent=crypto.subtle?'パスワードがちがいます':'このブラウザでは開けません';b.disabled=false;b.textContent='ひらく'}});
}
</script></body></html>
`;
writeFileSync('index.html', page);
console.log('built', page.length, 'bytes');
