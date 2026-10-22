---
layout: docs.njk
description: Associate an image, table, code sample, or other self-contained item with an optional native caption.
---

# Figure

Use `<figure>` for a self-contained item that the surrounding content can
refer to as one unit. Images are common, but a figure may also contain a
table, diagram, quotation, or code sample. Put its caption inside
`<figcaption>`.

{% demo "figure" %}

```html
<figure>
  <img src="quarterly-revenue.png"
       alt="Revenue increased from 420 thousand dollars in Q1 to 610 thousand in Q4">
  <figcaption>Figure 1. Revenue by quarter in 2026.</figcaption>
</figure>
```

## Native structure

`<figcaption>` is optional and must be the first or last child of its
`<figure>`. Keeping the caption inside the figure creates an explicit
relationship that remains intact if the figure moves elsewhere in the
document.

A figure is not required for every image. Use a plain `<img>` when the image is
simply part of the sentence or interface and does not need a separate caption
or identity.

For a data table, `<caption>` remains the table's own accessible name. A
surrounding `<figcaption>` may provide broader commentary, but it should not
replace the table caption.

## What Cirth adds

Cirth removes the browser's default figure margin and padding. The item can
therefore align with the surrounding content or with the layout that contains
it.

`<figcaption>` uses the muted meta-text role, medium weight, and a small
vertical padding. The relevant values include `--cirth-muted-color`,
`--cirth-meta-font-size`, and the shared spacing tokens.

Cirth does not generate numbering and does not create alternative text for
the figure's contents.

## Common mistakes

- Do not place the caption outside `<figure>` when it describes that figure.
- Do not treat `<figcaption>` as a replacement for image `alt` text.
- Do not use `<figure>` only to obtain spacing. It represents a self-contained
  item in the document.
- Do not omit a table's `<caption>` when the table needs its own name.

## Related pages

- [Embedded content](/content/embedded)
- [Table](/content/table)
- [Breakout](/utilities/breakout)
