# Good People

A little reminder that good people exist.

Static, dependency-free site: HTML + CSS + JavaScript + JSON. Designed for AWS S3 + optional CloudFront.

## Set up

`assets/` is not committed. Download each portrait from Wikimedia Commons as a 1200px-wide thumbnail, using the file name from the entry's `imageCredit.source` page:

```
curl -sSL --create-dirs -A 'GoodPeopleSite/0.1 (heroesamongus.art)' -o assets/<slug>.jpg 'https://commons.wikimedia.org/wiki/Special:FilePath/<File name>?width=1200'
```

Commons returns the original when it is narrower than 1200px. A PNG source comes back as PNG; convert it with `magick assets/<slug>.png -quality 85 assets/<slug>.jpg`. Record the downloaded file's pixel `width` and `height` in the entry (`identify assets/<slug>.jpg`). Check the exact file licensing before publishing.

Local preview: `python -m http.server 8000 --bind 127.0.0.1` from the project directory, then visit http://127.0.0.1:8000.

## Test

`node --test` from the project directory. Uses Node's built-in test runner, no packages. The tests cover the selection and share-link logic in `select.mjs` and validate every entry in `data/heroes.json` (required fields, unique slugs, years format, image path and dimensions, licence and source links).

## Deploy

The site lives at https://heroesamongus.art in a private S3 bucket behind CloudFront with an origin access control. `DEPLOY.md` records the resources and the exact upload commands. All routes work with S3 because person links use `/?person=<slug>` rather than client-side path rewrites.

Cache headers: HTML, CSS, JS and `data/heroes.json` are uploaded with `max-age=300`; portraits with `max-age=86400`. Invalidate the distribution after each upload.

## Editorial notes

`reflection` strings are original site copy, not historical quotations. Do not put quotation marks around them in a way that attributes them to the person. Image authors/licenses are per Wikimedia Commons file pages; verify before launch, especially public-domain assessments and ShareAlike obligations. Images may have personality/publicity rights in addition to copyright.

## Add a person

Add a new object to `data/heroes.json` with a unique slug, write a short verified description, find an appropriately licensed photo, download to `assets/`, record photographer/license/source and the image's pixel width and height. Run `node --test` to check the entry. No code changes needed.
