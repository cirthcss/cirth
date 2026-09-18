# Token export as W3C Design Tokens

| | |
| --- | --- |
| Issue | gh#93 |
| Status | Implementing |
| Baseline | `c4dcd4c5` on `master`, branch `feat/issue-93-dtcg-tokens` |
| Breaking | No — two files are added to the package; no stylesheet changes |

The npm package gains `@cirthcss/cirth/tokens/light` and
`@cirthcss/cirth/tokens/dark`: the default theme's custom properties as DTCG
2025.10 JSON, one complete file per colour scheme. They are for design tools
and non-CSS platforms. A consumer who only uses the stylesheets is not
affected, because no CSS file changes.

## Contract

After this lands:

- `npm run build` writes `dist/tokens/light.tokens.json` and
  `dist/tokens/dark.tokens.json` from `dist/cirth.css`, on every build. They
  are never edited or committed by hand.
- Each file is a valid DTCG 2025.10 document and holds every custom property
  that the theme roots of `dist/cirth.css` declare for that scheme, exactly
  once. Each one is either a token or an entry under
  `$extensions["com.github.cirthcss"].unrepresented`, with its CSS and a
  reason.
- Token names are the custom property names without `--cirth-`.
- A bare `var(--cirth-x)` is exported as the alias `{x}` and carries the same
  `$type` as its target. A `var()` inside a shadow is exported as a
  reference.
- A colour the browser computes (`color-mix()`, relative colour syntax) is
  exported as its resolved `oklch` value in that scheme, with a 6-digit sRGB
  `hex` fallback clipped to gamut. The CSS it came from is kept under
  `$extensions["com.github.cirthcss"].css`. The exported value matches what
  Chromium, Firefox and WebKit compute for the same token within
  ΔOklab 0.002.

It does **not** promise:

- That a resolved colour follows a changed input. A tool that reads
  `primary-active` gets the colour for the shipped `--cirth-primary`. The
  relationship is kept only as CSS text in `$extensions`.
- Stable token *values* across releases. The export carries the theme, and
  the theme is pre-1.0.
- Presets, the `prefers-contrast: more` adjustments, or component-level
  rebinding of slots (such as `--cirth-color` on a heading). Only the theme
  roots are exported.
- That the token *kinds* from `customization.md` (input, derived, slot,
  role, scale) are in the file. See Open questions.

## Evidence ledger

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| Every exported colour matches what three engines compute | `npm run check:tokens`: 116 colour tokens per scheme × 2 schemes × 3 engines = 696 comparisons, 0 failures, ΔOklab ≤ 0.002 | `dist/cirth.css` built from this branch on `c4dcd4c5`; Chromium 149.0.7827.55, Firefox 151.0, WebKit 26.5 (Playwright 1.61.1, macOS 26.6.2), 2026-09-18 | Verified |
| The engine comparison can fail | Treating an achromatic hue as `0` instead of missing made `check:tokens` report 51 mismatches, e.g. `error-text` hue 17.64 vs Chromium's 22. The resolver was then restored and the check passed | Same run | Verified |
| Every root custom property is accounted for | `check:tokens` structural half: 213 tokens + 26 unrepresented = 239 declarations per scheme, none missing or duplicated | Same run | Verified |
| The shape matches DTCG 2025.10 | Checked against the Format and Color modules (Final CG Report, 2025-10-28): `oklch` components with L in 0–1, `none` allowed, 6-digit `hex`; dimension units `px`/`rem` only; duration `{value, unit}`; shadow as an object or array holding references; names without `{`, `}`, `.` | designtokens.org/tr/2025.10, read 2026-09-18 | Verified |
| The package ships exactly the two files and both subpaths resolve | `npm run check:package`: 26 files, 22 build outputs, 15 entry points. `npm run check:consumer`: 14 entry points resolve from a clean install, including both `./tokens/*` subpaths | This branch, 2026-09-18 | Verified |
| The token reference in `customization.md` is generated from `src/` at docs-build time (stated in gh#93) | It is a hand-written Markdown table. Nothing in `docs/eleventy.config.js` or `scripts/` produces it or checks it against the stylesheet | `docs/src/pages/customization.md` at `c4dcd4c5` | Invalid |
| `--cirth-box-shadow` renders a shadow | `light-dark()` accepts only colours, and this one wraps two 7-layer shadow lists. A probe with `box-shadow: var(--cirth-box-shadow)` and an open `details.dropdown` list both compute `none` | `dist/cirth.css` at `c4dcd4c5`; Chromium 149, Firefox 151, WebKit 26.5, 2026-09-18 | Invalid |

The last row is a defect found by this work, not caused by it. The export
lists `box-shadow`, `dropdown-box-shadow` and `popover-box-shadow` as
unrepresented instead of guessing a value the stylesheet never produces.

## Decisions

| Decision | Basis | Rationale |
| --- | --- | --- |
| DTCG 2025.10, not a custom JSON shape | Design | It is the stable, published format that design tools read. A custom shape would need its own importer everywhere. Rejected: plain `{name: css}` JSON, which is portable only to tools we write. |
| Read `dist/cirth.css`, not `src/` | Constraint | The export must describe what ships. Sass is not a public API, and the compiled roots are where `light-dark()` has already been written out. Rejected: walking the Sass, which would duplicate the compiler. |
| Aliases where CSS has a plain reference, resolved values plus the CSS where it computes | Design | This keeps every relationship DTCG can express and loses none silently. Rejected: all resolved, which loses the 71–73 aliases per scheme; all as expressions, which no tool reads. |
| One complete file per scheme | Design | Tools map files to modes. Rejected: one file with both schemes, which needs a non-standard mode convention; a base file plus a dark overlay, which needs merging. |
| Unrepresentable values are listed, not coerced | Existing contract | Coercing `.15em` into `rem` or `calc()` into a number would ship a wrong value that looks right. |
| The browser comparison runs in CI, not in the build | Constraint | `npm run build` must not require Playwright. The check runs after CI installs the browsers. |
| The resolver implements only the colour syntax the theme uses | Design | That is `oklch()`, `oklch(from …)`, `color-mix()` in oklch/oklab, hex and named colours. Anything else becomes unrepresented rather than guessed, and `check:tokens` proves the supported subset against engines. |

## Acceptance

- [x] `npm run build` writes both files; `npm run check:tokens` passes.
- [x] `npm run check:package` and `npm run check:consumer` pass with the new
      entry points.
- [x] CI runs `check:tokens` after installing the browsers
      (`.github/workflows/ci.yml`).
- [x] Consumer documentation: "Tokens outside CSS" in
      `docs/src/pages/customization.md`; `CHANGELOG.md` under Unreleased.

## Open questions

- **Token kinds in the export.** The AI-agent consumer named in gh#93 wants
  to know whether a token is an input or a slot. Today the only source is
  the hand-written table in `customization.md`. Moving the kinds into a
  data file would let both the table and the export read it, and would close
  the Invalid row above. That is left for a follow-up.
- **Presets and `prefers-contrast: more`.** Each could ship as further
  files using the same reader. They were left out until someone asks for
  them.
- **The `--cirth-box-shadow` defect.** It should be fixed separately. Once
  it is, the three shadow tokens will export as `shadow` without any change
  here.
