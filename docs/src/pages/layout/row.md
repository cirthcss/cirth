---
layout: docs.njk
description: Arrange a known set of peers as equal-width columns above 768px and stack them on narrower screens.
---

# Row

Use `.row` for a small, known set of peers that should stack on narrow screens
and share one equal-width row on wider screens. Common examples are form
fields, stat tiles, and short action groups.

{% demo "row" %}

```html
<div class="row">
  <article>Column one</article>
  <article>Column two</article>
  <article>Column three</article>
</div>
```

The wrapper controls presentation. The direct children retain their own HTML
meaning.

## Behavior

Below `768px`, the row has one column. At `768px` and above, CSS Grid gives
every direct child an equal share of one row. The items do not wrap onto a
second row, even when the row has many children.

Spacing comes from `--cirth-grid-column-gap` and
`--cirth-grid-row-gap`. Direct children receive `min-width: 0`, allowing long
text or an inner scroll container to shrink within the assigned column.

`.row` is available only in class-enabled builds.

## Row or grid

Use [`.grid`](/layout/grid) when items should wrap based on available space or
when their number can grow. A grid protects a minimum column width and moves
extra items to another line. A row always keeps its wide-screen items on one
line.

## Customizing the gaps

```css
.profile-fields {
  --cirth-grid-column-gap: var(--cirth-space-4);
  --cirth-grid-row-gap: var(--cirth-space-3);
}
```

The breakpoint and the equal-column behavior are part of `.row`'s contract.
Use a local layout instead when those decisions do not fit the content.

## Common mistakes

- Do not use `.row` for an unknown number of cards. They can become too narrow
  on a wide-screen row.
- Do not set widths on every child just to make them equal. The grid tracks
  already do that.
- Do not combine `.row` with another grid-owning class on the same element.

## Related pages

- [Grid](/layout/grid)
- [Container](/layout/container)
- [Forms](/forms/)
