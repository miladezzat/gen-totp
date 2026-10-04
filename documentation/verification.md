# Verification and replay prevention

## Check user input

Pass a string containing exactly the configured number of ASCII decimal digits. Invalid token shapes return `false` for TOTP and `null` for HOTP. Invalid keys or configuration throw an error.

Verification compares token bytes with Node's `timingSafeEqual`. It checks the full configured window even when a match is found. This is not a guarantee that the entire request handler has constant timing.

The secret is validated and decoded once per verification call, then reused for each candidate counter.

## Keep windows small

| API | Default | Counters checked |
| --- | --- | --- |
| `verifyTOTP` / `verifyTOTPWithResult` | `window: 1` | Previous, current, and next |
| `verifyHOTP` | `window: 10` | Current and next 10 |

Windows must be integers from 0 to 1000. The upper limit prevents unbounded verification loops; typical deployments use much smaller values. Each accepted counter increases the number of valid codes at a given moment.

## Prevent reuse

TOTP verification is stateless and can accept the same valid code again during its time window. `verifyTOTPWithResult` returns `{ counter, delta }` or `null`, so your application can track the counter actually accepted rather than deriving one from the server timestamp.

```ts
const match = verifyTOTPWithResult(secret, submittedToken, { encoding: 'base32' });
if (match === null) return rejectLogin();
// Application-provided operation: atomically require match.counter > the
// user's last accepted counter, persist it, and complete the login.
return acceptLoginIfCounterAdvances(userId, match.counter);
```

Keep the comparison, update, and successful operation in one transaction or conditional write. Two concurrent requests must not accept the same stored counter. Accepting a future counter also makes earlier counters unusable under this monotonic policy. Alternatively, use a unique user/counter record and an application policy for all counters in the accepted window.

`delta` measures counters, not seconds. When a decimal code collides across counters, the API selects the smallest absolute drift and prefers the past on a tie. Counter tracking prevents reuse of that accepted counter; preventing reuse of the same decimal code across different counters requires an additional application policy. Keep windows small and use an appropriate digit count.

For HOTP, atomically persist `newCounter` with the successful operation. Concurrent requests must not both accept the same stored counter.

## Protect the login flow

Keep secrets out of logs, give each user a separate random secret, limit attempts, and keep server clocks synchronized. The library does not manage enrollment sessions, backup codes, rate limits, secret storage, or database transactions.

See [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238.html) for the protocol's verification requirements and [authenticator setup](/authenticators) for enrollment.
