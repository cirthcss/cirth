# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Cirth is pre-1.0 and the custom property surface is not yet stable — see the
[roadmap](README.md#roadmap).

## [Unreleased]

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

- Reduced the inherited 20-accent theme set to three maintained themes —
  azure (default), jade, and slate — each a complete, self-contained theme
  rather than an accent swap. Cuts the generated build matrix from 80 files
  to 12.
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

[Unreleased]: https://github.com/cirthcss/cirth/compare/v0.2.0...develop
[0.2.0]: https://github.com/cirthcss/cirth/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/cirthcss/cirth/releases/tag/v0.1.0
