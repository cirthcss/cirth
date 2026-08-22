---
layout: docs.njk
---


# Modal

The native `<dialog>` element is styled as a centered modal with a
backdrop. Opening it, closing it, locking the page behind it and animating
it in are all the platform's work — Cirth supplies the appearance and
nothing else, and no longer asks your script for anything.

{% demo "modal" %}

```html
<dialog id="confirm">
  <article>
    <header>
      <button aria-label="Close" rel="prev"></button>
      <strong>Confirm action</strong>
    </header>
    <p>Are you sure you want to delete this item? This cannot be undone.</p>
    <footer>
      <button role="button" class="secondary">Cancel</button>
      <button role="button">Confirm</button>
    </footer>
  </article>
</dialog>
```

## Opening and closing

Two attributes, no script:

```html
<button type="button" commandfor="confirm" command="show-modal">
  Delete item
</button>

<dialog id="confirm">
  <article>
    <p>Are you sure?</p>
    <footer>
      <button type="button" commandfor="confirm" command="request-close">
        Cancel
      </button>
      <form method="dialog"><button type="submit">Confirm</button></form>
    </footer>
  </article>
</dialog>
```

`command="show-modal"` opens it, `close` and `request-close` close it — the
second firing a cancel event first, so a form can object. A
`<form method="dialog">` closes the dialog on submit and reports which
button did it through `dialog.returnValue`.

**Invoker commands are newer than Cirth's
[browser floor](https://github.com/cirthcss/cirth#browser-support)**
(Chrome 135, Firefox 144, Safari 26.2). Below that the attributes are
ignored and the button does nothing, so treat them as an enhancement and
keep the DOM API wherever the interaction is essential:

```js
const dialog = document.getElementById("confirm");
dialog.showModal(); // open
dialog.close(); // close
```

That is a compatibility path and application logic — confirming a
deletion, sending a request — not something Cirth needs in order to
present the component.

## Behavior

* `dialog` fills the viewport (`position: fixed`, full width/height) and
  centers its content; the backdrop uses
  `--cirth-modal-overlay-background-color` and
  `--cirth-modal-overlay-backdrop-filter` (a blur by default).
* The `> article` is the actual modal card, capped at the `sm`/`md`
  breakpoints' container widths and scrollable if content is taller than the
  viewport.
* A close control, `.close` or `:is(a, button)[rel="prev"]` in the header,
  is styled as a small floated icon button (`--cirth-icon-close`).
* **The page stops scrolling on its own.** `html:has(dialog[open])` sets
  `overflow: hidden` and `scrollbar-gutter: stable` — the gutter stays
  reserved, so hiding the overflow does not widen the content by a
  scrollbar's width. This replaces the old `.modal-is-open` class and the
  `--cirth-scrollbar-width` measurement it needed from your script. Scoped
  builds do not do this: they are anchored inside a wrapper and have no
  business reaching the document root, so a scoped widget has to ask its
  host to lock the page.
* **It animates itself in.** `@starting-style` gives the dialog the "before"
  frame an element entering the top layer otherwise cannot have: the
  backdrop fades and the card slides down. This replaces
  `.modal-is-opening`.
* **The close is instant outside Chromium.** Animating an element *out* of
  the top layer needs the `overlay` property, which only Chromium ships, so
  `display` and `overlay` transition with `allow-discrete` where they can
  and the dialog simply disappears where they cannot. Nothing is lost by
  that: closing means the dialog goes away.
* All of the motion collapses under
  [reduced motion](/utilities/reduce-motion).
