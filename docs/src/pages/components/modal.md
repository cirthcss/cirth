---
layout: docs.njk
description: Build a current, accessible modal with the native dialog element, Cirth styling and progressive enhancement.
---

# Modal

Use a modal dialog when a short interaction must be resolved before the person
continues with the page. The native `dialog` element supplies modal semantics,
focus behavior, keyboard dismissal and the browser's top layer. Cirth supplies
the backdrop and card presentation.

{% demo "modal" %}

```html
<button id="open-confirm-delete" type="button"
        commandfor="confirm-delete" command="show-modal">
  Delete item
</button>

<dialog id="confirm-delete" aria-labelledby="confirm-delete-title">
  <article>
    <header>
      <button type="button" rel="prev" aria-label="Close"
              commandfor="confirm-delete" command="request-close"></button>
      <h2 id="confirm-delete-title">Delete this item?</h2>
    </header>
    <p>It will be removed for everyone and cannot be restored.</p>
    <footer>
      <button id="cancel-confirm-delete" type="button" class="secondary"
              commandfor="confirm-delete" command="request-close">
        Cancel
      </button>
      <form method="dialog">
        <button type="submit" class="danger" value="confirm">
          Delete
        </button>
      </form>
    </footer>
  </article>
</dialog>
```

`aria-labelledby` points to the heading's `id` and gives the dialog an
accessible name. The `article` is the visible card. The outer `dialog` fills
the viewport and paints the backdrop.

## Opening and closing

`commandfor` connects a button to the `id` of the element it controls.
`command` names the action:

- `show-modal` calls the dialog's modal opening behavior.
- `close` closes it directly.
- `request-close` first dispatches the cancelable `cancel` event, then closes
  unless application code prevents that event.

A form with `method="dialog"` closes its containing dialog instead of sending
a network request. The activated submit button's `value` becomes
`dialog.returnValue`, which application code can inspect in the `close` event.
That value reports the choice; it does not delete data or confirm an operation
by itself.

Button commands are supported in
[Chrome 135](https://developer.chrome.com/release-notes/135),
[Firefox 144](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/144)
and [Safari 26.2](https://webkit.org/blog/17640/webkit-features-for-safari-26-2/).
Those versions are newer than Cirth's browser floor. When opening the modal is
essential, use the widely supported DOM methods as the compatibility path:

```js
const dialog = document.querySelector("#confirm-delete");
const openButton = document.querySelector("#open-confirm-delete");
const cancelButton = document.querySelector("#cancel-confirm-delete");

openButton.addEventListener("click", () => dialog.showModal());
cancelButton.addEventListener("click", () => dialog.close("cancel"));
```

In that version, give the corresponding buttons the shown IDs and omit command
attributes if you do not want two activation paths. `showModal()` is important:
setting `open` or calling `show()` does not create a modal interaction.

## Native browser behavior

Opening with `showModal()` places the dialog in the top layer. The top layer is
a browser-managed plane above ordinary document stacking, so the dialog is not
clipped by ancestor overflow or competing `z-index` values. The rest of the
document becomes inert while the modal is open, and focus is moved into the
dialog according to the browser's dialog focusing rules.

Escape requests dismissal through the `cancel` event. Application code may
prevent that event when dismissal would be unsafe, but should provide another
clear way to close the dialog.

## Behavior

Cirth makes the outer dialog a fixed, full-viewport overlay and centres its
direct `article`. The card width is limited by `--cirth-modal-max-width`, which
defaults to 43.75rem, and its height remains within the dynamic viewport. Long
content scrolls inside the card.

A direct header control with `rel="prev"` becomes a close icon. Class-based
builds also recognise `.close`. The icon still needs an accessible label and a
real close action.

Unscoped builds lock document scrolling with
`html:has(dialog:modal)`. The `:modal` state limits the lock to a genuinely
modal dialog. Scoped builds cannot modify the document root, so their host
application must lock page scrolling when appropriate.

The backdrop fades in and the card settles into place with `@starting-style`.
Exit animation support differs by engine because retaining an element in the
top layer during a discrete close transition is not uniform. Closing still
works immediately when that visual enhancement is unavailable. Reduced-motion
preferences remove the transition.

## Presentation and application logic

Cirth presents the dialog. The browser opens, closes and manages the modal
state. Your application owns the decision represented by the dialog, including
authorisation, network requests, errors and irreversible work.

For a destructive confirmation, do not perform the action merely because the
dialog closed. Check `returnValue` or the activated control, then run the
operation and report its result.

## Accessibility

- Give every dialog a concise accessible name with `aria-labelledby` or
  `aria-label`.
- Keep at least one obvious close or cancel control.
- Put initial focus on a useful control or explanatory element when the
  browser's default is not suitable. Test the resulting order with a keyboard
  and screen reader.
- Use a modal only when interaction with the background must pause.
- Keep confirmation text specific. State the object and consequence rather
  than asking a vague "Are you sure?".

## Tokens

| Token | What it sets |
| --- | --- |
| `--cirth-modal-background-color` | Dialog card surface |
| `--cirth-modal-box-shadow` | Dialog elevation |
| `--cirth-modal-max-width` | Card width cap |
| `--cirth-modal-overlay-background-color` | Viewport backdrop |
| `--cirth-modal-overlay-backdrop-filter` | Backdrop filter |
| `--cirth-icon-close` | Close icon |

## Common mistakes

- Adding the `open` attribute in application markup and expecting modal
  behavior.
- Styling a `div` with `role="dialog"` and expecting the browser to provide
  top-layer, inertness and focus behavior.
- Using invoker commands without a fallback for Cirth's supported older
  browsers.
- Treating `method="dialog"` as the application operation itself.
- Forgetting that a scoped build leaves document scroll locking to its host.

## Related

- [Popover](/components/popover), for non-modal transient content.
- [Card](/components/card), for the inner surface.
- [Compatibility](/compatibility)
- [Reduced motion](/guides/accessibility#reduced-motion)
