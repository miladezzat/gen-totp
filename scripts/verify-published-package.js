const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

class NpmAvailabilityError extends Error {}

const consumerChecks = `
  const key = '12345678901234567890';
  assert.equal(api.default, api.genTOTP);
  assert.equal(api.genHOTP(key, 0), '755224');
  assert.equal(api.genTOTP(key, { digits: 8 }, 1111111109000), '07081804');
  assert.equal(api.genTOTP(key, { period: 30.1 }, 90300), '969429');
  assert.equal(api.verifyTOTP(key, '94287082', { digits: 8, window: 0 }, 59000), true);
  assert.deepEqual(api.verifyTOTPWithResult(key, '94287082', { digits: 8, window: 0 }, 59000), { counter: 1, delta: 0 });
  assert.deepEqual(api.verifyHOTP(key, '755224', 0, { window: 0 }), { newCounter: 1 });
  assert.equal(api.base32ToHex('MZXQ===='), '666f');
`;

/** Exercise the installed artifact, without access to the source checkout. */
function verifyInstalledPackage(directory, { name, version }) {
  const packageDirectory = path.join(directory, 'node_modules', name);
  const installed = JSON.parse(fs.readFileSync(path.join(packageDirectory, 'package.json'), 'utf8'));
  assert.equal(installed.name, name, 'Installed package name does not match');
  assert.equal(installed.version, version, 'Installed package version does not match');
  const exports = installed.exports?.['.'];
  const entries = [installed.main, installed.types, exports?.require?.default, exports?.require?.types, exports?.import?.default, exports?.import?.types];
  for (const entry of entries) {
    assert.equal(typeof entry, 'string', 'Missing declared package entry point');
    const file = path.resolve(packageDirectory, entry);
    assert.ok(file.startsWith(packageDirectory + path.sep), 'Package entry must be inside its artifact');
    assert.ok(fs.existsSync(file) && fs.statSync(file).isFile(), `Missing package entry: ${entry}`);
  }
  const commonjs = `const assert = require('node:assert/strict'); const api = require(${JSON.stringify(name)}); ${consumerChecks}`;
  const esm = `import assert from 'node:assert/strict'; import genTOTP, * as api from ${JSON.stringify(name)}; assert.equal(genTOTP, api.genTOTP); ${consumerChecks}`;
  execFileSync(process.execPath, ['-e', commonjs], { cwd: directory, stdio: 'pipe', timeout: 15000 });
  execFileSync(process.execPath, ['--input-type=module', '-e', esm], { cwd: directory, stdio: 'pipe', timeout: 15000 });
}

/** Install exactly what npm exposes, checking integrity and both module formats. */
async function verifyPublishedPackage({ name, version, dist }, { install = execFileSync, timeoutMs = 120000 } = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-totp-published-'));
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  try {
    fs.writeFileSync(path.join(directory, 'package.json'), '{"name":"gen-totp-release-consumer","private":true}\n');
    try {
      install(npm, [
        'install', '--save-exact', '--ignore-scripts', '--no-audit', '--no-fund',
        '--prefer-online', '--package-lock=true', '--registry=https://registry.npmjs.org', `${name}@${version}`,
      ], { cwd: directory, stdio: 'pipe', timeout: Math.max(1, Math.min(120000, timeoutMs)) });
    } catch (error) {
      const code = String(error.stderr ?? '').match(/npm (?:error|ERR!) code (\w+)/)?.[1] ?? error.code;
      if (['ETARGET', 'E404', 'ETIMEDOUT', 'ECONNRESET', 'EAI_AGAIN', 'ENETUNREACH', 'ECONNREFUSED'].includes(code)) {
        throw new NpmAvailabilityError(`npm installation unavailable (${code})`, { cause: error });
      }
      throw error;
    }
    const lock = JSON.parse(fs.readFileSync(path.join(directory, 'package-lock.json'), 'utf8'));
    assert.equal(lock.packages?.[`node_modules/${name}`]?.integrity, dist.integrity, 'Installed artifact integrity does not match registry metadata');
    verifyInstalledPackage(directory, { name, version });
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

module.exports = { verifyInstalledPackage, verifyPublishedPackage, NpmAvailabilityError };
