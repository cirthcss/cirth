---
layout: docs.njk
description: Center page content in a readable column with fluid gutters, or use a fluid container for full-width application layouts.
---

# Container

Use `.container` for a centered page or article whose content should stop at
a readable maximum width. Use `.container-fluid` when the content should use
all available width while keeping a gutter at each edge.

Both classes are available in the default build. The classless build applies
container behavior to the page landmarks instead; see
[Landmarks](/layout/landmarks).

{% demo "container" %}

```html
<main class="container">
  <h1>Project overview</h1>
  <p>This content stays centered and readable on wide screens.</p>
</main>
```

The `<main>` element identifies the primary content of the page. The
`container` class changes only its layout. It does not add or replace the
meaning supplied by `<main>`.

## How it works

Cirth makes each container a three-track CSS grid. The middle `content`
track holds every direct child. The two outer tracks provide the inline
gutters.

`.container` caps the middle track at `--cirth-container-max-width`, which
defaults to `60rem`. Extra space is shared by the outer tracks, so the content
remains centered. `.container-fluid` leaves the middle track uncapped and
keeps only the gutters.

The width changes continuously with the available space. There is no
container breakpoint table to account for.

## Choosing a container

| Use | When |
| --- | --- |
| `.container` | Articles, settings pages, forms, and other content that becomes hard to read when lines are very long |
| `.container-fluid` | Dashboards, data-heavy screens, and application shells that need the available width |

Do not add a container only to style a small component. A container defines
the main horizontal measure of a region, not the appearance of its contents.

## Customizing width and gutters

Change the maximum width on one container when a layout needs a wider or
narrower measure:

```css
.docs-shell {
  --cirth-container-max-width: 76rem;
}
```

Change `--cirth-container-gutter` when the distance from the outer edge needs
to differ from the default `clamp(1rem, 4%, 3rem)`:

```css
.dashboard-shell {
  --cirth-container-gutter: 1.5rem;
}
```

The gutter token is separate from `--cirth-spacing`. Changing the page gutter
therefore does not also change component padding or grid gaps.

## Wide children

A direct child can span the container's own width with `.breakout`. Use it for
content such as a wide figure or table, and keep ordinary content on the
reading measure:

```html
<main class="container">
  <p>This paragraph stays on the content track.</p>
  <figure class="breakout">...</figure>
</main>
```

The direct-child requirement and the full layout contract belong to the
[Breakout utility](/utilities/breakout).

## Composition contract

Do not combine `.container` or `.container-fluid` with `.grid`, `.row`, or
another class that defines grid columns on the same element. One class would
replace the layout created by the other. Nest the layouts instead:

```html
<main class="container">
  <div class="grid">
    <article>First card</article>
    <article>Second card</article>
  </div>
</main>
```

## Common mistakes

- Do not use `.container-fluid` when the content is mainly long prose. Full
  width can make lines difficult to follow.
- Do not put page gutters on every child. The container already owns the
  distance from the edge.
- Do not expect `.container` classes in the classless build.

## Related pages

- [Breakout](/utilities/breakout)
- [Grid](/layout/grid)
- [Row](/layout/row)
- [Landmarks](/layout/landmarks)
