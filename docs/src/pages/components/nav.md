---
layout: docs.njk
description: Mark up horizontal, breadcrumb, site-header and sidebar navigation with native nav and list elements.
---

# Nav

Use `nav` for a major set of links that helps people move through a site or
application. Put the links in a list so their number and relationship remain
clear without the visual layout.

{% demo "nav" %}

```html
<nav aria-label="Primary">
  <ul>
    <li><strong>Product</strong></li>
  </ul>
  <ul>
    <li><a href="/features">Features</a></li>
    <li><a href="/pricing" aria-current="page">Pricing</a></li>
    <li><a href="/signup">Sign up</a></li>
  </ul>
</nav>
```

The browser exposes `nav` as a navigation landmark. Use `aria-label` when a
page has several navigation landmarks and their purposes are not already named
by headings. `aria-current="page"` identifies the link for the current page;
Cirth gives it a visible position marker.

## Breadcrumb

A breadcrumb records the ordered path to the current page. Use an `ol` because
the sequence has meaning, and name the navigation landmark.

{% demo "nav-breadcrumb" %}

```html
<nav aria-label="breadcrumb">
  <ol>
    <li><a href="/docs">Docs</a></li>
    <li><a href="/components">Components</a></li>
    <li><a href="/components/nav" aria-current="page">Nav</a></li>
  </ol>
</nav>
```

Cirth inserts `--cirth-nav-breadcrumb-divider` between items and removes pointer
interaction from the current-page link. The default divider mirrors in a
right-to-left document. `ul` receives the same visual treatment, but `ol`
communicates the path order more precisely.

The styles apply to `aria-label="breadcrumb"`, written in lowercase. A trail
too long for its width wraps onto another line, with each divider closing the
line it ends, so it never runs past a narrow screen.

## Navbar

A `nav` that is a direct child of the page's banner `header` is styled as site
or application chrome.

```html
<header>
  <nav aria-label="Primary">
    <ul><li><a href="/"><strong>Product</strong></a></li></ul>
    <ul>
      <li><a href="/overview" aria-current="page">Overview</a></li>
      <li><a href="/activity">Activity</a></li>
      <li><a href="/settings">Settings</a></li>
    </ul>
  </nav>
</header>
```

The navbar wraps and aligns compact controls to a 40px band. Its links use a
neutral contrast ladder instead of the accent edge used by in-page navigation.
The current item also gains weight, so state is not conveyed by colour alone.

A nav inside an article or section header remains ordinary section navigation.
It is not treated as page chrome.

## Vertical nav

A nav inside `aside` or inside a `details` disclosure becomes a stacked
navigation list.

{% demo "nav-vertical" %}

```html
<aside>
  <nav aria-label="Documentation">
    <ul>
      <li><a href="/docs" aria-current="page">Overview</a></li>
      <li><a href="/docs/get-started">Get started</a></li>
      <li><a href="/docs/customization">Customization</a></li>
    </ul>
  </nav>
</aside>
```

The list and items stack, and the horizontal gutter a bar uses drops to zero,
so hover surfaces and the current-page edge stay inside a clipped or
scrolling panel. The current-page marker moves from the bottom edge to the
inline-start edge, which keeps it visible in left-to-right and right-to-left
layouts. Links and summaries draw their focus ring inside their own box, so a
scrolling rail cannot clip it. A plain list in the aside or disclosure remains
a plain list; only the nav receives this layout.

The same applies to a collapsible menu:

```html
<details>
  <summary>Documentation</summary>
  <nav aria-label="Documentation">
    <ul>
      <li><a href="/docs" aria-current="page">Overview</a></li>
      <li><a href="/docs/get-started">Get started</a></li>
    </ul>
  </nav>
</details>
```

### A stacked nav in another container

For a drawer in a `dialog` or a footer column, set the nav layout yourself
and remove the horizontal gutter that a bar uses:

```css
.drawer nav {
  --cirth-nav-element-spacing-horizontal: 0;

  display: block;
}

.drawer nav :is(ol, ul, li) {
  display: block;
}
```

A `dialog` is left out of the automatic layout because it can hold a
horizontal bar. Do not add `aria-orientation` to a navigation landmark as a
styling hook; it is not a supported property for that role.

## Behavior

Cirth lays out `nav`, `ol` and `ul` with flexbox by default. Two lists move to
opposite ends, which supports a brand group and a link group. Links receive
compact padding, a minimum inline target size and visible hover, focus and
current states.

Buttons and form controls inside nav items use the navigation rhythm and a
40px minimum block size. A [Group](/components/group) or search form sizes to
its contents, and a [Dropdown](/components/dropdown) aligns with sibling links.

HTML supplies the landmark and link navigation. Cirth supplies layout and
states. It does not create routes, control responsive disclosure or make an
`aria-disabled` link inert for keyboard activation.

## Accessibility

- Use `nav` for meaningful navigation groups, not every cluster of links.
- Name multiple navigation landmarks so they can be distinguished.
- Put `aria-current="page"` only on the current destination.
- If a link is unavailable, prefer removing its `href` or implement complete
  disabled behavior. `aria-disabled="true"` communicates state but does not
  cancel navigation by itself.
- Keep the DOM order logical when visual groups move to opposite ends.

## Tokens

| Token | What it sets |
| --- | --- |
| `--cirth-nav-element-spacing-vertical`, `--cirth-nav-element-spacing-horizontal` | Item rhythm and bar gutter |
| `--cirth-nav-link-spacing-vertical`, `--cirth-nav-link-spacing-horizontal` | Link padding |
| `--cirth-nav-breadcrumb-divider` | Breadcrumb separator content |
| `--cirth-primary-text` | Current-item edge in ordinary navs |

## Common mistakes

- Using `nav` for links that are incidental to the surrounding content.
- Omitting a name when several navigation landmarks are present.
- Adding `aria-current` to more than one page link in the same navigation.
- Expecting a stacked layout outside `aside` and `details` without applying
  layout CSS.

## Related

- [Dropdown](/components/dropdown)
- [Group](/components/group)
- [Links](/content/link)
