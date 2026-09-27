---
layout: docs.njk
description: Valid, invalid, disabled, read-only and placeholder states for every Cirth form control, set by you or by the browser's own validation.
---

# Validation and states

Every control has the same set of states, and every one of them comes from
HTML: an attribute you set, or a pseudo-class the browser sets. There are no
state classes.

{% demo "forms-validation" %}

```html
<label>
  Valid email
  <input type="email" value="ada@example.com" aria-invalid="false">
  <small>Looks good.</small>
</label>

<label>
  Invalid email
  <input type="email" value="not-an-email" aria-invalid="true">
  <small>Enter a valid email address.</small>
</label>

<label>
  Disabled field
  <input type="text" value="Read only" disabled>
</label>

<label>
  Readonly quantity
  <input type="number" value="3" readonly>
</label>
```

## Valid and invalid, set by you

- `aria-invalid="true"` marks a field invalid: the edge turns to
  `--cirth-form-element-invalid-border-color`, an alert icon appears, and the
  help text after it turns to `--cirth-del-color`.
- `aria-invalid="false"` marks it valid: a success edge, a check icon, and
  help text in `--cirth-ins-color`.

Use these when your application decides validity, after checking a value on
the server for example. An explicit `aria-invalid` always wins over the
browser's own verdict.

## Invalid, found by the browser

Fields with native constraints (`required`, `type="email"`, `pattern`,
`min`, `maxlength` and the rest) get the invalid treatment on their own,
through `:user-invalid`. It waits until the reader has interacted with the
field, so nothing is red on arrival:

{% demo "forms-validation-native" %}

A field that satisfies its constraints stays neutral: passing the browser's
checks does not mean the data is right, so Cirth does not paint it green.
Range inputs are left out of automatic validity styling, and a `select`
stays neutral while it has focus.

## Disabled and read-only

- `disabled` on a control, or on a `fieldset` around it, gives it the
  disabled state every control shares: a faint wash of the ink
  (`--cirth-disabled-surface`), the separator for an edge, and its text at
  half the ink (`--cirth-disabled-color`). Nothing fades by opacity, so a
  checked box does not turn its accent into a paler colour. It also ignores
  the pointer. `aria-disabled="true"` on a `label` gives the label the same
  ink.
- `readonly` keeps the value selectable and submitted, with a dashed edge so
  it does not look editable; its fill is the surface's, like any field's. A
  read-only `number`
  hides its stepper buttons.

## Focus

A focused field rises to the page surface, takes the accent on its edge and
gains a ring in `--cirth-form-element-focus-color`. In the valid or invalid
state the edge and ring take that state's colour instead.

## Accessibility

- Say what is wrong in words, in the help text, and link it to the field
  with `aria-describedby`. The icon and colour are cues, not the message.
- Keep `aria-invalid` in step with the message: set it when you show an
  error, and remove it when the error is fixed.
- Prefer `readonly` over `disabled` for a value the reader should still be
  able to read, copy and submit.

## Tokens

| Token | What it sets |
| --- | --- |
| `--cirth-form-element-invalid-border-color` | Invalid edge |
| `--cirth-form-element-invalid-focus-color` | Invalid focus ring: the edge's colour by default |
| `--cirth-form-element-valid-border-color` | Valid edge |
| `--cirth-form-element-valid-focus-color` | Valid focus ring: the edge's colour by default |
| `--cirth-del-color`, `--cirth-ins-color` | Help text in each state |
| `--cirth-icon-invalid`, `--cirth-icon-valid` | The state icons |
| `--cirth-disabled-surface`, `--cirth-disabled-color` | The disabled wash and ink |

The border tokens derive from the status inputs `--cirth-error` and
`--cirth-success`; see [Colors](/colors#status-colours).

## Related

- [Forms](/forms/), for help text and fieldsets.
- [Text inputs](/forms/text-inputs), [Select](/forms/select) and
  [Textarea](/forms/textarea).
