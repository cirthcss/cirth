---
layout: docs.njk
description: Use native checkboxes, radio groups, switches and segmented choices with Cirth.
---

# Checkbox, radio and switch

Use a checkbox for an independent yes-or-no choice and radios for one choice
from a set. Add `role="switch"` to a checkbox when it represents a setting
that takes effect as soon as it is toggled.

{% demo "checkbox-radio-switch" %}

```html
<label>
  <input type="checkbox" name="terms" value="accepted" required>
  I accept the terms
</label>

<fieldset>
  <legend>Delivery</legend>
  <label>
    <input type="radio" name="delivery" value="standard" checked>
    Standard
  </label>
  <label>
    <input type="radio" name="delivery" value="express">
    Express
  </label>
</fieldset>

<label>
  <input type="checkbox" name="notifications" role="switch" checked>
  Email notifications
</label>
```

The shared radio `name` makes the two delivery controls one native group, so
selecting either one clears the other. Each `value` is the text submitted for
that choice. An unchecked checkbox is normally omitted from form data, so the
application must decide how to interpret its absence.

## The mark

Cirth redraws checkboxes and radios while keeping their native input behavior.
The 24px input box is the pointer target. A smaller visible mark sits inside
it. Labels that begin with a checkbox or radio use a hanging indent, so wrapped
text aligns with the first word instead of the mark.

The label remains part of the clickable target. If custom CSS changes that
label to `display: flex` or `grid`, reset its `padding-inline-start` and
`text-indent` because a flex or grid layout does not need the hanging indent.

## States

- A checked checkbox uses the primary surface and displays the check icon.
- The `indeterminate` state displays a dash. It is a JavaScript property, not
  an HTML attribute, and does not change the submitted value by itself.
- A checked radio uses the primary surface and a visible dot, so selection is
  not conveyed by colour alone.
- Pointer hover changes the edge or active surface. Focus draws the shared
  control ring. Radios use the focus state needed to keep arrow-key navigation
  visible across supported browsers.
- A disabled choice uses the disabled surface, edge and text treatment.
- A switch uses a pill track and moving thumb. `role="switch"` changes the
  announced state to on or off; the underlying form control remains a
  checkbox.
- `aria-invalid="true"` and `aria-invalid="false"` use the shared validation
  colours. See [Validation and states](/forms/validation).

## Grouping choices

Wrap related radios in a `fieldset` and put the question in its `legend`.
The browser exposes that group relationship to assistive technology and uses
the common `name` for single selection. A related set of checkboxes can use the
same structure even though each checkbox remains independent.

## Segmented choice

The class-based builds can draw a compact radio group as joined segments. The
markup stays a real fieldset with labelled radios:

{% demo "segmented" %}

```html
<fieldset class="segmented">
  <legend>View</legend>
  <label>
    <input type="radio" name="view" value="list" checked>
    List
  </label>
  <label>
    <input type="radio" name="view" value="grid">
    Grid
  </label>
  <label>
    <input type="radio" name="view" value="map" disabled>
    Map
  </label>
</fieldset>
```

The inputs stay available to keyboards, form submission and assistive
technology. Arrow keys move through the radio group, and focus appears around
the active segment. `.segmented` is not emitted by classless builds; there the
fieldset remains an ordinary radio group.

## Accessibility

- Keep meaningful text in each label. The fieldset legend names the overall
  question; it does not replace each choice label.
- Use a switch only for an immediate setting. Use a checkbox for a choice that
  is collected and applied when a form is submitted.
- Do not hide native radio inputs to build a segmented control. The Cirth
  pattern deliberately leaves them operable.
- If the switch thumb colour is customised, preserve at least 3:1 contrast
  against both track states.

## Tokens

| Token | What it sets |
| --- | --- |
| `--cirth-primary-surface`, `--cirth-primary-border` | Checked fill and edge |
| `--cirth-icon-checkbox`, `--cirth-icon-minus` | Checkbox marks |
| `--cirth-switch-background-color` | Off track |
| `--cirth-switch-checked-background-color` | On track |
| `--cirth-switch-color` | Switch thumb |

## Common mistakes

- Giving each radio a different `name`, which allows several choices at once.
- Omitting radio values, which submits the browser default instead of a useful
  application value.
- Using a switch for a choice that has no effect until form submission.
- Styling a non-input element as a checkbox instead of using the native
  control.

## Related

- [Forms](/forms/), for labels, fieldsets and legends.
- [Select](/forms/select), for a longer single-choice list.
