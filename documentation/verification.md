# Verification and replay prevention

## Check user input

Pass a string containing exactly the configured number of ASCII decimal digits. Invalid token shapes return `false` for TOTP and `null` for HOTP. Invalid keys or configuration throw an error.

Verification compares token bytes with Node's `timingSafeEqual`. It checks the full configured window even when a match is found. This is not a guarantee that the entire request handler has constant timing.

## Keep windows small

| API | Default | Counters checked |
| --- | --- | --- |
| `verifyTOTP` | `window: 1` | Previous, current, and next |
| `verifyHOTP` | `window: 10` | Current and next 10 |

Windows must be integers from 0 to 1000. The upper limit prevents unbounded verification loops; typical deployments use much smaller values. Each accepted counter increases the number of valid codes at a given moment.

## Prevent reuse

`verifyTOTP` is stateless and can accept the same valid code again during its time window. Track acceptance in your application, using an atomic transaction or uniqueness constraint. For a single-counter workflow, use `window: 0` and record the accepted user/counter pair. More complex drift handling needs an application policy that accounts for all accepted counters.

For HOTP, atomically persist `newCounter` with the successful operation. Concurrent requests must not both accept the same stored counter.

## Protect the login flow

Keep secrets out of logs, give each user a separate random secret, limit attempts, and keep server clocks synchronized. The library does not manage enrollment sessions, backup codes, rate limits, secret storage, or database transactions.

See [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238.html) for the protocol's verification requirements and [authenticator setup](/authenticators) for enrollment.
