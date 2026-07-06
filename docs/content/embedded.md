# Embedded content

`audio`, `canvas`, `iframe`, `img`, `svg`, and `video` get a small set of
consistency fixes — most importantly, responsive images by default.

<Demo src="embedded" />

```html
<img src="…" alt="…">
<svg viewBox="0 0 200 80" role="img" aria-label="…">…</svg>
```

## Behavior

- `img` is `max-width: 100%; height: auto` — responsive without a class, and
  never overflows its container.
- `audio`, `canvas`, `iframe`, `img`, `svg`, `video` are vertically
  middle-aligned, which avoids the small inline-baseline gap browsers add by
  default.
- `iframe` has no border by default.
- `svg` without an explicit `fill` inherits `currentColor`, so an icon SVG
  follows the surrounding text color unless it sets its own fill.
