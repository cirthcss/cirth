---
layout: docs.njk
description: Use Cirth from jsDelivr with one link element. Snippets with integrity hashes for all four builds, the print sheet and a preset.
---

# HTML and CDN

No install and no build: link the stylesheet from jsDelivr and write HTML.

## 1. Link it

Put this in the `<head>` of every page:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@cirthcss/cirth@0.16.0/dist/cirth.min.css"
  integrity="sha384-lI8cp0vEMgtcAMV0HDytp7C+rad0hVfW/yXmsl87XmnuvTiMsx7O7ADf2lg5IQZq"
  crossorigin="anonymous">
```

The version in the URL and the `integrity` hash belong together. The hash is
the SHA-384 digest of that exact file, so the browser refuses the stylesheet
if the CDN ever serves different bytes; a different version needs its own
hash, from that release's documentation or from jsDelivr's file listing.
`crossorigin="anonymous"` is what lets the browser check it.

## 2. Write HTML

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Hello</title>
    <!-- the <link> above -->
  </head>
  <body>
    <main class="container">
      <h1>Hello, Cirth</h1>
      <p>Everything on this page is a standard element.</p>
      <button type="button">Get started</button>
    </main>
  </body>
</html>
```

## Choosing a build

Replace the `<link>` with the build you need. Each one carries its own hash.

Classless, for a page with no classes at all:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@cirthcss/cirth@0.16.0/dist/cirth.classless.min.css"
  integrity="sha384-GZZdP20mqrkcypnIg17t08a5FoGdAKJ49eU1GBK8aXcaT+BwFnqIn5vK52i0gIQm"
  crossorigin="anonymous">
```

Scoped, to style only what is inside a `.cirth` element:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@cirthcss/cirth@0.16.0/dist/cirth.scoped.min.css"
  integrity="sha384-yFHmovn3OOvzinHeO2HC8iG31iDb+lzxgD4N1MlNchcoGDoFtCB07aY2FOyH/pPD"
  crossorigin="anonymous">
```

Scoped classless:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@cirthcss/cirth@0.16.0/dist/cirth.classless.scoped.min.css"
  integrity="sha384-pmLwIliHSNEo//m1i4cVpTDvwB8TWoXibgRIsG/pCjCS1CjZWI+xzd9xPL27iDal"
  crossorigin="anonymous">
```

## Print and presets

The print sheet is a separate file, loaded after the build with
`media="print"`. This one pairs with the default build; each build has its
own ([Print](/utilities/print)):

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@cirthcss/cirth@0.16.0/dist/cirth.print.min.css"
  integrity="sha384-YN/sJVAjTOf20mXWrLlQ2XLbgm3EzefQEiFukKfZstkH6fR92hz6dP7eQQTXQE6I"
  crossorigin="anonymous"
  media="print">
```

A preset goes after the build, too ([Themes](/themes)):

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@cirthcss/cirth@0.16.0/dist/presets/plain.min.css"
  integrity="sha384-kcc0qmhEMFGjevUPPKQe8HsvALQEf5WLYgSB0GDaiwpnVkdOQ3FdmeCj7K8GgIA2"
  crossorigin="anonymous">
```

## Next

[Customization](/customization) shows how to change colours, type and
spacing from a `<style>` block or a stylesheet of your own, and
[Compatibility](/compatibility#delivering-the-stylesheet) covers serving the
file from your own origin instead.

<p class="docs-verified">Every hash on this page was taken from the files jsDelivr serves for 0.16.0, and is checked by <code>npm run check:sri</code> on every lint.</p>
