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
  margin (`--cirth-spacing`) so stacked fields space themselves. An
  explicit `size` attribute (`<input size="6">`) opts a text input out
  of the full-width default instead, sizing it to its native,
  content-based width.
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
* **`:user-invalid`** gets the invalid treatment automatically, with no
  `aria-invalid` attribute and no JS, once a field has been interacted with
  and the browser has checked it against its native constraints (`required`,
  `type="email"`, `pattern`, …). Native `:user-valid` stays neutral because
  satisfying HTML constraints does not necessarily mean that the submitted
  data is correct. Use `aria-invalid="false"` when an explicit positive state
  is useful. Range inputs are excluded from automatic validity styling, and a
  native-invalid `select` stays neutral while focused so merely opening it
  does not show an error. An explicit `aria-invalid` always wins.
* **`:focus`** adds a box shadow ring in `--cirth-form-element-focus-color` (or
  the valid/invalid focus variant when an explicit `aria-invalid` or matching
  `:user-invalid` state applies).
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
