# Reduce motion

Cirth respects `prefers-reduced-motion: reduce` globally — you don't need to
add a class or override a transition token per component.

## Behavior

Under `prefers-reduced-motion: reduce`, every element except one with
`aria-busy="true"` (the [loading](/components/loading) spinner is exempt, so
it still visibly communicates progress) gets:

- animations collapsed to effectively instant (`animation-duration: 1ms`,
  `animation-iteration-count: 1`);
- `background-attachment: initial` (removes fixed-attachment parallax-style
  backgrounds);
- `scroll-behavior: auto` (removes smooth-scroll easing);
- transitions collapsed to `--cirth-duration-instant` (`0ms`).

This covers Cirth's own animated bits — the
[progress](/components/progress) indeterminate sweep, the
[tooltip](/components/tooltip) slide-in, and [modal](/components/modal)
open/close animations — without you having to special-case each one in your
own CSS.
