---
layout: docs.njk
---

# Meter

The native `<meter>` element is restyled to match
[progress](/components/progress) — same track, same border, same
geometry — while keeping the one thing a meter has that a progress bar
doesn't: a sense of whether the reading is any good.

{% demo "meter" %}

```html
<label>Storage used <meter value="0.7"></meter></label>

<label>Air quality
  <meter value="9" min="0" max="10" low="3" high="7" optimum="9"></meter>
</label>
```

## Meter or progress?

They look like siblings because they are, but they answer different
questions:

* `<progress>` is a **task** running to completion — a file uploading, a
  form submitting. It is finished when it reaches the end.
* `<meter>` is a **measurement inside a known range** — disk used, a
  score, a rating, capacity. Reaching the end may be excellent or
  alarming, depending on what is being measured.

That difference is why a meter can be colored by *where* the value falls
and a progress bar can't. If your value has no upper bound, or is not a
measurement at all, neither element applies.

## Behavior

* Track: `--cirth-meter-background-color`; border:
  `--cirth-meter-border-color`. Both default to progress's own tokens, so
  the two components stay a matched pair and re-theming one re-themes the
  other. The border is what marks the component's extent against the page
  (WCAG 1.4.11); the track fill itself is deliberately subtle.
* The value takes one of three colors, depending on which region it falls
  into once you have set `low` / `high` / `optimum`:

| Region | Variable | Light | Dark |
| --- | --- | --- | --- |
| Optimum | `--cirth-meter-optimum-color` | green | green |
| Suboptimal | `--cirth-meter-suboptimum-color` | amber | amber |
| Even less good | `--cirth-meter-even-less-good-color` | red | red |

* Those names are the HTML spec's own, and match the pseudo-elements each
  engine exposes (`::-webkit-meter-optimum-value` and friends).
* The hue is backed by weight: each step down the scale is also a darker
  color in the light scheme, and a lighter one in the dark scheme, so the
  same signal survives a reader who can't separate green from red. All
  three clear 3:1 against the track in both schemes.
* **A meter with no `low`/`high`/`optimum` is entirely optimum** — that is
  what the spec says — so it renders as one flat green bar. Set the
  thresholds if the reading has a good and a bad end.
* Cross browser: the native appearance is reset and rebuilt through
  `::-webkit-meter-*` in Chrome, Edge and Safari, and through
  `::-moz-meter-bar` plus the `:-moz-meter-*` pseudo-classes in Firefox,
  which is the only way Firefox exposes the three regions.
* Full width, like `<progress>` and the form controls. Give it a `width`
  of your own where it belongs inline — in a table cell, or beside a
  number.

## Accessibility

`<meter>` carries an implicit `meter` role and exposes its value to
assistive technology, but the *color* is the only thing that says whether
that value is good or bad. Color alone is not an accessible message
(WCAG 1.4.1), so put the reading in text next to the bar — a label, a
number, a word — rather than relying on the bar being red:

```html
<label>Air quality — poor (1 of 10)
  <meter value="1" min="0" max="10" low="3" high="7" optimum="9"></meter>
</label>
```

The element's own content (`<meter …>1 of 10</meter>`) is fallback for
browsers without `<meter>` support and is not shown otherwise, so it is
not a substitute for a visible label.
