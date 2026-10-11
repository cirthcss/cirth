---
layout: docs.njk
description: Use Cirth textareas for labelled multi-line input, explicit row counts, help text and length constraints.
---

# Textarea

Use `textarea` for text that may span several lines, such as a message or
description. Without a `rows` attribute, Cirth opens it at four text lines and
lets the person resize it vertically.

{% demo "forms-textarea" %}

```html
<label>
  Message
  <textarea name="message" maxlength="500" required
            aria-describedby="message-help"></textarea>
  <small id="message-help">Up to 500 characters.</small>
</label>

<label>
  Short note
  <textarea name="note" rows="2">Initial text</textarea>
</label>
```

Unlike an `input`, a textarea's initial value is written between its opening
and closing tags. Do not add indentation inside an otherwise empty textarea,
because those spaces and line breaks become part of its value.

## Height

- Without `rows`, the minimum height fits four lines in the textarea's own
  line height, plus its padding and edge.
- `rows` supplies an explicit native row count and takes precedence over the
  four-line default.
- Cirth allows vertical resizing only. This lets a person reveal more text
  without pushing the form wider than its container.

`maxlength` limits the number of characters the browser accepts. It does not
display the limit, so state it in persistent help text when it matters.

## States

Focus, read-only, disabled and validation behave as they do for
[text inputs](/forms/text-inputs#states). Validation icons sit at the top of a
textarea, beside its first line, rather than halfway down the field.

## Native behavior and Cirth styling

The browser owns editing, selection, line wrapping, constraints and resize
interaction. Cirth adds the shared field surface, border, radius, padding and
states, then sets the default minimum height and vertical resize direction.

## Accessibility

- Give the textarea a visible label.
- Connect limits and format instructions with `aria-describedby`.
- Do not put instructions only in a placeholder. They disappear as soon as
  the person enters text.
- If an application displays a live character count, update it without
  repeatedly interrupting screen-reader output.

## Tokens

A textarea uses the [text input tokens](/forms/text-inputs#tokens). Its default
height also depends on `--cirth-form-element-spacing-vertical`.

## Common mistakes

- Setting an initial value with a `value` attribute. `textarea` does not use
  that attribute for its text content.
- Adding `maxlength` without telling the person about the limit.
- Disabling resize when longer text may need to be reviewed.

## Related

- [Forms](/forms/), for labels and descriptions.
- [Validation and states](/forms/validation)
