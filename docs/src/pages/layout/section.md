---
layout: docs.njk
description: Divide a page into titled subjects with the semantic section element and Cirth's content-flow spacing.
---

# Section

Use `<section>` for a distinct subject within a page when that subject needs a
heading. The element adds semantic structure; Cirth adds the vertical spacing
between it and the content around it.

{% demo "section" %}

```html
<section>
  <h2>Profile</h2>
  <p>Update the name and photo shown to other members.</p>
</section>
<section>
  <h2>Security</h2>
  <p>Manage your password and active sessions.</p>
</section>
```

## Native meaning

A section represents one thematic part of the surrounding document. Its
heading supplies a name that browsers and assistive technologies can use when
presenting the page structure.

Choose the heading level from the document hierarchy. In the example, both
sections are children of the page's `<h1>`, so each starts with `<h2>`. Do not
choose `<h4>` merely because its default appearance seems smaller. Use CSS for
appearance and keep heading levels meaningful.

A `<div>` is more appropriate when a wrapper exists only for layout or
styling and does not introduce a new subject.

## What Cirth adds

A section that follows another flow element receives
`--cirth-flow-section`, which defaults to three times `--cirth-spacing`.
Consecutive top-level sections that are direct children of `<main>` use the
larger `--cirth-flow-chapter` step, which defaults to five times the base
spacing.

The space belongs to the relationship between adjacent elements. A section at
the start of its container has no artificial gap above it.

## Removing the section gap

A composition of adjoining full-width bands may need no flow spacing. Override
the relationship in that composition:

```css
.landing :where(section) {
  margin-block-start: 0;
}
```

## Common mistakes

- Do not use `<section>` as a generic hook when a `<div>` would describe the
  content more honestly.
- Do not leave a section unnamed when a heading can state its subject.
- Do not skip heading levels to obtain a smaller visual style. The heading
  structure and the type scale solve different problems.

## Related pages

- [Typography](/content/typography#headings)
- [Landmarks](/layout/landmarks)
- [Document](/layout/document)
