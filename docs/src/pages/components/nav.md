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

Write it with `<ol>` if you prefer — a trail is an ordered sequence, and the
two render identically. Every rule in this component, the divider included,
matches `:is(ol, ul)`.

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

A `<nav>` inside an `<aside>` is the vertical nav. This is the pattern —
there is no class and no modifier, and the markup is the same markup as the
bar above it:

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

Stacked, the entries become full-width rows and the current-page marker moves
from the bottom edge to the inline-start one, where it reads as a rail. The
rail is painted on the link's own box, so it is contained by the `<aside>` on
both inline edges — a sidebar that scrolls (`position: sticky` plus
`overflow-y: auto`, which is what most of them do) will not clip it away.

Two things follow from the trigger being `<aside>` rather than a class:

* Outside an `<aside>`, a `<nav>` is a **bar**. If a stacked menu is coming
  out as a row, the nav is not inside a complementary region — that is the
  thing to check first.
* A plain `<ul>` of links inside an `<aside>` is still a plain list, with its
  markers. Only the `<nav>` becomes navigation.

### A stacked nav that is not in an `<aside>`

A drawer, an offcanvas menu, a disclosure, a footer column: a navigation
that is a column but is not in a complementary region. Those are yours to
lay out — a drawer is a block, a menu sheet may be a grid, and the framework
has no way to guess which. What it does hand you is the one thing you would
otherwise have to undo:

```css
.drawer nav {
  --cirth-nav-element-spacing-horizontal: 0;

  display: block; /* or grid, or whatever the panel wants */
}
```

`--cirth-nav-element-spacing-horizontal` is the inline gutter, and a bar
spends it three times: the list pulls out by one, the item pushes in by one,
and the link pulls out by one, so the row sits flush with its container.
Stacked, those three insets stop cancelling and the painted box — the hover
fill, and the `border-inline-start` that carries `aria-current` — runs one
gutter outside the container on *both* edges. In a panel with
`overflow: hidden`, which most drawers have, that clips the current-page
marker away entirely.

Naming the gutter zero collapses all three at once, because all three read
that one token. It is not a mode and not a class: a stacked nav is a nav
with no inline gutter, and this says so. Everything else about the nav —
its ink, its states, its `aria-current` treatment — is unchanged.

There is no `.stack` or `.vertical` class, and no ARIA hook:
`aria-orientation` is not a supported property on `role="navigation"`, and a
styling hook is not a reason to write invalid ARIA.

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
* In a bar, those two cancel: the list pulls out by one gutter, the item
  pushes in, and the link pulls out again, so the row sits flush with its
  container. All three insets are
  `--cirth-nav-element-spacing-horizontal` — including the link's negative
  margin, which cancels the item's padding rather than mirroring its own.
  Stacked in an `<aside>` there is no row to cancel against, so the aside
  names that gutter zero and the painted box stays inside the container.
  Anywhere else, you name it zero yourself (above).
* Buttons, `[role="button"]`, and form controls placed inside a nav `li`
  adapt their padding to match the nav's link rhythm instead of their usual
  button/form spacing.
* A [group](/components/group) (`.group`/`[role="search"]` — `[role="group"]`
  alone in the classless build) inside a nav item sizes to its content and
  drops its stacking margin, sitting on the nav's rhythm like any other item.
* A [dropdown](/components/dropdown) nested in a nav item collapses its own
  vertical margin so it lines up with sibling links; see that page's
  "Inside a nav" example.
