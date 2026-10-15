# Good People

A little reminder that good people exist.

Static, dependency-free site: HTML + CSS + JavaScript + JSON. Designed for AWS S3 + optional CloudFront.

Pages: the home page (one random person per visit), `/people/<slug>` (one page per person, with sharing metadata), `/people` (everyone), `/about` (why they're here) and the 404 page. A header button switches between the light and a warm grey dark theme; the choice is remembered in the browser, otherwise the system preference applies.

The home page and the person pages are generated from `templates/page.html.tmpl` by `go run ./cmd/sitegen` (standard library only), which also writes `sitemap.xml` and `robots.txt`. Generated files are not committed. Clean URLs are mapped to files by the CloudFront Function in `edge/urls.js`.

## Set up

Portraits are committed under `assets/`. To add one, download it from Wikimedia Commons as a 1200px-wide thumbnail, using the file name from the entry's `imageCredit.source` page:

```
curl -sSL --create-dirs -A 'GoodPeopleSite/0.1 (heroesamongus.art)' -o assets/<slug>.jpg 'https://commons.wikimedia.org/wiki/Special:FilePath/<File name>?width=1200'
```

Commons returns the original when it is narrower than 1200px. A PNG source comes back as PNG; convert it with `magick assets/<slug>.png -quality 85 assets/<slug>.jpg`. Record the downloaded file's pixel `width` and `height` in the entry (`identify assets/<slug>.jpg`). Check the exact file licensing before publishing.

Local preview: `go run ./cmd/sitegen`, then `python -m http.server 8000 --bind 127.0.0.1` from the project directory and visit http://127.0.0.1:8000. The local server has no URL mapping, so open person pages as `/p/<slug>.html` and the other pages by file name.

## Test

`node --test` and `go test ./...` from the project directory, no packages. The Node tests cover the selection, link and theme logic, the CloudFront Function in `edge/urls.js`, and validate every entry in `data/heroes.json` (required fields, unique slugs, years format, image path and dimensions, licence and source links). The Go tests cover the generator against a synthetic fixture.

## Deploy

The site lives at https://heroesamongus.art in a private S3 bucket behind CloudFront with an origin access control. Pushing a `v*` tag runs the GitHub Actions workflow in `.github/workflows/deploy.yml`, which runs the tests, generates the pages, assumes an AWS role through OIDC, uploads the site and invalidates the cache. `DEPLOY.md` records the flow and a manual fallback. Old `/?person=<slug>` links redirect permanently to `/people/<slug>`.

Cache headers: HTML, CSS, JS and `data/heroes.json` are uploaded with `max-age=300`; portraits with `max-age=86400`. Invalidate the distribution after each upload.

## Editorial notes

`reflection` strings are original site copy, not historical quotations. Do not put quotation marks around them in a way that attributes them to the person. Image authors/licenses are per Wikimedia Commons file pages; verify before launch, especially public-domain assessments and ShareAlike obligations. Images may have personality/publicity rights in addition to copyright.

## Add a person

Add a new object to `data/heroes.json` with a unique slug, write a short verified description, find an appropriately licensed photo, download to `assets/`, record photographer/license/source and the image's pixel width and height. Run `node --test` to check the entry. No code changes needed.
