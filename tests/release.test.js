const { test } = require('node:test');
const assert = require('node:assert/strict');
const { checkRelease } = require('../scripts/check-release');
const { verifyRelease } = require('../scripts/verify-release');
const pkg = { name: 'gen-totp', version: '3.0.2' };
const metadata = { ...pkg, dist: { integrity: 'sha512-YWJjZA==' } };
const response = (body, status = 200) => ({ ok: status === 200, status, json: async () => body });
const registry = (version) => async () => response({ ...pkg, version });

test('release gate publishes only a newer stable version', async () => {
  assert.equal(await checkRelease(pkg, registry('3.0.1')), true);
  assert.equal(await checkRelease(pkg, registry('3.0.2')), false);
  assert.equal(await checkRelease({ ...pkg, version: '3.0.10' }, registry('3.0.9')), true);
  await assert.rejects(checkRelease(pkg, registry('3.0.3')), /older/);
});
test('gate validates local and registry metadata', async () => {
  for (const version of ['3.0.2-beta', '03.0.2', '3.0', 'bad']) {
    await assert.rejects(checkRelease({ ...pkg, version }, registry('3.0.1')), /stable/);
  }
  await assert.rejects(checkRelease(pkg, async () => response({ name: 'other', version: '3.0.1' })), /different package/);
  await assert.rejects(checkRelease(pkg, registry('bad')), /stable/);
  await assert.rejects(checkRelease(pkg, async () => response({}, 503)), /HTTP 503/);
  await assert.rejects(checkRelease(pkg, async () => { throw new Error('offline'); }), /offline/);
});
test('gate queries the expected package without issuing writes', async () => {
  await checkRelease(pkg, async (url, options) => {
    assert.equal(url, 'https://registry.npmjs.org/gen-totp/latest');
    assert.ok(options.signal);
    return response({ ...pkg, version: pkg.version });
  });
});
test('verification checks the exact release and integrity', async () => {
  const result = await verifyRelease(pkg, { fetchRegistry: async (url, options) => {
    assert.equal(url, 'https://registry.npmjs.org/gen-totp/3.0.2');
    assert.equal(options.cache, 'no-store');
    return response(metadata);
  }, log: () => {} });
  assert.deepEqual(result, metadata);
});
test('verification retries replication delays and network failures without republishing', async () => {
  let now = 0;
  let calls = 0;
  const result = await verifyRelease(pkg, {
    now: () => now,
    wait: async (ms) => { now += ms; },
    timeoutMs: 30000,
    fetchRegistry: async () => {
      calls += 1;
      if (calls === 1) throw new Error('temporary network failure');
      if (calls === 2) return response({}, 404);
      return response(metadata);
    }, log: () => {},
  });
  assert.deepEqual(result, metadata);
  assert.equal(calls, 3);
});
test('verification rejects unexpected HTTP status and invalid release metadata', async () => {
  await assert.rejects(verifyRelease(pkg, { fetchRegistry: async () => response({}, 403), log: () => {} }), /HTTP 403/);
  for (const bad of [{ ...metadata, name: 'other' }, { ...metadata, version: '3.0.1' }, { ...metadata, dist: {} }]) {
    await assert.rejects(verifyRelease(pkg, { fetchRegistry: async () => response(bad), log: () => {} }), /invalid release metadata/);
  }
});
test('verification stops at its deadline and tells the operator to inspect npm', async () => {
  let now = 0;
  await assert.rejects(verifyRelease(pkg, {
    now: () => now, wait: async (ms) => { now += ms; }, timeoutMs: 10000,
    fetchRegistry: async () => response({}, 404), log: () => {},
  }), /Timed out.*Check npm/);
});
test('verification rejects invalid timeouts', async () => {
  for (const timeoutMs of [0, -1, 1.5, Infinity, 900001]) {
    await assert.rejects(verifyRelease(pkg, { timeoutMs }), /Invalid release verification timeout/);
  }
});
