# Misc

A small set of remaining resets: `hr`, `[hidden]`, `template`, and `canvas`.

<Demo src="misc" />

```html
<p>Paragraph before the divider.</p>
<hr>
<p>Paragraph after the divider.</p>
```

- `hr` — a single top border in `--cirth-muted-border-color`, with vertical
  margin from `--cirth-typography-spacing-vertical`.
- `[hidden]` and `template` — always `display: none`, for older browsers
  that don't implement this natively.
- `canvas` — `display: inline-block`, for IE9 and below.
