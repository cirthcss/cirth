---
layout: docs.njk
---


# Dropdown

`<details class="dropdown">` presents a native disclosure as a dropdown
list of links or actions. Default build only: `.dropdown` requires classes.

{% demo "dropdown" %}

```html
<details class="dropdown">
  <summary>Choose a plan</summary>
  <ul>
    <li><a href="#">Free</a></li>
    <li><a href="#">Pro</a></li>
    <li><a href="#">Enterprise</a></li>
  </ul>
</details>
```

## Inside a nav

Dropdowns are commonly nested in a [Nav](/components/nav) list item to build
an account/actions menu in a header bar:

{% demo "dropdown-nav" %}

```html
<nav>
  <ul><li><strong>Product</strong></li></ul>
  <ul>
    <li>
      <details class="dropdown">
        <summary>Account</summary>
        <ul>
          <li><a href="#">Profile</a></li>
          <li><a href="#">Sign out</a></li>
        </ul>
      </details>
    </li>
  </ul>
</nav>
```

## Behavior

* The `summary` gets a chevron marker (`--cirth-icon-chevron`); the `ul`
  right after it becomes the absolutely positioned menu, hidden
  (`opacity: 0`) until the `details` is `[open]`.
* When `summary` has no `role` attribute, it is visually styled like a form
  select (border, background, placeholder color), but it remains a
  disclosure. It does not own a form value, a selected option, or the
  keyboard conventions of a listbox. Use a native `<select>` when the user
  is choosing a value for a form.
* Menu items get hover/focus/active/`aria-current` background from
  `--cirth-dropdown-hover-background-color`; the menu itself uses background,
  border, shadow, and color tokens from the dropdown group.
* Inside a nav, the dropdown establishes its own containing block so the
  absolutely positioned menu remains aligned to the trigger in every browser.

Keep links as links and actions as native buttons inside the list. Cirth
does not add menu/listbox roles or JavaScript keyboard behavior, because a
native disclosure is already the correct interaction model for this
component.
