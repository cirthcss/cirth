# Native Baseline aesthetic rework

Status: experimental. This note records the visual system and the editorial
delta introduced by the aesthetic branch; it is not public product copy.

## Visual thesis

Cirth is presented as an operational technical plate rather than a marketing
landing page. Real semantic HTML, the selected stylesheet, and authentic Cirth
output share a measurable grid. Warm paper and graphite provide the working
surface, cool construction lines provide structure, and amber is reserved for
functional signal. The monogram's geometry is concentrated in the responsive
mark rather than repeated as ornamental corner cuts. Claims are paired
with their verification method in a compact proof ledger.

## Layer contract

- **Brand identity:** monogram, amber signal, paper/graphite surfaces, technical
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
- Light mode uses warm paper; dark mode uses graphite rather than pure black.
  Amber remains a signal and is never the only state indicator.

## Mark and asset experiment

The original logo files remain unchanged. `mark_small*.svg` is an optical
small-size variant with fewer disconnected parts and a tighter view box for
16–23 px use. `favicon*.svg`, the Apple touch icon, README images, and the social
preview derive from that variant. Source templates remain in the documentation
tree and `npm run docs:brand-assets` reproduces the raster assets and review
screenshots.

## Editorial delta

- Homepage: retained the production-ready semantic HTML claim, promoted
  semantic HTML and accessible baseline, replaced the typing/sticky-tour
  language with a direct source/output comparison, and changed the stale hard-coded
  `244 tokens` proof to a build-derived current count (`246` on this branch).
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
