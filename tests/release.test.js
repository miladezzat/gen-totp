const { test } = require('node:test');
const assert = require('node:assert/strict');
const { checkRelease } = require('../scripts/check-release');
const { verifyRelease } = require('../scripts/verify-release');
const pkg = { name: 'gen-totp', version: '3.0.2' };
const metadata = { ...pkg, dist: { integrity: 'sha512-YWJjZA==' } };
const response = (body, status = 200) => ({ ok: status === 200, status, json: async () => body });
const registry = (version, exactVersion = version === pkg.version ? pkg.version : null) => async (url) => (
  url.endsWith('/latest') ? response({ ...pkg, version })
    : exactVersion ? response({ ...pkg, version: exactVersion }) : response({}, 404)
);

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
  await assert.rejects(checkRelease(pkg, async () => response({ name: 'other', version: pkg.version })), /exact-version metadata/);
  await assert.rejects(checkRelease(pkg, registry('bad')), /stable/);
  await assert.rejects(checkRelease(pkg, async () => response({}, 503)), /HTTP 503/);
  await assert.rejects(checkRelease(pkg, async () => { throw new Error('offline'); }), /offline/);
});
test('gate queries the expected package without issuing writes', async () => {
  await checkRelease(pkg, async (url, options) => {
    assert.equal(url, 'https://registry.npmjs.org/gen-totp/3.0.2');
    assert.equal(options.cache, 'no-store');
    assert.ok(options.signal);
    return response({ ...pkg, version: pkg.version });
  });
});
test('gate skips an existing exact version even when latest was moved backwards', async () => {
  const urls = [];
  assert.equal(await checkRelease(pkg, async (url) => {
    urls.push(url);
    return response(pkg);
  }), false);
  assert.deepEqual(urls, ['https://registry.npmjs.org/gen-totp/3.0.2']);
});
test('gate compares latest only after an exact-version 404', async () => {
  const urls = [];
  assert.equal(await checkRelease(pkg, async (url) => {
    urls.push(url);
    return url.endsWith('/latest') ? response({ ...pkg, version: '3.0.1' }) : response({}, 404);
  }), true);
  assert.deepEqual(urls, ['https://registry.npmjs.org/gen-totp/3.0.2', 'https://registry.npmjs.org/gen-totp/latest']);
});
test('gate fails closed on ambiguous exact-version responses', async () => {
  for (const status of [401, 403, 429, 503]) {
    await assert.rejects(checkRelease(pkg, async () => response({}, status)), new RegExp(`HTTP ${status}`));
  }
  await assert.rejects(checkRelease(pkg, async () => response({ ...pkg, version: '3.0.1' })), /exact-version metadata/);
  await assert.rejects(checkRelease(pkg, registry(pkg.version, null)), /unavailable exact version/);
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
