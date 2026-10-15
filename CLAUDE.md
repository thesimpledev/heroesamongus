# Good People (heroesamongus.art)

Static site: `index.html`, `style.css`, `app.js` (ES module) with the pure logic in
`select.mjs`, people in `data/heroes.json`, portraits in `assets/` (ignored by git,
downloaded from Wikimedia Commons with the curl recipe in `README.md`).

- Tests: `node --test` from the project root (Node built-in runner, no packages).
  `test/select.test.mjs` covers the selection and share-link logic;
  `test/data.test.mjs` validates every entry in `data/heroes.json`.
- Local server: `python -m http.server 8000 --bind 127.0.0.1` from the project root.
- Deploy: `DEPLOY.md` has the bucket, distribution and the exact upload commands.
  Production only; there is no beta environment.
- Editorial rules are in `README.md` and `LLM_PROMPT.md`: verified facts, original
  reflections (never quotations attributed to the person), Commons-licensed photos with
  author, licence and source recorded per entry.
