---
layout: docs.njk
description: Use Cirth text, email, password, URL, telephone and number inputs with the correct HTML types and autocomplete tokens.
---

# Text inputs

Choose an input `type` for the value the person will enter. Cirth gives
single-line fields a shared appearance, but the browser uses `type` to decide
which editing, keyboard and validation behavior to provide.

{% demo "forms-text-inputs" %}

```html
<label>
  Email
  <input type="email" name="email" autocomplete="email" required>
</label>

<label>
  Seats
  <input type="number" name="seats" value="5" min="1" max="50">
</label>

<label>
  Postcode
  <input type="text" name="postcode" size="8"
         autocomplete="postal-code">
</label>
```

The label names the field. `name` identifies the submitted value, and
`autocomplete` describes saved data that the browser may offer. `required`
adds a native constraint. It does not tell the application why the data is
needed or replace server-side validation.

## Choosing a type

| Type | Use it for | Native behavior |
| --- | --- | --- |
| `text` | General single-line text | Plain text editing |
| `email` | One or more email addresses | Email keyboard hints and address validation |
| `password` | A secret value | Obscured characters and password-manager support |
| `url` | A web address | URL keyboard hints and URL validation |
| `tel` | A telephone number | Telephone-oriented keyboard hints |
| `number` | A quantity that can be incremented | Numeric constraints and browser step controls |

Use `type="text"` with an appropriate `inputmode` for numeric-looking
identifiers such as card numbers, postcodes or one-time codes. They are not
quantities, may contain leading zeroes and should not have number steppers.

## Sizing

Text inputs fill their container and share a 44px minimum control height. A
`size` attribute opts a field out of the full-width rule and lets the browser
estimate a width from the expected number of characters. `size` does not limit
how many characters the field accepts; use `maxlength` for that constraint.

Use [Grid](/layout/grid) to place related fields side by side. The grid can
wrap them when space is limited.

## States

Placeholder text uses `--cirth-form-element-placeholder-color`. Text inputs
also participate in the shared focus, read-only, disabled and validation
states. [Validation and states](/forms/validation) explains what the browser
does in each state and how Cirth presents it.

## Native behavior and Cirth styling

The browser owns text editing, selection, password masking, number stepping,
autocomplete and constraint validation. Cirth resets the visual appearance and
adds the field surface, edge, radius, padding, focus ring and state colours.

Cirth keeps field text at least 16px. This avoids the automatic page zoom that
iOS browsers can apply to smaller editable text.

## Accessibility

- Keep a visible label. Placeholder text is not a persistent name.
- Use a standard `autocomplete` token when one describes the value. This helps
  browsers and assistive input tools fill the form correctly.
- Explain format requirements before submission. Link persistent instructions
  with `aria-describedby`; see [Forms](/forms/#label-control-help-text).
- Do not prevent pasting into password, email or confirmation fields.

## Tokens

| Token | What it sets |
| --- | --- |
| `--cirth-form-element-background-color` | Optional field fill |
| `--cirth-form-element-border-color` | Edge at rest |
| `--cirth-form-element-color` | Entered text |
| `--cirth-form-element-placeholder-color` | Placeholder text |
| `--cirth-form-element-focus-color` | Focus ring |
| `--cirth-form-element-spacing-vertical`, `--cirth-form-element-spacing-horizontal` | Padding |
| `--cirth-border-radius` | Corner radius |

## Common mistakes

- Choosing `number` only to display a numeric keyboard.
- Using `value` as a label. It is the initial submitted value.
- Assuming `size` is a character limit.
- Inventing an `autocomplete` value instead of using a standard token.

## Related

- [Forms](/forms/), for labels, names and help text.
- [Search](/forms/input-search) and [Date and time](/forms/input-date), which
  add specialised native behavior.
- [Group](/components/group), to attach a button to a field.
