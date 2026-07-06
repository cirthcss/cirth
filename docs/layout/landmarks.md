# Landmarks

`body`, and the direct `header`/`main`/`footer` children of `body`, are
Cirth's top-level page landmarks.

<Demo src="landmarks" />

```html
<body>
  <header>…</header>
  <main>…</main>
  <footer>…</footer>
</body>
```

## Behavior

- `body` is full width with its margin removed.
- `main` renders as `display: block` (IE fallback).
- Direct children of `body` that are `header`, `main`, or `footer` get
  vertical block padding via `--cirth-block-spacing-vertical` — this is what
  keeps the top of the page, the content, and the footer evenly spaced
  without any wrapper class.

This is the **default build**'s behavior (`$enable-classes: true`): simple
vertical padding, no width constraint. Combine it with
[`.container`](/layout/container) on `main` if you also want a centered,
width-constrained page.

## Classless build

When `$enable-classes` is disabled (the classless build), the same
`body > header/main/footer` selector instead behaves like
[`.container`](/layout/container): centered, width-constrained, and
responsive at every breakpoint — because there's no `.container` class
available to add. See [Get Started → Classless](/get-started#classless).
