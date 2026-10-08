---
layout: docs.njk
framework: astro
description: Use Cirth in an Astro site. Import it in the frontmatter of a layout every page uses; Astro's build keeps it as it is.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

Astro bundles every stylesheet a component imports. Import Cirth once, in a
layout every page uses, and nothing needs configuring: Astro's build keeps
Cirth's `light-dark()` colours.

## 1. Install

{{ packageManagers("astro") }}

## 2. Import it

In the frontmatter of the layout, for example `src/layouts/Layout.astro`:

```astro
---
import "@cirthcss/cirth";

const { title } = Astro.props;
---
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
  </head>
  <body>
    <main class="container">
      <slot />
    </main>
  </body>
</html>
```

A `<style>` block in a component is scoped by Astro and comes after Cirth, so
it wins without any specificity of its own.

## 3. Check it

{{ checkIt() }}

{{ nextSteps("in a stylesheet the layout imports after Cirth") }}
