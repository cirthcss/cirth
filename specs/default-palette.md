# Default palette

| | |
| --- | --- |
| Issue | None yet: palette round for the technical-language foundations, `design/technical-language-system` |
| Status | Landed on `develop` |
| Baseline | `f1caa145` on `design/technical-language-system` |
| Breaking | Yes: custom property defaults redefined; no token renamed, removed or added |
| Decisions | 2026-09-29, maintainer: candidate F of the palette research, replacing candidate B chosen earlier the same day. 2026-10-13, maintainer: the accent at 85% of its chroma ceiling instead of 70%, the neutrals at 132° instead of 120° |

The default theme changes colour. The accent moves from hue 44° to 324°, a
magenta; the neutral family from 280° to 132°, a grey with a trace of green;
the light canvas takes the neutral hue instead of the accent's; and the three
status families move to new hues (error 26°, success 160°, warning 80°) and
new steps. Anyone using the default theme sees a different page; anyone
reading a default value (a custom property, `dist/tokens/*.tokens.json`)
reads a different one. No token is renamed and no derivation changes, so an
author who sets `--cirth-primary`, `--cirth-canvas` or a status input keeps
what they set, and the presets keep their own source while inheriting new
neutrals and, for plain, new status colours.

This file first recorded candidate B (accent 338°, neutrals 80°). B was
implemented, measured and then replaced by F before anything was committed;
it is kept below as a rejected decision, with the measurements that
rejected it.

F was then committed with the accent at 70% of its chroma ceiling and the
neutrals at 120°. Reviewed on 2026-10-13 beside the illustrated mascot the
brand is moving to, the accent read as dull and the neutrals as khaki. The
accent rises to 85%, the fraction the status families already use, and the
neutral hue moves to 132°, the hue that keeps the accent's separation and
improves every neutral-to-status distance (see Decisions). Both earlier
values are kept below as rejected decisions.

## Contract

### Scales

`src/theme/_colors.scss` keeps its five families and its rule: 19 steps from
L 18% to 96%, each chromatic family at a fixed fraction of its hue's sRGB
chroma ceiling (85%, for the accent and the status families alike), and the
neutral family on a chroma bell that peaks at 0.032 mid-ladder and floors at
70% of the peak at the dark end. The hues and the accent's fraction move,
and the chroma values follow from the rule.

| Family | Hue before | Hue after |
| --- | --- | --- |
| neutral | 280° | 132° |
| accent | 44° | 324° |
| error | 22° | 26° |
| success | 153° | 160° |
| warning | 89.5° | 80° |

| Step | L | neutral C | accent C | error C | success C | warning C |
| --- | --- | --- | --- | --- | --- | --- |
| 950 | 18% | 0.022 | 0.072 | 0.062 | 0.035 | 0.032 |
| 900 | 22.3% | 0.023 | 0.089 | 0.077 | 0.043 | 0.039 |
| 850 | 26.7% | 0.025 | 0.107 | 0.092 | 0.051 | 0.047 |
| 800 | 31% | 0.026 | 0.124 | 0.107 | 0.06 | 0.055 |
| 750 | 35.3% | 0.027 | 0.141 | 0.122 | 0.068 | 0.062 |
| 700 | 39.7% | 0.028 | 0.159 | 0.137 | 0.076 | 0.07 |
| 650 | 44% | 0.029 | 0.176 | 0.152 | 0.085 | 0.077 |
| 600 | 48.3% | 0.03 | 0.193 | 0.167 | 0.093 | 0.085 |
| 550 | 52.7% | 0.031 | 0.211 | 0.182 | 0.101 | 0.093 |
| 500 | 57% | 0.032 | 0.228 | 0.197 | 0.11 | 0.1 |
| 450 | 61.3% | 0.028 | 0.245 | 0.212 | 0.118 | 0.108 |
| 400 | 65.7% | 0.025 | 0.262 | 0.195 | 0.126 | 0.116 |
| 350 | 70% | 0.021 | 0.243 | 0.162 | 0.135 | 0.123 |
| 300 | 74.3% | 0.018 | 0.204 | 0.133 | 0.143 | 0.131 |
| 250 | 78.7% | 0.014 | 0.166 | 0.105 | 0.151 | 0.139 |
| 200 | 83% | 0.011 | 0.13 | 0.08 | 0.16 | 0.141 |
| 150 | 87.3% | 0.007 | 0.095 | 0.058 | 0.168 | 0.103 |
| 100 | 91.7% | 0.004 | 0.061 | 0.036 | 0.113 | 0.066 |
| 50 | 96% | 0 | 0.029 | 0.017 | 0.051 | 0.031 |

`$canvas-light` becomes `oklch(96% 0.006 132deg)`: lightness and chroma
unchanged, hue 44° to 132°. `specs/surface-depth.md` later moved both
canvases' lightness and chroma; they keep the neutral hue.

### Inputs

| Token | Light | Dark | Before |
| --- | --- | --- | --- |
| `--cirth-primary` | accent-500 | accent-450 | 550 / 400 |
| `--cirth-canvas` | `$canvas-light` | neutral-950 and neutral-900 mixed in oklab | same formula |
| `--cirth-error` | error-700 | error-200 | 650 / 300 |
| `--cirth-success` | success-500 | success-400 | 550 / 400 |
| `--cirth-warning` | warning-550 | warning-350 | 600 / 350 |

Ink, muted ink, secondary text, the contrast family and the visited link
(neutral-600 and neutral-400 at chroma 0) keep their steps.
`--cirth-primary-on-surface` stays white in both schemes. The dark canvas
keeps its lightness and moves from a cool grey to an olive one.

Under `prefers-contrast: more` (`src/theme/_contrast.scss`):

| Token | Light | Dark | Before |
| --- | --- | --- | --- |
| `--cirth-primary` | accent-700 | accent-200 | 700 / 250 |
| `--cirth-form-element-invalid-border-color` | error-750 | error-150 | 700 / 250 |
| `--cirth-meter-even-less-good-color` | error-750 | error-150 | 750 / 200 |

Everything else the pass pins keeps its step: the visited link
(neutral-750 / neutral-250), the valid border (success-600 / success-250),
the other two meter readings (success-650 and warning-700 in light,
success-300 and warning-250 in dark), ink and muted ink.

### Derivations

Unchanged, byte for byte: the accent text clamp (0.52 in light, 0.72 in
dark), every mix toward black, the surface levels, the three edges and the
danger fill. The palette changes what they are applied to, not what they do.
Two comments that described a derivation in terms of the old anchor are
restated, not the derivation: the light hover and active mixes land exactly
on a ladder step only from a 550 anchor (`src/theme/_light.scss`), and the
dark contrast pass's coefficients no longer land on a step
(`src/theme/_contrast.scss`).

### Overrides and presets

- An author override of `--cirth-primary`, `--cirth-canvas` or a status
  input works as it does today: every role still derives from the input at
  runtime.
- `src/presets/` does not change here. What the presets inherit does:
  - of the colour inputs, plain sets only the accent and the canvas, so it
    inherits the new status inputs and the new neutrals: its ink turns
    olive (`#393e2e` in light) on its achromatic canvas.
  - playroom set its own ink, muted ink, visited link and status inputs,
    and inherited the default secondary text. It has since been replaced
    by material (`specs/material-preset.md`), which sets its own ink,
    muted ink, secondary text and error, and inherits success, warning and
    the visited link.

### Meter order

The three meter readings keep an order of lightness, so that severity reads
without telling the hues apart: success > warning > error in light and the
reverse in dark, with and without `prefers-contrast: more`. In the default
theme that is 0.570 > 0.527 > 0.397 in light and 0.657 < 0.700 < 0.830 in
dark, the same as B: the status steps did not move between B and F.
`tests/meter.spec.js` holds it, for the default theme and every shipped
preset. Playroom did not hold it in dark (warning and error both at L 0.74)
and was recorded there as a known exception; the exception went with the
preset.

### What this does not promise

- **That the brand mark shares the accent's hue.** Not promised by this
  change, which left the mark in copper at 44°. Since closed outside the
  published artifact: see open question 1.
- **A redesign of the presets.** Plain and playroom change only through what
  they inherit. Their redesign is separate work.
- **That every pair of signals clears 0.06 under colour vision deficiency.**
  The worst pair among accent, error, success, warning and visited link is
  0.049 in the base modes and 0.030 under `more` (0.009 and 0.005 before this
  change), and `tests/signal-separation.spec.js` keeps it at 0.04 or more
  (0.02 under `more`) in the default theme, not in the presets. The pairs
  that contain the accent sit at 0.093 or more in the base modes. The 0.06
  floor that `tests/framework-specimen.spec.js` enforces covers primary
  against danger only, as before.
- **Accent text at 4.5:1 for any accent.** A pre-existing gap, listed below
  and not closed here.

## Measurements

The default theme on this build, read from the build in a browser; the
ledger says how and where. The build is `dist/cirth.css` from this change on
`7c7148fb3`, which also carries `specs/surface-depth.md`: the canvases and
the surface levels below are that spec's, not this one's. The values F
measured at 70% and 120° on `f1caa145` are in this file's history.

### Tokens

| Token | Light | Dark |
| --- | --- | --- |
| `--cirth-primary` | `#b431c1` | `#c638d4` |
| `--cirth-primary-text` | `#a31bb0` | `#eb5ff9` |
| `--cirth-primary-surface` | `#b431c1` | `#872390` |
| `--cirth-primary-surface-active` | `#a02bab` | `#7f2088` |
| `--cirth-primary-active` | `#8d2597` | `#e841f8` |
| `--cirth-canvas` | `#f7f8f6` | `#0c0f0a` |
| `--cirth-surface-recessed` | `#eaebe9` | `#050704` |
| `--cirth-surface-raised` | `#fefefe` | `#1a1d17` |
| `--cirth-surface-overlay` | `#fefefe` | `#252923` |
| `--cirth-muted-border-color` | `#dcdedc` | `#2f332d` |
| `--cirth-card-border-color` | `#c5c6c4` | `#41443e` |
| `--cirth-form-element-border-color` | `#828381` | `#797d76` |
| `--cirth-ink` | `#363e30` | `#c5c9c2` |
| `--cirth-ink-strong` | `#171e12` | `#f2f2f2` |
| `--cirth-muted-color` | `#586251` | `#9aa194` |
| `--cirth-secondary-text` | `#4d5646` | `#a8aea3` |
| `--cirth-link-visited-color` | `#5e5e5e` | `#919191` |
| `--cirth-error` | `#811b1b` | `#f7b4ac` |
| `--cirth-success` | `#2d8b61` | `#39a876` |
| `--cirth-warning` | `#876422` | `#c69537` |
| `--cirth-error-text` | `#5e1111` | `#ffc8c1` |
| `--cirth-success-text` | `#164f35` | `#4bd798` |
| `--cirth-warning-text` | `#573f12` | `#e8af43` |
| `--cirth-mark-background-color` | `#edd7ee` | `#341e34` |

### Contrast

WCAG 2, on colours as painted in 8-bit sRGB, the worst of canvas, recessed,
raised and overlay unless a row says otherwise. "Hover" is
`--cirth-primary-surface-active`; "pressed" is the same fill under the 12%
black wash `src/content/_button.scss` paints on `:active`.

| Role | Light | Dark | Light · more | Dark · more |
| --- | --- | --- | --- | --- |
| Ink | 9.30 | 8.81 | 14.27 | 13.21 |
| Muted ink | 5.35 | 5.56 | 7.74 | 7.62 |
| Secondary text | 6.42 | 6.51 | 7.74 | 7.62 |
| Visited link | 5.42 | 4.69 | 9.30 | 7.62 |
| Accent text and focus ring | 5.26 | 5.31 | 8.53 | 8.33 |
| Control edge | 3.19 | 3.53 | 7.11 | 7.03 |
| White label on the fill, at rest | 5.06 | 7.86 | 10.20 | 8.35 |
| White label, hover | 6.13 | 8.52 | 11.52 | 9.90 |
| White label, pressed | 7.37 | 9.88 | 12.85 | 11.21 |
| Status text, error / success / warning | 11.23 / 7.97 / 8.26 | 10.06 / 8.08 / 7.50 | as light | as dark |
| Status border, error / success / warning | 8.34 / 3.53 / 4.53 | 8.51 / 4.95 / 5.46 | invalid 9.93, valid 5.16 | invalid 9.84, valid 8.08 |
| Meter readings on the track, optimum / suboptimum / worst | 3.53 / 4.53 / 8.34 | 6.78 / 7.47 / 11.63 | 6.19 / 7.86 / 9.93 | 9.43 / 10.24 / 13.45 |
| Switch thumb on the unchecked track | 3.81 | 4.19 | 8.50 | 3.11 |

Against the same build with the accent at 70% and the neutrals at 120°
(HEAD's source compiled with Sass 1.100.0), every accent row rises in
light (accent text 5.10 to 5.26, white label 4.95 to 5.06) and every
neutral row moves by 0.09 or less. In dark the accent text falls from 5.42
to 5.31: at L 0.72 the extra chroma costs luminance.

### Signals under colour vision deficiency

ΔOklab, normal vision and Machado et al.'s protanopia, deuteranopia and
tritanopia at full severity, the method of `tests/signal-separation.spec.js`.

| | Light | Dark | Light · more | Dark · more |
| --- | --- | --- | --- | --- |
| Worst pair of the five signals | 0.049 (success and warning text, protanopia) | 0.054 (error and success text, protanopia) | 0.030 (success and visited text, deuteranopia) | 0.031 (same pair) |
| Worst pair that contains the accent | 0.093 (accent and warning fill, tritanopia) | 0.104 (accent and warning text, tritanopia) | 0.057 (accent and warning text, tritanopia) | 0.045 (accent and error text, tritanopia) |
| Accent against the neutral at the same step, worst vision | 0.146 (step 500, deuteranopia) | | | |
| Primary fill against danger fill, normal / protan / deutan | 0.268 / 0.282 / 0.248 | 0.168 / 0.151 / 0.119 | 0.155 / 0.161 / 0.157 | 0.115 / 0.109 / 0.094 |

The worst pairs of the five signals do not contain the accent, so the
chroma does not move them; the neutral hue moves the `more` pairs, where the
visited link is a neutral step that carries the hue.

### Conditions the existing tests hold

`tests/framework-specimen.spec.js`, default theme:

| Condition | Light | Dark | Floor |
| --- | --- | --- | --- |
| Primary fill against danger fill, ΔOklab, normal / protan / deutan | 0.268 / 0.282 / 0.248 | 0.168 / 0.151 / 0.119 | 0.06 |
| White label on primary, every simulation | ≥ 4.62 (deuteranopia) | ≥ 7.28 (deuteranopia) | 4.5 |
| White label on danger, every simulation | ≥ 8.90 | ≥ 7.12 | 4.5 |
| `<mark>` text | 13.86 | 15.20 | 4.5 |
| Range thumb on its track | passes, not re-read | passes, not re-read | 3 |

`scripts/check-accent-distance.js`: the accent sits 62° from the error input
in the default theme; plain 128°, metro 123°, material 84° to 97° from their
own error.

## Known defects, not fixed here

Found while modelling the palette. None depends on the choice of palette,
and each is left for its own change.

1. The accent text clamp at 0.52 in light does not hold 4.5:1 for every
   accent, as `src/theme/_light.scss` says. For an accent anchored at the
   500 step and at 85% of its chroma ceiling, the text role falls below
   4.5:1 on the recessed level of today's canvas for hues from about 115° to
   234°, down to 4.29:1 at 143°. The shipped accent at 324° reads 5.26:1.
   (At 70%, on the canvas before `specs/surface-depth.md`: 81° to 256°, down
   to 4.21:1.) The dark clamp at 0.72 holds for every hue.
2. Playroom under `prefers-contrast: more` in dark:
   `--cirth-secondary-text` and `--cirth-error-text` under the 7:1 the pass
   promises on the overlay. Closed by removal: the preset is gone
   (`specs/material-preset.md`), and material holds 7:1 there.
3. Plain produces colours outside sRGB, up to 0.046 ΔOklab (its dark active
   accent, and in dark `more` its text selection). The browser clips them,
   so what is painted is not what is declared.
4. `--cirth-error-surface` in light (`oklch(93% 0.05 h)`) is outside sRGB by
   0.013 at 26°.

## Evidence ledger

"This build" is `dist/` built from this change on `7c7148fb3`, not yet
committed. Tokens are resolved by the engine, rounded to 8-bit sRGB and
measured with `scripts/lib/color.js`: WCAG 2 contrast, and Oklab distance
under its Machado simulations, pairing the signals as
`tests/signal-separation.spec.js` does. The tables were read in Chromium
149.0.7827.55; the suites ran in Chromium 149.0.7827.55, Firefox 151.0 and
WebKit 26.5, as installed for Playwright 1.61.

### Verified

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| The light accent is `oklch(57% 0.228 324)`, `#b431c1`, and a white label on it reads 5.06:1 | `#b431c1`; 5.06:1 | `dist/cirth.css` of this build, Chromium | Verified |
| The dark accent is `oklch(61.3% 0.245 324)`, `#c638d4`, and a white label on the dark fill reads 7.86:1 | `#c638d4`; fill `#872390`; 7.86:1 | Same | Verified |
| The accent scale is 85% of the sRGB chroma ceiling at every step | 0.848 to 0.857 of the ceiling, the literals being rounded to three decimals | Computed from `src/theme/_colors.scss` with colorjs.io | Verified |
| The 70% accent was 0.046 from the mascot's purple (`#b828b4`) and the 85% accent is 0.023 | ΔOklab from the light accent | Computed | Verified |
| The accent sits 62° from the error input | 62.0° in light, dark and both `more` modes; plain 128.0°, metro 123.4°, material 84.0° to 96.8° (its dark `more` accent is below the chroma floor and not judged) | `npm run check:tooling` (`scripts/check-accent-distance.js`) on this change | Verified |
| Worst signal pair under CVD: 0.049 in the base modes, 0.030 under `more` | 0.049 light, 0.054 dark; 0.030 light `more`, 0.031 dark `more` | Painted tokens of this build, Chromium; `tests/signal-separation.spec.js` passes in the three engines | Verified |
| Pairs that contain the accent: 0.093 | 0.093 light (accent and warning fill, tritanopia), 0.104 dark; 0.072 and 0.091 with the 70% accent | Same run | Verified |
| Accent against the neutral at the same lightness: 0.146 | 0.1462 at step 500, the minimum of normal vision and the three simulations (deuteranopia). With the same 85% accent: 120° 0.1484, achromatic 0.1237, the accent's own hue 0.1078 | Computed from the literals, rounded to 8-bit | Verified |
| The neutral hue sweep under Decisions | 96° to 160° in 4° steps: accent separation 0.133 to 0.149, peak at 120° to 124°; at 132° every neutral-to-status distance (ink and muted ink against warning and success text, both schemes, worst vision) equals or beats 120° | Same method, from the literals and the scheme derivations | Verified |
| Ink against the warning text in light: 0.066 | Normal vision; 0.049 at the worst simulation (protanopia). At 120°: 0.060 and 0.046 | Painted tokens, Chromium | Verified |
| Primary against danger: 0.268 in light, 0.168 in dark | Normal vision; 0.248 and 0.119 at deuteranopia, the worst the test checks | Painted tokens of this build, Chromium; danger fill computed with the component's `color-mix()` | Verified |
| Meter order: 0.570 > 0.527 > 0.397 in light, 0.657 < 0.700 < 0.830 in dark | The status steps did not move; `tests/meter.spec.js` passes, three engines | This build | Verified |
| The token values under Measurements | As listed | Painted tokens of this build, Chromium | Verified |
| `npm run check:tokens` holds the export to the engines | 717 colour comparisons within ΔOklab 0.002, three engines | This build | Verified |
| The contrast table under Measurements | As listed | Chromium | Verified |
| Comments in `src/theme/` and `scripts/` that quote a ratio or a hue | Re-measured on this build and restated. Several predated `specs/surface-depth.md` and were already stale at `7c7148fb3` (the muted ink's 5.21:1, the visited link's 5.77:1, the light switch thumb's 3.92:1) | This build, Chromium | Verified |
| The light mix ratios still land on ladder steps | 83.5% and 91.7% of `$accent-550` reach `$accent-650` and `$accent-600`, 78.1% of `$accent-700` reaches `$accent-800`: chroma and lightness scale together, and every step holds one fraction of its ceiling | Computed from the literals | Verified |
| In dark `more`, an accent at 250 would read 7.06:1 on the overlay | Was 6.86:1 at 70% | Chromium, `--cirth-primary` set to `$accent-250` | Verified |
| Known defect 1 | Hue range and worst value as listed | Computed from the literals and the derivation on today's canvas, channels clipped to sRGB; the same model gives 5.10:1 for the 70% accent, as Chromium paints it | Verified |
| The brand marks follow the scale | `logo_brand.svg` `#B431C1`, `favicon_dark.svg` `#D93EE9`; `npm run check:brand-assets` passes after `npm run docs:brand-assets` | This change | Verified |
| The research's weighted proximity, re-run on its own data | The landscape (81 colours, 63 systems with a chromatic accent) and the W1 and W3 weights read from the research report's table, the formula from the research's scripts: Σ w · exp(−(ΔE / 0.10)²), ΔE the smallest Oklab distance between either Cirth accent and any colour of the system. Reproduces the report within +0.00 to +0.04 (F 5.00 against 4.96, G 5.14 exact, B 6.57 against 6.55, 44° 3.26 against 3.22), the offset of weights printed to two decimals | Computed; the competitors' colours stay Reported | Verified |
| At 85% the accent is less crowded in every weighting | W3 5.00 → 3.99. Lower in all eight scenarios the research used: W1, W2, W3, W3 with Sass at 2 and at 3, σ 0.08 and 0.12, Emotion halved | Same | Verified |
| At 85% the accent moves away from every CSS tool | Sass 0.096 → 0.133 (its site's action colour), Emotion 0.077 → 0.103, Linaria 0.056 → 0.084, StyleX 0.079 → 0.103, Milligram 0.045 → 0.060 (0.061 from its published `#9b4dca`) | Same | Verified |
| At 85% two logo gradients come closer | The centre of Angular's logo gradient (`#ba10b2`, interpolated, not a declared colour) 0.064 → 0.037 from the light accent; Angular's declared colours stay at 0.071 or more. The magenta stop of Kotlin's logo (`#d212ec`) 0.090 → 0.049 from the dark accent | Same | Verified |
| Moving the hue would not escape them | Swept 306° to 342° at 85%: the nearest system weighted 0.70 or more sits between 0.029 and 0.051 at every hue, always Angular or Kotlin. 324° is 6% above the band's minimum (W3 3.86 at 316° to 318°), against 4% at 70% | Same | Verified |

### Reported: the maintainer's palette research

Not reproduced here. The research compared candidates against the accents
of other systems; this change records its conclusions as reported. Its
distances were measured for the 70% accent; the rows under Verified re-run
them at 85% on the research's own landscape and weights.

| Claim | Source | Verdict |
| --- | --- | --- |
| Competitors were compared by brand colour (the accent and the logo, in light and in dark), not by states: no hover, visited link, focus ring or example colours | Maintainer's research, 2026-09 | Reported |
| 63 systems, including CSS tools (Sass, Emotion, Linaria, StyleX, vanilla-extract, PostCSS and others) and brands the maintainer named (GraphQL, Storybook, Angular, Angular Material, RxJS, Appwrite, React Hook Form, Milligram, Kotlin, Mermaid, Jest, Gatsby) | Same | Reported |
| Weights by npm downloads, 2026-08-29 to 2026-09-27, with an estimated exposure for Material 3, Primer, Fluent, Atlassian, Geist, the CSS logo and Kotlin, and Sass at 1.5 on the maintainer's instruction | Same | Reported |
| With the signals above their thresholds (pairs containing the accent ≥ 0.06, accent ≥ 0.08 from the neutrals), only the magenta band 308°–338° remains. Blue and violet are crowded; cyan and green cannot hold the signal; orange, yellow and green are status colours | Same | Reported |
| The old 44° is the least crowded hue but sits in the warning's band and fails the signal (worst pair 0.009) | Same. The 0.009 matches B's own baseline measurement of the 44° build (error and warning text, deuteranopia) | Reported |
| Between 316° and 324° the weighted proximity is flat (W3 4.95–4.96). The formal minimum of the nine criteria is 318°, where the accent is 0.025 from Milligram, another CSS framework; 324° keeps it at 0.045, keeps the developer-tool pinks at 0.110 or more, and has the highest separation from the neutrals | Same | Reported |
| ΔOklab from F to: Milligram 0.045; Linaria 0.057; the centre of Angular's logo gradient 0.064 (interpolated); Emotion 0.077; Kotlin, the logo's magenta, 0.091; Sass 0.096 (the site's action colour) and 0.104 (logo); GraphQL 0.110; React Hook Form 0.135; Gatsby 0.146; RxJS 0.154; Jest 0.160; vanilla-extract 0.163; Storybook 0.164; the accent of Angular Material's old indigo-pink theme 0.166; Appwrite 0.180; Mermaid 0.180 | Same | Reported |
| With today's rules a dark label does not work for any hue in the light scheme: hover and pressed darken the fill, and the fill has to hold 3:1 on the canvas and the raised level because it is also a checkbox, a switch and a progress bar | Same. The two halves of the rule are Cirth's (`src/theme/_light.scss`, `src/content/_button.scss`); the sweep across hues is the research's | Reported |

### Carried from B, not re-run for F

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| Known defect 2 | 6.45:1 and 6.11:1 on the overlay with B; playroom's own values do not depend on the accent, but its secondary text inherits the neutrals | `dist/presets/playroom.css` of the B build, Chromium 149.0.7827.55 | Reported |
| Known defects 3 and 4 | Plain's derivations and the error surface formula do not read the accent or the neutrals | B build, `scripts/lib/color.js` | Reported |
| `_dual.scss`: one step weaker than the muted ink fails in both schemes (4.39:1 and 4.33:1) | Already false at the baseline in dark: neutral-400 at 280° read 4.56:1 on the overlay (`#282936`); 4.40:1 in light. The comment now gives this build's values (4.30:1 in light, 4.56:1 in dark) | `dist/tokens/{light,dark}.tokens.json` at `f1caa145` | Invalid |

### Not run for this document

| Claim | Why | Verdict |
| --- | --- | --- |
| The documentation site, its accessibility audit and its screenshots with the new palette | At F: `check:a11y` green (65 pages, 4 themes, 3 modes); `check:behavior` 1581 passed; `check:visual` reviewed and the macOS baselines regenerated, together with the preset changes. At the 2026-10-13 revision: `check:a11y` green (116 pages, 4 themes, 3 modes); `check:behavior` 1970 passed, 17 skipped; `check:visual` failed on the Colors and Brand pages only (60 snapshots), each difference a measured value those pages print from the build, and those macOS baselines were regenerated | Verified |
| The contrast table in Firefox and WebKit | Read in Chromium only for the 2026-10-13 revision; `check:tokens` holds the three engines' tokens to ΔOklab 0.002 | Reported |
| The Linux visual baselines | Not regenerated here; CI's `check:visual` fails on the Colors and Brand pages until `update-visual-baselines.yml` runs | Reported |
| The Linux visual baselines, since | Regenerated by `update-visual-baselines.yml` (latest `a324c38c4`, 2026-10-22); CI run 39861460667 on `ee5e5d343` passed 1294 visual captures against them | Verified |

## Decisions

| Decision | Basis | Rationale |
| --- | --- | --- |
| Accent at 324° | Design | Within the magenta band that holds the signals, the flat stretch of weighted proximity is 316°–324°; 324° keeps the most distance from Milligram and the developer-tool pinks and separates best from the neutrals (research, Reported) |
| Accent anchors 500 in light and 450 in dark | Design | Maintainer's choice with F. The white label reads 5.06:1 in light and 7.86:1 on the dark fill (4.95:1 and 7.75:1 at 70%); the dark anchor is never set as text on its own, since the text role lifts it to L 0.72 |
| Rejected: B, 338° | Design | Emotion 0.041 and Linaria 0.037 away, and 0.0799 from the neutrals, under the 0.08 threshold (Verified: 0.0799) |
| Rejected: G, 330° | Design | Linaria 0.037 away |
| Rejected: 318°–320° | Design | The formal minimum of the criteria, but 0.025–0.032 from Milligram, another CSS framework |
| Rejected: cyan, 226° | Design | 0.075 from the neutrals |
| Rejected: blue, 258° | Design | 0.017 from Fluent 2 |
| Rejected: 44°, the copper | Design | The least crowded hue, but in the warning's band; worst signal pair 0.009 |
| Accent at 85% of its chroma ceiling | Design | Maintainer, 2026-10-13: at 70% the accent read as dull, beside the status colours and beside the mascot it seeds. 85% is the status families' fraction, so the rule has one value. Lightness and hue do not move, so the white label and the text clamp keep their contrast. Against the research's landscape the weighted proximity falls by a fifth and every CSS tool moves further away; the price is Angular's and Kotlin's logo gradients at 0.037 and 0.049 |
| Rejected: accent at 70% | Design | F as first committed. The 70% rationale was that the accent covers whole surfaces; in Cirth it fills controls (a button, a check, a switch, a progress bar), never a page |
| Neutrals at 132° | Design | Maintainer, 2026-10-13: keep a tint, lose the khaki. Swept 96° to 160° in 4° steps against the 85% accent: accent separation peaks at 120°–124° (0.148 to 0.149) and is 0.146 at 132°; every neutral-to-status distance (ink and muted ink against warning and success text, both schemes, worst of normal vision and three simulations) is equal or better at 132° than at 120°. Past about 140° the grey reads as sage, and it closes on the success hue (160°) |
| Rejected: neutrals at 120° | Design | F as first committed: the hue that separated the 70% accent most (0.121). Read as khaki beside the accent and in the mascot's mid greys, where the neutral bell peaks |
| Rejected: achromatic neutrals | Design | Maintainer, 2026-10-13: pure greys rejected on taste. Admissible on the numbers: 0.124 from the 85% accent, above the 0.121 F had at 70% |
| Rejected: a dark fill that keeps the accent's chroma | Design | Maintainer, 2026-10-13: the dark fill mixed toward black may lose chroma; interface colours are expected to drift a little from the logo's |
| Canvas at the neutral hue in both schemes | Design | As in B: the accent stays reserved for action and position, and light and dark share one hue |
| Label stays white | Constraint | A dark label fails in the light scheme for every hue under today's rules (research, Reported): hover and pressed darken the fill, and the fill must hold 3:1 on the canvas and the raised level as a checkbox, a switch and a progress bar |
| Status inputs, steps and contrast-pass steps as in B | Constraint | B chose them to maximise the smallest CVD separation among the five signals under two constraints: status text at 7:1, because the contrast pass does not restate it, and the meter's lightness order. Neither F nor the 2026-10-13 revision moves them; the worst pair is 0.049 on today's surfaces |
| Rejected, with B: dark error at step 250; error at 14°; restating the status colours in the contrast pass | Design | Worst pair 0.039; error 36° from B's accent; no gain |
| Contrast pass: accent-200 in dark | Design | From accent-250 the text role reads 7.06:1 on the overlay at 85% (6.86:1 at 70%): over 7:1, by too little to rely on |
| Contrast pass: invalid border and meter error past the base | Constraint | The base error is 700 in light and 200 in dark, so the pass goes beyond it: error-750 and error-150 |
| Derivations, presets and brand untouched | Existing contract | Only inputs change; the presets and the mark are redesigned separately |

## Acceptance

The list below was ticked for F on `f1caa145` and again for the 2026-10-13
revision on `7c7148fb3`, where `npm run docs:brand-assets` also regenerated
the brand files and `npm run check:brand-assets` passed.

- [x] `npm run lint && npm run build && npm run check:dist` green.
- [x] `npm run check:tooling` green; `check-accent-distance` reports 62° for
      the default theme.
- [x] `npm run check:tokens` green.
- [x] `tests/signal-separation.spec.js` and `tests/meter.spec.js` pass in
      Chromium, Firefox and WebKit.
- [x] `npm run check:a11y` green (with the preset changes of this round).
- [x] `npm run check:behavior` green: 1581 passed, 9 skipped, three engines
      (revision: 1970 passed, 17 skipped).
- [x] `npm run check:visual` differences reviewed, then the macOS baselines
      regenerated. The Linux baselines the CI compares against are not
      regenerated here.
      The Linux set has since been regenerated by the workflow (latest
      `a324c38c4`); CI run 39861460667 on `ee5e5d343` passed 1294 visual
      captures against it.
- [x] Comments quoting a ratio or a hue in `src/theme/` and `scripts/`
      re-measured on the build.
- [x] `docs/src/pages/colors.md`, `docs/src/pages/content/link.md` and
      `docs/src/pages/brand.md` describe the new palette; the Themes page's
      swatch (`docs/eleventy.config.js`) shows the new accent.

## Migration

| If you | Then |
| --- | --- |
| Use the default theme as shipped | Nothing to change. Every colour moves; your own screenshots will differ |
| Copied a default colour into your own CSS, a design tool or a token pipeline | Read it again from `dist/tokens/*.tokens.json` |
| Set `--cirth-primary`, `--cirth-canvas` or a status input | Nothing: every role still derives from what you set. The neutrals around your accent carry a trace of green now, not a cool tint |
| Chose a status colour to sit apart from the old accent | Check it against the new one, at 324°. Cirth keeps its own error at least 20° from the accent |
| Use the plain preset | Its ink, muted ink, secondary text and status colours come from the default theme and change with it |
| Use the playroom preset | It is removed in the same release; move to `material` or keep its values yourself (`docs/src/pages/upgrading.md`) |

## Open questions

1. **The mark.** Closed. The redrawn mark (2026-10-09) is painted from
   this scale by `scripts/build-brand-marks.js`: `$accent-500` on light
   grounds and `$accent-400` on dark ones. `npm run check:brand-assets`
   fails when a brand file no longer matches the scale, so the mark
   follows any later move of the accent.
   The brand files are documentation assets, not part of the npm package.
2. **The presets.** Plain and playroom are to be redesigned; their meter
   order in dark and defects 2 and 3 belong to that work. Partly closed:
   playroom is replaced by material (`specs/material-preset.md`), which
   holds the meter order and closes defect 2. Plain and defect 3 remain.
3. **The known defects above.** Each needs its own change.
4. **Upgrading notes.** `docs/src/pages/upgrading.md` (Next release) has an
   entry per change on this branch; this one has none yet.
5. **Outside this change, and now further out of step with it.** The docs
   site's syntax colours (`docs/src/styles/style.css`) were chosen to sit
   outside the 44°–89.5° signal range, from about 160° to 310°. With the
   accent at 324° the keyword colour (`#6b3991`, 308°) sits 16° from it, so
   a keyword can read as a link.
6. **Competitor proximity at 85%.** Closed on 2026-10-13: re-run on the
   research's data (ledger). The accent is less crowded in every weighting
   and further from every CSS tool, Sass included. What comes closer is the
   saturated magenta inside two logo gradients, Angular's (0.037, an
   interpolated midpoint) and Kotlin's (0.049); no hue in the band avoids
   them at this chroma.
