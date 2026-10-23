---
layout: docs.njk
description: Use native file selection with a Cirth-styled selector button, accepted-type hints and upload guidance.
---

# File input

Use `input type="file"` to let a person select one or more local files for a
form submission or application upload.

{% demo "input-file" %}

```html
<label>
  Attachment
  <input type="file" name="attachment" accept=".pdf,image/*"
         aria-describedby="attachment-help">
  <small id="attachment-help">PDF or image, up to 10 MB.</small>
</label>
```

`accept` gives the browser a file-type hint for its picker. It is not a
security check. The application must verify file type, size and content after
selection and again at the upload boundary.

Add `multiple` when several files are allowed. Say so in the label or help
text, because picker interfaces differ across platforms.

## Native behavior and Cirth styling

The browser owns the picker, selected-file text and privacy protections around
local paths. Cirth leaves the input itself without a painted field box and
styles `::file-selector-button` as a secondary button. The entire input keeps
the shared 44px target height.

Hover and active states use the secondary control colours. Keyboard focus
draws `--cirth-secondary-focus` around the complete file input, not just the
internal button.

## Accessibility

- Provide a visible label and persistent type and size requirements.
- Report rejected files in text and connect the error to the input.
- Do not use `accept` as the only explanation of permitted files.
- If uploading starts after selection, expose progress with a labelled
  [progress](/components/progress) element.

## Tokens

| Token | What it sets |
| --- | --- |
| `--cirth-secondary-surface-active`, `--cirth-secondary-border-active` | Selector button on hover or press |
| `--cirth-secondary-focus` | Input focus ring |
| `--cirth-form-element-spacing-vertical`, `--cirth-form-element-spacing-horizontal` | Internal spacing |

## Common mistakes

- Trusting a filename extension or `accept` value on the server.
- Omitting `multiple` while telling the person to choose several files.
- Replacing the native input with a clickable element that has no keyboard or
  form behavior.

## Related

- [Forms](/forms/)
- [Button](/content/button)
- [Progress](/components/progress)
