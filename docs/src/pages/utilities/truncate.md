---
layout: docs.njk
description: Shorten one overflowing line with an ellipsis while keeping the full text in the document.
---

# Truncate

Use `.truncate` when one non-critical line must stay within a fixed or limited
width, such as a file name in a compact list. The utility clips the visible end
and draws an ellipsis.

{% demo "truncate" %}

```html
<div class="file-row">
  <p class="truncate">annual-financial-report-approved-final.pdf</p>
</div>
```

```css
.file-row {
  max-width: 16rem;
}
```

## How it works

Cirth applies three declarations:

```css
.truncate {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
```

An ellipsis appears only when the element has less inline space than its text
requires. A parent width, grid track, or flex track must therefore constrain
it. In custom flex and grid layouts, a parent item may also need
`min-width: 0` so it is allowed to shrink.

The full string remains in the document. The ellipsis is a visual result of
CSS and is not inserted into the text.

The utility is available only in class-enabled builds.

## Accessibility and alternatives

Do not truncate the only visible version of information needed to identify an
item or make a decision. Some users cannot reveal clipped text with a pointer,
and a `title` tooltip is not a reliable replacement because it is difficult or
impossible to use in several input modes.

When the full value matters, show it in a nearby detail view, expose it through
an explicit expand control, or allow the line to wrap. Keep any accessible
name accurate and avoid duplicating the string in ways that make assistive
technology announce it twice.

## Common mistakes

- Do not expect an ellipsis without a constrained width.
- Do not apply the utility to multi-line prose. It intentionally forces one
  line.
- Do not truncate errors, instructions, totals, or other critical content.
- Do not use `title` as the only way to recover the full text.

## Related pages

- [Grid](/layout/grid)
- [Row](/layout/row)
- [Screen-reader only](/utilities/sr-only)
