# Good People (heroesamongus.art)

Static site: `index.html`, `gallery.html`, `about.html`, `404.html`; `style.css` with all
colours as custom properties (light defaults, dark overrides); `app.js` and `gallery.js`
(ES modules) with the pure logic in `select.mjs` and DOM helpers in `dom.mjs`; `theme.js`
is a classic script loaded in `<head>` because the CSP forbids inline scripts. People are
in `data/heroes.json`, portraits committed in `assets/` (fetched from Wikimedia Commons
with the curl recipe in `README.md`).

- Tests: `node --test` from the project root (Node built-in runner, no packages).
  `test/select.test.mjs` covers the selection, link and storage logic;
  `test/theme.test.mjs` the theme resolution; `test/data.test.mjs` validates every entry
  in `data/heroes.json`.
- Local server: `python -m http.server 8000 --bind 127.0.0.1` from the project root.
- Deploy: push a `v*` tag; `.github/workflows/deploy.yml` deploys through OIDC.
  `DEPLOY.md` describes the flow. Resource identifiers are never committed; they live
  in the private config bucket (`heroesamongus/infra.md`) and GitHub secrets.
  Production only; there is no beta environment.
- Editorial rules are in `README.md`: verified facts, original reflections (never
  quotations attributed to the person), Commons-licensed photos with author, licence
  and source recorded per entry.
