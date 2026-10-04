# Authenticator setup

An authenticator and your server must use the same secret and TOTP settings. An `otpauth://` URI carries those settings for enrollment.

## Create an enrollment URI

```ts
import { generateSecretKey, generateOtpAuthUri } from 'gen-totp';

const secret = generateSecretKey();
const uri = generateOtpAuthUri(secret, {
  accountName: 'user@example.com',
  issuer: 'Example App',
});
```

Pass `uri` to your chosen QR-code renderer. This library returns the URI; it does not render a QR code. Show the URI and secret only during the authenticated enrollment flow.

## Confirm enrollment

```ts
import { verifyTOTP } from 'gen-totp';

const enrolled = verifyTOTP(secret, submittedCode, { encoding: 'base32' });
```

`submittedCode` is the string supplied by the user. Enable the factor after confirmation. Keep the secret and configured settings available to the server for later verification.

## URI options

| Option | Default | Meaning |
| --- | --- | --- |
| `accountName` | Required | Non-empty account label, without a colon |
| `issuer` | Required | Non-empty service name, without a colon |
| `algorithm` | `SHA-1` | `SHA-1`, `SHA-256`, or `SHA-512` |
| `digits` | `6` | `6` or `8` |
| `period` | `30` | A positive integer in seconds |

The secret must decode as non-empty Base32. The URI uses uppercase, unpadded Base32 and emits algorithm names such as `SHA256`.

Authenticator support varies. Start with SHA-1, six digits, and 30 seconds for compatibility, and verify your chosen app honors any custom settings. Other algorithms supported by the generation APIs cannot be included in an enrollment URI.

The URI parameters follow the [authenticator URI format](https://github.com/google/google-authenticator/wiki/Key-Uri-Format).
