# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Cirth is pre-1.0 and the custom property surface is not yet stable.

## [Unreleased]

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

[Unreleased]: https://github.com/cirthcss/cirth/compare/v0.5.0...master
[0.5.0]: https://github.com/cirthcss/cirth/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/cirthcss/cirth/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/cirthcss/cirth/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/cirthcss/cirth/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/cirthcss/cirth/releases/tag/v0.1.0
