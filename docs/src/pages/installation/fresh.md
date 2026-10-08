---
layout: docs.njk
framework: fresh
description: Use Cirth in a Fresh 2 project on Deno. Add the npm package and @import it in assets/styles.css; Fresh's Vite build keeps it as it is.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

Fresh 2 builds with Vite and imports `assets/styles.css` from `client.ts`.
Cirth comes in from npm through Deno, and is one `@import` in that
stylesheet.

## 1. Install

```sh
deno add npm:@cirthcss/cirth
deno install
```

`deno install` puts the package in `node_modules/`, where Vite resolves a
stylesheet's `@import`.

## 2. Import it

At the top of `assets/styles.css`:

```css
@import "@cirthcss/cirth";
```

Fresh's Vite build keeps Cirth's `light-dark()` colours, so there is no CSS
target to set.

## 3. Check it

{{ checkIt() }}

Routes and islands render ordinary Preact elements, styled as they are.

{{ nextSteps("after the @import in assets/styles.css") }}
