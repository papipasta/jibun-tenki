// 使い方: node tools/decrypt.mjs <パスワード> > src.html   （鍵付き index.html から元のHTMLを取り出す）
import { readFileSync } from 'node:fs';
const pw = process.argv[2], h = readFileSync('index.html', 'utf8');
const P = JSON.parse(h.match(/const P=(\{.*?\}),K=/s)[1]), u = s => Uint8Array.from(Buffer.from(s, 'base64'));
const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: u(P.s), iterations: P.it, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
process.stdout.write(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: u(P.i) }, key, u(P.c))));
