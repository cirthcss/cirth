# The material preset

| | |
| --- | --- |
| Issue | None yet: preset round on `design/technical-language-system` |
| Status | Implementing |
| Baseline | `f1caa145` on `design/technical-language-system`, with `specs/default-palette.md` applied |
| Breaking | 💥 Yes: `./presets/playroom` and `dist/presets/playroom*.css` are removed, with no alias |
| Depends on | `specs/fill-labels.md` (the danger button's own label) |
| Decisions | 2026-09-29, maintainer: playroom becomes material, removed without an alias because the only known users load plain |

`playroom` is replaced by `material`, a preset that makes Cirth look like
Material Design 3 as far as Cirth's token model can carry it: M3's baseline
colour scheme in light and dark, its high-contrast scheme under
`prefers-contrast: more`, a Roboto stack, its small and medium corners, its
state layer, focus ring, elevation, scrim and standard easing. It keeps the
teaching role playroom had in the documentation: plain is the preset that
changes five declarations, material the one that overrides broadly, derived
tokens included. Anyone loading `playroom` gets a missing file and has to
move to `material` or keep playroom's values themselves.

## Contract

### Loading

`dist/presets/material.css` and `.min.css`, exported as
`@cirthcss/cirth/presets/material`. Like plain, it contains only custom
properties in `@layer cirth`, makes no request, loads no font, and works with
every build, scoped ones included. `./presets/playroom` is gone from
`package.json` and from `dist/`.

### What it sets

Every colour is one of M3's own values, transcribed from its token export
(`@material/web` 2.5.0, design system version 34.0.21) in M3's hex
notation.

| Cirth token | Light | Dark | M3 role |
| --- | --- | --- | --- |
| `--cirth-primary` | `#6750a4` | `#d0bcff` | primary |
| `--cirth-canvas` | `#fef7ff` | `#141218` | surface |
| `--cirth-ink`, `--cirth-ink-strong`, `--cirth-form-element-color`, `--cirth-contrast-text` | `#1d1b20` | `#e6e0e9` | on-surface |
| `--cirth-muted-color` | `#49454f` | `#cac4d0` | on-surface-variant |
| `--cirth-secondary-text` (and its underline at 50%) | `#625b71` | `#ccc2dc` | secondary |
| `--cirth-secondary-active` | `#4a4458` | `#e8def8` | on-secondary-container |
| `--cirth-form-element-selected-background-color` | `#e8def8` | `#4a4458` | secondary-container |
| `--cirth-contrast-surface` | `#322f35` | `#e6e0e9` | inverse-surface |
| `--cirth-error` | `#8c1d18` | `#f2b8b5` | error (light: the medium-contrast scheme's) |
| `--cirth-link-visited-color` | `#545454` | `#919191` | none: M3 has no visited role |

Derived roles, set on the theme roots and on every `[data-theme]` element
(`selectors.scheme-roots`, below):

| Cirth token | Value | M3 |
| --- | --- | --- |
| `--cirth-primary-surface` | `var(--cirth-primary)` | a filled button's container is primary in both schemes |
| `--cirth-primary-on-surface` | `#fff` / `#381e72` | on-primary |
| `--cirth-primary-surface-active` | `color-mix(in srgb, on-surface 8%, surface)` | the hover state layer: on-primary at 8% over primary |
| `--cirth-primary-focus` | `var(--cirth-secondary-text)` | the focus ring is secondary |
| `--cirth-form-element-border-color` | `#79747e` / `#938f99` | outline |
| `--cirth-muted-border-color` | `#cac4d0` / `#49454f` | outline-variant |
| `--cirth-modal-overlay-background-color` | black at 32% | the scrim |

Everything else:

| Cirth token | Value | M3 |
| --- | --- | --- |
| `--cirth-font-family`, `-display` | `Roboto, "Roboto Flex", var(--cirth-font-family-sans)` | brand and plain typeface: Roboto |
| `--cirth-heading-font-weight` | 400 | headline and display: regular |
| `--cirth-title-font-weight` | 500 | title medium and small: medium |
| `--cirth-display-font-size` | `clamp(2.25rem, 1.5rem + 3vw, 3.5625rem)` | display-small (36px) to display-large (57px) |
| `--cirth-border-radius` | `var(--cirth-radius-lg)`, 8px; containers derive 12px | small corner for controls, medium for cards |
| `--cirth-outline-width`, `-offset` | 3px, 2px | focus indicator thickness and outer offset |
| `--cirth-box-shadow` | level 2 | menus |
| `--cirth-modal-box-shadow` | level 3 | dialogs |
| `--cirth-modal-overlay-backdrop-filter` | `none` | a scrim, not a blur |
| `--cirth-transition` | 200ms, `cubic-bezier(0.2, 0, 0, 1)` | standard easing; 200ms is what M3 gives selection controls |

The surface levels, the container edge, the mark and the text selection are
not set: they derive from the canvas, the two edges and the primary, and
land on or near M3's own tones (ledger).

### Increased contrast

M3 publishes a high-contrast scheme, and under `prefers-contrast: more` the
preset uses it: primary `#381e72` / `#f6edff`, on-primary `#fff` / `#000`,
on-surface `#000` / `#fff`, secondary `#332d41` / `#f6edff`, outline
`#322f37` / `#f5eefa`, outline-variant `#49454f` / `#cac4d0`, error
`#601410` in light. The dark error keeps its base value: the danger fill is a
deeper mix of it, and M3's paler high-contrast error (`#fceeee`) would leave
the white label under 7:1. The visited link, the invalid border and the
switch track are restated so that the theme's own pass, which pins them to
the default palette, does not hand back olive values.

### Forced-scheme subtrees

A preset declares on the theme roots, and the build re-derives its derived
tokens on every `[data-theme]` element. A preset value for a derived token
therefore stopped at the edge of a forced-scheme subtree, and there the
build's formula applied to material's light `#d0bcff`: a white label on a
`#8d7fae` fill, 3.63:1. `selectors.scheme-roots`
(`src/helpers/_selectors.scss`) adds `:where([data-theme])` and
`.cirth [data-theme]` to the roots, for the derived tokens only. Each
weighs just enough to beat the build it follows: the unscoped build
re-derives at zero specificity, the scoped one at (0,1,0) inside `.cirth`.
A separate Cirth instance with its own wrapper, a scoped build under
another prefix or the isolated examples of this site, declares these
tokens on that wrapper at (0,1,0) and keeps its own. The inputs stay on
the roots: restated on a `[data-theme]` element, an input would stop a
consumer's `:root` override at that edge, which is the reach gh#92 fixed.

### What it leaves to the default

Success and warning (M3 defines neither), spacing and density, control
heights (the 44px floor), the heading sizes (set per element, not by a
token), the optical tracking, the card and button shadows (none), and the
icons a data URI bakes from the default neutrals.

### What this does not promise

- **Pill buttons, 4px fields and 28px dialogs.** Cirth has one control
  radius and one container radius, derived from it, and no box is rounder
  than a container (`specs/radius-relations.md`). See Decisions.
- **Springs.** M3 Expressive replaced easing and duration with a spring
  physics system; a CSS transition cannot express one. The preset uses the
  easing-and-duration system M3 still documents for transitions.
- **Tonal elevation overlays and dynamic colour.** The baseline scheme is
  fixed; no colour is computed from a source colour.
- **Roboto.** The preset names it; the page, or the platform, supplies it.
- **Material's component anatomy.** State layers on hover only, through the
  fill; no ripple, no floating label, no filled text field.

## Evidence ledger

"This build" is `dist/` built from this change on `f1caa145` with the palette
change applied, not yet committed. Engines: Chromium 149.0.7827.55, Firefox
151.0 and WebKit 26.5. Contrast is WCAG 2 on colours painted to an 8-bit
canvas in the engine, the worst of the four surface levels.

### Verified

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| M3's baseline scheme: primary `#6750A4` / `#D0BCFF`, on-primary `#FFFFFF` / `#381E72`, primary-container `#EADDFF` / `#4F378B`, surface `#FEF7FF` / `#141218`, on-surface `#1D1B20` / `#E6E0E9`, on-surface-variant `#49454F`, outline `#79747E` / `#938F99`, error `#B3261E` / `#F2B8B5`, on-error `#FFFFFF` / `#601410` | Resolved through `_md-ref-palette.scss` | `@material/web` 2.5.0, `tokens/versions/latest/sass/_md-sys-color.scss` and `_md-sys-color__dark.scss`, packed from npm on 2026-09-30 | Verified |
| The high-contrast and medium-contrast schemes used here | Light high contrast: primary `#381E72`, on-surface `#000`, secondary `#332D41`, outline `#322F37`, outline-variant `#49454F`, error `#601410`; dark: primary `#F6EDFF`, on-primary `#000`, on-surface `#FFF`, secondary `#F6EDFF`, outline `#F5EEFA`, outline-variant `#CAC4D0`; light medium contrast error `#8C1D18` | Same package, `_md-sys-color__high-contrast.scss`, `__dark__high-contrast.scss`, `__medium-contrast.scss` | Verified |
| Shape scale: 0, 4, 8, 12, 16, 20, 28, 32, 48dp and full | Same values in the package (`_md-sys-shape.scss`) and on the rendered page | `@material/web` 2.5.0; m3.material.io/styles/shape/corner-radius-scale, rendered in Chromium 149 on 2026-09-30 | Verified |
| M3 allows a button to be remapped from full to a smaller corner | "by default, buttons are mapped to the full corner radius shape style. If your product needs a less rounded shape, remap the token to another style in the shape scale, such as small or medium" | m3.material.io/styles/shape/corner-radius-scale, same render | Verified |
| Component shapes: button full, or square at 12dp (extra small and small), pressed 8dp; card 12dp; dialog 28dp; outlined text field 4dp; menu 4dp | Rendered specs pages; component tokens in the package (`v0_192/_md-comp-*.scss`) | m3.material.io/components/{buttons,cards,dialogs,text-fields}/specs; `@material/web` 2.5.0 | Verified |
| State layers: hover 0.08, focus 0.10, pressed 0.10, dragged 0.16; disabled 0.38 | `_md-sys-state.scss`; the page lists hover +8%, focus +10%, press +10%, drag +16% and says the layer "uses the same color as the content" | `@material/web` 2.5.0; m3.material.io/foundations/interaction/states/state-layers | Verified |
| Focus ring: 3px, 2px outward offset, secondary colour | `_md-sys-state-focus-indicator.scss` (thickness 3px, outer offset 2px); `_md-comp-focus-ring.scss` (`color: secondary`) | `@material/web` 2.5.0 | Verified |
| Typography: Roboto for brand and plain; body-large 1rem/1.5rem, tracking 0.03125rem; label-large 0.875rem/1.25rem, 500; title-large 1.375rem/1.75rem; headline-large 2rem/2.5rem; display-large 3.5625rem/4rem, headlines and display at 400 | `_md-ref-typeface.scss`, `_md-sys-typescale.scss`; the Compose documentation lists the same scale ("displayLarge Roboto 57/64" … "labelLarge Roboto Medium 14/20") | `@material/web` 2.5.0; developer.android.com/develop/ui/compose/designsystems/material3 | Verified |
| Motion: standard easing `cubic-bezier(0.2, 0, 0, 1)`; short 50–200ms, medium 250–400ms, long 450–600ms; "Selection controls have a short duration of 200ms with Standard easing" | `v0_192/_md-sys-motion.scss`; the rendered tokens page | `@material/web` 2.5.0; m3.material.io/styles/motion/easing-and-duration/tokens-specs | Verified |
| Expressive replaces easing and duration with springs, and springs have no CSS value | "The physics system is replacing the previous system based on easing and duration" (May 2025); the package's own export writes `null` for every spring composite ("Type custom_composite is not supported") | m3.material.io/styles/motion/overview/how-it-works; `tokens/versions/latest/sass/_md-sys-motion.scss` | Verified |
| Elevation levels 0, 1, 3, 6, 8, 12 (dp, as px on the web); level 2 is `0 1px 2px` at 30% plus `0 2px 6px 2px` at 15%, level 3 `0 1px 3px` plus `0 4px 8px 3px` | `_md-sys-elevation.scss`; `elevation/internal/_elevation.scss` | `@material/web` 2.5.0 | Verified |
| M3 separates surfaces by tone first; menus sit at level 2, dialogs at 3, outlined and filled cards at 0; scrims are the scrim role at 32% | "By default, Material 3's surfaces use tonal difference to indicate separation"; "Scrims use the scrim color role at an opacity of 32%"; component tokens | m3.material.io/styles/elevation/applying-elevation; `@material/web` 2.5.0 | Verified |
| The derived surfaces land on M3's container tones | ΔOklab to M3: light recessed `#f4edf5` / surface-container 0.003, raised `#fffdff` / lowest 0.005; dark recessed 0.014 / lowest, raised `#1f1d24` / low 0.010, overlay `#28262c` / high 0.013 | This build, Chromium | Verified |
| The hover fill is M3's state layer exactly | `#735eab` in light, `#c4aff4` in dark: the same 8-bit values as compositing on-primary at 8% over primary | This build, Chromium | Verified |
| The label holds 4.5:1 at rest, hover and pressed, both schemes; 7:1 under `more` | Light 6.44 / 5.36 / 6.50; dark 7.71 / 6.75 / 5.23; light `more` 13.15 / 10.53 / 11.88; dark `more` 18.48 / 15.46 / 11.87. Pressed is the hover fill under the 12% black wash of `content/_button.scss` | This build, three engines within 0.12 | Verified |
| The same label marks the checkbox, the switch thumb and the selected segment | Thumb on the unchecked track 4.55 light, 4.15 dark, 13.15 and 18.49 under `more`; on the checked track as the label | This build, Chromium | Verified |
| The danger label stays white and readable | 9.11:1 light, 7.28:1 dark; at least 7.07 in the simulations `tests/framework-specimen.spec.js` checks | This build, `--cirth-danger-on-surface` | Verified |
| Text roles | Ink 14.86 / 11.54; muted 8.13 / 8.77; secondary 5.62 / 8.77; accent text 5.61 / 8.78; visited 6.59 / 4.75; control edge 3.96 / 4.72; every status text ≥ 7.56; under `more`, every text ≥ 7.56 and the control edge 11.44 / 13.17 | This build, three engines | Verified |
| Meter order holds | L 0.571 > 0.527 > 0.420 in light, 0.656 < 0.700 < 0.834 in dark, and under `more` | This build; `tests/meter.spec.js`, three engines | Verified |
| Signals under CVD meet the default theme's floors | Worst pair 0.043 light, 0.065 dark, 0.026 and 0.033 under `more` (floors 0.04 and 0.02); primary against danger ≥ 0.205 | This build, Chromium, the method of `tests/signal-separation.spec.js` | Verified |
| With M3's baseline error in light the signals did not | `#b3261e`: error and warning marks 0.018 apart under deuteranopia, meter readings at L 0.527 and 0.501 | Same method, on the preset with the baseline error | Verified |
| Accent 94°, 84° and 97° from the error; dark `more` not judged | `#f6edff` has chroma under 0.04 | `npm run check:tooling`, `check-accent-distance` reading hex literals | Verified |
| Forced-scheme subtrees follow the preset | Nested `data-theme="dark"` in a light page: `#381e72` on `#d0bcff`, 7.71:1; without the `[data-theme]` branches, white on `#8d7fae`, 3.63:1. Same result in the scoped build, inside `.cirth` | This build, Chromium | Verified |
| An isolated Cirth instance keeps its own theme | The site's classless examples (`.cirth-classless[data-theme]`, their own accent): white on their own fill, `oklch(0.461 0.152 324)`, exactly as without the preset | This build, the Installation page, Chromium | Verified |
| The preset is 822 bytes gzipped | `npm run check:size` | This build | Verified |
| Roboto is the default face on Android and ChromeOS | "It is the default font used in Android and Chrome OS, and is the recommended font for … Material Design" (Roozbeh Pournader, 2015-05-26) | Google Open Source Blog, "Roboto: Google's signature font is now open source". Not checked on a device | Verified |

### Reported

| Claim | Source | Verdict |
| --- | --- | --- |
| The only known users of the presets load plain | Maintainer, 2026-09-29 | Reported |
| trends.daisyui.com's summary of Material Design | Read as a summary only; nothing here rests on it | Reported |

### Invalid

| Claim | What happened | Verdict |
| --- | --- | --- |
| The scoped build ignores the preset in nested subtrees | The first harness put the probes outside any `.cirth` wrapper, so no scheme applied at all and every mode read light. Inside a wrapper the scoped build follows the preset as the unscoped one does | Invalid |
| Chromium failures in the first `check:behavior` run (seven `docs-stack` tests, three `framework-specimen` tests) | Timeouts while the machine was loaded, including a `blue` specimen this change does not touch; all pass on a rerun of the same files | Invalid |
| A bare `[data-theme]` in `scheme-roots` is safe | `check:a11y` found the dark label `#381e72` on the default accent inside an isolated example on the Installation page: `[data-theme]` at (0,1,0) reached a separate Cirth instance and overrode its own derived tokens. Replaced by the two weighted branches above | `npm run check:a11y`, this build | Invalid |

## Decisions

| Decision | Basis | Rationale |
| --- | --- | --- |
| Control radius 8px, container 12px | Design, existing contract | Cirth has one control radius and derives containers at 1.5 times it (`specs/radius-relations.md`). 8px is M3's small corner, the one M3 names for a button that should not be a pill, and it lands the container on M3's medium, the card's 12px. Buttons and dialogs move towards M3 (full, 28px); fields move away (4px) |
| Rejected: 12px controls, 18px containers | Design | Matches Expressive's square small button exactly, but no container lands on an M3 step and fields move further from 4px |
| Rejected: 4px controls, 6px containers | Design | Fields exact, but buttons, cards and dialogs all at a third of M3 or less |
| Rejected: pill buttons through a new button-radius token | Existing contract | "No box is rounder than the container radius" would no longer hold, and the radius test enforces it for every preset |
| Filled button in dark: light fill, dark label | Design | M3's own filled button. It needed the danger button's label to be its own role (`specs/fill-labels.md`), since the danger fill stays deep in dark |
| Rejected: primary-container with a light label in dark | Design | An M3 pair (the FAB's), and it needs no new token, but it is not what a filled button looks like in M3 |
| Derived roles restated on `[data-theme]` | Constraint | Without it a forced-scheme subtree falls back to the build's formula, 3.63:1 on the label |
| Hover as `color-mix(in srgb, …)` of the label over the fill | Design | Compositing a layer is a mix in sRGB, so the result is M3's state layer to the 8-bit value, and it follows `--cirth-primary` and the label if a consumer changes them |
| Light error from M3's medium-contrast scheme | Constraint | With the baseline error the meter's readings and the error and warning marks were too close (0.018 under deuteranopia); `#8c1d18` is still an M3 value and brings the preset to the default theme's floors |
| Visited: achromatic, darker than the accent in light | Constraint | M3 has no visited role. At the default lightness the violet accent and the grey merged under tritanopia (0.031); `#545454` keeps every signal text at least 0.054 away and 6.59:1 on the page |
| Success and warning inherited | Constraint | M3 defines neither; the default ones hold the meter order and the 7:1 status text under `more` |
| No card shadow, no button hover shadow | Design | Outlined and filled cards are at level 0 in M3. The button hover shadow reaches every variant, outline and ghost included, where M3 elevates only filled and tonal buttons |
| Removal without alias | Maintainer | Recorded in the header; the migration is a table in `docs/src/pages/upgrading.md` |
| Tests enumerate presets through `listPresetNames()` | Existing contract | `scripts/lib/presets.js` already says so; the visual, a11y, specimen and consistency lists named playroom by hand |

## Acceptance

- [x] `src/presets/material.scss`; `src/presets/playroom.scss` removed; the
      export in `package.json`, the budget in `scripts/check-css-size.js`,
      the entry in `scripts/smoke-consumer.js`.
- [x] `npm run lint`, `build`, `check:dist`, `check:tooling`, `check:size`,
      `check:package`, `check:consumer`, `check:tokens` green.
- [x] `tests/meter.spec.js`, `tests/link-visited.spec.js`,
      `tests/framework-specimen.spec.js` and `tests/docs-stack.spec.js` pass
      in the three engines after the fixes listed in the ledger.
- [x] Specimen pages `docs/src/pages/specimen/material.njk` and
      `states/material.njk`.
- [x] Migration in `docs/src/pages/upgrading.md`.
- [x] `npm run check:a11y` green in every page, every preset.
- [x] `npm run check:visual` differences reviewed; macOS baselines
      regenerated, playroom's removed. Linux baselines still to regenerate.

## Migration

| If you | Then |
| --- | --- |
| Load `dist/presets/playroom.min.css` or import `@cirthcss/cirth/presets/playroom` | Load `material` instead, or copy the playroom values you want into your own stylesheet |
| Relied on playroom's rounded face, 20px flow, 300ms ease-in-out or its lightening hover | `material` has none of them; set `--cirth-font-family`, `--cirth-spacing` and `--cirth-transition` yourself |
| Use `plain` | Nothing changes |

## Open questions

1. **Icons.** The select, date, time and search icons are data URIs baked
   from the default neutrals, so under material they are an olive grey.
   Re-baking four icons per scheme and per contrast mode would roughly
   double the preset.
2. **Heading sizes.** M3's headline sizes (32, 28, 24px) differ from Cirth's
   fluid ladder, which is set per element rather than by a token.
3. **Plain in forced-scheme subtrees.** Plain overrides only inputs and
   role choices, so it does not need `scheme-roots`; a future preset that
   overrides derived tokens should use it.
