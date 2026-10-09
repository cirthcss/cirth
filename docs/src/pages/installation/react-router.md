---
layout: docs.njk
framework: react-router
description: Use Cirth in a React Router app in framework mode. Replace Tailwind in app/app.css and set Vite's CSS target so the build keeps its light-dark() colours.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

A new React Router app in framework mode, the mode that adds a Vite plugin,
server rendering and route modules, imports `app/app.css` from
`app/root.tsx`, and that file imports Tailwind. Cirth takes Tailwind's place,
and Vite gets one line.

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

## Coming from Remix v2

The latest version of Remix is React Router v7: an app on Remix v2 upgrades
to React Router's framework mode, with the codemod
`npx codemod remix/2/react-router/upgrade` and the rest of the official
[upgrade guide](https://reactrouter.com/upgrading/remix). Its Vite plugin
changes from `remix()` to `reactRouter()`, and `app/root.tsx` keeps its
`<Links />`. After the upgrade, Cirth goes in as the steps above show: the
same import, the same `build.cssTarget` beside `reactRouter()`.

{{ nextSteps("after the @import in app/app.css") }}
