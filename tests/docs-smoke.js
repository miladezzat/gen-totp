const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../docs');
function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? files(file) : [file];
  });
}
const pages = files(root).filter((file) => file.endsWith('.html'));
assert.ok(pages.length >= 14, 'Documentation pages are missing');
assert.equal(fs.readFileSync(path.join(root, 'CNAME'), 'utf8').trim(), 'otp.js.org');
assert.ok(fs.existsSync(path.join(root, '.nojekyll')));
const decode = (value) => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"');
let checked = 0;
for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  assert.ok(!html.includes('$docsify'), 'Old Docsify entry point remains');
  for (const [, value] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const link = decode(value);
    if (!link || /^(https?:|mailto:|data:|javascript:|\/\/)/.test(link)) continue;
    const url = new URL(link, 'https://otp.js.org/' + path.relative(root, file));
    let target = path.join(root, decodeURIComponent(url.pathname));
    if (url.pathname.endsWith('/')) target = path.join(target, 'index.html');
    assert.ok(fs.existsSync(target), path.relative(root, file) + ' links to missing ' + link);
    if (url.hash && target.endsWith('.html')) {
      const id = decodeURIComponent(url.hash.slice(1));
      const targetHtml = fs.readFileSync(target, 'utf8');
      assert.ok(targetHtml.includes('id="' + id + '"'), 'Missing anchor ' + link);
    }
    checked += 1;
  }
}
const reference = fs.readFileSync(path.join(root, 'api/reference.html'), 'utf8');
for (const id of ['gentotp', 'verifytotp', 'genhotp', 'verifyhotp', 'generatesecretkey', 'generateotpauthuri']) {
  assert.ok(reference.includes('id="' + id + '"'), 'Missing public API section ' + id);
}
assert.ok(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8').includes('https://otp.js.org'));
console.log(pages.length + ' documentation pages and ' + checked + ' local links/assets pass');
