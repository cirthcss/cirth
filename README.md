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
  <a href="#builds">Builds</a>
  ·
  <a href="#customization">Customization</a>
  ·
  <a href="#documentation">Documentation</a>
  ·
  <a href="#browser-support">Browser support</a>
  ·
  <a href="#philosophy">Philosophy</a>
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

Include one stylesheet and write ordinary semantic HTML.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@cirthcss/cirth@0.2.0/dist/cirth.min.css">
```

```html
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
```

The npm package name is `@cirthcss/cirth`.

```sh
npm install @cirthcss/cirth
```

```js
import "@cirthcss/cirth/dist/cirth.min.css";
```

Release archives are available from
[GitHub Releases](https://github.com/cirthcss/cirth/releases).

## Builds

The main generated stylesheets are:

| File | Purpose |
| --- | --- |
| `dist/cirth.min.css` | Default semantic build. |
| `dist/cirth.classless.min.css` | Classless build for pages with even less markup. |
| `dist/cirth.scoped.min.css` | Scoped build for embedding Cirth under `.cirth`. |
| `dist/cirth.classless.scoped.min.css` | Scoped classless build. |

Theme-specific builds are also generated, for example
`dist/cirth.slate.min.css` and `dist/cirth.classless.slate.min.css`. The theme
set is still being reviewed and will likely become smaller. See
[Colors](docs/colors.md) for the full accent color list.

### Classless

The classless build styles `body > header`, `body > main`, and `body > footer`
as page containers.

```html
<link rel="stylesheet" href="dist/cirth.classless.min.css">
```

### Scoped

The scoped build styles only markup inside a `.cirth` container. It is useful
when embedding Cirth into an existing page, CMS, widget, or application shell.

```html
<link rel="stylesheet" href="dist/cirth.scoped.min.css">

<div class="cirth">
  <article>
    <h1>Settings</h1>
    <button type="button">Save</button>
  </article>
</div>
```

## Customization

Cirth is CSS-first. Override custom properties in your own stylesheet after
loading the framework.

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

For scoped builds, put the overrides on the scoped root:

```css
.cirth {
  --cirth-font-family: Inter, system-ui, sans-serif;
  --cirth-primary: #2563eb;
}
```

The generated CSS in `dist/cirth.css` is the most reliable reference for the
current custom property surface. The [Customization](docs/customization.md)
page covers the token layers, color groups, and light/dark switching in
detail.

## Documentation

The full documentation lives in [`docs/`](docs/) as a
[VitePress](https://vitepress.dev) site with live examples. The site itself
is styled with Cirth's own default build — the header, sidebar, prose, and
every demo are ordinary semantic HTML dogfooding the framework.

Run it locally:

```sh
npm install
npm run docs:dev
```

- **Getting started** —
  [Get Started](docs/get-started.md) ·
  [Customization](docs/customization.md) ·
  [Colors](docs/colors.md) ·
  [About Cirth](docs/about.md)
- **Layout** —
  [Document](docs/layout/document.md) ·
  [Landmarks](docs/layout/landmarks.md) ·
  [Section](docs/layout/section.md) ·
  [Container](docs/layout/container.md) ·
  [Grid](docs/layout/grid.md) ·
  [Overflow auto](docs/layout/overflow-auto.md)
- **Content** —
  [Typography](docs/content/typography.md) ·
  [Link](docs/content/link.md) ·
  [Button](docs/content/button.md) ·
  [Table](docs/content/table.md) ·
  [Code](docs/content/code.md) ·
  [Figure](docs/content/figure.md) ·
  [Embedded content](docs/content/embedded.md) ·
  [Misc](docs/content/misc.md)
- **Forms** —
  [Overview](docs/forms/index.md) ·
  [Checkbox, radio, switch](docs/forms/checkbox-radio-switch.md) ·
  [Input color](docs/forms/input-color.md) ·
  [Input date](docs/forms/input-date.md) ·
  [Input file](docs/forms/input-file.md) ·
  [Input range](docs/forms/input-range.md) ·
  [Input search](docs/forms/input-search.md)
- **Components** —
  [Accordion](docs/components/accordion.md) ·
  [Card](docs/components/card.md) ·
  [Dropdown](docs/components/dropdown.md) ·
  [Group](docs/components/group.md) ·
  [Loading](docs/components/loading.md) ·
  [Modal](docs/components/modal.md) ·
  [Nav](docs/components/nav.md) ·
  [Progress](docs/components/progress.md) ·
  [Tooltip](docs/components/tooltip.md)
- **Utilities** —
  [Accessibility](docs/utilities/accessibility.md) ·
  [Reduce motion](docs/utilities/reduce-motion.md)
- **Project** —
  [Build tooling](docs/build-tooling.md) ·
  [Contributing](.github/CONTRIBUTING.md)

## Browser Support

Cirth is designed and tested for the latest stable Chrome, Edge, Firefox,
and Safari releases. The compiled CSS is processed with Lightning CSS
against the Browserslist [`defaults`](https://browsersl.ist/#q=defaults)
query (roughly: the last two versions of each major browser, everything
above 0.5% global usage, and Firefox ESR). No version of Internet Explorer
is supported.

## Philosophy

Cirth is a semantic-first CSS framework. Standard HTML elements should carry
most of the structure, meaning, and styling burden before a class is needed.

Core principles:

- Style semantic HTML by default.
- Use classes only where HTML semantics are not enough.
- Keep layout primitives small and structural.
- Avoid utility-first class soup and broad component catalogs.
- Keep customization based on CSS custom properties.

## Differences From Pico CSS

Cirth began as a fork of Pico CSS, but it should be treated as an independent
framework rather than a promise of permanent drop-in compatibility.

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
- The inherited theme set is being reduced toward a smaller group of maintained
  examples.

## Roadmap

Cirth is still in early stabilization. The main public priorities are:

- stabilize the CSS custom property surface;
- audit inherited Pico CSS bugs and keep the fixes relevant to Cirth;
- refine layout primitives and decide which utilities should remain;
- reduce and document the theme set;
- document the supported build variants and migration notes from Pico CSS.

## License

Licensed under the [MIT License](LICENSE.md).
