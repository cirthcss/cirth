---
layout: docs.njk
description: How every Cirth build treats print, what it changes on paper, and how to customize the print color roles.
---

# Print

Every Cirth build carries its print rules, at the end of the stylesheet and
under `@media print`. The one `<link>` that styles the screen also prepares
the page for paper, and nothing in it changes what the screen shows:

```html
<link rel="stylesheet" href="/cirth.min.css">
```

No print-only HTML is required.

Up to v0.16, the print rules were a separate stylesheet. Those files still
ship through the 0.17 line, deprecated: loading one after its build changes
nothing printed, and they are removed in v0.18.0.
[Package and builds](/package#print-stylesheets) lists them.

## Why print needs its own rules

Browsers can omit author backgrounds while retaining author text colors. A
page viewed in a dark theme could therefore produce pale text on white paper.
Screen-only behaviors such as horizontal scrolling also have no useful paper
equivalent.

Cirth's print rules resolve those framework-level issues. They do not decide
which application regions are navigation, advertising, or other screen-only
content.

## What Cirth changes for print

Under `@media print`, Cirth:

- sets the page to transparent paper with dark ink and a light native color
  scheme;
- removes surface fills and box shadows from cards, code blocks, menus,
  fields, and overlays;
- prints links as underlined ink and appends the destination of absolute web
  links outside navigation and button treatments;
- turns filled buttons into outlined labels so their text remains visible
  when backgrounds are omitted;
- asks the browser to preserve color on `<mark>`, `<meter>`, `<progress>`,
  checkboxes, and radios because their fill can carry meaning;
- repeats `<thead>` on multi-page tables, places `<tfoot>` at the end, and
  avoids splitting a row;
- lets preformatted blocks wrap and lets `.overflow-auto` content escape its
  screen scroll box instead of being clipped;
- places an open `<dialog>` in document flow rather than fixing it over the
  first printed page;
- avoids leaving a heading alone at the bottom of a page and tries to keep
  figures, images, and several lines of prose together.

These are CSS requests to the browser's print engine. Exact pagination still
depends on the browser, paper size, margins, font metrics, and the user's print
settings.

## Printed link destinations

Cirth appends an absolute `http` or `https` destination because paper cannot
activate a link. Relative and fragment links are not printed after their
labels. Navigation links and links styled as buttons are also excluded.

Remove the generated destination when a document does not need it:

```css
@media print {
  a[href^="http"]::after {
    content: none;
  }
}
```

## Customization

Three tokens define the print palette:

| Variable | Default role |
| --- | --- |
| `--cirth-print-color` | Body text, headings, links, and control labels |
| `--cirth-print-muted-color` | Captions, attributions, placeholders, and printed URLs |
| `--cirth-print-border-color` | Table rules, field and card borders, and `<hr>` |

Override them in a stylesheet loaded after Cirth:

```css
:root {
  --cirth-print-color: #1a1a1a;
  --cirth-print-border-color: #767676;
}
```

Unlayered application rules override Cirth's `cirth` cascade layer. Put
project-specific print changes inside `@media print` so they do not affect the
screen.

## Application responsibilities

Cirth intentionally does not add an `@page` rule. Page size, orientation, and
margins depend on the document being printed.

It also does not hide any application content: only the application knows
which regions are chrome. Mark them with a class.

## Leaving things off the paper

`.no-print` hides an element when the page is printed. `.print-only` does
the opposite: the element appears only on paper.

```html
<header class="no-print"><!-- application navigation --></header>
<main>
  <p class="print-only">Printed from example.com/orders/1042</p>
  <!-- the record or the table to print -->
</main>
```

Both are in the class builds, beside the rest of the print rules. They nest as you would expect: a
`.print-only` element inside a `.no-print` one is never shown, and
`hidden` keeps a `.print-only` element hidden on paper too.

A `.print-only` element is `display: none` on screen, so screen readers do
not reach it either. Use it to repeat what the screen already says (a
heading, a URL spelled out), never for information that exists nowhere
else.

The classes sit in Cirth's cascade layer: a `display` your own CSS sets on
the same element wins. Print also shows only what the page holds when it is
printed. Rows a virtualised table has not rendered, or a panel that loads on
demand, are not in the document, and no class can bring them back.

Review the result in print preview and with the backgrounds setting both on
and off. Check page breaks, link destinations, tables, form state, and any
content hidden by the application.

## Common mistakes

- Do not assume screen scrolling will expose clipped content on paper.
- Do not hide navigation or sidebars globally when they should disappear only
  from printed output: give them `.no-print`.
- Do not rely on color as the only printed indication of state.

## Related pages

- [Installation](/installation/)
- [Package and builds](/package#print-stylesheets)
- [Table](/content/table)
- [Code](/content/code)
- [Customization](/customization#cascade-layers)
