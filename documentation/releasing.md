# Releasing and deployment

The release model matches encrypt-rsa: generated VitePress output is committed under `docs/`, and npm publishing uses GitHub Actions OIDC with a version check.

## GitHub Pages

Source pages live in `documentation/`; `npm run docs` builds the site to `docs/`. The generated output includes `.nojekyll` and `CNAME` for `otp.js.org`.

After merging the migration, set repository **Settings → Pages → Deploy from a branch** to **master /docs**. The old site uses **development /docs**. Keep the custom domain `otp.js.org`.

CI rebuilds the docs and requires the generated output to match the committed site. GitHub Pages deploys that directory when changes reach master. No npm release is needed for a docs-only change.

## Configure npm trusted publishing

In the npm package settings for `gen-totp`, add a GitHub Actions trusted publisher with:

| Field | Value |
| --- | --- |
| Organization or user | `miladezzat` |
| Repository | `gen-totp` |
| Workflow filename | `publish.yml` |
| Environment | Leave blank |

The workflow uses Node.js 24, npm 11.13.0, and `id-token: write`. It publishes without `NPM_TOKEN`. Configure the trusted publisher before merging a version bump. After confirming trusted publication, remove the obsolete token from the repository if it is no longer used elsewhere.

## Release a new version

1. Choose the version appropriate for the compatibility changes and update the changelog.
2. Run `npm run release` or update package metadata using your normal release process.
3. Run the full validation commands, rebuild the docs, and commit all changed files, including `package-lock.json`.
4. Merge the reviewed release into master.

`publish.yml` compares the stable local version with npm latest. Equal versions skip publication; lower versions fail; higher versions run lint, tests, package installation checks, and docs checks before publishing.

After a successful publish, the workflow polls the exact npm version and checks its integrity metadata. A registry timeout fails verification without publishing again. Inspect npm before retrying a release.

## Validate locally

```sh
node scripts/check-release.js
node scripts/verify-release.js
```

These commands read npm metadata. They do not publish a package. `npm run test:release` tests the version gate and verification behavior using stubbed registry responses.
