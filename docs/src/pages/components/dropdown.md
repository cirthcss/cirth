---
layout: docs.njk
description: Build a disclosure-based list of links or actions with Cirth's class-based dropdown component.
---

# Dropdown

Use `<details class="dropdown">` for a compact disclosure containing links or
simple actions. Use a native [select](/forms/select) instead when a person must
choose and submit a form value.

{% demo "dropdown" %}

```html
<details class="dropdown">
  <summary>Choose a plan</summary>
  <ul>
    <li><a href="/plans/free">Free</a></li>
    <li><a href="/plans/pro">Pro</a></li>
    <li><a href="/plans/enterprise">Enterprise</a></li>
  </ul>
</details>
```

The browser makes `summary` operable and toggles the parent `details` element's
`open` state. The list items remain ordinary links with their normal keyboard
and navigation behavior.

## Inside a nav

Put the dropdown inside a navigation list item when it belongs to a header or
navigation bar.

{% demo "dropdown-nav" %}

```html
<nav aria-label="Account">
  <ul>
    <li>
      <details class="dropdown">
        <summary>Account</summary>
        <ul>
          <li><a href="/profile">Profile</a></li>
          <li><a href="/settings">Settings</a></li>
          <li><a href="/sign-out">Sign out</a></li>
        </ul>
      </details>
    </li>
  </ul>
</nav>
```

Cirth makes the dropdown an inline containing block in a nav, aligns the
trigger to adjacent links and positions the list from that trigger.

## Behavior

Cirth styles a plain summary like a form control, adds a chevron and positions
the immediately following `ul` as an overlay surface. The list becomes visible
when `details` has `open`. Link rows receive hover, focus, active and current
page styling.

The pattern is a disclosure containing ordinary content. Cirth does not add
ARIA menu or listbox roles, roving focus, typeahead or application commands.
Keep links as links and use native buttons for actions.

`.dropdown` is emitted only by class-based builds. Classless builds omit
component and utility classes, although they still retain `.no-cirth` as the
public component-exclusion boundary.

## Accessibility

- Make the summary describe what the list contains.
- Keep link destinations and button actions clear.
- Do not add `role="menu"` unless application code also implements the full
  menu keyboard model.
- Do not use this component as a visual replacement for a form select.

## Tokens

| Token | What it sets |
| --- | --- |
| `--cirth-dropdown-background-color` | Menu surface |
| `--cirth-dropdown-border-color` | Menu edge |
| `--cirth-dropdown-color` | Menu text |
| `--cirth-dropdown-hover-background-color` | Interactive row state |
| `--cirth-dropdown-box-shadow` | Overlay elevation |
| `--cirth-icon-chevron` | Trigger marker |

## Common mistakes

- Placing the list somewhere other than immediately after the summary.
- Treating the visual highlight as a selected form value.
- Adding menu roles without the matching keyboard interaction.
- Expecting `.dropdown` in a classless build.

## Related

- [Accordion](/components/accordion)
- [Nav](/components/nav)
- [Select](/forms/select)
