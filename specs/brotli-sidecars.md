# Precompressed Brotli CSS sidecars

| | |
| --- | --- |
| Issue | Release follow-up requested while preparing v0.16.0 |
| Status | Implementing |
| Baseline | `92a32d7c` on `chore/brotli-size` |
| Breaking | No |

The build and npm package add a Brotli-compressed `.br` sidecar beside every
minified CSS entry point. Consumers that control their static hosting can serve
those bytes after HTTP content negotiation; the ordinary `.css` files and all
existing package entry points remain unchanged for every other consumer.

## Contract

After this lands:

- Every `dist/**/*.min.css` file has one adjacent
  `dist/**/*.min.css.br` sidecar produced with Brotli quality 11.
- Decompressing a sidecar reproduces its adjacent minified CSS file byte for
  byte. The build, distribution audit, packed-package audit and clean-consumer
  smoke test enforce that relationship.
- The npm tarball contains both the original minified CSS and its sidecar.
  Expanded CSS and DTCG token JSON remain uncompressed package artifacts.
- Existing `main`, `style` and named `exports` continue to resolve to CSS, not
  to compressed bytes. The sidecars are additional files, reachable through
  the existing `./dist/*` export when tooling needs to locate one.

It does **not** promise that a browser can use a `.br` filename in a
`<link>` element, or that installing the package enables Brotli delivery by
itself. A host or CDN must select the sidecar for a request for the corresponding
CSS resource, send `Content-Encoding: br` and `Content-Type: text/css`, vary its
cache by `Accept-Encoding`, and keep the original CSS as the fallback.

## Evidence ledger

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| The baseline has 10 minified CSS entry points and no precompressed sidecars | Recursive `dist/` inventory after the existing build: 8 root/print files and 2 presets ending in `.min.css`; 0 files ending in `.br` | `dist/` from `92a32d7c`, Node 26.9.0, 2026-09-23 | Verified |
| Brotli quality 11 produces smaller representations for all 10 minified sheets | `node:zlib.brotliCompressSync`: default 141,101 → 12,902 B; scoped 146,246 → 13,022 B; presets 678 → 244 B and 1,814 → 480 B; remaining six also decreased | `dist/**/*.min.css` from `92a32d7c`, Node 26.9.0, 2026-09-23 | Verified |
| The configured browser floor can negotiate Brotli HTTP content coding | Chromium documentation describes `Accept-Encoding`/`Content-Encoding: br`; RFC 7932 defines Brotli content encoding; WebKit reports Brotli enabled across Safari platforms | Upstream documentation, not reproduced on Chrome 123 / Firefox 130 / Safari 18.2 for this spec | Reported |
| A clean build emits the complete sidecar set at the measured sizes | `npm run build`: 10 sidecars written at quality 11; all 10 budget checks passed, from 244 B to 13,022 B | `e9730d1f`, Node 26.9.0, 2026-09-23 | Verified |
| Every built sidecar decompresses to its adjacent CSS and uses the canonical quality-11 representation | `npm run check:dist`: 20 CSS files parsed and 10 sidecars reproduced their sources byte for byte | `e9730d1f`, Node 26.9.0, 2026-09-23 | Verified |
| The sidecars survive the package boundary | `npm run check:package`: 36 packed files, 32 declared build outputs; `npm run check:consumer`: all 10 installed sidecars resolved and reproduced their CSS | `e9730d1f`, npm 11.6.0 / Node 26.9.0, 2026-09-23 | Verified |
| The hosting limitations are documented without breaking the About layout | 12 targeted visual comparisons passed across Chromium, Firefox and WebKit after the Darwin baselines were refreshed; Linux workflow `35910788443` regenerated the matching 12 and passed | `e9730d1f` locally and `c8175970` on GitHub Actions, Playwright 1.61.1, 2026-09-23 | Verified |

## Decisions

| Decision | Basis | Rationale |
| --- | --- | --- |
| Ship sidecars for every minified CSS file, including presets | Public surface | A consumer should not have to recreate compression for a documented entry point. |
| Keep expanded CSS and token JSON without sidecars | Design | The delivery optimization targets production stylesheets; multiplying development and data artifacts adds package surface without a demonstrated use. |
| Use Brotli quality 11 | Deployment model | Compression happens once at build time, so maximum static compression is preferable to encoder speed. |
| Keep ordinary CSS as the canonical entry points | Compatibility | Package resolvers and browsers expect CSS bytes; compressed bytes require HTTP response metadata. |
| Reuse the existing `./dist/*` export | Existing contract | It already exposes arbitrary distribution files; adding parallel named exports would imply that `.br` is directly importable CSS. |
| Reject a metrics-only change | User requirement | Reporting Brotli size without shipping reusable bytes leaves every self-hosting consumer to recompress the same artifacts. |

## Acceptance

- [x] A clean `npm run build` creates exactly 10 `.br` sidecars, one per
      `dist/**/*.min.css`, using the shared quality-11 encoder.
- [x] `npm run check:dist` rejects a missing, stale or non-Brotli sidecar.
- [x] `npm run check:size` covers all 10 minified stylesheets and agrees with
      the corresponding sidecar byte counts.
- [x] `npm run check:package` proves the sidecars are present in the npm
      tarball and no undeclared output is added.
- [x] `npm run check:consumer` installs the tarball and verifies every
      delivered sidecar against its CSS source.
- [x] `CHANGELOG.md`, `README.md` and `docs/src/pages/about.md` explain both
      the shipped artifacts and the hosting requirements.

## Open questions

None. If token JSON becomes a documented browser delivery asset later, decide
its compression policy separately rather than expanding this contract by
analogy.
