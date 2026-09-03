---
layout: home.njk

hero:
  tagline: >-
    Cirth turns native HTML elements into accessible, themeable interfaces.
    Load one stylesheet, customize it with runtime design tokens, and ship
    an interface that needs no JavaScript runtime and no build step.
  actions:
    - theme: brand
      text: Get Started
      link: /get-started
    - theme: alt
      text: Examples
      link: /examples

pitch:
  lede: >-
    Not everything below is the same kind of statement. Some are
    guarantees — properties the project intends to keep. Some are
    capabilities: things Cirth lets you do, which say nothing about what
    you build with them. One is a current fact, measured on this build and
    free to move. Each cell says which it is, and how to check it.
faq:
  title: Before you install
  items:
    - q: Do I need to write any JavaScript?
      a: >-
        Cirth itself does not require or ship any. The package is compiled
        CSS, and the interactive patterns it styles — accordion, dropdown,
        modal, popover — are native <code>&lt;details&gt;</code>,
        <code>&lt;dialog&gt;</code> and <code>[popover]</code> elements
        driven by the browser. Your application can still use JavaScript
        wherever its own behavior needs it: data, state, routing, anything
        it builds in the DOM. Cirth styles what is there, whoever put it
        there.
    - q: Is a build step required?
      a: >-
        No. One <code>&lt;link rel="stylesheet"&gt;</code> — or one
        <code>import</code> where you already bundle — and standard
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
        current budget, so the number stays honest — and it is free to move
        when covering more HTML, or a better accessibility default, is
        worth the bytes.
    - q: Which browsers are supported?
      a: >-
        <!--browsers-->. That is the Browserslist target in
        <code>package.json</code> — what Lightning CSS compiles the output
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
        is CSS only, in classless and scoped forms — four builds today,
        default, classless, scoped and scoped classless — with print sheets
        and token presets as separate outputs beside them; the twenty inherited accent themes are one theme (amber)
        plus <code>plain</code> and <code>playroom</code> as token-override
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
        Cirth runic alphabet — an angular script cut for carving, where
        every letter is reduced to the strokes the material allows — because
        that reduction is the constraint this framework is built around. It
        is a reference, not a claim of license or partnership. The mark, the
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
        Pico CSS, which was MIT —
        <a href="https://github.com/cirthcss/cirth/blob/master/NOTICE.md">NOTICE.md</a>
        records that history. The name and the logo are not covered by the
        code license: they are brand assets with their own terms, set out on
        the <a href="/brand">Brand</a> page.
---
