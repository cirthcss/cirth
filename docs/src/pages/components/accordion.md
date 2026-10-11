---
layout: docs.njk
description: Build collapsible disclosures and exclusive accordions with native details and summary elements.
---

# Accordion

Use the native `details` and `summary` elements when a person should reveal or
hide a section of content. `summary` is the visible control; the remaining
children are the panel it controls.

{% demo "accordion" %}

```html
<details>
  <summary>Standard delivery</summary>
  <p>Three to five working days, with tracking.</p>
</details>

<details open>
  <summary>Express delivery</summary>
  <p>Next working day if ordered before 14:00.</p>
</details>
```

The `open` Boolean attribute provides the initial open state. The browser adds
or removes it when the summary is activated. JavaScript and an ARIA
`expanded` state are not required for this native pattern.

## One at a time

Give related `details` elements the same `name` to make an exclusive group.
Opening one member closes the other open member.

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
<details name="shipping">
  <summary>Collect in store</summary>
  <p>Ready within two hours.</p>
</details>
```

If the source marks several members of one named group as open, the browser
keeps only one open. Use exclusivity for alternative views or space management.
Avoid it when people need to compare several answers at once.

## Browser behavior

The browser makes `summary` keyboard-operable, manages the `open` state and
exposes the disclosure relationship to assistive technology. Keep `summary` as
the first child of `details` and put a concise description of the hidden
content inside it.

## Behavior

Cirth removes the platform marker and adds a theme-aware chevron. It rotates
when the disclosure opens. Each regular disclosure has a divider, a 44px
summary target, an outset focus ring and spacing below its revealed content.

Where `::details-content` and animatable intrinsic sizes are supported, Cirth
adds a sliding transition. Opening and closing remain functional without that
enhancement. Reduced-motion preferences remove the transition.

`details.dropdown` is excluded from the accordion surface rules because its
panel is positioned as a menu. See [Dropdown](/components/dropdown).

## Accessibility

- Write a summary that still makes sense when the panel is closed.
- Do not place another interactive control inside `summary`.
- Do not add `role="button"` or duplicate `aria-expanded` state to an ordinary
  native summary.
- Keep essential warnings visible if a reader might never open the disclosure.

## Tokens

| Token | What it sets |
| --- | --- |
| `--cirth-icon-chevron` | Disclosure marker |
| `--cirth-accordion-close-summary-color` | Closed summary text |
| `--cirth-accordion-open-summary-color` | Open summary text |
| `--cirth-accordion-active-summary-color` | Hovered or focused summary text |
| `--cirth-muted-border-color` | Divider |

## Common mistakes

- Putting the label outside `summary`, which leaves an unclear trigger.
- Adding click handlers that duplicate the native toggle.
- Using an exclusive group where several panels must remain open for
  comparison.

## Related

- [Dropdown](/components/dropdown)
- [Reduced motion](/guides/accessibility#reduced-motion)
