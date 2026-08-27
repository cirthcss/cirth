---
layout: docs.njk
---


# Loading

`aria-busy="true"` shows a small spinner and tells assistive technology that
an element is being updated. It can be used on buttons, links, and plain
text, but it does not disable an action by itself.

{% demo "loading" %}

```html
<button type="button" aria-busy="true" disabled>Loading…</button>
<button type="button" aria-busy="true" aria-label="Loading" class="secondary" disabled></button>
<p aria-busy="true">Loading data…</p>
```

## Behavior

* The spinner is the `--cirth-icon-loading` SVG applied as a mask over
  `currentColor`, so it always matches the text it sits next to — on any
  button variant, card, or color scheme. Forced-colors mode paints it in a
  system color.
* Content with text gets the spinner prefixed with a small gap; empty
  content (like the second button above) centers the spinner alone.
* `aria-busy` is a status, not a disabled state. If a native button must not
  run twice, add its `disabled` property while the action is pending and
  remove it when the action finishes. For a custom control, use
  `aria-disabled="true"` and make its JavaScript ignore both pointer and
  keyboard activation. CSS alone cannot make that behavior consistent.
* Button-like `input`s (`submit`/`button`/`reset`) can't render
  pseudo-elements, so they paint the spinner as a background icon at the
  line start instead.
* `select`, `textarea`, `html`, `form`, and text-field `input`s are
  excluded. This is a content/action affordance, not a spinner for form
  fields.
