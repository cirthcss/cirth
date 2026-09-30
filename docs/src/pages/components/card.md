---
layout: docs.njk
---


# Card

Any `<article>` is a card: a raised surface with the container edge,
padding, and optional `header`/`footer` bands, with no `.card` class.

{% demo "card" %}

```html
<article>
  <header>
    <strong>Release 4.18.2 is ready</strong>
  </header>
  <p>The checkout service passed every check on staging.</p>
  <dl>
    <dt>Build</dt>
    <dd><code>4.18.2+a91c3e0</code></dd>
    <dt>Checks</dt>
    <dd>212 passed, 0 failed</dd>
  </dl>
  <footer>
    <p>
      <button type="button">Promote</button>
      <button type="button" class="secondary">View changes</button>
    </p>
  </footer>
</article>
```

## Behavior

* Background: `--cirth-card-background-color`; elevation:
  `--cirth-card-box-shadow`, one faint contact layer by default and none in
  `material` and `metro`; radius: `--cirth-card-border-radius`.
* A direct `header`/`footer` bleeds to the card's edges (negative margin
  cancels the card's own horizontal padding) and gets its own background,
  `--cirth-card-sectioning-background-color`, plus a border separating it
  from the body (`--cirth-card-border-color`).
* Two cards in a row of the flow are a group step apart
  (`--cirth-flow-group`): each is a group of content. Nothing inside a card
  carries a margin of its own, so its padding is exactly its edge.

## A flush card

A technical panel (a source listing under a title band, a comparison, a
specimen) usually wants the card's frame and none of its comfort: one
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
of `--cirth-block-spacing-horizontal`: the token, not the element's actual
padding. Zero the padding directly and the token still reads `1.25rem`, so
the bands hang 19px outside the card on each side (20px of negative margin,
less the 1px border). Zero the token and everything stays aligned, because
the padding and the bleed are then reading the same number.

The same applies to anything else you want to re-time inside a card: move the
token, and the parts derived from it move with it.
