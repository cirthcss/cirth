# Tooltip

`[data-tooltip]` shows its value in a small popover on hover/focus — pure
CSS, no JavaScript, positioned on any of four sides.

<Demo src="tooltip" />

```html
<a href="#" data-tooltip="Tooltip on top">Top</a>
<a href="#" data-tooltip="Tooltip on bottom" data-placement="bottom">Bottom</a>
<a href="#" data-tooltip="Tooltip on left" data-placement="left">Left</a>
<a href="#" data-tooltip="Tooltip on right" data-placement="right">Right</a>
<button type="button" data-tooltip="Saves your changes">Save</button>
```

## Behavior

- The tooltip text is the `data-tooltip` attribute value itself, rendered
  via CSS `content: attr(data-tooltip)` — no extra element needed.
- Placement defaults to top; `data-placement="bottom"|"left"|"right"` moves
  it to the other three sides, each with its own caret orientation.
- Background/foreground: `--cirth-tooltip-background-color` /
  `-color` (default to the contrast color group, so tooltips read as a solid
  dark chip regardless of the active accent color).
- On elements that aren't natively interactive (not `a`, `button`, `input`,
  `[role="button"]`), the tooltip target itself gets a dotted underline and
  `cursor: help`, signaling it's not just decorative text.
- On hover-capable, fine-pointer devices, the tooltip slides in with a short
  animation; on touch devices, it simply fades in on tap/focus.
