# Loading

`aria-busy="true"` shows a small spinner and disables interaction, on any
element — buttons, links, or plain text.

<Demo src="loading" />

```html
<button type="button" aria-busy="true">Loading…</button>
<button type="button" aria-busy="true" class="secondary"></button>
<p aria-busy="true">Loading data…</p>
```

## Behavior

- The spinner is a background SVG (`--cirth-icon-loading`), inverted to
  white on colored buttons unless the theme's `primary-inverse` isn't white
  (see the `$loading-icon-inverse` build flag in `src/theme/_styles.scss`).
- Non-empty content gets the spinner prefixed with a small gap; empty
  content (like the second button above) centers the spinner alone.
- On `button`/`[type="submit"]`/`[type="button"]`/`[type="reset"]`/
  `[role="button"]`/`a`, `aria-busy="true"` also sets
  `pointer-events: none`, so a loading action can't be triggered twice.
- `input`, `select`, `textarea`, `html`, and `form` are excluded — this is a
  content/action affordance, not a form-field spinner.
