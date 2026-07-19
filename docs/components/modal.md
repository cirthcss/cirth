# Modal

The native `<dialog>` element is styled as a centered modal with a backdrop.
open and close it with the standard DOM API
(`dialog.showModal()`/`dialog.close()`), no framework JavaScript involved.

<Demo src="modal" />

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

```js
const dialog = document.getElementById("confirm");
dialog.showModal(); // open
dialog.close(); // close
```

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
* Add the `.modal-is-open` class to the document root (in your open/close
  JS) to lock page scroll while a modal is open; add
  `.modal-is-opening`/`.modal-is-closing` briefly to animate the transition.
  All three classes are behavior your own script opts into. Cirth only
  supplies the CSS for them.
