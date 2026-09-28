---
layout: docs.njk
description: The search input in Cirth. A field like any other, marked by a search icon.
---

# Search input

`<input type="search">` is a field like any other, with the same edge,
height and radius, and a search icon at its start. The icon is what says
search, so the field stays in step with every other control when a theme
moves the radius.

{% demo "input-search" %}

```html
<label>
  Search
  <input type="search" name="q" placeholder="Search the docs…">
</label>
```

## States

- With `aria-invalid`, the search icon and the valid or invalid icon show
  side by side instead of one replacing the other.
- Under `[dir="rtl"]` the icons move to the other side.
- The rest (focus, disabled, read-only) is shared with
  [text inputs](/forms/text-inputs#states).

## Accessibility

- A search form should be a landmark. `<form role="search">` is one, and
  Cirth draws it as a joined field and button; see [Group](/components/group).
- Keep a label, even a visually hidden one with
  [`.sr-only`](/utilities/sr-only), when the placeholder is the only visible
  text.

## Tokens

| Token | What it sets |
| --- | --- |
| `--cirth-icon-search` | The search icon, one per colour scheme |
| `--cirth-border-radius` | The control radius, shared with every field |

## Related

- [Group](/components/group) adds a submit button beside the field.
- [Nav](/components/nav), for a search box in a navigation bar.
