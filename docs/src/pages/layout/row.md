---
layout: docs.njk
description: Lay out fields and controls in lines that always fill, wrapping by the width of their items, with one child across the whole width when needed.
---

# Row

Use `.row` for the fields of a form, a line of controls or any short set of
peers that should fill the line they sit on. The children share each line at
equal widths and wrap when the line has no room for another one.

{% demo "row" %}

```html
<div class="row">
  <label>First name<input name="given-name"></label>
  <label>Last name<input name="family-name"></label>
  <label>Email<input name="email" type="email"></label>
  <label class="full-line">Notes<textarea name="notes" rows="3"></textarea></label>
</div>
```

The wrapper controls presentation. The direct children retain their own HTML
meaning.

## Behavior

Every direct child starts from `12rem` and grows by the same amount, so a
line holds as many children as fit at `12rem` and they share it equally. The
next child wraps to a new line, and a child left alone fills its line. A row
narrower than `12rem` per child stacks them, one to a line. The row's own
width decides, not the viewport's, so a row inside a card or a sidebar
behaves the same way.

| Row width | Three fields |
| --- | --- |
| Under about 25rem | One per line |
| From about 25rem | Two, then the third across the line |
| From about 38rem | Three on one line |

Spacing comes from `--cirth-grid-column-gap` and `--cirth-grid-row-gap`.
Direct children receive `min-width: 0`, allowing long text or an inner
scroll container to shrink within its share.

`.row` is available only in class-enabled builds.

## A child across the whole width

Add `.full-line` to a direct child of `.row` to give it a line of its own:
notes after short fields, a validation summary, the line of actions at the
end of a form. The children before it fill their line, so nothing is left
empty beside them.

## Row or grid

Use [`.grid`](/layout/grid) for a collection of cards that should stay in
aligned columns. A row fills every line instead, so its items can be
different widths on different lines: three fields on one line and two on
the next are a third and a half wide.

## Changing the width items start from

```css
.address-fields {
  --cirth-row-min-column: 9rem;
}
```

A smaller value keeps more children on one line before they wrap; a larger
one wraps sooner. Change the gaps with `--cirth-grid-column-gap` and
`--cirth-grid-row-gap`.

## Common mistakes

- Do not use `.row` for a collection of cards that should line up. Use
  `.grid`.
- Do not set widths on every child just to make them equal. The row already
  shares each line equally.
- Do not combine `.row` with another layout class on the same element.

## Related pages

- [Grid](/layout/grid)
- [Container](/layout/container)
- [Forms](/forms/)
