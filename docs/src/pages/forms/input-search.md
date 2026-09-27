---
layout: docs.njk
description: The search input in Cirth. A search icon and, in the default build, a pill shape.
---

# Search input

`<input type="search">` gets a search icon and, in the default build, a
fully rounded shape (`--cirth-radius-pill`), so it reads as a search box
rather than a form field.

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
| `--cirth-radius-pill` | The pill radius, default build only |

## Related

- [Group](/components/group) adds a submit button beside the field.
- [Nav](/components/nav), for a search box in a navigation bar.
