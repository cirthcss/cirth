---
layout: docs.njk
usesClassless: true
description: Add Cirth from a CDN or npm, choose one of four builds, and import it where your project already loads CSS.
---
{% from "install.njk" import packageManagers, guideList %}

# Installation

Cirth is one stylesheet. Add it to a page and the HTML you already write is
styled: there is nothing to configure, nothing to initialize, and no
JavaScript to load.

<ul class="docs-path-list">
<li><a href="#cdn"><strong>CDN</strong><span>Paste one <code>&lt;link&gt;</code> into your page. Nothing to install.</span></a></li>
<li><a href="#npm"><strong>npm</strong><span>Install the package and import it where your project loads CSS.</span></a></li>
<li><a href="#framework-guides"><strong>Framework guides</strong><span>Vite, React, Next.js, Vue and Nuxt, SvelteKit, Astro, Angular, Eleventy.</span></a></li>
</ul>

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
stylesheet instead of applying it. A different version needs that release's
hash; the [HTML and CDN guide](/installation/cdn) lists all four builds with
theirs.

## npm

{{ packageManagers("main") }}

Then import it once, where your project already loads global CSS:

```js
import "@cirthcss/cirth";
```

The package name resolves to the default build, `dist/cirth.min.css`, through
its `exports` map. Where you import CSS from a stylesheet rather than from
JavaScript, the same specifier works in an `@import`:

```css
@import "@cirthcss/cirth";
```

The package ships compiled CSS only. There is no Sass API to compile and no
plugin to register: a bundler treats Cirth like any other stylesheet.

## Choose a build

Every build is compiled from the same source and carries the same theme. Pick
the one that matches how much of the page Cirth should own.

| Build | Import | Use it when |
| --- | --- | --- |
| Default | `@cirthcss/cirth` | You own the page. Semantic HTML is styled, and a few classes (`.container`, `.grid`, `.secondary`, `.outline`) are there when you want them. |
| Classless | `@cirthcss/cirth/classless` | You want no classes at all: `body > header`, `main` and `footer` are laid out for you. |
| Scoped | `@cirthcss/cirth/scoped` | Cirth lives inside an existing page, CMS or app shell, and only a `.cirth` wrapper should be styled. |
| Scoped classless | `@cirthcss/cirth/classless/scoped` | Both: inside `.cirth`, and without classes. |

Each build has a print companion and can take a preset on top; see
[Print](/utilities/print) and [Themes](/themes).

### Classless

No classes: the page's landmarks are the layout.

{% demo "classless", "classless" %}

### Scoped

Only the descendants of `.cirth` are styled, so Cirth can sit inside a page
that already has its own CSS without touching it.

{% demo "scoped" %}

When a third-party widget inside a Cirth page brings its own styles, the
opposite boundary exists too: see
[Excluding a third-party component](/compatibility#excluding-a-third-party-component).

## Try it

A complete page. Save it as an `.html` file and open it in a browser.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Settings</title>
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/@cirthcss/cirth@0.16.0/dist/cirth.min.css"
      integrity="sha384-lI8cp0vEMgtcAMV0HDytp7C+rad0hVfW/yXmsl87XmnuvTiMsx7O7ADf2lg5IQZq"
      crossorigin="anonymous">
  </head>
  <body>
    <main class="container">
      <nav>
        <ul><li><strong>Product</strong></li></ul>
        <ul>
          <li><a href="#">Docs</a></li>
          <li><a href="#">Account</a></li>
        </ul>
      </nav>
      <article>
        <h1>Settings</h1>
        <form>
          <label>
            Email
            <input type="email" name="email" placeholder="you@example.com" autocomplete="email">
          </label>
          <button type="submit">Save</button>
        </form>
      </article>
    </main>
  </body>
</html>
```

This is what the body renders, with the stylesheet this site loads:

{% demo "quickstart" %}

The only class is `.container`. The navigation bar, the card, the label, the
field and the button are the elements themselves.

## Framework guides

Cirth has no framework-specific package, because it does not need one. Every
guide comes down to the same three steps: install the package, import one
stylesheet where the framework loads global CSS, and write HTML.

{{ guideList(frameworks.guides, frameworks.marks) }}

Logos belong to their projects and appear only to say where Cirth has been
checked; none of these projects is affiliated with Cirth or endorses it.
[Brand](/brand#framework-logos) lists where each one comes from and the
terms it is used under.

## Next steps

- [Customization](/customization): colours, type, spacing and radius, all
  as `--cirth-*` custom properties.
- [Compatibility](/compatibility): supported browsers, how Cirth sits beside
  your own CSS, and how the file is delivered.
- [Examples](/examples): complete interfaces built from the elements in this
  documentation.
