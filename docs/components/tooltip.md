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

## Accessibility limits

This is a pure-CSS pattern, and CSS alone cannot make tooltips fully
conformant with WCAG 2.2. Know its limits and work within them:

- **Use it only on focusable elements** (`a`, `button`, form controls, or
  anything with `tabindex="0"`). On a plain `<span>`, keyboard users have no
  way to trigger the tooltip at all — the dotted underline styling is a
  hint, not a substitute for focusability.
- **Never put essential information only in the tooltip.** The text lives
  in a CSS pseudo-element, which screen readers don't reliably announce.
  For content the user must not miss, repeat it as visible text or wire it
  up with `aria-describedby` pointing at a real element.
- **It can't be dismissed with <kbd>Esc</kbd>** without moving focus or the
  pointer, which WCAG 1.4.13 (Content on Hover or Focus) requires. If your
  page must meet 1.4.13 strictly for tooltip-bearing elements, use a small
  JS-driven tooltip (or the Popover API) instead of this pattern — Cirth's
  styles won't get in the way.
- Keep the text short: the tooltip is a single non-wrapping line and
  truncates with an ellipsis rather than reflowing.
