<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/logo-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset=".github/logo-light.svg">
    <img alt="Cirth" src=".github/logo-light.svg" width="112" height="112">
  </picture>
</p>

<h1 align="center">Cirth</h1>

<p align="center">
  <strong>Semantic by default. Classes only when needed.</strong>
</p>

<p align="center">
  Semantic-first CSS for production-ready interfaces with clean HTML,
  modern CSS, and minimal class noise.
</p>

<p align="center">
  <a href="#quickstart">Quickstart</a>
  ·
  <a href="#usage">Usage</a>
  ·
  <a href="#philosophy">Philosophy</a>
  ·
  <a href="#differences-from-pico-css">Differences</a>
  ·
  <a href="#customization">Customization</a>
  ·
  <a href="#roadmap">Roadmap</a>
  ·
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <a href="https://github.com/cirthcss/cirth/actions/workflows/ci.yml">
    <img alt="CI" src="https://github.com/cirthcss/cirth/actions/workflows/ci.yml/badge.svg">
  </a>
  <a href="https://github.com/cirthcss/cirth/releases">
    <img alt="GitHub Release" src="https://img.shields.io/github/v/release/cirthcss/cirth?include_prereleases">
  </a>
  <img alt="Status" src="https://img.shields.io/badge/status-early%20stabilization-orange">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue">
</p>

## Quickstart

Pick one of the available builds, include it in your page, and write semantic
HTML.

### CDN

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/cirthcss/cirth@v0.1.0/dist/cirth.min.css">
```

Release archives are available from
[GitHub Releases](https://github.com/cirthcss/cirth/releases).

### npm

The npm package is prepared as `@cirthcss/cirth`, but it is waiting for the
first publish with npm 2FA.

```sh
npm install @cirthcss/cirth
```

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@cirthcss/cirth@0.1.0/dist/cirth.min.css">
```

### Local Build

```sh
npm install
npm run build
```

```html
<link rel="stylesheet" href="dist/cirth.min.css">
```

Then write ordinary semantic HTML:

```html
<main class="container">
  <header>
    <h1>Project dashboard</h1>
    <p>Review active work and recent changes.</p>
  </header>

  <section>
    <h2>Open items</h2>
    <article>
      <h3>Release checklist</h3>
      <p>Confirm build output, documentation, and browser coverage.</p>
      <button type="button">Review</button>
    </article>
  </section>
</main>
```

## Usage

Start with semantic HTML. Add classes only when the HTML element cannot express
the structure by itself.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light dark">
    <link rel="stylesheet" href="dist/cirth.min.css">
    <title>Cirth example</title>
  </head>
  <body>
    <main class="container">
      <nav>
        <ul>
          <li><strong>Product</strong></li>
        </ul>
        <ul>
          <li><a href="/docs">Docs</a></li>
          <li><a href="/account">Account</a></li>
        </ul>
      </nav>

      <article>
        <h1>Settings</h1>
        <form>
          <label>
            Email
            <input type="email" name="email" autocomplete="email">
          </label>
          <button type="submit">Save</button>
        </form>
      </article>
    </main>
  </body>
</html>
```

### Available Builds

The main generated files are:

| File | Purpose |
| --- | --- |
| `dist/cirth.min.css` | Default semantic build. |
| `dist/cirth.classless.min.css` | Classless build for pages with even less markup. |
| `dist/cirth.scoped.min.css` | Scoped build for embedding Cirth under `.cirth`. |
| `dist/cirth.classless.scoped.min.css` | Scoped classless build. |

Theme-specific builds are still present in `dist/`, for example
`dist/cirth.slate.min.css` and `dist/cirth.classless.slate.min.css`.
The theme set is planned to be reduced and cleaned up.

### Classless Usage

The classless builds style `body > header`, `body > main`, and
`body > footer` as page containers. They are useful when you want the smallest
possible markup surface:

```html
<link rel="stylesheet" href="dist/cirth.classless.min.css">
```

### Scoped Usage

The scoped builds style only markup inside a `.cirth` container. They are useful
when embedding Cirth into an existing page, CMS, widget, or application shell
where global element selectors would be too broad.

```html
<link rel="stylesheet" href="dist/cirth.scoped.min.css">

<div class="cirth">
  <article>
    <h1>Settings</h1>
    <button type="button">Save</button>
  </article>
</div>
```

## Philosophy

Cirth is a semantic-first CSS framework. Standard HTML elements should carry
most of the structure, meaning, and styling burden before a class is needed.

The framework should stay minimal in markup, not limited in production usage.
It should support real applications, dashboards, forms, documentation, and
product interfaces without pushing users toward utility-first class soup or a
large component catalog.

Core principles:

- Style semantic HTML by default.
- Use classes only where HTML semantics are not enough.
- Keep class APIs focused on layout primitives, scoped variants, and specific
  practical needs.
- Avoid utility-first class soup.
- Avoid Bootstrap-like component bloat.
- Keep the public API based on modern CSS and CSS custom properties.
- Use SCSS as internal build infrastructure while keeping the public API
  CSS-first.
- Prefer clear source organization over automated churn.

## Why This Fork Exists

Cirth began as a fork because Pico CSS had a strong foundation: semantic HTML,
low class noise, and a CSS-first customization model.

The fork exists to give that foundation a different direction:

- Make independent API decisions instead of preserving drop-in compatibility
  forever.
- Clean up and modernize the repository structure and build pipeline.
- Fix inherited bugs that still matter for Cirth's own behavior.
- Keep the semantic-first approach while making the framework more deliberate
  for production interfaces.
- Add only the primitives and base components that fit the project's
  philosophy.

The goal is not to reject the starting point. It is to keep the parts that
still serve the project and change the parts that make Cirth harder to
maintain, document, or use in real products.

## Differences From Pico CSS

Cirth started from Pico CSS, but it is no longer trying to preserve every
upstream package, build, or API decision. The main differences are:

- The project identity, package metadata, and CSS custom property prefix now
  belong to Cirth: `@cirthcss/cirth` and `--cirth-`.
- The public package surface is CSS-only. SCSS remains repository source and
  build infrastructure, not a published Sass API.
- The generated build surface is smaller: default, classless, scoped, and
  scoped classless builds, plus theme variants while the theme system is being
  reviewed.
- Scoped builds target a `.cirth` wrapper, including root custom properties,
  document resets, color schemes, and modal states.
- Standalone color utility builds and fluid classless builds have been removed
  from the active build set.
- Generated `dist/` files are not committed to Git. They are rebuilt locally,
  in CI, for release artifacts, and for npm publishing.
- The build toolchain is npm-only and uses local Node scripts,
  `sass-embedded`, Lightning CSS, Prettier, and Stylelint.
- Source entry points are limited to top-level `src/cirth*.scss` files. Other
  SCSS files are internal modules.
- Contribution docs, build-tooling docs, and issue/PR templates are maintained
  as part of the repository workflow.

Cirth should be treated as an independent framework with Pico CSS roots, not
as a permanent drop-in replacement for Pico CSS.

## Customization

The public customization surface is CSS-first. Override CSS custom properties
in your own stylesheet after loading the framework.

The CSS variable prefix is `--cirth-`.

```css
:root {
  --cirth-font-family: Inter, system-ui, sans-serif;
  --cirth-primary: #2563eb;
  --cirth-primary-background: #2563eb;
  --cirth-primary-border: #2563eb;
  --cirth-border-radius: 0.375rem;
  --cirth-spacing: 1rem;
}
```

Common variables include typography, color, spacing, borders, form controls,
grid gaps, and color scheme values. The generated CSS in `dist/cirth.css` is
the most reliable reference for the currently available variables.

## Layout Primitives

Cirth keeps classes focused on structural needs that HTML cannot express
alone.

Current layout primitives include:

- `.container` for a centered responsive viewport.
- `.container-fluid` for a full-width padded viewport.
- `.grid` for a simple responsive auto-layout grid.
- `.overflow-auto` for scrollable overflow areas.

Some interaction patterns are styled through semantic elements and ARIA roles
rather than broad component classes, including `nav`, `article`, `details`,
`dialog`, `progress`, `[role="group"]`, `[role="search"]`,
`[aria-busy="true"]`, and `[data-tooltip]`.

## Project Structure

- `src/` contains the SCSS source.
- `dist/` contains generated CSS output and is not committed to Git.
- `scripts/` contains the local build and watch scripts.
- `docs/` contains contributor and maintainer documentation.

Only these top-level source entry points are compiled directly:

- `src/cirth.scss`
- `src/cirth.classless.scss`
- `src/cirth.scoped.scss`
- `src/cirth.classless.scoped.scss`

## Build And Tooling

Cirth uses npm as its package manager. Yarn, Composer, pnpm, and Bun are not
part of the current workflow.

For the detailed build and dependency policy, see
[`docs/build-tooling.md`](docs/build-tooling.md).

The main scripts are:

```sh
npm run build
npm run dev
npm run format
npm run lint
npm run lint:fix
```

The build pipeline:

1. Formats SCSS with Prettier.
2. Lints SCSS with Stylelint.
3. Cleans generated CSS from `dist/`.
4. Compiles top-level `src/cirth*.scss` entry points with `sass-embedded`.
5. Generates theme variants.
6. Runs Lightning CSS transforms.
7. Generates minified CSS.

SCSS remains internal build infrastructure. The public API should stay usable
from plain CSS through compiled stylesheets and CSS custom properties.

The npm package ships compiled CSS from `dist/` only. SCSS source files remain
available in the repository for development, but they are not part of the
published package surface.

GitHub Actions currently provide:

- `CI`, which runs on pushes, pull requests, and manual dispatch. It installs
  dependencies, lints SCSS, builds CSS, checks the npm package contents, and
  verifies that tracked files stay clean after the build.
- `Package`, which runs on version tags and manual dispatch. It builds CSS,
  creates the npm package tarball, and uploads both `dist/` and the package as
  workflow artifacts. On tags, it also creates a GitHub Release.
- `Publish npm`, which runs manually and publishes the package to npm when the
  repository has a valid `NPM_TOKEN` secret.

## Contributing

The issue tracker is the primary public channel currently enabled. Issues are
welcome for bugs, documentation improvements, tooling questions, API proposals,
utility class review, component ideas, and theme cleanup.

Pull requests are welcome when they are focused and easy to review. Larger
changes should start with an issue so the direction can be discussed before
implementation.

GitHub issue templates are available for bug reports, documentation work, API
proposals, and tooling changes. Pull requests use a short template with the
expected summary, change type, notes, and local verification checklist.

See [`.github/CONTRIBUTING.md`](.github/CONTRIBUTING.md) for the contribution
workflow and [`docs/build-tooling.md`](docs/build-tooling.md) for the detailed
build and dependency policy.

## Roadmap

Cirth is evolving toward a smaller, more deliberate public API. This roadmap
tracks the areas that still affect users and contributors.

### CSS API

- [ ] Audit known Pico CSS bugs and fix the ones still relevant to Cirth.
- [ ] Add focused regression checks where fixed bugs need long-term
  protection.
- [ ] Stabilize the CSS custom property surface.
- [ ] Review classless and scoped builds for long-term maintainability.

### Layout Primitives

- [ ] Review current layout primitives as structural API, including
  `.container`, `.container-fluid`, `.grid`, and `.overflow-auto`.
- [ ] Keep layout primitives small, predictable, and separate from utility
  classes.
- [ ] Document when a layout primitive should be used instead of plain semantic
  HTML.

### Utility Classes

- [ ] Define a utility class policy separately from layout primitives.
- [ ] Keep only a small, intentional set of utilities for real gaps not covered
  by semantic HTML or CSS custom properties.
- [ ] Add new utilities only when they solve repeated production needs without
  encouraging utility-first markup.

### Themes

- [ ] Reduce the current Pico-derived color themes to the default theme plus
  three or four maintained example themes.
- [ ] Treat bundled themes as examples and customization bases, not as an
  exhaustive palette API.
- [ ] Document CSS variable overrides as the primary path for adapting Cirth to
  a project's visual language.

### Components

- [ ] Define lean base components built around semantic HTML and ARIA
  patterns.
- [ ] Keep component APIs narrow and avoid turning Cirth into a large component
  catalog.

### Documentation

- [ ] Document the supported build variants and when to choose each one.
- [ ] Add migration notes for users coming from Pico CSS once the public API is
  stable enough to compare clearly.

## Origins

Cirth began as a fork of Pico CSS. It keeps the semantic-first starting point,
but it is evolving into an independent CSS framework with its own tooling,
structure, and API decisions.

It should not be treated as a promise of permanent drop-in compatibility.

## License

Licensed under the [MIT License](LICENSE.md).
