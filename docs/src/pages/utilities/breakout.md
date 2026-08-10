---
layout: docs.njk
---


# Breakout

`.breakout` lets a direct child of [`.container`](/layout/container)
fill the container's own box instead of stopping at its reading measure
— for a wide table, image, or figure that shouldn't be squeezed down to
prose width.

{% demo "breakout" %}

```html
<div class="container">
  <p>Regular content stays inside the reading measure.</p>
  <table class="breakout">
    <!-- wide table -->
  </table>
</div>
```

## Behavior

`.container` is a three-track CSS grid (two gutter tracks, one capped
center track); `.breakout` sets `grid-column: 1 / -1` to span all three.
That means it escapes only to the container's *own* edges, not the
viewport — unlike the classic `width: 100vw; margin-inline: calc(50% -
50vw)` trick, it stays correct inside a sidebar layout or any other
context where the container itself isn't centered in the viewport, and
it doesn't have that trick's scrollbar-gutter overflow bug. See
[Container](/layout/container) for the full grid mechanism.

`.breakout` only does something inside `.container` — `.container-fluid`
is already full width, so applying it there has no effect. Available
only in the default build with classes enabled (`$enable-classes:
true`), not in the classless build.
