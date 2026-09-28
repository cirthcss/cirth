---
layout: docs.njk
description: Where Cirth came from, what its name means, how it relates to Pico CSS, how the project thinks about size, and the license it is released under.
---

# About

Cirth is an open-source CSS framework, designed and maintained by Riccardo
Pastori with help from its
[contributors](https://github.com/cirthcss/cirth/graphs/contributors). This
page is the project's own story: where it came from, what the name means, and
a few decisions that shape what goes into it. For what Cirth does and whether
it fits your project, read [Why Cirth](/why-cirth).

<section class="docs-proof-strip" aria-labelledby="about-proof-title">
  <header><h2 id="about-proof-title">The project, at a glance.</h2></header>
  <dl class="grid">
    <div><dt>Package</dt><dd><strong>@cirthcss/cirth</strong><small>compiled CSS, on npm and jsDelivr</small></dd></div>
    <div><dt>Distributed runtime</dt><dd><strong>0 B JS</strong><small>CSS package only</small></dd></div>
    <div><dt>Default footprint</dt><dd><strong>{{ proof.size.label }}</strong><small>gzipped, measured in this build</small></dd></div>
    <div><dt>Build modes</dt><dd><strong>{{ proof.buildCount }}</strong><small>default / classless / scoped</small></dd></div>
    <div><dt>Runtime surface</dt><dd><strong>{{ proof.tokenCount }}</strong><small><code>--cirth-*</code> tokens</small></dd></div>
    <div><dt>License</dt><dd><strong>Apache 2.0</strong><small>code; the brand has its own terms</small></dd></div>
  </dl>
</section>

## Origin

Cirth began as a fork of [Pico CSS](https://picocss.com), which pioneered
styling semantic HTML directly, and it remains indebted to that work. It has
since become an independent framework with its own theme, builds, token
system and accessibility baseline, rather than a promise of compatibility
with its origin.

## Relationship to Pico CSS

The most important differences for someone who knows Pico:

- The package name is `@cirthcss/cirth` and the custom property prefix is
  `--cirth-`.
- The published package is CSS only; SCSS is repository source, not a public
  Sass API.
- The builds are default, classless, scoped and scoped classless. Scoped
  builds target a `.cirth` wrapper, including custom properties, document
  styles, colour schemes and modal states.
- The twenty inherited accent themes became one official default theme,
  with `plain` and `playroom` published as optional token presets; see
  [Colors](/colors).
- `.grid` is an intrinsically wrapping grid, and the single-row
  equal-column layout is [`.row`](/layout/row).
- The CSS-only `[data-tooltip]` is gone, replaced by the native
  [popover](/components/popover), because a message drawn with
  `content: attr()` cannot be reached by assistive technology.
- A WCAG 2.2 AA baseline (contrast, focus visibility, target size) is
  verified on every page of this site, and every shipped stylesheet is held
  to a gzipped size budget checked on every build.

## Origin of the name

The Cirth are an invented alphabet, devised by Tolkien for his languages: a
small set of signs where related sounds are given related shapes, so the
script can be learned as a system rather than memorised sign by sign.

That is the part worth borrowing. A framework is a notation you write an
interface in, and the property that makes a notation usable is not how much
it can express but how much of it you can predict. Cirth has almost no
vocabulary of its own: the elements are HTML's, the theming surface is one
prefixed set of custom properties, and the relationships hold across the
whole of it. A container keeps a softer corner than the controls inside it
everywhere. Every resting edge is the same hairline. Learning one part tells
you what the next one does.

Nothing here requires the reference. It explains where the name came from,
not how the framework works, and the [Brand](/brand) page documents the mark,
the accent and the terms the name is used under. Cirth is not affiliated with
the Tolkien estate or any rights holder: the name points at a writing system,
and is not a claim of association.

## What the project includes

Cirth stays small by design:

- **No JavaScript.** Nothing to initialize, and no client-side runtime to
  keep in step with the DOM.
- **No large component catalogue.** Layout primitives, forms, typography and
  a small set of components. A pattern that needs a tower of `div` elements
  to work does not belong in the default build.
- **Runtime tokens, not build-time variables.** Every colour, spacing step,
  radius, font and shadow is a `--cirth-*` custom property you can override
  after the stylesheet loads.
- **A monitored compressed size for every shipped stylesheet**, described
  below.

## Size, and what it is a budget for

The default stylesheet is **{{ proof.size.label }} gzipped in this build**,
measured from `dist/cirth.min.css`. Every shipped bundle carries its own
budget, checked on every build by
[`scripts/check-css-size.js`](https://github.com/cirthcss/cirth/blob/master/scripts/check-css-size.js),
which covers the four builds, the four print sheets and both presets, each
with deliberate headroom above what it measures today.

The quoted figure is gzip because that is what ordinary delivery sends. A
host that precompresses the file and serves it with `Content-Encoding: br`
gets the same bundle in {{ proof.size.brotliLabel }}, but that is a best
case you arrange, not something installing the package provides.

### Why small matters here

Around 14 KiB approximates the
[initial congestion window](https://datatracker.ietf.org/doc/html/rfc6928)
that TCP and [QUIC](https://www.rfc-editor.org/rfc/rfc9002.html#section-7.2)
use for a new connection: what a server may send before it has to wait for
the client's first acknowledgment. That is why the project pays attention to
size at all.

It is not a line to design against. The window belongs to the connection,
not to the stylesheet, and by the time a stylesheet is requested the
connection has usually carried the HTML and grown past it. A cross-origin
stylesheet pays for DNS, TCP and TLS before any of this applies. So the
threshold is a reason to notice growth, not a promise about any one request;
[Compatibility](/compatibility#delivering-the-stylesheet) covers what
actually decides how fast the file arrives.

### Why it is a guard and not a promise

It used to be written as one ceiling, "under 14 KB", applied to every file.
That number was doing two jobs, and doing both badly.

As a guard it watched one bundle. The print sheets are under 900 bytes, so a
shared 14 KB ceiling would have let them grow sixteenfold in silence, and the
classless builds had two kilobytes of unwatched room.

As a promise it was worse, because a round number a reader can hold you to
starts buying the wrong things. By the end it was the reason `<dl>` still
carried the browser's 40px indent, a disclosure marker sat four pixels above
its own line, and a vertical nav painted its current-page rail outside the
container that clipped it. Those were defects, and none of them was worth
226 bytes.

Cirth is small because its model is small: element selectors and custom
properties, no component catalogue, and nothing to run. It is not small
because it leaves native elements unfinished. So the number is a per-bundle
regression guard: cross a line and the build stops and asks. It is raised
deliberately, in the change that needs it, with the reason in the commit.

## Project and license

- Source, issues and releases:
  [github.com/cirthcss/cirth](https://github.com/cirthcss/cirth)
- Contributing: [Contributions](/contributions)
- Code license:
  [Apache License 2.0](https://github.com/cirthcss/cirth/blob/master/LICENSE.md).
  You can use Cirth in commercial and closed-source work, modify it and
  redistribute it, provided you keep the license and copyright notices and
  state what you changed. Pico CSS, which Cirth was forked from, is MIT;
  [NOTICE.md](https://github.com/cirthcss/cirth/blob/master/NOTICE.md)
  records that history.
- The name and the logo are not covered by the code license. They are brand
  assets with their own terms, set out on the [Brand](/brand) page.
