---
layout: docs.njk
description: Create native links for navigation, understand their interaction states, and use Cirth's optional color modifiers.
---

# Link

Use an `<a>` element with an `href` when activating the text should navigate
to another page, file, or location. The `href` is the destination. Use a
native `<button>` instead when the control performs an action on the current
page.

{% demo "links" %}

```html
<p><a href="/installation/">Install Cirth</a></p>
<p><a href="/compatibility" class="secondary">Check compatibility</a></p>
```

## Native browser behavior

An `<a href>` participates in keyboard navigation, opens through the browser's
link commands, exposes its destination, and can be copied or opened in another
tab. A bare `<a>` without `href` does not provide the same link behavior.

Browsers track visited links under privacy restrictions. They permit only a
limited set of color changes and conceal the painted visited value from page
scripts. As a result, a visited link can keep its original underline color
while its text color changes.

## What Cirth adds

- Ordinary links use the primary text and underline color roles.
- `:hover`, `:active`, `:focus`, and a true `[aria-current]` use the active
  roles and show an underline.
- `:focus-visible` draws the standard focus outline.
- Visited links in running content use `--cirth-link-visited-color`.
  Navigation links, current links, color modifiers, and links wrapping cards
  keep the color required by their current context.
- An anchor with `role="button"` receives button styling. This does not make
  it a correct replacement for `<button>`.

`aria-current` identifies the link for the page or step currently being
shown. For example:

```html
<nav aria-label="Documentation">
  <a href="/installation/" aria-current="page">Installation</a>
  <a href="/compatibility">Compatibility</a>
</nav>
```

The browser exposes `aria-current="page"` to assistive technology. Cirth adds
the visual active treatment. Set it only on the current item.

## Modifiers

The class-enabled build provides `.secondary` and `.contrast` when a link
needs the corresponding color role:

```html
<a href="/settings" class="secondary">Account settings</a>
<a href="/release-archive" class="contrast">Release archive</a>
```

Use the default treatment for most links. Color should support the interface
hierarchy, not encode a meaning that the text fails to express.

## Custom links

`role="link"` supplies link semantics and receives Cirth's link styling, but
it does not add a destination or native activation behavior. A custom element
still needs focusability, Enter-key activation, and navigation logic from the
application. Prefer `<a href>` whenever it can represent the destination.

## Common mistakes

- Do not use `href="#"` as a placeholder action. It changes the URL and can
  move focus to the top of the page.
- Do not add `role="button"` to a link merely to change its appearance. Link
  and button interaction differ, including Space-key behavior.
- Do not open a new tab without a clear reason and appropriate context for the
  user.
- Do not remove the focus outline unless an equally visible replacement is
  present.

## Related pages

- [Button](/content/button)
- [Navigation](/components/nav)
- [Accessibility guide](/guides/accessibility)
