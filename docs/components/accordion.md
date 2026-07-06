# Accordion

The native `<details>`/`<summary>` pair is styled as a collapsible accordion
item — no JavaScript, no ARIA widget required.

<Demo src="accordion" />

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

## Behavior

- The default disclosure triangle/marker is removed and replaced with a
  chevron icon (`--cirth-icon-chevron`) that rotates 90° when open.
- `summary` color: `--cirth-accordion-close-summary-color` when closed,
  `--cirth-accordion-open-summary-color` when open (and not focused),
  `--cirth-accordion-active-summary-color` on hover/focus.
- `summary[role="button"]` (a `details` used as a button-triggered
  accordion) becomes full width, left-aligned, with its own marker sizing.

`details.dropdown` is a related but distinct pattern — see
[Dropdown](/components/dropdown).
