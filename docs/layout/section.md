# Section

`<section>` gets a bottom margin, matching the vertical rhythm of other block
elements, with no class required.

<Demo src="section" />

```html
<section>
  <h4>First section</h4>
  <p>…</p>
</section>
<section>
  <h4>Second section</h4>
  <p>…</p>
</section>
```

The margin is `--cirth-block-spacing-vertical` (defaults to `--cirth-spacing`,
`1rem`). Override that token to change spacing between sections across the site.
