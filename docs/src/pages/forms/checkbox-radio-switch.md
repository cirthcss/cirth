---
layout: docs.njk
---


# Checkbox, radio, switch

`[type="checkbox"]` and `[type="radio"]` are restyled from scratch
(`appearance: none`) with custom check/dash icons; adding `role="switch"` to
a checkbox turns it into a toggle switch with no extra markup.

{% demo "checkbox-radio-switch" %}

```html
<label><input type="checkbox" checked> Checked</label>
<label><input type="radio" name="r" checked> Option A</label>
<label><input type="checkbox" role="switch" checked> Enable notifications</label>
```

## Behavior

* Checked state uses `--cirth-primary-surface` and the matching border token,
  plus an inline check icon (`--cirth-icon-checkbox`); an indeterminate checkbox shows
  a dash (`--cirth-icon-minus`) instead.
* Radios are checked with a filled inner circle instead of an icon.
* A `[type="checkbox"][role="switch"]` becomes a pill shaped toggle: track
  color from `--cirth-switch-background-color` /
  `--cirth-switch-checked-background-color`, thumb color from
  `--cirth-switch-color`, which defaults to `--cirth-primary-on-surface` (the
  same token buttons use for their text) rather than a fixed white: keep
  the two in sync if you customize `--cirth-primary-on-surface`, and recheck
  contrast (WCAG 1.4.11, >= 3:1) against both `--cirth-switch-background-color`
  and `--cirth-switch-checked-background-color` if you do.
* `aria-invalid="true"`/`"false"` recolor the checked state the same way as
  other form elements (see [Forms overview](/forms/)).
* A `label` that contains a checkbox/radio becomes `cursor: pointer` and
  sizes itself to its content instead of stretching full width.

## Segmented choice

A compact single choice, drawn as joined segments, that is still an ordinary
radio group. Add `class="segmented"` to a `fieldset` whose `legend` names the
choice and whose labels each wrap one radio:

{% demo "segmented" %}

```html
<fieldset class="segmented">
  <legend>View</legend>
  <label><input type="radio" name="view" value="list" checked> List</label>
  <label><input type="radio" name="view" value="grid"> Grid</label>
  <label><input type="radio" name="view" value="map" disabled> Map</label>
</fieldset>
```

* The radios are not hidden. Arrow keys move the selection, the checked
  value submits with the form, and assistive technology announces a radio
  group named by the `legend`.
* The selected segment takes the primary button's fill, and its radio keeps
  its dot, so the selection does not depend on colour. In forced-colors mode,
  where the fill is removed, the dot and the segment borders remain.
* Keyboard focus draws an outline around the whole segment, outside the fill.
* Each segment is at least 44px tall, like a button. A disabled radio fades
  its segment once.
* Class-based builds only. The classless build has no opt-in, so a
  `fieldset` there always stays a plain group.
