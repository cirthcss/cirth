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
the old `clip: rect(0,0,0,0)` hack.

`.sr-only-focusable` undoes the clipping on `:focus`/`:focus-within` but
deliberately **keeps the element out of normal flow**. Returning it to flow
is what used to make a skip link push the whole document down by its own
height the moment a keyboard reader pressed Tab — measured at 24px, on the
first interaction anyone has with the page. Because it is out of flow it is
painted over whatever is behind it, so the reveal brings a surface with it:
`--cirth-canvas`, `--cirth-ink`, the shared border radius, a padding step,
and `--cirth-z-index-fixed` so sticky chrome cannot swallow it.

Offsets are left at `auto`, so the element appears where it would have been
in the document, inside whatever positioned ancestor you already have. Where
a skip link *lands* is a page decision, and pinning one to the viewport
corner is one declaration:

```css
.skip-link:focus {
  position: fixed;
  inset-block-start: var(--cirth-space-3);
  inset-inline-start: var(--cirth-space-3);
}
```

That is the only rule this site adds to its own skip link.

Available only in the default build with classes enabled (`$enable-classes:
true`), not in the classless build.
