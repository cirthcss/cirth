---
layout: docs.njk
---

# About Cirth

Cirth is an HTML-native CSS framework: a stylesheet that styles standard
HTML elements directly — `<button>`, `<nav>`, `<article>`, `<table>`,
`<dialog>` — instead of asking you to learn a parallel vocabulary of class
names first. Load it, write semantic markup, and most of an interface is
already a finished, accessible baseline.

## What Cirth is

- A CSS framework distributed as compiled stylesheets, published to npm as
  `@cirthcss/cirth` and available from a CDN with no install step.
- A runtime design token system: hundreds of `--cirth-` custom properties
  drive color, spacing, radius, type, and motion, overridable in plain CSS
  after the stylesheet loads.
- Zero JavaScript. Interactive patterns — accordion, dropdown, modal — are
  built on native `<details>` and `<dialog>` behavior, not a runtime.
- Four builds — default, classless, scoped, and scoped classless — so the
  same token system can style a page directly, style zero-class markup, or
  stay scoped inside a `.cirth` wrapper.

## How it works

The framework ships compiled CSS only; there's nothing to run. Add one
`<link rel="stylesheet">` (or one `import` in a bundler) and standard
elements pick up their styling immediately — no template step, no
JavaScript hydration, no class list to author. Customization happens by
overriding CSS custom properties in an ordinary stylesheet loaded after
Cirth's: change `--cirth-primary` once, and every button, link, and focus
ring that derives from it updates, with no compiler in between. SCSS exists
in the repository as internal build infrastructure for producing the
compiled output; it is not a published Sass API.

## Technical constraints

Cirth is deliberately small, and stays that way by design, not by
accident:

- **No JavaScript.** Nothing to initialize, no client-side runtime to keep
  in sync with the DOM.
- **No large component catalog.** Layout primitives, forms, typography,
  and a small set of components. A pattern that needs a tower of `div`
  elements to work doesn't belong in the default build.
- **Runtime tokens, not build-time variables.** Every color, spacing,
  radius, font, and shadow is a `--cirth-` custom property, overridable
  after the stylesheet loads — no Sass, no rebuild.
- **A fixed compressed size budget for the default stylesheet** (below).

## The 14KB size budget

The default stylesheet is held to a size budget of under 14KB gzipped,
checked automatically on every build by
[`scripts/check-css-size.js`](https://github.com/cirthcss/cirth/blob/master/scripts/check-css-size.js)
against all four `dist/*.min.css` bundles.

14 KiB (14,336 bytes) is not an arbitrary round number: it approximates the
[initial congestion window](https://datatracker.ietf.org/doc/html/rfc6928)
TCP and [QUIC](https://www.rfc-editor.org/rfc/rfc9002.html#section-7.2) use
for a new connection — the data a server can send before it has to pause
and wait for the client's first acknowledgment. Keeping the default
stylesheet under that ceiling means it fits inside that first flight of
data when network conditions allow it, rather than needing an extra round
trip before the browser can start rendering styled content. This is a
budget the CSS is written against, not a guarantee that any given request
is delivered in a single round trip — actual delivery still depends on TLS
overhead, HTTP version, prior congestion state, and the network path.

## Accessibility baseline

WCAG 2.2 AA contrast, visible focus rings that survive Windows High
Contrast / forced-colors mode, 44px touch targets, and
`prefers-reduced-motion` / `prefers-contrast: more` support are checked in
the source rather than left to integrators to add. This is a floor Cirth verifies for its own
components and default theme — a baseline, not a substitute for testing
the accessibility of the interface you build on top of it.

## Where Cirth fits

- Sites and internal tools where standard HTML elements — forms, tables,
  nav, articles — cover most of the interface.
- Projects that want a production-ready baseline without adopting or
  maintaining a design system.
- Teams that want zero shipped JavaScript and no required build step.
- Embedding a consistent baseline into an existing app, CMS, or design
  system through the scoped build, without it leaking into surrounding
  markup.

## Where Cirth does not fit

- Highly custom, brand-driven interfaces designed and built
  component-by-component — a utility-first workflow or a bespoke design
  system fits that job better.
- Projects that need a large, pre-built component catalog beyond layout,
  forms, and Cirth's small component set.
- Teams already standardized on a different workflow with no specific
  reason to add a second one.

## Origin of the name

Cirth takes its name from the runic writing system used by Tolkien's
Dwarves: angular signs shaped by the need to be carved into hard surfaces.

The same principle guides the framework. Cirth starts from the structure
the web already provides, removes unnecessary runtime and abstraction, and
keeps its default stylesheet within a strict compressed size budget.

Not minimalism for its own sake. Constraints used as an engineering tool.

The visual identity built on that idea — the rune-form mark, the amber
hue, and the wordmark — is documented on the [Brand](/brand) page. Cirth
is not affiliated with the Tolkien estate or any rights holder; the name
is a reference, not a claim of association.

## Relationship to Pico CSS

Cirth began as a fork of [Pico CSS](https://picocss.com), which pioneered
this approach, and it remains indebted to that work. Treat Cirth as an
independent framework rather than a promise of permanent direct
compatibility. The most important differences for users are:

- The package name is `@cirthcss/cirth` and the custom property prefix is
  `--cirth-`.
- The published package is CSS only; SCSS is repository source, not a
  public Sass API.
- The active build set is default, classless, scoped, and scoped
  classless.
- Scoped builds target a `.cirth` wrapper, including custom properties,
  document styles, color schemes, and modal states.
- The inherited set of twenty accent themes has been reduced to a single
  official theme (amber), with `plain` and `playroom` published as optional
  token override presets; see [Colors](/colors).
- A WCAG 2.2 AA baseline (contrast, focus visibility, target size) is
  verified in the source, and the default stylesheet is held to a 14KB
  gzipped size budget checked on every build.

## Project and license

- Contributing: [Contributions](/contributions)
- License: [Apache License 2.0](https://github.com/cirthcss/cirth/blob/master/LICENSE.md)
