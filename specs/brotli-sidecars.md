# Precompressed Brotli CSS sidecars

| | |
| --- | --- |
| Issue | Release follow-up requested while preparing v0.16.0 |
| Status | **Withdrawn** — built, then removed before v0.16.0 shipped. See Outcome. |
| Baseline | `92a32d7c` on `chore/brotli-size` |
| Breaking | No |

The build and npm package add a Brotli-compressed `.br` sidecar beside every
minified CSS entry point. Consumers that control their static hosting can serve
those bytes after HTTP content negotiation; the ordinary `.css` files and all
existing package entry points remain unchanged for every other consumer.

> **This contract was withdrawn before it ever reached a consumer.** No
> published version of Cirth contains `.br` sidecars. Everything below the
> Outcome section describes what was built and verified on
> `chore/brotli-size`; it is kept because the measurements are real and the
> reasoning is the reason the decision was reversed, not evidence against it.

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
| ~~Reject a metrics-only change~~ **Superseded** | User requirement, reversed on evidence | The premise was that a self-hosting consumer is the typical consumer. Measurement showed the shipped bytes reach almost none of them, while every consumer pays for them. See Outcome. |

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

## Outcome — withdrawn

The contract above was met: the sidecars were built, verified and packed
exactly as specified. It was withdrawn anyway, because measuring the delivery
paths Cirth documents showed the bytes reach almost nobody while every
consumer pays for them.

Two facts decided it.

**Nothing on a documented path delivers quality 11.** The `12,902 B` figure
is reachable only by a host that precompresses the file itself. The CDN in
Cirth's own installation snippets compresses on the fly at quality 4, which
is larger than its own gzip: a browser that advertises Brotli to jsDelivr
downloads *more* than one that advertises only gzip.

**The cost is universal and the benefit is not.** The sidecars are
incompressible, so gzip in the npm tarball cannot recover any of them. They
added 40% to the published archive, charged to every `npm install`, to serve
a consumer who self-hosts, runs a server with precompressed-static support,
and serves Cirth's CSS unmodified — and a consumer who bundles or concatenates
it invalidates the sidecar anyway.

Removed in the same release cycle that introduced them, so no published
version ever carried them and no deprecation was owed. `build-brotli.js` and
`lib/brotli-sidecars.js` are deleted; `lib/compressed-size.js` survives, with
gzip level 9 as the budgeted and quoted figure and Brotli quality 11 reported
beside it as a best case a host arranges.

### Evidence ledger — the withdrawal

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| jsDelivr serves Brotli at quality 4, larger than its own gzip | `Accept-Encoding: br` → `content-encoding: br`, 15,275 B; `Accept-Encoding: gzip` → 14,400 B. The 15,275 B is a byte-exact match for `brotliCompressSync` quality 4 on the same file (q3 = 16,171 B, q5 = 13,713 B), which identifies the encoder setting | `cdn.jsdelivr.net/npm/@cirthcss/cirth@0.15.0/dist/cirth.min.css`, curl, Node 26.9.0, 2026-09-24 | Verified |
| unpkg never negotiates Brotli | `Accept-Encoding: br, gzip` → `content-encoding: gzip`, 14,242 B | `unpkg.com/@cirthcss/cirth@0.15.0/dist/cirth.min.css`, curl, 2026-09-24 | Verified |
| GitHub Pages, which serves Cirth's own documentation, never negotiates Brotli | `Accept-Encoding: br` alone → no `content-encoding`, 69,524 B uncompressed; `br, gzip` → gzip, 18,329 B | `cirthcss.github.io/cirth/`, curl, 2026-09-24 | Verified |
| The sidecars added 40% to the npm tarball | `npm pack` on this package: 188,692 B / 36 files with sidecars, 134,782 B / 26 files without. Brotli output is incompressible, so the tarball's gzip recovers none of it | `release/v0.16.0`, npm 11.19.1 / Node 26.9.0, 2026-09-24 | Verified |
| A browser advertising Brotli to jsDelivr downloads more than one advertising only gzip | 15,275 B against 14,400 B for the same resource, from the two measurements above | Same as the jsDelivr row | Verified |
| ~~The configured browser floor can negotiate Brotli HTTP content coding~~ | True, and irrelevant to the decision: browser support was never the limiting factor. The limit is what the CDN and host send | Superseded, not retested | Invalid as a reason to ship |
| Precompressed sidecars are usable by some self-hosting stacks | nginx `brotli_static`, Caddy `precompressed br` and equivalents do select a `.br` neighbour. Not reproduced here, and not quantified as a share of Cirth's consumers | Upstream documentation, not measured | Reported |

### If this is revisited

The lever is the delivery path, not the encoder. Two things would change the
answer: a documented CDN that serves high-quality static Brotli, or shipping
the sidecars outside the npm tarball — as release assets — so the people who
can use them get them and nobody else pays. Either is a new spec, not an
amendment to this one.

The 14 KB single-round-trip target that motivated the original request is a
separate question and is not settled here.

## Open questions

None. If token JSON becomes a documented browser delivery asset later, decide
its compression policy separately rather than expanding this contract by
analogy.
