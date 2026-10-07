---
layout: docs.njk
framework: express
description: Use Cirth with Express. Serve the package's dist folder with express.static and link it from your pages.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

# Express

Express serves files with `express.static`. Cirth's package is a folder of
finished CSS, so the server can hand it out directly from `node_modules`.

## 1. Install

{{ packageManagers("express", "@cirthcss/cirth express") }}

## 2. Serve it

Resolve the package's folder rather than writing the path out, so a
workspace or a different install layout still finds it:

```js
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";

const app = express();
const cirth = path.dirname(fileURLToPath(import.meta.resolve("@cirthcss/cirth")));

app.use("/css", express.static(cirth, { maxAge: "1y", immutable: true }));
```

`import.meta.resolve` returns the package's main file, `dist/cirth.min.css`,
so its folder holds every build. Use the long cache lifetime only with the
version in the URL, or drop the options.

## 3. Link it

From whatever renders your pages, a template engine or a string:

```html
<link rel="stylesheet" href="/css/cirth.min.css">
```

## 4. Check it

{{ checkIt() }}

{{ nextSteps() }}
