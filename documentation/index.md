---
layout: home
hero:
  name: gen-totp
  text: One-time passwords. Simple, typed APIs.
  tagline: Generate and verify TOTP and HOTP in Node.js. Set up authenticators with secure random secrets and a small, focused API.
  image:
    src: /logo.svg
    alt: A clock with a one-time password
  actions:
    - theme: brand
      text: Get started
      link: /getting-started
    - theme: alt
      text: Explore the API
      link: /api/reference
features:
  - title: Time-based passwords
    details: Generate fixed-width codes with a 30-second default period and verify a configurable clock-drift window.
    link: /totp
  - title: Counter-based passwords
    details: Generate HOTP codes and receive the next counter after verification, ready to persist in your application.
    link: /hotp
  - title: Authenticator setup
    details: Create cryptographically random Base32 secrets and otpauth URIs for QR-code enrollment.
    link: /authenticators
  - title: Explicit encodings
    details: Choose UTF-8, hexadecimal, or Base32. Validation catches malformed secrets and invalid configuration.
    link: /encodings
  - title: Tested against RFC vectors
    details: The test suite covers all RFC 4226 HOTP and RFC 6238 SHA-1, SHA-256, and SHA-512 reference vectors.
    link: /contributing
  - title: Ready for Node.js
    details: CommonJS and native ESM entry points, TypeScript declarations, and installed-package smoke checks.
    link: /getting-started
---

## From secret to code

```ts
import genTOTP, { generateSecretKey, verifyTOTP } from 'gen-totp';

const secret = generateSecretKey();
const options = { encoding: 'base32' as const };
const token = genTOTP(secret, options);
const valid = verifyTOTP(secret, token, options);
```

Start with [authenticator setup](/authenticators) to enroll a user, or open the [API reference](/api/reference) for every function and option.
