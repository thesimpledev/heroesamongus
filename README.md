# Good People

A little reminder that good people exist.

Static, dependency-free site: HTML + CSS + JavaScript + JSON. Designed for AWS S3 + optional CloudFront.

## Set up

1. `python -m pip install requests`
2. `python tools/download_images.py` (downloads the five selected Wikimedia Commons photographs into `assets/`)
3. `python -m http.server 8000` (run from the project directory)
4. Visit http://localhost:8000

The initial ZIP intentionally contains only source and photo download tooling, not third-party photo binaries. If automated download fails, open the `imageCredit.source` page for the relevant person in `data/heroes.json`, download that file manually, and save it under the corresponding `image` path. Check the exact file licensing before publishing.

## Deploy

Upload `index.html`, `style.css`, `app.js`, `data/`, and `assets/` to your S3 site bucket. For a public site, prefer private S3 + CloudFront Origin Access Control + HTTPS. All routes work with S3 because person links use `/?person=<slug>` rather than client-side path rewrites.

Recommended cache headers: HTML short TTL; data/heroes.json 5 minutes to 1 hour; versioned assets long cache. The browser cache policy for app.js should also be short unless you version asset filenames.

## Editorial notes

`reflection` strings are original site copy, not historical quotations. Do not put quotation marks around them in a way that attributes them to the person. Image authors/licenses are per Wikimedia Commons file pages; verify before launch, especially public-domain assessments and ShareAlike obligations. Images may have personality/publicity rights in addition to copyright.

## Add a person

Add a new object to `data/heroes.json` with a unique slug, write a short verified description, find an appropriately licensed photo, download to `assets/`, record photographer/license/source. No code changes needed.
