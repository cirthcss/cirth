---
layout: docs.njk
---

# Document

The document layer is Cirth's reboot: a small set of opinionated resets
(based on normalize.css and sanitize.css) applied to every element, plus the
base document typography that everything else inherits from.

It has no markup requirements: it applies to `:root`/`:host` (or to the
scoped root, for the scoped build) and to every element universally.

## What it sets

* `box-sizing: border-box` on every element and pseudo element.
* Background images don't repeat by default.
* `text-decoration` and `vertical-align` are inherited through
  `::before`/`::after` pseudo elements.
* The root element gets the base font stack, size, weight, line height, and
  color from the active color scheme:

```css
:root {
  background-color: var(--cirth-background-color);
  color: var(--cirth-color);
  font-weight: var(--cirth-font-weight);
  font-size: var(--cirth-font-size);
  line-height: var(--cirth-line-height);
  font-family: var(--cirth-font-family);
}
```

* `--cirth-font-size` is a fixed `100%` at every breakpoint: sizes based on `rem`
  sizes (body text, 44px controls) don't drift with viewport width. Display
  type scales fluidly on its own, via `clamp()` in each heading's
  `--cirth-font-size` values.
* Words break instead of overflowing (`overflow-wrap: break-word`), tabs are
  4 spaces wide, and the iOS tap highlight and orientation change font
  resizing are disabled.

None of this is meant to be overridden one selector at a time. Tune it through
the tokens instead: `--cirth-font-family`, `--cirth-font-size`,
`--cirth-line-height`, `--cirth-background-color`, `--cirth-color`. See
[Customization](/customization).

## Scrollbar gutter

The document reserves the scrollbar's gutter permanently
(`scrollbar-gutter: stable`), so a page that scrolls is exactly as wide as
one that does not.

It is there for the [modal](/components/modal), which stops the page
scrolling while it is open: without a reserved gutter, hiding the overflow
would widen the content by a scrollbar's width and shift the whole layout.
Reserving it only while the dialog is open does not work — on platforms
with overlay scrollbars, where nothing was taking width in the first place,
that *causes* the shift instead of preventing it.

The cost lands on platforms with classic scrollbars, where a short page now
keeps an empty gutter it would not otherwise have. If you would rather have
it back:

```css
:root {
  scrollbar-gutter: auto;
}
```

Cirth sets it inside `:where()`, so a single declaration of your own wins.
