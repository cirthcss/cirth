---
layout: docs.njk
---

# Reduce motion

Cirth respects `prefers-reduced-motion: reduce` globally. You don't need to
add a class or override a transition token per component.

## Behavior

Under `prefers-reduced-motion: reduce`, every element except one with
`aria-busy="true"` (the [loading](/components/loading) spinner is exempt, so
it still visibly communicates progress) gets:

* animations collapsed to effectively instant (`animation-duration: 1ms`,
  `animation-iteration-count: 1`);
* `background-attachment: initial` (removes fixed attachment parallax style
  backgrounds);
* `scroll-behavior: auto` (removes smooth scroll easing);
* transitions collapsed to `--cirth-duration-instant` (`0ms`);
* `--cirth-transition` itself re-pointed at that same instant duration.

The last one is what makes the rule reach inside a control. A selector list
covers elements, `::before` and `::after`, and nothing else, so the engine
pseudo-elements a native control is built from, `::-moz-range-thumb` and
`::-webkit-slider-thumb` among them, went on animating while the control
that owns them had already stopped. They cannot be added to that list:
a list containing one engine's pseudo-element is discarded whole by the
other. A custom property can reach them, because they inherit it, so the
token is neutralized instead of the selector list being extended.

The practical effect is that anything built from `--cirth-transition` —
Cirth's own components, and any transition you write with the token —
follows the preference without being named here.

This covers Cirth's own animated bits: the
[progress](/components/progress) indeterminate sweep, the
[popover](/components/popover) fade, [modal](/components/modal) open/close
animations, and the [range](/forms/input-range) track and thumb, without
you having to special case each one in your own CSS.
