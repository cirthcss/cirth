<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/public/logo_brand_app_dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="docs/public/logo_brand_app.svg">
    <img alt="Cirth" src="docs/public/logo_brand_app.svg" width="120" height="120">
  </picture>
</p>

<h1 align="center">Cirth</h1>

<p align="center">
  <strong>Write HTML. It's already styled.</strong>
</p>

<p align="center">
  Semantic-first CSS where standard elements carry the styling: nav,
  article, button, table. Classes exist only for the few things HTML can't
  say.
</p>

<p align="center">
  <a href="#quickstart">Quickstart</a>
  ·
  <a href="#builds">Builds</a>
  ·
  <a href="#presets">Presets</a>
  ·
  <a href="#customization">Customization</a>
  ·
  <a href="#documentation">Documentation</a>
  ·
  <a href="#contributing">Contributing</a>
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
  <img alt="Status" src="https://img.shields.io/badge/status-active%20development-blue">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue">
</p>

## Quickstart

Include one stylesheet and write ordinary semantic HTML.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@cirthcss/cirth@0.8.0/dist/cirth.min.css">
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

All four builds share Cirth's one official theme (amber), with light and
dark variants. `cobalt` and `coral` are optional presets, not separate theme
builds — see [Presets](#presets) below and [Colors](docs/src/pages/colors.mdx).

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

## Presets

`cobalt` and `coral` are optional presets: stylesheets that override an
existing set of custom properties (color, shadow, type, spacing, motion) on
top of the default theme. They're worked examples of restyling the system,
not independently maintained themes — load one after the main stylesheet.

- **`cobalt`** — corporate: deep navy primary, cool-toned neutrals, a flat
  shadow, a business-like Arial/Helvetica font stack, denser spacing,
  snappier motion, square corners.
- **`coral`** — playful: vivid warm primary, warm-toned neutrals, a soft
  coral-tinted glow shadow, a friendly Trebuchet MS font stack, looser
  spacing, bouncy motion, extra-rounded corners.

Like the default theme, presets stick to fonts that ship with every major
OS — no `@import`, no webfont, zero network requests.

```html
<link rel="stylesheet" href="dist/cirth.min.css">
<link rel="stylesheet" href="dist/presets/cobalt.min.css">
```

```js
import "@cirthcss/cirth/presets/cobalt";
```

See [Colors](docs/src/pages/colors.mdx) for what each preset changes.

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
current custom property surface. The [Customization](docs/src/pages/customization.mdx)
page covers the token layers, color groups, and light/dark switching in
detail.

## Documentation

The full documentation is published at
[cirthcss.github.io/cirth](https://cirthcss.github.io/cirth/), built from
[`docs/`](docs/) as an [Astro](https://astro.build) site with live
examples. The site itself is styled with Cirth's own default build — the
header, sidebar, prose, and every demo are ordinary semantic HTML dogfooding
the framework.

Run it locally:

```sh
npm install
npm run docs:dev
```

- **Getting started** —
  [Get Started](docs/src/pages/get-started.mdx) ·
  [Customization](docs/src/pages/customization.mdx) ·
  [Colors](docs/src/pages/colors.mdx) ·
  [About Cirth](docs/src/pages/about.mdx)
- **Layout** —
  [Document](docs/src/pages/layout/document.mdx) ·
  [Landmarks](docs/src/pages/layout/landmarks.mdx) ·
  [Section](docs/src/pages/layout/section.mdx) ·
  [Container](docs/src/pages/layout/container.mdx) ·
  [Grid](docs/src/pages/layout/grid.mdx) ·
  [Overflow auto](docs/src/pages/layout/overflow-auto.mdx)
- **Content** —
  [Typography](docs/src/pages/content/typography.mdx) ·
  [Link](docs/src/pages/content/link.mdx) ·
  [Button](docs/src/pages/content/button.mdx) ·
  [Table](docs/src/pages/content/table.mdx) ·
  [Code](docs/src/pages/content/code.mdx) ·
  [Figure](docs/src/pages/content/figure.mdx) ·
  [Embedded content](docs/src/pages/content/embedded.mdx) ·
  [Misc](docs/src/pages/content/misc.mdx)
- **Forms** —
  [Overview](docs/src/pages/forms/index.mdx) ·
  [Checkbox, radio, switch](docs/src/pages/forms/checkbox-radio-switch.mdx) ·
  [Input color](docs/src/pages/forms/input-color.mdx) ·
  [Input date](docs/src/pages/forms/input-date.mdx) ·
  [Input file](docs/src/pages/forms/input-file.mdx) ·
  [Input range](docs/src/pages/forms/input-range.mdx) ·
  [Input search](docs/src/pages/forms/input-search.mdx)
- **Components** —
  [Accordion](docs/src/pages/components/accordion.mdx) ·
  [Card](docs/src/pages/components/card.mdx) ·
  [Dropdown](docs/src/pages/components/dropdown.mdx) ·
  [Group](docs/src/pages/components/group.mdx) ·
  [Loading](docs/src/pages/components/loading.mdx) ·
  [Modal](docs/src/pages/components/modal.mdx) ·
  [Nav](docs/src/pages/components/nav.mdx) ·
  [Progress](docs/src/pages/components/progress.mdx) ·
  [Tooltip](docs/src/pages/components/tooltip.mdx)
- **Utilities** —
  [Accessibility](docs/src/pages/utilities/accessibility.mdx) ·
  [Reduce motion](docs/src/pages/utilities/reduce-motion.mdx)
- **Project** —
  [Examples](docs/src/pages/examples.mdx) ·
  [Contributions](docs/src/pages/contributions.mdx) ·
  [Brand](docs/src/pages/brand.mdx) ·
  [Changelog](CHANGELOG.md)

## Contributing

Start with [Contributions](docs/src/pages/contributions.mdx). It explains the local
setup, the source layout, the package exports, and the project constraints
that matter most when changing Cirth.

For pull requests, issue triage, and the exact collaboration workflow, read
[`.github/CONTRIBUTING.md`](.github/CONTRIBUTING.md). If your change touches
the visual identity, check [Brand](docs/src/pages/brand.mdx) first; if it changes the
public package surface, update [CHANGELOG.md](CHANGELOG.md) in the same
branch.

Useful local checks before opening a PR:

```sh
npm run build
npm run docs:build
npm pack --dry-run
```

## Browser Support

Cirth is designed and tested for the latest stable Chrome, Edge, Firefox,
and Safari releases. The compiled CSS is processed with Lightning CSS
against this Browserslist target:

```json
[
  "Chrome >= 111",
  "Edge >= 111",
  "Firefox >= 113",
  "Safari >= 15.4",
  "iOS >= 15.4"
]
```

No version of Internet Explorer is supported.

## Philosophy

Cirth is a semantic-first CSS framework. Standard HTML elements should carry
most of the structure, meaning, and styling burden before a class is needed.

Core principles:

- Style semantic HTML by default.
- Use classes only where HTML semantics are not enough.
- Keep layout primitives small and structural.
- Avoid utility-first class soup and broad component catalogs.
- Keep customization based on CSS custom properties.

## License

Licensed under the [MIT License](LICENSE.md).
