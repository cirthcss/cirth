# Code

`pre`, `code`, `kbd`, and `samp` are styled directly, sharing the monospace
font stack and a background/foreground pair.

<Demo src="code" />

```html
<p>Inline <code>code</code>, a shortcut <kbd>⌘K</kbd>, and output <samp>Build succeeded</samp>.</p>
<pre><code>function greet(name) {
  return `Hello, ${name}!`;
}</code></pre>
```

## Behavior

- `code`, `kbd`, and `samp` are inline-block with padding; `pre` is a block
  with its own padding, and `pre code`/`pre samp` reset to inherit size,
  family, and background so the fenced-block look isn't doubled.
- Background/foreground: `--cirth-code-background-color` /
  `--cirth-code-color`.
- `kbd` uses its own pair, `--cirth-code-kbd-background-color` /
  `--cirth-code-kbd-color` — inverted from the page background/foreground by
  default, so a kbd key reads as a small solid chip.
- `pre` scrolls horizontally (`overflow-x: auto`) instead of breaking the
  page layout on long lines.
