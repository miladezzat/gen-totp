import { defineConfig } from 'vitepress';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const { version } = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

export default defineConfig({
  title: 'gen-totp',
  description: 'Generate and verify time-based and counter-based one-time passwords in Node.js. Typed APIs, authenticator setup, and tested RFC vectors.',
  lang: 'en-US',
  base: '/',
  cleanUrls: false,
  outDir: fileURLToPath(new URL('../../docs', import.meta.url)),
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }]],
  sitemap: { hostname: 'https://otp.js.org' },
  themeConfig: {
    logo: { src: '/logo.svg', alt: '' },
    nav: [
      { text: 'Guide', link: '/getting-started' },
      { text: 'API', link: '/api/reference', activeMatch: '^/api/' },
      { text: `v${version}`, items: [
        { text: 'Changelog', link: '/changelog' },
        { text: 'View on npm', link: 'https://www.npmjs.com/package/gen-totp' },
        { text: 'Release guide', link: '/releasing' },
      ] },
    ],
    sidebar: [
      { text: 'Start here', items: [
        { text: 'Getting started', link: '/getting-started' },
        { text: 'Time-based passwords', link: '/totp' },
        { text: 'Counter-based passwords', link: '/hotp' },
        { text: 'Authenticator setup', link: '/authenticators' },
      ] },
      { text: 'Understand the inputs', items: [
        { text: 'Secrets and encodings', link: '/encodings' },
        { text: 'Verification and replay prevention', link: '/verification' },
        { text: 'API reference', link: '/api/reference' },
        { text: 'Migration', link: '/migration' },
      ] },
      { text: 'Project', items: [
        { text: 'Contributing', link: '/contributing' },
        { text: 'Releasing and deployment', link: '/releasing' },
        { text: 'Changelog', link: '/changelog' },
        { text: 'License', link: '/license' },
      ] },
    ],
    search: { provider: 'local' },
    outline: { level: [2, 3] },
    socialLinks: [{ icon: 'github', link: 'https://github.com/miladezzat/gen-totp' }],
    editLink: { pattern: 'https://github.com/miladezzat/gen-totp/edit/master/documentation/:path', text: 'Improve this page' },
    footer: { message: 'Personal use is free. Commercial use requires a license.', copyright: 'Milad Fahmy' },
  },
});
