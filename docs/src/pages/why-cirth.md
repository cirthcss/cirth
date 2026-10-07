---
layout: docs.njk
description: Cirth turns semantic HTML into a finished, accessible interface with one stylesheet. No class vocabulary, no JavaScript runtime, no framework lock-in.
# Before you install: the questions people ask before adding Cirth. Two of
# the answers quote a fact the build measures (the size of this build and
# the Browserslist target), so they carry a marker the template replaces;
# an HTML comment reads as nothing at all if one ever survives.
faq:
  - q: Do I need to write any JavaScript?
    a: >-
      Cirth itself does not require or ship any. The package is compiled
      CSS, and the interactive patterns it styles (accordion, dropdown,
      modal, popover) are native <code>&lt;details&gt;</code>,
      <code>&lt;dialog&gt;</code> and <code>[popover]</code> elements
      driven by the browser. Your application can still use JavaScript
      wherever its own behavior needs it: data, state, routing, anything
      it builds in the DOM. Cirth styles what is there, whoever put it
      there.
  - q: Is a build step required?
    a: >-
      No. One <code>&lt;link rel="stylesheet"&gt;</code>, or one
      <code>import</code> where you already bundle, and standard
      elements are styled. It also drops into a Vite, PostCSS or bundler
      pipeline unchanged when you have one; neither way is the blessed
      one. The SCSS in the repository is how the published CSS is
      produced, not a Sass API you are expected to compile.
  - q: How big is the default stylesheet?
    a: >-
      <!--size--> gzipped in the build this site was made from. That is a
      measurement, not a promise:
      <a href="https://github.com/cirthcss/cirth/blob/master/scripts/check-css-size.js">a
      script</a> gzips every bundle on every build and fails past the
      current budget, so the number stays honest, and it is free to move
      when covering more HTML, or a better accessibility default, is
      worth the bytes. What actually arrives at a browser depends on who
      serves the file; <a href="/compatibility#compression">Compatibility</a> covers
      that.
  - q: Which browsers are supported?
    a: >-
      <!--browsers-->. That is the Browserslist target in
      <code>package.json</code>: what Lightning CSS compiles the output
      against, and what
      <a href="https://github.com/cirthcss/cirth/blob/master/scripts/check-browserslist.js">check-browserslist.js</a>
      holds to one engine floor across every family, so a Chromium fork
      left behind cannot quietly lower it. No version of Internet
      Explorer is supported.
  - q: How is this different from Pico CSS?
    a: >-
      Cirth began as a fork of Pico CSS and remains indebted to it, but
      it is an independent framework now rather than a promise of
      compatibility. What has moved since the fork: the published package
      is CSS only, in classless and scoped forms (four builds today:
      default, classless, scoped and scoped classless) with print sheets
      and token presets as separate outputs beside them; the twenty inherited accent themes are one default theme
      plus a few token-override
      presets; <code>.grid</code> is now an intrinsically wrapping grid
      and the single-row equal-column layout is
      <a href="/layout/row"><code>.row</code></a>; the CSS-only
      <code>[data-tooltip]</code> is gone, replaced by the native
      <a href="/components/popover">popover</a>, because a message drawn
      with <code>content: attr()</code> cannot be reached by assistive
      technology; and a WCAG 2.2 AA baseline is verified in the source
      with axe over every page, theme and mode. See
      <a href="/about#relationship-to-pico-css">the full comparison</a>.
  - q: Is Cirth affiliated with the Tolkien estate?
    a: >-
      No. The project is not affiliated with, endorsed by, or associated
      with the Tolkien estate, the Tolkien Society, Amazon's Middle-earth
      adaptations, or any other rights holder. The name points at the
      Cirth, an alphabet Tolkien invented for his languages: a small set
      of signs where related sounds take related shapes, so the script is
      learned as a system rather than one sign at a time. That is the
      property the framework is named for, and
      <a href="/about#origin-of-the-name">About</a> explains it. It is a
      reference, not a claim of license or partnership. The mark, the
      wordmark and the rest of the project's identity are Cirth's own work
      and are unrelated to Tolkien's; <a href="/brand">Brand</a> sets out
      where they come from and how they may be used.
  - q: What license is Cirth under?
    a: >-
      The code is under the
      <a href="https://github.com/cirthcss/cirth/blob/master/LICENSE.md">Apache
      License 2.0</a>, which is also what
      <code>@cirthcss/cirth</code> declares on npm. You can use it in
      commercial and closed-source work, modify it, and redistribute it,
      including as part of a larger product, provided you keep the license
      and copyright notices and state what you changed; it also grants a
      patent license, and it comes with no warranty. Cirth is a fork of
      Pico CSS, which was MIT.
      <a href="https://github.com/cirthcss/cirth/blob/master/NOTICE.md">NOTICE.md</a>
      records that history. The name and the logo are not covered by the
      code license: they are brand assets with their own terms, set out on
      the <a href="/brand">Brand</a> page.
---

# Why Cirth

Cirth is a CSS framework that styles the HTML elements you already write.
A `<button>`, a `<nav>`, an `<article>`, a `<table>` or a `<dialog>` comes out
finished, accessible and themeable, without a class vocabulary to learn first
and without a script to run.

<dl class="grid docs-facts">
<div><dt>Markup</dt><dd>Semantic HTML. Classes only where you want them</dd></div>
<div><dt>Runtime</dt><dd>0 B of JavaScript</dd></div>
<div><dt>Frameworks</dt><dd>Any: it styles the DOM, whoever renders it</dd></div>
<div><dt>Accessibility</dt><dd>WCAG 2.2 AA baseline, audited on every push</dd></div>
</dl>

## HTML is the API

Most CSS frameworks give you a second language to write on top of HTML: a set
of class names, or a set of components, that you learn and then keep in sync
with the markup. Cirth's vocabulary is HTML's own. The element you choose for
its meaning is the element that gets styled:

```html
<article>
  <header><h2>Invite a teammate</h2></header>
  <label>
    Email
    <input type="email" required>
  </label>
  <footer><button>Send invite</button></footer>
</article>
```

That is a card with a title band, a labelled field with validation, and a
footer action. Nothing in it is specific to Cirth, so it is also the markup a
screen reader, a search engine, a test and a code-generating model already
understand.

## Pure CSS, nothing to run

The package is compiled CSS. Accordions, dropdowns, modals and popovers are
the browser's own `<details>`, `<dialog>` and `[popover]` elements, so they
open, close, trap focus and dismiss with no script from Cirth. There is no
runtime to load, initialize, or keep in step with the DOM.

Your application keeps whatever JavaScript it needs for data, state and
routing. Cirth styles the result.

## Framework agnostic

Because it styles elements rather than shipping components, Cirth has
nothing to integrate with. It does not provide React, Vue or Svelte
components and does not need to: a JSX `<button>`, a Vue template's
`<button>` and a server-rendered `<button>` are the same element by the time
the browser styles it. The [guides](/installation/#guides) show where the
one import goes in each, from Laravel and Django to Vite and Yew.

## Customizable at runtime

Every colour, radius, font, spacing step and duration is a `--cirth-*`
custom property. Change one in a plain stylesheet, after Cirth or anywhere
else, and everything derived from it follows: set `--cirth-primary` and the
buttons, links, focus rings and checked controls take the new accent. No
rebuild, no config file. Cirth's rules sit in a cascade layer, so your own
CSS wins without a specificity fight. See [Customization](/customization) and
[Themes](/themes).

## Accessible by default

Contrast meets WCAG 2.2 AA in both colour schemes and in every shipped
preset. Focus is always visible, including under Windows High Contrast.
Buttons and form controls are at least 44px tall (40px inside a navigation
bar). `prefers-reduced-motion` and `prefers-contrast: more` are honoured
without a class. Every page of this site is audited with axe, in every theme
and mode, on every push.

That is a floor Cirth checks for its own elements and defaults. It is not a
verdict on the interface you build on top of it, which still needs its own
testing. [Accessibility and user preferences](/guides/accessibility) covers
what Cirth does and what stays your job.

## Four builds, one source

- **Default** styles semantic HTML and adds a few optional classes
  (`.container`, `.grid`, `.secondary`, `.outline`).
- **Classless** adds none: the page's landmarks are the layout.
- **Scoped** styles only what is inside a `.cirth` element, for embedding in
  a page that already has its own CSS.
- **Scoped classless** is both.

[What the package contains](/compatibility#what-the-package-contains) lists
the import path of each.

## Where Cirth fits

- Sites, documentation and internal tools where standard elements (forms,
  tables, navigation, articles) make up most of the interface.
- Projects that want a finished, accessible baseline without adopting or
  maintaining a design system.
- Teams that want no shipped JavaScript and no required build step.
- Embedding a consistent baseline inside an existing application or CMS,
  through the scoped build.

## Where it does not

- Highly custom, brand-driven interfaces designed component by component: a
  utility-first workflow or a bespoke design system fits that job better.
- Products that need a large catalogue of prebuilt widgets beyond layout,
  forms and Cirth's small set of components.
- Teams already standardized on another approach with no specific reason to
  add a second one.

## Before you install

The questions people ask before adding Cirth to a project. Each answer is
one `<details>` element, and the group is exclusive because every one of
them carries `name="faq"`: the browser closes the open one when you open
another.

{% set measuredSize = proof.size.label if proof.size else "about 15 KB" -%}
{%- for item in faq %}
<details name="faq">
<summary>{{ item.q }}</summary>
<p>{{ item.a | replace("<!--browsers-->", browsers.sentence) | replace("<!--size-->", measuredSize) | safe }}</p>
</details>
{%- endfor %}

## Next steps

- [Compatibility](/compatibility): whether your browsers, your build and the
  CSS you already have are ready for it.
- [Installation](/installation/): a CDN link or an npm import.
- [Examples](/examples): complete interfaces built from plain elements.
- [About](/about): where Cirth came from, and how the project decides what to
  include.
