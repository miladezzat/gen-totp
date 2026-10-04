const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../docs');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  let file = path.join(root, pathname);
  if (!file.startsWith(root + path.sep) && file !== root) { response.writeHead(400).end(); return; }
  if (pathname.endsWith('/')) file = path.join(file, 'index.html');
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { response.writeHead(404).end(); return; }
  response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(response);
});
async function main() {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const failures = [];
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('response', (response) => { if (response.status() >= 400) failures.push(response.status() + ' ' + response.url()); });
  try {
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: 'Get started', exact: true }).click();
    await page.waitForURL('**/getting-started.html');
    await page.getByRole('heading', { level: 1, name: /^Getting started/ }).waitFor({ state: 'visible' });
    await page.locator('.VPNavBarSearch button').click();
    const search = page.getByRole('searchbox');
    await search.fill('verifyHOTP');
    const searchResult = page.locator('.VPLocalSearchBox a').filter({ hasText: 'verifyHOTP' }).first();
    await searchResult.waitFor({ state: 'visible' });
    await searchResult.click();
    await page.waitForURL('**/api/reference.html#verifyhotp');
    await page.getByRole('heading', { name: /^verifyHOTP/ }).waitFor({ state: 'visible' });
    await page.goto(base + '/#/CHANGELOG', { waitUntil: 'networkidle' });
    await page.waitForURL('**/changelog.html');
    await page.getByRole('heading', { level: 1, name: /^Changelog/ }).waitFor({ state: 'visible' });
    await page.goto(base + '/#/README?id=install', { waitUntil: 'networkidle' });
    await page.waitForURL('**/getting-started.html#install');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.locator('button.copy').first().click();
    await page.waitForFunction(() => document.querySelector('button.copy.copied'));
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    assert.ok(clipboard.includes('npm install gen-totp'));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base, { waitUntil: 'networkidle' });
    assert.ok(await page.getByRole('link', { name: 'Get started', exact: true }).isVisible());
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    await page.getByRole('button', { name: /mobile navigation/i }).click();
    await page.locator('.VPNavScreen').getByRole('link', { name: 'Guide', exact: true }).click();
    await page.waitForURL('**/getting-started.html');
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page.locator('.VPSidebar').getByRole('link', { name: /^Authenticator setup/ }).click();
    await page.waitForURL('**/authenticators.html');
    await page.getByRole('heading', { level: 1, name: /^Authenticator setup/ }).waitFor({ state: 'visible' });
    assert.deepEqual(failures, []);
    console.log('Docs browser checks pass: navigation, search, legacy routes, code copy, mobile menu, and assets');
  } finally {
    await browser.close();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
