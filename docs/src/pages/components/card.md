---
layout: docs.njk
description: Present self-contained content as a Cirth card with optional header and footer bands.
---

# Card

Cirth presents an `article` as a card. Use `article` for self-contained content
that could reasonably stand on its own, such as a release, product, message or
report summary.

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

`header` introduces the article, and `footer` holds information or actions that
close it. They are optional. Keep them as direct children when you want Cirth's
full-width section bands.

## Behavior

Cirth gives the article a raised surface, container edge, radius, padding and
card shadow. It rebinds `--cirth-surface`, so fields inside the card use the
card surface unless their own background token is set.

A direct `header` or `footer` extends across the card padding. Each uses
`--cirth-card-sectioning-background-color` and a separating border. Heading
spacing inside these bands is reduced to suit the compact section.

HTML does not add card interaction. If the whole card should navigate, use a
clear link in its content rather than placing unrelated controls inside one
large link.

## A flush card

For a source panel or specimen whose children provide their own padding, set
the card spacing tokens to zero:

```html
<article style="
  --cirth-block-spacing-horizontal: 0;
  --cirth-block-spacing-vertical: 0;
  --cirth-card-sectioning-background-color: transparent;
  --cirth-card-box-shadow: none;
">
  <header style="padding: var(--cirth-space-3)">Source</header>
  <pre><code>const ready = true;</code></pre>
</article>
```

The card still supplies its frame, radius and surface. The children supply the
interior spacing they need.

### The knob is the token, not the padding

Change `--cirth-block-spacing-horizontal` and
`--cirth-block-spacing-vertical` instead of setting `padding: 0` directly on
the article. The header and footer bleed is calculated from those tokens. A
direct padding override would leave the calculated negative margins out of
step with the card edge.

## Accessibility

- Use `article` only when its contents form a meaningful independent unit.
- Give repeated cards headings so readers can scan and navigate them.
- Keep action labels specific to their card. Repeated "Open" buttons are hard
  to distinguish out of context.
- Do not make nested buttons or links part of one wrapping link.

## Tokens

| Token | What it sets |
| --- | --- |
| `--cirth-card-background-color` | Card surface |
| `--cirth-card-border-color` | Outer and section edges |
| `--cirth-card-border-radius` | Card radius |
| `--cirth-card-box-shadow` | Card elevation |
| `--cirth-card-sectioning-background-color` | Header and footer bands |
| `--cirth-block-spacing-horizontal`, `--cirth-block-spacing-vertical` | Card padding and band bleed |

## Common mistakes

- Using `article` as a generic layout wrapper only to obtain the card style.
- Nesting the header, which prevents it from receiving the direct-child band
  style.
- Setting article padding directly while leaving the spacing tokens unchanged.

## Related

- [Section](/layout/section)
- [Typography](/content/typography)
- [Customization](/customization)
