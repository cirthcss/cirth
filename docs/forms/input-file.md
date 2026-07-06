# Input file

`[type="file"]` is unstyled except for its `::file-selector-button`, which is
styled like a secondary [button](/content/button).

<Demo src="input-file" />

```html
<input type="file">
```

The input itself has no border or background — only the button part reads
as a control. Hover/active/focus states on the button use
`--cirth-secondary-hover-background`/`-border` and a focus ring in
`--cirth-secondary-focus`.
