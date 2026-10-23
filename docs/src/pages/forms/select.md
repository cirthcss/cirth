---
layout: docs.njk
description: Use native select controls in Cirth for one or several choices, including prompts and option groups.
---

# Select

Use `select` when a form value must come from a known list. The browser opens
the list and provides its keyboard, touch and platform-specific picker
behavior. Cirth makes the closed control match adjacent fields.

{% demo "forms-select" %}

```html
<label>
  Country
  <select name="country" autocomplete="country" required>
    <option value="" selected disabled>Choose a country…</option>
    <option value="it">Italy</option>
    <option value="fr">France</option>
    <option value="de">Germany</option>
  </select>
</label>

<label>
  Time zone
  <select name="timezone">
    <optgroup label="Europe">
      <option value="Europe/Rome">Rome</option>
      <option value="Europe/London" selected>London</option>
    </optgroup>
  </select>
</label>

<label>
  Notify me about
  <select name="topics" multiple size="4">
    <option value="releases" selected>Releases</option>
    <option value="security">Security advisories</option>
  </select>
</label>
```

Each `option` has a visible label and a submitted `value`. If `value` is
omitted, the option text is submitted. `optgroup` gives a labelled visual group
inside a long list; it is not itself selectable.

## A placeholder option

HTML has no dedicated placeholder attribute for `select`. A common prompt is
an empty first option that is initially `selected` and cannot be chosen again
because it is `disabled`. When the `select` is `required`, the empty value does
not satisfy the constraint.

Cirth colours `select:invalid` text with the placeholder token. Native invalid
styling waits for user interaction, and an open required select remains neutral
while it has focus.

## Multiple selection and size

`multiple` lets the person select more than one option. `size` requests how
many rows remain visible. Either attribute changes the control from a compact
menu into a list, so Cirth removes the chevron. Selected options use
`--cirth-form-element-selected-background-color`.

Multiple selection gestures differ by platform. For a small set of independent
choices, checkboxes are usually easier to discover and operate.

## States

A select shares the focus, disabled and validation states described in
[Validation and states](/forms/validation). It fills its container, may grow to
fit long option text and never drops below the shared 44px control height.

## Native behavior and Cirth styling

The browser owns the popup or picker, option navigation and value selection.
Cirth styles the closed field, adds its chevron to a single-row select and
styles selected rows in a list. The open platform menu is not a Cirth surface
and may look different across operating systems.

## Accessibility

- Label every select.
- Use concise option labels. Put categories in labelled `optgroup` elements
  when they help scanning.
- Use radios when two or three choices should remain visible for comparison.
- Explain a multiple select if the required selection gesture may not be
  obvious, or choose checkboxes instead.

## Tokens

| Token | What it sets |
| --- | --- |
| `--cirth-icon-chevron` | Chevron on a single-row select |
| `--cirth-form-element-selected-background-color` | Selected option in a visible list |
| `--cirth-form-element-placeholder-color` | Empty prompt text |

The surface, edge and focus tokens are owned by
[Text inputs](/forms/text-inputs#tokens).

## Common mistakes

- Using a dropdown component in place of a form select. A disclosure menu does
  not submit a selected value or provide select keyboard behavior.
- Omitting explicit option values when display labels may change.
- Marking the prompt `selected` without `required`, then assuming the browser
  will reject it.

## Related

- [Checkbox, radio and switch](/forms/checkbox-radio-switch)
- [Dropdown](/components/dropdown), for links and actions rather than a value.
- [Validation and states](/forms/validation)
