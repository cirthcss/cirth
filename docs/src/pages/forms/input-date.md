---
layout: docs.njk
description: Use native date, time, month, week and local date-time inputs with Cirth field styling.
---

# Date and time inputs

Date and time input types ask the browser for a platform picker while keeping a
machine-readable form value.

{% demo "input-date" %}

```html
<label>
  Start date
  <input type="date" name="start-date" required>
</label>

<label>
  Start time
  <input type="time" name="start-time" step="900">
</label>

<label>
  Local date and time
  <input type="datetime-local" name="starts-at">
</label>
```

Use `date` for a calendar date, `time` for a time of day,
`datetime-local` for a date and time without a time-zone offset, `month` for a
year and month, and `week` for a numbered week. The browser may display a
localised format even though form submission uses the type's standard value
format.

## Constraints

`min` and `max` limit the permitted range. `step` controls valid increments;
the time example uses 900 seconds, or 15 minutes. Native constraints are useful
feedback, but the application must still validate submitted values.

For a date range, give both fields explicit labels such as "Start date" and
"End date". Their visual order is not a sufficient name.

## Behaviour

The browser owns the editable date segments and the picker. Picker availability
and presentation vary by type, browser and operating system.

Cirth adds the shared field appearance and a calendar or clock icon. In engines
with an exposed picker indicator, the native clickable indicator remains over
the Cirth icon. Cirth also normalises internal spacing and alignment, supports
right-to-left text, and allows the field to shrink inside flex layouts.

Date and time types can receive valid or invalid border colours, but Cirth does
not add its usual validation background icon because the picker icon already
occupies that space.

## Accessibility

- Label every field and explain any relationship between them.
- State time zones separately when they matter. `datetime-local` contains no
  time-zone information.
- If typed input is expected, explain the accepted value in help text. The
  visible date order differs by locale and browser.
- Do not replace the native picker with an unlabelled text field only to obtain
  a uniform appearance.

## Tokens

| Token | What it sets |
| --- | --- |
| `--cirth-icon-date` | Calendar icon for date-like fields |
| `--cirth-icon-time` | Clock icon for time fields |

The field itself uses the [text input tokens](/forms/text-inputs#tokens).

## Common mistakes

- Treating `datetime-local` as a universal instant. Store or collect the time
  zone separately when the value crosses zones.
- Showing two date fields with no labels for their start and end roles.
- Trusting `min`, `max` or `required` without application validation.

## Related

- [Text inputs](/forms/text-inputs)
- [Validation and states](/forms/validation)
- [Group](/components/group), for visually joined start and end fields.
