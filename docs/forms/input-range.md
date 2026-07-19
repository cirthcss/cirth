# Input range

`[type="range"]` is restyled into a flat track with a circular thumb,
consistent across `-webkit-`, `-moz-`, and legacy `-ms-` pseudo elements.

<Demo src="input-range" />

```html
<input type="range" min="0" max="100" value="60">
```

## Behavior

* Track color: `--cirth-range-border-color`, growing to
  `--cirth-range-active-border-color` while active or focused.
* Thumb color: `--cirth-range-thumb-color`, switching to
  `--cirth-range-thumb-active-color` (the primary color) while active or
  focused, and scaling up slightly (`transform: scale(1.25)`) while being
  dragged.
