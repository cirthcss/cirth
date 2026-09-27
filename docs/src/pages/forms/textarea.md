---
layout: docs.njk
description: Multi-line text in Cirth. A textarea opens four lines tall, grows only vertically, and shares the states of every other field.
---

# Textarea

A `textarea` opens four lines tall, so a field meant for a paragraph shows a
paragraph. It can be resized vertically only, so it never breaks the width
of the form.

{% demo "forms-textarea" %}

```html
<label>
  Message
  <textarea name="message" placeholder="What can we help with?"
            maxlength="500" aria-describedby="message-help"></textarea>
  <small id="message-help">Up to 500 characters.</small>
</label>

<label>
  Short note
  <textarea name="note" rows="2"></textarea>
</label>
```

## Height

- Without a `rows` attribute, a textarea is four lines of its own text tall.
  The lines are measured in `lh`, so they stay four lines if you change its
  font size.
- A `rows` attribute takes over completely: the default only applies when
  you have not said how tall you want it.
- The reader can drag it taller or shorter, never wider.

## States

Focus, read-only, disabled and validation work as they do on
[text inputs](/forms/text-inputs#states). The valid and invalid icons sit at
the top of the field rather than in the middle, next to the first line.

## Accessibility

- Label it, and say any length limit in help text linked with
  `aria-describedby`: `maxlength` stops typing silently.
- Avoid a placeholder that repeats the label or carries instructions the
  reader needs after they start typing.

## Tokens

A textarea reads the same tokens as the
[text inputs](/forms/text-inputs#tokens), and its minimum height follows
`--cirth-form-element-spacing-vertical`.

## Related

- [Forms](/forms/), for labels and help text.
- [Validation and states](/forms/validation).
