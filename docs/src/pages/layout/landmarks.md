---
layout: docs.njk
description: Structure the page with body, header, main, and footer landmarks, and understand how Cirth lays them out in each build.
---

# Landmarks

Use a page-level `<header>`, `<main>`, and `<footer>` to identify the major
regions of a document. Browsers and assistive technologies use these semantic
elements for navigation. Cirth adds spacing and, in the classless build, a
content measure.

{% demo "landmarks" %}

```html
<body>
  <header>
    <nav aria-label="Primary">...</nav>
  </header>
  <main>
    <h1>Account</h1>
    <p>Manage your profile and security settings.</p>
  </main>
  <footer>
    <small>Copyright 2026 Example Ltd.</small>
  </footer>
</body>
```

`<main>` contains the page's primary content and should normally appear once.
A page-level `<header>` introduces the site or page. A page-level `<footer>`
contains closing information such as legal links or authorship. Headers and
footers nested inside an `<article>` or `<section>` describe that smaller
region; Cirth's page-landmark layout applies only to direct children of
`<body>`.

## Default build

The browser renders these elements as blocks. Cirth removes the browser's
default body margin and adds vertical padding to direct page landmarks with
`--cirth-block-spacing-vertical`.

The default build does not constrain their width. Add `.container` to the
landmark that needs a centered content measure:

```html
<main class="container">
  <h1>Documentation</h1>
  <p>Start with the installation guide.</p>
</main>
```

## Classless build

The classless build turns each direct `body > header`, `body > main`, and
`body > footer` landmark into the equivalent of a centered container. It uses
`--cirth-container-gutter` and `--cirth-container-max-width`, so no container
class is required.

The classless build does not expose `.breakout`. A class is necessary to
request that visual exception.

In a scoped build, the `.cirth` wrapper takes the place of `<body>` for this
layout rule. Its direct `<header>`, `<main>`, and `<footer>` children receive
the landmark spacing or classless container behavior.

## Common mistakes

- Do not use `<main>` as a generic wrapper inside every component. It names
  the document's primary content.
- Do not omit meaningful landmarks in favor of undifferentiated `<div>`
  elements when the region has a clear page-level purpose.
- Do not expect nested `<header>` and `<footer>` elements to receive the
  page-landmark padding.

## Related pages

- [Container](/layout/container)
- [Section](/layout/section)
- [Navigation](/components/nav)
