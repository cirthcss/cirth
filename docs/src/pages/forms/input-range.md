---
layout: docs.njk
description: Use Cirth's native range input for an approximate value within a known minimum and maximum.
---

# Range

Use `input type="range"` when a person can choose a value on a bounded scale
and exact text entry is not the main task.

{% demo "input-range" %}

```html
<label>
  Volume
  <input type="range" name="volume" min="0" max="100"
         step="1" value="60">
</label>
```

`min` and `max` define the scale, `step` defines permitted increments, and
`value` supplies the initial and submitted value. The browser owns pointer,
touch and keyboard changes.

## Showing the value

A range input does not print its current number. If the exact value matters,
show it in nearby text and update that text when the input changes. Keep the
visible text and any `aria-valuetext` value synchronised in application code.
`aria-valuetext` is useful when the numeric value needs a human description,
such as "60 percent" or "medium".

Use a number input instead when precise entry is more important than quick
adjustment.

## States

- The track uses `--cirth-range-border-color` and changes to the active token
  on hover, focus or drag.
- The thumb uses `--cirth-range-thumb-color`, takes the primary active colour
  during focus or drag, and grows while being dragged.
- Focus draws the standard primary ring around the complete control.
- A disabled range uses the disabled thumb and muted track, then stops pointer
  interaction.
- Cirth leaves range controls out of automatic valid and invalid styling.

## Native behavior and Cirth styling

The browser owns the value model and interaction. Cirth resets the visual
appearance, then draws a 6px track and 20px circular thumb inside a 44px-high
control. Motion stops when the user requests reduced motion.

## Accessibility

- Give the range a visible label.
- Expose the current value in text when a person needs to compare or confirm
  it.
- Explain units in the label or value text.
- Do not encode important named steps only as unlabelled tick marks.

## Tokens

| Token | What it sets |
| --- | --- |
| `--cirth-range-border-color` | Track at rest |
| `--cirth-range-active-border-color` | Active track |
| `--cirth-range-thumb-color` | Thumb at rest |
| `--cirth-range-thumb-active-color` | Active or focused thumb |
| `--cirth-range-thumb-border-color` | Thumb edge |

## Common mistakes

- Omitting `min` and `max` while expecting an application-specific scale.
- Showing a value once but not updating it as the range changes.
- Using a range for a value that must be entered precisely.

## Related

- [Meter](/components/meter), for a measurement rather than an input.
- [Progress](/components/progress), for task completion.
- [Accessibility and user preferences](/guides/accessibility#reduced-motion)
