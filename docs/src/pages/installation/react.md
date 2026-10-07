---
layout: docs.njk
framework: react
description: Use Cirth in a React app built with Vite. Import it where the app mounts and set build.cssTarget so Vite keeps its light-dark() colours.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

# React

A React app built with Vite, as React's own documentation suggests for a new app, imports CSS from JavaScript. Cirth is one import where the app mounts. For Next.js, React Router and the other React frameworks, see their own guides.

## 1. Install

{{ packageManagers("react") }}

## 2. Import it

At the top of `src/main.jsx`, before the starter's `index.css`, or in its place:

```jsx
import "@cirthcss/cirth";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

JSX writes `className` for `class`; nothing else changes. A custom property
set inline rethemes a subtree: {% raw %}`style={{ "--cirth-primary": "#2563eb" }}`{% endraw %}.

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
