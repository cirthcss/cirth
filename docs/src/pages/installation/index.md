---
layout: docs.njk
description: Add Cirth with one link element from a CDN, or install it from npm and import it once. Then a guide for your stack, from build tools and JavaScript frameworks to backend frameworks, static site generators, desktop apps and Rust.
---
{% from "install.njk" import packageManagers, guideGrid %}

# Installation

Cirth is one stylesheet. Link it from a CDN or import it from npm, and the
HTML you already write is styled. There is nothing to configure and no
script to run.

## CDN

Put this in the `<head>` of your page:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@cirthcss/cirth@0.16.0/dist/cirth.min.css"
  integrity="sha384-lI8cp0vEMgtcAMV0HDytp7C+rad0hVfW/yXmsl87XmnuvTiMsx7O7ADf2lg5IQZq"
  crossorigin="anonymous">
```

The URL pins a version, and `integrity` is the SHA-384 digest of that exact
file: if the CDN ever serves different bytes, the browser refuses the
stylesheet instead of applying it. Keep the two together when you change
version.

## npm

{{ packageManagers("main") }}

Then import it once, where your project already loads global CSS:

```js
import "@cirthcss/cirth";
```

Or from a stylesheet:

```css
@import "@cirthcss/cirth";
```

The package ships compiled CSS only, so a bundler treats it like any other
stylesheet. Some bundlers rewrite modern CSS for older browsers on the way
through; the guides below say which, and the one line that stops it.

## Guides

Where the import goes in each stack, and what to set when a build tool
would otherwise change the file: {{ frameworks.count }} guides, by
category. A logo leads to the project's own site, a name to the guide.

{{ guideGrid(frameworks.groups) }}

Every guide says how sure it is, with the versions and the date.
{% if frameworks.verifiedCount == frameworks.count %}All {{ frameworks.count }} are{% else %}{{ frameworks.verifiedCount }} of {{ frameworks.count }} are{% endif %}
verified: followed in a new project made with the tool's own starter, built
for production, and read in Chromium on a light page and in a
`data-theme="dark"` subtree inside it.

Logos belong to their projects; none of these projects is affiliated with
Cirth or endorses it ([sources and terms](/brand#framework-logos)).
{% for notice in frameworks.notices %}{{ notice }} {% endfor %}

## Advanced builds

The default build is the right one to start with. Three others are compiled
from the same source: **classless**, with no classes at all; **scoped**,
which styles only what is inside a `.cirth` element, for a page or an app
shell that already has its own CSS; and the two combined. Each has a print
sheet, and any of them takes a preset.

- [What the package contains](/compatibility#what-the-package-contains): the
  import path and file of every build.
- [Every build from the CDN](/compatibility#every-build-from-the-cdn): the
  links and their integrity hashes.
- [Themes](/themes) and [Print](/utilities/print): presets and print sheets.

## Next steps

- [Customization](/customization): colours, type, spacing and radius, as
  `--cirth-*` custom properties.
- [Examples](/examples): complete interfaces built from the elements in this
  documentation.
- [Compatibility](/compatibility), for reference: supported browsers, every
  build in the package, and how Cirth sits beside your own CSS.
