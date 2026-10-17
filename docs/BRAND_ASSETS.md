# Brand assets

Every file that carries the Cirth mark, what produces it, what uses it, and
what to do when a drawing changes.

## How the assets relate

Four sources, and everything else is generated from them:

```text
docs/brand/cirth-mark.svg                        the full badge, drawn by a person
docs/brand/cirth-mark-compact.svg                the compact badge, drawn by a person
docs/brand/cirth-wordmark-martian-condensed.svg  the name: outlines, edited by a person
src/theme/_colors.scss                           the pigments: accent and canvas steps
  |
  |-- npm run docs:marks ---------> logo_brand, logo_compact, favicon,
  |                                 site.webmanifest
  |-- npm run docs:lockup --------> wordmark, wordmark_dark,
  |                                 wordmark_compact, wordmark_compact_dark
  '-- npm run docs:brand-assets --> both of the above, then the rasters:
                                    logo_*.png, wordmark*.png, the icons
                                    (favicon.ico, apple-touch-icon.png,
                                    icon-*.png), social-preview.png
```

`scripts/build-brand-marks.js` writes the marks, the favicon and the
manifest, and declares the raster icons (`icons`); `scripts/build-brand-lockup.js`
writes the lockups; `scripts/capture-brand-assets.js` renders the PNGs from
those SVGs, each icon from its own SVG at each of its sizes, and the share
cards from their pages in `docs/dist`, so it needs a current docs build. `scripts/lib/brand-mark.js` reads the drawings for both
generators: it paints them, strips what describes the drawing's history
rather than the mark, and measures their ink.

`npm run check:brand-assets` (part of `npm run lint`) regenerates every SVG
and the manifest in memory and fails when a file on disk differs from it,
when a brand-named file in `docs/public/` is one no generator writes, or
when a declared icon is missing or holds other sizes than it declares. A
difference means a hand edit, or a source that moved without a
regeneration. The rasters' pixels are not compared, because rasterisation
differs between machines; regenerate them whenever the SVGs change.

## Two drawings

The mark is a round badge: a figure playing a flute in front of a magenta
disc, inside a black ring. It is drawn twice, and the size it is displayed
at decides which drawing is used:

| Drawing | Source | Displayed at | Used by |
| --- | --- | --- | --- |
| Full | `docs/brand/cirth-mark.svg` | 64px and larger | README, share card, Brand page hero and downloads |
| Compact | `docs/brand/cirth-mark-compact.svg` | below 64px | every icon, site header and footer, home page orbit, README card |

The compact drawing is a close-up of the face and the flute, inside a
heavier ring, with no cloak or sleeves. Rendered at 16, 24, 32 and 48px,
at 1x and 2x, on light and dark tab strips, the full drawing turns into a
pale blot below the face from 24px down, where the compact one still shows
the face and the flute across the disc.

Each source is the maintainer's export, with a title and a description of
the artwork. The full drawing sits in a 1254-unit square with a margin; the
compact one is framed on its ring's own square, as a tab icon is, so the
end of its flute lies outside its frame. The generators find three
shapes in each by id: the ring that bounds the badge, the disc and the
highlight on the disc. The ids differ between the two files and are listed
in `DRAWINGS` in `scripts/lib/brand-mark.js`.

There is one mark file per drawing, not one per colour scheme. The badge
carries its own ring and reads on either ground; on a near-black page the
ring merges with the background and the magenta disc gives the edge. There
is no one-colour version: a drawing in several inks has no mechanical
one-ink reduction, and one would have to be drawn.

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
| Disc | `$accent-500`, the light `--cirth-primary` | every mark, favicon and lockup |
| Highlight | `$accent-250`, the step nearest the drawing's own highlight | every mark, favicon and lockup |
| Paper | `$canvas-light` | the ground of the touch icon and the maskable icon, the manifest's colours |

The generators repaint the disc and the highlight in both drawings, so the
two always share the accent, whatever colour the source carries. Every
other ink (the ring and outlines, the skin and flute, the greys) is the
drawing's own. The lockup's name takes `$neutral-900` on light and
`$neutral-100` on dark. The Brand page prints the painted values from the
same function (`palette()` in `build-brand-marks.js`).

## Inventory

| File | Used by | Produced by | Notes |
| --- | --- | --- | --- |
| `logo_brand.svg` | Brand page | `docs:marks` | The full drawing, painted. Declared 512px, viewBox 1254 |
| `logo_compact.svg` | home page orbit, Brand page | `docs:marks` | The compact drawing, painted, in a square centred on the ring and just wide enough for the whole flute |
| `favicon.svg` | `base.njk`, the specimens | `docs:marks` | The compact drawing in its ring's square, edge to edge, on a transparent ground. Declared 32px |
| `site.webmanifest` | `base.njk` | `docs:marks` | The `icons` marked for the manifest; colours from `$canvas-light` |
| `wordmark.svg`, `wordmark_dark.svg` | README title, share card, Brand page | `docs:lockup` | Full badge and outlined name |
| `wordmark_compact.svg`, `wordmark_compact_dark.svg` | site header, mobile menu and footer, README card, Brand page | `docs:lockup` | Compact badge and outlined name |
| `logo_*.png` (two) | Brand page downloads | `capture-brand-assets.js` | 1024 x 1024, transparent |
| `wordmark*.png` (four) | Brand page downloads | `capture-brand-assets.js` | 4x the SVG's box |
| `social-preview.png` | `base.njk` `og:image`, absolute GitHub Pages URL | `capture-brand-assets.js` | Renders `share-card.njk`, which embeds the full lockup |

### References outside `docs/public/`

| Place | What it points at | Note |
| --- | --- | --- |
| `README.md` | `wordmark.svg`, `wordmark_dark.svg` | The title, 96px high. Absolute `raw.githubusercontent.com` URLs on `master`: they update only when `master` does, and GitHub's image proxy caches them |
| `docs/src/_includes/site-header.njk` | Both compact lockups, twice each | Header and mobile menu, 34px high, centred on the nav link band, 32px from the first link |
| `docs/src/_includes/site-footer.njk` | Both compact lockups | 34px high |
| `docs/src/_includes/home.njk` | `logo_compact.svg` | The centre of the integrations orbit, at most 64px |
| `docs/src/_includes/share-card.njk` | Full lockups; compact ones on the README card | Feeds `social-preview.png` and the README preview images. The README card draws the lockup 140px wide, its badge under 64px |
| `docs/src/_includes/base.njk`, `framework-specimen.njk` | `favicon.ico`, then `favicon.svg`; the base layout also the touch icon, manifest and `og:image` | The .ico declares `sizes="32x32"` so that browsers which take SVG icons prefer the SVG. The icon URLs come from `brandIcons` in `docs/eleventy.config.js`, each with `?v=` and a hash of the file: browsers keep a favicon by its URL, so a redrawn icon is a new URL |
| `docs/src/pages/brand.md` | The marks and lockups, SVG and PNG | The hero and the download grid |

## Icons

Every icon is the compact drawing, declared once in `icons` in
`build-brand-marks.js` and rendered by `capture-brand-assets.js` from its
own SVG at each of its sizes, never scaled from another raster.

| File | Sizes | Frame and ground | For |
| --- | --- | --- | --- |
| `favicon.svg` | vector, declared 32 | ring's square, edge to edge; transparent | the tab, in every browser that takes an SVG icon |
| `favicon.ico` | 16, 32 | ring's square, edge to edge; transparent | the tab in Safari before 26, which takes no SVG icon |
| `apple-touch-icon.png` | 180 | ring 140px across, whole drawing; paper | the iOS home screen and Safari's favourites. Opaque, since iOS fills transparency with black, and square, since iOS rounds the corners |
| `icon-192.png`, `icon-512.png` | 192, 512 | whole drawing; transparent | the web manifest: an installed shortcut |
| `icon-maskable.png` | 512 | ring 80% across, whole drawing; paper | the web manifest, `purpose: maskable`: Android crops it to its own shape, keeping the central 80% the ring is fitted to |

A tab icon is edge to edge because at 16px every pixel goes to the badge,
and the edge of the icon explains the flute it cuts. Every larger icon
shows the whole flute, which otherwise would end in the air beside the
ring.

The manifest declares `display: browser`: the documentation is not meant
to be installed as an app, and the icons serve a shortcut to it.

## The lockup

`build-brand-lockup.js` sets the badge beside the name with the centre of
the ring on the middle of the name's capitals. The badge is round, so its
centre is also its optical centre; the hands and sleeves the full drawing
adds below the ring add height without moving it. The ring is 1.6 times
the height of the name's C (`MARK_RATIO`), which keeps the name in the
34px header close to its size beside the previous mark; the gap is 0.3 of
the cap height (`GAP_RATIO`). Both lockups are 108 units high.

The generator also exports, for each lockup, where the middle of the
name's capitals falls (`nameCentre`), which the site header uses to centre
the name, rather than the lockup's box, on the text beside it.

## Measuring a drawing

The generators measure every number they need from the drawings: the ink
box (for the lockup's extent and the frames that show the whole drawing)
and the ring's box (for every frame, and the lockup's scale and
alignment). `inkOf()` in `scripts/lib/brand-mark.js`
reads paths, circles, rectangles and ellipses, the last turned by a
rotation, inside groups that translate. Path bounds are exact at their
extrema, elliptical arcs included. A stroke widens a shape by half its width
times the miter limit, a bound rather than a measurement, which in these
drawings is never more than about three units in 1254. Anything else (a
transform it cannot bound, a shape it does not know, a reference, text or
an embedded image) is refused instead of skipped.

## Gaps

1. **The README's images bypass the site.** They resolve against `master`
   on `raw.githubusercontent.com`, so a lockup on a branch never shows
   there.
2. **No clearspace is published.** The Brand page gives the size rule and
   asks for the built-in margin to be kept, but no measured clearspace.

## Replacing a drawing or the name

1. **Replace the source:** export the drawing to `docs/brand/cirth-mark.svg`
   or `docs/brand/cirth-mark-compact.svg`, keeping the ids `DRAWINGS`
   names (or updating them there), or replace the glyphs in
   `docs/brand/cirth-wordmark-martian-condensed.svg` (one
   `<g transform="translate(x y)">` and one `<path>` per glyph). The
   generators measure all three from their geometry, so nothing else needs
   a number.
2. **Run `npm run docs:build`, then `npm run docs:brand-assets`.** The
   first brings `docs/dist` up to date for the captured rasters.
3. **Run `npm run check:brand-assets`.** It must pass.
4. **Look at the result:** the favicon at 16, 24, 32 and 48px on a light
   and a dark tab strip, the compact lockup at 34px, its height in the site
   header, and the full lockup at 96px, its height in the README.
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
