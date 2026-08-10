---
layout: docs.njk
---


# Loading

`aria-busy="true"` shows a small spinner and disables interaction, on any
element, including buttons, links, and plain text.

{% demo "loading" %}

```html
<button type="button" aria-busy="true">Loading…</button>
<button type="button" aria-busy="true" aria-label="Loading" class="secondary"></button>
<p aria-busy="true">Loading data…</p>
```

## Behavior

* The spinner is the `--cirth-icon-loading` SVG applied as a mask over
  `currentColor`, so it always matches the text it sits next to — on any
  button variant, card, or color scheme. Forced-colors mode paints it in a
  system color.
* Content with text gets the spinner prefixed with a small gap; empty
  content (like the second button above) centers the spinner alone.
* On `button`/`[type="submit"]`/`[type="button"]`/`[type="reset"]`/
  `[role="button"]`/`a`, `aria-busy="true"` also sets
  `pointer-events: none`, so a loading action can't be triggered twice.
* Button-like `input`s (`submit`/`button`/`reset`) can't render
  pseudo-elements, so they paint the spinner as a background icon at the
  line start instead.
* `select`, `textarea`, `html`, `form`, and text-field `input`s are
  excluded. This is a content/action affordance, not a spinner for form
  fields.
