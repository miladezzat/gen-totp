# Time-based passwords

TOTP derives an HOTP counter from Unix time and the configured period. Both parties need the same secret, encoding, algorithm, digit count, and period.

## Generate a code

```ts
import genTOTP from 'gen-totp';

const token = genTOTP('12345678901234567890', { digits: 8 }, 59_000);
console.log(token); // '94287082'
```

The third argument is **Unix milliseconds**. Omitting it uses `Date.now()`. The default period is 30 seconds, algorithm is `SHA-1`, digit count is 6, and key encoding is `utf8`.

## Verify a code

```ts
import { verifyTOTP } from 'gen-totp';

const valid = verifyTOTP(
  '12345678901234567890',
  '94287082',
  { digits: 8, window: 0 },
  59_000,
);
console.log(valid); // true
```

By default, `window: 1` checks the previous, current, and next counter. `window: 0` checks only the current counter. Counters before the Unix epoch are skipped.

## Configure the period

```ts
const token = genTOTP('shared-secret', { period: 60, digits: 8 });
```

The period must be a finite positive number. Generation supports fractional seconds; authenticator enrollment requires whole seconds. A larger verification window accepts more codes: see [verification and replay prevention](/verification).

## Reference

The full SHA-1, SHA-256, and SHA-512 test vectors from [RFC 6238 Appendix B](https://www.rfc-editor.org/rfc/rfc6238.html#appendix-B) are covered by the test suite, including leading zeroes and dates beyond 2038.
