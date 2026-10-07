---
layout: docs.njk
framework: vike
description: Use Cirth in a Vike app. Import it in pages/+Layout and set Vite's CSS target so the build keeps its light-dark() colours.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

# Vike

Vike wraps every page in `pages/+Layout`, so a stylesheet imported there
reaches the whole app, with React, Vue or Solid alike. Vike builds with Vite,
which takes one line.

## 1. Install

{{ packageManagers("vike") }}

## 2. Import it

At the top of `pages/+Layout.tsx` (or `.jsx`, `.vue`), before the starter's
`Layout.css`:

```tsx
import "@cirthcss/cirth";
import "./Layout.css";
```

## 3. Set the CSS target

{{ whyTarget("Vite") }} in `vite.config.ts`, beside the plugins already there:

```ts
import vike from "vike/plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    cssTarget: ["chrome123", "edge123", "firefox130", "safari18.2"],
  },
  plugins: [vike(), react()],
});
```

## 4. Check it

{{ checkIt(true) }}

{{ nextSteps("in Layout.css") }}
