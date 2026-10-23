---
layout: docs.njk
description: Keep wide content inside the page with a keyboard-reachable, visibly focused horizontal scroll container.
---

# Overflow auto

Use `.overflow-auto` around content that may be wider than its container. A
wide table is the most common case. The wrapper scrolls when necessary instead
of making the whole page overflow.

{% demo "overflow-auto" %}

```html
<div class="overflow-auto"
     tabindex="0"
     role="region"
     aria-label="Feature comparison">
  <table>
    <thead>
      <tr>
        <th scope="col">Plan</th>
        <th scope="col">Storage</th>
        <th scope="col">Projects</th>
        <th scope="col">Support</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row">Team</th>
        <td>500 GB</td>
        <td>Unlimited</td>
        <td>Priority</td>
      </tr>
    </tbody>
  </table>
</div>
```

## Anatomy

The wrapper has four separate responsibilities:

- `.overflow-auto` sets `position: relative` and `overflow: auto`.
- `tabindex="0"` puts the scroll area in the normal keyboard tab order. Once
  focused, a keyboard user can reach content beyond the visible edge.
- `role="region"` identifies the wrapper as a navigable region for assistive
  technology.
- `aria-label` gives that region a concise accessible name. Use a distinct
  name when a page contains more than one scroll region.

If a visible heading already names the content, use `aria-labelledby`
instead of repeating the text:

```html
<h2 id="comparison-title">Feature comparison</h2>
<div class="overflow-auto"
     tabindex="0"
     role="region"
     aria-labelledby="comparison-title">
  <table>...</table>
</div>
```

`aria-labelledby` takes one or more element IDs and uses their text as the
accessible name. It creates no visible label of its own.

## Native browser behavior

`overflow: auto` creates a scroll container only when its contents overflow.
The browser supplies scrolling by touch, pointer, trackpad, and keyboard once
the container can receive focus. Scrollbars may remain hidden until scrolling
starts, depending on the operating system.

The ARIA attributes do not create scrolling or keyboard behavior. They only
describe the region to accessibility APIs.

## What Cirth adds

Cirth contains absolutely positioned descendants within the scroll area and
draws its standard focus outline on `:focus-visible`. The focus indicator
appears when keyboard interaction makes the wrapper itself the active element.

The utility is available only in class-enabled builds.

## When a named region is unnecessary

Do not add `role="region"` to every wrapper on a page. It can make landmark
navigation noisy. Use the named-region pattern when the overflow area is a
meaningful stop in its own right, especially when it must be keyboard
focusable. The table's own `<caption>` can still name the table; the wrapper
name tells the user what scrollable region received focus.

## Common mistakes

- Do not place `.overflow-auto` on the table itself. Wrap the table so its
  layout remains a table while the outer box handles scrolling.
- Do not remove `tabindex="0"` from a region that can overflow. Pointer and
  touch access alone do not make hidden content keyboard-operable.
- Do not use the same accessible name for several scroll regions.
- Do not rely on overflow as a substitute for responsive content design. Use
  it where the wide structure itself is necessary.

## Related pages

- [Table](/content/table)
- [Screen-reader only](/utilities/sr-only)
- [Print](/utilities/print)
