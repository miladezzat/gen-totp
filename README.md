# gen-totp

[![npm version](https://img.shields.io/npm/v/gen-totp.svg)](https://www.npmjs.com/package/gen-totp)
[![CI](https://github.com/miladezzat/gen-totp/actions/workflows/ci.yml/badge.svg)](https://github.com/miladezzat/gen-totp/actions/workflows/ci.yml)

Generate and verify TOTP and HOTP in Node.js, with TypeScript types, secure random Base32 secrets, and authenticator enrollment URIs.

**[Documentation](https://otp.js.org) · [Getting started](https://otp.js.org/getting-started.html) · [API reference](https://otp.js.org/api/reference.html)**

## Install

Node.js 22 or later:

```sh
npm install gen-totp
```

## TOTP

```ts
import genTOTP, { generateSecretKey, verifyTOTP } from 'gen-totp';

const secret = generateSecretKey();
const options = { encoding: 'base32' as const };
const token = genTOTP(secret, options);
console.log(verifyTOTP(secret, token, options)); // true
```

CommonJS consumers can use `const { genTOTP, generateSecretKey } = require('gen-totp')`.

The default key encoding is UTF-8. `generateSecretKey()` returns Base32, so pass `encoding: 'base32'` for both generation and verification. Keep tokens as strings to preserve leading zeroes.

## HOTP

```ts
import { genHOTP, verifyHOTP } from 'gen-totp';

const secret = '12345678901234567890';
const token = genHOTP(secret, 0); // '755224'
const result = verifyHOTP(secret, token, 0, { window: 0 }); // { newCounter: 1 }
```

Persist `newCounter` atomically after successful verification. TOTP verification is stateless: the application must track accepted codes to prevent reuse.

`verifyTOTPWithResult(key, token, options?, timestamp?)` returns `{ counter, delta }` or `null` for application-managed replay tracking and clock drift. Persist the accepted counter atomically with the successful operation; see [verification](https://otp.js.org/verification.html).

## Authenticator enrollment

```ts
import { generateSecretKey, generateOtpAuthUri } from 'gen-totp';

const secret = generateSecretKey();
const uri = generateOtpAuthUri(secret, {
  accountName: 'user@example.com',
  issuer: 'Example App',
});
```

Render `uri` with your QR-code library. See [authenticator setup](https://otp.js.org/authenticators.html) for confirmation and compatibility.

## Options

| Option | Default | Accepted values |
| --- | --- | --- |
| `digits` | `6` | Integer from 1 to 10 |
| `period` (TOTP) | `30` | Finite positive seconds |
| `algorithm` | `SHA-1` | SHA-1, SHA-224/256/384/512, SHA3-224/256/384/512 |
| `encoding` | `utf8` | `utf8`, `hex`, `base32` |
| `window` (verification) | TOTP: `1`; HOTP: `10` | Integer from 0 to 1000 |

`genTOTP(key, options?, timestamp?)` and `verifyTOTP(key, token, options?, timestamp?)` accept **Unix milliseconds** for deterministic testing. HOTP counters must be non-negative safe integers. Hex keys contain complete bytes; Base32 keys follow RFC 4648 with optional correct padding. Invalid configuration throws. Malformed or unmatched tokens return `false` (TOTP) or `null` (HOTP).

Native ESM default imports, CommonJS named exports, and TypeScript declarations are included. The package uses Node crypto; a standalone browser build is not included.

## Development

```sh
npm ci
npm run lint
npm run build
npm test
npm run test:release
npm run smoke
npm run smoke:install
npm run docs
npm run smoke:docs
```

Documentation source is in `documentation/`; generated GitHub Pages output is committed under `docs/`. Run `npm run docs:serve` to edit, and `npm run docs:preview` to preview production output.

CI checks Node 22 and 24. Release setup and GitHub Pages configuration are documented in [releasing](https://otp.js.org/releasing.html). See [migration](https://otp.js.org/migration.html) for the unreleased compatibility changes.

## License

Personal, non-commercial use is free. Commercial or organizational use requires a license from Milad Fahmy. See [LICENSE.md](LICENSE.md) for the terms.

Contributions are welcome. Follow the [code of conduct](CODE_OF_CONDUCT.md) and open an [issue](https://github.com/miladezzat/gen-totp/issues) or pull request.
