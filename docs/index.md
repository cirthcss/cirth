---
layout: home

hero:
  eyebrow: Lightweight · Semantic · Customizable
  name: Cirth
  text: Semantic by default. Classes only when needed.
  tagline: >-
    Semantic-first CSS for production-ready interfaces with clean HTML,
    modern CSS, and minimal class noise.
  actions:
    - theme: brand
      text: Get Started
      link: /get-started
    - theme: alt
      text: Customization
      link: /customization
    - theme: alt
      text: GitHub
      link: https://github.com/cirthcss/cirth

stats:
  - value: ~13KB
    label: Default build, gzipped
  - value: "0"
    label: Lines of JavaScript
  - value: Light + Dark
    label: Built-in color schemes
  - value: MIT
    label: Open source license

features:
  - icon: code
    title: Semantic HTML first
    details: >-
      Standard elements — <code>nav</code>, <code>article</code>,
      <code>button</code>, <code>table</code>, <code>details</code> — carry
      the styling. Add a class only where HTML semantics run out.
  - icon: sliders
    title: CSS custom properties
    details: >-
      Every color, spacing, radius, and font is a <code>--cirth-</code>
      custom property. Override them after loading the framework; no build
      step required.
  - icon: layers
    title: Classless & scoped builds
    details: >-
      Ship the default build, a classless build for near-zero markup, or a
      scoped build that only styles inside a <code>.cirth</code> container.
  - icon: moon
    title: Light and dark out of the box
    details: >-
      The default theme ships a light and dark variant, switching
      automatically with <code>prefers-color-scheme</code> or forced via
      <code>data-theme</code>.
  - icon: package
    title: One theme, optional presets
    details: >-
      Amber is the single official theme. <code>cobalt</code> (corporate)
      and <code>coral</code> (playful) are optional token-override presets
      you load after it — no Sass required.
  - icon: shield
    title: Small, focused surface
    details: >-
      No JavaScript, no utility-class soup, no component catalog. Layout
      primitives, forms, and a small set of components — nothing else.
---
