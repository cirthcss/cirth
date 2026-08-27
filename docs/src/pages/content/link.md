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

## Behavior

* Color and underline come from `--cirth-primary` /
  `--cirth-primary-underline` by default.
* `:hover`, `:active`, `:focus`, and `[aria-current]` (excluding
  `aria-current="false"`) switch to the `-hover` variants and force an
  underline.
* `:focus-visible` adds a focus ring in `--cirth-primary-focus`.
* `:visited` drops the accent for `--cirth-link-visited-color`, a neutral
  reading of the same palette, so a followed link in a long page shows as
  already read. It applies to content links only: entries inside `nav` or a
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
