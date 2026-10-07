---
layout: docs.njk
framework: preact
description: Use Cirth in a Preact app built with Vite. Import it in src/main.jsx and set build.cssTarget so Vite keeps its light-dark() colours.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

# Preact

Preact's Vite starter imports CSS from `src/main.jsx`. Cirth is one import there.

## 1. Install

{{ packageManagers("preact") }}

## 2. Import it

At the top of `src/main.jsx`, before the starter's `index.css`, or in its place:

```jsx
import "@cirthcss/cirth";
import { render } from "preact";
import { App } from "./app.jsx";

render(<App />, document.getElementById("app"));
```

Preact accepts `class` as well as `className`.

## 3. Set the CSS target

{{ whyTarget("Vite") }} in `vite.config.js`, beside the plugins already
there:

```js
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    cssTarget: ["chrome123", "edge123", "firefox130", "safari18.2"],
  },
  // the starter's plugins stay as they are
});
```

## 4. Check it

{{ checkIt(true) }}

{{ nextSteps("in a stylesheet imported after Cirth") }}
