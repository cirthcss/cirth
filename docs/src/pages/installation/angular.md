---
layout: docs.njk
description: Use Cirth in an Angular application. Add the stylesheet to the styles array in angular.json, or import it from styles.css.
---
{% from "install.njk" import packageManagers %}

# Angular

Angular loads global stylesheets from the `styles` array of the build
configuration. Cirth is one entry there.

## 1. Install

{{ packageManagers("angular") }}

## 2. Add it to the build

In `angular.json`, under your project's `architect.build.options`, put Cirth
before your own stylesheet so your rules come after it:

```json
"styles": [
  "node_modules/@cirthcss/cirth/dist/cirth.min.css",
  "src/styles.css"
]
```

The array takes file paths, so use the path to the file rather than the
package name. Alternatively, import it at the top of `src/styles.css`, where
the package name works:

```css
@import "@cirthcss/cirth";
```

Angular's default build keeps Cirth's `light-dark()` colours as they are, so
there is no CSS target to set.

## 3. Write HTML

Component templates render ordinary elements:

```html
<main class="container">
  <article>
    <header><h1>Hello, Angular</h1></header>
    <label>
      Name
      <input name="name" autocomplete="name">
    </label>
    <footer><button type="submit">Save</button></footer>
  </article>
</main>
```

Cirth styles the global document. A component whose styles are encapsulated
in a shadow root (`ViewEncapsulation.ShadowDom`) does not receive global CSS;
use the default emulated encapsulation for markup Cirth should style.

## Choosing a build

Use `dist/cirth.classless.min.css`, `dist/cirth.scoped.min.css` or
`dist/cirth.classless.scoped.min.css` in the array instead. See
[Choose a build](/installation/#choose-a-build).

## Next

[Customization](/customization) covers the `--cirth-*` properties; set them
in `src/styles.css`, after Cirth.

<p class="docs-verified">Checked with Angular 22.2.0 (<code>ng new</code>, default options, CSS) on 27 September 2026: production build with each of the two set-ups above, then colours compared in Chromium against the untransformed stylesheet in the light scheme, the dark scheme and a forced-dark subtree. A bare package name in the <code>styles</code> array fails the build's schema validation.</p>
