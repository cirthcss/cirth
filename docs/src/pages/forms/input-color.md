---
layout: docs.njk
description: The native colour picker in Cirth. The swatch is reshaped to the framework's radius; the picker is the browser's own.
---

# Color input

`<input type="color">` keeps the browser's own picker. Cirth only reshapes
the swatch to its border radius, so it sits with the other fields.

{% demo "input-color" %}

```html
<label>
  Accent color
  <input type="color" name="accent" value="#0172ad">
</label>
```

## What changes

Only the swatch wrapper's padding and the swatch's own border and radius
(`::-webkit-color-swatch`, `::-moz-color-swatch` and their wrappers). The
picker that opens, its keyboard support and its value format are untouched.

## Accessibility

- Label it: the swatch alone does not say what the colour is for.
- The value is a hex string; if the reader needs to type an exact colour,
  offer a text field beside it.

## Tokens

The swatch follows `--cirth-border-radius`; the field around it reads the
shared [text input tokens](/forms/text-inputs#tokens).

## Related

- [Forms](/forms/), for labels and help text.
- [Colors](/colors), for the colour tokens themselves.
