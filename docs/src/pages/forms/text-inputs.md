---
layout: docs.njk
description: Single-line fields in Cirth. Text, email, password, URL, phone and number inputs share one look, one height and one set of states.
---

# Text inputs

Every single-line field (`text`, `email`, `password`, `url`, `tel`,
`number` and the rest) shares one look: a recessed surface, a hairline
edge, the accent on focus. Choose the `type` for the data, not for its
appearance.

{% demo "forms-text-inputs" %}

```html
<label>
  Email
  <input type="email" name="email" placeholder="ada@example.com" autocomplete="email">
</label>

<label>
  Seats
  <input type="number" name="seats" value="5" min="1" max="50">
</label>

<label>
  Postcode
  <input type="text" name="postcode" size="8" autocomplete="postal-code">
</label>
```

## Sizing

- A text input fills the width of its container and is at least 44px tall.
  Its height follows the same formula as a button's, so the two line up
  side by side.
- A `size` attribute opts out of the full width: the field keeps its
  native, content-based width, as the postcode above does.
- Fields placed in a [`.grid`](/layout/grid) share a row and wrap to one
  column when there is no room.

## States

- **Placeholder** text uses `--cirth-form-element-placeholder-color`.
- **Focus** lifts the field back to the page surface, turns its edge to the
  accent and adds a ring.
- **Read-only** fields get a dashed edge and the sectioning surface, so they
  read as text you can select but not change. A read-only `number` also
  hides its stepper buttons.
- **Disabled** fields fade to `--cirth-form-element-disabled-opacity` and
  ignore the pointer.
- **Valid and invalid** states, set by you or by the browser, are on
  [Validation and states](/forms/validation).

## Accessibility

- Give every field a visible `label`; the placeholder is an example, not a
  name.
- `type` and `autocomplete` decide which keyboard a phone shows and what the
  browser can fill in. `type="email"` with `autocomplete="email"` gets both
  right.
- Prefer `type="text"` with `inputmode="numeric"` for numbers that are not
  quantities, such as card numbers or codes: a `number` field adds a stepper
  and ignores leading zeros.

## Tokens

| Token | What it sets |
| --- | --- |
| `--cirth-form-element-background-color` | Surface at rest |
| `--cirth-form-element-active-background-color` | Surface while focused |
| `--cirth-form-element-border-color` | Edge at rest |
| `--cirth-form-element-active-border-color` | Edge while focused |
| `--cirth-form-element-color` | Text |
| `--cirth-form-element-placeholder-color` | Placeholder |
| `--cirth-form-element-focus-color` | Focus ring |
| `--cirth-form-element-spacing-vertical`, `-horizontal` | Padding |
| `--cirth-border-radius` | Corner radius |

## Related

- [Search](/forms/input-search) and [Date](/forms/input-date) fields, which
  add an icon to this look.
- [Group](/components/group), to attach a button to a field.
- [Forms](/forms/), for labels, help text and fieldsets.
