---
layout: docs.njk
description: Use Cirth in a Vite project. Install the package, import it from your entry module, and keep Vite's CSS target at Cirth's browser floor.
---
{% from "install.njk" import packageManagers %}

# Vite

Vite imports CSS from JavaScript, so Cirth is one import in your entry module
and one line of configuration.

## 1. Install

{{ packageManagers("vite") }}

## 2. Import it

At the top of your entry module, usually `src/main.js`, before any
stylesheet of your own:

```js
import "@cirthcss/cirth";
```

If you prefer to keep CSS in CSS, the same specifier works at the top of a
stylesheet you import instead:

```css
@import "@cirthcss/cirth";
```

## 3. Set the CSS target

Vite compiles CSS for an older set of browsers than Cirth supports, and in
doing so rewrites Cirth's `light-dark()` colours. The page still switches
between light and dark, but an element with `data-theme` that forces the
other scheme inside the page no longer changes colour. Tell Vite to compile
for Cirth's browser floor:

```js
// vite.config.js
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    cssTarget: ["chrome123", "edge123", "firefox130", "safari18.2"],
  },
});
```

If the file already exists, add the `build` key beside what is there.

## 4. Write HTML

```html
<main class="container">
  <article>
    <h1>Hello, Vite</h1>
    <p>Styled by Cirth, with no classes on this card.</p>
    <button type="button">Get started</button>
  </article>
</main>
```

## Choosing a build

Import a different entry point to change build:
`@cirthcss/cirth/classless`, `@cirthcss/cirth/scoped` or
`@cirthcss/cirth/classless/scoped`. See
[Choose a build](/installation/#choose-a-build).

## Next

Retheme with custom properties in any stylesheet imported after Cirth: see
[Customization](/customization).

<p class="docs-verified">Checked with Vite 8.3.1 (create-vite 9.2.1, vanilla template) on 27 September 2026: production build, then colours compared in Chromium against the untransformed stylesheet in the light scheme, the dark scheme and a forced-dark subtree.</p>
