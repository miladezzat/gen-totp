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


## Documentation
For more detailed documentation, visit the [Official Documentation](https://otp.js.org/#/).


## Contributing
Contributions are welcome! If you have any bug reports, suggestions, or feature requests, please open an issue on GitHub.

**To contribute:**
1. Fork the repository
2. Create a new feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a new Pull Request


Make sure to follow the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md) when participating in the project.