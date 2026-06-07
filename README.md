<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/logo-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset=".github/logo-light.svg">
    <img alt="Cirth" src=".github/logo-light.svg" width="96" height="96">
  </picture>
</p>

<h1 align="center">Cirth</h1>

<p align="center">
  <strong>Semantic by default. Classes only when needed.</strong>
</p>

Cirth is a semantic-first CSS framework for building production-ready interfaces
with clean HTML, modern CSS, and minimal class noise.

It starts from a simple idea: good HTML should already look and behave like a
usable interface. Classes are still useful, but they should solve real gaps in
HTML semantics instead of becoming the main way every element is described.

## Contents

- [Contents](#contents)
- [Project philosophy](#project-philosophy)
- [Why this fork exists](#why-this-fork-exists)
- [Where Cirth is going](#where-cirth-is-going)
- [Installation](#installation)
- [Basic usage](#basic-usage)
- [Customization with CSS variables](#customization-with-css-variables)
- [Layout primitives](#layout-primitives)
- [Project structure](#project-structure)
- [Build and tooling](#build-and-tooling)
- [Roadmap](#roadmap)
  - [Completed foundation](#completed-foundation)
  - [Repository and contributions](#repository-and-contributions)
  - [Stabilization](#stabilization)
  - [Layout primitives](#layout-primitives-1)
  - [Utility classes](#utility-classes)
  - [Themes](#themes)
  - [Components](#components)
- [Origins](#origins)
- [License](#license)

## Project philosophy

Cirth is built around semantic HTML first. Standard elements should carry most of
the structure, meaning, and styling burden before a class is needed.

The framework should stay minimal in markup, not limited in production usage.
That means Cirth can support real applications, dashboards, forms, documentation,
and product interfaces without pushing users toward utility-first class soup or
large component catalogs.

Core principles:

- Style semantic HTML by default.
- Use classes only where HTML semantics are not enough.
- Keep class APIs focused on layout primitives, scoped variants, and specific
  practical needs.
- Avoid utility-first class soup.
- Avoid Bootstrap-like component bloat.
- Keep the public API based on modern CSS and CSS custom properties.
- Use SCSS as internal build infrastructure, while keeping the public API
  CSS-first.
- Prefer clear source organization over automated churn.

## Why this fork exists

Cirth began as a fork because Pico CSS had a strong foundation: semantic HTML,
low class noise, and a CSS-first customization model.

The fork exists to give that foundation a different direction:

- Make independent API decisions instead of preserving drop-in compatibility
  forever.
- Clean up and modernize the repository structure and build pipeline.
- Fix inherited bugs that still matter for Cirth's own behavior.
- Keep the semantic-first approach while making the framework more deliberate
  for production interfaces.
- Add only the primitives and base components that fit the project's philosophy.

The goal is not to reject the starting point. It is to keep the parts that still
serve the project and change the parts that make Cirth harder to maintain,
document, or use in real products.

## Where Cirth is going

Cirth is moving toward a compact, production-ready CSS framework with a stable
CSS-first public API.

The intended direction is:

- semantic defaults for common HTML elements;
- a small set of layout primitives;
- a careful utility layer that remains intentionally limited;
- lean base components built around semantic HTML and ARIA patterns;
- predictable customization through CSS custom properties;
- a smaller build toolchain that contributors can understand quickly.

Cirth should feel quiet and practical: easy to read in markup, easy to override
in CSS, and restrained enough that projects can build their own product language
on top of it.

## Installation

This repository currently ships built CSS files in `dist/`. Use the local build
artifacts directly:

```html
<link rel="stylesheet" href="dist/cirth.min.css">
```

Available base builds include:

- `dist/cirth.min.css`
- `dist/cirth.classless.min.css`
- `dist/cirth.fluid.classless.min.css`
- `dist/cirth.conditional.min.css`
- `dist/cirth.colors.min.css`

Theme-specific builds are also available in `dist/`, for example
`dist/cirth.slate.min.css` and `dist/cirth.classless.slate.min.css`.

For local development, install dependencies with npm and rebuild the CSS:

```sh
npm install
npm run build
```

To rebuild when SCSS files change:

```sh
npm run dev
```

## Basic usage

Start with semantic structure, then add layout classes only where they clarify
the interface.

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
  </body>
</html>
```

The classless builds style `body > header`, `body > main`, and `body > footer`
as page containers, so they can be useful when you want even less markup:

```html
<link rel="stylesheet" href="dist/cirth.classless.min.css">
```

## Customization with CSS variables

The public customization surface is CSS-first. Override CSS custom properties in
your own stylesheet after loading the framework.

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
grid gaps, and color scheme values. The generated CSS in `dist/cirth.css` is the
most reliable reference for the currently available variables.

## Layout primitives

Cirth keeps classes focused on structural needs that HTML cannot express alone.

Current layout primitives include:

- `.container` for a centered responsive viewport.
- `.container-fluid` for a full-width padded viewport.
- `.grid` for a simple responsive auto-layout grid.
- `.overflow-auto` for scrollable overflow areas.

Some interaction patterns are styled through semantic elements and ARIA roles
rather than broad component classes, including `nav`, `article`, `details`,
`dialog`, `progress`, `[role="group"]`, `[role="search"]`,
`[aria-busy="true"]`, and `[data-tooltip]`.

## Project structure

- `src/` contains the SCSS source.
- `dist/` contains generated CSS output.
- `scripts/` contains the local build and watch scripts.
- `package-use.md` explains the current tooling choices for contributors.

Key source entry points:

- `src/cirth.scss`
- `src/cirth.classless.scss`
- `src/cirth.fluid.classless.scss`
- `src/cirth.conditional.scss`
- `src/cirth.colors.scss`

## Build and tooling

Cirth uses npm as its package manager. Yarn and Composer are not part of the
current workflow.

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
3. Compiles source files with `sass-embedded`.
4. Generates theme variants.
5. Runs Lightning CSS transforms.
6. Generates minified CSS.

SCSS remains internal build infrastructure. The public API should stay usable
from plain CSS through compiled stylesheets and CSS custom properties.

GitHub Actions currently provide:

- `CI`, which runs on pushes, pull requests, and manual dispatch. It installs
  dependencies, lints SCSS, builds CSS, and checks that generated files are up
  to date.
- `Package`, which runs on version tags and manual dispatch. It builds CSS,
  creates the npm package tarball, and uploads both `dist/` and the package as
  workflow artifacts. It does not publish automatically.

## Roadmap

Cirth is close to a more stable repository shape, but it is still evolving
incrementally. The plan is to strengthen the project without turning it into a
different kind of framework.

The roadmap is grouped by area so layout primitives, utility classes, themes,
and components remain separate decisions.

### Completed foundation

- [x] Rename the project identity and package metadata around Cirth.
- [x] Remove Yarn and Composer from the active workflow.
- [x] Reduce Node dependencies and move CSS processing to Lightning CSS.
- [x] Replace `sass` with `sass-embedded`.
- [x] Replace `npm-run-all` and `nodemon` with local build/watch scripts.
- [x] Move source files to `src/` and generated output to `dist/`.
- [x] Add Prettier and Stylelint conventions for SCSS.
- [x] Document the current dependency and build policy in `package-use.md`.
- [x] Add GitHub Actions for CI and package artifacts.

### Repository and contributions

- [ ] Finalize the repository organization and source/build structure.
- [ ] Prepare contribution docs and issue/PR workflows once the structure is
  stable, before all framework work is finished.
- [ ] Accept contributions beyond bug fixes, including documentation, tests,
  tooling cleanup, API review, proposals, and implementation work.
- [ ] Decide when generated `dist/` should stop being committed and move fully
  to CI, release artifacts, or package publishing.

### Stabilization

- [ ] Audit known Pico CSS bugs and fix the ones still relevant to Cirth.
- [ ] Add focused regression checks where fixed bugs need long-term protection.
- [ ] Stabilize the CSS custom property surface.

### Layout primitives

- [ ] Review current layout primitives as structural API, including
  `.container`, `.container-fluid`, `.grid`, and `.overflow-auto`.
- [ ] Keep layout primitives small, predictable, and separate from utility
  classes.
- [ ] Document when a layout primitive should be used instead of plain semantic
  HTML.

### Utility classes

- [ ] Define a utility class policy separately from layout primitives.
- [ ] Keep only a small, intentional set of utilities for real gaps not covered
  by semantic HTML or CSS custom properties.
- [ ] Add new utilities only when they solve repeated production needs without
  encouraging utility-first markup.

### Themes

- [ ] Reduce the current 19 Pico-derived color themes to the default theme plus
  three or four maintained example themes.
- [ ] Treat bundled themes as examples and customization bases, not as an
  exhaustive palette API.
- [ ] Document CSS variable overrides as the primary path for adapting Cirth to a
  project's visual language.
- [ ] Review classless, fluid, and conditional builds for long-term
  maintainability.

### Components

- [ ] Define lean base components built around semantic HTML and ARIA patterns.
- [ ] Keep component APIs narrow and avoid turning Cirth into a large component
  catalog.

The issue tracker is the primary channel for bugs and concrete proposals while
the repository organization is still settling.

## Origins

Cirth began as a fork of Pico CSS. It keeps the semantic-first starting point,
but it is evolving into an independent CSS framework with its own tooling,
structure, and API decisions.

It should not be treated as a promise of permanent drop-in compatibility.

## License

Licensed under the [MIT License](LICENSE.md).
