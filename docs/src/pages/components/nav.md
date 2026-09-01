---
layout: docs.njk
---


# Nav

`<nav>` lays out its `ul`/`ol` lists as a horizontal bar by default, and
supports breadcrumbs and vertical (sidebar) navigation through markup, not
extra classes.

{% demo "nav" %}

```html
<nav>
  <ul><li><strong>Product</strong></li></ul>
  <ul>
    <li><a href="#">Features</a></li>
    <li><a href="#" aria-current="page">Pricing</a></li>
    <li><a href="#">Sign up</a></li>
  </ul>
</nav>
```

## Breadcrumb

`nav[aria-label="breadcrumb"]` adds a divider (`--cirth-nav-breadcrumb-divider`,
`>` by default — a bidi-mirrored glyph, so `[dir="rtl"]` flips it to `<`
natively) between items and disables pointer events on the current page:

{% demo "nav-breadcrumb" %}

```html
<nav aria-label="breadcrumb">
  <ul>
    <li><a href="#">Docs</a></li>
    <li><a href="#">Components</a></li>
    <li><a href="#" aria-current="page">Nav</a></li>
  </ul>
</nav>
```

## Navbar

A `nav` that is a direct child of the page's banner `header` is a navbar:
application chrome rather than an in-page position map. Its links run a
four-step contrast ladder instead of the accent edge — muted ink at rest,
an intermediate step on hover and focus, full contrast plus semibold for
`aria-current`/`aria-selected`, and a further-attenuated step for
`aria-disabled="true"`, which also stops responding to the pointer. None
of the four is the accent colour: in chrome the accent belongs to actions,
and position is carried by contrast. The current entry gets weight as well
as ink, so the state is not distinguished by colour alone.

The rule applies to the banner only — a `header` whose nearest sectioning
ancestor is `body`. A `nav` inside a card's, an article's, or a section's
own `header` is that section's navigation, so it keeps the ordinary
treatment with its active edge.

```html
<header>
  <nav>
    <ul><li><strong>Product</strong></li></ul>
    <ul>
      <li><a href="#" aria-current="page">Overview</a></li>
      <li><a href="#">Activity</a></li>
      <li><a href="#" aria-disabled="true">Billing</a></li>
    </ul>
  </nav>
</header>
```

A navbar also wraps rather than overflowing, and centres its items on the
same 40px band its links occupy, so a brand lockup, a search field, and a
`details` disclosure used as a toggler all line up on one row. The toggler
is unfilled — a sober border and its own focus ring — so it reads as chrome
and not as a form control that wandered into the header.

## Vertical nav

Nesting `nav` inside `aside` switches every list and list item to
`display: block`, turning the same markup into a sidebar menu:

{% demo "nav-vertical" %}

```html
<aside>
  <nav>
    <ul>
      <li><a href="#" aria-current="page">Overview</a></li>
      <li><a href="#">Get Started</a></li>
    </ul>
  </nav>
</aside>
```

## Behavior

* Two lists inside one `nav` are pushed to opposite ends
  (`justify-content: space-between`), the common "brand left, links right"
  header pattern.
* A `nav` directly inside the banner `header` adopts the navbar contrast
  ladder described above; ordinary horizontal navs retain the active bottom
  edge and sidebars move that edge to their inline-start rail. A `nav` in a
  component's own `header` counts as an ordinary nav.
* `li` padding is `--cirth-nav-element-spacing-vertical`/`-horizontal`; a
  link inside gets its own smaller `--cirth-nav-link-spacing-*` padding so
  the clickable/hover area is slightly larger than the visible text.
* Buttons, `[role="button"]`, and form controls placed inside a nav `li`
  adapt their padding to match the nav's link rhythm instead of their usual
  button/form spacing.
* A [group](/components/group) (`.group`/`[role="search"]` — `[role="group"]`
  alone in the classless build) inside a nav item sizes to its content and
  drops its stacking margin, sitting on the nav's rhythm like any other item.
* A [dropdown](/components/dropdown) nested in a nav item collapses its own
  vertical margin so it lines up with sibling links; see that page's
  "Inside a nav" example.
