---
layout: docs.njk
description: Load Cirth's optional print stylesheet, understand its paper-specific behavior, and customize the print color roles.
---

# Print

Cirth's print rules are a separate stylesheet. Load the sheet that matches the
main build after that build:

```html
<link rel="stylesheet" href="/cirth.min.css">
<link rel="stylesheet" href="/cirth.print.min.css" media="print">
```

The browser applies a stylesheet with `media="print"` to printed output and
print preview, not to the screen presentation. No print-only HTML is required.

With a package manager, import the matching default-build entry:

```css
@import "@cirthcss/cirth";
@import "@cirthcss/cirth/print" print;
```

Classless and scoped builds have corresponding print entries. Keep the build
and print variants paired. [Package and builds](/package#print-stylesheets)
lists every print entry point and compiled file.

## Why a print stylesheet is needed

Browsers can omit author backgrounds while retaining author text colors. A
page viewed in a dark theme could therefore produce pale text on white paper.
Screen-only behaviors such as horizontal scrolling also have no useful paper
equivalent.

Cirth's print sheet resolves those framework-level issues. It does not decide
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

It also does not hide any application content. Hide screen-only interface
chrome explicitly:

```css
@media print {
  .app-sidebar,
  .cookie-banner {
    display: none;
  }
}
```

Review the result in print preview and with the backgrounds setting both on
and off. Check page breaks, link destinations, tables, form state, and any
content hidden by the application.

## Common mistakes

- Do not load a print sheet for a different build variant.
- Do not omit `media="print"` from the print `<link>`.
- Do not assume screen scrolling will expose clipped content on paper.
- Do not hide navigation or sidebars globally when they should disappear only
  from printed output.
- Do not rely on color as the only printed indication of state.

## Related pages

- [Installation](/installation/)
- [Package and builds](/package#print-stylesheets)
- [Table](/content/table)
- [Code](/content/code)
- [Customization](/customization#cascade-layers)
