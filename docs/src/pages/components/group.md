---
layout: docs.njk
description: Join related Cirth form controls and buttons into one visual group while preserving labels and form behavior.
---

# Group

Use a group when related controls should read as one joined row, such as an
email field with its submit button.

{% demo "group" %}

```html
<form>
  <label id="subscribe-label" for="subscribe-email">Email</label>
  <div class="group" role="group" aria-labelledby="subscribe-label">
    <input id="subscribe-email" type="email" name="email"
           autocomplete="email" required>
    <button type="submit">Subscribe</button>
  </div>
</form>
```

`role="group"` tells assistive technology that the controls are related.
`aria-labelledby` points to the `id` of the text that names that group. It
does not label the email input by itself, so the regular `label for` connection
is still present.

In a class-based build, `.group` opts into the visual component and
`role="group"` supplies semantics when needed. In a classless build, use a
non-`fieldset` element with `role="group"`; that role is the visual trigger.
Classless builds omit component and utility classes but retain `.no-cirth` as
the component-exclusion boundary.

## Search group

`role="search"` creates a search landmark. Cirth uses it as a group trigger in
every build.

{% demo "group-search" %}

```html
<form role="search" aria-label="Documentation">
  <label class="sr-only" for="group-query">Search documentation</label>
  <input id="group-query" type="search" name="q">
  <button type="submit">Search</button>
</form>
```

Use an accessible name such as `aria-label` when the page has more than one
search landmark. The visually hidden label still names the field itself.

A search group is shaped like any other group: its outer corners take the
control radius, and the field inside it matches them.

## Behavior

Cirth lays visible children out with inline flexbox, removes adjoining corner
radii and overlaps shared edges. Text fields grow to take available space;
buttons retain content-based widths. Groups can wrap when the container becomes
too narrow.

Hidden elements and hidden inputs do not affect which visible child receives
the outer corners. A direct `small` becomes full-width help text below the row.
Connect it to the relevant field with `aria-describedby`.

When a child receives keyboard focus, Cirth draws one ring around the whole
group. Its colour follows the focused control's primary, secondary, contrast
or validation state.

## Accessibility

- Every form control still needs its own label.
- Name a semantic group with `aria-labelledby` or `aria-label` when its purpose
  is not already clear.
- Keep DOM order equal to the expected reading and keyboard order.
- Use `fieldset` and `legend` for a question with several radio buttons or
  checkboxes. That semantic pattern is different from this visual join.

## Tokens

| Token | What it sets |
| --- | --- |
| `--cirth-group-box-shadow` | Group shadow |
| `--cirth-border-radius` | Outer corners |
| `--cirth-primary-focus` | Default group focus ring |

Validation and button variants reuse their own focus tokens.

## Common mistakes

- Adding `.group` without labels or a form submission purpose.
- Assuming `role="group"` labels the child inputs.
- Using `<fieldset role="group">` as the classless visual trigger. Fieldsets
  are deliberately excluded from that selector.
- Placing unrelated actions in one joined row.

## Related

- [Forms](/forms/)
- [Search input](/forms/input-search)
- [Buttons](/content/button)
