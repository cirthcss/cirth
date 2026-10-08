---
layout: docs.njk
framework: ember
description: Use Cirth in an Ember app built with Vite and Embroider. Import it from app/app.js; Embroider builds CSS for the browsers in config/targets.js.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

A new Ember app builds with Vite through Embroider, and imports CSS from
JavaScript like any Vite project. Embroider compiles for the browsers in
`config/targets.js`, which name current versions, so Cirth's colours arrive
as they are.

## 1. Install

{{ packageManagers("ember") }}

## 2. Import it

Near the top of `app/app.js`:

```js
import "@cirthcss/cirth";
import Application from "@ember/application";
```

Your own `app/styles/app.css` still loads after it.

## 3. Keep the targets current

`config/targets.js` decides what Vite compiles for. The default, the last
version of each browser, keeps `light-dark()`. If you widen it to browsers
older than Cirth's floor (Chrome and Edge 123, Firefox 130, Safari 18.2),
the build rewrites those colours and a `data-theme` subtree stops changing.

```js
const browsers = [
  "last 1 Chrome versions",
  "last 1 Firefox versions",
  "last 1 Safari versions",
];

module.exports = { browsers };
```

## 4. Check it

{{ checkIt(true, "check config/targets.js above") }}

Templates render ordinary elements: `<article>`, `<label>`, `<button>` need
no classes.

{{ nextSteps("in app/styles/app.css") }}
