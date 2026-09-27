---
layout: docs.njk
description: How a form is put together in Cirth. The form, its fields, labels and help text, fieldsets and legends, and the submit button.
---

# Forms

A form in Cirth is made of the standard elements: `form`, `fieldset` and
`legend`, a `label` for every control, a `small` for help text, and a
submit button. Each is styled as it is, and they space themselves when
stacked. This page covers how they fit together; each kind of control has
its own page.

{% demo "forms-structure" %}

```html
<form>
  <fieldset>
    <legend>Account</legend>
    <label>
      Full name
      <input type="text" name="name" autocomplete="name" required>
    </label>
    <label>
      Email
      <input type="email" name="email" autocomplete="email"
             aria-describedby="email-help" required>
      <small id="email-help">Receipts go here. We never share it.</small>
    </label>
  </fieldset>
  <fieldset>
    <legend>Plan</legend>
    <label><input type="radio" name="plan" value="free" checked> Free</label>
    <label><input type="radio" name="plan" value="team"> Team, billed monthly</label>
  </fieldset>
  <button type="submit">Create account</button>
</form>
```

## Label, control, help text

Put the control inside its `label`, right after the text. The label becomes
a block with medium-weight text, and the control a full-width field just
under it. A `for` attribute pointing at the control's `id` works the same
way when the two cannot be nested.

A `small` immediately after a control is its help text: a muted line tucked
under the field. Give it an `id` and point the control's `aria-describedby`
at it, so a screen reader reads it with the field. When the field is marked
valid or invalid, the help text takes the matching colour; see
[Validation and states](/forms/validation).

## Grouping with fieldset and legend

A `fieldset` groups related controls under a `legend`. Cirth draws no box
around it: it is full width, with no border or padding, and the legend is
styled like a label. Use one whenever a set of controls answers one
question, which is always the case for radios and usually for checkboxes.

`<fieldset disabled>` disables every control inside it at once.

## Layout

- Text inputs, `select` and `textarea` are full width, with a bottom margin
  of `--cirth-spacing`, so stacked fields space themselves.
- Buttons and one-line controls share one height formula and are at least
  44px tall, so a field and a button beside it line up without offsets.
- To place fields side by side, wrap them in a [`.grid`](/layout/grid),
  which wraps to one column when there is no room.
- An input with a `size` attribute keeps its natural width instead of
  filling the row.
- A submit `button` inside a form is full width, like the fields above it.
  To attach a button to a field instead, use a [group](/components/group).

## Accessibility

- Every control needs a visible label. A placeholder is not one: it
  disappears as soon as the reader types.
- Use the `type` and `autocomplete` that describe the data. They bring the
  right keyboard on a phone, and let browsers and password managers fill
  the field.
- Put instructions in help text linked with `aria-describedby`, not only in
  a placeholder or a tooltip.
- Report errors on the field (`aria-invalid`) and in words next to it.
  Cirth pairs the error colour with an icon, so the state never depends on
  colour alone.

## Controls

<ul class="docs-link-grid">
<li><a href="/forms/text-inputs"><strong>Text inputs</strong><span>Text, email, password, URL, phone and number.</span></a></li>
<li><a href="/forms/select"><strong>Select</strong><span>One or several choices from a list.</span></a></li>
<li><a href="/forms/textarea"><strong>Textarea</strong><span>Multi-line text.</span></a></li>
<li><a href="/forms/validation"><strong>Validation and states</strong><span>Valid, invalid, disabled and read-only.</span></a></li>
<li><a href="/forms/checkbox-radio-switch"><strong>Checkbox, radio and switch</strong><span>Toggles, single choices and segmented choices.</span></a></li>
<li><a href="/forms/input-color"><strong>Color</strong><span>The native colour picker.</span></a></li>
<li><a href="/forms/input-date"><strong>Date</strong><span>Date, time, month and week fields.</span></a></li>
<li><a href="/forms/input-file"><strong>File</strong><span>File uploads.</span></a></li>
<li><a href="/forms/input-range"><strong>Range</strong><span>A value on a scale.</span></a></li>
<li><a href="/forms/input-search"><strong>Search</strong><span>A search field.</span></a></li>
</ul>

## Tokens

Every control reads the same family, so one override reaches all of them:

| Token | What it sets |
| --- | --- |
| `--cirth-form-element-background-color` | A field at rest |
| `--cirth-form-element-active-background-color` | A focused field |
| `--cirth-form-element-border-color` | The field's edge |
| `--cirth-form-element-active-border-color` | The edge while focused |
| `--cirth-form-element-color` | The text inside a field |
| `--cirth-form-element-placeholder-color` | Placeholder text |
| `--cirth-form-element-focus-color` | The focus ring |
| `--cirth-form-element-spacing-vertical`, `-horizontal` | The field's padding |
| `--cirth-form-label-font-weight` | Labels and legends |

[Customization](/customization) explains how these derive from the
accent and the canvas.
