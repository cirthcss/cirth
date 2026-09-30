---
layout: docs.njk
framework: vue
description: Use Cirth with Vue on Vite, or with Nuxt. Import it in main.js or list it in nuxt.config, and keep the CSS target at Cirth's browser floor.
---
{% from "install.njk" import packageManagers %}

# Vue and Nuxt

Vue templates render ordinary elements, so Cirth needs no Vue plugin. With
Vue on Vite it is imported from the entry module; with Nuxt it is listed in
the config.

## 1. Install

{{ packageManagers("vue") }}

## 2. Import it

### Vue with Vite

At the top of `src/main.js`:

```js
import "@cirthcss/cirth";
import { createApp } from "vue";
import App from "./App.vue";

createApp(App).mount("#app");
```

### Nuxt

Add it to the global `css` array in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  css: ["@cirthcss/cirth"],
});
```

## 3. Set the CSS target

Both compile CSS with Vite, whose default target is older than Cirth's
browsers and rewrites its `light-dark()` colours: a `data-theme` element that
forces the other scheme inside the page stops changing colour. Set the target
in `vite.config.js` for Vue:

```js
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    cssTarget: ["chrome123", "edge123", "firefox130", "safari18.2"],
  },
  plugins: [vue()],
});
```

and under `vite` in `nuxt.config.ts` for Nuxt:

```ts
export default defineNuxtConfig({
  css: ["@cirthcss/cirth"],
  vite: {
    build: {
      cssTarget: ["chrome123", "edge123", "firefox130", "safari18.2"],
    },
  },
});
```

## 4. Write HTML

```html
<template>
  <main class="container">
    <article>
      <header><h1>Hello, Vue</h1></header>
      <details name="faq" open>
        <summary>Does this need a component?</summary>
        <p>No. It is a details element.</p>
      </details>
    </article>
  </main>
</template>
```

## Choosing a build

Import or list `@cirthcss/cirth/classless`, `@cirthcss/cirth/scoped` or
`@cirthcss/cirth/classless/scoped` instead. See
[Choose a build](/installation/#choose-a-build).

## Next

[Customization](/customization) covers the `--cirth-*` properties; bind one
with `:style="{ '--cirth-primary': accent }"` to retheme a subtree.

<p class="docs-verified">Checked on 27 September 2026 with Vue 3.5.43 on Vite 8.3.1 (create-vite 9.2.1, vue template) and with Nuxt 4.5.2 (minimal template): production builds, then colours compared in Chromium against the untransformed stylesheet in the light scheme, the dark scheme and a forced-dark subtree.</p>
