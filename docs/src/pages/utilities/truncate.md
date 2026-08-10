---
layout: docs.njk
---


# Truncate

`.truncate` clips a single line of text that overflows its container and
adds an ellipsis, instead of letting it wrap or spill out.

{% demo "truncate" %}

```html
<p class="truncate">
  This line of text is much longer than its container, so it truncates
  with an ellipsis.
</p>
```

It's three declarations (`overflow: hidden`, `white-space: nowrap`,
`text-overflow: ellipsis`), available only in the default build with
classes enabled.
