# API reference

## Generation options

```ts
interface GenHOTPOptions {
  algorithm?: FixedLengthVariantType;
  digits?: number;
  encoding?: KeyEncoding;
}
interface GenTOTPOptions extends GenHOTPOptions {
  period?: number;
}
```

| Option | Default | Validation |
| --- | --- | --- |
| `algorithm` | `SHA-1` | One of the supported algorithms below |
| `digits` | `6` | Integer from 1 to 10 |
| `encoding` | `utf8` | `utf8`, `hex`, or `base32` |
| `period` (TOTP) | `30` | Finite positive number, in seconds |

Supported generation algorithms: `SHA-1`, `SHA-224`, `SHA-256`, `SHA-384`, `SHA-512`, `SHA3-224`, `SHA3-256`, `SHA3-384`, and `SHA3-512`.

## genTOTP

```ts
genTOTP(key: string, options?: GenTOTPOptions, timestamp?: number): string
```

The default export is also `genTOTP`. Generates a fixed-width decimal string. Timestamp defaults to `Date.now()` and is in Unix milliseconds. It must be finite, non-negative, and no larger than `Number.MAX_SAFE_INTEGER`; the resulting counter must also be a safe integer.

## verifyTOTP

```ts
verifyTOTP(key: string, token: string, options?: VerifyTOTPOptions, timestamp?: number): boolean
```

`VerifyTOTPOptions` extends generation options with `window?: number` (default 1). Checks counters from `-window` through `+window`, skipping negative counters. Returns `false` for malformed or unmatched tokens; throws for invalid configuration or keys.

## genHOTP

```ts
genHOTP(key: string, counter: number, options?: GenHOTPOptions): string
```

The counter must be a non-negative safe integer. Returns exactly `digits` decimal characters.

## verifyHOTP

```ts
verifyHOTP(
  key: string,
  token: string,
  counter: number,
  options?: VerifyHOTPOptions,
): { newCounter: number } | null
```

`VerifyHOTPOptions` adds `window?: number` (default 10). Checks the current counter and the next `window` counters. Returns the earliest matching counter plus one, or `null`. The lookahead and next counter must fit in the safe integer range.

Both verification APIs require an integer window from 0 to 1000, and a token with exactly `digits` ASCII decimal characters. See [verification](/verification) for replay prevention.

## generateSecretKey

```ts
generateSecretKey(length?: number): string
```

Uses Node's cryptographic random byte generator. The default is 20 bytes, producing 32 Base32 characters. Length must be a positive safe integer.

## generateOtpAuthUri

```ts
generateOtpAuthUri(key: string, options: OtpAuthUriOptions): string
```

Returns an `otpauth://totp/` URI for [authenticator enrollment](/authenticators). Requires a non-empty Base32 secret, account name, and issuer. Normalizes the secret to uppercase without padding. Only SHA-1, SHA-256, and SHA-512 are accepted in URIs; digits must be 6 or 8, and the period must be a positive integer.

## Encoding helpers

```ts
base32ToHex(input: string): string
bytesToBase32(bytes: Uint8Array): string
```

The decoder accepts lowercase or uppercase, padded or unpadded canonical Base32. The encoder returns uppercase unpadded Base32. See [encodings](/encodings).

## Legacy formatting helpers

`leftPad(str, len, pad)`, `hexToDec(hex)`, and `decToHex(dec)` remain named exports for compatibility. `decToHex` rounds its argument and pads to at least two characters. OTP generation validates its counter and does not rely on that rounding behavior.

## Exported types

`FixedLengthVariantType`, `KeyEncoding`, `GenTOTPOptions`, `GenHOTPOptions`, `VerifyTOTPOptions`, `VerifyHOTPOptions`, and `OtpAuthUriOptions` are available as TypeScript type imports.
