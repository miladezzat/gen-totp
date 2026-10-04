const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const pkg = require('../package.json');
const api = require('../' + pkg.main);
function verify(api) {
  assert.equal(typeof api.default, 'function');
  assert.equal(api.default, api.genTOTP);
  assert.equal(api.genTOTP('12345678901234567890', { digits: 8 }, 1111111109000), '07081804');
  assert.equal(api.genHOTP('12345678901234567890', 0), '755224');
  assert.deepEqual(api.verifyHOTP('12345678901234567890', '755224', 0, { window: 0 }), { newCounter: 1 });
  assert.equal(api.verifyTOTP('12345678901234567890', '94287082', { digits: 8, window: 0 }, 59000), true);
  assert.equal(api.base32ToHex('MZXQ===='), '666f');
  const secret = api.generateSecretKey(2);
  assert.equal(api.base32ToHex(secret).length, 4);
  assert.match(api.generateOtpAuthUri(secret, { issuer: 'Example', accountName: 'user@example.com' }), /^otpauth:\/\/totp\//);
}
verify(api);
import(pathToFileURL(path.resolve(__dirname, '../dist/index.mjs')).href).then((esm) => {
  verify(esm);
  console.log('Built CommonJS and ESM APIs pass');
}).catch((error) => { console.error(error); process.exitCode = 1; });
