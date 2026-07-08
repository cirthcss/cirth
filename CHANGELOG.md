# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Cirth is pre-1.0 and the custom property surface is not yet stable — see the
[roadmap](README.md#roadmap).

## [Unreleased]

### Changed

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
  their own webfont, so their headings stay on-brand instead of falling
  back to the new default serif.
- **Breaking:** `jade` and `slate` are no longer full, independently built
  themes. Cirth now ships a single official theme (amber) plus two optional
  presets — stylesheets under `presets/` that override an existing set of
  CSS custom properties, meant to be loaded after the main stylesheet:
  - `cobalt` (replacing `slate`) — corporate: deep navy primary,
    cool-toned neutrals, a crisp flat shadow, the IBM Plex Sans webfont,
    denser spacing, snappier motion, and square corners
    (`--cirth-border-radius` / `--cirth-radius-pill` set to `0`).
  - `coral` (replacing `jade`) — playful: vivid warm primary, warm-toned
    neutrals, a soft coral-tinted glow shadow with a matching button-hover
    lift, the Fredoka webfont, looser spacing, bouncy motion, and
    extra-rounded corners (`--cirth-border-radius` set to
    `--cirth-radius-2xl`).

  Removed the per-theme build matrix (`dist/cirth.jade.min.css`,
  `dist/cirth.classless.scoped.slate.min.css`, ...) and
  `scripts/build-themes.js` in favor of `scripts/build-presets.js`.
- Each preset now `@import`s its webfont from [Bunny Fonts](https://fonts.bunny.net)
  (a no-tracking Google Fonts alternative), with `display=swap` so text
  isn't invisible while the font downloads. This is a deliberate, preset-only
  exception to Cirth otherwise making no network requests of its own — the
  main theme stays dependency-free.
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
