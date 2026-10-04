const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'docs');
const staged = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-totp-docs-'));
const cli = path.join(path.dirname(require.resolve('vitepress/package.json')), 'bin/vitepress.js');
function normalize(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) normalize(file);
    else if (/\.(html|md)$/.test(entry.name)) fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/[ \t]+$/gm, ''));
  }
}
try {
  execFileSync(process.execPath, [cli, 'build', 'documentation', '--outDir', staged], { cwd: root, stdio: 'inherit' });
  // Preserve raw Markdown links from the old documentation site.
  for (const name of ['CHANGELOG.md', 'LICENSE.md']) fs.copyFileSync(path.join(root, name), path.join(staged, name));
  fs.writeFileSync(path.join(staged, 'README.md'), '# gen-totp\n\nRead the maintained guide at https://otp.js.org/getting-started.html\n');
  normalize(staged);
  // A failed VitePress build leaves the previously generated site intact.
  fs.mkdirSync(output, { recursive: true });
  for (const entry of fs.readdirSync(output)) {
    if (entry !== '.DS_Store') fs.rmSync(path.join(output, entry), { recursive: true, force: true });
  }
  fs.cpSync(staged, output, { recursive: true });
} finally {
  fs.rmSync(staged, { recursive: true, force: true });
}
