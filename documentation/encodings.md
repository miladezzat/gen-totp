# Secrets and encodings

The encoding determines the **bytes used as the HMAC key**. A Base32 string interpreted as UTF-8 generates different codes from the decoded Base32 secret.

## Supported encodings

| Encoding | Accepted key | Example |
| --- | --- | --- |
| `utf8` (default) | Non-empty text, including Unicode | `secretKey你好` |
| `hex` | Complete hexadecimal bytes, case insensitive | `deadbeef1234` |
| `base32` | RFC 4648 Base32, case insensitive, optional correct padding | `JBSWY3DPEHPK3PXP` |

Hex keys require an even number of characters. Base32 keys reject invalid characters, impossible lengths, incorrect padding, and non-zero unused bits. Whitespace, `_`, `-`, and digits `0`, `1`, `8`, and `9` are not Base32 characters.

## Generate a secret

```ts
import genTOTP, { generateSecretKey } from 'gen-totp';

const secret = generateSecretKey(); // 20 random bytes -> 32 Base32 characters
const token = genTOTP(secret, { encoding: 'base32' });
```

The length argument to `generateSecretKey(length)` counts **bytes**, not Base32 characters. It must be a positive safe integer. Provision a separate secret per user and protect it in storage.

## Convert bytes

```ts
import { base32ToHex, bytesToBase32 } from 'gen-totp';

const encoded = bytesToBase32(Buffer.from('fo'));
console.log(encoded); // 'MZXQ'
console.log(base32ToHex('MZXQ====')); // '666f'
```

`bytesToBase32` produces uppercase, unpadded Base32. `base32ToHex` returns whole bytes as lowercase hex. Empty conversion inputs are valid, but empty OTP secrets are rejected.
