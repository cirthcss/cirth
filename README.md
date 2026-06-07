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

It styles standard HTML elements by default, then uses classes where native HTML
semantics are not enough: mainly layout primitives, scoped variants, and focused
project needs.

## Contents

- [Core Principles](#core-principles)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Customization With CSS Variables](#customization-with-css-variables)
- [Layout Primitives](#layout-primitives)
- [Project Structure](#project-structure)
- [Build And Tooling](#build-and-tooling)
- [Roadmap](#roadmap)
- [Origins](#origins)
- [License](#license)

## Core Principles

- Semantic HTML should be styled by default.
- Classes should be used only when HTML semantics are not enough.
- Class-based APIs should focus on layout primitives and specific project needs.
- Avoid utility-first class soup.
- Avoid Bootstrap-like component bloat.
- Keep the public API based on modern CSS and CSS custom properties.
- Use SCSS as internal build infrastructure, while keeping the public API CSS-first.
- Keep markup minimal without limiting production use.

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

## Basic Usage

Cirth is designed around ordinary HTML. Start with semantic structure, then add
layout classes only where they clarify the interface.

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

## Customization With CSS Variables

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

## Layout Primitives

Cirth keeps classes focused on structural needs that HTML cannot express alone.

Current layout primitives include:

- `.container` for a centered responsive viewport.
- `.container-fluid` for a full-width padded viewport.
- `.grid` for a simple responsive auto-layout grid.
- `.overflow-auto` for scrollable overflow areas.

```html
<main class="container">
  <section class="grid">
    <article>
      <h2>Build</h2>
      <p>Compile CSS from the SCSS source files.</p>
    </article>

    <article>
      <h2>Review</h2>
      <p>Check generated files and documentation before shipping.</p>
    </article>
  </section>
</main>
```

Some interaction patterns are styled through semantic elements and ARIA roles
rather than broad component classes, including `nav`, `article`, `details`,
`dialog`, `progress`, `[role="group"]`, `[role="search"]`,
`[aria-busy="true"]`, and `[data-tooltip]`.

## Project Structure

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

## Build And Tooling

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

## Roadmap

Cirth is evolving incrementally. The goal is to make the framework cleaner,
smaller, and more production-ready without rewriting everything for its own
sake.

Planned work includes:

- Modernizing and simplifying the toolchain, keeping the build reproducible and
  avoiding dependencies that only replace small local scripts.
- Reviewing known issues inherited from the Pico CSS codebase and fixing them as
  part of Cirth's own stabilization work.
- Reviewing and selectively expanding utility classes, while keeping them few,
  intentional, and mostly focused on layout or practical gaps in HTML.
- Creating lean base components built around semantic HTML and ARIA patterns,
  without turning the framework into a large component catalog.
- Stabilizing the public CSS variable surface and documenting API decisions as
  the project moves toward a clearer independent direction.

The issue tracker is the primary channel for bugs and concrete proposals while
the repository organization is still settling.

## Origins

Cirth began as a fork of Pico CSS. It keeps the semantic-first starting point,
but it is evolving into an independent CSS framework with its own tooling,
structure, and API decisions.

It should not be treated as a promise of permanent drop-in compatibility.

## License

Licensed under the [MIT License](LICENSE.md).
