---
layout: docs.njk
framework: solidstart
description: Use Cirth in a SolidStart app. Import it in src/app.jsx and set Vite's CSS target so the build keeps its light-dark() colours.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

SolidStart imports its global stylesheet from `src/app.jsx` and builds with
Vite. Cirth is one import there, and Vite takes one line.

## 1. Install

{{ packageManagers("solidstart") }}

## 2. Import it

At the top of `src/app.jsx`, before the starter's `app.css`:

```jsx
import "@cirthcss/cirth";
import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./app.css";
```

## 3. Set the CSS target

{{ whyTarget("Vite") }} in `vite.config.js`, beside the plugins already
there:

```js
import { defineConfig } from "vite";
import { solidStart } from "@solidjs/start/config";
import { nitro } from "nitro/vite";

export default defineConfig({
  build: {
    cssTarget: ["chrome123", "edge123", "firefox130", "safari18.2"],
  },
  plugins: [solidStart(), nitro()],
});
```

## 4. Check it

{{ checkIt(true) }}

{{ nextSteps("in app.css") }}
