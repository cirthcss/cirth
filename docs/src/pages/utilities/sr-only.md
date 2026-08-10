---
layout: docs.njk
---


# Screen-reader only

`.sr-only` visually hides content while keeping it in the accessibility
tree — for labels and context sighted users don't need but assistive
technology does (an icon-only button's accessible name, extra context
before a link, table captions, and so on).

{% demo "sr-only" %}

```html
<button aria-label="Close">
  <span class="sr-only">Close</span>
  &times;
</button>
```

## `.sr-only-focusable`

Combine with `.sr-only` on the same element to hide it until keyboard or
assistive-technology focus reaches it — the standard "skip to content"
link pattern. Tab into the demo above to see it appear.

```html
<a href="#main" class="sr-only sr-only-focusable">Skip to content</a>
```

## Behavior

`.sr-only` shrinks the element to a 1×1px box, clips it with
`clip-path: inset(50%)`, and prevents wrapping — the modern equivalent of
the old `clip: rect(0,0,0,0)` hack. `.sr-only-focusable` reverses all of
that on `:focus`/`:focus-within`.

Available only in the default build with classes enabled (`$enable-classes:
true`), not in the classless build.
