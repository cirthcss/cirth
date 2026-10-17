---
layout: docs.njk
description: Practical guidance for Cirth's current identity, logo files, colour, typography, voice, usage rules and brand terms.
---

# Brand

Use this page when referring to Cirth in documentation, an article, a talk or
an integration. It provides the current assets and the rules that keep the
project identifiable.

<section class="docs-brand-hero" aria-label="The Cirth lockup">
  <img class="docs-logo-light" src="/wordmark.svg" alt="Cirth" width="{{ brandLockup.full.width | round }}" height="{{ brandLockup.height }}" />
  <img class="docs-logo-dark" src="/wordmark_dark.svg" alt="Cirth" width="{{ brandLockup.full.width | round }}" height="{{ brandLockup.height }}" />
  <p class="docs-brand-hero-line">A semantic-first CSS framework for the HTML the browser already understands.</p>
  <p class="docs-brand-hero-actions">
    <a href="/logo_brand.svg" download role="button">Download the mark<span class="sr-only">, SVG</span></a>
    <a href="/wordmark.svg" download role="button" class="secondary outline">Download the lockup<span class="sr-only">, SVG for light backgrounds</span></a>
    <a href="#downloads">Every variant</a>
  </p>
</section>

## Identity

The identity has two primary forms:

- **Mark:** a round badge, a figure playing a flute in front of a magenta
  disc inside a black ring. Use it where nearby text already names Cirth or
  where the available area is square.
- **Lockup:** the badge followed by the outlined Cirth name. Use it when the
  asset must carry the project name by itself.

Both forms come in two drawings, chosen by the size they are displayed at:

- **Full**, at 64px and larger: README headers, slides, social cards, print.
- **Compact**, below 64px: favicons, app icons, navigation bars, small
  avatars. It enlarges the figure and leaves out the cloak and sleeves,
  whose lines close up at small sizes.

The name refers to the Cirth writing system invented by J. R. R. Tolkien.
[About](/about#origin-of-the-name) explains that reference and the project's
non-affiliation statement. The project mark and lockup are original Cirth
assets and do not depict a character from Tolkien's works.

Write the project name as **Cirth**, with an initial capital. The package name
is `@cirthcss/cirth`.

## Downloads

<div class="docs-brand-grid">
  <figure class="docs-brand-tile" data-theme="light">
    <img src="/logo_brand.svg" alt="Cirth mark, full drawing" width="96" height="96" />
    <figcaption><strong>Mark</strong><span>64px and larger</span></figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/logo_brand.svg" download>SVG<span class="sr-only">, full mark</span></a>
      <a class="secondary" href="/logo_brand.png" download>PNG<span class="sr-only">, full mark</span></a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="dark">
    <img src="/logo_compact.svg" alt="Cirth mark, compact drawing" width="48" height="48" />
    <figcaption><strong>Compact mark</strong><span>Below 64px</span></figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/logo_compact.svg" download>SVG<span class="sr-only">, compact mark</span></a>
      <a class="secondary" href="/logo_compact.png" download>PNG<span class="sr-only">, compact mark</span></a>
    </p>
  </figure>
</div>

<div class="docs-brand-grid docs-lockup-grid">
  <figure class="docs-brand-tile" data-theme="light">
    <img src="/wordmark.svg" alt="Cirth lockup with dark name" width="{{ brandLockup.full.width | round }}" height="{{ brandLockup.height }}" />
    <figcaption><strong>Lockup</strong><span>Light backgrounds</span></figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/wordmark.svg" download>SVG<span class="sr-only">, lockup for light backgrounds</span></a>
      <a class="secondary" href="/wordmark.png" download>PNG<span class="sr-only">, lockup for light backgrounds</span></a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="dark">
    <img src="/wordmark_dark.svg" alt="Cirth lockup with light name" width="{{ brandLockup.full.width | round }}" height="{{ brandLockup.height }}" />
    <figcaption><strong>Lockup</strong><span>Dark backgrounds</span></figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/wordmark_dark.svg" download>SVG<span class="sr-only">, lockup for dark backgrounds</span></a>
      <a class="secondary" href="/wordmark_dark.png" download>PNG<span class="sr-only">, lockup for dark backgrounds</span></a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="light">
    <img class="docs-brand-small" src="/wordmark_compact.svg" alt="Cirth compact lockup with dark name" width="{{ brandLockup.compact.width | round }}" height="{{ brandLockup.height }}" />
    <figcaption><strong>Compact lockup</strong><span>Light backgrounds, below 64px</span></figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/wordmark_compact.svg" download>SVG<span class="sr-only">, compact lockup for light backgrounds</span></a>
      <a class="secondary" href="/wordmark_compact.png" download>PNG<span class="sr-only">, compact lockup for light backgrounds</span></a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="dark">
    <img class="docs-brand-small" src="/wordmark_compact_dark.svg" alt="Cirth compact lockup with light name" width="{{ brandLockup.compact.width | round }}" height="{{ brandLockup.height }}" />
    <figcaption><strong>Compact lockup</strong><span>Dark backgrounds, below 64px</span></figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/wordmark_compact_dark.svg" download>SVG<span class="sr-only">, compact lockup for dark backgrounds</span></a>
      <a class="secondary" href="/wordmark_compact_dark.png" download>PNG<span class="sr-only">, compact lockup for dark backgrounds</span></a>
    </p>
  </figure>
</div>

Prefer SVG when the destination accepts it. SVG stays sharp at different
sizes. The PNG marks are 1024 by 1024 pixels; lockup PNGs are rendered at
four times the SVG dimensions.

The badge carries its own black ring, so one mark file serves light and dark
backgrounds. The lockups come in a light and a dark file only because the
name's ink changes.

The generated inventory and source relationship are recorded in
[`docs/BRAND_ASSETS.md`](https://github.com/cirthcss/cirth/blob/master/docs/BRAND_ASSETS.md).

## Choose a variant

| Context | Use |
| --- | --- |
| Nearby text already says Cirth | Mark |
| README header, slide or partner page that must carry the name | Lockup |
| Avatar or square profile image | Mark; compact mark when it is shown below 64px |
| Navigation bar, toolbar or footer | Compact lockup |
| Browser tab or app icon | Compact mark; the site serves `favicon.svg`, `favicon.ico` for browsers without SVG icons, and touch and app icons drawn from the same file |
| Light background | Mark, or the lockup for light backgrounds |
| Dark background | Mark, or the lockup for dark backgrounds |
| One-colour printing, engraving or embossing | No file yet: the badge is drawn in several inks. Open an issue to ask for one |

Choose the drawing by the size the badge is displayed at, not by the size of
the file. Do not shrink the lockup until its name becomes unreadable. Switch
to the mark and write “Cirth” in nearby text. Preview raster output at its
final display size.

## Colour

The badge's disc and its highlight use the same accent scale as the default
interface: the disc is the colour of a primary button. The files are
generated from the theme source, so the recorded values remain aligned with
the build. The black ring, the figure and its greys are fixed inks of the
drawing.

| Role | Source step | Value |
| --- | --- | --- |
| Disc | `{{ brandMark.disc.step }}` | `{{ brandMark.disc.hex }}` (`{{ brandMark.disc.oklch }}`) |
| Highlight | `{{ brandMark.highlight.step }}` | `{{ brandMark.highlight.hex }}` (`{{ brandMark.highlight.oklch }}`) |

Use the supplied file rather than sampling and recreating these colours. In a
Cirth interface, use the `--cirth-primary*` tokens instead of brand-file
hex values. [Colors](/colors) owns the interface colour system.

Do not recolour the mark, apply gradients, outlines, shadows or transparency,
or place it on a background where it loses definition.

## Typography

The name inside the lockup is outlined artwork derived from Martian Grotesk
Condensed Bold. It is not live text and requires no font download. Do not
typeset a substitute lockup.

Cirth interfaces and documentation use platform system stacks by default.
Use monospace only for code, commands, token names, filenames and data. The
brand does not require adopters to use a particular product font.

The letterform source and license are recorded on
[Attributions](/attributions#cirth-lockup-lettering).

## Tone of voice

Cirth documentation is direct, technical and evidence-led:

- Show a concrete example before explaining the abstraction.
- Use plain verbs such as “sets”, “keeps”, “loads” and “checks”.
- Explain a technical term the first time it appears on a page.
- State the boundary of a test or measurement.
- Describe tradeoffs without criticizing a different workflow.
- Prefer one main idea per sentence when the subject is complex.

Avoid unsupported claims such as “fully accessible”, “works everywhere” or
“nothing can break”. Avoid fantasy, workshop and musical metaphors in normal
product copy. The origin of the name belongs on the About page, not in every
feature description.

## Using the mark

Do:

- match the light or dark asset to the background;
- keep the transparent margin built into the asset;
- add more clear space when nearby content feels crowded;
- preserve the aspect ratio;
- use the asset once in a visual region;
- include nearby text when the mark alone would not identify the project.

Do not:

- crop, stretch, rotate, redraw or animate the mark;
- change the lockup's lettering;
- add effects or place the mark inside another logo;
- repeat it as a pattern, watermark, bullet or generic icon;
- turn the figure into a character with new poses or props;
- pair it with runes, parchment, stone or other fantasy decoration;
- imply that Cirth endorses an external product.

## Terms

<span id="usage-agreement"></span>

The Apache 2.0 license covers Cirth code. The Cirth name and logo are brand
assets with separate terms:

1. You may use the name in a noncommercial open-source project name, such as
   “cirth-starter”, when the project clearly says it is for Cirth and is not
   maintained by Cirth.
2. Use of the name in a commercial product or service requires prior written
   permission.
3. The mark may appear with attribution in articles, talks, tutorials and
   documentation that refer to Cirth.
4. The mark may not be used as, or inside, the logo of another project,
   product or company.
5. Merchandise using the name or mark requires explicit written consent.
6. No use may imply endorsement, certification or maintenance by Cirth.

For permissions, open an
[issue](https://github.com/cirthcss/cirth/issues).

## Framework logos

This page governs Cirth's own identity. Third-party logos shown in the
integration guides have separate owners and terms. The complete source,
policy and decision inventory is on
[Attributions](/attributions#framework-logos).
