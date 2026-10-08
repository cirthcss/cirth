---
layout: docs.njk
framework: postcss
description: Use Cirth in a PostCSS pipeline. Inline it with postcss-import from your own stylesheet; Autoprefixer leaves it as it is.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

PostCSS is a pipeline, not a bundler: it resolves an `@import` only with the
`postcss-import` plugin, which inlines the file where the rule stands. Cirth
needs nothing else from it.

## 1. Install

{{ packageManagers("postcss", "@cirthcss/cirth postcss postcss-cli postcss-import") }}

## 2. Import it

At the top of your stylesheet, say `src/app.css`:

```css
@import "@cirthcss/cirth";

:root {
  --cirth-primary: #2563eb;
}
```

## 3. Add the plugin

In `postcss.config.js`, `postcss-import` first, so later plugins see Cirth's
rules:

```js
module.exports = {
  plugins: [require("postcss-import")],
};
```

Autoprefixer, if your pipeline has it, adds two prefixed rules and changes
nothing else. Then build:

```sh
npx postcss src/app.css -o dist/app.css
```

## 4. Check it

{{ checkIt() }}

{{ nextSteps("after the @import") }}
