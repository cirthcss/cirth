<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/cirthcss/cirth/master/docs/public/logo_brand_dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/cirthcss/cirth/master/docs/public/logo_brand.svg">
    <img alt="" src="https://raw.githubusercontent.com/cirthcss/cirth/master/docs/public/logo_brand.svg" width="72" height="72">
  </picture>
</p>

<h1 align="center">Cirth</h1>

<p align="center"><strong>CSS for the HTML you already write.</strong></p>

<p align="center">
  Cirth styles semantic HTML into a usable interface. Load one stylesheet,
  customize it with CSS variables, and ship without a JavaScript runtime or
  a required build step.
</p>

<p align="center">
  <a href="https://cirthcss.github.io/cirth/get-started/">Documentation</a>
  · <a href="https://cirthcss.github.io/cirth/examples/">Examples</a>
  · <a href="https://www.npmjs.com/package/@cirthcss/cirth">npm</a>
</p>

## Get started

Add the stylesheet from a CDN:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@cirthcss/cirth@0.16.0/dist/cirth.min.css"
  integrity="sha384-lI8cp0vEMgtcAMV0HDytp7C+rad0hVfW/yXmsl87XmnuvTiMsx7O7ADf2lg5IQZq"
  crossorigin="anonymous">
```

Or install the compiled CSS from npm:

```sh
npm install @cirthcss/cirth
```

```js
import "@cirthcss/cirth";
```

Then write ordinary HTML. Only the layout wrapper needs a class:

```html
<main class="container">
  <h1>Account settings</h1>
  <form>
    <label>
      Email
      <input type="email" name="email" autocomplete="email">
    </label>
    <button type="submit">Save</button>
  </form>
</main>
```

## What you get

- **Semantic defaults:** typography, navigation, forms, tables, and a small
  set of components, with layout classes where HTML alone is not enough.
- **A theme you can change at runtime:** light and dark schemes, CSS custom
  properties, and no Sass step for consumers.
- **No shipped JavaScript:** interactive patterns build on native elements
  such as `<details>` and `<dialog>`.
- **A tested baseline:** accessibility checks and compressed-size budgets
  run in CI. Your application still needs its own accessibility testing.

See [About Cirth](docs/src/pages/about.md) for the scope and trade-offs.

## Choose a build

| Stylesheet | Use it for |
| --- | --- |
| `dist/cirth.min.css` | The default semantic build. |
| `dist/cirth.classless.min.css` | Pages with almost no classes. |
| `dist/cirth.scoped.min.css` | An existing site or app; styles stay inside `.cirth`. |
| `dist/cirth.classless.scoped.min.css` | Scoped and classless together. |

All four share the same copper theme and light/dark support. Load an optional
[`plain` or `playroom` preset](docs/src/pages/colors.md) after the main
stylesheet to change its look. Print stylesheets are available separately.
The [Get Started guide](docs/src/pages/get-started.md) has examples and npm
import paths for each build.

To keep Cirth's content, form, and component declarations off a third-party
widget, mark its root with `.no-cirth`:

```html
<div class="no-cirth"><!-- third-party widget --></div>
```

This is a component opt-out, not complete isolation: reset, theme, inherited,
layout, accessibility, motion, and print rules still apply. See
[Get Started](docs/src/pages/get-started.md#excluding-a-third-party-component)
for the boundary's `:has()` and sibling-selector limits.

## Customize

Cirth is CSS-first. Override custom properties in your own stylesheet. Every
stylesheet Cirth ships keeps its rules in one cascade layer, `cirth`, so CSS
you write outside a layer wins without matching Cirth's selectors, wherever
it loads.

```css
:root {
  --cirth-primary: light-dark(#2563eb, #93c5fd);
  --cirth-border-radius: 0.375rem;
}
```

The accent's links, controls, hover states, and focus rings derive from
`--cirth-primary`. For a scoped build, put overrides on `.cirth` instead of
`:root`. See [Customization](docs/src/pages/customization.md) for the token
system and contrast guidance.

## Browser support

Cirth targets Chrome and Edge 123+, Firefox 130+, and Safari and iOS 18.2+.
The full [Browserslist target](package.json) also covers mobile Chromium,
Opera, and Samsung Internet. Older browsers, including Internet Explorer,
are not supported.

## Documentation and contributing

Browse the [documentation](https://cirthcss.github.io/cirth/),
[live examples](https://cirthcss.github.io/cirth/examples/), and
[changelog](CHANGELOG.md). To work on Cirth, start with the
[contribution guide](.github/CONTRIBUTING.md).

Cirth is licensed under [Apache 2.0](LICENSE.md). See [NOTICE.md](NOTICE.md)
for attribution to Pico CSS, from which Cirth was forked.
