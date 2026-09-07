---
layout: docs.njk
---


# Card

Any `<article>` is a card: padded, with a background, box shadow, and
optional `header`/`footer` sections, with no `.card` class.

{% demo "card" %}

```html
<article>
  <header><strong>Card header</strong></header>
  <p>Any semantic content goes here.</p>
  <footer><button type="button">Action</button></footer>
</article>
```

## Behavior

* Background: `--cirth-card-background-color`; optional elevation:
  `--cirth-card-box-shadow` (flat by default); radius:
  `--cirth-card-border-radius`.
* A direct `header`/`footer` bleeds to the card's edges (negative margin
  cancels the card's own horizontal padding) and gets its own background,
  `--cirth-card-sectioning-background-color`, plus a border separating it
  from the body (`--cirth-card-border-color`).
* Cards stack with `--cirth-block-spacing-vertical` between them, matching
  [Section](/layout/section) rhythm.

## A flush card

A technical panel — a source listing under a title band, a comparison, a
specimen — usually wants the card's frame and none of its comfort: one
stroke, a title band with no tint, and cells that carry their own padding
right up to the edge. That is the same `<article>` with four token
overrides, not a different component:

```html
<article style="
  --cirth-block-spacing-horizontal: 0;
  --cirth-block-spacing-vertical: 0;
  --cirth-card-sectioning-background-color: transparent;
  --cirth-card-box-shadow: none;
">
  <header>Source</header>
  <pre>…</pre>
</article>
```

The card still supplies the frame, the radius, the surface, the hairline
under the header and the header's bleed to the card's edges. You supply the
padding inside the band and whatever grid the cells want. There is no
`.plate` or `.panel` class, because there is nothing left for one to do.

### The knob is the token, not the padding

Setting `padding: 0` on the `<article>` looks equivalent and is not. A
`header` or `footer` bleeds to the card's edges with a negative inline margin
of `--cirth-block-spacing-horizontal` — the token, not the element's actual
padding. Zero the padding directly and the token still reads `1.25rem`, so
the bands hang 19px outside the card on each side (20px of negative margin,
less the 1px border). Zero the token and everything stays aligned, because
the padding and the bleed are then reading the same number.

The same applies to anything else you want to re-time inside a card: move the
token, and the parts derived from it move with it.
