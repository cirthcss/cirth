# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Cirth is pre-1.0 and the custom property surface is not yet stable.

## [Unreleased]

### Changed

- **Source hygiene: dead rules and redundant declarations removed.** No
  supported browser renders anything differently — the visual suite passes
  unchanged, pixel for pixel, on all three engines — and the published CSS
  is 64 B smaller gzipped. Three sweeps:
  `::-ms-check`, `::-ms-track`, `::-ms-thumb` and `::-moz-list-bullet` were
  matched by no browser in the declared Browserslist floor (they target IE,
  EdgeHTML, and a Firefox pseudo-element removed in Firefox 86), and
  `<progress>` carried a `color` declaration whose only job was feeding
  IE10's bar color. The 12 inline icons dropped their `width`/`height`
  attributes: every rule consuming one sets an explicit `background-size`
  or `mask-size`, and the `viewBox` alone carries the ratio the `auto` axis
  resolves against. And the hand-written vendor prefixes that the floor
  does not need (`-webkit-`/`-moz-appearance: none`, which Safari 15.4
  covers unprefixed) or that Lightning CSS already generates from the
  standard property (`-webkit-text-size-adjust`,
  `-webkit-print-color-adjust`) are gone, including one inert
  `-webkit-appearance` the shared range-thumb mixin was pushing into
  Firefox's `::-moz-range-thumb`. What survives is documented in
  `stylelint.config.cjs`: non-standard `appearance` values, the range thumb
  pseudo-element, the color-swatch focus ring, tap highlight, text fill
  color.

## [0.10.0] - 2026-08-22

### Added

- **A print pass** (gh#32): Cirth now ships `@media print` styles, so any
  page built from semantic HTML prints as a readable document without a
  print-only stylesheet of your own. The one that matters most is the
  surface reset — browsers drop author *backgrounds* when printing but keep
  author *text color*, so a page printed while the dark scheme was active
  used to come out near-white on white. Surfaces (cards, dropdowns, code,
  `<kbd>`, fields, striped rows, the modal overlay) go transparent and lose
  their shadows, links print as ink plus their underline with the URL of
  external links spelled out after them, buttons print as outlined labels
  instead of white-on-nothing, table headers repeat across pages and rows
  stay whole, `<pre>` wraps instead of being cut at the fold, and an open
  `<dialog>` prints in the flow rather than over the first page. Color that
  carries meaning — `<mark>`, `<progress>`, checked checkboxes and radios —
  opts back in with `print-color-adjust: exact`. Three new tokens,
  `--cirth-print-color`, `--cirth-print-muted-color` and
  `--cirth-print-border-color`, retune the whole pass. Nothing is hidden and
  no `@page` rule is set: which parts of a layout are chrome, and what the
  page margins should be, are the document's call. See
  [Print](https://cirthcss.github.io/cirth/utilities/print/).
- **`<meter>` is styled** (gh#59): the semantic sibling of `<progress>` —
  a measurement inside a known range rather than a task running to
  completion — had no styling at all and fell back to raw UA rendering
  beside a themed progress bar. It now borrows progress's frame outright
  (`--cirth-meter-background-color` and `--cirth-meter-border-color`
  default to progress's own tokens, so re-theming one re-themes the
  other), and paints the value in one of three colors depending on which
  region `low`/`high`/`optimum` put it in:
  `--cirth-meter-optimum-color`, `--cirth-meter-suboptimum-color`,
  `--cirth-meter-even-less-good-color` — the spec's own names, and the
  names the engines' pseudo-elements use. Green, amber, red, with the hue
  backed by weight: each step down the scale is a darker color in light
  and a lighter one in dark, so the signal survives a reader who can't
  separate the hues, and all three clear 3:1 against the track in both
  schemes. A meter with no thresholds is entirely optimum per the spec and
  renders as one flat green bar. Firefox needs
  `:-moz-meter-sub-optimum::-moz-meter-bar` where Blink and WebKit expose
  three value pseudo-elements, and Blink additionally lays the value out
  at half the track's height, centred, ignoring an author `height` — an
  8px meter filled 4px until `::-webkit-meter-inner-element` was made a
  flex container. `tests/meter.spec.js` pins all of it to pixels. See
  [Meter](https://cirthcss.github.io/cirth/components/meter/).
- **`prefers-contrast: more` support** (gh#34): the softer complement to
  the existing `forced-colors` handling — where forced-colors hands the
  palette to the operating system, this keeps Cirth's palette and stops
  spending it on subtlety, in both light and dark. Text reaches WCAG AAA
  (7:1 or better, 15:1 for body copy) against the surface it sits on and the
  six-step heading ramp collapses onto the body ink; muted text, code, and
  visited links climb from just over the AA floor to 8.7:1; hairlines and
  field borders clear the 3:1 non-text floor by a wide margin (in the dark
  scheme a card's border stops being its own background); link underlines
  drop their half-alpha tint; and focus rings turn fully opaque. Geometry is
  deliberately untouched: control height is computed from
  `--cirth-border-width`, so thickening borders here would silently resize
  every control. The `cobalt` and `coral` presets carry their own version
  of the pass at their own hues — a preset is loaded after the framework
  and redeclares the same tokens, so without one it would hand the
  strengthened values straight back. See
  [High contrast](https://cirthcss.github.io/cirth/utilities/high-contrast/).

### Fixed

- **A `:root` override now actually changes a color token** (gh#92): the
  customization path the documentation leads with — override
  `--cirth-*` from your own stylesheet, loaded after Cirth — silently did
  nothing for every color in the library. Loading order was never the
  problem: the schemes declared their tokens on
  `:root:not([data-theme="dark"])`, which weighs (0,2,0) against a plain
  `:root`'s (0,1,0), so the override lost on specificity. Foundation and
  style tokens (`--cirth-spacing`, `--cirth-border-radius`,
  `--cirth-font-family`, …) were unaffected and always worked, which is
  what made the gap so easy to miss. The parts of those selectors that
  only *choose* a scheme now sit inside `:where()`, leaving the scheme
  roots at the weight of a plain root, so source order decides again. Both
  presets get the same treatment, for the same reason one stylesheet
  further down the chain. Overrides already written against the old shape
  (`:root:not([data-theme="dark"])`, `[data-theme="dark"]`) are more
  specific still and keep working; a bare `:root` override now applies to
  both schemes, and
  [Customization](https://cirthcss.github.io/cirth/customization/#overriding-a-color-in-one-scheme-only)
  documents how to part them.

## [0.9.0] - 2026-08-16

### Added

- **Visited links get their own color** (gh#58): a followed content link
  drops the accent for the new `--cirth-link-visited-color`, a neutral
  reading of the palette defined in both schemes and in the `cobalt` and
  `coral` presets (verified at 4.5:1 or better against page and card
  backgrounds). Navigation entries, dropdown menus, `.secondary`/`.contrast`
  links, and the hover/focus/current states keep their own color: a menu
  that grays out one item at a time as the reader browses looks broken
  rather than oriented. The underline keeps its unvisited tint because
  browsers only let `:visited` change color-ish properties, never
  `text-decoration-color`.
- **Subresource Integrity on the documented CDN snippets** (gh#33): the
  jsDelivr `<link>` in the README and on Get Started now carries the
  `sha384` hash of the file it pins, plus `crossorigin="anonymous"`, so a
  CDN response that isn't the published stylesheet is refused by the
  browser. `npm run sri` rewrites the version pin and the hash together as
  a release step, `npm run check:sri` (part of `npm run lint`) keeps the
  snippets well-formed, and `npm run check:sri -- --from-cdn` verifies the
  documented hashes against the bytes jsDelivr actually serves. Nothing in
  the published CSS changes.

### Fixed

- **Nested lists no longer leave a gap before the next parent item**
  (gh#76): the rule that clears a nested list's bottom margin was written
  with `:where()` on both compounds, so it had zero specificity and always
  lost to the `dl, ol, ul` type selectors that give every list its bottom
  margin. It now uses `:is()` and actually applies, for every combination
  of nested `ul`/`ol`/`dl`. Top-level list spacing is unchanged.
- **Buttons with a long unbroken label stay inside their container**
  (gh#75): button-like controls cap at `max-width: 100%`, so a URL, token,
  or hash wraps inside the button instead of growing it past its container
  (~800px inside a 280px column before). A busy button (`aria-busy="true"`)
  wraps too: the nowrap that keeps a spinner beside its label would
  otherwise push the label straight back out.
- **Search fields inside a generic group match the group's corners**
  (gh#69): `[type="search"]` keeps its pill radius on its own and inside a
  `[role="search"]` group, but inside a generic `.group` it now inherits
  the group's radius. Its exposed corners (and the focus shadow tracing
  them) used to stay pill-round against the group's square ones.

## [0.8.5] - 2026-08-15

### Fixed

- **Date-like inputs now shrink inside grouped grid columns** (gh#70):
  date, datetime-local, month, time, and week controls now opt out of their
  native intrinsic minimum width, keeping paired ranges on one row in narrow
  grid columns across browser engines.
- **Nav dropdown menus stay anchored to their trigger in Firefox** (gh#72):
  nav dropdowns now establish a stable containing block for their absolutely
  positioned menu instead of allowing Firefox to size it against the viewport.
- **Hidden fields no longer break grouped-control corners** (gh#68):
  `.group` and `[role="search"]` now calculate their outer corners from the
  first and last visible items, ignoring `[hidden]` elements and
  `input[type="hidden"]`. Hidden form metadata can now appear before or after
  the visible controls without flattening the group's outer radius.
- **Native validation no longer produces misleading success states** (gh#83):
  automatic styling now reacts only to `:user-invalid`; `:user-valid`
  stays visually neutral unless the author explicitly sets
  `aria-invalid="false"`. Range inputs no longer gain a green validation ring
  after interaction, and required selects wait until they lose focus before
  showing a native invalid state. Explicit `aria-invalid` behavior is
  unchanged.

## [0.8.4] - 2026-08-13

### Fixed

- **Date/time inputs still showed two calendar icons on Firefox after
  0.8.3** (gh#79) — the 0.8.3 fix used a CSS rule with lower specificity
  than the rule it needed to override, so it silently never applied.
  Replaced with a different approach entirely: instead of deferring to
  Firefox's native icon on `date`/`datetime-local`, Cirth's own icon now
  shows consistently across every date/time field type, in every
  browser. Firefox paints its native icon via the element's `color`,
  decoupled from the field's actual text glyphs (repainted independently
  via the non-standard but Firefox-supported `-webkit-text-fill-color`),
  so `color: transparent` hides just the icon without hiding the text.

## [0.8.3] - 2026-08-12

### Fixed

- **Date/time inputs no longer show two calendar icons on Firefox**
  (gh#79) — the Firefox-only reset that hid our custom icon relied on
  `@-moz-document url-prefix()`, which Firefox restricted to
  `userContent.css`/`userChrome.css` since version 59 and silently
  ignores in an author stylesheet. Replaced with a real feature-detection
  query, since Firefox is the only current engine without
  `::-webkit-calendar-picker-indicator` support.
- **Coral and cobalt presets kept a light background in system dark
  mode** (gh#81) — both presets' dark mixin left the background tokens
  undeclared, relying on the base theme's dark value to fall through.
  But the preset's own light block shares the same CSS specificity as
  the base theme's dark media-query block, and since a preset loads
  after `cirth.min.css`, that tie was won by the preset's light
  background even with no `data-theme` set. Each preset now declares
  its own dark canvas explicitly.
- **A dropdown nested inside another open dropdown's menu could block
  clicks on the outer menu's own items** (gh#7) — the nested dropdown's
  full-viewport close-catcher is `position: fixed`, so it belongs to the
  outer menu's stacking context rather than the viewport it visually
  covers, and painted above the outer menu's non-positioned items
  regardless of DOM order or z-index. Only the outermost open dropdown
  renders a close-catcher now; it already handles outside-click-to-close
  for the whole nested chain.

### Changed

- Visual regression now runs across Firefox and WebKit in addition to
  Chromium, on top of the existing light/dark × desktop/mobile matrix.
  Cross-engine coverage would have caught the date-input and preset bugs
  above automatically instead of relying on manual bug reports. Doesn't
  touch the published package.

## [0.8.2] - 2026-08-11

### Fixed

- **`input[size]` no longer forced to full width** (gh#60) — the
  "Blocks, 100%" rule in `_basics.scss` overrode an explicit `size`
  attribute, the standard way to size a field to its expected content
  (a postcode, a short code, an OTP digit group). `size` now opts a
  text input out of the full-width default; inputs without it are
  unaffected.
- **Docs homepage hero rendered off-center on some viewports/browsers** —
  the hero wrapper combined `.container` (Cirth's own 3-track grid) and
  a custom `.docs-hero` grid on the same element; two competing
  `display: grid` declarations meant the hero's children were
  implicitly placed by whichever `grid-template-columns` happened to
  win. Nested instead of combined; verified centered in Chromium and
  WebKit.
- **Docs header/footer were narrower than the page content below them**
  — a previous fix widened only the docs `<main>`, leaving header and
  footer at the framework's default container width. `--cirth-
  container-max-width` now overrides once, site-wide, so all three
  measure identically.
- **Invalid-form submit hint no longer breaks WCAG AA contrast** — the
  visual "not ready yet" state on submit buttons of `:invalid` forms
  (introduced in 0.8.1) now uses luminance-preserving `filter:
  grayscale(1)` instead of `opacity`. A dimmed-but-clickable control has
  no disabled-state exemption under WCAG 1.4.3, and the opacity blend
  pushed the button below the 4.5:1 floor; grayscale keeps every
  theme-defined contrast ratio intact while still draining the "ready"
  color from the control.

### Changed

- **Docs code-block copy button restyled ghost and always visible** —
  no border, transparent until hover/focus, matching GitHub's code
  block convention instead of the previous bordered, hover-revealed
  button (gh#53's original fix; this refines the styling further,
  not a bug).
- **Docs site migrated from Astro to Eleventy** — same content, same
  routes, same dogfooded-CSS shell. Motivated by maintenance surface:
  Eleventy's dependency tree is a fraction of Astro's, its release
  cadence is far slower (3 breaking releases since 2017), and the docs
  need no client-side framework. The port also restores the
  hover-visible heading anchor permalinks lost in the VitePress→Astro
  migration (gh#54), fixes the copy-to-clipboard button styling on code
  blocks (gh#53), and re-adds the hero demo's missing layout wrapper on
  the homepage (gh#52). Docs pages now state the Apache-2.0 license
  (gh#77); the published npm metadata catches up at the next release.

## [0.8.1] - 2026-08-10

### Added

- **`:user-invalid`/`:user-valid` support for form validation styling**
  (gh#24) — text-like `input`/`select`/`textarea` now pick up the same
  border color, icon, focus ring, and helper-text color as
  `[aria-invalid]` once a field has been interacted with and the browser
  has checked it against its native constraints, with no JS setting the
  attribute. An explicit `aria-invalid` always takes priority. Degrades
  silently on browsers without support (Chrome/Edge < 119, Safari < 16.5).
- **Disabled-look for a submit button in an invalid form** (gh#25) — a
  submit-acting button (`[type="submit"]`, or a plain `button` with no
  `type`) inside a `form:invalid` drops to `--cirth-opacity-disabled`, but
  stays fully clickable/focusable (no `[disabled]`, no
  `pointer-events: none`), so a click still triggers the browser's native
  constraint-validation messages instead of doing nothing.

### Changed

- **Switch thumb color now follows `--cirth-primary-inverse`** (gh#26)
  instead of a hardcoded white, matching the token buttons use for their
  text. No visual change in the shipped theme (both resolve to white
  today, verified >= 3:1 against both switch tracks per WCAG 1.4.11); only
  matters if you customize `--cirth-primary-inverse`.
- **Breaking: the group component needs `.group` in the default build**
  (gh#19, upstream pico#430) — `[role="group"]` alone used to be the
  trigger for the joined-controls layout, which meant any element grouped
  purely for accessibility reasons (most notably an explicit `<fieldset
  role="group">`, where the role is redundant since a fieldset's implicit
  role is already `group`) got hijacked into decorative styling it never
  asked for, making a semantic group and a decorative one visually
  indistinguishable (WCAG 3.2.4, Consistent Identification). Add
  `class="group"` alongside `role="group"` to keep the layout; the role
  alone no longer triggers it. The classless build has no class to
  require, so it keeps `[role="group"]` as its sole opt-in but now
  excludes `fieldset` specifically. `[role="search"]` is unaffected.

## [0.8.0] - 2026-08-02

### Changed

- **Breaking: `.grid` now wraps; `.row` takes over its old behavior.**
  `.grid` used to promise a grid but deliver a single equal-column row
  (`minmax(0%, 1fr)` never wraps). If you were using `.grid` for that
  single-row behavior, rename it to `.row` — markup and behavior are
  unchanged, only the class name is. `.grid` itself is now an
  intrinsically responsive wrapping grid: `grid-template-columns:
  repeat(auto-fit, minmax(min(100%, var(--cirth-grid-min-column)), 1fr))`,
  new token `--cirth-grid-min-column` (default `12rem`). Columns follow
  available space and wrap onto new rows instead of squeezing into one;
  the old `md`-breakpoint media query is gone, replaced by `min()`
  collapsing to one column on narrow viewports for free.
- **Breaking: `.container`/`.container-fluid` repurposed as a fluid,
  gutter-permanent grid with a new `.breakout` utility.** `.container`'s
  five stepped breakpoints (510px–1450px) are gone, replaced by a
  three-track CSS grid — two gutter tracks (`--cirth-spacing`) that never
  drop out, and a center track holding content, capped at new token
  `--cirth-container-max-width` (default `60rem`) for `.container`,
  uncapped for `.container-fluid`. The cap resizes continuously with the
  viewport instead of snapping at breakpoints. New `.breakout` utility
  (`grid-column: 1 / -1`) lets a direct child of `.container` — a wide
  table, image, or figure — fill the container's own box instead of
  stopping at the measure; unlike the classic `100vw` trick, it escapes
  only to the container's own edges, so it stays correct inside layouts
  where the container itself isn't centered in the viewport (a sidebar
  shell, for example), and it doesn't have the `100vw` trick's
  scrollbar-gutter overflow bug. The classless build's `body >
  header/main/footer` (`layout/_landmarks.scss`) adopts the identical
  grid/token instead of its own separate stepped-width loop.

### Added

- **`.row`** class: single-row, equal-width columns — stacked below the
  `md` breakpoint, one row from `md` up. Same behavior `.grid` used to
  have, under an honest name. Classes build only.
- **`.breakout`** utility: see above. Classes build only.
- New custom properties: `--cirth-grid-min-column` (`.grid`'s minimum
  column width, default `12rem`) and `--cirth-container-max-width`
  (`.container`'s center-track cap, default `60rem`, also consumed by
  the classless landmarks grid).

## [0.7.0] - 2026-08-02

### Added

- **`.sr-only`** utility: visually hides content while keeping it in the
  accessibility tree (`position: absolute`, 1×1px, `clip-path:
  inset(50%)`, `overflow: hidden`, `white-space: nowrap`). Pairs with
  **`.sr-only-focusable`**, which reveals the element on
  `:focus`/`:focus-within` for skip-link patterns. Classes build only.
- **`.truncate`** utility: single-line `overflow: hidden` +
  `text-overflow: ellipsis` + `white-space: nowrap`. Classes build only.

### Fixed

- **`[hidden]` no longer breaks `hidden="until-found"`**: the reboot's
  blanket `display: none` disabled Chrome/Edge's find-in-page-revealed
  hidden state; now scoped with `:where(:not([hidden="until-found"]))`.
  The `template` selector was dropped from the same rule — UA
  stylesheets already handle it.
- **`::placeholder { opacity: 1 }`**: Firefox was lowering placeholder
  opacity on top of the already-muted color, double-fading it versus
  Chrome. The dead `::-webkit-input-placeholder` legacy alias was
  dropped alongside it.
- **Firefox focus outline restored on unstyled controls**: removed the
  inherited `:-moz-focusring { outline: none }` +
  `::-moz-focus-inner` padding hack, which was silently killing Firefox
  focus indication on anything Cirth doesn't restyle. The border-radius
  bug the hack originally worked around is long dead.
- **`::file-selector-button` used consistently**: the reboot layer
  still targeted the legacy `::-webkit-file-upload-button` alias while
  the rest of `src/` had already moved to the standard
  `::file-selector-button` pseudo-element (supported everywhere since
  ~2021).
- **`<small>` now actually renders at its intended size**: the
  `--cirth-font-size: 0.875em` custom property was set on `small` but
  never consumed as `font-size` on that same selector, so `<small>`
  silently fell back to the browser default `smaller` keyword (~83%)
  instead of the token's 0.875em. `font-size: var(--cirth-font-size)`
  now applies it.
- **`table { border-color: currentcolor }`**: guards against a
  Chrome/Safari inheritance bug for any future border added without an
  explicit color (today's cell borders already set one explicitly, so
  this is a latent-bug guard, not a visible change).
- **iOS Safari date/time input alignment**: `::-webkit-date-and-time-value`
  now inherits text alignment instead of forcing centered text, and
  `::-webkit-datetime-edit` drops its default vertical padding —
  fixes RTL/centering on `[type="date"]` and friends in Safari.

### Removed

- **Dead IE/legacy-browser rules purged** from the reboot layer,
  matching modern-normalize v3's cuts: the `-ms-touch-action`
  tap-delay block, `::-ms-expand` (both the global rule and the
  `<select>`-scoped one), `input { overflow: visible }`, `textarea {
  overflow: auto }`, `audio`/`video { display: inline-block }`,
  `audio:not([controls])` (iOS 4-7), `canvas { display: inline-block }`,
  `img { border-style: none }`, `svg:not(:root)`/`:not(:host) {
  overflow: hidden }`, `[type="checkbox"]`/`[type="radio"] { padding:
  0 }`, `button { overflow: visible }`, `select { text-transform: none
  }`, `-ms-overflow-style` on `pre`, the IE-specific parts of the
  `legend` reset (kept `padding: 0`), and the IE-only `display:
  inline-block` on `progress` (kept `vertical-align: baseline`; Cirth's
  own rules already set `display: inline-block` unconditionally).
  Measurable size-budget win in the same commit.

## [0.6.0] - 2026-08-02

### Changed

- **Docs site rebuilt on Astro instead of VitePress.** No change to the
  published CSS package — this is docs-site infrastructure only. Same
  content, same "carta e incisione" branding, same dogfooded CSS shell;
  the site now ships near-zero client JS (Astro's islands hydrate only
  the two genuinely interactive bits — the dark-mode toggle and the
  homepage's typing demo — instead of hydrating the whole page as a
  Vue SPA). Content moved from `docs/**/*.md` to `docs/src/pages/**/*.mdx`
  (routes unchanged); contributor-facing links in `README.md` and
  `.github/CONTRIBUTING.md` updated to match.
- **RTL support: physical direction properties migrated to logical
  properties.** Every `margin-left`/`padding-right`/`border-left`-style
  declaration in `src/` now uses the logical equivalent
  (`margin-inline`, `padding-inline-end`, `border-inline-start`,
  `inset-inline-start`, `border-start-start-radius` and friends,
  `text-align: start`/`end`) across container, landmarks, table,
  blockquote, forms (basics, date, file), card, group, nav, modal,
  dropdown, and accordion. Properties with no logical form inside the
  Browserslist floor — `float`, directional `background-position`, and
  the dropdown marker's `translateX` — are mirrored under `[dir="rtl"]`
  overrides instead (`float: inline-end` needs Chrome 118; the floor is
  Chrome 111). LTR rendering is pixel-identical: the full visual
  regression suite (164 screenshots) passes unchanged against
  pre-migration baselines. RTL verified on a hand-checked smoke page
  (breadcrumb, blockquote, card, table, form controls including
  validation icons, group, dropdown, accordion, modal). Tooltip
  `data-placement="left"/"right"` intentionally stays physical — the
  attribute names a physical side.
- **The loading spinner always matches the text color** (upstream
  #643): it's now the icon SVG applied as a mask over `currentColor`
  instead of a background image with a baked-in stroke color, so it
  adapts to every button variant, colored surface, and color scheme —
  including `.contrast` buttons in dark mode, where the old
  white-forcing `filter` inversion was exactly wrong. Forced-colors
  mode paints it in a system color. The now-obsolete
  `$loading-icon-inverse` build flag is removed.

### Added

- **`<var>` is styled** (upstream #696): italic monospace in the code
  color, without the inline-code chip background.
- **Busy button-like inputs show the spinner** (upstream #693):
  `<input type="submit"/"button"/"reset">` can't render
  pseudo-elements, so `aria-busy="true"` paints the spinner as a
  background icon at the line start (mirrored in RTL).
- **Helper `<small>` works inside groups** (upstream #700, #540): a
  `small` inside `[role="group"]`/`[role="search"]` drops below the
  row as a full-width muted helper line instead of joining it as a
  squeezed column, wherever it sits in the markup; the control before
  a trailing `small` keeps the group's end rounding (squared in
  Firefox < 121, which lacks `:has()`).
- **Groups work inside `nav`** (upstream #699): they size to their
  content and drop the stacking margin, sitting on the nav's rhythm.

### Fixed

- **Table cells no longer paint the page background** (upstream #497):
  `th`/`td` are transparent and inherit the surface they sit on — a
  table inside a card no longer shows paper-colored cells on the white
  sheet.
- **`--cirth-text-underline-offset` works again** (upstream #531): the
  hardcoded `0.125em` on links is gone; links inherit the token
  (`0.15em`) like the rest of the document.
- **Modal content can reach the bottom of mobile viewports** (upstream
  #514): `max-height` now uses `100dvh` (with the `100vh` fallback), so
  mobile Safari's collapsing URL bar no longer hides the footer.
- **`<a role="button">` aligns correctly inside `nav`** (upstream #568):
  it no longer picks up the link rule's negative margins on top of the
  button padding rule.
- **Group inputs keep their `aria-invalid` border while a sibling
  button has focus** (upstream #536).
- **Card `header`/`footer` reset their last child's bottom margin**
  (upstream #611), matching the modal's existing behavior — no more
  extra space under a button in a card footer.
- **Form controls placed directly in a `.grid` no longer double-space
  rows** (upstream #738): their stacking `margin-bottom` is dropped in
  favor of the grid's `row-gap`.
- **An explicit `img height` attribute is respected** (upstream #513)
  when it's the only dimension given; with both attributes present,
  `height: auto` keeps preserving the attribute-derived aspect ratio on
  responsive downscale.
- **Dropdown `<label>` items fill their row** (upstream #691): labels
  get the same row treatment as links, so the clickable area matches
  the visual row.
- **Blockquote no longer draws a border on both sides in RTL**
  (upstream #650): the physical `border-left` fallback that coexisted
  with `border-inline-start` is gone.
- **Breadcrumb divider now mirrors in RTL** (upstream #734): the
  inherited rule targeted `::after` with a descendant combinator (it
  never
  matched the divider) and hardcoded a `\` on top of it. Removed
  entirely — the default `>` divider has the Unicode Bidi_Mirrored
  property, so RTL rendering flips it to `<` on its own.
- **Modal mirrors in RTL** (upstream #661): the close control's
  `float: right` gets a `[dir="rtl"]` override, the footer uses
  `text-align: end`, and header/footer spacings are logical.
- **Dropdown mirrors in RTL** (upstream #671): the submenu anchors with
  `inset-inline-start: 0` (which also covers the old `ul[dir="rtl"]`
  special case, now removed) and the trigger marker's float, chevron
  position, and translate compensation flip under `[dir="rtl"]`.
- **Group corner rounding mirrors in RTL** (upstream #591): first/last
  child radii (including the `[role="search"]` pill) use logical corner
  properties.
- **Textarea validation icon in RTL** now sits at the top corner
  (`top left`) instead of inheriting the generic `center left`
  override meant for single-line inputs.
- **Date/time input calendar icon mirrors to the left in RTL** (it
  stayed on the right before, overlapping the text).

## [0.5.0] - 2026-07-19

### Fixed

- **Scoped builds no longer leak rules outside `.cirth`.** Five selector
  groups rendered unscoped in `cirth.scoped.css` /
  `cirth.classless.scoped.css` and could style markup outside the
  opt-in subtree: `.container`/`.container-fluid`, `.grid` (and its
  children), the `:where(nav li)::before` list-semantics reboot, and the
  `[type="reset"].outline` members of the outline button groups.
- **Classless builds no longer ship the `.striped` table class.** A
  missing `$` in `_table.scss` (`@if enable-classes` — a truthy string,
  not the flag) emitted the striped-table rules in every build.

### Added

- **Build smoke tests** (`scripts/check-dist.js`, `npm run check:dist`,
  in CI after the build): all 12 dist files re-parse with Lightning CSS
  and are non-empty; classless builds emit no class selectors (the
  `.cirth` wrapper excepted in the scoped variant); scoped builds keep
  every rule inside the `.cirth` subtree; presets touch only custom
  properties on theme roots. The scoping and classless leaks above are
  what its first run caught.
- **Visual regression testing** (`tests/visual.spec.js`,
  `npm run check:visual`): Playwright screenshot-diff of every built
  docs page — full-page, light and dark, at 1440px and 390px (164
  shots) — against per-platform baselines in `tests/__screenshots__/`
  (font rendering differs between macOS and Linux, so each platform
  compares against its own set; regenerate deliberately with
  `npm run check:visual:update`). The docs demos double as visual
  coverage of every component. Baselines are stored in Git LFS; the
  Linux set CI compares against is regenerated and, if anything
  differs, committed automatically by the new `update-visual-baselines`
  workflow on every push that could affect rendering — self-healing
  both a first-time bootstrap and a partial change, no manual baseline
  deletion needed. That commit lands as a separate, later push, so
  `check:visual` in CI can fail against a not-yet-updated Linux
  baseline on the same push as a deliberate visual change; the
  follow-up bot commit resolves it. CI fetches only the Linux LFS
  objects, cached by content, so steady-state runs consume no LFS
  bandwidth.
- **Accessibility audit in CI** (`scripts/check-a11y.js`,
  `npm run check:a11y`): axe-core (WCAG 2.x A/AA rules) over every
  built docs page in both color schemes via Playwright, failing on any
  violation not in the committed baseline
  (`scripts/a11y-baseline.json`) — which starts, and currently stays,
  empty: the 26 violations the first run found were all fixed (code
  blocks made keyboard-focusable with a visible focus ring, the empty
  loading-demo button labeled, dark-scheme contrast raised for code
  comments and the homepage compare counters, and the customization
  demo's custom accent given a dark-scheme variant that keeps AA).

### Changed

- **Light theme canvas is now warm paper, and cards are sheets.** The
  light `--cirth-background-color` moved from pure white to `$paper`
  (`oklch(97.4% 0.008 69.35deg)` — white pulled faintly toward the brand
  hue), and `--cirth-card-background-color` is now true white instead of
  aliasing the page background, so an `<article>` reads as a sheet lying
  on the page. The docs site previously created this look with
  site-local overrides; it now comes from the framework itself.
  - WCAG AA re-verified against the new canvas: all text tokens hold
    ≥ 4.5:1 and focus rings/switch tracks hold ≥ 3:1 on paper. Two
    non-text tokens needed one darker scale step to keep their 3:1
    claim: `--cirth-form-element-border-color` and
    `--cirth-progress-border-color` moved from `$neutral-400` (2.92:1 on
    paper) to `$neutral-450` (3.47:1).
  - Presets carry the same canvas concept in their own hue: `cobalt`
    gets a cool near-white page, `coral` a blush one, both with white
    cards. Coral's light `--cirth-primary-focus` alpha rose 0.7 → 0.75
    (0.7 composites to 2.99:1 on its paper).
- **Larger display scale for `h1`**: `clamp(2rem, …, 2.75rem)` →
  `clamp(2.25rem, 1.7rem + 2.2vw, 3.5rem)` — the page title is a
  reference-manual display moment, matching the docs redesign.

## [0.4.0] - 2026-07-10

### Changed

- Refreshed the README around the new brand mark and current project
  direction: removed the comparison, Pico-differences, and roadmap sections;
  added contribution guidance and updated project links.
- **Design modernization pass** (visual only — the WCAG 2.2 AA work below
  is untouched: no color, contrast, or focus-ring change):
  - **Breaking:** the responsive root-font-size escalation (100% → 131.25%
    across breakpoints, inherited from Pico) is gone; `--cirth-font-size`
    is a fixed `100%`. Headings scale fluidly via `clamp()` instead, so
    display type keeps its presence on large screens while body text and
    control heights stay stable. The `root-font-size` keys were removed
    from `$breakpoints`.
  - Buttons and text inputs are now exactly **44px tall** at the default
    font size (WCAG 2.5.5 target size), built entirely from on-scale
    tokens: `--cirth-form-element-spacing-vertical` is `--cirth-space-2`
    (0.5rem) and controls use the relaxed line-height (1.625 → 26px text
    box), so 26 + 2×8 + 2×1 = 44. Because the root font no longer scales,
    that height holds at every viewport width.
  - Airier vertical rhythm between text sections: the space above a
    heading that follows a block (`--cirth-typography-spacing-top`) went
    up one scale step per level — h2 `space-10` → `space-12` (3rem),
    h3 `space-8` → `space-10` (2.5rem), h4–h6 `space-6`/`space-8` →
    `space-8` (2rem).
  - **Spacing-scale audit**: every spacing value in the library now lands
    on the `--cirth-space-*` scale (0.25rem steps to 1.5, 0.5 steps to 3,
    then whole rems). Snapped: heading `--cirth-typography-spacing-top`
    values (now space-10/8/6 for h2–h6), label margins, inline code and
    `<mark>` padding, the search input's icon offsets (now derived from
    `--cirth-form-element-spacing-horizontal`), and card header/footer
    padding (now `block-spacing − space-2`).
  - Radii now vary with depth instead of being uniform: the default
    `--cirth-border-radius` went from `4px` to `8px` (buttons, inputs),
    cards/modals use `12px`, and checkboxes and inline code stay at `4px`.
    The new per-component radii (`--cirth-card-border-radius`,
    `--cirth-checkbox-border-radius`, `--cirth-code-border-radius`) are
    derived from `--cirth-border-radius`, which stays the single knob:
    cobalt's `0` still squares everything, coral's `--cirth-radius-2xl`
    still rounds everything proportionally.
  - Typography: negative letter-spacing on `h1`–`h3` (new
    `--cirth-letter-spacing-tight`/`-snug` tokens), `text-wrap: balance`
    on headings and `text-wrap: pretty` on paragraphs, `h4`–`h6` dropped
    from bold to semibold, tables render numbers with `tabular-nums`.
  - Buttons: semibold label, slightly wider horizontal padding
    (`--cirth-space-5`), and a static 1px pressed offset on `:active`.
  - Motion: the shared `--cirth-transition` easing moved from `ease-in-out`
    to `ease-out`; cards get `--cirth-space-6` padding.
- **Breaking:** unified the two parallel font-family token sets into one.
  `src/theme/_foundations.scss` is now the single source for every font
  stack: `--cirth-font-family-emoji`, `-sans` (which now embeds the emoji
  fallback directly), `-serif`, `-mono`, and `-display`. The duplicate
  legacy names Cirth inherited from Pico — `--cirth-font-family-sans-serif`,
  `--cirth-font-family-monospace` — and the intermediate
  `--cirth-font-family-ui` are gone; `--cirth-font-family` now reads
  `var(--cirth-font-family-sans)` and code elements read
  `var(--cirth-font-family-mono)`. If you overrode one of the removed
  names, override the short-suffix token instead.
- Documented how `data-theme` differs between builds: unscoped builds honor
  the attribute on any ancestor, scoped builds only on the `.cirth` element
  itself or inside it (see Customization → Light and dark).
- **WCAG 2.2 AA pass** across both schemes and both presets (every ratio
  verified mathematically from the oklch sources):
  - Focus rings now composite to >= 3:1 against the page background
    (1.4.11): the `--cirth-*-focus` alphas went from 0.25–0.5 up to
    0.5–0.75, and cobalt/coral's focus tokens were re-derived the same way.
  - Focus survives Windows High Contrast: every box-shadow-based focus ring
    now also sets a transparent `outline`, which forced-colors mode repaints
    with a system color (previously `outline: none` + stripped box-shadow
    left keyboard focus invisible there).
  - Buttons show their focus ring on `:focus-visible` instead of `:focus`,
    matching links — no more ring on mouse click.
  - Form element borders meet 3:1 against both the field and the page
    (1.4.11): light `$neutral-150` → `$neutral-400`, dark `$neutral-800` →
    `$neutral-550`; the light valid-state border moved `$success-400` →
    `$success-450` for the same reason. Checkbox/radio borders follow along
    since they read the same token.
  - Switch off-state track now meets 3:1 against the page background:
    light `$neutral-200` → `$neutral-450`, dark `$neutral-750` →
    `$neutral-550`.
  - Dark progress bar is `$amber-450` instead of the primary background:
    amber-550 only reached 2.8:1 against the neutral-850 track. The
    progress track also gained a delimiting border (new
    `--cirth-progress-border-color` token) so the component's extent
    meets 3:1 against the page while the track fill stays subtle.
  - Checkboxes, radios, and switches grew from 1.25em to 1.5em tall (24px
    at the default root size — the WCAG 2.5.8 minimum target size);
    the switch keeps its 1.8:1 proportion at 2.7em wide.
  - `cobalt` dark: `--cirth-primary` moved from `$cobalt-550` (3.3:1 as
    link text — a 1.4.3 failure) to `$cobalt-400` (5.4:1), with a new
    `$cobalt-300` hover step.
  - Documented the tooltip pattern's accessibility limits (keyboard
    reachability, screen readers, Esc dismissal — WCAG 1.4.13) and when to
    reach for a JS/Popover-API tooltip instead.

### Removed

- **Breaking:** dropped the never-consumed `--cirth-shadow-*` scale
  (`-none`/`-xs`…`-xl`/`-inner`) and the `--cirth-letter-spacing-*` scale
  (whose `tight` and `normal` steps were both `0`). No component ever read
  them; shadows are driven by the semantic `--cirth-box-shadow` /
  `--cirth-card-box-shadow` / `--cirth-dropdown-box-shadow` tokens, which
  are unchanged. Publishing unwired tokens as API would have made them
  breaking to remove after 1.0.

- **Breaking:** renamed the primary brand accent scale from `$azure-*` to
  `$amber-*` and repointed every lightness step at the brand mark's own hue
  (69.35deg), recomputed with the same 85%-of-max-in-gamut-chroma method
  already used for the other accent scales — so the theme's primary color
  and the logo are the same color by construction. `--cirth-primary` and
  friends keep their names; only the underlying Sass scale and the theme's
  name changed, from azure to amber.
- Pointed the previously unused `--cirth-font-family-display` token at
  `--cirth-font-family-serif` and switched headings (`h1`–`h6`) to read it
  instead of `--cirth-font-family`. Body text, buttons, and form elements
  are untouched — still `--cirth-font-family` (sans by default) — so this
  is a heading-only typographic accent, still zero network requests.
  `cobalt` and `coral` each now also set `--cirth-font-family-display` to
  their own font stack, so their headings stay on-brand instead of falling
  back to the new default serif.
- Redesigned the docs homepage around the new mark: a dark hero and footer
  (scoped with `data-theme="dark"`, so they reuse Cirth's own dark tokens
  instead of hardcoding colors), an eyebrow label, a real stats row (build
  size, zero JS, built-in color schemes, license), small stroke icons on
  each feature card, and a three-column footer. No new images — just the
  theme's own tokens plus a CSS radial-gradient wash of the primary color.
- **Breaking:** `jade` and `slate` are no longer full, independently built
  themes. Cirth now ships a single official theme (amber) plus two optional
  presets — stylesheets under `dist/presets/` that override an existing set
  of CSS custom properties, meant to be loaded after the main stylesheet:
  - `cobalt` (replacing `slate`) — corporate: deep navy primary,
    cool-toned neutrals, a crisp flat shadow, a business-like
    Arial/Helvetica font stack, denser spacing, snappier motion, and square
    corners (`--cirth-border-radius` / `--cirth-radius-pill` set to `0`).
  - `coral` (replacing `jade`) — playful: vivid warm primary, warm-toned
    neutrals, a soft coral-tinted glow shadow with a matching button-hover
    lift, a friendly Trebuchet MS font stack, looser spacing, bouncy
    motion, and extra-rounded corners (`--cirth-border-radius` set to
    `--cirth-radius-2xl`).

  Removed the per-theme build matrix (`dist/cirth.jade.min.css`,
  `dist/cirth.classless.scoped.slate.min.css`, ...) and
  `scripts/build-themes.js` in favor of `scripts/build-presets.js`.
  Like the default theme, presets stick to fonts that ship with every major
  OS — no `@import`, no webfont — so nothing in Cirth makes a network
  request beyond the stylesheets themselves.
- Preset output moved into the main build folder: `dist/presets/*.css`
  instead of a separate top-level `presets/` directory, and presets now go
  through the same Lightning CSS transform and minify passes as every other
  build (so `dist/presets/cobalt.min.css` exists too). The
  `@cirthcss/cirth/presets/cobalt` / `.../presets/coral` export subpaths
  keep working and now resolve to the minified files; only deep paths that
  spelled out the old location (e.g. a CDN URL ending in
  `/presets/cobalt.css`) need updating to `/dist/presets/cobalt.min.css`.
- **Breaking:** flattened `src/themes/base/` and `src/themes/default/` into
  a single `src/theme/` directory — the one place that now defines Cirth's
  official design tokens (foundation scales, semantic tokens, light/dark
  color schemes). The old two-level split (`base/` shared logic vs.
  `default/` the one theme built on it) only made sense when multiple
  themes shared `base/`; with a single theme it was dead weight. Not a
  public API change (SCSS sources aren't published), but relevant if you
  vendor or patch the source.
- Extracted every `oklch()` color scale used by `src/theme/_light.scss` /
  `_dark.scss` (previously redeclared independently in each file) into a
  new `src/theme/_colors.scss`, the single source for the theme's palette.
  Renamed the scales used for status colors from their hue ($red-500,
  $jade-450, $amber-100/50) to the role they actually play ($error-*,
  $success-*, $warning-*), and gave error/success/warning the same
  eight-step ladder as `$amber-*` instead of one or two hardcoded shades.
- **Fixed:** invalid/valid form borders, form validation icons, and
  `<ins>`/`<del>` text were rendering the wrong hue (purple/magenta instead
  of red, blue/cyan instead of green) in the compiled CSS. The cause:
  deriving them via `color.mix()` in oklch space against a near-gray
  neutral (`$zinc-350`, `$slate-600`, …) — a color whose hue is
  essentially undefined at that low a chroma interpolates unpredictably
  against a saturated color's real hue. Replaced every such mix with a
  direct step from the new error/success scales instead, which also
  removes the dependency on an unrelated neutral family for these tokens.
  `<mark>`'s highlight background now derives from the new `$warning-*`
  scale (a single `color.change()` on one shade, no cross-color mixing)
  instead of the old `$amber-100`/`$amber-50` pair.
- Merged `src/theme/_color-schemes.scss` (the generic light/dark
  switching mixin) into `src/theme/_schemes.scss`, the one place that
  actually uses it. `cobalt` and `coral` no longer depend on it either:
  since presets always compile unscoped, each now hardcodes its own plain
  `:root`/`:host` + `prefers-color-scheme` block instead of going through
  the `$parent-selector`-aware helper — simpler, and one less internal
  dependency for a file meant to be self-contained.
- Updated the `package.json` `exports` map: removed the `./jade` / `./slate`
  sub-path families and added `./presets/cobalt`, `./presets/coral`, and
  `./presets/*`. `files` now also includes `presets`.
- Removed `scripts/check-theme-docs.js` (and its `npm run lint` /
  `lint:fix` wiring), which existed to keep the multi-theme build matrix in
  sync with docs; there is no longer a per-theme build surface for it to
  check.

## [0.3.0] - 2026-07-06

### Added

- VitePress documentation site (`docs/`), styled with Cirth's own default
  build.
- A `package.json` `exports` map with named sub-paths for every published
  build (`@cirthcss/cirth/jade`, `@cirthcss/cirth/classless/scoped`, ...)
  alongside the existing `dist/*.css` paths.
- A README "Comparison" section positioning Cirth against Pico CSS and
  Tailwind CSS.
- This changelog.

### Changed

- **Breaking:** reduced the inherited 20-accent theme set to three
  maintained themes — azure (default), jade, and slate — each a complete,
  self-contained theme rather than an accent swap. The other 17 theme
  builds (amber, blue, cyan, fuchsia, green, grey, indigo, lime, orange,
  pink, pumpkin, purple, red, sand, violet, yellow, zinc) are no longer
  generated or published. Cuts the generated build matrix from 80 files to
  12 and the published npm tarball from ~19MB to ~3MB unpacked.
- Made the default theme's Sass structure consistent with jade/slate by
  removing the now-redundant color-mapping indirection
  (`default/_theme-colors.scss`) and inlining azure's values directly. No
  change to the compiled output.
- Reworded the README status badge from "early stabilization" to "active
  development" and dropped the completed theme-reduction item from the
  roadmap.
- Expanded `.gitignore` coverage for local AI assistant tooling.

## [0.2.0] - 2026-06-13

### Added

- Contribution templates and build tooling documentation.

### Changed

- Refined CSS build variants and scoped output.
- Finalized the source and build directory structure.
- Rewrote README.md for public presentation.
- Updated GitHub Actions to the Node 24 runtime.

### Fixed

- Checkbox rendering issues inherited from the fork base.

## [0.1.0] - 2026-06-07

Initial public release under the `@cirthcss/cirth` npm scope.

### Added

- Forked from [Pico CSS](https://picocss.com) under the `--cirth-` custom
  property prefix and `@cirthcss/cirth` package name.
- Release artifacts published on version tags and a manual npm publish
  workflow.
- CDN link documentation and contribution guidance.

[Unreleased]: https://github.com/cirthcss/cirth/compare/v0.10.0...master
[0.10.0]: https://github.com/cirthcss/cirth/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/cirthcss/cirth/compare/v0.8.5...v0.9.0
[0.8.5]: https://github.com/cirthcss/cirth/compare/v0.8.4...v0.8.5
[0.8.4]: https://github.com/cirthcss/cirth/compare/v0.8.3...v0.8.4
[0.8.3]: https://github.com/cirthcss/cirth/compare/v0.8.2...v0.8.3
[0.8.2]: https://github.com/cirthcss/cirth/compare/v0.8.1...v0.8.2
[0.8.1]: https://github.com/cirthcss/cirth/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/cirthcss/cirth/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/cirthcss/cirth/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/cirthcss/cirth/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/cirthcss/cirth/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/cirthcss/cirth/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/cirthcss/cirth/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/cirthcss/cirth/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/cirthcss/cirth/releases/tag/v0.1.0
