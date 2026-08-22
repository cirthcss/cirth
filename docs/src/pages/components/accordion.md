---
layout: docs.njk
---


# Accordion

The native `<details>`/`<summary>` pair is styled as a collapsible accordion
item, with no JavaScript and no ARIA widget required.

{% demo "accordion" %}

```html
<details>
  <summary>Accordion item 1</summary>
  <p>Content for the first item.</p>
</details>
<details open>
  <summary>Accordion item 2 (open by default)</summary>
  <p>Content for the second item.</p>
</details>
```

## One at a time

Give a group of `details` the same `name` and the browser makes them
mutually exclusive: opening one closes the others. No JavaScript, no
`aria-expanded` bookkeeping — the state lives in the elements, and the
accessibility tree follows it for free.

{% demo "accordion-exclusive" %}

```html
<details name="shipping" open>
  <summary>Standard delivery</summary>
  <p>Three to five working days.</p>
</details>
<details name="shipping">
  <summary>Express delivery</summary>
  <p>Next working day if ordered before 14:00.</p>
</details>
```

Two things worth knowing before reaching for it: if several members of a
group carry `open`, only the first stays open, and an exclusive accordion
means a reader cannot compare two answers side by side. Use it when the
options are alternatives, not when they are a checklist.

## Behavior

* The default disclosure triangle/marker is removed and replaced with a
  chevron icon (`--cirth-icon-chevron`) that rotates 90° when open.
* `summary` color: `--cirth-accordion-close-summary-color` when closed,
  `--cirth-accordion-open-summary-color` when open (and not focused),
  `--cirth-accordion-active-summary-color` on hover/focus.
* `summary[role="button"]` (a `details` used as an accordion triggered by a
  button) becomes full width, aligned left, with its own marker sizing.
* Grouping with `name` needs nothing from Cirth: the styling is per item,
  so exclusivity is the browser's business and works with everything on
  this page.

`details.dropdown` is a related but distinct pattern; see
[Dropdown](/components/dropdown).
