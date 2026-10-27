# Accent text that reads 4.5:1 for any accent

| | |
| --- | --- |
| Issue | Known defect 1 in [default-palette](default-palette.md); measured again for gh#89 |
| Status | Landed in v0.17.0: every acceptance check passed (2026-10-26) |
| Baseline | `395698bda` on `feat/v0.17-finish` |
| Breaking | No: the default theme and every preset paint the same accent text; only accents that failed 4.5:1 get darker (light) or lighter (dark) text |

`--cirth-primary-text` is the accent as text: links, the current position,
focus rings. [surface-and-edge-model](surface-and-edge-model.md) promises it
reads 4.5:1 on every surface level for any accent, and it does not. In light
it is the accent with its OKLab lightness capped at 0.52; in dark, raised to
at least 0.72. Lightness is not what WCAG measures. Greens, teals and cyans
are more luminous at the same lightness, and a light, saturated accent keeps
its chroma when its lightness drops, leaves the sRGB gamut, and is clipped by
the browser back to something lighter. A teal accent prints its links at
3.83:1; a deep red one, in dark, at 3.70:1. After this change the text role
caps the luminance itself, so it reads at least 4.5:1 on every level of the
default surface ladder for every accent, and the accents that already passed
paint exactly as before.

## Contract

After this lands:

- In light, `--cirth-primary-text` is the accent with its lightness capped at
  0.52, as today, then scaled toward black in linear light until its relative
  luminance is at most 0.1409. That luminance reads 4.6:1 on the darkest
  level of the default ladder, the recessed one.
- In dark, the accent with its lightness raised to at least 0.72, as today,
  then mixed toward white in linear light until its relative luminance is at
  least 0.2766, which reads 4.6:1 against the lightest level, the overlay.
- The scaling clamps each channel to the sRGB range first, as the browser
  does when it paints, so the cap holds for accents that leave the gamut.
  It changes no hue: scaling linear channels keeps their ratio.
- The default accent and the accents of plain, material and metro paint the
  same accent text as before, in both schemes, with and without
  `prefers-contrast: more`: none of them reaches the cap.
- `--cirth-primary-focus` and every role that reads `--cirth-primary-text`
  follow it.
- The token computes to `oklch()`, as before: the capped colour is read back
  into OKLCH, so `getComputedStyle` returns the same notation as for every
  other colour, and the same numbers for the default and the presets.

It does **not** promise:

- 4.5:1 on a canvas of your own outside the default ladder. The caps are
  numbers measured on the default levels, because a colour derivation in CSS
  cannot read the luminance of a second colour. A much darker light canvas,
  or a lighter dark one, needs its own check, as
  [surface-and-edge-model](surface-and-edge-model.md) already says.

## Evidence ledger

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| A lightness cap cannot hold 4.5:1 for every accent | For in-gamut text the cap would need 0.505 (4.59:1 worst at hue 144° and full chroma; 0.51 gives 4.49:1). For a light, saturated accent whose chroma does not exist at the capped lightness, the browser clips it: 3.84:1 at 0.52 and still 4.08:1 at 0.505 for `oklch(0.8 0.268 143)`, 4.04:1 for `oklch(0.7 0.17 200)` | `dist/cirth.css` at `395698bda`; Chromium 149.0.7827.55, Firefox 151.0 and WebKit 26.5 give the same ratios, so all three clip per channel | Verified |
| The dark clamp fails too | `oklch(0.25 0.28 30)` reads 3.70:1 at `max(l, 0.72)` | Same build, Chromium 149.0.7827.55 | Verified |
| A luminance cap holds for every accent | 288 accents per scheme (24 hues; lightness 0.45 to 0.9 in light, 0.25 to 0.85 in dark; chroma 0.05 to 0.28, many out of gamut): worst 4.57:1 in light and 4.59:1 in dark, in all three engines | Prototype over the same build, same engines, 2026-10-26 | Verified |
| The default and the presets are unchanged | Painted accent text before the change: default `163,27,176` / `235,95,249`, plain `28,101,200` / `112,166,245`, material `103,80,164` / `208,188,255`, metro `0,80,239` / `117,163,252`, and under `more` `109,26,118` / `241,170,247` and the presets' own | Same build, Chromium 149.0.7827.55 | Verified |
| The luminance caps hold, as built | `tests/surface-depth.spec.js` (accent text reads 4.5:1 on every level for any accent): nine accents chosen to break the lightness caps, both schemes; it fails in both with the lightness caps alone | `dist/cirth.css` from this change, Chromium 149.0.7827.55, Firefox 151.0, WebKit 26.5, 2026-10-26 | Verified |
| Nothing the default or a preset paints changes | Painted `--cirth-primary-text`, old derivation injected against new: identical in 48 cases (three engines, two schemes, with and without `more`, default and three presets) | Same build, Chromium 149.0.7827.55, Firefox 151.0, WebKit 26.5 | Verified |
| The token export resolves the new value | `npm run check:tokens`: 717 colour comparisons within ΔOklab 0.002 of the three engines, with `primary-text`, `primary-focus`, `form-element-focus-color` and dark `progress-color` exported rather than listed | Same build | Verified |
| The size budgets hold | `cirth.min.css` within 17500 B gzip | Same build | Verified |
| The token computes to `oklch()` with the same numbers | Wrapped in `oklch(from … l c h)`, a link computes to `oklch(0.52 0.228 324)` in light and `oklch(0.72 0.245 324)` in dark in all three engines, and the painted text is identical to the old derivation in 48 of 48 cases; `check:tokens` 717 comparisons within ΔOklab 0.002 | `dist/cirth.css` from this change, Chromium 149.0.7827.55, Firefox 151.0, WebKit 26.5, 2026-10-26 | Verified |

## Decisions

| Decision | Basis | Rationale |
| --- | --- | --- |
| Cap the luminance, after the lightness cap | Constraint | The lightness cap alone fails for luminous hues and clips out of gamut. Keeping it first leaves every accent that passed today unchanged, so the default and the presets paint the same text |
| Rejected: lowering the lightness cap to 0.51 or 0.505 | Evidence | Measured above: not enough at full chroma, and nowhere near enough once the browser clips. It would also darken the default's links for nothing |
| Rejected: capping chroma | Design | The chroma ceiling depends on hue and lightness and cannot be computed in CSS; any fixed cap dulls the default magenta |
| Read back into `oklch()` | Maintainer, 2026-10-26 | A first version returned the `color(srgb-linear …)` itself, and the token computed to that notation; wrapping it in `oklch(from … l c h)` costs nothing and keeps every colour token in one notation. The default reads back `oklch(0.52 0.228 324)` in light and `oklch(0.72 0.245 324)` in dark, as before |
| 4.6:1, not 4.5:1 | Constraint | The painted colour is rounded to 8 bits per channel; the margin keeps every measured accent above 4.5:1 after rounding |

## Acceptance

- [x] A test holds `--cirth-primary-text` at 4.5:1 or more on every level for
      a set of accents that includes luminous and out-of-gamut ones, in both
      schemes and three engines, and fails with the lightness caps alone.
      `tests/surface-depth.spec.js`, 2026-10-26.
- [x] The default and the three presets paint the same accent text as
      before, in both schemes and under `prefers-contrast: more`.
      48 of 48 identical (ledger).
- [x] `npm run check:tokens` and `npm run check:size` pass.
      Both pass; the token export resolves the linear relative colour inside
      the `oklch()`.
- [x] Colors, Customization and [default-palette](default-palette.md)
      describe the new guarantee; `CHANGELOG.md` records the fix.
      Colors, Customization and Upgrading describe it; default-palette's
      known defect 1 is closed; the changelog has it under Fixed.
