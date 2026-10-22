---
layout: docs.njk
description: Build understandable, accessible HTML forms with Cirth labels, help text, fieldsets, legends and native controls.
---

# Forms

Cirth styles standard form elements. Start with the HTML that describes the
data you need, then let the browser provide input, keyboard and submission
behavior.

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
    <label>
      <input type="radio" name="plan" value="free" checked>
      Free
    </label>
    <label>
      <input type="radio" name="plan" value="team">
      Team, billed monthly
    </label>
  </fieldset>

  <button type="submit">Create account</button>
</form>
```

This form asks for two account values and one plan. The browser collects
controls that have a `name`. For example, the checked plan produces either
`plan=free` or `plan=team`. Your application still has to receive, validate
and store that data.

## Label, control, help text

A `label` gives a control its accessible name and makes the label text
clickable. The example nests each control inside its label. If the two
elements cannot be nested, give the control an `id` and use the same value in
the label's `for` attribute:

```html
<label for="company">Company</label>
<input id="company" name="company" type="text">
```

The attributes have different jobs:

- `id` identifies one element in the page. Labels and ARIA references use it.
- `name` identifies the value when the browser submits the form.
- `value` is the submitted value. For text fields it also provides an initial
  value; for radios and checkboxes it identifies the selected choice.
- `autocomplete` tells the browser what kind of saved information may fill the
  field. Use a standard token such as `name`, `email` or `postal-code`.
- `required` adds a native constraint. A supporting browser will not submit
  the form while the control has no acceptable value.

A `small` immediately after a control is styled as help text. Its `id` lets
`aria-describedby` connect the explanation to the control, so assistive
technology can announce it after the label. `aria-describedby` adds a
description; it does not replace the label.

## Grouping with fieldset and legend

A `fieldset` groups controls that answer one question. Its first `legend`
names that group. This relationship is especially important for radio buttons,
because a label such as "Team" only makes sense after the group question
"Plan" is known.

The browser exposes the group and its name to assistive technology. Setting
`disabled` on the `fieldset` disables its form controls together. Cirth removes
the browser's fieldset frame and styles the legend as the group's heading.

## Native behavior and Cirth styling

The browser owns editing, selection, keyboard input, autocomplete, constraint
validation and form submission. Cirth adds a consistent control height,
surface, edge, spacing, typography and visible states. It does not send form
data, validate business rules or write error messages.

Text fields, `select` and `textarea` fill their container by default. Buttons
size to their text. One-line controls and buttons share a 44px minimum height,
so they align when placed together.

## Layout

- Stack labels in source order for the clearest reading and keyboard order.
- Use [Grid](/layout/grid) when related fields need to share a row. It wraps
  when the available width becomes too small.
- An input with a `size` attribute keeps its native content-based width instead
  of filling the row.
- Use [Group](/components/group) when a field and button must form one joined
  control.

Do not use visual position to change the meaning or order of fields. The DOM
order remains the order used by keyboards and assistive technology.

## Accessibility

- Give every control a visible label. A placeholder is an example or hint; it
  disappears during editing and is not a label.
- Choose an input `type` that matches the data. Browsers can then provide a
  suitable mobile keyboard and native constraints.
- Put persistent instructions in help text connected with
  `aria-describedby`.
- Describe errors in words and associate them with the field. Cirth supplies
  state styling, not the error message or application validation.
- Keep the native element whenever it already represents the interaction.
  Styling a `div` to look like an input does not give it input behavior.

## Controls

<ul class="docs-path-list">
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

| Token | What it sets |
| --- | --- |
| `--cirth-form-element-background-color` | Optional field fill; otherwise the field uses its current surface |
| `--cirth-form-element-border-color` | Field edge |
| `--cirth-form-element-color` | Entered text |
| `--cirth-form-element-placeholder-color` | Placeholder text |
| `--cirth-form-element-focus-color` | Focus ring |
| `--cirth-form-element-spacing-vertical`, `--cirth-form-element-spacing-horizontal` | Field padding |
| `--cirth-form-label-font-weight` | Label weight |

[Customization](/customization) explains where to set token overrides and how
they participate in the cascade.

## Common mistakes

- Omitting `name`, which leaves a control out of ordinary form submission.
- Reusing an `id`, which makes `for`, `aria-describedby` and other references
  ambiguous.
- Using a placeholder as the only label.
- Treating browser validation as server validation. Data must still be checked
  by the application.

## Related

- [Validation and states](/forms/validation)
- [Buttons](/content/button)
- [Accessibility and user preferences](/guides/accessibility)
