---
layout: docs.njk
---


# Get Started

Cirth styles standard HTML elements first. Load one stylesheet, write ordinary
semantic markup, and most of your interface is already styled.

## CDN

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@cirthcss/cirth@0.10.0/dist/cirth.min.css"
  integrity="sha384-eryxoPjA1vogVlspjzxHv7EDws0Ns2llZpU+nFSO6MKh58+TqPrpTxm/nBZcjAuE"
  crossorigin="anonymous">
```

The `integrity` hash is the SHA-384 digest of that exact file: if the CDN
ever answers with different bytes, the browser drops the stylesheet instead
of applying it. `crossorigin="anonymous"` is what lets the browser read the
response to check it. The hash is tied to the version in the URL: if you
pin a different release, take that release's hash from its own copy of this
page or from jsDelivr's file listing, because a mismatched pair blocks the
stylesheet everywhere.

## npm

```sh
npm install @cirthcss/cirth
```

```js
import "@cirthcss/cirth/dist/cirth.min.css";
```

Every published build also has a shorter `exports` path, for example
`@cirthcss/cirth/classless`, `@cirthcss/cirth/scoped`, or
`@cirthcss/cirth/presets/cobalt`; see
[Contributions](/contributions#package-exports) for the full map. The
`dist/*.css` paths keep working alongside them.

The package ships compiled CSS only. `main` and `style` both point at
`dist/cirth.min.css`. SCSS sources in the repository are internal build
infrastructure, not a published Sass API.

## Quickstart

{% demo "quickstart" %}

No classes were added above beyond `.container`: `<nav>`, `<article>`,
`<form>`, `<label>`, and `<button>` are styled directly.

## Which build do I need?

Cirth publishes four CSS builds from the same source:

| File | Use it when… |
| --- | --- |
| `dist/cirth.min.css` | Default. You write normal HTML and want `.container`, `.grid`, `.secondary`/`.outline` modifiers, dropdowns, etc. |
| `dist/cirth.classless.min.css` | You want the smallest possible markup: no classes at all, styled through `body > header/main/footer`. |
| `dist/cirth.scoped.min.css` | You're embedding Cirth into an existing page, CMS, or app shell and only want elements inside a `.cirth` wrapper affected. |
| `dist/cirth.classless.scoped.min.css` | Both: scoped **and** classless. |

All four builds share the same official amber theme. `cobalt` and `coral`
(see [Colors](/colors)) are optional presets: stylesheets that override an
existing set of custom properties (color, shadow, type, spacing, motion).
Load them after any of the four builds above, for example
`dist/presets/cobalt.min.css`.

### Classless

```html
<link rel="stylesheet" href="dist/cirth.classless.min.css">
```

{% demo "classless", "classless" %}

### Scoped

Useful when embedding Cirth into an existing page, CMS, widget, or app shell,
where only descendants of `.cirth` should be styled.

```html
<link rel="stylesheet" href="dist/cirth.scoped.min.css">

<div class="cirth">
  <article>
    <h3>Embedded widget</h3>
    <button type="button">Save</button>
  </article>
</div>
```

{% demo "scoped" %}

This documentation site is itself styled by Cirth's default build. The
header nav, the sidebar, the prose you're reading, and every live example
are ordinary semantic HTML with no documentation specific component framework on
top.

## Next steps

* [Customization](/customization): override the CSS custom property surface.
* [Colors](/colors): the default theme, plus the `cobalt`/`coral` presets.
* [Layout](/layout/document): start reading the component reference.
