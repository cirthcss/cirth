---
layout: docs.njk
description: Checkboxes, radios, switches and segmented choices in Cirth, all built from native inputs with no extra markup.
---

# Checkbox, radio and switch

Checkboxes and radios are redrawn from scratch with their native behaviour
intact. `role="switch"` on a checkbox turns it into a toggle, and
`.segmented` on a fieldset of radios turns it into a joined choice. None of
them needs extra markup.

{% demo "checkbox-radio-switch" %}

```html
<label><input type="checkbox" name="terms" checked> I accept the terms</label>

<fieldset>
  <legend>Delivery</legend>
  <label><input type="radio" name="delivery" value="standard" checked> Standard</label>
  <label><input type="radio" name="delivery" value="express"> Express</label>
</fieldset>

<label><input type="checkbox" role="switch" checked> Email notifications</label>
```

## The mark

A checkbox and a radio are a 24px box, which is the target a pointer or a
finger has to hit, with a 20px mark drawn inside it: the outer band is part
of the target and is not painted. The mark sits on the capital height of the
first line of its label, and a label that wraps lines its later lines up
under its first word rather than under the mark.

## States

- **Checked** checkboxes take the primary fill (`--cirth-primary-surface`)
  and a check mark; an **indeterminate** checkbox shows a dash instead.
- **Checked radios** take the same fill with a dot in the label colour
  (`--cirth-primary-on-surface`). The dot is the selection's shape, so a
  checked radio differs from an unchecked one without relying on colour.
- **Hover**, with a mouse or trackpad, moves an unchecked mark's edge toward
  the ink and brings up a faint wash; a checked one takes the accent's hover
  step. A label under the pointer counts as its control.
- **Focus** draws the ring every control draws, 2px off the mark. A radio
  shows it whenever it has focus, because Safari does not report keyboard
  focus on a radio its arrow keys moved to; in Chrome and Firefox a radio
  you click therefore shows the ring too, until focus moves on.
- **Disabled** marks take the disabled wash, a separator edge and, checked,
  the disabled ink for the mark or the dot.
- A **switch** is a pill-shaped track with a thumb. The track uses
  `--cirth-switch-background-color`, and `--cirth-switch-checked-background-color`
  when on.
- `aria-invalid="true"` and `"false"` recolour the checked state like any
  other field; see [Validation and states](/forms/validation).
- A `label` holding a checkbox or radio gets a pointer cursor and sizes to
  its content instead of filling the row.

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

- The radios are not hidden. Arrow keys move the selection, the checked
  value submits with the form, and assistive technology announces a radio
  group named by the `legend`.
- The selected segment takes the primary button's fill, and its radio
  becomes a ring and a dot in the label colour on it, so the selection does
  not depend on colour. In forced-colors mode, where the fill is removed,
  the dot and the segment borders remain.
- Keyboard focus draws an outline around the whole segment, outside the
  fill.
- Each segment is at least 44px tall, like a button. A disabled radio fades
  its segment.
- Class-based builds only. In the classless build a `fieldset` always stays
  a plain group.

## Accessibility

- Put every checkbox and radio inside its `label`, so the text is part of
  the click target. If you lay such a label out with `display: flex` or
  `grid`, set `padding-inline-start: 0` and `text-indent: 0` on it: the
  hanging indent is for a label that is a block of text.
- Group radios, and related checkboxes, in a `fieldset` with a `legend`
  that asks the question.
- A switch is for a setting that applies immediately; a checkbox is for a
  choice submitted with a form. `role="switch"` makes screen readers
  announce "on" and "off" instead of "checked".
- If you change the switch's thumb colour, keep it at 3:1 or more against
  both track colours (WCAG 1.4.11).

## Tokens

| Token | What it sets |
| --- | --- |
| `--cirth-primary-surface`, `--cirth-primary-border` | Checked fill and edge |
| `--cirth-icon-checkbox`, `--cirth-icon-minus` | Check mark and indeterminate dash |
| `--cirth-switch-background-color` | Switch track, off |
| `--cirth-switch-checked-background-color` | Switch track, on |
| `--cirth-switch-color` | Switch thumb; defaults to `--cirth-primary-on-surface` |

## Related

- [Forms](/forms/), for fieldsets and legends.
- [Select](/forms/select), for a choice among many options.
