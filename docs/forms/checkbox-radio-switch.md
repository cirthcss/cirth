# Checkbox, radio, switch

`[type="checkbox"]` and `[type="radio"]` are restyled from scratch
(`appearance: none`) with custom check/dash icons; adding `role="switch"` to
a checkbox turns it into a toggle switch with no extra markup.

<Demo src="checkbox-radio-switch" />

```html
<label><input type="checkbox" checked> Checked</label>
<label><input type="radio" name="r" checked> Option A</label>
<label><input type="checkbox" role="switch" checked> Enable notifications</label>
```

## Behavior

* Checked state uses `--cirth-primary-background` and the matching border token,
  plus an inline check icon (`--cirth-icon-checkbox`); an indeterminate checkbox shows
  a dash (`--cirth-icon-minus`) instead.
* Radios are checked with a filled inner circle instead of an icon.
* A `[type="checkbox"][role="switch"]` becomes a pill shaped toggle: track
  color from `--cirth-switch-background-color` /
  `--cirth-switch-checked-background-color`, thumb color from
  `--cirth-switch-color`.
* `aria-invalid="true"`/`"false"` recolor the checked state the same way as
  other form elements (see [Forms overview](/forms/)).
* A `label` that contains a checkbox/radio becomes `cursor: pointer` and
  sizes itself to its content instead of stretching full width.
