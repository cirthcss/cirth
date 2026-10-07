---
layout: docs.njk
framework: adonisjs
description: Use Cirth in an AdonisJS app. Import it in resources/css/app.css and set Vite's CSS target so the build keeps its light-dark() colours.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

# AdonisJS

An AdonisJS app bundles `resources/css/app.css` with Vite and loads it with
the `@vite` tag in its Edge layouts. Cirth is one `@import` at the top of
that file, and Vite takes one line.

## 1. Install

{{ packageManagers("adonisjs") }}

## 2. Import it

At the top of `resources/css/app.css`, before the starter kit's own rules:

```css
@import "@cirthcss/cirth";
```

The layouts in `resources/views/components/layouts/` already load the file
with `@vite(['resources/css/app.css', 'resources/js/app.js'])`.

## 3. Set the CSS target

{{ whyTarget("Vite") }} in `vite.config.ts`, beside the `adonisjs()` plugin:

```ts
import { defineConfig } from "vite";
import adonisjs from "@adonisjs/vite/client";

export default defineConfig({
  build: {
    cssTarget: ["chrome123", "edge123", "firefox130", "safari18.2"],
  },
  plugins: [
    adonisjs({
      entryPoints: ["resources/css/app.css", "resources/js/app.js"],
      reload: ["resources/views/**/*.edge"],
    }),
  ],
});
```

## 4. Check it

{{ checkIt(true) }}

{{ nextSteps("after the @import in resources/css/app.css") }}
