# Brand

Assets and guidelines for representing Cirth — in articles, talks,
integrations, or anywhere else the project is named.

## The mark

The Cirth mark is a rune-form monogram: angular strokes that read as a
carved "C". It references the project's namesake — the runic alphabet
designed for carving, where every letter is reduced to the strokes the
material allows — and the project's claim that structure, not decoration,
is what lasts.

<div class="docs-brand-grid">
  <figure class="docs-brand-tile" data-theme="light">
    <img src="/logo_brand.svg" alt="Cirth brand mark, amber on light" width="96" height="96">
    <figcaption>Brand · light</figcaption>
    <p class="docs-brand-downloads">
      <a role="button" class="outline secondary" href="/logo_brand.svg" download>SVG</a>
      <a role="button" class="outline secondary" href="/logo_brand.png" download>PNG</a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="light">
    <img src="/logo_mono.svg" alt="Cirth monochrome mark, black on light" width="96" height="96">
    <figcaption>Mono · light</figcaption>
    <p class="docs-brand-downloads">
      <a role="button" class="outline secondary" href="/logo_mono.svg" download>SVG</a>
      <a role="button" class="outline secondary" href="/logo_mono.png" download>PNG</a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="light">
    <img src="/logo_brand_app.svg" alt="Cirth icon on its background tile, light" width="96" height="96">
    <figcaption>Icon · light</figcaption>
    <p class="docs-brand-downloads">
      <a role="button" class="outline secondary" href="/logo_brand_app.svg" download>SVG</a>
      <a role="button" class="outline secondary" href="/logo_brand_app.png" download>PNG</a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="dark">
    <img src="/logo_brand_dark.svg" alt="Cirth brand mark, amber on dark" width="96" height="96">
    <figcaption>Brand · dark</figcaption>
    <p class="docs-brand-downloads">
      <a role="button" class="outline secondary" href="/logo_brand_dark.svg" download>SVG</a>
      <a role="button" class="outline secondary" href="/logo_brand_dark.png" download>PNG</a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="dark">
    <img src="/logo_mono_dark.svg" alt="Cirth monochrome mark, white on dark" width="96" height="96">
    <figcaption>Mono · dark</figcaption>
    <p class="docs-brand-downloads">
      <a role="button" class="outline secondary" href="/logo_mono_dark.svg" download>SVG</a>
      <a role="button" class="outline secondary" href="/logo_mono_dark.png" download>PNG</a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="dark">
    <img src="/logo_brand_app_dark.svg" alt="Cirth icon on its background tile, dark" width="96" height="96">
    <figcaption>Icon · dark</figcaption>
    <p class="docs-brand-downloads">
      <a role="button" class="outline secondary" href="/logo_brand_app_dark.svg" download>SVG</a>
      <a role="button" class="outline secondary" href="/logo_brand_app_dark.png" download>PNG</a>
    </p>
  </figure>
</div>

Every variant is downloadable above as SVG (preferred) or PNG; the full
set also lives in
[`docs/public/`](https://github.com/cirthcss/cirth/tree/develop/docs/public).

Use the **brand** (amber) mark wherever color is available, matching the
variant to the background. Use **mono** in single-color contexts — print,
badges, embossing. The **icon** variants sit on their own background
tile — use them where the mark needs to fill a square: favicons, social
avatars, bookmark icons. Not for inline use next to text.

## Color

The brand color is amber. The mark's hue — **69.35°** in oklch — is the
exact hue the framework's entire amber scale is generated from; the logo
sits brighter than the UI tokens because it's an identity color, not a
text color.

| Role | Value |
| --- | --- |
| Mark, light backgrounds | `#CA8216` — `oklch(66.6% 0.139 69.35deg)` |
| Mark, dark backgrounds | `#DC8E18` — `oklch(71% 0.149 69.35deg)` |
| UI primary (light theme) | `oklch(52.7% 0.097 69.35deg)` — `$amber-550` |
| UI primary (dark theme) | `oklch(70% 0.129 69.35deg)` — `$amber-350` |

In interfaces, always use the `--cirth-primary*` tokens rather than the
logo hexes: the tokens are the WCAG-verified variants. See
[Colors](/colors) for the full system.

## Wordmark and typography

The wordmark is simply "Cirth" set in the display face — a serif stack
(Georgia and platform equivalents), bold, with the mark at the cap height
to its left. There is no custom font to install: the brand uses the same
system stacks the framework ships, on purpose.

Write the name as **Cirth** (capitalized, never all-caps); the npm scope
is `@cirthcss/cirth`.

## Usage agreement

The Cirth code is MIT-licensed; the name and logo are brand assets with
their own terms:

1. **Naming projects.** You may use the Cirth name as part of an
   open-source, non-commercial project's name — for example
   "cirth-react" or "cirth-starter" — as long as it's clear the project
   is built *for* Cirth, not *by* Cirth. Using the name in a commercial
   product or service requires prior written permission.
2. **Using the logo.** The mark may be used in articles, talks,
   tutorials, and documentation that reference Cirth, with attribution.
   It may not be used as (or inside) the logo of another project,
   product, or company — open-source or commercial.
3. **Merchandise.** Using the Cirth name or logo on merchandise
   (t-shirts, stickers, and similar) requires explicit written consent.
4. **No implied endorsement.** Neither the name nor the mark may be used
   in a way that suggests Cirth endorses, certifies, or maintains a
   third-party product.

For permissions, open an issue on
[GitHub](https://github.com/cirthcss/cirth/issues).

### Keeping the mark intact

When you do use the mark:

- keep clearspace around it of at least half its width;
- scale it down to 16px if needed — the strokes survive favicon size;
- pick the brand or mono variant that keeps contrast on your background;
- don't recolor, outline, rotate, add effects, or redraw the strokes,
  and don't set the wordmark in another typeface.
