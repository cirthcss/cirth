---
layout: docs.njk
description: Hide explanatory text visually while keeping it available to assistive technology, or reveal it when it receives focus.
---

# Screen-reader only

Use `.sr-only` for text that should remain in the accessibility tree but does
not need to be visible. An icon-only button is a common example:

{% demo "sr-only" %}

```html
<button type="button">
  <span aria-hidden="true">&times;</span>
  <span class="sr-only">Close</span>
</button>
```

The multiplication symbol is visible but hidden from assistive technology.
The `.sr-only` text supplies the button's accessible name. Keep the visible
icon and hidden label inside the same button so they activate one control.

## What the utility does

`.sr-only` reduces the element to a one-pixel box, positions it outside normal
layout, clips its paint, and prevents wrapping. The text remains in the
document and in the accessibility tree.

This differs from `hidden`, `display: none`, and `visibility: hidden`, which
normally remove content from the accessibility tree as well as the screen.

The utility is available only in class-enabled builds.

## Focusable content

Combine `.sr-only` with `.sr-only-focusable` when a control should remain
hidden until it or one of its descendants receives focus. The standard use is
a skip link:

```html
<a href="#main" class="sr-only sr-only-focusable">Skip to main content</a>

<main id="main" tabindex="-1">
  <h1>Dashboard</h1>
</main>
```

The link appears when a keyboard user tabs to it. Activating the link moves to
the target identified by `#main`. `tabindex="-1"` lets script or fragment
navigation focus a target that should not become an extra stop in the normal
Tab sequence.

Cirth keeps the revealed link absolutely positioned, so it does not push the
page downward. It adds the canvas color, text color, padding, radius, and a
fixed-level stacking order so the label is readable over nearby content.

Insets remain automatic. Position a site-wide skip link explicitly when it
should appear in a viewport corner:

```css
.skip-link:focus {
  position: fixed;
  inset-block-start: var(--cirth-space-3);
  inset-inline-start: var(--cirth-space-3);
}
```

## Choosing visible or hidden text

Prefer a visible label whenever it can help everyone. Use `.sr-only` for
concise names or context that would otherwise duplicate an unmistakable
visual label. Do not hide instructions, errors, or state changes that sighted
keyboard and low-vision users also need.

If `aria-label` already provides the complete name, adding identical hidden
text is unnecessary. Hidden text is often preferable when it should be
translated and maintained with the visible markup.

## Common mistakes

- Do not put interactive descendants inside a plain `.sr-only` wrapper. A
  focusable control must become visible on focus.
- Do not use `.sr-only` for content that should be unavailable to every user.
  Use `hidden` instead.
- Do not hide important validation messages only from sighted users.
- Do not create a skip link whose target ID does not exist.
- Do not remove the focused reveal's readable surface without checking it
  against every background beneath it.

## Related pages

- [Miscellaneous elements](/content/misc#hidden-content)
- [Button](/content/button)
- [Accessibility guide](/guides/accessibility)
