---
layout: docs.njk
description: Present a scalar measurement inside a known range with the native meter element and Cirth status colours.
---

# Meter

Use `meter` for a measurement within a known range, such as storage used,
capacity, a score or a quality reading.

{% demo "meter" %}

```html
<label>
  Storage used: 70%
  <meter value="0.7">70%</meter>
</label>

<label>
  Air quality: good, 9 of 10
  <meter value="9" min="0" max="10"
         low="3" high="7" optimum="9">9 of 10</meter>
</label>
```

The first meter uses the native default range from 0 to 1. The second declares
its range and thresholds. `low` and `high` divide the range into regions;
`optimum` tells the browser which part of the range is preferred.

## Meter or progress?

Use `progress` for a task moving toward completion, such as an upload. Use
`meter` for a reading whose position in a range has meaning. Reaching the end
of a meter may be good, bad or neutral. If the value has no known range,
neither element is appropriate.

## Behavior

The browser interprets `min`, `max`, `low`, `high`, `optimum` and `value`, then
classifies the value as optimum, suboptimal or even less good. Without
threshold attributes, the complete range is optimum.

Cirth resets the engine-specific appearance and gives meter the same width,
height, track and border geometry as [Progress](/components/progress). It maps
the three native regions to success, warning and error colours. The region is
implemented through the WebKit/Blink and Firefox meter pseudo-elements; your
HTML remains the same in every supported browser.

## Accessibility

The native element exposes its value and range to assistive technology. Keep a
visible label and a textual interpretation such as "good" or "70%" because
bar colour alone cannot explain whether the reading is desirable.

Text between the meter tags is fallback content for user agents that do not
render `meter`; it is not the visible label in supporting browsers.

## Tokens

| Token | What it sets |
| --- | --- |
| `--cirth-meter-background-color` | Track |
| `--cirth-meter-border-color` | Track edge |
| `--cirth-meter-optimum-color` | Preferred region value |
| `--cirth-meter-suboptimum-color` | Less preferred region value |
| `--cirth-meter-even-less-good-color` | Least preferred region value |

The background and edge default to the matching progress tokens.

## Common mistakes

- Using meter to show a task loading or uploading.
- Omitting `min` and `max` when the intended scale is not 0 to 1.
- Expecting `low` and `high` to explain which direction is good without a
  suitable `optimum` value.
- Communicating status only through colour.

## Related

- [Progress](/components/progress)
- [Range](/forms/input-range), for choosing a value.
- [Colors](/colors#states)
