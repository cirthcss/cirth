---
layout: docs.njk
framework: sveltekit
description: Use Cirth in a SvelteKit app. Import it in the root layout and set Vite's CSS target so the build keeps its light-dark() colours.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

SvelteKit's root layout, `src/routes/+layout.svelte`, wraps every page, so a
stylesheet imported there reaches the whole app. SvelteKit builds with Vite,
which takes one line.

## 1. Install

{{ packageManagers("sveltekit") }}

## 2. Import it

In `src/routes/+layout.svelte`:

```svelte
<script>
  import "@cirthcss/cirth";

  let { children } = $props();
</script>

<main class="container">
  {@render children()}
</main>
```

## 3. Set the CSS target

{{ whyTarget("Vite") }} in `vite.config.js`, beside the `sveltekit()` plugin:

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

## 4. Check it

{{ checkIt(true) }}

{{ nextSteps("in a stylesheet the layout imports after Cirth") }}
