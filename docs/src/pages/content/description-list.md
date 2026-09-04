---
layout: docs.njk
---


# Description list

`<dl>` is HTML's element for a term and its description: order metadata,
product specifications, a detail panel, a glossary. It arrives finished — no
class, no wrapper required.

{% demo "description-list" %}

```html
<dl>
  <dt>Order</dt>
  <dd>#1042</dd>
  <dt>Placed</dt>
  <dd>3 March 2026</dd>
</dl>
```

## Behavior

* `<dt>` is set in `--cirth-font-weight-semibold`, so the term reads as the
  term rather than as another line of the description.
* `<dd>` has the browser's 40px indent removed. That indent is a user-agent
  default, not a typographic decision.
* Consecutive pairs get half a rhythm step between them
  (`calc(var(--cirth-typography-spacing-vertical) * 0.5)`), applied to a
  `<dt>` that follows a `<dd>` — so the space falls between pairs and never
  inside one. Several `<dd>`s under one `<dt>`, or several `<dt>`s sharing one
  `<dd>`, stay together.
* The list itself keeps the bottom margin every flow element gets.

## Laying pairs out in columns

HTML allows a `<div>` around each term/description pair, for exactly one
reason: to give you a box to lay out. Combine it with
[`.grid`](/layout/grid) and the pairs become cells.

{% demo "description-list-grid" %}

```html
<dl class="grid">
  <div>
    <dt>Order</dt>
    <dd>#1042</dd>
  </div>
  <div>
    <dt>Placed</dt>
    <dd>3 March 2026</dd>
  </div>
</dl>
```

Cirth deliberately puts **no** margin on that wrapper. A framework margin
there would land on grid items and pull every cell after the first out of
line with the first, so it would have to be undone before the wrapper could
do the one job it exists for. The elements inside it are styled either way;
the box is yours.

For the same reason `<dl>` ships no grid of its own. A metrics panel is a
composition — `.grid` or [`.row`](/layout/row) plus a `<dl>` — not a
component, and the hairlines and column counts a particular panel wants are
that page's design, not the framework's.
