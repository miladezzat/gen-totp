const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-totp-consumer-'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
try {
  // npm 10 runs prepare during pack even with --ignore-scripts. Keep its
  // lifecycle output out of the JSON response and disable hook installation.
  const packed = JSON.parse(execFileSync(npm, ['pack', '--json', '--ignore-scripts', '--foreground-scripts=false', '--pack-destination', temporary], { cwd: root, encoding: 'utf8', env: { ...process.env, HUSKY: '0' } }))[0];
  for (const file of ['dist/index.js', 'dist/index.mjs', 'dist/index.d.ts', 'dist/index.d.mts', 'LICENSE.md']) {
    assert.ok(packed.files.some((entry) => entry.path === file), 'Missing package file ' + file);
  }
  assert.ok(!packed.files.some((entry) => /^(docs|documentation|tests|src)\//.test(entry.path)), 'Development files leaked into package');
  fs.writeFileSync(path.join(temporary, 'package.json'), '{"name":"gen-totp-consumer","private":true}\n');
  execFileSync(npm, ['install', '--prefer-offline', '--ignore-scripts', '--no-audit', '--no-fund', path.join(temporary, packed.filename)], { cwd: temporary, stdio: 'pipe' });
  const check = `const assert = require('node:assert/strict'); const api = require('gen-totp'); assert.equal(api.default, api.genTOTP); assert.equal(api.genHOTP('12345678901234567890', 0), '755224');`;
  execFileSync(process.execPath, ['-e', check], { cwd: temporary, stdio: 'inherit' });
  const esm = `import genTOTP, { genHOTP, verifyTOTP } from 'gen-totp'; import assert from 'node:assert/strict'; assert.equal(typeof genTOTP, 'function'); assert.equal(genHOTP('12345678901234567890', 0), '755224'); assert.equal(verifyTOTP('12345678901234567890', genTOTP('12345678901234567890', {digits:8}, 59000), {digits:8,window:0}, 59000), true);`;
  execFileSync(process.execPath, ['--input-type=module', '-e', esm], { cwd: temporary, stdio: 'inherit' });
  const ts = `import genTOTP, { genHOTP, verifyTOTP, generateSecretKey } from 'gen-totp';\nimport type { GenTOTPOptions, VerifyTOTPOptions, GenHOTPOptions, VerifyHOTPOptions, OtpAuthUriOptions } from 'gen-totp';\nconst options: GenTOTPOptions = { encoding: 'base32', digits: 8 };\nconst verified: VerifyTOTPOptions = { ...options, window: 0 };\nconst hotp: GenHOTPOptions = options; const check: VerifyHOTPOptions = { ...hotp, window: 0 };\nconst uri: OtpAuthUriOptions = { issuer: 'Example', accountName: 'user' };\nconst token: string = genTOTP(generateSecretKey(), options);\nconst accepted: boolean = verifyTOTP(generateSecretKey(), token, verified);\nconst counterToken: string = genHOTP('test', 0, hotp);\nvoid [accepted, counterToken, check, uri];\n`;
  fs.writeFileSync(path.join(temporary, 'consumer.mts'), ts);
  // CommonJS consumers use the named API (the module itself is an export object).
  const cjs = ts.replace('import genTOTP, {', 'import { genTOTP,');
  fs.writeFileSync(path.join(temporary, 'consumer.cts'), cjs);
  execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'), '--strict', '--target', 'ES2020', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--noEmit', '--skipLibCheck', 'consumer.cts', 'consumer.mts'], { cwd: temporary, stdio: 'inherit' });
  console.log('Packed installation passes CommonJS, native ESM, and TypeScript checks');
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
