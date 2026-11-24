# Operations and release

> CI jobs, the release procedure, npm trusted publishing and how this site is built.

## CI (GitHub Actions)

| Job | What it proves |
|---|---|
| test | `npm test`, `doctor`, `demo` and `audit` on Ubuntu (Node 22, 24), Windows (22, 24), macOS (24) |
| browser | Real Chromium + axe-core tests must run with zero skips on Ubuntu |
| package | `npm pack`, install the tarball in an empty project, run the CLI through the npm bin shim, demo, audit, verify, install-ide |
| secrets-scan | No token patterns committed |

The assurance report from the Ubuntu Node 24 run is uploaded as an artifact.

{{svg:ci}}

## Release steps

1. Bump version in `package.json`, `packages/core/version.mjs`, `.claude-plugin/plugin.json`, `CITATION.cff`.
2. `npm test`, `npm run proof`, `npm run docs:build`, `npm run demo`, `npm run audit`; commit regenerated outputs.
3. Tag `vX.Y.Z` and push. The Release workflow verifies the tag, runs tests and publishes with provenance.
4. Create the GitHub release with notes from the changelog.

## npm trusted publishing

First publish of a new package must be done by the owner (`npm publish --access public`). Then link the repository and `release.yml` as a trusted publisher on npmjs.com so later tags publish without a stored token.

## Pages

`pages.yml` publishes `documents/html` to GitHub Pages, including `llms.txt`, `robots.txt` and `sitemap.xml`.

## Rebuild docs

```bash
npm run proof && npm run docs:build
```

## Support policy

Best effort. Node.js 22 and 24 are tested. Older Node versions are unsupported.
