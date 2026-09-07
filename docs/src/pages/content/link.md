---
layout: docs.njk
---


# Link

Links are styled by tag: `a` (excluding `[role="button"]`) and any element
with `role="link"`, plus two class modifiers for the secondary and contrast
color groups.

{% demo "links" %}

```html
<a href="#">Primary link</a>
<a href="#" class="secondary">Secondary link</a>
<a href="#" class="contrast">Contrast link</a>
```

The second paragraph of that example is the `:visited` state, and it is the
one state on this page that cannot be mocked up: a browser paints it only
for a link you have really followed, and reports the unvisited colour to
`getComputedStyle` so a page cannot read it back. So the example does the
only honest thing — it asks you to follow the link and return — and prints
the token's own colour beside it, which is always visible.

If the followed link still looks unvisited when you come back, the browser
is suppressing the state rather than Cirth failing to style it. Safari does
this unconditionally. Chromium partitions visited state from 136 onward: a
link is painted as visited only when *this* page is where you followed it
from, so arriving at a page whose links you have opened from somewhere else
shows none of them as visited. Firefox still applies it globally.

## Behavior

* Color and underline come from `--cirth-primary` /
  `--cirth-primary-underline` by default.
* `:hover`, `:active`, `:focus`, and `[aria-current]` (excluding
  `aria-current="false"`) switch to the `-hover` variants and force an
  underline.
* `:focus-visible` adds a focus ring in `--cirth-primary-focus`.
* `:visited` drops the accent for `--cirth-link-visited-color`, an
  achromatic grey at the same lightness as the accent, so a followed link in
  a long page shows as spent. Zero chroma on purpose: a *cool* grey read as
  a cold cast against the warm paper canvas, and against a warm accent it
  was a hue change at nearly the same lightness — the weakest available way
  to say "you have been here". It applies to content links only: entries inside `nav` or a
  dropdown menu keep their color, since a menu that grays out one item at a
  time as the reader browses looks broken rather than oriented. `.secondary`
  and `.contrast` links stay in their own color group too, as do the states
  above.
* `a[role="button"]` opts out of link styling and receives
  [Button](/content/button) styling for backward compatibility. Do not use
  it for navigation: changing the role hides the link semantics, while the
  anchor still lacks a button's Space-key behavior. Prefer an ordinary link
  for a destination and a native `<button>` for an action.

Likewise, `role="link"` changes only semantics and styling. A non-anchor
custom link still needs `tabindex="0"`, keyboard activation, and navigation
logic supplied by the application. Native `<a href>` remains the reliable
default.

The underline keeps its unvisited tint on a visited link, and that is not an
oversight: browsers let `:visited` change `color` (plus background, border,
and outline colors) and ignore every other property, including
`text-decoration-color`, so that a page can't work out where you have been.
For the same reason the visited color is invisible to scripts:
`getComputedStyle` reports the unvisited one.

## Modifiers

`.secondary` and `.contrast` swap the color group the same way they do for
[buttons](/content/button). They are available only in the default build with
classes enabled.
