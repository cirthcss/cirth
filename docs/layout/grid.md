# Grid

`.grid` is a minimal automatic layout grid: equal width columns that stack on
narrow viewports, with no classes per column.

<Demo src="grid" />

```html
<div class="grid">
  <article>Column one</article>
  <article>Column two</article>
  <article>Column three</article>
</div>
```

## Behavior

* Below the `md` breakpoint, `.grid` is a single column (`grid-template-columns: 1fr`).
* At `md` and above, columns become `repeat(auto-fit, minmax(0%, 1fr))`.
  Every direct child becomes an equal width column, however many there are.
* Gaps are controlled by `--cirth-grid-column-gap` and
  `--cirth-grid-row-gap` (both default to `--cirth-spacing`).
* Children get `min-width: 0` so long content (text, tables) doesn't force
  the column wider than its share of the row.

`.grid` only exists in the default build with classes enabled; there's no
classless equivalent since it requires a class to opt in.
