---
layout: docs.njk
---


# Row

`.row` is a single-row layout: stacked below the `md` breakpoint, equal-width
columns on one row from `md` up. Column count follows child count, not
available space — for a grid that wraps into multiple rows instead, see
[Grid](/layout/grid).

{% demo "row" %}

```html
<div class="row">
  <article>Column one</article>
  <article>Column two</article>
  <article>Column three</article>
</div>
```

## When to use `.row`

`.row` is for content that reads as one row of peers and should stay one
row on wide screens, however many items there are — a group of form
controls, a row of stat tiles, a toolbar. If you have an unknown or large
number of items that should wrap onto new rows instead of squeezing into
one, use [`.grid`](/layout/grid) instead.

## Behavior

* Below the `md` breakpoint, `.row` is a single column (`grid-template-columns: 1fr`).
* At `md` and above, columns become `repeat(auto-fit, minmax(0%, 1fr))`.
  Every direct child becomes an equal-width column, however many there are —
  columns never wrap onto a second row.
* Gaps are controlled by `--cirth-grid-column-gap` and
  `--cirth-grid-row-gap` (both default to `--cirth-spacing`).
* Children get `min-width: 0` so long content (text, tables) doesn't force
  the column wider than its share of the row.
* A form control (`input`, `select`, `textarea`, `button`, …) that is a
  direct child of `.row` drops its own `margin-bottom` — the row-gap
  already provides that rhythm — and a trailing `<small>` after one of
  those controls gets the same full-width helper-text treatment it gets
  after a bare `input`/`select`/`textarea`/`fieldset`.

`.row` only exists in the default build with classes enabled; there's no
classless equivalent since it requires a class to opt in.
