## Purpose
This repo is a compact TypeScript library that implements RFC-6238 TOTP (and HOTP helpers). This file gives an AI coding agent the precise, code-linked guidance needed to be immediately productive.

## Quick commands
- Build: `npm run build` (outputs `dist/` via `tsc`; `package.json` `main` points at `dist/index.js`).
- Test: `npm test` (runs `mocha -r ts-node/register tests/**/*.spec.ts`). Tests import from `../src` so edit TS directly.
- Lint: `npm run lint`; auto-fix: `npm run lint:fix`.
- Coverage: `npm run coverage` (uses `nyc` + `mocha`).
- Docs: `npm run docs:serve` (docsify).

## Big picture / architecture
- Single-module library. Core implementation: `src/index.ts` — exports `default genTOTP` plus named helpers: `base32ToHex`, `bytesToBase32`, `genHOTP`, `verifyHOTP`, `verifyTOTP`, `generateSecretKey`, `generateOtpAuthUri`.
- Tests live under `tests/` and run directly against source TypeScript via `ts-node` (see `tests/index.spec.ts`, `tests/hotp.spec.ts`, `tests/rfc.spec.ts`).
- Flow: any input key is normalized to a HEX string, then `jssha` is used with that HEX key and a 64-bit time/counter HEX value. Dynamic truncation is applied to the HMAC output to produce the numeric code.

## Concrete, code-verified details (look here)
- File: `src/index.ts` — single place for all logic, encoding handling, and exported types.
- Encodings supported: `utf8` | `hex` | `base32` (see `KeyEncoding` and `genTOTP`).
	- `hex`: the code lowercases the input then validates with `/^[0-9a-f]+$/`; uppercase hex is accepted because it's lowercased prior to validation. Error thrown: `Invalid hex character in key`.
	- `base32`: `base32ToHex()` uppercases input, strips trailing `=` padding, accepts A–Z and 2–7, and throws `Invalid base32 character: <char>` on invalid glyphs.
	- `utf8`: uses `TextEncoder` to produce bytes and converts to hex.
- Time / timestamp: `genTOTP(..., timestamp?)` accepts an optional timestamp in unix milliseconds. Internally epoch seconds are computed then the time counter hex is `leftPad(decToHex(Math.floor(epoch / period)), 16, "0")` — keep this format if modifying windowing.
- HMAC: uses `new JsSHA(algorithm, "HEX")`, `setHMACKey(hexKey, "HEX")`, `update(timeHex)`, `getHMAC("HEX")`. The dynamic truncation offset is derived from the last hex nibble of the HMAC string (see `offset = hexToDec(hmac[hmac.length - 1])`).

## Verification semantics & defaults
- `verifyTOTP`: default `window = 1`, `period = 30` (see `verifyTOTP` in `src/index.ts`). Timestamp passed to `genTOTP` is in milliseconds.
- `verifyHOTP`: default `window = 10` and returns `{ newCounter }` on success or `null` on failure.

## Tests & determinism notes
- Tests use an explicit `timestamp` (unix ms) for determinism. See `tests/rfc.spec.ts` for RFC-6238 vectors and `tests/index.spec.ts` for behavior and exact error strings.
- Tests run with `mocha -r ts-node/register` so edits should be made against `src/` (not `dist/`).

## Where to make common changes
- Add/remove supported hashing algorithms: edit `FixedLengthVariantType` in `src/index.ts` and ensure `JsSHA` supports it.
- Change base32 decoding/encoding: edit `base32ToHex()` / `bytesToBase32()` in `src/index.ts` (single source of truth).
- Modify OTP windowing/counter format: update the `leftPad(decToHex(Math.floor(epoch / period)), 16, "0")` usage and adapt tests in `tests/*.spec.ts`.
- API surface: preserve `export default genTOTP` and TypeScript signatures to avoid breaking consumers.

## Dev workflow & release
- Commit: `npm run commit` (uses `git-cz`). Husky hooks installed via `npm run prepare`.
- Release: `npm run release` (uses `standard-version`). Run `npm run build` before publishing because `main`/`types` point to `dist/`.

## Small examples (from repo)
- `genTOTP('test-key')` → 6-digit default (see `tests/index.spec.ts`).
- `genTOTP('JBSWY3DPEHPK3PXP', { digits: 4, encoding: 'base32' })` → base32 example used in tests.

## Quick pointers for contributors
- Refer to `tests/rfc.spec.ts` for canonical expected outputs (RFC test vectors).
- If you change an error message or function signature, update `tests/index.spec.ts` accordingly — tests assert exact strings like `Invalid hex character in key` and `Invalid base32 character: <char>`.

If anything here is unclear or you want low-level walkthroughs (e.g., a step-through of `base32ToHex()` or how the dynamic truncation index is computed), tell me which part to expand.
