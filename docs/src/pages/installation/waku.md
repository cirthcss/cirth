---
layout: docs.njk
framework: waku
description: Use Cirth in a Waku app. Replace Tailwind in src/styles.css and set Vite's CSS target in waku.config.ts so the build keeps its light-dark() colours.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

A new Waku app imports `src/styles.css` from its root layout, and that file
imports Tailwind. Cirth takes Tailwind's place, and Waku's Vite settings
take one line.

## 1. Install

{{ packageManagers("waku") }}

Remove Tailwind, which styles the same elements from the other direction:

```sh
npm uninstall tailwindcss @tailwindcss/vite
```

## 2. Import it

Replace the contents of `src/styles.css`:

```css
@import "@cirthcss/cirth";
```

`src/pages/_layout.tsx` already imports that file.

## 3. Configure Vite

{{ whyTarget("Vite") }} under `vite` in `waku.config.ts`, with the
`tailwindcss()` plugin removed:

```ts
import { defineConfig } from "waku/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  vite: {
    build: {
      cssTarget: ["chrome123", "edge123", "firefox130", "safari18.2"],
    },
    plugins: [react()],
  },
});
```

Keep any other plugin the starter lists there.

## 4. Check it

{{ checkIt(true) }}

{{ nextSteps("after the @import in src/styles.css") }}
