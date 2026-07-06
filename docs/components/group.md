# Group

`[role="group"]` (or `[role="search"]`) merges a row of form controls and
buttons into one visually joined control, without extra markup for the
joins. Default build only.

<Demo src="group" />

```html
<fieldset role="group">
  <input type="text" placeholder="Email" autocomplete="email">
  <button type="submit">Subscribe</button>
</fieldset>
```

## Search group

`role="search"` additionally pills the whole group (`--cirth-radius-pill`)
at both ends:

<Demo src="group-search" />

```html
<form role="search">
  <input type="search" name="search" placeholder="Search…">
  <button type="submit">Search</button>
</form>
```

## Behavior

- Children are laid out with `display: inline-flex`; adjoining corners are
  squared off so only the group's outer corners are rounded.
- Focusing any child raises it above its siblings (`z-index: 2`) and, where
  `:has()` is supported, recolors the whole group's box-shadow to match
  whichever child (button or input) is focused —
  `--cirth-group-box-shadow-focus-with-button` /
  `-focus-with-input`.
- A focused button's own box-shadow is suppressed in favor of the group's,
  so the ring doesn't double up.
