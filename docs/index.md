---
layout: home

hero:
  eyebrow: Semantic HTML first
  name: Cirth
  text: Write HTML. It's already styled.
  tagline: >-
    Standard elements carry the styling: nav, article, button, table.
    Classes exist only for the few things HTML can't say. No JavaScript,
    no build step, ~13KB gzipped.
  actions:
    - theme: brand
      text: Get Started
      link: /get-started
    - theme: alt
      text: Examples
      link: /examples

stats:
  - value: ~13KB
    label: Default build, gzipped
  - value: "0"
    label: Lines of JavaScript
  - value: AA
    label: WCAG 2.2 compliance

comparison:
  eyebrow: The tradeoff
  title: One button, two ways to write it
  lede: >-
    Utility CSS frameworks style through class recipes, repeated at every
    call site. Cirth styles the element itself and keeps customization in
    CSS custom properties, so the markup stays yours.
  sides:
    - label: Utility CSS
      count: 16 classes
      code: |-
        <button class="inline-flex items-center
          justify-center rounded-lg bg-amber-600
          px-5 py-2.5 text-base font-semibold
          text-white shadow-sm hover:bg-amber-700
          focus-visible:outline-2
          focus-visible:outline-offset-2
          focus-visible:outline-amber-600
          disabled:opacity-50">
          Save changes
        </button>
    - label: Cirth
      count: 0 classes
      code: |-
        <button>
          Save changes
        </button>
  note: >-
    Both render the same button, including hover, focus ring, disabled state, dark
    mode, and the 44px target size. In Cirth they're part of the element,
    and restyling is one token instead of a manual search across class lists.

featuresEyebrow: What's in the box
featuresTitle: Small surface, finished defaults

features:
  - icon: code
    title: Semantic HTML first
    details: >-
      Standard elements such as <code>nav</code>, <code>article</code>,
      <code>button</code>, <code>table</code>, and <code>details</code> carry
      the styling. Add a class only where HTML semantics run out.
  - icon: sliders
    title: Fully customizable theme
    details: >-
      Every color, spacing, radius, font, and shadow is one of hundreds of
      <code>--cirth-</code> custom properties. Override them after loading
      the framework and the whole theme follows, with no build step and no Sass.
  - icon: layers
    title: Classless & scoped builds
    details: >-
      Ship the default build, a classless build for markup close to zero, or a
      scoped build that only styles inside a <code>.cirth</code> container.
  - icon: moon
    title: Light and dark out of the box
    details: >-
      The default theme ships a light and dark variant, switching
      automatically with <code>prefers-color-scheme</code> or forced via
      <code>data-theme</code>.
  - icon: zap
    title: Interactive without JavaScript
    details: >-
      Accordions, dropdowns, and modals build on native elements,
      <code>details</code> and <code>dialog</code>, and their native
      behavior. Nothing to initialize, nothing to break.
  - icon: shield
    title: Accessible by default
    details: >-
      WCAG 2.2 AA contrast, visible focus rings that survive Windows High
      Contrast, 44px touch targets, and <code>prefers-reduced-motion</code>
      support, all verified in the source rather than bolted on.

closing:
  text: >-
    Cirth takes its name from a runic alphabet designed for carving, where
    strokes are reduced to what the material allows. This framework applies the
    same discipline to CSS.
  actions:
    - text: About Cirth
      link: /about
    - text: Brand
      link: /brand
---
