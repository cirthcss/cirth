---
layout: docs.njk
---


# Forms

`input`, `select`, `textarea`, `label`, and `fieldset`/`legend` are styled
directly. This page covers the shared basics; see the sibling pages for
behavior specific to each input type.

{% demo "forms-basics" %}

```html
<form>
  <fieldset>
    <label>
      Full name
      <input type="text" name="name" placeholder="Ada Lovelace" autocomplete="name">
    </label>
    <label>
      Role
      <select name="role" required>
        <option value="" selected disabled>Select…</option>
        <option>Engineer</option>
      </select>
    </label>
    <label>
      Bio
      <textarea name="bio"></textarea>
      <small>Optional, shown on your public profile.</small>
    </label>
  </fieldset>
  <button type="submit">Submit</button>
</form>
```

## Layout

* `label` is a block, with a bottom margin. Put the control right after
  its text, inside the same `label`, and it gets a small top margin
  automatically.
* Text inputs, `select`, and `textarea` are full width and get a bottom
  margin (`--cirth-spacing`) so stacked fields space themselves.
* A `small` immediately after a form control becomes helper/hint text:
  block, muted, with a small negative top margin to sit tight under the
  field.
* `fieldset` is full width with no border/padding of its own; `legend`
  matches label styling.

## States

{% demo "forms-validation" %}

```html
<input type="email" value="ada@example.com" aria-invalid="false">
<input type="email" value="not-an-email" aria-invalid="true">
<input type="text" value="Read only" disabled>
```

* **`aria-invalid="false"`** marks the valid state: border in
  `--cirth-form-element-valid-border-color`, a check icon, and the adjacent
  `small` colored with `--cirth-ins-color`.
* **`aria-invalid="true"`** marks the invalid state: border in
  `--cirth-form-element-invalid-border-color`, an alert icon, and the
  adjacent `small` colored with `--cirth-del-color`.
* **`:user-valid`/`:user-invalid`** get the same treatment automatically,
  with no `aria-invalid` attribute and no JS: once a field has been
  interacted with and the browser has checked it against its native
  constraints (`required`, `type="email"`, `pattern`, …), it picks up the
  matching border, icon, and helper-text color on its own. An explicit
  `aria-invalid` always wins if both are present. Falls back silently on
  browsers that don't support the pseudo-classes yet (Chrome/Edge < 119,
  Safari < 16.5) — those fields just show no validity styling until you set
  `aria-invalid` yourself.
* **`:focus`** adds a box shadow ring in `--cirth-form-element-focus-color` (or
  the valid/invalid focus variant when `aria-invalid` or a matching
  `:user-valid`/`:user-invalid` state applies).
* **`[disabled]`** (or an ancestor `fieldset[disabled]`) applies opacity
  `--cirth-form-element-disabled-opacity`, pointer events off.
* **`::placeholder`** is colored with `--cirth-form-element-placeholder-color`.

## Key tokens

`--cirth-form-element-background-color`, `-border-color`, `-color`,
`-placeholder-color`, `-focus-color`, `-active-border-color`,
`-valid-border-color`, `-invalid-border-color`, `-disabled-opacity`. See
[Customization](/customization) for how these relate to the semantic color
groups.

## Other input types

* [Checkbox, radio, switch](/forms/checkbox-radio-switch)
* [Input color](/forms/input-color)
* [Input date](/forms/input-date)
* [Input file](/forms/input-file)
* [Input range](/forms/input-range)
* [Input search](/forms/input-search)
