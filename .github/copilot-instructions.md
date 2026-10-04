# Repository guidance

This is a Node.js TypeScript library for RFC 6238 TOTP and RFC 4226 HOTP.

## Commands

- Install: `npm ci` (Node 24 is pinned in `.nvmrc`; CI also checks Node 22).
- Lint: `npm run lint`; fix: `npm run lint:fix`.
- Build: `npm run build` (CommonJS, ESM, and declarations under `dist/`).
- Test: `npm test` (TypeScript tests compile with `tsconfig.test.json` before Mocha).
- Release tests: `npm run test:release` (stubbed registry responses).
- Package checks: `npm run smoke` and `npm run smoke:install`.
- Docs: `npm run docs:serve`, `npm run docs`, `npm run docs:preview`.
- Docs checks: `npm run smoke:docs` and `npm run smoke:docs:browser`.

## Source and public API

All runtime logic is in `src/index.ts`. Preserve `default genTOTP`, named OTP/encoding/formatting helpers, and exported option types. Consumers use CommonJS named imports or native ESM default/named imports.

Keys become complete HEX bytes before HMAC generation with jssha. UTF-8 uses `Buffer.from`; HEX validates complete byte pairs; Base32 validates alphabet, length, padding, and unused bits. Counters are non-negative safe integers written as 16-character big-endian hex. Dynamic truncation produces a fixed-width decimal string.

TOTP timestamps are Unix milliseconds; periods are seconds. `verifyTOTP` defaults to window 1 and skips negative counters. `verifyHOTP` defaults to lookahead 10 and returns `{ newCounter }` or `null`. Windows are bounded to 0 through 1000. Token comparison uses `timingSafeEqual`, and verification scans the full window.

## Changes and validation

Every behavior fix needs regression coverage. Use the complete RFC vectors and independent Node crypto comparisons. Package entry changes must pass packed installation checks with CommonJS, native ESM, and TypeScript consumers.

Edit documentation source in `documentation/`, then run `npm run docs` and commit the generated `docs/` output. Keep README, changelog, and API guides consistent with actual behavior. Preserve `otp.js.org` and the license terms in `LICENSE.md`.

## Release

The `publish.yml` workflow compares the local stable version with npm latest, skips equal versions, rejects older versions, and uses OIDC to publish only a new version. npm trusted publisher settings must authorize `miladezzat/gen-totp` and `publish.yml`. See `documentation/releasing.md`.

Commits and PRs are authored by the user alone. Do not add model coauthors, generated-by footers, branding, or author overrides.
