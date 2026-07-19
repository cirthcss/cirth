# Typography

Headings, paragraphs, lists, and inline text elements are styled directly;
no typography classes exist in Cirth.

<Demo src="typography" />

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

Each heading level (`h1`–`h6`) has its own font size, line height, color
token (`--cirth-h1-color` through `--cirth-h6-color`), and top spacing
(`--cirth-typography-spacing-top`) applied only when the heading follows a
block element, so a heading at the very top of a container doesn't get
extra space above it.

## `hgroup`

Groups a heading with a subheading. The last child (when there's more than
one) is demoted visually: muted color, regular weight, `--cirth-font-size-md`.

## Lists

`ul`/`ol` items get a small bottom margin; nested lists lose their own
top level margin and get a quarter spacing top margin instead, to avoid
duplicated spacing. `ul` uses square bullets.

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
