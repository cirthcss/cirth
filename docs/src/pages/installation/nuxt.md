---
layout: docs.njk
framework: nuxt
description: Use Cirth in a Nuxt app. Add it to the css array in nuxt.config.ts and set Vite's CSS target so the build keeps its light-dark() colours.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

# Nuxt

Nuxt loads global stylesheets from the `css` array of its configuration, and
builds with Vite. Cirth is one entry in that array, and Vite takes one more
line beside it.

## 1. Install

{{ packageManagers("nuxt") }}

## 2. Add it, and set the CSS target

{{ whyTarget("Vite") }} under `vite` in `nuxt.config.ts`:

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

Stylesheets of your own go after Cirth in the same array.

## 3. Check it

{{ checkIt(true) }}

{{ nextSteps("in a stylesheet listed after Cirth in the css array") }}
