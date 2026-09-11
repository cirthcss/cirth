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

## Verification state: chromatic rework

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

## Native maturity convergence, 2026-09-11

This pass was performed as an independent review of the chromatic work above.
The primary evidence was a framework-only specimen rendered before and after
the pass, not the documentation shell.

### Independent aesthetic verdict

The direction is confirmed: **mineral paper + cool graphite + copper signal**
is credible, durable, and substantially more identifiable than the earlier
amber baseline.

The reservation is specific rather than directional. At compact button scale,
copper can approach ochre or brown when it is viewed without the paper/graphite
context. It does not read as generic orange in the complete page, and increasing
its coverage would make that risk worse rather than better. The identity still
comes from the warm-surface/cool-ink counterweight; copper confirms it.

The pure-framework dark specimen reads as cool graphite. The documentation can
look slightly more violet because it presents much larger contiguous surfaces,
but it does not cross into a themed purple UI. Light and dark retain the same
surface hierarchy, density, type, and signal behavior and read as the same
product. No palette rebuild was justified by the renders.

Compared directly:

- the earlier amber build is competent but anonymous;
- graphite/copper before this pass is distinctive, with several native-element
  edges still visibly less resolved than the docs;
- graphite/copper after this pass keeps the identity and closes the most visible
  semantic, state, and rhythm gaps.

### Framework maturity before

The existing core was already mature on forms, cards, tables, disclosures,
surface derivation, focus, nested lists, and description lists. The expanded
specimen exposed five weaker edges: `<mark>` still looked like a browser warning
highlight; the dark range thumb did not clear the non-text contrast floor and
the range host was only thumb-height; a primary and a destructive action had no
visual distinction; top-level sections accumulated like ordinary blocks; and
captions did not step down from body copy.

Those deficiencies mattered more in the framework-only view because the docs'
editorial plate, larger chapter spacing, annotations, and source/output framing
were no longer available to lend them hierarchy.

### Docs to core ownership decisions

No documentation selector was copied literally and no shell rule was deleted
for the sake of an override count. Two relationships demonstrated by the docs
were generalized instead:

1. The docs gives chapters a larger beat while keeping nested application
   regions compact. Core now gives adjacent direct `<main>` sections
   `--cirth-space-8`; the ordinary `<section>` rhythm is unchanged, so nested
   regions and full-bleed compositions retain their existing contract.
2. The docs consistently makes captions read as metadata. Core `figcaption` and
   table `caption` now use the small type role with normal leading, while their
   existing muted color and placement remain semantic defaults.

The docs continues to set a relaxed line height and `--cirth-space-5` prose
rhythm on `.docs-content`. That is a long-form reading-mode decision, and live
examples still hand those inherited values back at their boundary. Homepage
band padding, annotations, proof ledgers, source panes, syntax color, copy
controls, TOC, sidebar, responsive ordering, and stage geometry also remain
editorial composition.

### Mark

Before, `<mark>` used `--cirth-warning-surface`: relevance and warning were the
same visual role, and a multiline highlight looked like a pale browser-default
gold stripe.

Now its surface is an Oklab mix of `--cirth-primary` and `--cirth-canvas` (18%
accent in light, 24% in dark). The foreground remains the high-contrast mark
role, inline padding remains small, and cloned box decoration keeps each wrapped
line intentional without producing a chip. Text selection continues to paint
with its own selection role. Forced colors uses `Mark`/`MarkText`; print uses a
conventional pale highlight with exact color adjustment, independent of the
active screen scheme. The result follows every preset and no longer consumes a
semantic status family.

### Range

Before, the dark thumb was 2.37:1 against the track and the range host was only
20 px high. Changing the neutral architecture would have been disproportionate.

The resting thumb now reads `--cirth-secondary`, raising the default relationship
to 4.20:1 in light and 5.70:1 in dark. The host uses the shared 44 px control
floor; the visible thumb remains 20 px. Hover strengthens track and thumb,
active retains the accent and enlarged thumb, focus-visible gains an external
ring, and disabled remains inert. The outcome, rather than pseudo-element pixel
parity, is checked in Chromium, Firefox, and WebKit across both schemes and all
specimens.

### Copper, danger, and CVD

The original risk was real: the default filled action and a destructive action
had the same copper fill because HTML has no destructive button type. Moving the
brand was not the smallest correct fix.

The class build now exposes `.danger`, including `.outline.danger` and
`.ghost.danger`. It reuses the existing error input and focus family rather than
adding a parallel token graph. The dark filled variant is deliberately deeper,
keeping white labels at AA and increasing lightness separation from copper.

The adjacency specimen places primary, destructive, error, warning, success,
and keyboard focus together. Labels, element semantics, revision treatment or
meter shape, borders, and the focus ring carry meaning before hue does. A
repeatable Machado-matrix audit simulates full protanopia and deuteranopia in
linear sRGB, then measures the rendered fills in Oklab. Across default, Plain,
Playroom, the documented blue override, both schemes, and all three engines,
primary/danger distance stays at or above 0.06 and both labels stay at or above
4.5:1. For the default pair the smallest simulated distance is 0.085. The copper
palette therefore remains unchanged.

### Typography, rhythm, semantic HTML, and controls

The heading ramp, paragraph/list rhythm, nested content, blockquotes, code,
description lists, details, fieldsets, tables, and card/form rhythm survived the
framework-only review without needing more decoration. The changes were the two
caption roles and the top-level section beat above. They improve hierarchy while
leaving application density and preset spacing control intact.

The permanent shell-free specimen now covers the full heading range, prose and
inline semantics, nested and description lists, quotation/citation, rules,
code/pre/kbd/samp, mark/ins/del, table/caption, figure/figcaption, landmarks,
article/section, details, dialog, popover, search, forms, all common input types,
file, range, progress, meter, readonly, disabled, validity, selection, and focus.
It contains no docs classes, imagery, or docs stylesheet. Existing native
checkbox, radio, switch, select, file, date/time, search, number, validation,
readonly, progress, and meter behavior proved intentional; range was the only
control needing a core change.

### Framework versus docs after

The remaining delta is **healthy and intentional**. A semantic Cirth page now
has the hierarchy, state clarity, native-control finish, and material palette
needed to look like a designed product rather than a colored reset. The docs is
still visibly richer because it has a documentation job: navigation, editorial
bands, proof grammar, measurements, diagrams, and source/output tooling. It no
longer appears better because a warning token is standing in for a highlight, a
native control lacks a target or state, or ordinary chapters and captions have
no hierarchy.

### API impact

The only new public API is the `.danger` button modifier in class-enabled
builds. It is justified by a semantic gap HTML cannot infer and by a tested
brand/status collision in real adjacency. It composes with the existing outline
and ghost silhouettes and adds no public custom property. Classless builds do
not guess destructive intent from text or form position.

### Verification: native maturity convergence

The final tree was copied into an isolated checkout for every command that
generates `dist/` or `docs/dist/`; neither generated directory was edited in the
working tree. The macOS visual baselines were regenerated there, inspected at
desktop and mobile sizes, and then verified by a complete non-update run. Their
Git LFS content matches the tracked baseline set, so this pass adds no binary
snapshot churn. Linux remains a CI follow-up, as recorded below.

| check | final result |
| --- | --- |
| `lint`, `build`, `docs:build` | clean; 49 searchable pages and 66 built pages |
| `check:dist`, `check:size` | 20 non-empty parseable files; all eight gzip budgets green |
| `check:package`, `check:consumer` | 24 packed files, 13 package entry points; clean tarball install with 12 runtime entry points and 5 sealed internal paths |
| `check:behavior` | 1,056 passed, 9 expected skips, 0 failed across Chromium, Firefox, and WebKit |
| `check:a11y` | no new WCAG 2.0–2.2 A/AA violations across 50 pages × 3 themes × 3 modes, open states, and shell-free specimens |
| `check:visual` | 787 passed, 17 expected skips, 0 failed across 12 browser/viewport/scheme projects |
| `check:tooling`, `check:hooks` | audit isolation, interaction model, flake reporting, 16 release guards, and installed Git hooks all clean |
| rendered CVD adjacency | primary/danger labels ≥ 4.5:1 and Oklab distance ≥ 0.06 under normal, full protanopia, and full deuteranopia simulation |
| gzip delta across the eight builds | **+807 B total**; full build **+258 B** at 14,177 B, with 323 B remaining |

The range state assertions exercise real hover, active, keyboard focus, and
disabled behavior rather than only reading declarations. Mark contrast is
checked on screen, under `prefers-contrast: more`, in forced colors, and in
print. Section spacing is checked in both default and classless builds, with a
separate assertion that nested regions remain compact.

## Open questions and next steps

### 1. Linux visual baselines

The previously missing Linux regeneration exists upstream as commit `6721d991`;
this local branch started one commit behind it and the working tree was not
rewritten to pull it underneath an in-flight pass. This pass changes rendered
output again, so its Linux baselines must be regenerated by the repository's
`Update visual baselines` workflow after the branch is pushed. Do not synthesize
them on macOS.

### 2. Human brand sign-off

The independent review above resolves the earlier self-review gap, but it is not
human brand approval. gh#78 still needs the maintainer's sign-off on the copper
assets and the restrained compact-scale reading.

### 3. Competitive-data qualification

Radix Themes' default accent remains asserted at medium confidence. The prop
file defaults `accentColor` to an empty string with the fallback in CSS. Confirm
from the compiled theme if the comparison is ever published.

### 4. Do not do

Recorded so they are not revisited by accident:

- Do not move the neutral family toward plum "for fidelity to the reference
  stones". That is the failure in "The counterweight invariant".
- Do not let the identity rest on the accent. It does not have the surface area.
- Do not add public tokens named for the reference material — copper, gold,
  iron, stone, forge, rust. The Sass scale names are internal; the public API
  stays semantic.
- Do not pursue the achromatic territory. It is occupied and defended by
  shadcn/ui, which has more distribution.
