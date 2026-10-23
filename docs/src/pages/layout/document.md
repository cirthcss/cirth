---
layout: docs.njk
description: The document-level reset, inherited typography, overflow protection, and stable scrollbar behavior supplied by Cirth.
---

# Document

Loading Cirth establishes a consistent baseline for the whole document. It
normalizes common browser differences, applies the base type and color tokens,
and makes sizing more predictable. No extra HTML class is required.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="/cirth.min.css">
    <title>Account settings</title>
  </head>
  <body>
    <main>
      <h1>Account settings</h1>
      <p>Update your profile and notification preferences.</p>
    </main>
  </body>
</html>
```

The `<html>` element is the document root. Most base values set there are
inherited by descendants, which means text and controls start from the same
font, line height, and color scheme.

## Browser behavior and Cirth's baseline

Browsers ship their own stylesheet for HTML. Those defaults are useful, but
some details differ across engines. Cirth keeps the native meaning and
interaction of the elements while normalizing these layout details:

- Every element and pseudo-element uses `box-sizing: border-box`, so declared
  width and height include padding and borders.
- Background images do not repeat unless another rule asks them to.
- Pseudo-elements inherit text decoration and vertical alignment.
- Long words may break instead of forcing the page wider than its viewport.
- Tab characters occupy four spaces.
- Mobile browsers keep the requested text size after an orientation change.
- The iOS tap highlight is transparent; keyboard focus indicators remain.

The document root also receives the active values of
`--cirth-background-color`, `--cirth-color`, `--cirth-font-family`,
`--cirth-font-size`, `--cirth-font-weight`, and `--cirth-line-height`.
Heading sizes scale independently; the root font size remains `100%` at every
viewport width.

## Scrollbar gutter

Cirth sets `scrollbar-gutter: stable` on the document root. On systems with a
classic scrollbar, the browser reserves its width even on short pages. The
page therefore does not shift horizontally when content begins to scroll or
when an open modal locks page scrolling.

Overlay scrollbars do not consume layout width. The browser handles that
difference as part of the native property.

If preserving the space on short pages is not appropriate for a project,
restore the browser default:

```css
:root {
  scrollbar-gutter: auto;
}
```

## Customization

Use root custom properties for document-wide changes instead of overriding
individual elements:

```css
:root {
  --cirth-font-family: Inter, system-ui, sans-serif;
  --cirth-line-height: 1.6;
}
```

See [Customization](/customization) for the cascade and token model.

In a scoped build, the baseline is limited to the `.cirth` wrapper and its
descendants. Document-wide application styles outside that wrapper remain in
control.

## Common mistakes

- Do not remove the viewport `<meta>` element on responsive pages. Cirth
  cannot correct the mobile layout viewport without it.
- Do not assume a CSS reset changes HTML semantics. The browser and assistive
  technologies still use the elements in the document.
- Do not edit the compiled stylesheet to change the base tokens. Add your own
  stylesheet after Cirth.

## Related pages

- [Typography](/content/typography)
- [Customization](/customization)
- [Modal](/components/modal)
