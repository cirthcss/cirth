---
layout: docs.njk
description: Associate terms, names, or keys with one or more descriptions using the native description-list elements.
---


# Description list

`<dl>` is HTML's element for a term and its description: order metadata,
product specifications, a detail panel, a glossary. It arrives finished: no
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

## Native structure

`<dl>` contains a series of terms and descriptions. `<dt>` is the term, name,
or key. One or more following `<dd>` elements provide its description or
value. HTML also allows several terms to share one description.

The relationship comes from the element order, so keep every description next
to the term or terms it belongs to. A description list is appropriate for
key-value information and glossaries. It is not a substitute for every list
whose items happen to contain two pieces of text.

## Behavior

Cirth leaves the browser's description-list semantics intact and changes only
the presentation:

* `<dt>` is set at the label weight (`--cirth-font-weight-medium`), so the
  term reads as the term rather than as another line of the description.
* `<dd>` has the browser's 40px indent removed. That indent is a user-agent
  default, not a typographic decision.
* Consecutive pairs are a line apart (`--cirth-flow-line`), set on a `<dt>`
  that follows a `<dd>`, so the space falls between pairs and never inside
  one. Several `<dd>`s under one `<dt>`, or several `<dt>`s sharing one
  `<dd>`, stay together.
* The list itself is spaced from its neighbours like any other flow
  element: by its relation to them.

## Laying pairs out in columns

HTML allows a `<div>` around each term/description group, which gives the
group a box that can participate in a layout. Combine it with
[`.row`](/layout/row) and the pairs share a line, wrapping when it is full.
Use [`.grid`](/layout/grid) instead when many pairs should line up in
columns.

{% demo "description-list-row" %}

```html
<dl class="row">
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
there would land on the row's items and pull every pair after the first out
of line with the first, so it would have to be undone before the wrapper could
do the one job it exists for. The elements inside it are styled either way;
the box is yours.

For the same reason `<dl>` ships no grid of its own. A metrics panel is a
composition (`.grid` or [`.row`](/layout/row) plus a `<dl>`), not a
component, and the hairlines and column counts a particular panel wants are
that page's design, not the framework's.

## Common mistakes

- Do not put a heading in `<dt>` merely to make it bold. The element must name
  the description that follows.
- Do not separate a term from its descriptions with unrelated content.
- Do not use a two-column table when the information is a simple list of
  names and values. Use a table only when row and column relationships both
  matter.
- Do not add margins to every pair wrapper before using `.row` or `.grid`;
  the gap already owns the space between pairs.

## Related pages

- [Typography](/content/typography)
- [Grid](/layout/grid)
- [Row](/layout/row)
- [Table](/content/table)
