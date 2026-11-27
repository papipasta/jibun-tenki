# じぶん天気（鍵付き）

個人用のページです。開くにはパスワードが必要です。

- `index.html` は暗号化されています（AES-GCM／PBKDF2 60万回）。
- 作り直し: `node tools/build.mjs <元のHTML> <パスワードのファイル>`
- 取り出し: `node tools/decrypt.mjs <パスワード> > src.html`
