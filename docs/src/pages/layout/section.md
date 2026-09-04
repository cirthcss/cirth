---
layout: docs.njk
---


# Section

`<section>` gets a bottom margin, matching the vertical rhythm of other block
elements, with no class required.

{% demo "section" %}

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

## Why sections carry a margin at all

A landing page built from full-bleed bands does not want a gap between them,
which is a fair argument that the default is wrong. It is kept anyway, for
three reasons.

`<article>` carries exactly the same `margin-bottom:
var(--cirth-block-spacing-vertical)`. Sectioning content is sectioning
content: giving one of HTML's two sectioning containers document rhythm and
leaving the other flat would be an inconsistency to remember, not a
simplification.

It is spent through a token rather than written as a number, so a theme that
re-times the document re-times the space between sections with it — the same
token the page's own `<header>`, `<main>` and `<footer>` spend on their block
padding.

And a full-bleed page is a composition, which is the author's. Opting out
costs one declaration, and it can be written at zero added specificity so
nothing inside has to fight it:

```css
.landing :where(section) {
  margin: 0;
}
```

That is what the front page of this site does. The framework's other flow
elements — `<p>`, `<ul>`, `<table>` — take the same position: they arrive with
document rhythm, and a layout that wants none says so once.
