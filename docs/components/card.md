# Card

Any `<article>` is a card: padded, with a background, box-shadow, and
optional `header`/`footer` sections — no `.card` class.

<Demo src="card" />

```html
<article>
  <header><strong>Card header</strong></header>
  <p>Any semantic content goes here.</p>
  <footer><button type="button">Action</button></footer>
</article>
```

## Behavior

- Background: `--cirth-card-background-color`; shadow:
  `--cirth-card-box-shadow` (defaults to `--cirth-box-shadow`); radius:
  `--cirth-border-radius`.
- A direct `header`/`footer` bleeds to the card's edges (negative margin
  cancels the card's own horizontal padding) and gets its own background,
  `--cirth-card-sectioning-background-color`, plus a border separating it
  from the body (`--cirth-card-border-color`).
- Cards stack with `--cirth-block-spacing-vertical` between them, matching
  [Section](/layout/section) rhythm.
