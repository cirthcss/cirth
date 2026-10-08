---
layout: docs.njk
framework: react-router
description: Use Cirth in a React Router app in framework mode. Replace Tailwind in app/app.css and set Vite's CSS target so the build keeps its light-dark() colours.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

A new React Router app in framework mode imports `app/app.css` from
`app/root.tsx`, and that file imports Tailwind. Cirth takes Tailwind's place,
and Vite gets one line. The same set-up serves an app upgraded from Remix 2,
whose successor React Router is.

## 1. Install

{{ packageManagers("react-router") }}

Remove Tailwind, which styles the same elements from the other direction:

```sh
npm uninstall tailwindcss @tailwindcss/vite
```

## 2. Import it

Replace the contents of `app/app.css`:

```css
@import "@cirthcss/cirth";
```

`app/root.tsx` already imports that file. A route that needs a stylesheet of
its own can return it from `links`.

## 3. Configure Vite

Remove the `tailwindcss()` plugin from `vite.config.ts`. {{ whyTarget("Vite") }}

```ts
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    cssTarget: ["chrome123", "edge123", "firefox130", "safari18.2"],
  },
  plugins: [reactRouter()],
});
```

## 4. Check it

{{ checkIt(true) }}

{{ nextSteps("after the @import in app/app.css") }}
