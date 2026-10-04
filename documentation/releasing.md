# Releasing and deployment

The release model matches encrypt-rsa: generated VitePress output is committed under `docs/`, and npm publishing uses GitHub Actions OIDC with a version check.

## GitHub Pages

Source pages live in `documentation/`; `npm run docs` builds the site to `docs/`. The generated output includes `.nojekyll` and `CNAME` for `otp.js.org`.

Repository **Settings → Pages → Deploy from a branch** must use **master /docs**. Keep the custom domain `otp.js.org`.

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

`publish.yml` first checks whether the exact stable local version already exists on npm. Existing versions skip publication, even if the `latest` tag has moved. Only an exact-version 404 permits comparison with npm latest: unpublished lower versions fail, and higher versions run lint, tests, package installation checks, and docs checks before publishing. Network errors, unexpected responses, and inconsistent metadata fail the gate without publishing.

After a successful publish, the workflow polls the exact npm version, installs it in an isolated consumer with lifecycle scripts disabled, and checks that its tarball integrity matches registry metadata. It verifies the declared runtime and type files, then runs CommonJS and native ESM consumers against RFC vectors and the new counter API. The existing-release path performs the same artifact checks. A registry timeout or broken artifact fails verification without publishing again. Inspect npm before retrying a release.

## Validate locally

```sh
node scripts/check-release.js
node scripts/verify-release.js
```

These commands do not publish a package. `check-release.js` reads npm metadata; `verify-release.js` also downloads and installs the exact version in a temporary directory, then removes it after checking the artifact. Run the verifier only after that version exists on npm. `npm run test:release` tests the gate, replication handling, and installed-artifact failure cases without publishing. Run `npm run build` first so its isolated consumer fixtures have runtime files.
