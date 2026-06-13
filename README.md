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
| `dist/cirth.fluid.classless.min.css` | Classless build with fluid page containers. |
| `dist/cirth.conditional.min.css` | Conditional build for scoped adoption. |
| `dist/cirth.colors.min.css` | Color utilities and custom property output. |

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
- `package-use.md` explains the current tooling choices for contributors.

Only these top-level source entry points are compiled directly:

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

The repository is still moving toward a stable internal organization, so the
contribution workflow is intentionally simple for now.

The issue tracker is the primary public channel currently enabled. Issues are
welcome for bugs, documentation improvements, tooling questions, API proposals,
utility class review, component ideas, and theme cleanup.

Pull requests are welcome when they are focused and easy to review. Larger
changes should start with an issue so the direction can be discussed before
implementation.

See [`.github/CONTRIBUTING.md`](.github/CONTRIBUTING.md) for the current
contribution notes.

## Roadmap

Cirth is close to a more stable repository shape, but it is still evolving
incrementally. The goal is to strengthen the framework without turning it into
a different kind of project.

### Foundation

- [x] Rename the project identity and package metadata around Cirth.
- [x] Move source files to `src/` and generated output to `dist/`.
- [x] Remove Yarn and Composer from the active workflow.
- [x] Reduce Node dependencies and move CSS processing to Lightning CSS.
- [x] Replace `sass` with `sass-embedded`.
- [x] Replace `npm-run-all` and `nodemon` with local build/watch scripts.
- [x] Add Prettier and Stylelint conventions for SCSS.
- [x] Document the current dependency and build policy in `package-use.md`.

### Release And Distribution

- [x] Prepare package metadata for `@cirthcss/cirth`.
- [x] Add GitHub Actions for CI and package artifacts.
- [x] Add a manual npm publish workflow.
- [x] Create the first GitHub release.
- [x] Provide a working CDN URL through the GitHub release tag.
- [x] Publish the package to npm as `@cirthcss/cirth`.
- [x] Decide when generated `dist/` should stop being committed and move fully
  to CI, release artifacts, or package publishing.

### Repository And Contributions

- [x] Add initial contribution notes.
- [x] Keep the issue tracker as the primary public channel while Discussions
  are disabled.
- [x] Finalize the repository organization and source/build structure.
- [ ] Add any missing issue or pull request templates after the repo structure
  settles.
- [ ] Accept contributions beyond bug fixes, including documentation, tests,
  tooling cleanup, API review, proposals, and implementation work.

### Stabilization

- [ ] Audit known Pico CSS bugs and fix the ones still relevant to Cirth.
- [ ] Add focused regression checks where fixed bugs need long-term
  protection.
- [ ] Stabilize the CSS custom property surface.

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
- [ ] Review classless, fluid, and conditional builds for long-term
  maintainability.

### Components

- [ ] Define lean base components built around semantic HTML and ARIA
  patterns.
- [ ] Keep component APIs narrow and avoid turning Cirth into a large component
  catalog.

## Origins

Cirth began as a fork of Pico CSS. It keeps the semantic-first starting point,
but it is evolving into an independent CSS framework with its own tooling,
structure, and API decisions.

It should not be treated as a promise of permanent drop-in compatibility.

## License

Licensed under the [MIT License](LICENSE.md).
