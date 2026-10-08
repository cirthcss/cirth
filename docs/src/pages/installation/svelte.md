---
layout: docs.njk
framework: svelte
description: Use Cirth in a Svelte app built with Vite. Import it in src/main.js and set build.cssTarget so Vite keeps its light-dark() colours.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

Svelte's Vite starter imports CSS from `src/main.js`. Cirth is one import there. For SvelteKit, see its own guide.

## 1. Install

{{ packageManagers("svelte") }}

## 2. Import it

At the top of `src/main.js`:

```js
import "@cirthcss/cirth";
import { mount } from "svelte";
import App from "./App.svelte";

const app = mount(App, { target: document.getElementById("app") });

export default app;
```

A component's `<style>` is scoped by Svelte and comes after Cirth.

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
