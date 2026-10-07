---
layout: docs.njk
framework: vue
description: Use Cirth in a Vue app built with Vite. Import it in src/main.js and set build.cssTarget so Vite keeps its light-dark() colours.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

# Vue

Vue's starter builds with Vite and imports CSS from `src/main.js`. Cirth is one import there. For Nuxt, see its own guide.

## 1. Install

{{ packageManagers("vue") }}

## 2. Import it

At the top of `src/main.js`, before the starter's `style.css`, or in its place:

```js
import "@cirthcss/cirth";
import { createApp } from "vue";
import App from "./App.vue";

createApp(App).mount("#app");
```

A `<style scoped>` block in a component comes after Cirth and wins without
extra specificity. `:style="{ '--cirth-primary': accent }"` rethemes a
subtree.

## 3. Set the CSS target

{{ whyTarget("Vite") }} in `vite.config.js`, beside the plugins already
there:

```js
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    cssTarget: ["chrome123", "edge123", "firefox130", "safari18.2"],
  },
  // the starter's plugins stay as they are
});
```

## 4. Check it

{{ checkIt(true) }}

{{ nextSteps("in a stylesheet imported after Cirth") }}
