---
layout: docs.njk
description: Mark a Cirth control or content region as busy with aria-busy and a visible loading indicator.
---

# Loading

Set `aria-busy="true"` while an element is being updated. Cirth adds a visible
spinner, while the ARIA state tells assistive technology that the content is
not ready.

{% demo "loading" %}

```html
<button type="button" aria-busy="true" disabled>
  Saving…
</button>

<button type="button" class="secondary" aria-busy="true"
        aria-label="Saving" disabled></button>

<section aria-busy="true" aria-label="Account activity">
  <p>Loading recent activity…</p>
</section>
```

`aria-busy` communicates status but does not prevent activation. The buttons
also use the native `disabled` attribute so they cannot be submitted twice.
Remove `disabled` and set `aria-busy="false"`, or remove the ARIA attribute,
when the operation finishes.

## Behavior

Cirth adds `--cirth-icon-loading` before non-empty busy content. Empty content
centres the spinner, so it needs an `aria-label` such as the second button's.
The icon uses the current text colour and a system colour in forced-colours
mode.

Button-like `input` elements cannot render pseudo-elements, so they receive the
spinner as a background image. Text inputs, `select`, `textarea`, `html` and
`form` are excluded from this component.

The spinner continues to move under a reduced-motion preference because its
motion communicates an active process. Other Cirth transitions around it are
reduced normally.

## Browser and application responsibility

Assistive technologies may defer announcements from a busy region until the
state becomes false. Application code must set and clear the state, prevent
duplicate work where necessary, replace the pending content and report any
failure. Cirth only supplies the spinner and respects the ARIA state.

## Accessibility

- Keep visible status text when space permits.
- Give an icon-only busy control an accessible name.
- Disable a native action if activating it again would be unsafe.
- Do not leave `aria-busy="true"` after success or failure.
- For a task with measurable completion, use a labelled
  [progress](/components/progress) element instead.

## Tokens

| Token | What it sets |
| --- | --- |
| `--cirth-icon-loading` | Spinner artwork |
| `--cirth-spacing` | Gap between spinner and text |

## Common mistakes

- Treating `aria-busy` as a disabled state.
- Removing all text without adding an accessible name.
- Using an indefinite spinner when meaningful progress is available.

## Related

- [Progress](/components/progress)
- [Validation and states](/forms/validation)
- [Reduced motion](/guides/accessibility#reduced-motion)
