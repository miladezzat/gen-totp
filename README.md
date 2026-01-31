# Generate TOTP

[![npm version](https://badge.fury.io/js/gen-totp.svg)](https://badge.fury.io/js/gen-totp) 
![npm downloads](https://img.shields.io/npm/dm/gen-totp.svg)

Time-based One-Time Password (TOTP) is an algorithm that generates a one-time password based on the current time. TOTP is an extension of the HMAC-based One-Time Password (HOTP) algorithm and is standardized in RFC 6238. For more details, see [Wikipedia](https://en.wikipedia.org/wiki/Time-based_One-Time_Password).

## Table of Contents

- [Generate TOTP](#generate-totp)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Basic Usage](#basic-usage)
    - [Customizing OTP Length](#customizing-otp-length)
  - [Options](#options)
  - [Key Format and Encoding](#key-format-and-encoding)
  - [Documentation](#documentation)
  - [Contributing](#contributing)

## Installation

You can install `gen-totp` via npm or yarn:

```bash
npm install gen-totp
# or
yarn add gen-totp
```

## Usage

### Basic Usage

```typescript
import genTOTP from 'gen-totp';

const otp = genTOTP('test-key');
// Returns a 6-digit OTP by default
console.log(otp);
```

### Customizing OTP Length
```ts
import genTOTP from 'gen-totp';

const otp = genTOTP('test-key', { digits: 4 });
// Returns a 4-digit OTP
console.log(otp);
```

## Options & API
The `genTOTP` function accepts a `key` and an optional `options` object. By default the key is treated as UTF-8 text; use the `encoding` option to specify `hex` or `base32` when needed.

1. `key`: The secret key (default treated as UTF-8). To change how the key is interpreted set `options.encoding` to one of: `utf8` (default), `hex`, `base32`.
2. `options`: An optional object to customize OTP generation. The available `options` are detailed in the table below.

| Option     | Type   | Default | Description                                                                                      |
|------------|--------|---------|--------------------------------------------------------------------------------------------------|
| `digits`    | number | 6       | The number of digits in the generated OTP.                                                      |
| `period`    | number | 30      | The time period (in seconds) after which a new OTP is generated.                                |
| `algorithm` | string | 'SHA-1' | The hashing algorithm used to generate the OTP. Supported algorithms include:                  |
|            |        |         | - `SHA-1`                                                                                       |
|            |        |         | - `SHA-224`                                                                                     |
|            |        |         | - `SHA-256`                                                                                     |
|            |        |         | - `SHA-384`                                                                                     |
|            |        |         | - `SHA-512`                                                                                     |
|            |        |         | - `SHA3-224`                                                                                   |
|            |        |         | - `SHA3-256`                                                                                   |
|            |        |         | - `SHA3-384`                                                                                   |
|            |        |         | - `SHA3-512`                                                                                   |
|            |        |         | For more details, refer to the [JsSHA documentation](https://www.npmjs.com/package/jssha).     |



## Key format and encodings
`genTOTP` accepts keys in three encodings (default `utf8`):

- `utf8` (default): any UTF-8 string (letters, numbers, symbols, emoji).
- `hex`: accepts 0-9 and a-f (case-insensitive). Invalid input throws `Invalid hex character in key`.
- `base32`: RFC-4648 base32 (A–Z and 2–7). Padding `=` is stripped; invalid characters throw `Invalid base32 character: <char>`.

Examples:

- UTF-8: `mySecureKey123!`, `secretKey你好`, `emojiKey😊🔑`
- Hex: `deadbeef1234`, `01a2b3c4d5e6f7`
- Base32: `JBSWY3DPEHPK3PXP`, `GEZDGNBVGY3TQOJQ`
 
## Deterministic testing & timestamp units
`genTOTP` accepts an optional third argument `timestamp` in unix milliseconds for deterministic outputs (used heavily in tests). Example:

```ts
genTOTP('my-secret', { digits: 6, period: 30 }, Date.parse('2021-01-01T00:00:00Z'))
```

## Input validation & verification defaults
- `encoding: 'hex'` will validate that the key contains only hex characters and throw `Invalid hex character in key` when invalid.
- `period` must be a positive number; otherwise `Invalid period; must be a positive number` is thrown.
- `digits` must be an integer between 1 and 10; otherwise `Invalid digits; must be an integer between 1 and 10` is thrown.

Verification defaults:

- `verifyTOTP` default `window = 1` (checks previous/current/next period).
- `verifyHOTP` default `window = 10` and returns `{ newCounter }` on success or `null` on failure.

See `src/index.ts` for exact behavior and error messages.

## Features
- `genTOTP(key, options?, timestamp?)` — generate TOTP (default: `period=30`, `digits=6`, `algorithm='SHA-1'`, `encoding='utf8'`). `timestamp` is unix milliseconds for deterministic output.
- `verifyTOTP(key, token, options?, timestamp?)` — verify a TOTP; returns `true|false`. Default verification `window = 1`.
- `genHOTP(key, counter, options?)` — generate HOTP given a counter.
- `verifyHOTP(key, token, counter, options?)` — verify HOTP; returns `{ newCounter }` on success or `null` on failure. Default `window = 10`.
- `base32ToHex(input)` — RFC-4648-like base32 decoder used internally; throws `Invalid base32 character: <char>` on invalid input.
- `bytesToBase32(bytes)` — encode raw bytes to base32 (used by `generateSecretKey`).
- `generateSecretKey(length = 20)` — generate a cryptographically-secure base32 secret (default 20 bytes → 32 base32 chars).
- `generateOtpAuthUri(key, { accountName, issuer, ... })` — build an `otpauth://totp/...` URI for QR codes; requires a valid base32 key and throws `Invalid base32 key for otpauth URI` for invalid input.
- Supported algorithms: `SHA-1`, `SHA-224`, `SHA-256`, `SHA-384`, `SHA-512`, `SHA3-224`, `SHA3-256`, `SHA3-384`, `SHA3-512` (see `FixedLengthVariantType`).
- Key encodings: `utf8` (default), `hex` (validated; throws `Invalid hex character in key`), `base32` (uppercased, `=` padding stripped).
- Exports: default export is `genTOTP`; named exports include `base32ToHex`, `bytesToBase32`, `genHOTP`, `verifyHOTP`, `verifyTOTP`, `generateSecretKey`, `generateOtpAuthUri`.
## Documentation
For more detailed documentation, visit the Official Documentation .

## Contributing
Contributions are welcome! If you have any bug reports, suggestions, or feature requests, please open an issue on GitHub.

To contribute:

1. Fork the repository
2. Create a new feature branch ( git checkout -b feature/new-feature )
3. Commit your changes ( git commit -m 'Add new feature' )
4. Push to the branch ( git push origin feature/new-feature )
5. Create a new Pull Request
Make sure to follow the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md) when participating in the project.