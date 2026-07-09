# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Cirth is pre-1.0 and the custom property surface is not yet stable — see the
[roadmap](README.md#roadmap).

## [Unreleased]

### Changed

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

[Unreleased]: https://github.com/cirthcss/cirth/compare/v0.3.0...develop
[0.3.0]: https://github.com/cirthcss/cirth/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/cirthcss/cirth/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/cirthcss/cirth/releases/tag/v0.1.0
