# About Cirth

## Philosophy

Cirth is a semantic-first CSS framework. Standard HTML elements should carry
most of the structure, meaning, and styling burden before a class is needed.

Core principles:

- Style semantic HTML by default.
- Use classes only where HTML semantics are not enough.
- Keep layout primitives small and structural.
- Avoid utility-first class soup and broad component catalogs.
- Keep customization based on CSS custom properties.

## Differences from Pico CSS

Cirth began as a fork of [Pico CSS](https://picocss.com), but it should be
treated as an independent framework rather than a promise of permanent
drop-in compatibility.

The most important user-facing differences are:

- Cirth uses the `@cirthcss/cirth` package name and the `--cirth-` CSS custom
  property prefix.
- The published package is CSS-only; SCSS is repository source, not a public
  Sass API.
- The active build set is focused on default, classless, scoped, and scoped
  classless CSS.
- Scoped builds target a `.cirth` wrapper, including custom properties,
  document styles, color schemes, and modal states.
- Standalone color utility builds and fluid classless builds are not part of
  the public build surface.
- The inherited 20-accent theme set has been reduced to three maintained
  themes — azure (default), jade, and slate — see [Colors](/colors).

## Roadmap

Cirth is still in early stabilization. The main public priorities are:

- stabilize the CSS custom property surface;
- audit inherited Pico CSS bugs and keep the fixes relevant to Cirth;
- refine layout primitives and decide which utilities should remain;
- document the supported build variants and migration notes from Pico CSS.

## Project docs

- Contribution workflow: [`.github/CONTRIBUTING.md`](https://github.com/cirthcss/cirth/blob/develop/.github/CONTRIBUTING.md)
- Build and package details: [Build tooling](/build-tooling)

## License

Licensed under the [MIT License](https://github.com/cirthcss/cirth/blob/develop/LICENSE.md).
