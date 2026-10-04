const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const { timingSafeEqual } = require('node:crypto');
const { bytesToBase32, genHOTP, verifyTOTP, verifyHOTP } = require('../dist/index.js');

// Compare against the former full-window approach: decode inside each genHOTP.
// Run npm run build first. Results are informational, with no CI timing threshold.
function repeatedDecode(key, token, counter, options, totp) {
  let matched = false;
  let result = null;
  for (let delta = totp ? -options.window : 0; delta <= options.window; delta += 1) {
    const equal = timingSafeEqual(Buffer.from(genHOTP(key, counter + delta, options)), Buffer.from(token));
    matched = equal || matched;
    if (equal && result === null) result = { newCounter: counter + delta + 1 };
  }
  return totp ? matched : result;
}
function measure(run) {
  const start = performance.now();
  for (let index = 0; index < 3; index += 1) run();
  return (performance.now() - start) / 3;
}
for (const bytes of [20, 10000]) {
  const key = bytesToBase32(Buffer.alloc(bytes, 97));
  const counter = 1000;
  const options = { encoding: 'base32', window: 100 };
  const token = genHOTP(key, counter, options);
  for (const totp of [true, false]) {
    const baseline = () => repeatedDecode(key, token, counter, options, totp);
    const optimized = () => totp ? verifyTOTP(key, token, options, counter * 30000) : verifyHOTP(key, token, counter, options);
    assert.deepEqual(optimized(), baseline());
    baseline(); optimized();
    const oldMs = measure(baseline);
    const newMs = measure(optimized);
    console.log(`${totp ? 'TOTP' : 'HOTP'}, ${bytes}-byte key, window 100: repeated decode ${oldMs.toFixed(2)} ms; once ${newMs.toFixed(2)} ms; ${(oldMs / newMs).toFixed(2)}x`);
  }
}
