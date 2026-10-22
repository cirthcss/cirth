---
layout: docs.njk
description: Use a labelled native search input with Cirth's search icon and shared form states.
---

# Search input

Use `input type="search"` for a search query. It behaves much like a text
field, while browsers may add search-specific keyboard hints and a clear
control.

{% demo "input-search" %}

```html
<label>
  Search documentation
  <input type="search" name="q" placeholder="Buttons, forms, grid…">
</label>
```

`name="q"` identifies the query when the surrounding form is submitted. The
placeholder gives example topics; the label remains the field's accessible
name.

## Search forms

Wrap a site or application search in `<form role="search">` to create a search
landmark. Cirth also draws that form as a joined field and button; the full
pattern belongs to [Group](/components/group#search-group).

```html
<form role="search" aria-label="Documentation">
  <label class="sr-only" for="docs-query">Search documentation</label>
  <input id="docs-query" type="search" name="q">
  <button type="submit">Search</button>
</form>
```

Submitting, filtering results and announcing updates remain application
responsibilities.

## States

Cirth adds a search icon at the inline start of the field. With explicit
`aria-invalid`, the search icon and validation icon appear at opposite ends.
Both positions reverse in right-to-left documents. Focus, disabled and
read-only behavior is shared with [text inputs](/forms/text-inputs#states).

## Native behavior and Cirth styling

The browser owns text editing and any platform clear affordance. Cirth applies
the shared input surface, dimensions and states, then adds a decorative search
icon. The icon does not label the field.

## Accessibility

- Keep a label, even if the design visually hides it with
  [`.sr-only`](/utilities/sr-only).
- Use `role="search"` for the form landmark, not for the input itself.
- When results update without navigation, application code must announce the
  result count or other useful change without moving focus unexpectedly.

## Tokens

| Token | What it sets |
| --- | --- |
| `--cirth-icon-search` | Search icon for the current colour scheme |
| `--cirth-border-radius` | Shared field radius |

The remaining field values come from the
[text input tokens](/forms/text-inputs#tokens).

## Common mistakes

- Using the icon or placeholder as the only name.
- Adding `role="search"` to every search input instead of the containing form.
- Filtering a live result list without communicating the update.

## Related

- [Group](/components/group#search-group)
- [Nav](/components/nav), for search inside navigation.
