---
layout: docs.njk
description: Use thematic breaks and native hidden states with the small normalization rules Cirth applies to them.
---

# Miscellaneous elements

Cirth normalizes two small pieces of native HTML: the `<hr>` thematic break
and the `hidden` attribute.

{% demo "misc" %}

```html
<section>
  <h2>Current plan</h2>
  <p>Team, billed monthly.</p>
  <hr>
  <h2>Payment method</h2>
  <p>Visa ending in 4242.</p>
</section>
```

## Thematic break

`<hr>` represents a change of subject or theme within the surrounding
content. It is not only a decorative line. Assistive technology may announce
it as a separator.

Cirth renders the element as a single border in
`--cirth-muted-border-color`. Content flow adds an element-sized step on both
sides. Use a CSS border on a layout wrapper when the line is purely visual and
does not represent a break in the content.

## Hidden content

The native `hidden` attribute tells the browser that an element is not
currently relevant. Cirth ensures an ordinary `[hidden]` element uses
`display: none`:

```html
<p id="saved-message" hidden>Your changes were saved.</p>
```

Application logic may remove the attribute when the message becomes relevant.
Do not use `hidden` for content that must remain available to screen readers;
use [`.sr-only`](/utilities/sr-only) for visually hidden accessible text.

`hidden="until-found"` is a separate browser feature. In supporting browsers,
the content remains available to find-in-page and can be revealed when a match
is found. Cirth deliberately excludes that value from its `display: none`
rule, so it does not disable the native feature. Projects that depend on the
feature should still test it against their own browser requirements.

## Common mistakes

- Do not use `<hr>` as a spacer between unrelated layout boxes.
- Do not use `hidden` to communicate a state while leaving an interactive
  descendant reachable.
- Do not combine `hidden` with CSS that forces the element to display.
- Do not assume `hidden="until-found"` behaves identically in every browser.

## Related pages

- [Screen-reader only](/utilities/sr-only)
- [Section](/layout/section)
- [Accessibility guide](/guides/accessibility)
