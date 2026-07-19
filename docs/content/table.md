# Table

Tables are styled directly, with an optional `.striped` modifier for
alternating row backgrounds.

<Demo src="table" />

```html
<table>
  <thead>
    <tr><th scope="col">#</th><th scope="col">Name</th><th scope="col">Role</th></tr>
  </thead>
  <tbody>
    <tr><th scope="row">1</th><td>Alex Doe</td><td>Engineer</td></tr>
  </tbody>
</table>
```

## Striped

<Demo src="table-striped" />

```html
<table class="striped">…</table>
```

`.striped` is only available in the default build with classes enabled.

## Behavior

* `border-collapse: collapse`, full width, left aligned cells
  (`text-align: start`, so it flips correctly in `[dir="rtl"]`).
* Cell padding is `calc(var(--cirth-spacing) / 2) var(--cirth-spacing)`, with
  a bottom border in `--cirth-table-border-color`.
* `tfoot` cells get a top border instead of a bottom one.
* `thead`/`tfoot` cells are bolder (`--cirth-font-weight-semibold`) with a
  thicker border.
* Wrap a wide table in [`.overflow-auto`](/layout/overflow-auto) to scroll
  instead of overflowing the page.
