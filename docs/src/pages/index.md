---
layout: home.njk
stylesheets:
  - home.css

hero:
  tagline: >-
    Cirth is a CSS framework for the HTML you already write. There are no
    class names to learn and no JavaScript to ship: one stylesheet turns
    standard elements into an accessible, themeable interface, whatever
    renders them.
  actions:
    - theme: brand
      text: Get started
      link: /installation
    - theme: alt
      text: Browse examples
      link: /examples

# The scroll story: three beats, each paired with what it shows. The third
# heading keeps its point verbatim, because it is the whole argument.
story:
  - title: Don't reinvent every interface.
    text: >-
      Buttons, fields, tables and dialogs are rebuilt in every project, then
      restyled, then maintained. Most of that work repeats what the browser
      already provides.
  - title: Instead of writing 100 class names,
    text: >-
      describe what each part is. An article, a label, a select, a footer:
      the element already carries the meaning, the keyboard behaviour and
      the accessibility.
  - title: use only semantic HTML tags.
    text: >-
      Cirth styles those elements directly. The same markup becomes a
      finished card with a title band, labelled fields and an action, in
      light or dark, with no class added.

# The proof strip. `kind` says what sort of statement each one is:
# a guarantee is something the project would treat a break of as a bug;
# a capability is something Cirth lets you do.
claims:
  - kind: guarantee
    title: 0 B of JavaScript
    text: Cirth ships no runtime. Your application keeps whatever JavaScript it needs for its own behaviour.
    check: How it works
    link: /why-cirth#pure-css-nothing-to-run
  - kind: guarantee
    title: WCAG 2.2 AA baseline
    text: Axe audits every page of this site in every theme, scheme and forced colors. A floor to build on, not a verdict on your interface.
    check: The method
    link: /guides/accessibility#the-baseline
  - kind: guarantee
    title: Semantic elements first
    text: Native elements are styled directly, and the examples on this site carry no class they do not need.
    check: See the examples
    link: /examples
  - kind: guarantee
    title: Small by construction
    text: Element selectors and custom properties, no component catalogue and nothing to run. Every bundle has a size budget.
    check: Why it stays small
    link: /about#size-and-what-it-is-a-budget-for
  - kind: capability
    title: Runtime design tokens
    text: Every colour, space, radius and font is a <code>--cirth-*</code> property you can override in plain CSS.
    check: Override one
    link: /customization
  - kind: capability
    title: Flexible distribution
    text: Classless and scoped builds, with print sheets and token presets as optional outputs beside them.
    check: Compare builds
    link: /installation/#choose-a-build

pitch:
  lede: >-
    Two kinds of statement. A guarantee is a property the project would
    treat a break of as a bug; a capability is something Cirth lets you do.
    Each one links to where you can check it.

faq:
  title: Before you install
  items:
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
