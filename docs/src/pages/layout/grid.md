---
layout: docs.njk
description: Build a responsive grid whose columns wrap according to available space, without writing breakpoint rules.
---

# Grid

Use `.grid` for a collection of peers that may wrap onto more than one row,
such as cards, products, or gallery items. The number of columns follows the
space available to the grid, not the viewport width.

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

CSS Grid places each direct child in a column. Cirth defines the columns with
`auto-fit` and a default minimum width of `12rem`. Columns grow equally to use
the remaining space. When another minimum-width column no longer fits, the
next item starts a new row.

On a container narrower than the minimum, the grid uses one column at the
container's full width. No narrow-screen media query is needed.

The grid also:

- uses `--cirth-grid-column-gap` and `--cirth-grid-row-gap` for spacing;
- gives direct children `min-width: 0`, allowing long content to shrink
  within its track;
- removes direct-child flow margins because the grid gap owns the space
  between cells.

## Grid or row

| Choose | When the layout should |
| --- | --- |
| `.grid` | Add and remove columns as available space changes, and wrap extra items |
| [`.row`](/layout/row) | Stack below `768px`, then keep all items on one equal-width row |

Use `.grid` when the number of items can change. Use `.row` when a small,
known set belongs together on one wide-screen row.

## Changing the minimum column width

Set `--cirth-grid-min-column` on one grid. A larger value wraps earlier; a
smaller value fits more columns:

```css
.product-grid {
  --cirth-grid-min-column: 16rem;
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

- Do not set fixed widths on the direct children unless the design requires
  them. Fixed widths can prevent the tracks from shrinking.
- Do not use `.grid` when every item must stay on one row. Use `.row`.
- Do not combine `.grid` with `.container` on the same element. Nest the grid
  inside the container.

## Related pages

- [Row](/layout/row)
- [Container](/layout/container)
- [Cards](/components/card)
