---
layout: docs.njk
---


# Input range

`[type="range"]` is restyled into a flat track with a circular thumb,
using the WebKit/Blink and Firefox pseudo elements while retaining the native
input's keyboard, pointer, and value behavior.

{% demo "input-range" %}

```html
<input type="range" min="0" max="100" value="60">
```

## Behavior

* Track color: `--cirth-range-border-color`, growing to
  `--cirth-range-active-border-color` on hover, while active, or while focused.
* Thumb color: `--cirth-range-thumb-color`, strengthening to the secondary hover
  role on hover and switching to `--cirth-range-thumb-active-color` (the primary
  fill) while active or focused.
* The input keeps the shared 44 px control target while the visible thumb stays
  20 px. The thumb scales to `1.25` while being dragged, and keyboard focus adds
  the standard external focus ring.
* A disabled range uses the framework's disabled opacity and does not respond to
  pointer states.
