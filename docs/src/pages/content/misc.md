---
layout: docs.njk
---


# Misc

A small set of remaining resets: `hr` and `[hidden]`.

{% demo "misc" %}

```html
<p>Paragraph before the divider.</p>
<hr>
<p>Paragraph after the divider.</p>
```

* `hr`: a single top border in `--cirth-muted-border-color`, the separator
  edge, an element step from the blocks on either side of it.
* `[hidden]`: `display: none`, except `hidden="until-found"`: Chrome/Edge's
  find-in-page-revealed hidden state is deliberately left alone rather than
  overridden.
