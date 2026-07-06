# Nav

`<nav>` lays out its `ul`/`ol` lists as a horizontal bar by default, and
supports breadcrumbs and vertical (sidebar) navigation through markup, not
extra classes.

<Demo src="nav" />

```html
<nav>
  <ul><li><strong>Product</strong></li></ul>
  <ul>
    <li><a href="#">Features</a></li>
    <li><a href="#" aria-current="page">Pricing</a></li>
    <li><a href="#" role="button">Sign up</a></li>
  </ul>
</nav>
```

## Breadcrumb

`nav[aria-label="breadcrumb"]` adds a divider (`--cirth-nav-breadcrumb-divider`,
`>` by default, mirrored to `\` in `[dir="rtl"]`) between items and disables
pointer events on the current page:

<Demo src="nav-breadcrumb" />

```html
<nav aria-label="breadcrumb">
  <ul>
    <li><a href="#">Docs</a></li>
    <li><a href="#">Components</a></li>
    <li><a href="#" aria-current="page">Nav</a></li>
  </ul>
</nav>
```

## Vertical nav

Nesting `nav` inside `aside` switches every list and list item to
`display: block`, turning the same markup into a sidebar menu:

<Demo src="nav-vertical" />

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

- Two lists inside one `nav` are pushed to opposite ends
  (`justify-content: space-between`) — the common "brand left, links right"
  header pattern.
- `li` padding is `--cirth-nav-element-spacing-vertical`/`-horizontal`; a
  link inside gets its own smaller `--cirth-nav-link-spacing-*` padding so
  the clickable/hover area is slightly larger than the visible text.
- Buttons, `[role="button"]`, and form controls placed inside a nav `li`
  adapt their padding to match the nav's link rhythm instead of their usual
  button/form spacing.
- A [dropdown](/components/dropdown) nested in a nav item collapses its own
  vertical margin so it lines up with sibling links — see that page's
  "Inside a nav" example.
