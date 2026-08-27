---
layout: docs.njk
---


# Overflow auto

`.overflow-auto` adds a scroll container around content that's wider than its
parent, most commonly a wide table, instead of letting it overflow the page.

{% demo "overflow-auto" %}

```html
<div class="overflow-auto" tabindex="0" role="region" aria-label="Feature comparison table">
  <table><!-- a table with many columns --></table>
</div>
```

It's a single declaration (`overflow: auto`), available only in the default
build with classes enabled. When the content actually overflows,
`tabindex="0"` is what makes the scroll container itself keyboard-reachable
(WCAG 2.1.1) — without it, a mouse or touch user can scroll but a keyboard
user can't. Skip the attribute only when you know the content never
overflows for anyone (there's nothing to scroll to reach).

Add a concise `aria-label` (and `role="region"`) when the table does not
already have enough nearby context. If a page contains multiple scrollable
regions, give each one a distinct name.
