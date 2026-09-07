---
layout: docs.njk
---


# Table

Tables are styled directly, with an optional `.striped` modifier for
alternating row backgrounds.

{% demo "table" %}

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

## Caption

`<caption>` is the native way to give a table an accessible name, and the one
WCAG guidance prefers over a heading placed outside the table — the name
travels with the table instead of depending on proximity.

```html
<table>
  <caption>Project team and roles</caption>
  …
</table>
```

Cirth aligns it to `start` like the cells beneath it, sets it in
`--cirth-muted-color`, and puts half a rhythm step between it and the header
row. It stays above the table; `caption-side: bottom` is yours to set if you
want it underneath.

## Striped

{% demo "table-striped" %}

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
* `<caption>` is aligned to `start` in the muted ink, with half a rhythm step
  below it.

## A wide table, scrollable and operable

A table wider than its column has to scroll, and a scroll container is only
operable if a keyboard can reach it. This is the pattern — four attributes,
and all four are load-bearing:

```html
<div class="overflow-auto"
     tabindex="0"
     role="region"
     aria-label="Project team and roles">
  <table>…</table>
</div>
```

* `.overflow-auto` makes it scroll, and paints the focus ring
  ([Overflow auto](/layout/overflow-auto)).
* `tabindex="0"` makes the container itself focusable, which is what lets a
  keyboard user scroll it at all (WCAG 2.1.1). This is what axe's
  `scrollable-region-focusable` rule reports when it is missing.
* `role="region"` plus `aria-label` give that new stop in the tab order a
  name, so it is announced as something rather than as an unlabelled group.

There is no component for this and there does not need to be one: it is a
`<div>` with a utility and three attributes. Cirth ships the scroll container
and its focus ring; naming the region is the page's job, because only the
page knows what the table is. Give each scrollable region on a page a
distinct name.

This site applies it to every table in its own documentation, from
`docs/eleventy.config.js`.
