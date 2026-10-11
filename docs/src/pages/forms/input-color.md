---
layout: docs.njk
description: Use the browser's native colour input with Cirth field styling and a rounded swatch.
---

# Color input

Use `input type="color"` when a person should choose a colour with the
platform picker.

{% demo "input-color" %}

```html
<label>
  Accent color
  <input type="color" name="accent" value="#0172ad">
</label>
```

`value` provides the initial colour and is submitted as a colour string. The
exact picker interface depends on the browser and operating system.

## Native behavior and Cirth styling

The browser owns the picker, keyboard interaction and returned value. Cirth
gives the input the shared field geometry, removes extra internal padding and
rounds the visible swatch. It styles the WebKit and Firefox swatch
pseudo-elements but does not restyle the picker window.

## Accessibility

- Keep a visible label that says what the colour controls.
- Do not rely on the swatch alone to communicate an exact value. Offer a text
  value or preview when precision matters.
- Validate the selected colour's contrast in the context where the application
  will use it. The input only chooses a colour.

## Tokens

The swatch radius is half of `--cirth-border-radius`. The outer field uses the
shared [text input tokens](/forms/text-inputs#tokens).

## Common mistakes

- Omitting `name`, which leaves the value out of form submission.
- Assuming every platform presents the same picker or colour controls.
- Treating a chosen colour as proof that text or controls will have sufficient
  contrast.

## Related

- [Forms](/forms/)
- [Colors](/colors), for Cirth colour tokens.
