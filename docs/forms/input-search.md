# Input search

`[type="search"]` gets a search icon and, in the default build with classes
enabled, a fully rounded (`--cirth-radius-pill`) shape.

<Demo src="input-search" />

```html
<input type="search" placeholder="Search…">
```

When combined with `aria-invalid`, the search icon and the valid/invalid icon
are shown side by side (two background images) instead of the invalid icon
replacing the search icon. In `[dir="rtl"]`, the icon(s) mirror to the
opposite side. Pair it with [`role="search"`](/components/group) to add a
submit button alongside the field.
