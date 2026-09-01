---
layout: docs.njk
---

# Brand

Assets and guidelines for representing Cirth in articles, talks,
integrations, and anywhere else the project is named.

<section class="docs-brand-spec" aria-labelledby="signature-title">
  <header class="docs-brand-spec-header">
    <h2 id="signature-title">The part that survives a retheme.</h2>
    <p>Cirth's identity is not the amber. The accent is the first token any
    adopter replaces, and a framework whose character lives entirely in one
    hue has no character left the moment it is adopted. What stays is
    below: proportions, strokes and target sizes that hold in every preset,
    every scheme and every build. Compare
    <a href="/specimen/amber/">the amber specimen</a> with
    <a href="/specimen/plain/">the plain one</a> — same six measurements,
    different pigment.</p>
  </header>
  <dl class="docs-brand-measures">
    <div><dt>Container corner</dt><dd><code>9px</code> · <code>--cirth-card-border-radius</code></dd></div>
    <div><dt>Control corner</dt><dd><code>6px</code> · <code>--cirth-border-radius</code></dd></div>
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

The Cirth mark is a rune-form monogram: angular strokes that read as a
carved "C". It references the project's namesake, the Cirth runic
alphabet used by Tolkien's Dwarves, designed for carving into hard
surfaces so every letter is reduced to the strokes the material allows.
The same reduction — keep only what the medium requires — is the
engineering constraint the framework itself is built around: a strict
gzipped size budget on the default stylesheet. See
[About Cirth](/about#the-14kb-size-budget) for how that budget works.

<section class="docs-brand-spec" aria-labelledby="brand-spec-title">
  <header class="docs-brand-spec-header">
    <h2 id="brand-spec-title">One mark, three levels of fidelity.</h2>
  </header>
  <div class="docs-brand-construction">
    <figure class="docs-mark-blueprint">
      <div class="docs-mark-clearspace">
        <img src="/logo_brand.svg" alt="Full Cirth monogram over its construction grid" width="240" height="240" />
        <i class="axis-x" aria-hidden="true"></i>
        <i class="axis-y" aria-hidden="true"></i>
      </div>
      <figcaption><strong>High fidelity</strong><span>Full five-part mark · 48px and above</span></figcaption>
    </figure>
    <figure class="docs-mark-medium">
      <img src="/logo_brand.svg" alt="Full Cirth monogram at medium size" width="48" height="48" />
      <figcaption><strong>Medium fidelity</strong><span>Full mark · 24–47px</span></figcaption>
    </figure>
    <figure class="docs-mark-low">
      <picture>
        <source media="(prefers-color-scheme: dark)" srcset="/mark_small_dark.svg" />
        <img src="/mark_small.svg" alt="Optically simplified Cirth small-size mark" width="20" height="20" />
      </picture>
      <figcaption><strong>Low fidelity</strong><span>Four-part optical mark · 16–23px</span></figcaption>
    </figure>
  </div>
  <dl class="docs-brand-measures">
    <div><dt>Base unit</dt><dd><code>8px</code></dd></div>
    <div><dt>Micro unit</dt><dd><code>4px</code></dd></div>
    <div><dt>Primary joint</dt><dd><code>45°</code></dd></div>
    <div><dt>Clearspace</dt><dd><code>0.5 × mark width</code></dd></div>
    <div><dt>Signal hue</dt><dd><code>69.35°</code></dd></div>
    <div><dt>Minimum size</dt><dd><code>16px optical</code></dd></div>
  </dl>
</section>


Cirth is not affiliated with, endorsed by, or associated with the
Tolkien estate, the Tolkien Society, Amazon's Middle-earth adaptations,
or any other rights holder. The name is a reference to a real-world
writing system, not a claim of license or partnership.

<div class="docs-brand-grid">
  <figure class="docs-brand-tile" data-theme="light">
    <img src="/logo_brand.svg" alt="Cirth brand mark, amber on light" width="96" height="96" />
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
    <img src="/logo_brand_dark.svg" alt="Cirth brand mark, amber on dark" width="96" height="96" />
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

Every variant is downloadable above as SVG (preferred) or PNG; the full
set also lives in
[`docs/public/`](https://github.com/cirthcss/cirth/tree/master/docs/public).

Use the **brand** (amber) mark wherever color is available, matching the
variant to the background. Use **mono** in one color contexts such as print,
badges, embossing. The **icon** variants sit on their own background
tile; use them where the mark needs to fill a square: favicons, social
avatars, bookmark icons. Not for inline use next to text.

## Operational rules

Use the full mark above 24px and switch to the optical small-size mark for
favicon-scale contexts. The optical variant preserves the incised “C”,
removes the detached origin accent, and fills more of its view box. It is an
experimental responsive asset; the original SVG files remain unchanged.

The 45° joint is a structural device for diagram junctions, section
terminals, and large composition crops. Do not apply it to every card,
button, or input. Keep clearspace equal to half the visible mark width.

### Incorrect use

Do not stretch, rotate, outline, add a glow, put the mark on low-contrast
surfaces, repeat it as wallpaper, or pair it with fantasy imagery. Do not
use the small-size variant above 24px, where its reduced detail becomes
unnecessarily blunt.

## Color

The brand color is amber, and in an interface it has exactly two jobs:
**action** and **current position**. A primary button, a focus ring and a
link in running prose are actions. The rail beside the page you are on, the
edge on an active in-page nav item and a selected control are position.
Header navbars are quieter chrome: they use ink and weight rather than an
accent edge. Nothing else in a Cirth interface is amber.

Editorial typography is the one place outside those two, and it is a
deliberate exception rather than a leak: a word or phrase set in the accent
inside a heading, the way this site's home page sets *semantic HTML*. It is
a single named class, applied by hand, in prose — not a component state.

It used to do five. Navigation links were amber at rest, which meant a menu
of eight entries was eight brand-coloured words next to one button that also
wanted the colour, and the accent stopped meaning "act on this" and started
meaning "this is a Cirth screen". Navigation now takes the ink of whatever
it sits in and the accent marks only where you are — so the one thing amber
still says, it says alone.

The light theme's base surface is warm paper rather than white, and the card
sheet carries the same temperature: the page is not neutral, but the warmth
is a surface property, not a wash of the accent. In dark the base is
graphite. Neither scheme paints the brand hue across backgrounds.

The mark's hue, **69.35°** in oklch, is the exact hue the framework's
entire amber scale is generated from; the logo sits brighter than the UI
tokens because it's an identity color, not a text color.

| Role | Value |
| --- | --- |
| Mark, light backgrounds | `#CA8216` (`oklch(66.6% 0.139 69.35deg)`) |
| Mark, dark backgrounds | `#DC8E18` (`oklch(71% 0.149 69.35deg)`) |
| UI primary (light theme) | `oklch(52.7% 0.097 69.35deg)`, from `$amber-550` |
| UI primary (dark theme) | `oklch(70% 0.129 69.35deg)`, from `$amber-350` |

In interfaces, always use the `--cirth-primary*` tokens rather than the
logo hexes: the tokens are variants verified for WCAG. See
[Colors](/colors) for the full system.

## Wordmark and typography

The wordmark is "Cirth" set in the site's sans-serif voice, bold, with the
mark at the cap height to its left — sans-serif is the primary typographic
voice for product surfaces, headings, and UI chrome. Monospace is reserved
for code, size metrics, and proof points (`<14KB`, `--cirth-primary`).
Serif remains available as a primitive token for an author to opt into,
but is not part of Cirth's product voice. There is no custom font to
install: the brand uses the same system stacks the framework ships, on
purpose.

Write the name as **Cirth** (capitalized, never uppercase); the npm scope
is `@cirthcss/cirth`.

## Using the mark in technical contexts

The mark is built to survive small, high-contrast, low-color placements:
READMEs, npm listings, CI badges, terminal output headers, favicons. Use
the **mono** variant wherever a single flat color is preferable to amber
(badges, print, embossing, low-color terminals), and the **icon** tile
wherever the mark needs to fill a square container. Don't pair the mark
with fantasy-styled illustration, parchment or stone textures, or
medieval typography — the mark itself carries the reference to the name;
the surrounding presentation should stay contemporary and technical.

## Voice

Cirth's writing is technical but accessible, precise, and evidence-led:
assertive about what is verified, transparent about trade-offs, and never
ideological. Prefer *claim → mechanism → proof* — state what the
framework does, explain how, then point at something checkable (a script,
a number, a source file).

Favor words like **native**, **runtime**, **tokens**, **scope**,
**integrate**, **verify**, **ship**, **baseline**, **size budget**, and
**browser primitives**. Avoid **purity**, **timeless**, **philosophy**,
**framework dialect**, and repeated carving metaphors outside the name's
origin story — and avoid unverifiable claims such as "nothing to break,"
"fully accessible," or "always delivered in one round trip."

Example headlines:

- "Production-ready UI from semantic HTML."
- "One stylesheet. Runtime tokens. Zero JavaScript."
- "A 14KB size budget, checked on every build."

Example one-line descriptions:

- "Cirth turns native HTML elements into accessible, themeable
  interfaces, with zero shipped JavaScript."
- "An HTML-native CSS framework with a runtime design token system and a
  14KB gzipped size budget."

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

* keep clearspace around it of at least half its width;
* use the responsive small-size asset from 16–23px;
* pick the brand or mono variant that keeps contrast on your background;
* don't recolor, outline, rotate, add effects, or redraw the strokes,
  and don't set the wordmark in another typeface.
