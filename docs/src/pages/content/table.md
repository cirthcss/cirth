---
layout: docs.njk
description: Mark up accessible data tables, use captions and header scopes, and apply Cirth's striped and form-control variants.
---

# Table

Use a table for data whose meaning depends on rows and columns. Do not use it
to arrange general page content. Cirth styles the native elements directly and
provides optional `.striped` and `.controls` variants in class-enabled builds.

{% demo "table" %}

```html
<table>
  <caption>Deployments this week</caption>
  <thead>
    <tr>
      <th scope="col">Service</th>
      <th scope="col">Region</th>
      <th scope="col">Duration</th>
      <th scope="col">Result</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">checkout-api</th>
      <td>eu-west</td>
      <td>3 min 12 s</td>
      <td>Live</td>
    </tr>
  </tbody>
</table>
```

## Anatomy

- `<table>` contains the complete data relationship.
- `<caption>` gives the table a name or concise purpose.
- `<thead>` groups the column headings; `<tbody>` groups the data rows; an
  optional `<tfoot>` groups totals or closing data.
- `<tr>` creates a row.
- `<th>` creates a header cell. `scope="col"` associates it with its column;
  `scope="row"` associates it with its row.
- `<td>` creates an ordinary data cell.

Browsers create the table layout and expose these relationships to assistive
technology. Cirth does not infer missing headings or cell associations.

## Caption

`<caption>` is the native name attached to a table. It remains associated with
the table if the markup moves and gives assistive technology context before it
presents the cells.

Cirth aligns the caption with the start edge, uses the muted meta-text role,
and adds space before the header row. Set `caption-side: bottom` in application
CSS if a design requires it below the data.

## Behavior

Cirth makes tables full width and collapses the gaps between cell borders.
Headers and data cells align to the logical start edge, which follows the
document direction. Cells receive consistent padding and row separators.
Numeric glyphs use tabular figures so values align more predictably.

Column headings and footer cells use the muted meta role. Row headings keep
the label weight. Footer cells draw their separator at the top.

The main table tokens are `--cirth-table-border-color` and
`--cirth-table-row-stripped-background-color`.

## Striped

{% demo "table-striped" %}

```html
<table class="striped">
  <caption>Monthly usage</caption>
  <thead>...</thead>
  <tbody>...</tbody>
</table>
```

`.striped` gives odd body rows an alternate background. It does not replace
row or column headers. The variant is available only in class-enabled builds.

## A wide table, scrollable and operable

Wrap a table that can exceed its container in `.overflow-auto`. The wrapper
also needs keyboard focus and an accessible name:

```html
<div class="overflow-auto"
     tabindex="0"
     role="region"
     aria-label="Deployment history">
  <table>...</table>
</div>
```

The [Overflow auto](/layout/overflow-auto) page owns the complete pattern,
including when to use `aria-label` or `aria-labelledby` and why each attribute
is needed.

## Form controls in cells

Use `table.controls` when cells contain editable fields or buttons directly.
Cirth reduces the cell padding around those controls while keeping their
borders, focus indicators, states, and target size.

{% demo "table-controls" %}

```html
<table class="controls">
  <caption>Inventory</caption>
  <thead>
    <tr>
      <th scope="col" id="stock-item">Item</th>
      <th scope="col" id="stock-qty">Quantity</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row" id="stock-apples">Apples</th>
      <td>
        <input type="number"
               name="apple_quantity"
               value="12"
               aria-labelledby="stock-qty stock-apples">
      </td>
    </tr>
  </tbody>
</table>
```

Table headers describe data cells, but they do not automatically provide an
accessible name for a form control. `aria-labelledby` accepts a space-separated
list of element IDs. In the example, assistive technology combines the column
header and row header as “Quantity Apples”. Keep every referenced ID unique.

For a repeated button whose visible text already names the action, use
`aria-describedby` to add row context instead. That attribute adds a
description; it does not replace the button's visible accessible name.

`.controls` is a visual variant, not an interactive data-grid pattern. It does
not add arrow-key navigation, cell selection, editing state, validation, or
data submission. Those behaviors remain the application's responsibility.

## Common mistakes

- Do not omit `<caption>` when the table's purpose is not already clear to all
  readers.
- Do not use bold `<td>` cells as visual headers. Use `<th>` and an appropriate
  `scope`.
- Do not leave blank header cells merely to obtain spacing.
- Do not make a wide table smaller until its data becomes unreadable. Use a
  keyboard-operable scroll wrapper when the columns need their width.
- Do not assume column headers label inputs placed below them.

## Related pages

- [Overflow auto](/layout/overflow-auto)
- [Forms](/forms/)
- [Figure](/content/figure)
- [Print](/utilities/print)
