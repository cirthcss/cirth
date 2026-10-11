---
layout: docs.njk
framework: rsbuild
description: Use Cirth in an Rsbuild project. Import it from the entry module and give the project a browserslist at Cirth's floor so Rsbuild keeps its light-dark() colours.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

`src/index.js` is Rsbuild's browser entry module. A stylesheet imported there
is bundled as global CSS for the document. Lightning CSS compiles it for the
project's browserslist; the default list predates `light-dark()`, so Cirth
needs one entry in `package.json`.

## 1. Install

{{ packageManagers("rsbuild") }}

## 2. Import it

At the top of `src/index.js`, before your own stylesheet:

```js
import "@cirthcss/cirth";
import "./index.css";
```

## 3. Declare Cirth's browsers

{{ whyTarget("Rsbuild") }}

```json
{
  "browserslist": [
    "chrome >= 123",
    "edge >= 123",
    "firefox >= 130",
    "safari >= 18.2"
  ]
}
```

## 4. Check it

{{ checkIt(true) }}

{{ nextSteps("in a stylesheet imported after Cirth") }}
