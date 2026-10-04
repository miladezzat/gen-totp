# Getting started

`gen-totp` generates and verifies one-time passwords with a shared secret. TOTP changes with time; HOTP changes with a counter.

## Install

Use Node.js 22 or later. The library uses Node's crypto APIs; a browser build is not included.

```sh
npm install gen-totp
```

## ESM and TypeScript

```ts
import genTOTP, { generateSecretKey, verifyTOTP } from 'gen-totp';

const secret = generateSecretKey();
const options = { encoding: 'base32' as const };
const token = genTOTP(secret, options);
console.log(verifyTOTP(secret, token, options)); // true
```

`generateSecretKey()` returns Base32. Specify `encoding: 'base32'` when generating and verifying codes with this secret. The default key encoding is UTF-8.

## CommonJS

```js
const { genTOTP, generateSecretKey, verifyTOTP } = require('gen-totp');

const secret = generateSecretKey();
const options = { encoding: 'base32' };
const token = genTOTP(secret, options);
console.log(verifyTOTP(secret, token, options));
```

## Choose a workflow

| Workflow | Guide |
| --- | --- |
| Generate codes using the current time | [TOTP](/totp) |
| Generate codes using a stored counter | [HOTP](/hotp) |
| Enroll a user in an authenticator app | [Authenticator setup](/authenticators) |
| Choose a secret encoding | [Secrets and encodings](/encodings) |
| Verify codes and prevent reuse | [Verification](/verification) |

Keep codes as strings so leading zeroes survive. The library generates and checks codes; your application stores secrets, limits attempts, and tracks accepted codes or counters.
