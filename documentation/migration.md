# Migration

Version **4.0.0** contains the compatibility changes listed below and in the [changelog](/changelog). The major version reflects the Node.js 22 requirement and stricter validation. Upgrade only after reviewing your runtime and stored secrets.

## Package imports

The compiler now emits `dist/index.js`, matching the published entry point. Native ESM default imports now resolve to the callable `genTOTP` function. CommonJS named exports and TypeScript imports remain available.

The supported runtime is Node.js 22 or later. This package uses Node crypto and does not provide a standalone browser build.

## Correctly padded codes

All generated OTPs now contain exactly `digits` characters, including leading zeroes. Keep submitted codes as strings. Previously shortened codes are rejected by verification.

## Strict inputs

The generation and verification APIs reject invalid digit counts, periods, counters, timestamps, encodings, algorithms, and windows. Verification windows are capped at 1000.

Base32 decoding now returns complete bytes. Keys whose decoded byte length was not a multiple of five may have produced incorrect codes or thrown before this fix. Invalid padding and unused bits are rejected. Hex input must contain whole bytes.

Review any stored noncanonical secrets before releasing. Correct canonical secrets and standard settings retain their RFC outputs.

## Authenticator URIs

Secrets are normalized to uppercase, unpadded Base32. Empty labels, labels containing colons, fractional periods, digit counts outside 6/8, and algorithms outside SHA-1/SHA-256/SHA-512 are rejected. The default enrollment settings are unchanged.

## Documentation links

The VitePress site keeps `otp.js.org`. Links from the former Docsify site to its home and changelog are redirected to the new guides.
