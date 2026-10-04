# Contributing

## Install and check

```sh
npm ci
npm run lint
npm run build
npm test
npm run test:release
npm run smoke
npm run smoke:install
npm run docs
npm run smoke:docs
```

CI runs on Node.js 22 and 24. Behavior fixes need regression tests. Package changes must pass the packed installation check for CommonJS, native ESM, and TypeScript consumers.

## Work on documentation

Edit Markdown in `documentation/`. Start VitePress with:

```sh
npm run docs:serve
```

`npm run docs` stages the build in a temporary directory, then replaces the generated `docs/` site only after a successful build. Commit the source and generated site together. Preview production output with `npm run docs:preview`.

For browser verification:

```sh
npx playwright install chromium
npm run smoke:docs:browser
```

The browser check covers navigation, local search, old Docsify links, mobile navigation, and missing assets.

## Source layout

| Path | Purpose |
| --- | --- |
| `src/index.ts` | OTP generation, verification, encoding helpers, and public types |
| `tests/` | RFC vectors, regressions, release checks, and package/docs smoke checks |
| `scripts/` | Package and docs builds, version gating, registry verification |
| `documentation/` | VitePress source and assets |
| `docs/` | Generated GitHub Pages output |

Follow the repository's [code of conduct](https://github.com/miladezzat/gen-totp/blob/master/CODE_OF_CONDUCT.md) when contributing.
