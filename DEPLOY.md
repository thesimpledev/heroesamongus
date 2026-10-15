# Deploying heroesamongus.art

Production only (no beta). Static files in a private S3 bucket behind CloudFront with an
origin access control, a Route 53 zone, and an ACM certificate in us-east-1 (the region
CloudFront requires for certificates).

Resource identifiers (zone, certificate, bucket, origin access control, response headers
policy, distribution, deploy role) are deliberately not in this repository. They live in
the private config bucket under `heroesamongus/infra.md` and in the repository's GitHub
secrets.

## Release

Commit on `master`, push, then tag and push the tag:

```
git tag -a v1.2.3 -m "v1.2.3: what changed"
git push origin v1.2.3
gh run watch
```

`.github/workflows/deploy.yml` runs the Node and Go tests, generates the pages
(`go run ./cmd/sitegen`), assumes the deploy role through the GitHub OIDC provider (trust
limited to `v*` tags of this repository), uploads in phases (portraits, then code, data
and sitemap, then HTML), invalidates the distribution, removes files no longer in the
repository or the generated output, and checks the live site. The role allows only list,
get, put and delete on the site bucket and invalidations on the distribution. The runner
is pinned to `ubuntu-24.04`; Go comes from the runner's cached tools through
`actions/setup-go`, nothing is downloaded.

## Clean URLs (CloudFront Function)

`edge/urls.js` runs on every viewer request:

| Request | Result |
| --- | --- |
| `/people/<slug>` | serves `p/<slug>.html` |
| `/people`, `/about` | serve `gallery.html`, `about.html` |
| `/?person=<slug>`, `/p/<slug>.html`, `/people/<slug>.html` | 301 to `/people/<slug>` |
| `/about.html`, `/gallery.html`, `/gallery` | 301 to `/about`, `/people` |
| trailing slash (except `/`) | 301 without it |

It is tested by `test/urls.test.mjs` and deployed by hand. After editing it:

```
aws-sec cloudfront describe-function --name heroesamongus-urls --query ETag --output text
aws-sec cloudfront update-function --name heroesamongus-urls --if-match <etag> --function-config Comment="Clean URLs and legacy redirects for heroesamongus.art",Runtime=cloudfront-js-2.0 --function-code fileb://edge/urls.js
aws-sec cloudfront test-function --name heroesamongus-urls --if-match <new etag> --stage DEVELOPMENT --event-object fileb://<event.json>
aws-sec cloudfront publish-function --name heroesamongus-urls --if-match <new etag>
```

Publishing replaces the live version at once; the distribution association does not
change.

Secrets the workflow reads: `WEBSITE_DEPLOY_ROLE_ARN`, `PROD_S3_BUCKET`,
`PROD_CLOUDFRONT_DISTRIBUTION_ID`. They are secrets rather than variables so the public
job log never prints them.

## Cache behaviour

HTML, CSS, JS, `data/heroes.json`, `sitemap.xml` and `robots.txt` are served with
`max-age=300`; portraits with `max-age=86400`. The CachingOptimized policy ignores query
strings; the cache key is the URI after the function rewrite, so each person page is
cached once. Origin 403 and 404 both return `/404.html` with status 404, which is what an
unknown `/people/<slug>` gets.

## Manual upload (fallback)

One `put-object` per file with `aws-sec` (it refuses `aws s3 cp` and `aws s3 sync`), using
the same content types and cache-control values as the workflow, then an invalidation of
`/*`. Fetch the bucket and distribution from `heroesamongus/infra.md` in the config bucket.

## Rollback

Tag the previous commit again (for example `v1.2.4` pointing at the last good commit) and
push the tag. The bucket is not versioned.
