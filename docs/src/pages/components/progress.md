---
layout: docs.njk
---


# Progress

The native `<progress>` element is restyled with Cirth's own track/value
colors, including an animated indeterminate state.

{% demo "progress" %}

```html
<label id="file-upload-label" for="file-upload-progress">File upload</label>
<progress id="file-upload-progress" aria-labelledby="file-upload-label" value="25" max="100">25%</progress>
<label id="data-import-label" for="data-import-progress">Data import</label>
<progress id="data-import-progress" aria-labelledby="data-import-label" value="75" max="100">75%</progress>
<label id="loading-results-label" for="loading-results-progress">Loading results</label>
<progress id="loading-results-progress" aria-labelledby="loading-results-label"></progress> <!-- no value: indeterminate -->
```

## Behavior

* Track: `--cirth-progress-background-color`; value/bar:
  `--cirth-progress-color` (defaults to `--cirth-primary-background` in
  light mode; dark mode uses a lighter amber step so the bar keeps a 3:1
  contrast against the track).
* Border: `--cirth-progress-border-color` outlines the track so the
  component's extent stays perceivable against the page background
  (WCAG 1.4.11); the track fill itself is deliberately subtle.
* Cross browser: the native appearance is reset and implemented again via
  `::-webkit-progress-bar`/`::-webkit-progress-value` and
  `::-moz-progress-bar` so track/value colors stay consistent across
  engines.
* A `progress` with no `value` attribute is indeterminate: an animated
  gradient sweep, reversed in `[dir="rtl"]`, disabled entirely under
  `prefers-reduced-motion: reduce` (see
  [Reduce motion](/utilities/reduce-motion)).
* For a measurement inside a known range rather than a task running to
  completion — disk used, a score, capacity — reach for
  [meter](/components/meter) instead. It is styled as this component's
  matched pair.
* Give every progress indicator an accessible name. The examples connect a
  visible `<label>` with both `for` and `aria-labelledby`, which remains
  robust in browser/screen-reader combinations that do not expose
  `<progress>` as a labelable element consistently. `aria-label` is a terse
  alternative when no visible label is appropriate. The numeric value is
  exposed by the native element; fallback text such as `25%` also helps
  older user agents.
