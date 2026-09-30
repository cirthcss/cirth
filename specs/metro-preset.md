# The metro preset

| | |
| --- | --- |
| Issue | None yet: preset round on `design/technical-language-system` |
| Status | Implementing |
| Baseline | `f1caa145` on `design/technical-language-system`, with `specs/default-palette.md` and `specs/material-preset.md` applied |
| Breaking | No: a new export and a new file. Two tests relax "the container radius is larger than the control radius" to allow both at zero |

A third preset, `metro`, recalls Metro, the design language of Windows Phone
7 and 8 and of Windows 8 (2010 to 2012). It is a Windows Phone theme in
Cirth's tokens: an accent (cobalt, from the phone's own palette) on a near
white or near black page with achromatic neutrals, square corners, no
shadows, Segoe in light weights, a flow on the Windows 8 grid unit and the
Windows animation library's curve. Nothing changes for anyone who does not
load it.

## Contract

### Loading

`dist/presets/metro.css` and `.min.css`, exported as
`@cirthcss/cirth/presets/metro`: custom properties only, in `@layer cirth`,
no request, no font, every build.

### What it sets

| Token | Light | Dark | Source |
| --- | --- | --- | --- |
| `--cirth-primary` | `#0050ef` | `oklch(72% 0.14 262.6)` | Windows Phone 8's cobalt; in dark, a light cobalt near the gamut's edge for text and its active states, since cobalt reads 3.39:1 on black |
| `--cirth-canvas` | `oklch(97% 0 0)` | `oklch(14% 0 0)` | a theme's background, white or black, held off the ends so the surface levels have room |
| Ink, muted, secondary text and its active step and underline, field ink, contrast text and surface, selected option | the default's steps at chroma 0, the ink one step stronger | same | achromatic neutrals |
| `--cirth-link-visited-color` | `oklch(50% 0 0)` | `oklch(65.7% 0 0)` | achromatic, as Cirth's visited always is |
| `--cirth-font-family`, `-display` | `"Segoe UI Variable", "Segoe UI", Selawik, "Open Sans", var(--cirth-font-family-sans)` | | Segoe, then Microsoft's open replacement, then a humanist sans a font service carries |
| `--cirth-heading-font-weight` | 350 | | semilight, Windows Phone's title and large text |
| `--cirth-display-font-weight` | 300 | | light, its huge text |
| `--cirth-font-size-3xl` | 2rem | | 32px, its large size; bounds h1 from below and h2 from above |
| `--cirth-display-font-size` | `clamp(3rem, 1.5rem + 5vw, 4.5rem)` | | up to 72px, its first title style |
| `--cirth-border-radius` | `var(--cirth-radius-none)` | | square |
| `--cirth-spacing` | `var(--cirth-space-5)` | | 20px, one Windows 8 grid unit: the flow steps are 10, 20, 40, 60 and 100px |
| `--cirth-box-shadow` | `none` | | flat; the dialog, popover and dropdown shadows follow it |
| `--cirth-modal-overlay-backdrop-filter` | `none` | | |
| `--cirth-transition` | `167ms cubic-bezier(0.1, 0.9, 0.2, 1)` | | the Windows animation library's press |

On every theme root and `[data-theme]` element (`selectors.scheme-roots`,
`specs/material-preset.md`): the fill is cobalt `#0050ef` in both schemes,
as the phone filled it, with the light scheme's hover (cobalt mixed 91.7%
toward black) in both; the dialog's backdrop dims to black at the default
opacities.

Under `prefers-contrast: more`: cobalt deepens to `oklch(40% 0.2 262.6)` as
text and fill in light; in dark the text lightens to `oklch(84% 0.08 262.6)`
while the fill stays at the deep cobalt, and its hover at
`oklch(34% 0.17 262.6)`; muted and secondary ink, the visited link and the
dark switch track are restated achromatic, since the theme's own pass would
hand back olive ones.

### What it leaves to the default

Status colours (Metro had none of its own), control padding and heights,
the stroke width (Windows Phone drew 3px borders; one hairline on every
edge is Cirth's structural signature), the title weight (semibold, as
Windows Phone set accent and contrast text), and the switch, radio and range
thumb shapes.

### What this does not promise

- **Segoe UI.** It ships with Windows and cannot be redistributed. Where it
  is missing, Selawik shows if the page loads it, then Open Sans, then the
  system face.
- **Tiles, panoramas, pivots, the application bar.** Components and layouts,
  not tokens.
- **Lateral motion.** Metro's page transitions slid and turned content;
  a preset can time a transition but not move anything.
- **Metro's white label on every accent.** Cyan and teal carried white text
  on the phone at under 3:1; Cirth's label has to clear 4.5:1, which is one
  reason the accent is cobalt.

## Evidence ledger

"This build" is `dist/` built from this change on `f1caa145` with the
palette and material changes applied, not yet committed. Engines: Chromium
149.0.7827.55, Firefox 151.0 and WebKit 26.5.

### Verified: sources

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| Metro's type echoes airport and metro signage | "The Metro design principles center on a look that uses type to echo the visual language of airport and metro system signage", from the guide's introduction | Windows Phone Developer Blog, "Windows Phone 7 Series UI Design & Interaction Guide", 2010-03-18, blogs.windows.com, rendered in Chromium 149 | Verified |
| Street and airport signage, reduced clutter, negative space, type showcasing content | "Metro's design is based on street and airport signage … Clutter is reduced, and ample negative space is provided so that the typography showcases the content." Jeff E. Smith (Infragistics) | MSDN Magazine, December 2011, "Windows Phone: How To Translate Common Design Principles To The Windows Phone", learn.microsoft.com archive | Verified |
| Segoe WP, Light, Semilight and Semibold; titles and large text in Semilight, accent and contrast text in Semibold, huge text in Light; sizes 18.667 to 186.667, large 32, extra-extra-large 72 | Font names, font sizes and text styles tables | "Theme resources for Windows Phone", ff769552(v=vs.105), learn.microsoft.com archive | Verified |
| Brushes: accent, foreground, background, contrast background and foreground, subtle, chrome, disabled | Brush resources table | Same page | Verified |
| A theme is a background and an accent; an app may override them for its brand | "A Windows Phone theme is a combination of a background color and an accent color"; "You can provide your own resources and override any themed properties" | "Themes for Windows Phone", ff402557(v=vs.105) | Verified |
| The Windows Phone 8 accent palette | 20 accents with RGB and hex, read from the page's table image: lime `#A4C400`, green `#60A917`, emerald `#008A00`, teal `#00ABA9`, cyan `#1BA1E2`, cobalt `#0050EF`, indigo `#6A00FF`, violet `#AA00FF`, pink `#F472D0`, magenta `#D80073`, crimson `#A20025`, red `#E51400`, orange `#FA6800`, amber `#F0A30A`, yellow `#E3C800`, brown `#825A2C`, olive `#6D8764`, steel `#647687`, mauve `#76608A`, sienna `#A0522D` | Same page, `hh202878.themes_concept_accentcolors(en-us,vs.105).png` | Verified |
| The two backgrounds are black and white, with black and a blue accent the default | "兩種背景顏色：黑色、白色" and ten Windows Phone 7 accents; "預設的主題背景為黑色背景並搭配藍色的外觀" | "UI Design and Interaction Guide for Windows Phone 7" v2.0, Traditional Chinese edition, download.microsoft.com (198 pages), text extracted with pdftotext | Verified |
| Metro's first principle: clean, light, open, fast, with a lot of white space | "簡潔、輕巧、自由、迅速：極高的視覺獨特性，含有大量簡潔的空白空間" | Same PDF | Verified |
| Segoe WP may not be redistributed in an app | "請勿在應用程式中重新發佈或包裝Segoe WP字體，這將違反字體的使用條款" | Same PDF | Verified |
| Windows 8's grid: 20px units, 5px sub-units; wide margins on top, bottom and left; 20px between items in a list, 80px between groups; the page header in Segoe UI Light | "One unit equals 20 × 20 pixels. Each unit is further divided into sub-units of 5 × 5 pixels"; padding tables | "Laying out an app page", hh872191(v=win.10), learn.microsoft.com archive | Verified |
| The Windows animation library's curve and its press timing | `cubic-bezier(0.1, 0.9, 0.2, 1)` in 52 of the library's animations; `pointerDown` at 167ms on it | WinJS, `src/js/WinJS/Animations.js`, github.com/winjs/winjs (Microsoft, MIT), fetched 2026-09-30 | Verified |
| Segoe UI ships only with Microsoft products | "Download: N/A – Exclusively included with Microsoft products and services where applicable"; web licensing through Monotype | learn.microsoft.com/typography/font-list/segoe-ui | Verified |
| Selawik is Microsoft's open replacement for Segoe UI, under the OFL | "Selawik is an open source replacement for Segoe UI"; licence `OFL-1.1`; release 1.01 carries Light, Semilight, Regular, Semibold and Bold as TTF, WOFF and WOFF2 | github.com/microsoft/Selawik, its API and its release archive | Verified |
| Bunny Fonts carries Open Sans and Roboto and not Selawik | The CSS API answers with `@font-face` rules for `open-sans` and `roboto`, and with "API Error" for `selawik` | fonts.bunny.net, 2026-09-30 | Verified |

### Verified: this build

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| Cobalt keeps a white label; cyan does not | White on `#0050ef` 6.19:1; on `#1ba1e2` 2.90:1 | Computed on the hex values | Verified |
| The label holds at rest, hover and pressed | 6.19 / 7.47 / 8.85 in both schemes; `more` 9.71 / 12.34 / 13.61 in both. Before the hovers were pinned, dark derived a greyed blue from its input (`#4967a2`, and `#32466d` under `more`) | This build, Chromium | Verified |
| Text roles | Ink 14.45 / 15.22; muted 5.44 / 6.36; secondary 6.55 / 7.51; visited 5.04 / 5.41; accent text 5.19 / 6.82; control edge 3.18 / 3.49; status text ≥ 7.99; under `more` every text ≥ 7.79 | This build, Chromium | Verified |
| The checked fill against the dark page | 2.75:1 (the default theme: 1.84:1); the white mark carries the state, as in the default | This build, Chromium | Verified |
| Meter order holds | Same as the default: the preset sets no status input | `tests/meter.spec.js` | Verified |
| Signals under CVD meet the default theme's floors | Worst pair 0.048 light, 0.054 dark, 0.037 and 0.042 under `more`; with the visited link at L 0.40 the light worst was 0.028 (success text and visited, deuteranopia) | This build, Chromium, the method of `tests/signal-separation.spec.js` | Verified |
| Accent 123° from the error | 123.4° in every mode | `scripts/check-accent-distance.js`, which now reads a single accent on the theme roots as both schemes | Verified |
| Cobalt is 0.079 ΔOklab from plain's light accent | `#0050ef` against `#1c65c8` | Computed | Verified |
| The preset is 695 bytes gzipped | `npm run check:size` | This build | Verified |

### Reported

| Claim | Source | Verdict |
| --- | --- | --- |
| The Windows 8 UX guidelines for Windows Store apps (the 2012 PDF) | A 2012 MSDN blog post links it; the document was not retrieved, and nothing here rests on it beyond what the archived Windows 8 pages above already say | Reported |
| The English edition of the Windows Phone 7 guide | Its original download.microsoft.com path answers 404; the Traditional Chinese edition from the same host was used | Reported |
| "Segoe UI Variable" matches Windows 11's variable Segoe in a browser stack | Named in the brief; not testable on the machine this ran on (macOS). If it does not match, `"Segoe UI"` follows | Reported |
| trends.daisyui.com's summary of Metro | Read as a summary only | Reported |

### Invalid

| Claim | What happened | Verdict |
| --- | --- | --- |
| The Windows Phone 8 palette includes taupe `#87794E` | The official table lists sienna `#A0522D` as its twentieth accent and no taupe | Invalid |
| Cobalt can be the dark input | `check:a11y` failed the metro states specimen in dark: an accordion summary's active text, derived from the input (`l × 1.124`), stayed under 4.5:1 on black | `npm run check:a11y`, first run with metro | Invalid |
| The customization example's link failed target size because of metro | It failed only under metro because this machine has Open Sans installed, whose taller line box put the link 11.5px from the button above it; the default face left exactly 12.0px, the threshold. The example set its buttons as bare inline children of a `div`, so the paragraph after them took no flow space; they now sit in a paragraph, and the link is 28px clear | `npm run check:a11y`; `docs/src/content/demos/customization.html` | Invalid |

## Decisions

| Decision | Basis | Rationale |
| --- | --- | --- |
| Cobalt | Design | Authentic, and the blue of the palette that keeps a white label (6.19:1). 123° from the error and 61° from the default accent |
| Rejected: cyan `#1BA1E2`, Windows Phone 7's default | Constraint | White on it reads 2.90:1; Metro set it anyway, Cirth cannot |
| Considered, not taken: indigo `#6A00FF` | Design | Of the accents that keep a white label, the furthest from all three other themes (0.167 from plain, 0.165 from material, 0.194 from the default), but less Metro than cobalt. See Open questions |
| One fill for both schemes; a light cobalt as the dark input | Design, constraint | On the phone the accent did not change with the background, so the fill does not. The input cannot stay cobalt in dark: text lifts to L 0.72 through the text role, but the active states derive from the input itself, and from cobalt they stayed under 4.5:1 on black (ledger, Invalid) |
| Near white and near black, not white and black | Constraint | The raised level needs room above the canvas in light (plain.scss), the recessed one below it in dark |
| Achromatic neutrals, ink one step stronger | Design | Metro's foreground was black or white on its page; the default's olive would be the one colour in the page that is not the accent |
| Radius none; switch, radio and range thumb keep their shapes | Existing contract | A shape is the control's meaning (`specs/radius-relations.md`); the derived radii all reach zero with the knob |
| The radius tests accept zero and zero | Existing contract | `theme/_styles.scss` derives every radius so that zeroing the knob zeroes cards too; "container is 1.5 times the control" still holds |
| No shadows, no blur, a black backdrop | Design | Metro is flat; a floating surface keeps its level and its edge |
| Headings 350, display 300, titles 600 | Design | Windows Phone's title styles are semilight, its huge text light, its accent and contrast text semibold. Windows 8 kept Segoe UI Light for its page header |
| 32px for the 3xl step | Design | Larger headings within the scale: Windows Phone's large size, the only lever the scale gives |
| Flow at 20px | Design | One Windows 8 grid unit; the flow steps land on its units |
| 167ms on the library's curve | Design | Windows' own press timing and curve; brisk and decisive without a new token |
| Visited at L 0.50 in light | Constraint | A darker grey met the success text under deuteranopia |

## Acceptance

- [x] `src/presets/metro.scss`; export, size budget, consumer smoke test.
- [x] Specimen pages `docs/src/pages/specimen/metro.njk` and
      `states/metro.njk`; the visual, a11y and specimen lists pick it up
      through `listPresetNames()`.
- [x] `npm run check:tooling` (`check-accent-distance`), `check:size`,
      `check:package`, `check:consumer`.
- [x] `npm run check:behavior`, `check:a11y` and `check:visual` with the
      preset in place; macOS baselines regenerated, Linux ones still to
      regenerate.

## Open questions

1. **Cobalt beside plain.** 0.079 ΔOklab apart: distinguishable, but both
   are blue. Indigo would keep every preset in a hue of its own; the
   maintainer's call.
2. **The switch.** Cirth keeps the pill as a shape rule. Whether Metro's
   own toggle was square is not verified here; if it was, a square switch
   would need a token of its own.
3. **Stroke width.** Windows Phone's controls had 3px borders; Cirth's
   single hairline is held across every preset by a test.
