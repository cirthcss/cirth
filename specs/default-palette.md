# Default palette

| | |
| --- | --- |
| Issue | None yet: palette round for the technical-language foundations, `design/technical-language-system` |
| Status | Implementing |
| Baseline | `f1caa145` on `design/technical-language-system` |
| Breaking | Yes: custom property defaults redefined; no token renamed, removed or added |
| Decisions | 2026-09-29, maintainer: candidate F of the palette research, replacing candidate B chosen earlier the same day |

The default theme changes colour. The accent moves from hue 44° to 324°, a
magenta; the neutral family from 280° to 120°, a grey with a trace of olive;
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

## Contract

### Scales

`src/theme/_colors.scss` keeps its five families and its rule: 19 steps from
L 18% to 96%, each chromatic family at a fixed fraction of its hue's sRGB
chroma ceiling (70% for the accent, 85% for the status families), and the
neutral family on a chroma bell that peaks at 0.032 mid-ladder and floors at
70% of the peak at the dark end. Only the hues move, and the chroma values
follow from the rule.

| Family | Hue before | Hue after |
| --- | --- | --- |
| neutral | 280° | 120° |
| accent | 44° | 324° |
| error | 22° | 26° |
| success | 153° | 160° |
| warning | 89.5° | 80° |

| Step | L | neutral C | accent C | error C | success C | warning C |
| --- | --- | --- | --- | --- | --- | --- |
| 950 | 18% | 0.022 | 0.059 | 0.062 | 0.035 | 0.032 |
| 900 | 22.3% | 0.023 | 0.073 | 0.077 | 0.043 | 0.039 |
| 850 | 26.7% | 0.025 | 0.088 | 0.092 | 0.051 | 0.047 |
| 800 | 31% | 0.026 | 0.102 | 0.107 | 0.06 | 0.055 |
| 750 | 35.3% | 0.027 | 0.116 | 0.122 | 0.068 | 0.062 |
| 700 | 39.7% | 0.028 | 0.131 | 0.137 | 0.076 | 0.07 |
| 650 | 44% | 0.029 | 0.145 | 0.152 | 0.085 | 0.077 |
| 600 | 48.3% | 0.03 | 0.159 | 0.167 | 0.093 | 0.085 |
| 550 | 52.7% | 0.031 | 0.173 | 0.182 | 0.101 | 0.093 |
| 500 | 57% | 0.032 | 0.188 | 0.197 | 0.11 | 0.1 |
| 450 | 61.3% | 0.028 | 0.202 | 0.212 | 0.118 | 0.108 |
| 400 | 65.7% | 0.025 | 0.216 | 0.195 | 0.126 | 0.116 |
| 350 | 70% | 0.021 | 0.2 | 0.162 | 0.135 | 0.123 |
| 300 | 74.3% | 0.018 | 0.168 | 0.133 | 0.143 | 0.131 |
| 250 | 78.7% | 0.014 | 0.136 | 0.105 | 0.151 | 0.139 |
| 200 | 83% | 0.011 | 0.107 | 0.08 | 0.16 | 0.141 |
| 150 | 87.3% | 0.007 | 0.078 | 0.058 | 0.168 | 0.103 |
| 100 | 91.7% | 0.004 | 0.05 | 0.036 | 0.113 | 0.066 |
| 50 | 96% | 0 | 0.024 | 0.017 | 0.051 | 0.031 |

`$canvas-light` becomes `oklch(96% 0.006 120deg)`: lightness and chroma
unchanged, hue 44° to 120°.

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

- **That the brand mark shares the accent's hue.** The mark keeps its copper
  at 44° until it is redrawn separately; until then the accent and the mark
  differ, and `docs/src/pages/brand.md` says so.
- **A redesign of the presets.** Plain and playroom change only through what
  they inherit. Their redesign is separate work.
- **That every pair of signals clears 0.06 under colour vision deficiency.**
  The worst pair among accent, error, success, warning and visited link is
  0.048 in the base modes and 0.028 under `more` (0.009 and 0.005 before this
  change), and `tests/signal-separation.spec.js` keeps it at 0.04 or more
  (0.02 under `more`) in the default theme, not in the presets. The pairs
  that contain the accent sit at 0.071 or more in the base modes. The 0.06
  floor that `tests/framework-specimen.spec.js` enforces covers primary
  against danger only, as before.
- **Accent text at 4.5:1 for any accent.** A pre-existing gap, listed below
  and not closed here.

## Measurements

The default theme on this build. Every value below was read from the build
in a browser; the ledger says how and where.

### Tokens

| Token | Light | Dark |
| --- | --- | --- |
| `--cirth-primary` | `#aa46b4` | `#bc4ec7` |
| `--cirth-primary-text` | `#9a36a4` | `#e071eb` |
| `--cirth-primary-surface` | `#aa46b4` | `#7f3287` |
| `--cirth-primary-surface-active` | `#973da0` | `#782f7f` |
| `--cirth-primary-active` | `#85358d` | `#dc5ce9` |
| `--cirth-canvas` | `#f1f2ee` | `#15180c` |
| `--cirth-surface-recessed` | `#e7e8e4` | `#0d1005` |
| `--cirth-surface-raised` | `#fdfdfb` | `#202417` |
| `--cirth-surface-overlay` | `#fdfdfb` | `#292c20` |
| `--cirth-muted-border-color` | `#d7d8d4` | `#323528` |
| `--cirth-card-border-color` | `#c0c1bd` | `#44483b` |
| `--cirth-form-element-border-color` | `#80817d` | `#828677` |
| `--cirth-ink` | `#393e2e` | `#c6c8c1` |
| `--cirth-ink-strong` | `#1a1d11` | `#f2f2f2` |
| `--cirth-muted-color` | `#5c614e` | `#9ca192` |
| `--cirth-secondary-text` | `#505543` | `#aaaea1` |
| `--cirth-link-visited-color` | `#5e5e5e` | `#919191` |
| `--cirth-error` | `#811b1b` | `#f7b4ac` |
| `--cirth-success` | `#2d8b61` | `#39a876` |
| `--cirth-warning` | `#876422` | `#c69537` |
| `--cirth-error-text` | `#5e1111` | `#ffc8c1` |
| `--cirth-success-text` | `#164f35` | `#4bd798` |
| `--cirth-warning-text` | `#573f12` | `#e7af43` |
| `--cirth-mark-background-color` | `#e6d4e5` | `#392734` |

### Contrast

WCAG 2, on colours as painted in 8-bit sRGB, the worst of canvas, recessed,
raised and overlay unless a row says otherwise. "Hover" is
`--cirth-primary-surface-active`; "pressed" is the same fill under the 12%
black wash `src/content/_button.scss` paints on `:active`.

| Role | Light | Dark | Light · more | Dark · more |
| --- | --- | --- | --- | --- |
| Ink | 8.97 | 8.43 | 13.90 | 12.71 |
| Muted ink | 5.21 | 5.37 | 7.54 | 7.31 |
| Secondary text | 6.27 | 6.29 | 7.54 | 7.31 |
| Visited link | 5.27 | 4.52 | 8.97 | 7.31 |
| Accent text and focus ring | 4.96 | 5.24 | 8.15 | 8.10 |
| Control edge | 3.19 | 3.81 | 7.48 | 6.48 |
| White label on the fill, at rest | 4.95 | 7.75 | 10.04 | 8.21 |
| White label, hover | 6.02 | 8.36 | 11.37 | 9.81 |
| White label, pressed | 7.22 | 9.70 | 12.67 | 11.11 |
| Status text, error / success / warning | 10.91 / 7.74 / 8.03 | 9.68 / 7.78 / 7.19 | as light | as dark |
| Status border, error / success / warning | 8.10 / 3.43 / 4.40 | 8.19 / 4.77 / 5.26 | invalid 9.65, valid 5.01 | invalid 9.47, valid 7.78 |
| Meter readings on the track, optimum / suboptimum / worst | 3.43 / 4.40 / 8.10 | 6.44 / 7.09 / 11.05 | 6.01 / 7.67 / 9.65 | 8.96 / 9.73 / 12.77 |
| Switch thumb on the unchecked track | 3.92 | 3.73 | 9.21 | 3.12 |

### Signals under colour vision deficiency

ΔOklab, normal vision and Machado et al.'s protanopia, deuteranopia and
tritanopia at full severity, the method of `tests/signal-separation.spec.js`.

| | Light | Dark | Light · more | Dark · more |
| --- | --- | --- | --- | --- |
| Worst pair of the five signals | 0.048 (success and warning text, deuteranopia) | 0.054 (error and success text, protanopia) | 0.028 (success text and visited, deuteranopia) | 0.030 (same pair) |
| Worst pair that contains the accent | 0.071 (accent and warning fill, tritanopia) | 0.092 (accent and warning text, tritanopia) | 0.041 | 0.043 |
| Accent against the neutral at the same step, worst vision | 0.121 (step 500, tritanopia) | | | |
| Primary fill against danger fill, normal / protan / deutan | 0.244 / 0.266 / 0.230 | 0.138 / 0.126 / 0.105 | 0.140 / 0.143 / 0.142 | 0.095 / 0.092 / 0.083 |

The dark `more` worst pair is 0.030 where B had 0.028 in both `more` modes:
the visited link under `more` is neutral-250, which carries the neutral hue.

### Conditions the existing tests hold

`tests/framework-specimen.spec.js`, default theme:

| Condition | Light | Dark | Floor |
| --- | --- | --- | --- |
| Primary fill against danger fill, ΔOklab, normal / protan / deutan | 0.244 / 0.266 / 0.230 | 0.138 / 0.126 / 0.105 | 0.06 |
| White label on primary, every simulation | ≥ 4.61 (deuteranopia) | ≥ 7.31 | 4.5 |
| White label on danger, every simulation | ≥ 8.83 | ≥ 7.10 | 4.5 |
| `<mark>` text | 13.33 | 13.87 | 4.5 |
| Range thumb on its track | 5.39 | 5.54 | 3 |

`scripts/check-accent-distance.js`: the accent sits 62° from the error input
in the default theme, plain 128° and playroom 85° from their own error.

## Known defects, not fixed here

Found while modelling the palette. None depends on the choice of palette,
and each is left for its own change.

1. The accent text clamp at 0.52 in light does not hold 4.5:1 for every
   accent, as `src/theme/_light.scss` says. For an accent anchored at the
   500 step and at 70% of its chroma ceiling, the text role falls below
   4.5:1 on the recessed level of this canvas for hues from about 81° to
   256°, down to 4.21:1 at 143°. The shipped accent at 324° reads 4.96:1.
   The dark clamp at 0.72 holds for every hue.
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

"This build" is `dist/` built from this change on `f1caa145`, not yet
committed. Contrast is WCAG 2 on colours painted to an 8-bit sRGB canvas in
the engine, the method of `scripts/lib/measured-theme.js` applied to live
values. Engines: Chromium 149.0.7827.55, Firefox 151.0 and WebKit 26.5, as
installed for Playwright 1.61.

### Verified

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| The light accent is `oklch(57% 0.188 324)`, `#aa46b4`, and a white label on it reads 4.95:1 | `#aa46b4`; 4.95:1 | `dist/cirth.css` of this build, Chromium, Firefox and WebKit | Verified |
| The dark accent is `oklch(61.3% 0.202 324)`, `#bc4ec7`, and a white label on the dark fill reads 7.75:1 | `#bc4ec7`; fill `#7f3287`; 7.75:1 | Same | Verified |
| The accent scale is 70% of the sRGB chroma ceiling at every step | 0.696 to 0.710 of the ceiling, from the literals | Computed from `src/theme/_colors.scss` | Verified |
| The accent sits 62° from the error input | 62.0° in light, dark and both `more` modes; plain 128°, playroom 85° | `npm run check:tooling` (`scripts/check-accent-distance.js`) on this change | Verified |
| Worst signal pair under CVD: 0.048 in the base modes, 0.028 under `more` | 0.048 light, 0.054 dark; 0.028 light `more`, 0.030 dark `more` | Painted tokens of this build, Chromium; `tests/signal-separation.spec.js` passes in the three engines | Verified |
| Pairs that contain the accent: 0.071 | 0.071 light (accent and warning fill, tritanopia), 0.092 dark | Same run | Verified |
| Accent against the neutral at the same lightness: 0.121 | 0.1215 at step 500, the minimum of normal vision and the three simulations (tritanopia); B at its 550 anchor: 0.0799 | Computed from the literals, rounded to 8-bit | Verified |
| Alternatives for F's neutrals: achromatic 0.101, the accent's own hue 0.084 | 0.1007 and 0.0839 at step 500 | Same method | Verified |
| Primary against danger: 0.244 in light, 0.138 in dark | Normal vision; 0.230 and 0.105 at the worst simulation the test checks (deuteranopia) | Painted tokens of this build, Chromium; danger fill computed with the component's `color-mix()` | Verified |
| Meter order: 0.570 > 0.527 > 0.397 in light, 0.657 < 0.700 < 0.830 in dark | The computed OKLCh L of the three readings; also holds under `more` | `tests/meter.spec.js`, three engines | Verified |
| The token values under Measurements | Identical hex in the three engines except six translucent or derived tokens that differ by one 8-bit unit | Painted tokens of this build | Verified |
| The contrast table under Measurements | As listed | Chromium; Firefox and WebKit agree to the 8-bit unit | Verified |
| `npm run check:tokens` holds the export to the engines | 711 colour comparisons within ΔOklab 0.002 | This build | Verified |
| Comments in `src/theme/` and `scripts/` that quote a ratio or a hue | Re-measured on this build and restated; none was copied from the research | This build | Verified |
| Ink closer to the warning text than with cool neutrals | 0.060 ΔOklab in light (B: 0.053; neutrals at 280°: 0.100) | Painted tokens, Chromium | Verified |
| Known defect 1 | Hue range and worst value as listed | Computed from the literals and the derivation, this canvas | Verified |

### Reported: the maintainer's palette research

Not reproduced here. The research compared candidates against the accents
of other systems; this change records its conclusions as reported.

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
| The documentation site, its accessibility audit and its screenshots with the new palette | `check:a11y` green (65 pages, 4 themes, 3 modes); `check:behavior` 1581 passed; `check:visual` reviewed and the macOS baselines regenerated, together with the preset changes | Verified |

## Decisions

| Decision | Basis | Rationale |
| --- | --- | --- |
| Accent at 324° | Design | Within the magenta band that holds the signals, the flat stretch of weighted proximity is 316°–324°; 324° keeps the most distance from Milligram and the developer-tool pinks and separates best from the neutrals (research, Reported) |
| Accent anchors 500 in light and 450 in dark | Design | Maintainer's choice with F. The white label reads 4.95:1 in light and 7.75:1 on the dark fill; the dark anchor is never set as text on its own, since the text role lifts it to L 0.72 |
| Rejected: B, 338° | Design | Emotion 0.041 and Linaria 0.037 away, and 0.0799 from the neutrals, under the 0.08 threshold (Verified: 0.0799) |
| Rejected: G, 330° | Design | Linaria 0.037 away |
| Rejected: 318°–320° | Design | The formal minimum of the criteria, but 0.025–0.032 from Milligram, another CSS framework |
| Rejected: cyan, 226° | Design | 0.075 from the neutrals |
| Rejected: blue, 258° | Design | 0.017 from Fluent 2 |
| Rejected: 44°, the copper | Design | The least crowded hue, but in the warning's band; worst signal pair 0.009 |
| Neutrals at 120° | Design | The hue that separates the accent most: opposite it on both Oklab axes, so the separation survives the loss of either. 0.121 at the anchor, against 0.101 achromatic and 0.084 on the accent's hue, both admissible for F and both lower |
| Canvas at the neutral hue in both schemes | Design | As in B: the accent stays reserved for action and position, and light and dark share one hue |
| Label stays white | Constraint | A dark label fails in the light scheme for every hue under today's rules (research, Reported): hover and pressed darken the fill, and the fill must hold 3:1 on the canvas and the raised level as a checkbox, a switch and a progress bar |
| Status inputs, steps and contrast-pass steps as in B | Constraint | B chose them to maximise the smallest CVD separation among the five signals under two constraints: status text at 7:1, because the contrast pass does not restate it, and the meter's lightness order. F does not move them, and the worst pair is unchanged at 0.048 |
| Rejected, with B: dark error at step 250; error at 14°; restating the status colours in the contrast pass | Design | Worst pair 0.039; error 36° from B's accent; no gain |
| Contrast pass: accent-200 in dark | Constraint | From accent-250 the text role reads 6.86:1 on the overlay, under 7:1 |
| Contrast pass: invalid border and meter error past the base | Constraint | The base error is 700 in light and 200 in dark, so the pass goes beyond it: error-750 and error-150 |
| Derivations, presets and brand untouched | Existing contract | Only inputs change; the presets and the mark are redesigned separately |

## Acceptance

- [x] `npm run lint && npm run build && npm run check:dist` green.
- [x] `npm run check:tooling` green; `check-accent-distance` reports 62° for
      the default theme.
- [x] `npm run check:tokens` green.
- [x] `tests/signal-separation.spec.js` and `tests/meter.spec.js` pass in
      Chromium, Firefox and WebKit.
- [x] `npm run check:a11y` green (with the preset changes of this round).
- [x] `npm run check:behavior` green: 1581 passed, 9 skipped, three engines.
- [x] `npm run check:visual` differences reviewed, then the macOS baselines
      regenerated. The Linux baselines the CI compares against are not
      regenerated here.
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
| Set `--cirth-primary`, `--cirth-canvas` or a status input | Nothing: every role still derives from what you set. The neutrals around your accent are olive now, not cool |
| Chose a status colour to sit apart from the old accent | Check it against the new one, at 324°. Cirth keeps its own error at least 20° from the accent |
| Use the plain preset | Its ink, muted ink, secondary text and status colours come from the default theme and change with it |
| Use the playroom preset | It is removed in the same release; move to `material` or keep its values yourself (`docs/src/pages/upgrading.md`) |

## Open questions

1. **The mark.** It does not have the new hue yet. `docs/src/pages/brand.md`
   now says so instead of claiming a shared hue.
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
