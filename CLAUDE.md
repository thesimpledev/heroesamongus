# Good People (heroesamongus.art)

Static site. Hand-written pages: `gallery.html`, `about.html`, `404.html`. Generated
pages (never committed): `index.html` and `p/<slug>.html`, plus `sitemap.xml` and
`robots.txt`, all written by `go run ./cmd/sitegen` from the single template
`templates/page.html.tmpl` (home and person page share it; edit the template, not
`index.html`). Go code: `internal/site` (load, validate, render, generate) and
`cmd/sitegen`, standard library only. `style.css` keeps all colours as custom properties
(light defaults, dark overrides); `app.js` and `gallery.js` (ES modules) use the pure
logic in `select.mjs` and DOM helpers in `dom.mjs`; `theme.js` is a classic script loaded
in `<head>` because the CSP forbids inline scripts. `edge/urls.js` is the CloudFront
Function that maps clean URLs (`/people/<slug>`, `/people`, `/about`) to files and
redirects legacy forms; after editing it, redeploy it by hand as DEPLOY.md describes.
People are in `data/heroes.json`, portraits committed in `assets/` (fetched from
Wikimedia Commons with the curl recipe in `README.md`).

- Tests: `node --test` and `go test ./...` from the project root (no packages).
  `test/select.test.mjs` covers the selection, link and storage logic;
  `test/theme.test.mjs` the theme resolution; `test/urls.test.mjs` the CloudFront
  Function; `test/data.test.mjs` validates every entry in `data/heroes.json`;
  `internal/site/site_test.go` the generator against `internal/site/testdata`.
- Local server: `go run ./cmd/sitegen`, then `python -m http.server 8000 --bind 127.0.0.1`
  from the project root. No URL mapping locally: person pages are `/p/<slug>.html`.
- Deploy: push a `v*` tag; `.github/workflows/deploy.yml` deploys through OIDC.
  `DEPLOY.md` describes the flow. Resource identifiers are never committed; they live
  in the private config bucket (`heroesamongus/infra.md`) and GitHub secrets.
  Production only; there is no beta environment.
- Editorial rules are in `README.md`: verified facts, original reflections (never
  quotations attributed to the person), Commons-licensed photos with author, licence
  and source recorded per entry.
