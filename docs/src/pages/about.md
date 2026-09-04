---
layout: docs.njk
---

# About Cirth

Cirth is an HTML-native CSS framework: a stylesheet that styles standard
HTML elements directly — `<button>`, `<nav>`, `<article>`, `<table>`,
`<dialog>` — instead of asking you to learn a parallel vocabulary of class
names first. Load it, write semantic markup, and most of an interface is
already a finished, accessible baseline.

<section class="docs-proof-strip" aria-labelledby="about-proof-title">
  <header><h2 id="about-proof-title">The contract, at a glance.</h2></header>
  <dl>
    <div><dt>Semantic baseline</dt><dd><strong>covered</strong><small>native element selectors</small></dd></div>
    <div><dt>Accessibility</dt><dd><strong>verified</strong><small>WCAG 2.2 AA floor</small></dd></div>
    <div><dt>Distributed runtime</dt><dd><strong>0 B JS</strong><small>CSS package only</small></dd></div>
    <div><dt>Default footprint</dt><dd><strong>{{ proof.size.label }}</strong><small>gzipped, measured in this build</small></dd></div>
    <div><dt>Build modes</dt><dd><strong>{{ proof.buildCount }}</strong><small>default / classless / scoped</small></dd></div>
    <div><dt>Runtime surface</dt><dd><strong>{{ proof.tokenCount }}</strong><small><code>--cirth-*</code> tokens</small></dd></div>
  </dl>
</section>

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
- **A monitored compressed size for every shipped stylesheet** (below).

## Size, and what it is a budget for

The default stylesheet is **{{ proof.size.label }} gzipped in this build**,
measured from `dist/cirth.min.css`. Every shipped bundle carries its own
budget, checked automatically on every build by
[`scripts/check-css-size.js`](https://github.com/cirthcss/cirth/blob/master/scripts/check-css-size.js)
— the four root builds and the four print sheets, each a few hundred bytes
above what it currently measures.

### Why small matters here

Around 14 KiB is a meaningful threshold, and it is why this project pays
attention at all. It approximates the
[initial congestion window](https://datatracker.ietf.org/doc/html/rfc6928)
TCP and [QUIC](https://www.rfc-editor.org/rfc/rfc9002.html#section-7.2) use
for a new connection — the data a server can send before it has to pause and
wait for the client's first acknowledgment. A stylesheet that fits inside
that first flight can start rendering styled content without an extra round
trip, when network conditions allow it. That was never a guarantee about any
individual request: actual delivery depends on TLS overhead, HTTP version,
prior congestion state, and the network path.

### Why it is a guard and not a promise

It used to be written as a single ceiling — "under 14 KB" — applied to every
file in `dist/`. That number was doing two jobs, and doing both badly.

As a guard it watched one bundle. The print sheets are under 900 bytes, so a
shared 14 KB ceiling would have let them grow sixteenfold in silence, and the
classless builds had two kilobytes of unwatched room. Only the scoped build
was ever near the line.

As a promise it was worse, because a round number a reader can hold you to
starts buying the wrong things. By the end it was the reason `<dl>` still
carried the browser's 40px indent, a disclosure marker sat four pixels above
its own line, and a vertical nav painted its current-page rail outside the
container that clipped it. Those are defects, and none of them was worth
226 bytes.

Cirth is small because its model is small: element selectors and custom
properties, no component catalogue, and nothing to run. It is not small
because it leaves native elements unfinished. So the number is now a
per-bundle regression guard — cross a line and the build stops and asks —
raised deliberately, in the change that needs it, with the reason in the
commit.

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
keeps every shipped stylesheet within a monitored compressed size budget.

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
  verified in the source, and every shipped stylesheet is held to a gzipped
  size budget checked on every build.

## Project and license

- Contributing: [Contributions](/contributions)
- License: [Apache License 2.0](https://github.com/cirthcss/cirth/blob/master/LICENSE.md)
