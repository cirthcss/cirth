---
layout: docs.njk
---


# Section

`<section>` opens a new subject: whatever it follows, it sits one section
step below it, with no class required.

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

The step is `--cirth-flow-section`, three times `--cirth-spacing` (48px at
the default). Between two top-level sections of `<main>` it is the chapter
step, `--cirth-flow-chapter` (80px). Neither is a margin the section
carries: it is the relation between the section and what comes before it,
so a section at the top of its container starts at the top.

## Opting out

A landing page built from full-bleed bands does not want a gap between
them. That is a composition, which is the author's, and opting out costs
one declaration. The relation weighs nothing, so the opt-out can be written
at zero added specificity too, and nothing inside has to fight it:

```css
.landing :where(section) {
  margin: 0;
}
```

That is what the front page of this site does. The framework's other flow
elements (`<p>`, `<ul>`, `<table>`) take the same position: their spacing
is a relation, and a layout that wants none says so once.
