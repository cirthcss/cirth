# Brand assets

Every file that carries the Cirth mark, what produces it, what uses it, and
what to do when a drawing changes.

## How the assets relate

Three sources, and everything else is generated from them:

```text
docs/brand/cirth-mark.svg                        the badge, drawn by a person
docs/brand/cirth-wordmark-onest.svg              the name: outlines, edited by a person
src/theme/_colors.scss                           the pigments: accent, neutral and canvas steps
  |
  |-- npm run docs:marks ---------> logo_brand, favicon, site.webmanifest
  |-- npm run docs:lockup --------> wordmark, wordmark_dark
  '-- npm run docs:brand-assets --> both of the above, then the rasters:
                                    logo_*.png, wordmark*.png, the icons
                                    (favicon.ico, apple-touch-icon.png,
                                    icon-*.png), social-preview.png
```

`scripts/build-brand-marks.js` writes the marks, the favicon and the
manifest, and declares the raster icons (`icons`); `scripts/build-brand-lockup.js`
writes the lockups; `scripts/capture-brand-assets.js` renders the PNGs from
those SVGs, each icon from its own SVG at each of its sizes, and the share
cards from their pages in `docs/dist`, so it needs a current docs build.
`scripts/lib/brand-mark.js` reads the drawing for both generators: it paints
it, strips what describes the drawing's history rather than the mark, and
measures its ink.

`npm run check:brand-assets` (part of `npm run lint`) regenerates every SVG
and the manifest in memory and fails when a file on disk differs from it,
when a brand-named file in `docs/public/` is one no generator writes, or
when a declared icon is missing or holds other sizes than it declares. A
difference means a hand edit, or a source that moved without a
regeneration. The rasters' pixels are not compared, because rasterisation
differs between machines; regenerate them whenever the SVGs change.

## The drawing

The mark is a round badge: a figure playing a flute over a magenta disc,
drawn in a dark and a light ink. One drawing serves every size, from the
16px tab icon to the README header and the Brand page.

The source is the maintainer's export with its figure enlarged by 17.5%
against the disc: scaled about (219.24, 842.97), the point on the disc's
edge where the left hand meets the arc the body's foot follows, and
trimmed to the circle through that point (radius 453.32, the export's own
0.8 units outside the disc, so the figure covers the disc's anti-aliased
edge). Left of that point the flute and the hand still reach past the
disc, as they do in the export. The disc (radius 452.5) is centred in a
950.64-unit square that holds the whole figure with a 4.5-unit margin; the
end of the flute reaches 18.3 units past the disc's square, on the left.
The generators find three shapes by id: the disc that bounds the badge, and
the figure's light fills and dark lines. The ids are listed in `DRAWING` in
`scripts/lib/brand-mark.js`.

Rendered at 16, 24, 32 and 48px, at 1x and 2x, on light and dark tab
strips, the badge reads at 16px as a magenta disc with a dark figure and the
white flute across it; the face reads from 24px up.

There is one mark file, not one per colour scheme. On a near-black page the
figure's dark ink meets the background at the foot of the badge, and the
magenta disc draws the rest of its edge. There is no one-colour version: a
drawing in several inks has no mechanical one-ink reduction, and one would
have to be drawn.

## The name

The name is not typeset. `docs/brand/cirth-wordmark-onest.svg` holds
"cirth" in lowercase, set in Onest at weight 650 with -0.5% tracking and the
font's own kerning, then converted to outlines: every corner is rounded with
a 23-unit radius (0.023em) and the outlines are simplified, one path per
glyph with the baseline at y = 1000. The face is licensed under the SIL Open
Font License 1.1 (<https://github.com/googlefonts/onest>); the file's
metadata says so, and `NOTICE.md` records it. The license asks for no
acknowledgement in artwork made with the font. The lockup reads the glyphs as
they are, so replacing the name means replacing this file.

The lowercase is the lockup's styling only. Running text writes the name as
Cirth, and the lockup SVGs keep `aria-label="Cirth"`.

## Pigments

Assigned in `roles` in `scripts/build-brand-marks.js`:

| Role | Step | Used by |
| --- | --- | --- |
| Disc | `$accent-500`, the light `--cirth-primary` | every mark, favicon and lockup |
| Figure, dark ink | `$neutral-900`, the light `--cirth-ink-strong` | every mark, favicon and lockup |
| Figure, light ink | `$neutral-50`, the dark `--cirth-ink-strong` | every mark, favicon and lockup |
| Paper | `$canvas-light` | the ground of the touch icon and the maskable icon, the manifest's colours |

The generators repaint every ink of the drawing, so the badge always
follows the theme's scales, whatever colours the source carries. The
figure's two inks are the two ends of `--cirth-ink-strong`, the darkest and
the lightest neutral the interface sets text in. The lockup's name takes
`$neutral-900` on light, the figure's dark ink, and `$neutral-100` on dark.
The Brand page prints the painted values from the same function
(`palette()` in `build-brand-marks.js`).

## Inventory

| File | Used by | Produced by | Notes |
| --- | --- | --- | --- |
| `logo_brand.svg` | Brand page, home page orbit | `docs:marks` | The drawing, painted. Declared 512px, the source's view box |
| `favicon.svg` | `base.njk`, the specimens | `docs:marks` | The drawing in its disc's square, edge to edge, on a transparent ground. Declared 32px |
| `site.webmanifest` | `base.njk` | `docs:marks` | The `icons` marked for the manifest; colours from `$canvas-light` |
| `wordmark.svg`, `wordmark_dark.svg` | README title, site header, mobile menu and footer, share card, Brand page | `docs:lockup` | Badge and outlined name |
| `logo_brand.png` | Brand page downloads | `capture-brand-assets.js` | 1024 x 1024, transparent |
| `wordmark*.png` (two) | Brand page downloads | `capture-brand-assets.js` | 4x the SVG's box |
| `social-preview.png` | `base.njk` `og:image`, absolute GitHub Pages URL | `capture-brand-assets.js` | Renders `share-card.njk`, which embeds the lockup |

### References outside `docs/public/`

| Place | What it points at | Note |
| --- | --- | --- |
| `README.md` | `wordmark.svg`, `wordmark_dark.svg` | The title, 96px high. Absolute `raw.githubusercontent.com` URLs on `master`: they update only when `master` does, and GitHub's image proxy caches them |
| `docs/src/_includes/site-header.njk` | Both lockups, twice each | Header and mobile menu, 34px high, centred on the nav link band, 32px from the first link |
| `docs/src/_includes/site-footer.njk` | Both lockups | 34px high |
| `docs/src/_includes/home.njk` | `logo_brand.svg` | The centre of the integrations orbit, at most 64px |
| `docs/src/_includes/share-card.njk` | Both lockups | Feeds `social-preview.png` and the README preview images. The README card draws the lockup 140px wide |
| `docs/src/_includes/base.njk`, `framework-specimen.njk` | `favicon.ico`, then `favicon.svg`; the base layout also the touch icon, manifest and `og:image` | The .ico declares `sizes="32x32"` so that browsers which take SVG icons prefer the SVG. The icon URLs come from `brandIcons` in `docs/eleventy.config.js`, each with `?v=` and a hash of the file: browsers keep a favicon by its URL, so a redrawn icon is a new URL |
| `docs/src/pages/brand.md` | The marks and lockups, SVG and PNG | The hero and the download grid |

## Icons

Every icon is declared once in `icons` in `build-brand-marks.js` and
rendered by `capture-brand-assets.js` from its own SVG at each of its
sizes, never scaled from another raster.

| File | Sizes | Frame and ground | For |
| --- | --- | --- | --- |
| `favicon.svg` | vector, declared 32 | disc's square, edge to edge; transparent | the tab, in every browser that takes an SVG icon |
| `favicon.ico` | 16, 32 | disc's square, edge to edge; transparent | the tab in Safari before 26, which takes no SVG icon |
| `apple-touch-icon.png` | 180 | disc 140px across, whole drawing; paper | the iOS home screen and Safari's favourites. Opaque, since iOS fills transparency with black, and square, since iOS rounds the corners |
| `icon-192.png`, `icon-512.png` | 192, 512 | whole drawing; transparent | the web manifest: an installed shortcut |
| `icon-maskable.png` | 512 | disc 80% across, whole drawing; paper | the web manifest, `purpose: maskable`: Android crops it to its own shape, keeping the central 80% the disc is fitted to |

A tab icon is edge to edge because at 16px every pixel goes to the badge,
and the edge of the icon explains the end of the flute it cuts (18.3 units
in 905, about half a pixel at 32px). Every larger icon shows the whole
flute, which otherwise would end in the air beside the disc.

The manifest declares `display: browser`: the documentation is not meant
to be installed as an app, and the icons serve a shortcut to it.

## The lockup

`build-brand-lockup.js` sets the badge beside the name with the centre of
the disc on the middle of the name's ink, from the top of the ascenders to
the foot of the round letters. The badge is round, so its centre is also its
optical centre. The disc is 1.55 times the height of the name's ink
(`MARK_RATIO`), which puts Onest's cap height at 0.6 of the disc, as in the
approved design; the gap is 0.3 of the same height (`GAP_RATIO`). Both
lockups are 108 units high.

The generator also exports where the middle of the name's x-height falls
(`nameCentre`, the middle of the round c), which the site header uses to
centre the name, rather than the lockup's box, on the text beside it. A
lowercase word reads on its x-height, so that is the band lined up with the
links.

## Measuring a drawing

The generators measure every number they need from the drawing: the ink
box (for the lockup's extent and the frames that show the whole drawing)
and the disc's box (for every frame, and the lockup's scale and
alignment). `inkOf()` in `scripts/lib/brand-mark.js`
reads paths, circles, rectangles and ellipses, the last turned by a
rotation, inside groups that translate. Path bounds are exact at their
extrema, elliptical arcs included. A stroke widens a shape by half its width
times the miter limit, a bound rather than a measurement; the current
drawing has no strokes. Anything else (a
transform it cannot bound, a shape it does not know, a reference, text or
an embedded image) is refused instead of skipped.

## Gaps

1. **The README's images bypass the site.** They resolve against `master`
   on `raw.githubusercontent.com`, so a lockup on a branch never shows
   there.
2. **No clearspace is published.** The Brand page asks for the built-in
   margin to be kept, but gives no measured clearspace.

## Replacing the drawing or the name

1. **Replace the source:** export the drawing to `docs/brand/cirth-mark.svg`,
   keeping the ids `DRAWING` names (or updating them there), or replace the
   glyphs in `docs/brand/cirth-wordmark-onest.svg` (one
   `<g transform="translate(x y)">` and one `<path>` per glyph). The
   generators measure both from their geometry, so nothing else needs a
   number.
2. **Run `npm run docs:build`, then `npm run docs:brand-assets`.** The
   first brings `docs/dist` up to date for the captured rasters.
3. **Run `npm run check:brand-assets`.** It must pass.
4. **Look at the result:** the favicon at 16, 24, 32 and 48px on a light
   and a dark tab strip, the lockup at 34px, its height in the site
   header, and at 96px, its height in the README.
5. **Re-run the suites:** `npm run build`, `npm run lint`,
   `npm run check:a11y`, `npm run check:visual`. Visual baselines change
   wherever the mark or the lockup appears, which is every page; review
   every changed image before accepting it.
6. **Check the surfaces a test does not see:** the README on GitHub, the
   social card in a validator, the favicon in a real tab strip at 16px
   (Safari 18 as well, for the .ico), and the touch icon on a phone's home
   screen. The icon URLs change with the files' content, so a reload picks
   up a new favicon; a tab that still shows the old one is reading a page
   built before the files changed.
