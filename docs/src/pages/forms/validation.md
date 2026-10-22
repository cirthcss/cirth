---
layout: docs.njk
description: Present native and application validation, invalid messages, disabled controls and read-only values consistently in Cirth.
---

# Validation and states

HTML can check simple constraints such as a missing required value or a malformed
email address. Your application must still validate every submitted value and
explain errors that HTML cannot decide.

{% demo "forms-validation" %}

```html
<label>
  Email
  <input id="email" name="email" type="email" value="not-an-email"
         aria-invalid="true" aria-describedby="email-error">
  <small id="email-error">Enter a valid email address.</small>
</label>

<label>
  Reference
  <input name="reference" type="text" value="INV-1042" readonly>
</label>

<label>
  Archived account
  <input name="archived" type="text" value="Unavailable" disabled>
</label>
```

`aria-invalid="true"` tells assistive technology that the value is invalid.
`aria-describedby` points to the message that explains why. Neither attribute
performs validation or prevents submission; application code must keep the
state and message accurate.

## Valid and invalid, set by you

- `aria-invalid="true"` uses the invalid edge, focus ring and icon. An
  immediately following `small` uses the error text colour.
- `aria-invalid="false"` uses the valid edge, focus ring and icon. Use it only
  when explicitly confirming success helps the task.
- An explicit `aria-invalid` value takes precedence over native validity
  styling.

Set `aria-invalid` when the error is shown, not before the person has had an
opportunity to enter a value. Remove it when the error is resolved. If a
server rejects a submission, return focus to a useful summary or the first
invalid field according to the needs of the form.

## Invalid, found by the browser

Native constraints include `required`, input types such as `email`, and
attributes such as `pattern`, `min`, `max` and `maxlength`.

{% demo "forms-validation-native" %}

Cirth styles `:user-invalid`, which browsers apply after the person has
interacted with a constrained field. This avoids showing an untouched form as
a page of errors. A value that passes native constraints stays visually
neutral because syntactic validity does not prove that application data is
correct.

Range inputs are excluded from automatic validity styling because browsers
normalise their value into the permitted range. A required select also remains
neutral while it has focus.

## Disabled and read-only

`disabled` prevents interaction and excludes a control from ordinary form
submission. A disabled `fieldset` applies that behavior to its descendant form
controls. Cirth paints disabled controls with the shared disabled surface,
edge and text colours.

`readonly` applies to supported text controls. It keeps the value focusable,
selectable and submittable, but prevents editing. Cirth uses a dashed edge to
distinguish it from both editable and disabled fields. A read-only number field
also hides its step buttons.

## Focus

An editable focused field keeps its normal surface and edge, then draws an
outset ring in `--cirth-form-element-focus-color`. A valid or invalid field
rebinds that ring to the corresponding state colour.

## Browser behavior and application responsibility

The browser can stop a native form submission that violates its HTML
constraints and may show a platform message. It cannot check whether an email
exists, a username is available or a value is authorised. Always repeat
validation on the server or other trusted application boundary.

Cirth only presents states already present in HTML or ARIA. It does not choose
when to validate, create messages or announce asynchronous errors.

## Accessibility

- State the error in words. Colour and the Cirth icon are supporting cues.
- Connect the message with `aria-describedby`, and keep `aria-invalid` in step
  with it.
- Do not use `aria-invalid="false"` as a default on every untouched control.
- Prefer `readonly` when a value should remain readable, copyable and
  submittable. Use `disabled` when the control is unavailable.

## Tokens

| Token | What it sets |
| --- | --- |
| `--cirth-form-element-invalid-border-color` | Invalid edge |
| `--cirth-form-element-invalid-focus-color` | Invalid focus ring |
| `--cirth-form-element-valid-border-color` | Valid edge |
| `--cirth-form-element-valid-focus-color` | Valid focus ring |
| `--cirth-del-color`, `--cirth-ins-color` | Adjacent help text in each explicit state |
| `--cirth-icon-invalid`, `--cirth-icon-valid` | State icons |
| `--cirth-disabled-surface`, `--cirth-disabled-color` | Disabled surface and text |

The state colours derive from `--cirth-error` and `--cirth-success`; see
[Colors](/colors#states).

## Common mistakes

- Using `aria-invalid` without an understandable error message.
- Assuming ARIA changes validation behavior.
- Disabling a field whose value must be submitted.
- Relying only on client-side checks for trusted data.

## Related

- [Forms](/forms/)
- [Text inputs](/forms/text-inputs), [Select](/forms/select) and
  [Textarea](/forms/textarea)
