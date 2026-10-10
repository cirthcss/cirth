# Brand assets

Every file that carries the Cirth mark, what produces it, what uses it, and
what to do when the drawing changes.

## How the assets relate

Three sources, and everything else is generated from them:

```text
docs/public/logo_brand.svg                       the mark: path data, edited by a person
docs/brand/cirth-wordmark-martian-condensed.svg  the name: outlines, edited by a person
src/theme/_colors.scss                           the pigments: accent and canvas steps
  |
  |-- npm run docs:marks ---------> logo_brand, logo_brand_dark, logo_mono,
  |                                 logo_mono_dark, favicon, favicon_dark,
  |                                 site.webmanifest
  |-- npm run docs:lockup --------> wordmark, wordmark_dark, wordmark_mono
  '-- npm run docs:brand-assets --> both of the above, then the rasters:
                                    logo_*.png, wordmark*.png,
                                    apple-touch-icon.png, social-preview.png
```

`scripts/build-brand-marks.js` writes the recolours, the favicons and the
manifest; `scripts/build-brand-lockup.js` writes the lockups;
`scripts/capture-brand-assets.js` renders the PNGs from those SVGs and from
the share-card and touch-icon pages in `docs/dist`, so it needs a current
docs build.

`npm run check:brand-assets` (part of `npm run lint`) regenerates every SVG
and the manifest in memory and fails when a file on disk differs from it,
or when a brand-named file in `docs/public/` is one no generator writes. A
difference means a hand edit, or a source that moved without a
regeneration. The PNGs are not compared, because rasterisation differs
between machines; regenerate them whenever the SVGs change.

## The name

The name is not typeset. `docs/brand/cirth-wordmark-martian-condensed.svg`
holds "Cirth" set in Martian Grotesk Condensed Bold, by Evil Martians, at
-1.2% tracking and converted to outlines, one path per glyph with the
baseline at y = 1000. The face is licensed under the SIL Open Font License
1.1 (<https://github.com/evilmartians/grotesk>); the file's metadata says
so, and `NOTICE.md` credits it. The lockup reads the glyphs as they are, so
replacing the name means replacing this file.

## Pigments

Assigned in `roles` in `scripts/build-brand-marks.js`:

| Role | Step | Used by |
| --- | --- | --- |
| Mark on light grounds | `$accent-500`, the light `--cirth-primary` | `logo_brand`, `favicon`, `wordmark` |
| Mark on dark grounds | `$accent-400`, one step lighter than the dark `--cirth-primary` | `logo_brand_dark`, `favicon_dark`, `wordmark_dark` |
| Paper | `$canvas-light` | the touch icon's ground, the manifest's colours |

The mono files are `black` and `white`. The lockup's name takes
`$neutral-900` on light and `$neutral-100` on dark. The Brand page prints
these values and their contrast from the same function (`palette()` in
`build-brand-marks.js`).

## Inventory

| File | Used by | Produced by | Notes |
| --- | --- | --- | --- |
| `logo_brand.svg` | home page orbit, Brand page; its paths are in every lockup | Drawn; fill rewritten by `docs:marks` | The geometry source. 512 viewBox, ink box about 306 x 400 |
| `logo_brand_dark.svg` | home page orbit, Brand page | `docs:marks` | |
| `logo_mono.svg`, `logo_mono_dark.svg` | Brand page | `docs:marks` | Black, white |
| `favicon.svg`, `favicon_dark.svg` | `base.njk`, the specimens, `site.webmanifest`, `favicon-preview` | `docs:marks` | The mark alone on a transparent ground, cropped to its ink plus 8 units |
| `site.webmanifest` | `base.njk` | `docs:marks` | `favicon.svg` and `apple-touch-icon.png`; colours from `$canvas-light` |
| `wordmark.svg`, `wordmark_dark.svg`, `wordmark_mono.svg` | README title, site header, mobile menu and footer, share card, Brand page | `docs:lockup` | Mark and outlined name; the mono file paints with `currentColor` |
| `logo_*.png` (four) | Brand page downloads | `capture-brand-assets.js` | 1024 x 1024, transparent |
| `wordmark.png`, `wordmark_dark.png` | Brand page downloads | `capture-brand-assets.js` | 4x the SVG's box |
| `apple-touch-icon.png` | `base.njk`, `site.webmanifest` | `capture-brand-assets.js` | `favicon.svg` at 140px on the paper canvas, 180px square |
| `social-preview.png` | `base.njk` `og:image`, absolute GitHub Pages URL | `capture-brand-assets.js` | Renders `share-card.njk`, which embeds the lockup |

### References outside `docs/public/`

| Place | What it points at | Note |
| --- | --- | --- |
| `README.md` | `wordmark.svg`, `wordmark_dark.svg` | The title. Absolute `raw.githubusercontent.com` URLs on `master`: they update only when `master` does, and GitHub's image proxy caches them |
| `docs/src/_includes/site-header.njk` | Both lockups, twice each | Header and mobile menu, 34px high, centred on the nav link band, 32px from the first link |
| `docs/src/_includes/site-footer.njk` | Both lockups | 34px high |
| `docs/src/_includes/home.njk` | Both mark SVGs | The centre of the integrations orbit |
| `docs/src/_includes/share-card.njk` | Both lockups | Feeds `social-preview.png` and the README preview images |
| `docs/src/_includes/base.njk`, `framework-specimen.njk` | Favicons; the base layout also the touch icon, manifest and `og:image` | |
| `docs/src/pages/brand.md` | Every SVG and PNG above | The hero and the download grid |
| `docs/src/pages/favicon-preview.njk` | `favicon.svg` | Exists only to be rendered into the touch icon |

## The drawing

The mark is provisional. Its geometry, clearspace and minimum size are not
published on the Brand page, and neither is the lockup's proportion
(`MARK_RATIO` in `build-brand-lockup.js`: the mark 1.5 times the height of
the name's C), until the definitive drawing is in.

The two halves of the lockup are aligned optically (`RAISE`): at the foot,
with the name then raised by a quarter of the difference in height.
Centring them by their boxes left the figure sunk below the capitals,
because the feather adds height without mass; the quarter is also what
centring the figure without its feather on the capitals gives (0.254).
The generator also exports where the middle of the name's capitals falls
(`nameCentre`), which the site header uses to centre the name, rather
than the lockup's box, on the text beside it.

The current drawing is the maintainer's 1312 x 1199 vector of 2026-10-09,
one compound path of five contours, cleaned without changing what it
draws: micro-segments at the tips merged into points, near-smooth nodes
made smooth, nodes a single curve could replace removed (82 segments to
60), and the sound hole kept as a circle. The cleaned outline differs from
the original by 0.37% of the ink area. It sits in the 512 box at an ink
height of 400, centred vertically and 5 units right of the horizontal
centre, half the distance between its box's centre and its area's
centroid.

There is no reduced drawing for small sizes. Rendered at 16, 24, 32 and
48px, at 1x and 2x, the full drawing holds from 32px at 1x and from 16px
at 2x; below 32px at 1x its two sliver counters soften. A reduction that
drops them was tried and rejected: without them the mark stops reading as a
sign and reads as a round figure.

There is no app icon on a tile. Where a square has to be filled, the mark's
own file is square and carries its margin; the touch icon is the one place
that needs an opaque ground, and it is rendered with one.

## Gaps

1. **The manifest declares no 192px or 512px PNG and no maskable icon.**
   The documentation is not meant to be installed; an installable app
   would need both.
2. **The README's images bypass the site.** They resolve against `master`
   on `raw.githubusercontent.com`, so a lockup on a branch never shows
   there.

## Replacing the drawing or the name

1. **Replace the source:** the path data in `docs/public/logo_brand.svg`
   (keep the 512 viewBox and one `<path>` per filled shape), or the glyphs
   in `docs/brand/cirth-wordmark-martian-condensed.svg` (one
   `<g transform="translate(x y)">` and one `<path>` per glyph). The
   generators measure both from their path data, so nothing else needs a
   number.
2. **Run `npm run docs:build`, then `npm run docs:brand-assets`.** The
   first brings `docs/dist` up to date for the captured rasters.
3. **Run `npm run check:brand-assets`.** It must pass.
4. **Look at the result:** the mark at 16, 24, 32 and 48px on both
   canvases, and the lockup at 34px, its height in the site header.
5. **Measure the definitive mark and publish it on the Brand page:**
   clearspace, minimum size, the lockup's proportion. Replace the page's
   note that says the drawing is a working version.
6. **Re-run the suites:** `npm run build`, `npm run lint`,
   `npm run check:a11y`, `npm run check:visual`. Visual baselines change
   wherever the mark or the lockup appears, which is every page; review
   every changed image before accepting it.
7. **Check the surfaces a test does not see:** the README on GitHub, the
   social card in a validator, the favicon in a real tab strip at 16px, and
   the touch icon on a phone's home screen.
