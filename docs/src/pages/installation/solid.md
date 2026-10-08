---
layout: docs.njk
framework: solid
description: Use Cirth in a Solid app built with Vite. Import it in src/index.jsx and set build.cssTarget so Vite keeps its light-dark() colours.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

Solid's Vite starter imports CSS from `src/index.jsx`. Cirth is one import there. For SolidStart, see its own guide.

## 1. Install

{{ packageManagers("solid") }}

## 2. Import it

At the top of `src/index.jsx`:

```jsx
import "@cirthcss/cirth";
import { render } from "solid-js/web";
import App from "./App.jsx";

render(() => <App />, document.getElementById("root"));
```

Solid's JSX writes `class`, as HTML does.

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
