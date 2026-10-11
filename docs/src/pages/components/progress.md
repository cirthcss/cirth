---
layout: docs.njk
description: Show determinate or indeterminate task completion with the native progress element and Cirth styling.
---

# Progress

Use `progress` for a task that is running toward completion. Provide `value`
and `max` when completion can be measured; omit `value` when the amount is not
known.

{% demo "progress" %}

```html
<label id="upload-label" for="upload-progress">File upload</label>
<progress id="upload-progress" aria-labelledby="upload-label"
          value="25" max="100">25%</progress>

<label id="import-label" for="import-progress">Importing records</label>
<progress id="import-progress" aria-labelledby="import-label">
  In progress
</progress>
```

`aria-labelledby` points to the visible label's `id` and gives the progress
indicator an accessible name. The same label also uses its native `for`
association. Text between the progress tags is fallback content and is not the
visible percentage in supporting browsers.

## Determinate and indeterminate states

A determinate progress indicator has a numeric `value`. The browser interprets
it relative to `max`, whose default is 1 when omitted. Application code must
update the value as the task advances and report completion or failure in text.

An indeterminate progress indicator has no `value` attribute at all. Do not set
`value=""` or an arbitrary looping number to represent an unknown amount.

## Behavior

The browser exposes the task value and state through the native element. Cirth
resets engine-specific paint, makes the component full width and draws a track,
contrasting edge and value bar consistently across supported engines.

The indeterminate state uses a moving gradient when motion is allowed. It moves
in the opposite direction in a right-to-left document. Under
`prefers-reduced-motion: reduce`, Cirth leaves a static track instead.

For a measurement that is not a task, such as capacity or a score, use
[Meter](/components/meter).

## Accessibility

- Give every progress indicator a visible or programmatic name. Visible text is
  preferable when the task is not already obvious from context.
- Keep the accessible value synchronised with the real task by updating the
  native `value` property.
- Announce completion and errors separately. A full or stopped bar does not
  explain the outcome.
- Do not rely on animation alone to mean that work continues.

## Tokens

| Token | What it sets |
| --- | --- |
| `--cirth-progress-background-color` | Track |
| `--cirth-progress-border-color` | Track edge |
| `--cirth-progress-color` | Determinate value and indeterminate sweep |
| `--cirth-border-radius` | Track radius |

## Common mistakes

- Using progress for a static measurement.
- Leaving a stale numeric value after the task becomes indeterminate.
- Showing a percentage as fallback text but never updating the native value.
- Omitting an accessible name.

## Related

- [Meter](/components/meter)
- [Loading](/components/loading), for a compact busy state.
- [Reduced motion](/guides/accessibility#reduced-motion)
