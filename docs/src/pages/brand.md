---
layout: docs.njk
---

# Brand

Assets and guidelines for representing Cirth in articles, talks,
integrations, and anywhere else the project is named.

<section class="docs-brand-spec" aria-labelledby="signature-title">
  <header class="docs-brand-spec-header">
    <h2 id="signature-title">The part that survives a retheme.</h2>
    <p>Cirth's identity is not the copper. The accent is the first token any
    adopter replaces, and a framework whose character lives entirely in one
    hue has no character left the moment it is adopted. What stays is
    below: proportions, strokes and target sizes that hold in every preset,
    every scheme and every build. Compare
    <a href="/specimen/default/">the default specimen</a> with
    <a href="/specimen/plain/">the plain one</a> — same six measurements,
    different pigment.</p>
  </header>
  <dl class="grid docs-brand-measures">
    <div><dt>Container corner</dt><dd>{% if proof.radius and proof.radius.container %}<code>{{ proof.radius.container }}</code> · {% endif %}<code>--cirth-card-border-radius</code></dd></div>
    <div><dt>Control corner</dt><dd>{% if proof.radius and proof.radius.control %}<code>{{ proof.radius.control }}</code> · {% endif %}<code>--cirth-border-radius</code></dd></div>
    <div><dt>Resting edge</dt><dd><code>1px</code>, all four sides, every button variant</dd></div>
    <div><dt>Target floor</dt><dd><code>44px</code> controls · <code>40px</code> in a nav</dd></div>
    <div><dt>Card contract</dt><dd>Tinted header band · <code>12/20px</code> · padded body</dd></div>
    <div><dt>Spacing unit</dt><dd><code>4px</code> scale · <code>16px</code> default step</dd></div>
  </dl>
</section>

The pairing is the recognisable part. A container is one radius step softer
than the controls inside it, so a card reads as a sheet holding buttons
rather than as a big button. Every resting edge is the same single hairline
— a filled button, an outline button, a field, a card and a popover all draw
the same 1px on all four sides, and none of them fakes relief on one edge.
Interactive targets sit on a 44px floor (WCAG 2.5.5), except inside a
`<nav>`, which opts down to a 40px band while staying above the 24px WCAG
2.5.8 minimum.

Those are the marks to preserve when Cirth is restyled. Replacing
`--cirth-primary` is expected and supported; flattening the radius pair to a
single value, thickening one edge of a control, or dropping the target floor
takes the interface out of the system.

## The mark

Cirth's name comes from a writing system, and the mark is the project's
own sign rather than a letter borrowed from one. It carries the copper the
interface uses for action and position, and it is built to hold at the
sizes technical work actually puts it in: a README header, an npm listing,
a favicon, a tab strip.

The mark is being redrawn. The files in the grid below are the current
ones and remain the assets to use until they are replaced; the geometry
that describes them (construction grid, clearspace, minimum size,
alignment in the lockup) is not published here, because a rule measured
against the outgoing drawing would be wrong about the incoming one.

<section class="docs-brand-spec" aria-labelledby="mark-pending-title">
  <header class="docs-brand-spec-header">
    <h2 id="mark-pending-title">Measured on the mark, not before it.</h2>
    <p>Everything in this list is a number, and a number about a drawing
    can only be taken off that drawing. Each one is specified here once the
    definitive mark is in the repository, and not sooner. What the rest of
    this page documents does not depend on the drawing and is current:
    the colour roles, the typographic voice, the proportions of the
    interface, the terms of use.</p>
  </header>
  <dl class="grid docs-brand-measures">
    <div><dt>Clearspace</dt><dd>Pending the definitive mark</dd></div>
    <div><dt>Minimum size</dt><dd>Pending the definitive mark</dd></div>
    <div><dt>Construction grid</dt><dd>Pending the definitive mark</dd></div>
    <div><dt>Size thresholds</dt><dd>Pending the definitive mark</dd></div>
    <div><dt>Lockup alignment</dt><dd>Pending the definitive mark</dd></div>
    <div><dt>Reduced variant</dt><dd>Pending the definitive mark</dd></div>
  </dl>
</section>

Cirth is not affiliated with, endorsed by, or associated with the
Tolkien estate, the Tolkien Society, Amazon's Middle-earth adaptations,
or any other rights holder. The name is a reference to a real-world
writing system, not a claim of license or partnership.

<div class="docs-brand-grid">
  <figure class="docs-brand-tile" data-theme="light">
    <img src="/logo_brand.svg" alt="Cirth brand mark, copper on light" width="96" height="96" />
    <figcaption>Brand · light</figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/logo_brand.svg" download>SVG</a>
      <a class="secondary" href="/logo_brand.png" download>PNG</a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="light">
    <img src="/logo_mono.svg" alt="Cirth monochrome mark, black on light" width="96" height="96" />
    <figcaption>Mono · light</figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/logo_mono.svg" download>SVG</a>
      <a class="secondary" href="/logo_mono.png" download>PNG</a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="light">
    <img src="/logo_brand_app.svg" alt="Cirth icon on its background tile, light" width="96" height="96" />
    <figcaption>Icon · light</figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/logo_brand_app.svg" download>SVG</a>
      <a class="secondary" href="/logo_brand_app.png" download>PNG</a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="dark">
    <img src="/logo_brand_dark.svg" alt="Cirth brand mark, copper on dark" width="96" height="96" />
    <figcaption>Brand · dark</figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/logo_brand_dark.svg" download>SVG</a>
      <a class="secondary" href="/logo_brand_dark.png" download>PNG</a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="dark">
    <img src="/logo_mono_dark.svg" alt="Cirth monochrome mark, white on dark" width="96" height="96" />
    <figcaption>Mono · dark</figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/logo_mono_dark.svg" download>SVG</a>
      <a class="secondary" href="/logo_mono_dark.png" download>PNG</a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="dark">
    <img src="/logo_brand_app_dark.svg" alt="Cirth icon on its background tile, dark" width="96" height="96" />
    <figcaption>Icon · dark</figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/logo_brand_app_dark.svg" download>SVG</a>
      <a class="secondary" href="/logo_brand_app_dark.png" download>PNG</a>
    </p>
  </figure>
</div>

Each variant above is downloadable as SVG (preferred) or PNG. The full set
lives in
[`docs/public/`](https://github.com/cirthcss/cirth/tree/master/docs/public)
and is catalogued in
[`docs/BRAND_ASSETS.md`](https://github.com/cirthcss/cirth/blob/master/docs/BRAND_ASSETS.md),
including the two combinations this grid does not show — the mono mark on
its own background tile, light and dark, for square containers that have to
stay one colour.

Use the **brand** (copper) mark wherever color is available, matching the
variant to the background. Use **mono** in one color contexts such as print,
badges, embossing. The **icon** variants sit on their own background
tile; use them where the mark needs to fill a square: favicons, social
avatars, bookmark icons. Not for inline use next to text.

## Operational rules

Pick the variant by what the surface can carry, not by taste: **brand**
wherever colour is available, **mono** wherever one flat ink is preferable
or required, the **icon tile** wherever the mark has to fill a square. Give
the mark a margin of clear space on every side and keep other elements out
of it. How much, exactly, is one of the numbers waiting on the definitive
mark; until it is measured, err generous.

The mark is a sign, not a pattern. It marks the project once on a surface:
in a header, on a card, at the foot of a page. It is not a texture, a
watermark, a bullet, or a shape to repeat behind content.

### Incorrect use

Do not stretch it, rotate it, outline it, add a glow or a shadow, recolour
it outside the variants published here, place it on a surface it has no
contrast against, repeat it as wallpaper, or pair it with fantasy imagery.

## Color

The brand color is copper, and in an interface it has exactly two jobs:
**action** and **current position**. A primary button, a focus ring and a
link in running prose are actions. The rail beside the page you are on, the
edge on an active in-page nav item and a selected control are position.
Header navbars are quieter chrome: they use ink and weight rather than an
accent edge. Nothing else in a Cirth interface is copper.

Editorial typography is the one place outside those two, and it is a
deliberate exception rather than a leak: a word or phrase set in the accent
inside a heading, the way this site's home page sets *semantic HTML*. It is
a single named class, applied by hand, in prose — not a component state.

It used to do five. Navigation links carried the accent at rest, which meant
a menu of eight entries was eight brand-coloured words next to one button
that also wanted the colour, and the accent stopped meaning "act on this"
and started meaning "this is a Cirth screen". Navigation now takes the ink
of whatever it sits in and the accent marks only where you are — so the one
thing copper still says, it says alone.

The light theme's base surface is a mineral paper rather than white, and the
card sheet carries the same temperature: the page is not neutral, but the
warmth is a surface property, not a wash of the accent. In dark the base is
a graphite carrying the same stone tint as the neutral scale. Neither scheme
paints the brand hue across backgrounds.

The mark's hue, **44°** in oklch, is the exact hue the framework's entire
copper scale is generated from; the logo sits brighter and more saturated
than the UI tokens because it is an identity color, not a text color. The
scale holds the accent at 70% of its own gamut ceiling so it can cover whole
surfaces without shouting; the mark, which covers a monogram, is free to sit
at 85%.

| Role | Value |
| --- | --- |
| Mark, light backgrounds | `#BD5928` (`oklch(58% 0.143 44deg)`) |
| Mark, dark backgrounds | `#E16B31` (`oklch(66% 0.163 44deg)`) |
| UI primary (light theme) | `oklch(52.7% 0.107 44deg)`, from `$copper-550` |
| UI primary (dark theme) | `oklch(65.7% 0.134 44deg)`, from `$copper-400` |

The dark UI primary is one ladder step deeper than a mirror of the light one
would be. Copper's gamut ceiling climbs steeply past 65% lightness, so the
mirroring step comes out an orange; a step down keeps it reading as metal
and still clears AA on every surface in the scheme.

In interfaces, always use the `--cirth-primary*` tokens rather than the
logo hexes: the tokens are variants verified for WCAG. See
[Colors](/colors) for the full system.

## The lockup

The horizontal lockup is the mark with the name beside it: "Cirth" in the
sans voice, bold, with the mark sized to the cap height and sitting on the
same baseline. Use it where the name has to travel with the mark and there
is room for both — a third-party README, a talk slide, a conference badge,
a social post.

<div class="docs-brand-grid docs-lockup-grid">
  <figure class="docs-brand-tile" data-theme="light">
    <img src="/wordmark.svg" alt="Cirth horizontal lockup, copper mark and graphite name on light" width="240" height="57" />
    <figcaption>Lockup · light</figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/wordmark.svg" download>SVG</a>
      <a class="secondary" href="/wordmark.png" download>PNG</a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="dark">
    <img src="/wordmark_dark.svg" alt="Cirth horizontal lockup, copper mark and paper name on dark" width="240" height="57" />
    <figcaption>Lockup · dark</figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/wordmark_dark.svg" download>SVG</a>
      <a class="secondary" href="/wordmark_dark.png" download>PNG</a>
    </p>
  </figure>
</div>

<p>A one-colour lockup is available as
<a class="secondary" href="/wordmark_mono.svg" download><code>wordmark_mono.svg</code></a>
for print, badges and embossing. It paints with <code>currentColor</code>, so
inline it to give it your own ink; loaded through <code>&lt;img&gt;</code> it
falls back to black, the same as the mono mark.</p>

**The name is live text, not outlines.** The lockup carries `<text>` in the
system sans stack the framework itself ships, which is the whole of the
typographic claim: there is no font to install, and nothing to license. The
cost is that the word's width moves a little between platforms — SF Pro sets
it narrowest, Helvetica and Arial about 2.5% wider — so the box reserves
room for the widest face in the stack and a narrower one leaves a little air
on the right. That is the intended behaviour, not a mis-export.

### Which asset, for which context

| Context | Asset | Why |
| --- | --- | --- |
| Name and mark together, with room for both | Lockup | Carries the name where the surrounding text does not |
| Square container: favicon, avatar, app tile | Icon tile | The mark fills the square; the lockup cannot |
| Beside text that already names the project | Mark | The name is in the sentence; the mark identifies it |
| One flat ink: print, badges, embossing | Mono mark or mono lockup | No second colour to lose |

The lockup does not replace the mark at small sizes. Shrinking it until the
name is legible makes the mark illegible first; at that point the mark alone
is the correct asset and the name belongs in the text next to it. The size
each asset stops working at is a measurement, and it is
[waiting on the definitive mark](#the-mark).

## Typography

Sans-serif is the primary typographic voice for product surfaces, headings,
and UI chrome, and it is the voice the lockup is set in. Monospace is
reserved for code, size metrics, and proof points (`13.6 KB`,
`--cirth-primary`), and for the site's own chrome, where the name appears as
a navigational label rather than as the wordmark. Serif remains available as
a primitive token for an author to opt into, but is not part of Cirth's
product voice. There is no custom font to install: the brand uses the same
system stacks the framework ships, on purpose.

Write the name as **Cirth** (capitalized, never uppercase); the npm scope
is `@cirthcss/cirth`.

## Using the mark in technical contexts

The mark is built to survive small, high-contrast, low-color placements:
READMEs, npm listings, CI badges, terminal output headers, favicons. Use
the **mono** variant wherever a single flat color is preferable to copper
(badges, print, embossing, low-color terminals), and the **icon** tile
wherever the mark needs to fill a square container. Keep what surrounds it
contemporary and technical: no fantasy illustration, no parchment or stone
texture, no medieval lettering. Cirth is named after a writing system, and
a page that dresses up the reference reads as a theme rather than as a
tool.

## Voice

Cirth's writing is technical but accessible, precise, and evidence-led:
assertive about what is verified, transparent about trade-offs, and never
ideological. Prefer *claim → mechanism → proof*. State what the framework
does, explain how it does it, then point at something checkable: a script,
a number, a source file.

The subject is a language and what it is made of, so the vocabulary is
too. Favour **semantics**, **structure**, **syntax**, **vocabulary**,
**grammar**, **relation**, **scope**, **token**, **runtime**, **source**,
**output**, **native**, **integrate**, **baseline**, **verify** and
**transformation**.

Two habits to avoid. The first is the workshop register: **carving**,
**forging**, **craft**, **tooling**, **hardness**, **purity**, **metal**
and engineering as a metaphor for manual labour. Cirth is named after a
writing system, not a trade, and a page that reaches for the anvil is
describing an atmosphere instead of a mechanism. The material reading of
the name belongs in the origin story, once, and nowhere else.

The second is the unfalsifiable claim: **timeless**, **philosophy**,
"nothing to break", "fully accessible", "always delivered in one round
trip". If a sentence cannot be checked against a script, a measurement or
a source file, it is not doing the work this voice is for.

Example headlines:

- "Production-ready UI from semantic HTML."
- "One stylesheet. Runtime tokens. No JavaScript runtime."
- "A size budget on every bundle, checked on every build."

Example one-line descriptions:

- "Cirth turns native HTML elements into accessible, themeable
  interfaces, with zero shipped JavaScript."
- "An HTML-native CSS framework with a runtime design token system and a
  monitored gzipped size budget."

## Usage agreement

The Cirth code is released under the Apache License 2.0; the name and logo are brand assets with
their own terms:

1. **Naming projects.** You may use the Cirth name as part of a
   noncommercial open source project's name, for example
   "cirth-react" or "cirth-starter", as long as it's clear the project
   is built *for* Cirth, not *by* Cirth. Using the name in a commercial
   product or service requires prior written permission.
2. **Using the logo.** The mark may be used in articles, talks,
   tutorials, and documentation that reference Cirth, with attribution.
   It may not be used as (or inside) the logo of another project,
   product, or company, whether open source or commercial.
3. **Merchandise.** Using the Cirth name or logo on merchandise
   (shirts, stickers, and similar) requires explicit written consent.
4. **No implied endorsement.** Neither the name nor the mark may be used
   in a way that suggests Cirth endorses, certifies, or maintains an
   external product.

For permissions, open an issue on
[GitHub](https://github.com/cirthcss/cirth/issues).

### Keeping the mark intact

When you do use the mark:

* keep a generous margin of clear space around it on every side;
* pick the brand or mono variant that keeps contrast on your background;
* don't recolor, outline, rotate, add effects, or redraw the strokes,
  and don't set the wordmark in another typeface — use
  [the lockup](#the-lockup) rather than re-typesetting the name.
