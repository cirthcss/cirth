---
layout: home.njk

hero:
  eyebrow: HTML-native CSS framework
  name: Cirth
  text: Production-ready UI from semantic HTML.
  tagline: >-
    Cirth turns native HTML elements into accessible, themeable interfaces.
    Load one stylesheet, customize it with runtime design tokens, and ship
    with zero JavaScript and no required build step.
  actions:
    - theme: brand
      text: Get Started
      link: /get-started
    - theme: alt
      text: Examples
      link: /examples

pitch:
  eyebrow: Proof, not promises
  title: A production-ready baseline, out of the box.
  lede: >-
    Every number below is checked automatically, on every build — not a
    claim you have to take on faith.
  items:
    - value: <14KB gzipped
      details: >-
        The default stylesheet is a strict maximum limit for gzip compression during each build; failing that, the build fails.
    - value: 0 JavaScript
      details: >-
        Accordions, dropdowns, and modals run on native
        <code>&lt;details&gt;</code> and <code>&lt;dialog&gt;</code>
        behavior. Nothing shipped, nothing to hydrate.
    - value: WCAG 2.2 AA
      details: >-
        Contrast, visible focus rings, and 44px touch targets are checked
        in the source, not left to integrators to add later.
    - value: 246 tokens
      details: >-
        Every color, spacing, radius, and font is a runtime
        <code>--cirth-</code> custom property, overridable without a
        rebuild.

stack:
  eyebrow: What's in the box
  title: Small surface, finished defaults
  lede: >-
    Six responsibilities, one stylesheet, and an explicit boundary between
    browser behavior, Cirth defaults, and author composition.
  items:
    - title: Semantic HTML first
      details: >-
        Standard elements — <code>nav</code>, <code>article</code>,
        <code>button</code>, <code>table</code>, <code>details</code> —
        carry the styling. Add a class only where HTML semantics run out.
      badges:
        - "<nav>"
        - "<article>"
        - "<button>"
        - "<table>"
        - "<details>"
    - title: Fully customizable theme
      details: >-
        Every color, spacing, radius, font, and shadow is a
        <code>--cirth-</code> custom property. Override them after
        loading the framework — no build step, no Sass.
      badges:
        - --cirth-primary
        - --cirth-spacing
        - --cirth-border-radius
        - custom properties
    - title: Classless & scoped builds
      details: >-
        Ship the default build, a classless build for markup close to
        zero, or a scoped build that only styles inside a
        <code>.cirth</code> container.
      badges:
        - Default
        - Classless
        - Scoped
        - Scoped + classless
    - title: Light and dark out of the box
      details: >-
        The default theme ships light and dark variants, switching
        automatically with <code>prefers-color-scheme</code> or forced
        with <code>data-theme</code>.
      badges:
        - prefers-color-scheme
        - data-theme
    - title: Interactive without JavaScript
      details: >-
        Accordions, dropdowns, and modals build on native
        <code>&lt;details&gt;</code> and <code>&lt;dialog&gt;</code>
        elements and their native behavior — no runtime, nothing to
        hydrate.
      badges:
        - "<details>"
        - "<dialog>"
    - title: Accessible by default
      details: >-
        Visible focus rings that survive Windows High Contrast, 44px
        touch targets, and <code>prefers-reduced-motion</code> /
        <code>prefers-contrast</code> support are checked in the source,
        not bolted on after.
      badges:
        - forced-colors
        - 44px targets
        - prefers-contrast

showcase:
  eyebrow: Samples
  title: See Cirth in action
  lede: >-
    Three interfaces built entirely from documented components — full HTML
    source included.
  items:
    - icon: code
      title: Documentation site
      details: Sidebar nav, prose, code blocks
      link: /examples#documentation
    - icon: layers
      title: Dashboard
      details: Cards, tables, live retheming
      link: /examples#dashboard
    - icon: sliders
      title: Settings form
      details: Validation, scoped build
      link: /examples#settings-form
  link: /examples
  linkText: View all examples

faq:
  eyebrow: Questions
  title: Before you install
  items:
    - q: Do I need to write any JavaScript?
      a: >-
        No. Cirth ships zero JavaScript. Accordions, dropdowns, and modals
        are native <code>&lt;details&gt;</code> and
        <code>&lt;dialog&gt;</code> elements, styled by the framework and
        driven by the browser's own behavior.
    - q: Is a build step required?
      a: >-
        No. Add one <code>&lt;link rel="stylesheet"&gt;</code> (or one
        <code>import</code> in a bundler) and standard elements are
        styled. SCSS exists in the repository to produce the compiled
        output; it isn't a public Sass API you need to compile yourself.
    - q: How big is the default stylesheet?
      a: >-
        <14KB gzipped, currently. Every build is checked against that
        budget on every commit by
        <a href="https://github.com/cirthcss/cirth/blob/master/scripts/check-css-size.js">a
        script</a> that gzips the real output and fails the build if any
        bundle crosses it.
    - q: Which browsers are supported?
      a: >-
        The latest stable Chrome, Edge, Firefox, Opera and Safari, on
        desktop and mobile — including Chrome and Firefox for Android and
        Samsung Internet, together about 78% of global browser usage.
        Compiled against that exact Browserslist target with Lightning
        CSS. No version of Internet Explorer is supported.
    - q: How is this different from Pico CSS?
      a: >-
        Cirth started as a fork of Pico CSS. It now has its own package
        name, a reduced single-theme color system, a runtime token
        surface, and a WCAG 2.2 AA baseline checked in the source — see
        <a href="/about#relationship-to-pico-css">the full comparison</a>.
    - q: Is Cirth affiliated with the Tolkien estate?
      a: >-
        No. The name references the real-world Cirth runic alphabet as a
        design metaphor for the framework's size constraints, not a
        license or partnership — see <a href="/brand">Brand</a>.
    - q: What license is Cirth under?
      a: >-
        Apache License 2.0 for the code. The name and logo are separate
        brand assets with their own terms, documented on the
        <a href="/brand">Brand</a> page.
---
