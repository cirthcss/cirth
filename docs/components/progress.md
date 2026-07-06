# Progress

The native `<progress>` element is restyled with Cirth's own track/value
colors, including an animated indeterminate state.

<Demo src="progress" />

```html
<progress value="25" max="100"></progress>
<progress value="75" max="100"></progress>
<progress></progress> <!-- no value: indeterminate -->
```

## Behavior

- Track: `--cirth-progress-background-color`; value/bar:
  `--cirth-progress-color` (defaults to `--cirth-primary-background`).
- Cross-browser: the native appearance is reset and re-implemented via
  `::-webkit-progress-bar`/`::-webkit-progress-value` and
  `::-moz-progress-bar` so track/value colors stay consistent across
  engines.
- A `progress` with no `value` attribute is indeterminate: an animated
  gradient sweep, reversed in `[dir="rtl"]`, disabled entirely under
  `prefers-reduced-motion: reduce` (see
  [Reduce motion](/utilities/reduce-motion)).
