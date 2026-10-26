---
layout: docs.njk
description: Lay out a collection of cards in aligned columns that follow the available space, at most three to a row, without breakpoint rules.
---

# Grid

Use `.grid` for a collection of peers, such as cards, products or gallery
items. The columns follow the space available to the grid, not the viewport
width, and stay aligned from one row to the next.

{% demo "grid" %}

```html
<div class="grid">
  <article>Card one</article>
  <article>Card two</article>
  <article>Card three</article>
</div>
```

The `<article>` elements remain independent pieces of content. `.grid` only
controls how the direct children are arranged.

## How it behaves

CSS Grid places each direct child in a column. A column is at least `16rem`
wide, and there are never more than three: a grid fits as many columns as
that allows, and the columns share the remaining space equally. When another
column no longer fits, the next item starts a new row, under the column
before it.

| Grid width | Columns |
| --- | --- |
| Under about 33rem | One, as wide as the grid |
| From about 33rem | Two |
| From about 50rem | Three, and no more |

A last row with fewer items leaves the rest of it empty, so every card keeps
the width of its column. Fewer items than columns share the one row. No
narrow-screen media query is needed.

The grid also:

- uses `--cirth-grid-column-gap` and `--cirth-grid-row-gap` for spacing;
- gives direct children `min-width: 0`, allowing long content to shrink
  within its track;
- removes direct-child flow margins because the grid gap owns the space
  between cells.

## Grid or row

| Choose | When the layout should |
| --- | --- |
| `.grid` | Keep a collection in aligned columns, at most three to a row |
| [`.row`](/layout/row) | Fill every line, such as the fields of a form or a line of controls, with one child across the whole width when needed |

Use `.grid` when alignment matters more than filling the last row. Use
`.row` when every line should be full, even if its items end up different
widths on different lines.

## Changing the columns

Set `--cirth-grid-min-column` and `--cirth-grid-max-columns` on one grid. A
collection of small tiles takes a smaller minimum and more columns:

```css
.stat-tiles {
  --cirth-grid-min-column: 10rem;
  --cirth-grid-max-columns: 6;
}
```

Change the gaps independently when needed:

```css
.compact-grid {
  --cirth-grid-column-gap: var(--cirth-space-3);
  --cirth-grid-row-gap: var(--cirth-space-3);
}
```

`.grid` is available only in class-enabled builds.

## Common mistakes

- Do not lay out form fields with `.grid`. A short row of fields leaves
  empty columns beside it; `.row` fills the line.
- Do not set fixed widths on the direct children unless the design requires
  them. Fixed widths can prevent the tracks from shrinking.
- Do not combine `.grid` with `.container` on the same element. Nest the grid
  inside the container.

## Related pages

- [Row](/layout/row)
- [Container](/layout/container)
- [Cards](/components/card)
