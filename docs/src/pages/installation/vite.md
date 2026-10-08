---
layout: docs.njk
framework: vite
description: Use Cirth in a Vite project. Import it once from the entry module and set build.cssTarget so Vite keeps its light-dark() colours.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

Vite imports CSS like any module, so Cirth is one import in the file that
starts your app. The one thing to set is the browsers Vite compiles CSS for.

## 1. Install

{{ packageManagers("vite") }}

## 2. Import it

At the top of your entry module, `src/main.js` in Vite's own starter, before
any stylesheet of yours so your rules come after Cirth's:

```js
import "@cirthcss/cirth";
import "./style.css";
```

The same specifier works from a stylesheet: `@import "@cirthcss/cirth";`.
A plain HTML page with a module script is the same set-up; there is no
separate guide for it.

## 3. Set the CSS target

{{ whyTarget("Vite") }}

```js
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    cssTarget: ["chrome123", "edge123", "firefox130", "safari18.2"],
  },
});
```

Every Vite-based guide on this site sets the same four browsers: they are
Cirth's floor, listed on [Compatibility](/compatibility).

## 4. Check it

{{ checkIt(true) }}

{{ nextSteps("in a stylesheet imported after Cirth") }}
