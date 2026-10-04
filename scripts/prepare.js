const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');

execFileSync(process.execPath, [path.join(__dirname, 'build.js')], { cwd: root, stdio: 'inherit' });
// Install hooks only for a developer running npm in this checkout, never for
// a Git dependency being prepared inside another application's installation.
if (process.env.HUSKY !== '0' && process.env.CI !== 'true'
    && process.env.INIT_CWD === root && fs.existsSync(path.join(root, '.git'))) {
  import('husky').then(({ default: install }) => {
    const message = install();
    if (message) console.error(message);
  });
}
