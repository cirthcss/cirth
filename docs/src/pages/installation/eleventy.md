---
layout: docs.njk
framework: eleventy
description: Use Cirth on an Eleventy site. Copy the stylesheet through to the output and link it from your base layout.
---
{% from "install.njk" import packageManagers %}

Eleventy does not bundle CSS, so Cirth is copied to the output as a file and
linked like any stylesheet. Nothing transforms it on the way.

## 1. Install

{{ packageManagers("eleventy") }}

## 2. Copy it through

In `eleventy.config.js`, written as an ES module, which Eleventy's own
Get Started sets up with `npm pkg set type="module"`:

```js
export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({
    "node_modules/@cirthcss/cirth/dist/cirth.min.css": "css/cirth.min.css",
  });
}
```

In a CommonJS project, the same function is `module.exports = function
(eleventyConfig) { … }`.

If you would rather not install anything, link the
[CDN link](/installation/#cdn) instead and skip this step.

## 3. Link it

In your base layout, for example `_includes/base.njk`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ "{{ title }}" }}</title>
    <link rel="stylesheet" href="/css/cirth.min.css">
  </head>
  <body>
    <main class="container">
      {{ "{{ content | safe }}" }}
    </main>
  </body>
</html>
```

## 4. Write content

Markdown becomes semantic HTML, which is exactly what Cirth styles: headings,
lists, tables, code blocks and blockquotes need no classes.

## Choosing a build

Copy `cirth.classless.min.css` for a site with no classes at all, or one of
the scoped builds; every file is listed in
[What the package contains](/compatibility#what-the-package-contains).

## Next

[Customization](/customization) covers the `--cirth-*` properties; link your
own stylesheet after Cirth's to override them.
