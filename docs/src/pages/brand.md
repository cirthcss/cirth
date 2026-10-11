---
layout: docs.njk
description: Practical guidance for Cirth's current identity, logo files, colour, typography, voice, usage rules and brand terms.
---

# Brand

Use this page when referring to Cirth in documentation, an article, a talk or
an integration. It provides the current assets and the rules that keep the
project identifiable.

<section class="docs-brand-hero" aria-label="The Cirth lockup">
  <img class="docs-logo-light" src="/wordmark.svg" alt="Cirth" width="{{ brandLockup.width | round }}" height="{{ brandLockup.height }}" />
  <img class="docs-logo-dark" src="/wordmark_dark.svg" alt="Cirth" width="{{ brandLockup.width | round }}" height="{{ brandLockup.height }}" />
  <p class="docs-brand-hero-line">A semantic-first CSS framework for the HTML the browser already understands.</p>
  <p class="docs-brand-hero-actions">
    <a href="/logo_brand.svg" download role="button">Download the mark<span class="sr-only">, SVG for light backgrounds</span></a>
    <a href="/wordmark.svg" download role="button" class="secondary outline">Download the lockup<span class="sr-only">, SVG for light backgrounds</span></a>
    <a href="#downloads">Every variant</a>
  </p>
</section>

## Identity

The identity has two primary forms:

- **Mark:** a filled sign containing a figure with a feathered hat and lute.
  Use it where nearby text already names Cirth or where the available area is
  square.
- **Lockup:** the mark followed by the outlined Cirth name. Use it when the
  asset must carry the project name by itself.

The name refers to the Cirth writing system invented by J. R. R. Tolkien.
[About](/about#origin-of-the-name) explains that reference and the project's
non-affiliation statement. The project mark and lockup are original Cirth
assets and do not depict a character from Tolkien's works.

Write the project name as **Cirth**, with an initial capital. The package name
is `@cirthcss/cirth`.

## Downloads

<div class="docs-brand-grid">
  <figure class="docs-brand-tile" data-theme="light">
    <img src="/logo_brand.svg" alt="Cirth mark, magenta" width="96" height="96" />
    <figcaption><strong>Mark</strong><span>Colour, light backgrounds</span></figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/logo_brand.svg" download>SVG<span class="sr-only">, mark for light backgrounds</span></a>
      <a class="secondary" href="/logo_brand.png" download>PNG<span class="sr-only">, mark for light backgrounds</span></a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="light">
    <img src="/logo_mono.svg" alt="Cirth mark, black" width="96" height="96" />
    <figcaption><strong>Mono mark</strong><span>One ink, light backgrounds</span></figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/logo_mono.svg" download>SVG<span class="sr-only">, black mark</span></a>
      <a class="secondary" href="/logo_mono.png" download>PNG<span class="sr-only">, black mark</span></a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="dark">
    <img src="/logo_brand_dark.svg" alt="Cirth mark, light magenta" width="96" height="96" />
    <figcaption><strong>Mark</strong><span>Colour, dark backgrounds</span></figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/logo_brand_dark.svg" download>SVG<span class="sr-only">, mark for dark backgrounds</span></a>
      <a class="secondary" href="/logo_brand_dark.png" download>PNG<span class="sr-only">, mark for dark backgrounds</span></a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="dark">
    <img src="/logo_mono_dark.svg" alt="Cirth mark, white" width="96" height="96" />
    <figcaption><strong>Mono mark</strong><span>One ink, dark backgrounds</span></figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/logo_mono_dark.svg" download>SVG<span class="sr-only">, white mark</span></a>
      <a class="secondary" href="/logo_mono_dark.png" download>PNG<span class="sr-only">, white mark</span></a>
    </p>
  </figure>
</div>

<div class="docs-brand-grid docs-lockup-grid">
  <figure class="docs-brand-tile" data-theme="light">
    <img src="/wordmark.svg" alt="Cirth lockup, magenta mark and dark name" width="{{ brandLockup.width | round }}" height="{{ brandLockup.height }}" />
    <figcaption><strong>Lockup</strong><span>Light backgrounds</span></figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/wordmark.svg" download>SVG<span class="sr-only">, lockup for light backgrounds</span></a>
      <a class="secondary" href="/wordmark.png" download>PNG<span class="sr-only">, lockup for light backgrounds</span></a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="dark">
    <img src="/wordmark_dark.svg" alt="Cirth lockup, light magenta mark and light name" width="{{ brandLockup.width | round }}" height="{{ brandLockup.height }}" />
    <figcaption><strong>Lockup</strong><span>Dark backgrounds</span></figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/wordmark_dark.svg" download>SVG<span class="sr-only">, lockup for dark backgrounds</span></a>
      <a class="secondary" href="/wordmark_dark.png" download>PNG<span class="sr-only">, lockup for dark backgrounds</span></a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="light">
    <img src="/wordmark_mono.svg" alt="Cirth lockup in one ink" width="{{ brandLockup.width | round }}" height="{{ brandLockup.height }}" />
    <figcaption><strong>Mono lockup</strong><span>One ink, vector</span></figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/wordmark_mono.svg" download>SVG<span class="sr-only">, one-ink lockup</span></a>
    </p>
  </figure>
</div>

Prefer SVG when the destination accepts it. SVG stays sharp at different
sizes. The PNG marks are 1024 by 1024 pixels; lockup PNGs are rendered at
four times the SVG dimensions. The mono lockup uses `currentColor` when it
is inlined. When loaded through `img`, it falls back to black.

The generated inventory and source relationship are recorded in
[`docs/BRAND_ASSETS.md`](https://github.com/cirthcss/cirth/blob/master/docs/BRAND_ASSETS.md).

## Choose a variant

| Context | Use |
| --- | --- |
| Nearby text already says Cirth | Mark |
| README header, slide or partner page that must carry the name | Lockup |
| Avatar or square profile image | Mark |
| Light background | Light colour asset, or black mono asset |
| Dark background | Dark colour asset, or white mono asset |
| One-colour printing, engraving or embossing | Mono mark or mono lockup |
| Browser tab | `favicon.svg` and `favicon_dark.svg` |

Do not shrink the lockup until its name becomes unreadable. Switch to the
mark and write “Cirth” in nearby text. Preview raster output at its final
display size.

## Colour

The colour mark uses the same accent scale as the default interface. The
files are generated from the theme source, so the recorded values remain
aligned with the build.

| Role | Source step | Value | Contrast on its canvas |
| --- | --- | --- | --- |
| Mark on light | `{{ brandMark.markLight.step }}` | `{{ brandMark.markLight.hex }}` (`{{ brandMark.markLight.oklch }}`) | {{ brandMark.contrast.light | ratio }} |
| Mark on dark | `{{ brandMark.markDark.step }}` | `{{ brandMark.markDark.hex }}` (`{{ brandMark.markDark.oklch }}`) | {{ brandMark.contrast.dark | ratio }} |

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
