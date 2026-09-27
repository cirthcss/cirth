---
layout: docs.njk
description: The range input in Cirth. A flat track and a round thumb, with the native keyboard, pointer and value behaviour kept.
---

# Range

`<input type="range">` becomes a flat track with a round thumb. The control
underneath is still the native one: arrow keys, Page Up and Down, Home and
End, and pointer dragging all behave as the browser defines.

{% demo "input-range" %}

```html
<label>
  Volume
  <input type="range" name="volume" min="0" max="100" value="60">
</label>
```

## States

- The track uses `--cirth-range-border-color`, deepening to
  `--cirth-range-active-border-color` on hover, while dragging and while
  focused.
- The thumb uses `--cirth-range-thumb-color`, strengthens on hover, and
  takes the primary fill (`--cirth-range-thumb-active-color`) while active
  or focused.
- The thumb grows to 1.25× while dragged; keyboard focus adds the standard
  focus ring.
- A disabled range fades and stops reacting to the pointer.
- Range inputs are left out of automatic validity styling.

## Accessibility

- The input keeps the shared 44px target even though the visible thumb is
  20px, so it is easy to grab.
- Show the current value next to the label when it matters; a range alone
  does not print its number. `aria-valuetext` gives assistive technology a
  readable value such as "60 percent".
- Under reduced motion the track and thumb stop animating; see
  [Accessibility and user preferences](/guides/accessibility#reduced-motion).

## Tokens

| Token | What it sets |
| --- | --- |
| `--cirth-range-border-color` | Track at rest |
| `--cirth-range-active-border-color` | Track while active |
| `--cirth-range-thumb-color` | Thumb at rest |
| `--cirth-range-thumb-active-color` | Thumb while active or focused |
| `--cirth-range-thumb-border-color` | Ring around the thumb |

## Related

- [Meter](/components/meter) and [Progress](/components/progress), to show a
  value rather than set one.
