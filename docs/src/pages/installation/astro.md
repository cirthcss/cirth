---
layout: docs.njk
description: Use Cirth in an Astro site. Import it in the frontmatter of a shared layout.
---
{% from "install.njk" import packageManagers %}

# Astro

Astro bundles a stylesheet imported in a component's frontmatter, so Cirth
goes in the layout every page uses. No configuration is needed.

## 1. Install

{{ packageManagers("astro") }}

## 2. Import it

In a shared layout such as `src/layouts/Layout.astro`:

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

## 3. Write HTML

```astro
---
import Layout from "../layouts/Layout.astro";
---
<Layout title="Hello">
  <article>
    <h1>Hello, Astro</h1>
    <button type="button">Save</button>
  </article>
</Layout>
```

Astro's build keeps Cirth's `light-dark()` colours as they are, so there is
no CSS target to set.

## Choosing a build

Import `@cirthcss/cirth/classless`, `@cirthcss/cirth/scoped` or
`@cirthcss/cirth/classless/scoped` instead. See
[Choose a build](/installation/#choose-a-build).

## Next

[Customization](/customization) covers the `--cirth-*` properties; put
your overrides in a stylesheet imported after Cirth.

<p class="docs-verified">Checked with Astro 7.3.5 (<code>create astro</code>, minimal template) on 27 September 2026: static build, then colours compared in Chromium against the untransformed stylesheet in the light scheme, the dark scheme and a forced-dark subtree.</p>
