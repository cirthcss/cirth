---
layout: docs.njk
description: Let one direct child span a container's full width while surrounding content stays on the readable content track.
---

# Breakout

Use `.breakout` on a direct child of `.container` when that item needs more
room than the reading measure. Wide tables, diagrams, and media are typical
examples.

{% demo "breakout" %}

```html
<main class="container">
  <p>Regular content stays inside the reading measure.</p>
  <figure class="breakout">
    <img src="report-chart.png"
         alt="Revenue rose in every quarter of 2026">
    <figcaption>Quarterly revenue for 2026.</figcaption>
  </figure>
  <p>The following content returns to the reading measure.</p>
</main>
```

## How it works

`.container` is a CSS grid with named `content` and `full` lines. Direct
children normally occupy `content`. Cirth gives a direct `.breakout` child
`grid-column: full`, so it spans the container's two gutter tracks as well.

The utility reaches the container's own edges, not the viewport edges. It
therefore works when the container sits inside a sidebar layout or another
bounded region. It also avoids the horizontal overflow that viewport-width
breakout techniques can cause when a scrollbar consumes space.

## Direct-child requirement

Only `.container > .breakout` matches. A nested descendant cannot choose a
track on an ancestor's grid:

```html
<!-- The figure is not a direct child, so it stays on the content track. -->
<main class="container">
  <div>
    <figure class="breakout">...</figure>
  </div>
</main>
```

Move the class to the direct child, or make the element that owns the mixed
widths the container:

```html
<main class="container">
  <figure class="breakout">...</figure>
</main>
```

This boundary prevents `.breakout` from changing an unrelated grid elsewhere
on the page.

## Availability and limits

`.breakout` is available only in the default, class-enabled build. It has no
effect in `.container-fluid`, whose content track already uses all available
width.

Cirth supplies one full-width escape lane. If a design needs several
intermediate measures, define that editorial grid in application CSS rather
than treating `.breakout` as a generic column utility.

## Common mistakes

- Do not use `.breakout` outside `.container` and expect a full-width item.
- Do not wrap the breakout in another element unless that wrapper receives
  the class.
- Do not use it to make ordinary prose span the page. Keep long-form text on
  the readable content track.
- Do not combine `.breakout` with viewport-width and negative-margin tricks.

## Related pages

- [Container](/layout/container)
- [Figure](/content/figure)
- [Overflow auto](/layout/overflow-auto)
