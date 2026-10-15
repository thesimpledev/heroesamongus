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

`.github/workflows/deploy.yml` runs the tests, assumes the deploy role through the GitHub
OIDC provider (trust limited to `v*` tags of this repository), uploads in phases
(portraits, then code and data, then HTML), invalidates the distribution, removes files no
longer in the repository, and checks the live site. The role allows only list, get, put and
delete on the site bucket and invalidations on the distribution.

Secrets the workflow reads: `WEBSITE_DEPLOY_ROLE_ARN`, `PROD_S3_BUCKET`,
`PROD_CLOUDFRONT_DISTRIBUTION_ID`. They are secrets rather than variables so the public
job log never prints them.

## Cache behaviour

HTML, CSS, JS and `data/heroes.json` are served with `max-age=300`; portraits with
`max-age=86400`. The CachingOptimized policy ignores query strings, so `/?person=slug` is
the cached root page with the slug read client-side. Origin 403 and 404 both return
`/404.html` with status 404.

## Manual upload (fallback)

One `put-object` per file with `aws-sec` (it refuses `aws s3 cp` and `aws s3 sync`), using
the same content types and cache-control values as the workflow, then an invalidation of
`/*`. Fetch the bucket and distribution from `heroesamongus/infra.md` in the config bucket.

## Rollback

Tag the previous commit again (for example `v1.2.4` pointing at the last good commit) and
push the tag. The bucket is not versioned.
