# Brand assets

Every file that carries the Cirth mark, what uses it, and what has to
happen to it when the mark is replaced.

The mark is currently being redrawn. This page exists because the drawing
is copied by hand into fourteen files and referenced from nine places, and
without a list the substitution is a search for things to forget.
`npm run check:brand-assets` (part of `npm run lint`) fails when a file's
geometry no longer matches `docs/public/logo_brand.svg`, so the forgetting
is caught rather than shipped.

## How the assets relate

```text
docs/public/logo_brand.svg          the drawing. One source of geometry.
  |
  |-- recolour ------------------>  logo_brand_dark, logo_mono, logo_mono_dark
  |-- recolour + tile ----------->  logo_*_app, logo_*_app_dark
  |-- reduce (a human decides) -->  favicon, favicon_dark, mark_small*
  |-- generated ----------------->  wordmark, wordmark_dark, wordmark_mono
  |                                   npm run docs:lockup
  |
  '-- rasterised ---------------->  *.png, apple-touch-icon, social-preview
                                      npm run docs:brand-assets (partly)
```

Only the wordmarks are generated today. Everything on the `recolour` and
`reduce` rows is maintained by hand, and the 1024px logo PNGs are produced
outside the repository altogether.

## Inventory

`Blocked` means the file cannot be produced until the definitive mark is in
`docs/public/logo_brand.svg`.

| File | Used by | Format | Size | Variant | Blocked | Check after substitution |
| --- | --- | --- | --- | --- | --- | --- |
| `logo_brand.svg` | README header, site header (light), site footer (light), share card, Brand grid, lockup build, every derived file | SVG | 512 viewBox | Copper `#BD5928` | Yes, it **is** the mark | `check:brand-assets`, `docs:lockup`, visual suite |
| `logo_brand_dark.svg` | README header (dark), site header (dark), site footer (dark), share card, Brand grid | SVG | 512 viewBox | Copper `#E16B31` | Yes, recolour | `check:brand-assets`, visual suite |
| `logo_mono.svg` | Brand grid, one-colour use | SVG | 512 viewBox | Black | Yes, recolour | `check:brand-assets` |
| `logo_mono_dark.svg` | Brand grid, one-colour use | SVG | 512 viewBox | White | Yes, recolour | `check:brand-assets` |
| `logo_brand_app.svg` | Brand grid, square containers | SVG | 512 viewBox | Copper tile, `#FFFBF9` mark | Yes, recolour on a tile | `check:brand-assets` |
| `logo_brand_app_dark.svg` | Brand grid, square containers | SVG | 512 viewBox | `#2C1409` tile, copper mark | Yes, recolour on a tile | `check:brand-assets` |
| `logo_mono_app.svg` | One-colour square containers | SVG | 512 viewBox | Black tile, white mark | Yes, recolour on a tile | `check:brand-assets` |
| `logo_mono_app_dark.svg` | One-colour square containers | SVG | 512 viewBox | White tile, black mark | Yes, recolour on a tile | `check:brand-assets` |
| `favicon.svg` | `base.njk`, light scheme; `site.webmanifest`; `favicon-preview` page | SVG | 64 viewBox, 6px tile radius | Paper `#FAF5F3` tile | Yes, **reduction** | `check:brand-assets`, then look at it at 16px |
| `favicon_dark.svg` | `base.njk`, dark scheme | SVG | 64 viewBox, 6px tile radius | Canvas `#141521` tile | Yes, **reduction** | `check:brand-assets`, then look at it at 16px |
| `mark_small.svg` | Nothing, since the Brand page retired its fidelity ladder | SVG | 64px, cropped viewBox | Copper `#BD5928` | Yes, **reduction** | Decide whether it is still wanted before redrawing it |
| `mark_small_dark.svg` | Nothing, as above | SVG | 64px, cropped viewBox | Copper `#E16B31` | Yes, **reduction** | As above |
| `wordmark.svg` | Brand lockup grid | SVG, generated | 327.51 x 78 | Copper mark, graphite name | No, regenerate | `npm run docs:lockup`, then `check:brand-assets` |
| `wordmark_dark.svg` | Brand lockup grid | SVG, generated | 327.51 x 78 | Copper mark, paper name | No, regenerate | `npm run docs:lockup` |
| `wordmark_mono.svg` | Brand page download | SVG, generated | 327.51 x 78 | `currentColor` | No, regenerate | `npm run docs:lockup` |
| `logo_brand.png` | Brand page download | PNG | 1024 x 1024 | Copper | Yes, and **no script produces it** | Re-export by hand, or add it to a script |
| `logo_brand_dark.png` | Brand page download | PNG | 1024 x 1024 | Copper dark | Yes, no script | As above |
| `logo_mono.png` | Brand page download | PNG | 1024 x 1024 | Black | Yes, no script | As above |
| `logo_mono_dark.png` | Brand page download | PNG | 1024 x 1024 | White | Yes, no script | As above |
| `logo_brand_app.png` | Brand page download | PNG | 1024 x 1024 | Copper tile | Yes, no script | As above |
| `logo_brand_app_dark.png` | Brand page download | PNG | 1024 x 1024 | Dark tile | Yes, no script | As above |
| `logo_mono_app.png` | Not linked from the site | PNG | 1024 x 1024 | Mono tile | Yes, no script | Decide whether it is still wanted |
| `logo_mono_app_dark.png` | Not linked from the site | PNG | 1024 x 1024 | Mono tile | Yes, no script | Decide whether it is still wanted |
| `wordmark.png` | Brand lockup download | PNG, generated at 4x | 1312 x 312 | Copper and graphite | No, regenerate | `npm run docs:brand-assets` |
| `wordmark_dark.png` | Brand lockup download | PNG, generated at 4x | 1312 x 312 | Copper and paper | No, regenerate | `npm run docs:brand-assets` |
| `apple-touch-icon.png` | `base.njk` `apple-touch-icon` | PNG, generated | 180 x 180 | Renders `favicon.svg` | After the favicon | `npm run docs:brand-assets` |
| `social-preview.png` | `base.njk` `og:image`, absolute GitHub Pages URL | PNG, generated | 1200 x 630 | Light | Yes, page embeds the mark | `npm run docs:brand-assets`, then a card validator |
| `site.webmanifest` | `base.njk` manifest link | JSON | n/a | `theme_color` `#faf5f3` | No, but see gaps | Install the site as an app |

### References outside `docs/public/`

| Place | What it points at | Note |
| --- | --- | --- |
| `README.md` | `logo_brand.svg`, `logo_brand_dark.svg` | Absolute `raw.githubusercontent.com` URLs on `master`. They update only when `master` does, and they are cached by GitHub's image proxy |
| `docs/src/_includes/site-header.njk` | Both brand SVGs, twice each | Header and mobile drawer |
| `docs/src/_includes/site-footer.njk` | Both brand SVGs | |
| `docs/src/_includes/share-card.njk` | Both brand SVGs | Feeds `social-preview.png` |
| `docs/src/_includes/base.njk` | Favicons, touch icon, manifest, `og:image` | |
| `docs/src/pages/brand.md` | The download grid | |
| `docs/src/pages/favicon-preview.njk` | `favicon.svg` | Exists only to be screenshotted |
| `scripts/build-brand-lockup.js` | `logo_brand*.svg` | Geometry and pigment |
| `scripts/check-brand-assets.js` | All fourteen SVGs | The drift check |

## Gaps this list found

These are real today and do not depend on the new mark.

1. **`mark_small*.svg` are orphaned.** The Brand page's fidelity ladder was
   the only thing referencing them. Keep or drop, but decide.
2. **`logo_mono_app*.png` are orphaned too.** Never linked from any page.
3. **Eight PNGs have no producing script.** The wordmark PNGs are captured
   from their SVGs; the eight 1024px logo PNGs are not, so they can silently
   fall behind their SVGs. Nothing checks them.
4. **The manifest declares one icon.** `site.webmanifest` lists
   `favicon.svg` only: no maskable icon, no PNG fallback, and no dark
   variant, so an installed shortcut has nothing sized for it.
5. **`theme_color` is a literal.** `#faf5f3` is written into the manifest
   and is the light canvas by coincidence, not by derivation.
6. **The README's images bypass the site.** They resolve against `master`
   on `raw.githubusercontent.com`, so a logo on a branch never shows there,
   and the substitution is only visible once it merges.

## Substituting the definitive mark

Do these in order. Stop at the first failure rather than working around it.

1. **Put the drawing in `docs/public/logo_brand.svg`.** Keep the 512
   viewBox if the artwork allows it; if it does not, note the new one here,
   because the favicons and the app tiles crop against it.
2. **Run `npm run check:brand-assets`.** It fails, and lists every file
   that still holds the old drawing. That list is the work.
3. **Recolour the eight flat variants** from the new paths: the three
   recolours and the four tiles, plus the source itself. Fills stay as they
   are unless the brand colours change.
4. **Redraw the reductions.** `favicon.svg`, `favicon_dark.svg` and, if
   they are kept, `mark_small*.svg`. Which parts a reduction keeps is a
   drawing decision and no script can make it. Check each at 16px.
5. **Regenerate the lockups:** `npm run docs:lockup`. The mark is placed
   against its own measured ink box, so this needs no hand measurement.
   Look at the result: the name sits on the cap height, and a mark with a
   different aspect ratio will change the lockup's width.
6. **Re-export the eight logo PNGs** at 1024px, or add them to a script.
7. **Regenerate the captured rasters:** `npm run docs:brand-assets`. This
   covers the wordmark PNGs, the touch icon and the social preview.
8. **Re-run `npm run check:brand-assets`.** It must pass.
9. **Measure the mark and complete the Brand page.** Clearspace, minimum
   size, construction grid, size thresholds, lockup alignment and the
   reduced variant are all listed as pending on
   [the Brand page](src/pages/brand.md) and each needs a number taken off
   the new drawing.
10. **Rewrite the mark's description.** The Brand page says the mark is
    being redrawn. Replace that with what it is.
11. **Re-run the suites:** `npm run build`, `npm run lint`,
    `npm run docs:build`, `npm run check:a11y`, `npm run check:visual`.
    Visual baselines will change wherever the mark appears. Review every
    changed image before accepting it, and update baselines deliberately.
12. **Check the surfaces a test does not see:** the README on GitHub, the
    social card in a validator, the favicon in a real tab strip at 16px,
    and the installed web app icon.
