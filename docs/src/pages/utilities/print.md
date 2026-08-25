---
layout: docs.njk
---

# Print

Cirth ships a `@media print` pass as its own stylesheet. Add it once,
with `media="print"`, and any page built from semantic HTML prints as a
readable document in either color scheme — there is nothing to configure
and no print-only markup to maintain.

```html
<link rel="stylesheet" href="dist/cirth.min.css">
<link rel="stylesheet" href="dist/cirth.print.min.css" media="print">
```

Load it **after** the main build: the pass wins over the component rules it
has to outrank by source order, exactly as it did when it lived inside the
bundle. Each build has its matching sheet — `cirth.print.min.css`,
`cirth.print.classless.min.css`, `cirth.print.scoped.min.css`,
`cirth.print.classless.scoped.min.css` — or, from npm,
`@cirthcss/cirth/print` and its `classless`/`scoped` variants.

### Why it is a separate file

Print styling is around 630 B gzipped, and it is never needed to paint the
screen. Kept inside the main bundle it was charged to every visitor on the
first round trip, including the ones who never print. As a separate sheet
whose media query does not match the display, the browser fetches it at low
priority and it never competes with the first paint.

The trade is that it is now opt-in: **a page that links only the main build
prints with no pass at all.** If you upgraded from a version before this
split and printing regressed, the missing `<link>` above is why.

## Behavior

Paper is not a screen — there is no elevation, no hover, no color scheme to
follow, and toner is not free. Under `@media print` Cirth:

* **Resets the surface pair.** The page goes to a transparent background
  and black ink, and `color-scheme` is forced to `light`. This is the one
  that matters most: browsers drop author *backgrounds* when printing but
  keep author *text color*, so a page printed while the dark scheme is
  active would otherwise come out near-white on white.
* **Flattens surfaces.** Card, dropdown, code, `<kbd>`, form field, striped
  row, and modal overlay backgrounds go transparent, and every box shadow
  is dropped.
* **Prints links as ink plus their underline.** A mid-tone accent is a
  screen affordance; out of a monochrome printer it is gray mush. Links
  keep their underline, which reads either way. After an absolute
  (`http…`) link that is not navigation or a button, the URL is printed in
  parentheses — paper cannot resolve an `href` on its own.
* **Outlines controls.** A button's label is `--cirth-primary-inverse`
  (white) on a fill the browser is about to discard, so buttons print as an
  outlined label instead of as nothing at all.
* **Keeps color that carries meaning.** `<mark>`, `<progress>`, checkboxes
  and radios opt back in with `print-color-adjust: exact`: a checked box
  without its tick, or a progress bar without its fill, is not a style
  detail but missing content.
* **Doesn't break tables.** `<thead>` repeats on every page a table spans,
  `<tfoot>` lands after the last row, and rows are not torn in half by the
  fold.
* **Stops clipping content.** `<pre>` wraps instead of scrolling, and
  `.overflow-auto` spills instead of hiding what is past the edge — what
  scrolls sideways on screen would simply be cut off on paper.
* **Prints an open `<dialog>` in the flow** rather than pinned over the
  first page.
* **Controls page breaks.** Headings do not end a page on their own,
  figures and images stay whole, and paragraphs, list items, and quotes
  keep at least three lines on either side of a break.

## Customization

Three tokens drive the whole pass:

| Variable | Default | Used for |
| --- | --- | --- |
| `--cirth-print-color` | black | Body text, headings, links, control labels |
| `--cirth-print-muted-color` | 6.5:1 gray | Captions, attributions, placeholders, printed URLs |
| `--cirth-print-border-color` | 3.8:1 gray | Table rules, card and field borders, `<hr>` |

Override them like any other token, from a stylesheet loaded after Cirth:

```css
:root {
  /* Softer ink, heavier rules */
  --cirth-print-color: #1a1a1a;
  --cirth-print-border-color: #767676;
}
```

To drop the printed URLs after external links:

```css
@media print {
  a[href^="http"]::after {
    content: none;
  }
}
```

## What Cirth deliberately doesn't do

* **No `@page` rule.** Margins, page size, and orientation belong to your
  document, not to a component library.
* **Nothing is hidden.** Which parts of *your* layout are chrome — a
  sticky header, a cookie banner, a sidebar — is something only your
  application knows. Add your own `@media print { … { display: none } }`
  for those.

## A note on browser settings

Browsers print without background graphics unless the user turns them on
("Background graphics" in Chrome's print dialog, "Print backgrounds" in
Firefox's). Cirth's pass is written for that default: everything it needs
to stay legible is carried by ink, borders, and underlines, and the
elements that genuinely need their fill are marked
`print-color-adjust: exact` so they survive either setting.
