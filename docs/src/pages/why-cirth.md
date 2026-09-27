---
layout: docs.njk
description: Cirth turns semantic HTML into a finished, accessible interface with one stylesheet. No class vocabulary, no JavaScript runtime, no framework lock-in.
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
the browser styles it. The [framework guides](/installation/#framework-guides)
show where the one import goes in each.

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

[Installation](/installation/#choose-a-build) helps you choose.

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

## Next steps

- [Installation](/installation/): a CDN link or an npm import.
- [Examples](/examples): complete interfaces built from plain elements.
- [About](/about): where Cirth came from, and how the project decides what to
  include.
