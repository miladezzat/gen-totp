const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function fixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-totp-prepare-'));
  for (const file of ['package.json', 'tsconfig.json', 'LICENSE.md', 'README.md', 'src', 'scripts']) {
    fs.cpSync(path.join(root, file), path.join(directory, file), { recursive: true });
  }
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(directory, 'node_modules'), 'junction');
  return directory;
}

test('ordinary npm pack builds every declared entry from a clean source checkout', () => {
  const directory = fixture();
  try {
    assert.equal(fs.existsSync(path.join(directory, 'dist')), false);
    const [packed] = JSON.parse(execFileSync(npm, ['pack', '--json', '--foreground-scripts=false'], {
      cwd: directory, encoding: 'utf8', env: { ...process.env, HUSKY: '0' },
    }));
    for (const file of ['dist/index.js', 'dist/index.mjs', 'dist/index.d.ts', 'dist/index.d.mts']) {
      assert.ok(packed.files.some((entry) => entry.path === file), 'Missing ' + file);
    }
    execFileSync(process.execPath, ['-e', "const a=require('./dist'); if(a.genHOTP('12345678901234567890',0)!=='755224') process.exit(1)"], { cwd: directory });
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test('Git dependency preparation builds dist without changing checkout hooks', () => {
  const directory = fixture();
  try {
    execFileSync('git', ['init', '--quiet'], { cwd: directory });
    execFileSync('git', ['config', 'core.hooksPath', 'existing-hooks'], { cwd: directory });
    execFileSync(process.execPath, ['scripts/prepare.js'], {
      cwd: directory, env: { ...process.env, HUSKY: '', CI: '', INIT_CWD: path.dirname(directory) },
    });
    assert.equal(fs.existsSync(path.join(directory, 'dist/index.js')), true);
    assert.equal(execFileSync('git', ['config', 'core.hooksPath'], { cwd: directory, encoding: 'utf8' }).trim(), 'existing-hooks');
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
