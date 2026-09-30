---
layout: docs.njk
framework: sveltekit
description: Use Cirth in a SvelteKit app. Import it in the root layout and keep Vite's CSS target at Cirth's browser floor.
---
{% from "install.njk" import packageManagers %}

# SvelteKit

The root layout wraps every page, so it is where a global stylesheet goes.

## 1. Install

{{ packageManagers("sveltekit") }}

## 2. Import it

In `src/routes/+layout.svelte`:

```html
<script>
  import "@cirthcss/cirth";

  let { children } = $props();
</script>

<main class="container">
  {@render children()}
</main>
```

## 3. Set the CSS target

SvelteKit builds with Vite, whose default CSS target is older than Cirth's
browsers and rewrites its `light-dark()` colours: a `data-theme` element that
forces the other scheme inside the page stops changing colour. Add the target
to `vite.config.js`, beside the `sveltekit()` plugin:

```js
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    cssTarget: ["chrome123", "edge123", "firefox130", "safari18.2"],
  },
  plugins: [sveltekit()],
});
```

## 4. Write HTML

In any page, for example `src/routes/+page.svelte`:

```html
<article>
  <header><h1>Hello, SvelteKit</h1></header>
  <label>
    <input type="checkbox" role="switch" checked>
    Email notifications
  </label>
</article>
```

## Choosing a build

Import `@cirthcss/cirth/classless`, `@cirthcss/cirth/scoped` or
`@cirthcss/cirth/classless/scoped` instead. See
[Choose a build](/installation/#choose-a-build).

## Next

[Customization](/customization) covers the `--cirth-*` properties you can
override from any stylesheet.

<p class="docs-verified">Checked with SvelteKit 2.70.3 on Vite 8.3.1 (<code>sv create</code>, minimal template) on 27 September 2026: production build and <code>vite preview</code>, then colours compared in Chromium against the untransformed stylesheet in the light scheme, the dark scheme and a forced-dark subtree.</p>
