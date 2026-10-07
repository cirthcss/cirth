---
layout: docs.njk
framework: qwik
description: Use Cirth in a Qwik City app. Import it in src/root.tsx; Qwik's build keeps its light-dark() colours.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

# Qwik

A Qwik City app imports its global stylesheet from `src/root.tsx`. Cirth is
one import there, and Qwik's build, on Vite 7, keeps its `light-dark()`
colours as they are.

## 1. Install

{{ packageManagers("qwik") }}

## 2. Import it

At the top of `src/root.tsx`, before the starter's `global.css`:

```tsx
import "@cirthcss/cirth";
import { component$ } from "@builder.io/qwik";
import { QwikCityProvider, RouterOutlet } from "@builder.io/qwik-city";
import { RouterHead } from "./components/router-head/router-head";

import "./global.css";
```

If a later version of the starter moves to Vite 8, which rewrites those
colours, add `build.cssTarget` as in the [Vite guide](/installation/vite#3-set-the-css-target).

## 3. Check it

{{ checkIt(true) }}

{{ nextSteps("in global.css") }}
