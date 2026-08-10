---
layout: docs.njk
---


# Container

`.container` is an editorial container: a centered content column capped
at a reading-friendly measure, with permanent side gutters.
`.container-fluid` is a dashboard/app-shell container: edge to edge, no
cap, gutters only. Both are only available in the **default** build with
classes enabled; the classless build applies `.container`'s behavior to
`body > header/main/footer` directly instead (see
[Landmarks](/layout/landmarks)).

{% demo "container" %}

```html
<main class="container">
  <p>Centered content with a capped reading measure.</p>
</main>
```

## How it works

Both classes are the same three-track CSS grid — two gutter tracks that
never drop out, and a center track that holds the content:

```css
.container,
.container-fluid {
  display: grid;
  grid-template-columns:
    minmax(var(--cirth-spacing), 1fr)
    minmax(0, /* center track width */)
    minmax(var(--cirth-spacing), 1fr);
}
.container > *,
.container-fluid > * {
  grid-column: 2; /* the center track */
}
```

`.container`'s center track is capped at `--cirth-container-max-width`
(default `60rem`, 960px at the standard 16px root);
`.container-fluid`'s isn't. The cap resizes continuously with the
viewport — there's no breakpoint table to memorize, and no jump between
fixed widths as the window is resized. The gutters (`--cirth-spacing`)
never drop out, at any viewport width; there's no "full-bleed" moment
below a breakpoint the way stepped-width containers had.

Override `--cirth-container-max-width` per instance for layouts that sit
between the two — for example a docs shell with a sidebar might want a
wider measure than an article:

```css
.container {
  --cirth-container-max-width: 76rem;
}
```

## `.breakout`

A direct child of `.container` normally stops at the center track. Give
it `.breakout` to fill the container's own box instead — for a wide
table, image, or figure that shouldn't be squeezed to the reading
measure:

{% demo "breakout" %}

```html
<div class="container">
  <p>Regular content stays inside the reading measure.</p>
  <table class="breakout">
    <!-- wide table -->
  </table>
</div>
```

```css
.breakout {
  grid-column: 1 / -1; /* both gutter tracks and the center track */
}
```

`.breakout` deliberately isn't the classic
`width: 100vw; margin-inline: calc(50% - 50vw)` trick — that only works
when the container itself is centered in the viewport, which isn't true
everywhere a container is used (a docs layout with a sidebar, for
example). Breaking out via `grid-column` instead escapes only to the
container's *own* edges, so it's correct regardless of what surrounds
it, and it doesn't have the `100vw` trick's scrollbar-gutter overflow
bug. `.container-fluid` doesn't need `.breakout` — it's already full
width.

`.breakout` is only available in the default build with classes enabled.

## Breaking change

Before this release, `.container`'s max width stepped up at five fixed
breakpoints (from 510px to 1450px) and `.container-fluid` was little
more than full width with padding. Both are now the grid described
above. If you relied on the old stepped widths, set
`--cirth-container-max-width` to the value you need — there's no longer
a breakpoint table, just one continuously-resizing cap.
