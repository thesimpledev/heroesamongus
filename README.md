# Good People

A little reminder that good people exist.

Static, dependency-free site: HTML + CSS + JavaScript + JSON. Designed for AWS S3 + optional CloudFront.

## Set up

1. `python -m pip install requests` (the download tool's only dependency)
2. `python tools/download_images.py` (downloads each person's Wikimedia Commons photograph into `assets/` as a 1200px-wide thumbnail)
3. `python -m http.server 8000 --bind 127.0.0.1` (run from the project directory)
4. Visit http://127.0.0.1:8000

`assets/` is not committed. If automated download fails, open the `imageCredit.source` page for the relevant person in `data/heroes.json`, download that file manually, and save it under the corresponding `image` path. Record the downloaded file's pixel `width` and `height` in the entry. Check the exact file licensing before publishing.

## Test

`node --test` from the project directory. Uses Node's built-in test runner, no packages. The tests cover the selection and share-link logic in `select.mjs` and validate every entry in `data/heroes.json` (required fields, unique slugs, years format, image path and dimensions, licence and source links).

## Deploy

The site lives at https://heroesamongus.art in a private S3 bucket behind CloudFront with an origin access control. `DEPLOY.md` records the resources and the exact upload commands. All routes work with S3 because person links use `/?person=<slug>` rather than client-side path rewrites.

Cache headers: HTML, CSS, JS and `data/heroes.json` are uploaded with `max-age=300`; portraits with `max-age=86400`. Invalidate the distribution after each upload.

## Editorial notes

`reflection` strings are original site copy, not historical quotations. Do not put quotation marks around them in a way that attributes them to the person. Image authors/licenses are per Wikimedia Commons file pages; verify before launch, especially public-domain assessments and ShareAlike obligations. Images may have personality/publicity rights in addition to copyright.

## Add a person

Add a new object to `data/heroes.json` with a unique slug, write a short verified description, find an appropriately licensed photo, download to `assets/`, record photographer/license/source and the image's pixel width and height. Run `node --test` to check the entry. No code changes needed.
