# Surface depth

| | |
| --- | --- |
| Issue | None yet: technical-language foundations, `design/technical-language-system` |
| Status | Implementing |
| Baseline | `f7fc5d2a` on `design/technical-language-system` (palette F, [default-palette](default-palette.md), applied) |
| Breaking | Yes: custom property defaults redefined; no token renamed, removed or added |
| Supersedes | The tuning column of [surface-and-edge-model](surface-and-edge-model.md). Its grammar (four levels, three edges, one input) stands |
| Decisions | 2026-09-30, maintainer: the light canvas reads too dark, the dark canvas too light, and the levels too close; the ratios recorded in surface-and-edge-model are not evidence that the page works |

The light page moves toward white and the dark page toward black, and the
levels above and below each canvas are rebuilt around the new ends. In
light the canvas rises from L 0.959 to 0.978, a card becomes an almost
white sheet with a faint contact shadow, the recessed level drops further
below the canvas, and floating panels cast a stronger shadow than before.
In dark the canvas falls from L 0.202 to 0.165, and the raised and overlay
levels climb further above it, so a card and a menu read as lifted rather
than as a slightly different grey. Hues do not move. Anyone on the default
theme, on plain, or reading a surface, edge or shadow default sees new
values; anyone who sets `--cirth-canvas` gets the new relations applied to
their own canvas.

## The problem

Measured on the surface matrix (`/specimen/surfaces/<variant>/`, added
with this spec), `dist/cirth.css` and the presets at `f7fc5d2a`, Chromium
149.0.7827.55, 1440 and 390px. Captures and JSON:
`~/crithcss/cirth-captures/surface-depth/before/`.

- **The light page is grey.** The canvas `#f1f2ee` (L 0.959) sits closer
  to a mid-light grey than to paper, and every surface derived from it
  inherits the cast. The raised level (`#fdfdfb`) is the brightest thing
  on the page and still reads as the same grey, a shade lighter.
- **The dark page is a lit room.** The canvas `#15180c` (L 0.202) is dark
  olive rather than black, so the raised level (+0.050) and the overlay
  (+0.084) have little room to read as lifted, and a dense page is a mass
  of similar greys.
- **The levels are told apart by their borders.** With every border and
  shadow removed, in greyscale, the light raised level and the overlay are
  the same colour, the band (+0.018) nearly vanishes, and in dark the card
  and the band differ by 0.024 L.

## Grammar and tuning

| Rule (grammar, unchanged) | Value (tuning, this spec) |
| --- | --- |
| Four surface levels, ordered recessed < canvas < raised ≤ overlay in light and recessed < canvas < raised < overlay in dark | Light: −0.04 L; raised 90% of the way to white at a quarter of the canvas chroma. Dark: −0.04, +0.06, +0.11 L |
| Every level derives from `--cirth-canvas` at runtime | Light canvas `oklch(97.8% 0.003 120deg)`, was 96% at chroma 0.006. Dark canvas `oklch(16.5% 0.012 120deg)`, was the oklab mix of neutral 950 and 900 (L 0.202, chroma 0.0225) |
| Three edge roles, separator < container ≤ control on every level | Separator −0.08 / +0.15; control −0.37 / +0.42; container 25% of the way, unchanged |
| The same, further apart, under `prefers-contrast: more` | Separator −0.35 / +0.34; control −0.56 / +0.60 |
| Elevation is a shadow per level, never a border alone | Raised: one contact layer at 6%. Overlay: contact 8% and ambient 11%, plus a 1px top highlight in dark. The dark shadow is black, at ten times the light alpha, capped at 1 |

## Models compared

Both were prototyped as an override over the build (source in
`~/crithcss/cirth-captures/surface-depth/prototype-source/`) and captured on
the surface matrix and on the docs home, Card, Code and Vite pages.

| | A: near-white canvas, white sheets | B: white canvas, tonal surfaces |
| --- | --- | --- |
| Canvas | L 0.978, a trace of the neutral hue | White |
| Raised | Near white, above the canvas | Tinted at L 0.978, below the canvas |
| Recessed | 0.04 below the canvas | L 0.95 |
| Overlay | The raised level plus a shadow | White plus a shadow |
| Card on the page | Brighter sheet, contact shadow, container edge | Filled grey panel, container edge |
| Greyscale, no edges, no shadows | Recessed, canvas and raised distinct; overlay equals raised | Canvas and overlay identical; card distinct but reads as a hole |
| Fields in a card | Paint the near-white card | Paint the grey card: every form becomes grey |

B tints every card and every field in it, which on a documentation page or
a form-heavy screen turns the brightest thing on the page into the canvas
and everything the reader works in into grey. It is the model
[surface-and-edge-model](surface-and-edge-model.md) already rejected
("cards read as holes"), and the prototype confirmed it. A is chosen. Its
cost is stated in [What this does not promise](#what-this-does-not-promise).

In dark the two models coincide: elevation there is lightness, so every
level above the canvas is lighter in both.

## Contract

### Levels

| Token | Light | Dark |
| --- | --- | --- |
| `--cirth-canvas` (input) | `oklch(97.8% 0.003 120deg)` | `oklch(16.5% 0.012 120deg)` |
| `--cirth-surface-recessed` | canvas −0.04 L | canvas −0.04 L |
| `--cirth-card-sectioning-background-color` (band) | canvas + 50% of the distance to white, chroma ×0.5 | canvas +0.03 L |
| `--cirth-surface-raised` | canvas + 90% of the distance to white, chroma ×0.25 | canvas +0.06 L |
| `--cirth-surface-overlay` | the raised value | canvas +0.11 L |

Everything that aliases a level keeps aliasing it: code and a specimen
well are recessed, a card is raised, a dropdown, popover and dialog are
overlay, a field paints `--cirth-surface`.

### Edges

| Role | Token | Light | Dark | Light · more | Dark · more |
| --- | --- | --- | --- | --- | --- |
| Separator | `--cirth-muted-border-color` | canvas −0.08 L | +0.15 | −0.35 | +0.34 |
| Container | `--cirth-card-border-color` | 25% from separator to control | same | same | same |
| Control | `--cirth-form-element-border-color` | canvas −0.37 L | +0.42 | −0.56 | +0.60 |

The control edge keeps 3:1 on the worst level it can sit on (recessed in
light, overlay in dark) for the default canvas, plain and metro. Under
`more` the pass keeps what it promised before this change: in light a
separator of 3:1 on the canvas and the raised level and about 2.9:1 on the
recessed one, a control of 7:1; in dark a separator of 2.4:1 on every
level and a control of 6.5:1.

### Elevation

| Level | Token | Light | Dark |
| --- | --- | --- | --- |
| Raised (`<article>`) | `--cirth-card-box-shadow` | `0 1px 2px` at 6% of neutral 950 | same geometry, black at 60% |
| Overlay (dropdown, popover, dialog) | `--cirth-box-shadow` | an inset `0 1px 0` layer, transparent; `0 1px 3px` at 8% and `0 10px 28px -6px` at 11% of neutral 950 | the inset layer white at 5%; black at 80% and 100% |

`--cirth-modal-box-shadow` keeps aliasing `--cirth-box-shadow`, so one
declaration still removes every overlay shadow, as metro does. A card's
shadow is its own token and is not removed by it.

A card never casts the overlay shadow: its single contact layer is a
fourteenth of the overlay's reach, so a card reads as a sheet on the page
and a menu as something above it.

The dark shadow colour moves from black mixed with neutral 950 to black,
and the dark factor from 8 to 10. Two pixels under a panel the ambient
layer decides the step [dark-elevation-shadow](dark-elevation-shadow.md)
measures, and on a near-black canvas it has to reach full opacity for the
dark step to keep three quarters of the light one.

### Presets

| Preset | Change | Why |
| --- | --- | --- |
| plain | Canvas `light-dark(oklch(97.8% 0 0deg), oklch(16.5% 0.006 264deg))`, was 97% and 20% | Plain is the default's quietest twin: same ends, no hue in light, a trace of blue in dark |
| material | `--cirth-card-box-shadow: none` | M3 separates cards by tone and outline; its canvas and its own edges and shadows are M3's and do not move |
| metro | `--cirth-card-box-shadow: none` | Metro is flat everywhere; its canvas (97% and 14%) is its own and does not move |

The probe accent of [surface-and-edge-model](surface-and-edge-model.md)
keeps its role. `playroom`, which that spec measured, has been replaced by
material and metro ([material-preset](material-preset.md),
[metro-preset](metro-preset.md)); both are measured here instead.

### Overrides

- An author who sets `--cirth-canvas` gets every level, edge and band from
  the relations above, applied to their canvas in its own scheme, including
  in a subtree that forces one. A light canvas at white leaves the raised
  level no room: cards are then told apart by their edge and their shadow
  only, as before this change.
- An author who set `--cirth-box-shadow: none` to flatten the page now also
  has to set `--cirth-card-box-shadow: none`.

### Implications checked

| Element | Effect |
| --- | --- |
| Form borders | Control on canvas 3.49 → 3.58 in light, 4.82 → 4.61 in dark; no field edge reads heavier than today on the page it sits on |
| Separators, tables | Separator on canvas 1.27 → 1.27 in light, 1.43 → 1.50 in dark |
| Inline code | Unaffected: inline code is text since [control-emphasis](control-emphasis.md). `kbd` keeps its ink cap |
| Card header and footer | The band sits 0.012 above the canvas and 0.008 below the card in light; the separator under it does the dividing, as before |
| Outline button | Paints `--cirth-surface` as before; its accent edge is untouched |
| Focus ring | The accent text role, at 5.11:1 or more on every level in light and 5.42:1 in dark for the default accent |
| Overlays and backdrop | Backdrop formulas unchanged; in dark the dialog is lifted 0.11 L above a near-black page, in light it is the brightest surface under a dimmed one |

### What this does not promise

- **A larger luminance step between canvas and card in light.** It shrinks,
  from ΔL 0.034 to 0.019 (1.10:1 to 1.06:1): a canvas near white leaves
  little room above it. A card is told apart by that step, its contact
  shadow and its edge together. The recessed level grows instead, from
  −0.030 to −0.039.
- **An overlay lighter than a card in light.** Both are near white; the
  overlay's shadow is what lifts it, as before.
- **The floors on a canvas nobody tested.** As in surface-and-edge-model,
  the order holds for any canvas; the floors are measured for the canvases
  listed here.

## Measurements

Prototype `A2` over `dist/` at `f7fc5d2a`, Chromium 149.0.7827.55, colours
as painted in 8-bit sRGB. "Before" is the build.

### Surfaces

| Variant | Canvas | Recessed | Band | Raised | Overlay |
| --- | --- | --- | --- | --- | --- |
| default light | #f1f2ee → **#f7f8f6** | #e7e8e4 → **#eaebe9** | #f7f8f5 → **#fbfcfa** | #fdfdfb → **#fefefe** | #fdfdfb → **#fefefe** |
| default dark | #15180c → **#0e0f09** | #0d1005 → **#060703** | #1b1e12 → **#141610** | #202417 → **#1b1d16** | #292c20 → **#272922** |
| plain light | #f5f5f5 → **#f8f8f8** | #ebebeb → **#eaeaea** | #f9f9f9 → **#fbfbfb** | #fdfefe → **#fefefe** | #fdfefe → **#fefefe** |
| plain dark | #14161a → **#0d0e11** | #0d0e12 → **#060609** | #1a1c20 → **#131518** | #202226 → **#1a1c1f** | #282a2e → **#26282b** |
| material light | #fef7ff → **#fef7ff** | #f4edf5 → **#f1eaf2** | #fffaff → **#fefbff** | #fffdff → **#fffeff** | #fffdff → **#fffeff** |
| material dark | #141218 → **#141218** | #0c0a10 → **#0b090f** | #1a181e → **#1b191f** | #1f1d24 → **#222026** | #28262c → **#2e2c33** |
| metro light | #f5f5f5 → **#f5f5f5** | #ebebeb → **#e8e8e8** | #f9f9f9 → **#fafafa** | #fdfefe → **#fefefe** | #fdfefe → **#fefefe** |
| metro dark | #090909 → **#090909** | #040404 → **#030303** | #0e0e0e → **#0f0f0f** | #141414 → **#161616** | #1c1c1c → **#222222** |
| probe light | as default light | | | | |
| probe dark | as default dark | | | | |

### Distance from the canvas (OKLab ΔL)

| Variant | Recessed | Band | Raised | Overlay |
| --- | --- | --- | --- | --- |
| default light | -0.030 → **-0.039** | 0.018 → **0.012** | 0.034 → **0.019** | 0.034 → **0.019** |
| default dark | -0.036 → **-0.040** | 0.026 → **0.031** | 0.050 → **0.061** | 0.084 → **0.111** |
| plain light | -0.030 → **-0.042** | 0.012 → **0.009** | 0.026 → **0.018** | 0.026 → **0.018** |
| plain dark | -0.035 → **-0.040** | 0.026 → **0.031** | 0.052 → **0.062** | 0.085 → **0.112** |
| material light | -0.030 → **-0.039** | 0.006 → **0.008** | 0.012 → **0.014** | 0.012 → **0.014** |
| material dark | -0.037 → **-0.042** | 0.027 → **0.031** | 0.049 → **0.061** | 0.086 → **0.111** |
| metro light | -0.030 → **-0.039** | 0.012 → **0.015** | 0.026 → **0.027** | 0.026 → **0.027** |
| metro dark | -0.033 → **-0.043** | 0.024 → **0.029** | 0.051 → **0.060** | 0.087 → **0.112** |

### WCAG ratio against the canvas

| Variant | Recessed | Raised | Overlay | Raised on recessed | Overlay on raised |
| --- | --- | --- | --- | --- | --- |
| default light | 1.09 → **1.12** | 1.10 → **1.06** | 1.10 → **1.06** | 1.21 → **1.19** | 1.00 → **1.00** |
| default dark | 1.07 → **1.05** | 1.14 → **1.13** | 1.26 → **1.31** | 1.21 → **1.19** | 1.11 → **1.16** |
| plain light | 1.09 → **1.13** | 1.08 → **1.05** | 1.08 → **1.05** | 1.18 → **1.19** | 1.00 → **1.00** |
| plain dark | 1.06 → **1.05** | 1.14 → **1.13** | 1.26 → **1.31** | 1.21 → **1.19** | 1.11 → **1.16** |
| material light | 1.09 → **1.12** | 1.04 → **1.05** | 1.04 → **1.05** | 1.14 → **1.17** | 1.00 → **1.00** |
| material dark | 1.06 → **1.06** | 1.11 → **1.15** | 1.24 → **1.35** | 1.18 → **1.23** | 1.11 → **1.17** |
| metro light | 1.09 → **1.12** | 1.08 → **1.08** | 1.08 → **1.08** | 1.18 → **1.22** | 1.00 → **1.00** |
| metro dark | 1.03 → **1.04** | 1.08 → **1.10** | 1.17 → **1.25** | 1.11 → **1.14** | 1.08 → **1.14** |

WCAG's flare term compresses every step near black, which is why dark
steps that are larger in ΔL can read smaller in ratio; ΔL is the table the
eye agrees with.

### Edges and text

Worst of the four levels unless the column says otherwise.

| Variant | Separator on canvas | Container on canvas | Control on canvas | Control, worst | Ink | Muted | Accent text |
| --- | --- | --- | --- | --- | --- | --- | --- |
| default light | 1.27 → **1.27** | 1.61 → **1.61** | 3.49 → **3.58** | 3.19 → **3.19** | 8.97 → **9.23** | 5.21 → **5.36** | 4.96 → **5.11** |
| default dark | 1.43 → **1.50** | 1.91 → **1.95** | 4.82 → **4.61** | 3.81 → **3.53** | 8.43 → **8.72** | 5.37 → **5.56** | 5.24 → **5.42** |
| plain light | 1.27 → **1.28** | 1.60 → **1.61** | 3.48 → **3.62** | 3.18 → **3.19** | 9.26 → **9.18** | 5.38 → **5.33** | 4.70 → **4.66** |
| plain dark | 1.43 → **1.50** | 1.91 → **1.94** | 4.77 → **4.61** | 3.79 → **3.53** | 8.51 → **8.75** | 5.43 → **5.58** | 5.79 → **5.96** |
| material light | 1.62 → **1.62** | 2.03 → **2.03** | 4.33 → **4.33** | 3.96 → **3.86** | 14.86 → **14.47** | 8.13 → **7.92** | 5.61 → **5.46** |
| material dark | 1.99 → **1.99** | 2.64 → **2.64** | 5.87 → **5.87** | 4.72 → **4.35** | 11.54 → **10.63** | 8.77 → **8.08** | 8.78 → **8.08** |
| metro light | 1.27 → **1.27** | 1.60 → **1.62** | 3.48 → **3.62** | 3.18 → **3.22** | 14.45 → **14.06** | 5.44 → **5.29** | 5.19 → **5.05** |
| metro dark | 1.28 → **1.41** | 1.65 → **1.81** | 4.08 → **4.26** | 3.49 → **3.40** | 15.22 → **14.21** | 6.36 → **5.94** | 6.82 → **6.36** |
| probe light | 1.27 → **1.27** | 1.61 → **1.61** | 3.49 → **3.58** | 3.19 → **3.19** | 8.97 → **9.23** | 5.21 → **5.36** | 4.64 → **4.78** |
| probe dark | 1.43 → **1.50** | 1.91 → **1.95** | 4.82 → **4.61** | 3.81 → **3.53** | 8.43 → **8.72** | 5.37 → **5.56** | 5.95 → **6.16** |

Under `more` (computed from the formulas and the canvases, see the ledger):

| Variant | Separator on canvas | Separator, worst | Container on canvas | Control, worst | Order on every level |
| --- | --- | --- | --- | --- | --- |
| default light | 3.23 → **3.30** | **2.94**, recessed | 4.06 → **4.11** | 7.48 → **7.10** | yes |
| default dark | 3.05 → **3.30** | **2.53** | 3.97 → **4.34** | 6.48 → **7.00** | yes |
| plain light | 3.21 → **3.34** | **2.95**, recessed | 3.99 → **4.16** | 7.43 → **7.14** | yes |
| plain dark | 3.01 → **3.30** | **2.53** | 3.93 → **4.36** | 6.46 → **7.04** | yes |
| metro light | 3.21 → **3.34** | **2.97**, recessed | 3.99 → **4.17** | 7.43 → **7.23** | yes |
| metro dark | 2.55 → **3.02** | **2.42** | 3.36 → **4.02** | 6.13 → **6.93** | yes |

"Before" is the build under `more` in Chromium 149.0.7827.55; "after" is
computed. Material sets its own edges under `more` and is unchanged.

## Evidence ledger

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| The light canvas is L 0.959 and the dark one L 0.202 | Painted `#f1f2ee` and `#15180c` | Surface matrix, `dist/cirth.css` at `f7fc5d2a`, Chromium 149.0.7827.55 | Verified |
| Light raised and overlay are the same colour; they differ only by the overlay shadow | Both `#fdfdfb` | Same run | Verified |
| With edges and shadows removed, recessed, canvas and raised are distinct in greyscale in A, and overlay equals raised in light | `protoA/*-gray.png` | Prototype A over `f7fc5d2a`, Chromium 149.0.7827.55 | Verified |
| In B, canvas and overlay are identical in greyscale and fields in a card turn grey | `protoB/default-light-*.png`: canvas and overlay both `#ffffff` | Prototype B, same browser | Verified |
| The ratios recorded in surface-and-edge-model show the hierarchy is sufficient | They measure distance, not whether the page reads as luminous or deep; the maintainer's review of the same build on 2026-09-30 found it flat | surface-and-edge-model, Measurements | Invalid |
| The values in this spec's Measurements tables | `protoA2/report.json` | Prototype A2 over `f7fc5d2a`, Chromium 149.0.7827.55 | Verified |
| The `more` edges, as first recorded | Computed from the formulas, the canvases and 8-bit rounding in Node, not painted. The prototype could not measure them: an unlayered override also replaces the contrast pass | `scripts/lib/color.js`, Node 24.18.0 | Reported |
| The `more` edges, painted | Separator on canvas and on its worst level as computed (3.30 and 2.94 light, 3.30 and 2.53 dark); container 4.09 light and 4.30 dark against the 4.11 and 4.34 computed, the difference being the oklab mix in 8-bit; control worst 7.11 and 7.00 | Surface matrix, `dist/cirth.css` from this change, Chromium 149.0.7827.55, `prefers-contrast: more` | Verified |
| The implementation paints the prototype's values | Every hex and ratio in the Measurements tables reproduced exactly on the surface matrix | `dist/cirth.css` and `dist/presets/*.css` from this change, Chromium 149.0.7827.55 | Verified |
| The levels, edge order and control floors hold in three engines | `tests/surface-depth.spec.js`: 37 tests per engine, default, three presets and the probe, both schemes, with and without `more` | Chromium 149.0.7827.55, Firefox 151.0, WebKit 26.5 | Verified |
| The same test detects the baseline | 19 of its 37 tests fail on `dist/` built from `f7fc5d2a`: the canvas ends, the dark overlay step, the light recessed step, the card shadow and the dark `more` edges | `f7fc5d2a` extracted and built outside the tree, Chromium 149.0.7827.55 | Verified |
| Colour tokens agree across engines | 717 comparisons within ΔOklab 0.002 | `npm run check:tokens`, three engines | Verified |
| No new accessibility violation | 65 pages × 4 themes × 3 modes, the specimens, and the five surface matrices | `npm run check:a11y`, axe in Chromium 149.0.7827.55 | Verified |
| The dark elevation contract (ΔL two pixels under a panel ≥ 0.75 × light) holds with the prototype's shadow | Light −0.055 to −0.058, dark −0.030 to −0.044: 0.54 in WebKit, 0.60 in Firefox | `tests/box-shadow.spec.js` on the first implementation (ambient 14%, factor 8), Chromium 149.0.7827.55, Firefox 151.0, WebKit 26.5 | Invalid |
| The dark elevation contract holds with the shipped shadow | Light −0.047 (Chromium), −0.051 (Firefox), −0.048 (WebKit); dark −0.044, −0.046, −0.040: ratios 0.94, 0.90, 0.83 | `tests/box-shadow.spec.js`, same browsers | Verified |

## Decisions

| Decision | Basis | Rationale |
| --- | --- | --- |
| Model A | Design | Keeps the reading surface and every form in it the brightest thing on the page; B moves the grey onto the cards and fields |
| Rejected: B, white canvas with tonal cards | Design | Cards and their fields turn grey, overlays equal the canvas in greyscale |
| Light canvas at 97.8% | Design | Near white (`#f7f8f6`) and still 0.019 L under the card; at 98.5% the card step falls under 0.014 |
| Rejected: keep 96% and widen the steps | Design | The maintainer's review: the page reads grey, whatever the ratios say |
| Raised at 90% of the way to white, not white | Existing contract | A card must still follow `--cirth-canvas`; at 100% every light canvas would give a white card and a tinted canvas would lose its tint on cards |
| Dark canvas at 16.5% with chroma 0.012 | Design | Near black with a trace of the neutral hue; at 15% the recessed level has no room left (0.11) and code blocks go black |
| Rejected: a dark canvas from the neutral ladder | Constraint | The ladder starts at 18%, which is the problem |
| A contact shadow on cards | Design | The maintainer allowed a faint depth on cards; it is what separates a white sheet from a near-white page besides the edge. One layer, a fourteenth of the overlay's reach |
| Overlay ambient at 11%, not the prototype's 14% | Existing contract | At 14% the light step under a panel grew to −0.055 and the dark one, already opaque, could not follow: WebKit measured 0.54 of it against the 0.75 the contract asks |
| Dark shadow black, factor 10 | Existing contract | With the near-black canvas the black-mixed neutral left the dark shadow 0.075 L of room; black and a saturated ambient bring the dark step back to 0.83 to 0.94 of the light one |
| Rejected: a separate, deeper modal shadow | Existing contract | Metro turns every overlay shadow off with one declaration; the dialog is already set apart by its backdrop |
| A top highlight on overlays in dark | Design | Light from above is how a lifted panel reads on a near-black page; 5% white on one pixel row, overlays only, so a card never borrows it |
| Retune the `more` edges | Existing contract | The dark ladder is wider; without it the pass would fall under its own promises (2.10 and 5.84) |
| Hues unchanged | Existing contract | [default-palette](default-palette.md) chose them the day before; nothing measured here needs them to move |

## Acceptance

- [x] With every border removed, recessed, canvas and raised differ in
      lightness in both schemes, and overlay differs from raised in dark,
      for default, plain, material, metro and the probe, with minimum ΔL
      steps: `tests/surface-depth.spec.js`.
- [x] Control ≥ 3:1 (≥ 6.9:1 under `more`) on every level, separator <
      container ≤ control on every level, in both schemes, with and
      without `more`, in Chromium, Firefox and WebKit:
      `tests/surface-depth.spec.js`.
- [x] Canvas hue at 120° in both schemes (the literals); `--cirth-primary`
      untouched by this change.
- [x] A card casts one contact layer and not the overlay shadow; metro and
      material cast none: `tests/box-shadow.spec.js`,
      `tests/surface-depth.spec.js`.
- [x] The dark elevation contract passes in three engines:
      `tests/box-shadow.spec.js`.
- [x] `npm run check:tokens` green; `npm run check:size` within every
      budget (`cirth.min.css` 14770 B of 15200 B).
- [x] `docs/src/pages/colors.md`, `components/card.md`, `presets.md` and
      `upgrading.md` updated; [surface-and-edge-model](surface-and-edge-model.md)
      and [dark-elevation-shadow](dark-elevation-shadow.md) point here.
- [ ] Visual baselines regenerated after the documentation redesign that
      follows this change, with every diff inspected.

## Migration

| If you | Then |
| --- | --- |
| Override `--cirth-canvas` | Nothing: every level follows it, with the new distances |
| Read a surface, edge or shadow default | It has a new value; see the Contract |
| Set `--cirth-box-shadow: none` to flatten the page | Set `--cirth-card-box-shadow: none` too |
| Rely on cards having no shadow | Set `--cirth-card-box-shadow: none` |
| Load plain | Its canvas is lighter in light and darker in dark |

## Open questions

1. **Should the canvas-to-card step in light be larger?** It is 0.019 L,
   about one just-noticeable difference, and the shadow and edge carry the
   rest. A darker canvas would widen it and is exactly what this spec
   moves away from. Settled by the maintainer's review of the
   implementation.
