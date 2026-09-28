---
layout: docs.njk
---


# Group

`.group` (or `[role="search"]`) merges a row of form controls and buttons
into one visually joined control, without extra markup for the joins.

**A `.group` class is required, on top of `role="group"`** (default build):
`[role="group"]` alone used to be the trigger, but that meant any element
grouped for pure accessibility reasons, including a plain `<fieldset
role="group">`, where the role is entirely redundant since a fieldset's
*implicit* role is already `group`, got hijacked into this decorative
layout it never asked for, making a semantic group and a decorative one
visually indistinguishable (WCAG 3.2.4, Consistent Identification). Keep
`role="group"` for the semantics and add `class="group"` for the layout
when you want both, as below. The classless build has no class to require,
so it keeps `[role="group"]` as its only opt-in, but still excludes
`fieldset` for the same reason.

{% demo "group" %}

```html
<fieldset class="group" role="group">
  <input type="text" placeholder="Email" autocomplete="email">
  <button type="submit">Subscribe</button>
</fieldset>
```

## Search group

`role="search"` makes the row a search landmark. It is drawn exactly as a
group is, with the control radius at both ends:

{% demo "group-search" %}

```html
<form role="search">
  <input type="search" name="search" placeholder="Search…">
  <button type="submit">Search</button>
</form>
```

## Behavior

* Children are laid out with `display: inline-flex`; adjoining corners are
  squared off so only the group's outer corners are rounded.
* Elements with `[hidden]` and `input[type="hidden"]` are ignored when the
  first and last visible controls are calculated, so hidden form metadata
  does not break the group's outer corners.
* Focusing any child raises it above its siblings (`z-index: 2`) and draws
  one ring around the whole group, in the colour the focused child would
  use on its own (the accent, `.secondary`, `.contrast`, or a validation
  state). The child draws none, so the ring does not overlap its
  neighbours.
* A `small` inside the group drops below the row as full-width helper
  text, wherever it sits in the markup, keeping the usual muted helper
  style; the control before a trailing `small` keeps the group's end
  rounding.
