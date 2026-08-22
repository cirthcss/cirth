---
layout: docs.njk
---

# Upgrading

Cirth is pre-1.0, so a breaking change ships in a minor release. Each one
starts a new line of documentation — the selector in the header switches
between them — and gets an entry here saying what stopped working and what
to do about it.

After 1.0 the same boundary becomes a major release, and this page keeps
working the way it already does.

## To v0.11.0, from v0.10.x

Three removals. All three replace CSS that could not do its job with
platform features that can, so in each case there is less to write, not
more.

### `[data-tooltip]` is gone

The attribute renders nothing now. Markup that uses it keeps working as
ordinary content, but the tooltip text — which lived inside the attribute —
is not displayed at all.

It was removed because it could never be accessible: the message was drawn
with `content: attr()` on a pseudo-element, which is not reliably exposed
to assistive technology, cannot be referenced with `aria-describedby`, does
not render at all on replaced elements like `<input>`, and cannot be made
dismissible without JavaScript. It looked like a tooltip to sighted mouse
users and was invisible to everyone else.

```html
<!-- before -->
<button data-tooltip="Saved to your library">Save</button>

<!-- after -->
<button type="button" popovertarget="save-hint" aria-describedby="save-hint">
  Save
</button>
<span id="save-hint" popover>Saved to your library.</span>
```

The message is now a real element with a real id, so `aria-describedby`
reaches it even while it is closed. See [Popover](/components/popover) —
and note that it opens on activation rather than hover, which is a
deliberate difference and not a limitation to work around.

If the text is essential, put it in the page instead. A popover is
supplementary by design.

### The modal's JavaScript hooks are gone

`.modal-is-open`, `.modal-is-opening`, `.modal-is-closing` and
`--cirth-scrollbar-width` no longer exist. A script that still toggles
those classes keeps working — they simply do nothing — so nothing breaks
on upgrade. What changes is that you can delete that code:

```js
// before
dialog.showModal();
document.documentElement.classList.add("modal-is-open", "modal-is-opening");
document.documentElement.style.setProperty(
  "--cirth-scrollbar-width",
  `${window.innerWidth - document.documentElement.clientWidth}px`,
);

// after
dialog.showModal();
```

The page stops scrolling on its own, and the dialog animates itself in.
[Modal](/components/modal) has the detail, including the one thing that
did not survive: the closing animation now runs only in Chromium, because
animating an element *out* of the top layer needs a property no other
engine ships yet.

### A `:root` override of a color token now applies

This one breaks by starting to work. Overriding a color from `:root` used
to do nothing — the scheme roots outweighed it, whatever the loading order
— so an override written, found ineffective and left in the codebase now
takes effect on upgrade.

```css
:root {
  --cirth-primary: #2563eb; /* ignored before v0.11, applied now */
}
```

Worth grepping your stylesheets for `--cirth-` before upgrading. Two
things to know: a bare `:root` override now applies to **both** color
schemes, and anything written against the old workaround
(`:root:not([data-theme="dark"])`, `[data-theme="dark"]`) is more specific
and keeps winning. [Customization](/customization#overriding-a-color-in-one-scheme-only)
covers overriding one scheme at a time.

### The browser floor moved

To Chrome 123, Firefox 130, Safari 18.2 — roughly 78% of global browser
usage, up from the previous line's floor but no longer covering Safari
17.x and older. The features the removals above depend on (`popover`,
`@starting-style`, `scrollbar-gutter`, `:has()`) are why.

If you support older browsers, stay on the `up to v0.10.0` line: it is
still published, still documented, and `0.10.0` remains installable.

```sh
npm install @cirthcss/cirth@0.10.0
```
