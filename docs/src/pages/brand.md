---
layout: docs.njk
---

# Brand

Assets and guidelines for representing Cirth in articles, talks,
integrations, and anywhere else the project is named.

## The mark

The Cirth mark is a rune-form monogram: angular strokes that read as a
carved "C". It references the project's namesake, the Cirth runic
alphabet used by Tolkien's Dwarves, designed for carving into hard
surfaces so every letter is reduced to the strokes the material allows.
The same reduction — keep only what the medium requires — is the
engineering constraint the framework itself is built around: a strict
gzipped size budget on the default stylesheet. See
[About Cirth](/about#the-14kb-size-budget) for how that budget works.

Cirth is not affiliated with, endorsed by, or associated with the
Tolkien estate, the Tolkien Society, Amazon's Middle-earth adaptations,
or any other rights holder. The name is a reference to a real-world
writing system, not a claim of license or partnership.

<div class="docs-brand-grid">
  <figure class="docs-brand-tile" data-theme="light">
    <img src="/logo_brand.svg" alt="Cirth brand mark, amber on light" width="96" height="96" />
    <figcaption>Brand · light</figcaption>
    <p class="docs-brand-downloads">
      <a role="button" class="outline secondary" href="/logo_brand.svg" download>SVG</a>
      <a role="button" class="outline secondary" href="/logo_brand.png" download>PNG</a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="light">
    <img src="/logo_mono.svg" alt="Cirth monochrome mark, black on light" width="96" height="96" />
    <figcaption>Mono · light</figcaption>
    <p class="docs-brand-downloads">
      <a role="button" class="outline secondary" href="/logo_mono.svg" download>SVG</a>
      <a role="button" class="outline secondary" href="/logo_mono.png" download>PNG</a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="light">
    <img src="/logo_brand_app.svg" alt="Cirth icon on its background tile, light" width="96" height="96" />
    <figcaption>Icon · light</figcaption>
    <p class="docs-brand-downloads">
      <a role="button" class="outline secondary" href="/logo_brand_app.svg" download>SVG</a>
      <a role="button" class="outline secondary" href="/logo_brand_app.png" download>PNG</a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="dark">
    <img src="/logo_brand_dark.svg" alt="Cirth brand mark, amber on dark" width="96" height="96" />
    <figcaption>Brand · dark</figcaption>
    <p class="docs-brand-downloads">
      <a role="button" class="outline secondary" href="/logo_brand_dark.svg" download>SVG</a>
      <a role="button" class="outline secondary" href="/logo_brand_dark.png" download>PNG</a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="dark">
    <img src="/logo_mono_dark.svg" alt="Cirth monochrome mark, white on dark" width="96" height="96" />
    <figcaption>Mono · dark</figcaption>
    <p class="docs-brand-downloads">
      <a role="button" class="outline secondary" href="/logo_mono_dark.svg" download>SVG</a>
      <a role="button" class="outline secondary" href="/logo_mono_dark.png" download>PNG</a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="dark">
    <img src="/logo_brand_app_dark.svg" alt="Cirth icon on its background tile, dark" width="96" height="96" />
    <figcaption>Icon · dark</figcaption>
    <p class="docs-brand-downloads">
      <a role="button" class="outline secondary" href="/logo_brand_app_dark.svg" download>SVG</a>
      <a role="button" class="outline secondary" href="/logo_brand_app_dark.png" download>PNG</a>
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

## Color

Color is functional here, never atmosphere. Each family has one job, and
components are built so that two of them rarely appear in the same
control:

| Role | Family | Where it appears |
| --- | --- | --- |
| Brand / action | Machine orange | Links, primary buttons, focus rings, the active state |
| Operational | Safety yellow | `<mark>`, warnings — always as a fill with graphite text on it, never as text |
| Surface | Graphite and steel | Text, panels, borders, metadata, the dark scheme's canvas |
| Error | Crimson | Invalid fields, deleted text |
| Success | Green | Valid fields, inserted text |

The base surface is warm manual paper in light and painted graphite in
dark — the accent colors sit *on* it, they never wash it.

| Role | Value |
| --- | --- |
| UI primary (light theme) | `oklch(52.7% 0.123 48deg)`, from `$brand-550` |
| UI primary (dark theme) | `oklch(70% 0.163 48deg)`, from `$brand-350` |
| Operational fill | `oklch(83% 0.17 88deg)`, from `$warning-200` |
| Mark, light backgrounds | `#CA8216` (`oklch(66.6% 0.139 69.35deg)`) |
| Mark, dark backgrounds | `#DC8E18` (`oklch(71% 0.149 69.35deg)`) |

The mark is still the old amber drawing while the UI primary is machine
orange, so the two are close but not the same. That is a known loose end
rather than a decision: the mark is due to be redrawn, and the token is
what every interface built on Cirth inherits, so the token led.

In interfaces, always use the `--cirth-primary*` tokens rather than the
logo hexes: the tokens are variants verified for WCAG. See
[Colors](/colors) for the full system.

## Wordmark and typography

The wordmark is "Cirth" set in the site's sans-serif voice, bold, with the
mark at the cap height to its left — sans-serif is the primary typographic
voice for product surfaces, headings, and UI chrome. Monospace is reserved
for code, size metrics, and proof points (`<14KB`, `--cirth-primary`).
The serif display face (Georgia and platform equivalents) is used
sparingly, only for editorial passages such as the name's origin story on
the [About](/about#origin-of-the-name) page — never for the wordmark
itself or for technical content. There is no custom font to install: the
brand uses the same system stacks the framework ships, on purpose.

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
* scale it down to 16px if needed; the strokes survive favicon size;
* pick the brand or mono variant that keeps contrast on your background;
* don't recolor, outline, rotate, add effects, or redraw the strokes,
  and don't set the wordmark in another typeface.
