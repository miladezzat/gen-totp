# Counter-based passwords

HOTP uses a shared secret and an integer counter. Unlike TOTP, the counter advances when a code is accepted.

## Generate and verify

```ts
import { genHOTP, verifyHOTP } from 'gen-totp';

const secret = '12345678901234567890';
const counter = 0;
const token = genHOTP(secret, counter);
console.log(token); // '755224'

const result = verifyHOTP(secret, token, counter, { window: 0 });
console.log(result); // { newCounter: 1 }
```

`verifyHOTP` returns `null` when no counter matches. On success, it returns the matched counter plus one. Store that next counter atomically with the accepted login or transaction to prevent reuse.

## Look ahead

The default window is 10: the verifier checks the current counter and the next 10 counters. This accommodates a client that generated codes without submitting all of them. `window: 0` checks the current counter only.

Counters must be non-negative safe integers, up to `Number.MAX_SAFE_INTEGER`. Verification also requires the entire lookahead and returned next counter to fit in that range.

See the [API reference](/api/reference#genhotp) and [verification guide](/verification) for configuration and application responsibilities. The tests include all ten vectors from [RFC 4226 Appendix D](https://www.rfc-editor.org/rfc/rfc4226.html#appendix-D).
