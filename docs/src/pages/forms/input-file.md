---
layout: docs.njk
description: The file input in Cirth. The selector button is styled as a secondary button; the rest of the control stays native.
---

# File input

`<input type="file">` keeps the browser's control. Only its
`::file-selector-button` is styled, as a secondary [button](/content/button),
so the part that acts reads as a control and the file name beside it reads
as text.

{% demo "input-file" %}

```html
<label>
  Attachment
  <input type="file" name="attachment">
</label>
```

## States

The input has no border or background of its own. On the selector button,
hover and active use `--cirth-secondary-surface-active` and
`--cirth-secondary-border-active`, and keyboard focus draws a ring in
`--cirth-secondary-focus`.

## Accessibility

- Label it, and say which file types and sizes you accept in help text;
  `accept` narrows the picker but does not explain itself.
- Add `multiple` when several files are allowed, and say so in the label.

## Tokens

| Token | What it sets |
| --- | --- |
| `--cirth-secondary-surface-active`, `--cirth-secondary-border-active` | The selector button, hovered and pressed |
| `--cirth-secondary-focus` | Its focus ring |
| `--cirth-form-element-spacing-vertical`, `-horizontal` | Its padding |

## Related

- [Button](/content/button), for the secondary variant.
- [Forms](/forms/).
