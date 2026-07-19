# Dropdown

`<details class="dropdown">` turns a disclosure element into a dropdown
menu or a custom control that behaves like a select. Default build only:
`.dropdown`
requires classes.

<Demo src="dropdown" />

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

<Demo src="dropdown-nav" />

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
* When `summary` has no `role` attribute, it's additionally styled like a
  form select (border, background, placeholder color). This is the
  "custom select" pattern, useful when you need option content `.dropdown`
  can't express as a native `<select>`.
* Menu items get hover/focus/active/`aria-current` background from
  `--cirth-dropdown-hover-background-color`; the menu itself uses background,
  border, shadow, and color tokens from the dropdown group.
* `aria-invalid="true"`/`"false"` on the `summary` recolor it the same way as
  a form field.
