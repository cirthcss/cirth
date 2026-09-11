# Native Baseline aesthetic rework

Status: experimental. This note records the visual system and the editorial
delta introduced by the aesthetic branch; it is not public product copy.

## Visual thesis

Cirth is presented as an operational technical plate rather than a marketing
landing page. Real semantic HTML, the selected stylesheet, and authentic Cirth
output share a measurable grid. Mineral paper and cool graphite provide the
working surface, and copper is reserved for functional signal. The monogram's
geometry is concentrated in the responsive mark rather than repeated as
ornamental corner cuts. Claims are paired with their verification method in a
compact proof ledger.

The ordering in that sentence is the system, not a description of it: the
paper and the graphite carry the identity, and the copper carries attention.
On a text-heavy documentation page the only brand color is two 2 px rails —
which is the accent discipline working, and also the reason the accent cannot
be what makes the product recognizable. See "Chromatic rework" below.

## Layer contract

- **Brand identity:** monogram, copper signal, paper/graphite surfaces, technical
  voice, figures, and proof grammar.
- **Documentation shell:** all `--docs-*` tokens, page grid, rails, table of
  contents, diagrams, annotations, proof ledger, responsive reordering, and
  asset templates.
- **Public Cirth UI:** semantic component styling and public `--cirth-*` tokens.
  Live labs load a generated Cirth build and declare that they have no preview
  overrides.

The shell may compose components but must not silently restyle a live product
example. Documentation JavaScript switches already-rendered build/theme labs;
the initial example and all fundamental content remain available without it.

### The declared exceptions inside a live example

Every demo is captioned *Authentic Cirth · shell overrides declared in
source*. That plural is two rules, and this is the list. Enumerated against
the built site: no other shell declaration reaches a node inside a
`.docs-demo-preview`.

```css
.docs-demo-preview > :last-child {
  margin-bottom: 0;
}
```

The frame's padding contract, not a restyle. A padded box closes the
trailing margin of what it holds — exactly what `components/_card.scss`
does for `<article>`, and what the Card page documents as the container's
job. Without it, 172 demos carry a dead gutter between the last element and
the frame's own padding. It stays in the shell and does **not** move into
the core: the core's job is to give an element its rhythm, and closing that
rhythm at a container's edge is the container's decision. `.docs-demo-preview`
is a container the documentation invented, so it is the documentation that
owes the contract.

```css
.docs-visited-swatch { … }
```

A shell class used inside one demo's own visible markup
(`content/demos/links.html`), where the example is *about* the visited-link
token and needs to show it inline. It styles a `<span>` the demo author
wrote, not a framework element the demo is demonstrating, which is why it
does not make the caption untrue.

Two rules that used to reach in and no longer do are recorded here so the
boundary is not re-crossed by accident: the reading column's
`--cirth-line-height` and `--cirth-typography-spacing-vertical`, which are
inherited custom properties and re-timed every example until the preview
handed the framework's own values back, and the chapter rules on headings
and code-block chrome, which are now scoped with `>` to the level markdown
emits them at.

## System rules

- 8 px base unit, with 4 px reserved for fine alignment and annotation.
- 12-column desktop, 6-column tablet, and 4-column mobile composition.
- System sans for product, headings, and UI; system monospace for code, data,
  tokens, coordinates, and proof states. No webfonts.
- Borders and tonal surfaces before shadows; controlled 0–8 px shell radii.
- Decorative coordinates, figure numbering, and corner cuts stay out of the
  shell unless they carry information the reader needs.
- UI fidelity: high for live Cirth, medium for explanatory fragments, and low
  for reduced marks/greeking at small scale.
- Motion explains source-to-output and state changes, has a complete static
  state, and is removed under `prefers-reduced-motion`.
- Light mode uses mineral paper; dark mode uses graphite rather than pure black.
  Copper remains a signal and is never the only state indicator.
- The neutral family sits at least 120° of hue from the accent. This is an
  invariant, not a preference — see "The counterweight invariant" below.

## Mark and asset experiment

`mark_small*.svg` is an optical small-size variant with fewer disconnected
parts and a tighter view box for 16–23 px use. `favicon*.svg`, the Apple touch
icon, README images, and the social preview derive from that variant. Source
templates remain in the documentation tree and `npm run docs:brand-assets`
reproduces the raster assets and review screenshots.

The logo geometry is still untouched; only its pigment moved with the palette.
The mark is `#BD5928` on light and `#E16B31` on dark — both at 85% of the hue's
gamut ceiling, where the UI accent sits at 70%, because a monogram covers a
monogram and an accent covers whole surfaces. Contrast on the light ground rose
from 2.90:1 to 4.20:1 as a side effect of the move.

The share card (`_includes/share-card.njk`) used to carry a second palette:
seven hex values in two themes, maintained by hand beside the framework's own.
It now loads the built stylesheet and reads `--cirth-*` directly. Three things
stay pinned in the card with a stated reason — its leading (a fixed-size raster
whose line breaks are composition), the bare `code` treatment, and
`background-repeat`, because the library reset sets `no-repeat` on every
element and pseudo-element and the construction grid is a repeating gradient.

## Editorial delta

- Homepage: retained the production-ready semantic HTML claim, promoted
  semantic HTML and accessible baseline, replaced the typing/sticky-tour
  language with a direct source/output comparison, and changed the stale hard-coded
  `244 tokens` proof to a build-derived current count (`247` on this branch —
  the number moves with the build, which is the point of deriving it).
- Brand: added operational construction, clearspace, fidelity, small-size, and
  incorrect-use guidance; corrected the claim that the full mark works at
  16 px by assigning that size to the optical variant. The existing name-origin
  and Tolkien disclaimer text remains unchanged.
- About: added a compact current-build proof strip; narrative content remains
  unchanged.
- Examples: added four isolated build comparisons and explicitly disclosed that
  the legacy inline scoped example still sits under the global default build.
  Existing example content remains unchanged.
- Colors: corrected the old serif-heading description to match the system-sans
  product direction and added labels for the live light/dark role comparison.
- Get started: added build metadata only so the classless stylesheet is loaded
  only where its real demo is present.
- README: replaced the square mark-only introduction with responsive light/dark
  technical assets; product prose remains unchanged.

Archived documentation and long-form component guidance were intentionally not
rewritten in this experiment.

The list above describes the first pass. A second pass followed it — the
chromatic rework — which rewrote the Color section of Brand, the "Underlying
palette" section of Colors, and the amber references across About, Get started,
Contributions, Index, Meter, Popover, Progress, README and TODO. The preset
selector's default option and the specimen routes were renamed from `amber` to
`default`, which also moved two page URLs and 24 screenshot baselines. Those
changes are described in the next section rather than itemized here, because
they are one decision rather than nine edits.

## Chromatic rework

The branch shipped an amber accent (69.35°) on a cool blue-gray neutral
(264°). That system was correct and anonymous: every contrast floor held, and
nothing about the result identified the product. The palette was rebuilt
around graphite and copper rather than adjusted toward them.

### What the scales are now

| family | hue | chroma rule |
| --- | --- | --- |
| `$copper-*` | 44° | 70% of the hue's sRGB gamut ceiling, every step |
| `$error-*` | 22° | 85% |
| `$success-*` | 153° | 85% |
| `$warning-*` | 89.5° | 85% |
| `$neutral-*` | 280° | bell peaking mid-ladder, floored at 70% of peak at the dark end |
| `$paper` | 44° | 0.006 — off the ladder; it is a surface, not a step |

The fraction is the family's voice. A status color has to be recognized at a
glance in a small, rare mark, so it sits at 85%. The brand accent covers whole
surfaces and appears on every screen, so 70% is what keeps it reading as
oxidized metal instead of as an orange.

`$neutral-*` is not an accent and is not derived like one. Its chroma is a
bell — a light gray needs more chroma than a dark one to read as cool rather
than as plain gray, and a large pale surface needs none at all — but it does
not return to zero at the dark end. It floors at 70% of the peak, because the
dark scheme builds its canvas from the two darkest steps, and a symmetric bell
left that canvas achromatic whatever hue the family was given. That was the
defect the rework existed to fix: the dark canvas came out `#161617` across
eight tested hues.

Anchors: light accent `$copper-550`, dark accent `$copper-400`. The dark one is
a step deeper than the mirror of the light one because copper's gamut ceiling
climbs steeply past 65% lightness and the mirroring step comes out orange.

### The counterweight invariant

The first attempt put the neutral at 308°, averaged from the three reference
stones. It failed, and the failure is worth recording because it is the
failure mode of this whole direction.

At 308° the neutral's a\* is +0.616: the grays did not merely lose blue, they
gained red. Summed over the light theme's inks, borders, headings and tracks,
b\* went from −0.135 to −0.092 — **32% less blue** — while a\* went from −0.014
to **+0.072**. With the canvas warm, the accent warm, danger warm and warning
warm, the page had no cool mass left. It read as a blue-light filter.

The distance from the accent is what collapsed: amber/264° were 165° apart,
near-complementary; copper/308° were 96° apart, both on the warm half of the
wheel. At 280° the separation is 124° and b\* recovers to −0.165.

Two lessons, both load-bearing:

1. **The neutral hue is a working part, not decoration.** Copper is only legible
   *as* a warm signal against something cool. Move the neutral family toward the
   plum end and the accent stops being a signal.
2. **Hue angle is meaningless at low chroma.** The 308° average was computed
   across three reference stones including one at chroma 0.0072, whose hue angle
   carries no information. Weighting a meaningless number is how the error got in.

### Architectural defects the rework exposed

Three were real bugs that the previous palette hid because its numbers happened
to fall in a safe place:

- **`--cirth-text-selection-color` was pinned to the brand scale.** Every preset
  — a blue Plain page, a violet Playroom one — highlighted text in the default
  theme's accent. Now derived from `--cirth-primary`.
- **The light card border averaged two distant hues.** `color-mix(in oklab, …)`
  stops a hue from *rotating* but not from *averaging*; once the neutral's chroma
  and the canvas's were the same order of magnitude, the most-used border in the
  library landed at 349.6°, a magenta. The surface now goes into the mix with its
  chroma zeroed, so the border keeps the field border's hue at any canvas
  temperature. The dark scheme still mixes whole, because there the canvas and
  the neutral share a hue and there is nothing to average.
- **`baseline-consistency.spec.js:382` caught the magenta**, across all three
  engines, before a human looked at it. The test asserts the outcome rather than
  the mechanism, which is why it survived a derivation change.

A palette applied on top of a product does not surface defects like these. That
is the strongest available evidence that this is an identity and not a theme.

## Competitive position

Measured from official sources — compiled CSS where available — and converted
to oklch. Fourteen products sampled across classless, CSS framework, utility,
component system and design system categories; thirteen of them have a
chromatic brand color, and shadcn/ui does not.

| finding | value |
| --- | --- |
| chromatic brand hues inside 200–320° | **12 of 13 (92%)** |
| inside a 37° window (233–270°) | **11 of 13** |
| median brand hue | **257°** |
| chromatic exceptions | Bulma, 177° teal |
| structural exceptions | shadcn/ui, achromatic (C = 0) |
| competitor neutrals that are warm | **none** — all cool (b\* < 0) or exactly 0 |
| competitors with a warm canvas | **none** |
| Cirth copper's distance from the nearest competitor hue | **110°** |

The closest philosophical peer is the most conventional: Pico CSS is azure
(242°) on cool slate, light `#0172ad` / dark `#01aaff`.

Two qualifications matter more than the headline:

- **The convergence is on the brand, not the neutrals.** Every sampled neutral is
  cool or exactly achromatic. Nobody uses a warm canvas.
- **The ecosystem is drifting toward warm neutrals as an option.** shadcn/ui
  offers Stone, Taupe, Olive and Mauve; Radix offers Sand, Olive and Mauve;
  Tailwind offers Stone. None uses one as its default identity. That box is open
  and several projects are looking at it.

### Where the differentiation actually comes from

Not the copper. On a typical documentation page the accent occupies two rails.
What identifies the product is the **warm-canvas / cool-ink inversion**, which
no sampled competitor has. The copper confirms the identity where it appears;
the paper establishes it.

This should govern how the direction is described and how it is extended. The
name for it is *mineral paper + graphite + copper signal*, in that order of
surface area, and the reverse order of attention.

### Signal headroom

Copper is a measurably weaker signal carrier than blue and a stronger one than
the amber it replaced. At the most saturated point that still clears AA as link
text on the light canvas:

| hue | max in-gamut chroma at AA |
| --- | --- |
| indigo 267° | 0.242 |
| blue 260° | 0.226 |
| **copper 44°** | **0.164** |
| amber 69° | 0.120 |
| teal 177° | 0.099 |

The shipped accent uses 0.107, well under its own ceiling, so there is
deliberate headroom left if the accent ever needs to speak louder.

## Verification state

Everything below was run on this branch after the rework.

| check | result |
| --- | --- |
| `lint`, `build`, `check:dist`, `check:size` | clean, eight budgets green |
| `check:package`, `check:consumer` | 24 files, 13 entry points, 12 resolve from the tarball |
| `check:behavior` | 1026 passed, 0 failed |
| `check:a11y` | 50 pages × 3 themes × 3 modes, no violations |
| `check:visual` | 787 passed (macOS baselines regenerated) |
| `check:tooling` | 16 release-guard checks |
| contrast audit, painted pixels | 53 checks × 2 schemes × 2 contrast modes |
| contrast audit, presets | 16 floors × 3 presets × 2 schemes × 2 modes — all met |
| gzip delta across the eight builds | **+66 B total (+0.12%)** |

The size increase is entirely the two new derivations. Both replaced literals
with relationships.

## Open questions and next steps

Ordered by what blocks what. Nothing here is started.

### 1. Linux visual baselines — blocking CI

The twelve `specimen-amber.png` files were renamed to `specimen-default.png`
but their **content is still the amber build**. Linux baselines are not
generated on macOS. Run the `Update visual baselines` workflow so the bot
regenerates them on Linux, as in CI #103. Until then `check:visual` is only
green locally.

### 2. Independent review of the direction

The copper palette was designed and assessed in the same session by the same
author. That assessment is not independent, and no amount of further
self-review fixes that.

The amber build is reproducible for comparison: check out `src/theme/` from
before the rework, `npm run build && npm run docs:build`, and capture the same
pages in both schemes. What is worth having is a blind comparison by someone
who did not build either one — particularly on the two questions self-review is
worst at, namely whether the copper reads as brown at small sizes and whether
the dark canvas reads as violet rather than as graphite.

### 3. Color-vision-deficiency testing — the real risk

Copper (44°) and danger (22°) are 22° apart. Separation currently rests on
chroma and lightness rather than hue: ΔE 17.8 in light, 14.2 in dark, measured
in Oklab. Those numbers are trichromat numbers. Under protanopia and deuteranopia
the hue difference largely disappears and only the lightness difference remains.
This has **not** been tested and it is the one finding that could force a change
to the palette rather than to a component. Test the adjacency page
(primary action / destructive action / form error / warning / focus on one
screen) under simulation before the direction is considered settled.

### 4. The framework/documentation identity gap

The documentation has built a visual identity — proof ledger, numbered figures,
construction grid, specimens — that the framework itself does not have. An
adopter gets the stylesheet, not the technical plate. The layer contract above
declares the split deliberately, so this is not an accident, but it does mean
the positioning currently rests on the docs more than on the product. Decide
whether that is acceptable, or whether some of the plate grammar belongs in the
library. This is a product decision, not a palette one.

### 5. Smaller items

- **Range thumb, dark: 2.37:1 against a 3:1 non-text floor.** Pre-existing, not
  introduced by the rework (it was 2.36:1 before). The thumb separates via its
  page-colored ring rather than against the track. Worth a focused fix; changing
  a neutral relationship for it would be the wrong lever.
- **`<mark>` is still the most default-browser gesture in the palette.** The
  surface is a pale gold from the warning family, which is coherent, but the
  treatment has had no design attention.
- **Radix Themes' default accent is asserted at medium confidence.** The prop
  file defaults `accentColor` to an empty string with the fallback in CSS.
  Confirm from the compiled theme if the comparison is ever published.
- **gh#78 (brand sign-off)** now has a candidate answer rather than an open
  question. `TODO.md` was updated from "whether amber" to "whether copper"; the
  sign-off itself is still outstanding and now also covers the recolored assets.

### 6. Do not do

Recorded so they are not revisited by accident:

- Do not move the neutral family toward plum "for fidelity to the reference
  stones". That is the failure in "The counterweight invariant".
- Do not let the identity rest on the accent. It does not have the surface area.
- Do not add public tokens named for the reference material — copper, gold,
  iron, stone, forge, rust. The Sass scale names are internal; the public API
  stays semantic.
- Do not pursue the achromatic territory. It is occupied and defended by
  shadcn/ui, which has more distribution.
