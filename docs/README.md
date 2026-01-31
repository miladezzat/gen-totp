# Generate TOTP

[![npm version](https://badge.fury.io/js/gen-totp.svg)](https://badge.fury.io/js/gen-totp) 
![npm downloads](https://img.shields.io/npm/dm/gen-totp.svg)
[![CI](https://github.com/miladezzat/gen-totp/actions/workflows/ci.yml/badge.svg)](https://github.com/miladezzat/gen-totp/actions/workflows/ci.yml)

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

## Options
The genTOTP function accepts two parameters:

1. `key`: A string containing the base32-encoded secret key. It can include numbers, uppercase letters, `_`, and `-`.
2. `options`: An optional object to customize the OTP generation. The available `options` are detailed in the table below:

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



## Key Format and Encoding
When providing a key to the genTOTP function, you can use different encodings specified by the encoding option:

1. UTF-8 Encoding (default):
   
   - Any valid UTF-8 string can be used as the key
   - Supports alphabetic characters (A-Z, a-z), numeric characters (0-9), special characters, and Unicode characters including emoji
2. Hex Encoding :
   
   - The key should be a valid hexadecimal string
   - Only characters 0-9 and a-f (case insensitive) are allowed
3. Base32 Encoding :
   
   - The key should be a valid base32 string according to RFC 4648
   - Only uppercase letters A-Z and digits 2-7 are allowed
   - Padding with '=' is optional
Example of valid keys:

- UTF-8: mySecureKey123! , secretKey你好 , emojiKey😊🔑
- Hex: deadbeef1234 , 01a2b3c4d5e6f7
- Base32: JBSWY3DPEHPK3PXP , GEZDGNBVGY3TQOJQ
## Deterministic testing
You can pass an optional third argument `timestamp` (unix milliseconds) to `genTOTP` for deterministic outputs used in tests or debugging. Example:

```ts
genTOTP('my-secret', { digits: 6, period: 30 }, Date.parse('2021-01-01T00:00:00Z'))
```

## Input validation
- `encoding: 'hex'` will validate that the key contains only hex characters and throw `Invalid hex character in key` when invalid.
- `period` must be a positive number; otherwise `Invalid period; must be a positive number` is thrown.
- `digits` must be an integer between 1 and 10; otherwise `Invalid digits; must be an integer between 1 and 10` is thrown.
## Developer notes
- Tests run against source TypeScript (not `dist/`): `npm test` uses `mocha -r ts-node/register tests/**/*.spec.ts`.
- Build artifacts are produced to `dist/` via `npm run build` (`tsc`).
- Agent-focused guidance and repo-specific guidelines live in `.github/copilot-instructions.md` — useful for automated contributors and CI edits.
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