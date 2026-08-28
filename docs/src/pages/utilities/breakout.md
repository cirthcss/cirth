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
center track) with named `content` and `full` lines; `.breakout` sets
`grid-column: full` to span all three.
That means it escapes only to the container's *own* edges, not the
viewport — unlike the classic `width: 100vw; margin-inline: calc(50% -
50vw)` trick, it stays correct inside a sidebar layout or any other
context where the container itself isn't centered in the viewport, and
it doesn't have that trick's scrollbar-gutter overflow bug. See
[Container](/layout/container) for the full grid mechanism.

The selector is `.container > .breakout`: it only does something as a
direct child of `.container`, and it cannot leak into an unrelated grid.
`.container-fluid` already has uncapped content, so applying it there has
no effect. Available only in the default build with classes enabled
(`$enable-classes: true`), not in the classless build.

Cirth exposes one breakout lane on purpose. Intermediate `popout` or
`feature` widths are useful in some editorial systems, but they are not a
universal semantic distinction and remain application CSS until the core
has recurring use cases for them.
