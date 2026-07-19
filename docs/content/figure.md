# Figure

`figure`/`figcaption` wrap any content, commonly a table or image, with an
optional caption underneath.

<Demo src="figure" />

```html
<figure>
  <table>…</table>
  <figcaption>Table 1. Example figure caption.</figcaption>
</figure>
```

`figcaption` is muted (`--cirth-muted-color`) with vertical padding; `figure`
itself has no margin or padding of its own, so it doesn't add spacing beyond
what its content already has.
