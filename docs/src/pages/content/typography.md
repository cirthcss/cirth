---
layout: docs.njk
---


# Typography

Headings, paragraphs, lists, and inline text elements are styled directly;
no typography classes exist in Cirth.

{% demo "typography" %}

```html
<hgroup>
  <h1>Heading level 1</h1>
  <p>A short subheading grouped with hgroup.</p>
</hgroup>
<p>
  Body text with <strong>bold</strong>, <em>italic</em>, <mark>highlighted</mark>,
  <ins>inserted</ins>, <del>deleted</del>, and an <abbr title="…">abbr</abbr>.
</p>
<blockquote>
  "…"
  <footer><cite>Source</cite></footer>
</blockquote>
```

## Headings

Each heading level (`h1`–`h6`) has its own font size, line height and color
token (`--cirth-h1-color` through `--cirth-h6-color`). A heading is closer
to what it introduces than to what precedes it: a section step before an
`h1` or an `h2`, a group step before the four below them, and a line under
any of them. A heading at the very top of a container gets no space above
it, because there is no block for it to relate to.

## `hgroup`

Groups a heading with a subheading. The last child (when there's more than
one) is demoted visually: muted color, regular weight, `--cirth-font-size-md`.

## Lists

List items are a line apart (`--cirth-flow-line`); a nested list sits a
line under its item's text and adds nothing below, so the next parent item
is as close as a sibling. `ul` uses square bullets.

## Blockquote

A left border (right border in `[dir="rtl"]`) in
`--cirth-blockquote-border-color`, with an optional `footer` styled in
`--cirth-blockquote-footer-color` for attribution.

## Inline elements

* `mark`: background/color from `--cirth-mark-background-color` /
  `--cirth-mark-color`.
* `ins` / `del`: colored via `--cirth-ins-color` / `--cirth-del-color`
  (the same tokens used for valid/invalid form feedback).
* `abbr[title]`: dotted underline, `cursor: help`.
* `::selection`: background from `--cirth-text-selection-color`.
