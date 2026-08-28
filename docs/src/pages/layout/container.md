---
layout: docs.njk
---


# Container

`.container` is an editorial container: a centered content column capped
at a reading-friendly measure, with fluid side gutters.
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

Both classes are three-track CSS grids with named `full` and `content`
lines — two gutter tracks that never drop out, and a center track that
holds the content:

```css
.container {
  display: grid;
  grid-template-columns:
    [full-start] minmax(var(--cirth-container-gutter), 1fr)
    [content-start]
      minmax(0, var(--cirth-container-max-width))
    [content-end]
    minmax(var(--cirth-container-gutter), 1fr) [full-end];
}
.container > *,
.container-fluid > * {
  grid-column: content;
}
```

`.container`'s center track is capped at `--cirth-container-max-width`
(default `60rem`, 960px at the standard 16px root);
`.container-fluid`'s isn't. The cap resizes continuously with the
viewport — there's no breakpoint table to memorize, and no jump between
fixed widths as the window is resized. The gutters are controlled by
`--cirth-container-gutter`, which defaults to
`clamp(1rem, 4%, 3rem)`: they grow with the container itself but never drop
out. A container nested in a narrow panel therefore gets a narrow gutter
even on a large viewport. This is deliberately separate from
`--cirth-spacing`, so opening up a page shell does not also enlarge
controls, cards, and grid gaps.

`.container-fluid` fixes each outer track to that gutter and gives all the
remaining width to `content`. It does not split the box into three equal
`1fr` columns.

Override `--cirth-container-max-width` per instance for layouts that sit
between the two — for example a docs shell with a sidebar might want a
wider measure than an article:

```css
.container {
  --cirth-container-max-width: 76rem;
}
```

Override the gutter independently when a particular shell needs a fixed
edge:

```css
.dashboard-shell {
  --cirth-container-gutter: 1.5rem;
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
.container > .breakout {
  grid-column: full;
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

The selector is deliberately limited to a direct child of `.container`.
A `.breakout` inside an unrelated `.grid` remains an ordinary grid item,
and a nested descendant cannot jump into an ancestor's grid. Put
`.container` on the semantic element whose direct children need to switch
between the two tracks:

```html
<section class="container">
  <h1>Release notes</h1>
  <p>Regular prose.</p>
  <figure class="breakout">…</figure>
</section>
```

## Composition contract

One class should own an element's layout. Do not combine `.container` with
`.grid`, `.row`, or another class that defines `grid-template-columns` on
the same node; nest the second layout instead:

```html
<main class="container">
  <div class="grid">…</div>
</main>
```

Cirth intentionally exposes one escape lane, `.breakout`, rather than a
scale of `popout`/`feature`/`full` classes. More lanes would add vocabulary
and markup before the library has distinct recurring uses for them; local
CSS can add a specialized editorial grid without enlarging the core API.

`.breakout` is only available in the default build with classes enabled.

## Breaking change

Before this release, `.container`'s max width stepped up at five fixed
breakpoints (from 510px to 1450px) and `.container-fluid` was little
more than full width with padding. Both are now the grid described
above. If you relied on the old stepped widths, set
`--cirth-container-max-width` to the value you need — there's no longer
a breakpoint table, just one continuously-resizing cap.
