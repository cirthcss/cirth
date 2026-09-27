---
layout: docs.njk
description: Date, time, datetime-local, month and week inputs in Cirth. The field chrome of every other input, with a calendar or clock icon.
---

# Date and time inputs

`date`, `time`, `datetime-local`, `month` and `week` inputs share the look
of the text fields, plus a calendar or clock icon. The picker that opens is
the browser's own.

{% demo "input-date" %}

```html
<label>
  Date
  <input type="date" name="date">
</label>

<label>
  Time
  <input type="time" name="time">
</label>

<label>
  Date and time
  <input type="datetime-local" name="when">
</label>
```

## Behaviour

- The native picker indicator is kept but made transparent and laid over
  Cirth's icon, so only one icon shows and clicking it still opens the
  picker.
- In Firefox, where the indicator cannot be hidden this way, Cirth's icon is
  dropped and the normal padding restored.
- In Safari, the internal date and time segments are reset to follow the
  field's text alignment and lose their extra vertical padding.
- Under `[dir="rtl"]` the text aligns right.
- Date fields can shrink as flex items, so a start and end date stay on one
  row inside a grouped grid.

## Accessibility

- Label each field; for a range, label both ends ("Check-in", "Check-out")
  rather than relying on their order.
- Put the expected format in help text if you also accept typed input: the
  segments differ between browsers and locales.

## Tokens

| Token | What it sets |
| --- | --- |
| `--cirth-icon-date` | The calendar icon, one per colour scheme |
| `--cirth-icon-time` | The clock icon, one per colour scheme |

The field itself reads the shared [text input tokens](/forms/text-inputs#tokens).

## Related

- [Text inputs](/forms/text-inputs) and [Validation and states](/forms/validation).
- [Group](/components/group), to put two dates side by side as one control.
