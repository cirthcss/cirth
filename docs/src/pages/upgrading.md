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

## To v0.13.0, from v0.12.x

Two behaviour changes. Neither touches your markup, and one of them is a
line you have to add.

### Print is a separate stylesheet

The `@media print` pass no longer rides inside the main build. A page that
links only `cirth.min.css` now prints with no pass at all — the same
untreated output you would get from a page that never had it.

```html
<!-- before -->
<link rel="stylesheet" href="cirth.min.css">

<!-- after -->
<link rel="stylesheet" href="cirth.min.css">
<link rel="stylesheet" href="cirth.print.min.css" media="print">
```

Load it after the main build: the pass wins over the component rules it has
to outrank by source order, exactly as it did inside the bundle. Each build
has its matching sheet — `cirth.print.classless.min.css`,
`cirth.print.scoped.min.css`, `cirth.print.classless.scoped.min.css` — or,
from npm, `@cirthcss/cirth/print` and its `classless`/`scoped` variants.

It moved because print styling is around 630 B gzipped that is never needed
to paint the screen. Kept in the bundle it was charged to every visitor on
the first round trip, including the ones who never print; as a separate
sheet whose media query does not match the display, the browser fetches it
at low priority.

### A `:root` override now reaches into forced-scheme subtrees

Nothing to change if you customize at `:root` and let the page follow one
scheme — that case only got more predictable. This matters if you force a
scheme somewhere inside the page with `data-theme`.

Before, every colour was declared on the element carrying the attribute, so
a `:root` override stopped at the edge of that subtree, and this page told
you to repeat it there. The scheme differences now live once at the root as
`light-dark()` pairs, so the override carries in:

```html
<div data-theme="dark">…</div>
```

```css
/* before: applied outside the subtree, not inside it */
/* after:  applies everywhere, including inside */
:root {
  --cirth-primary: #2563eb;
}
```

If you were relying on the old behaviour — an override that deliberately
did *not* reach a forced-scheme widget — scope it to say so:

```css
:root:not([data-theme="dark"]) {
  --cirth-primary: #2563eb;
}
```

That selector is more specific than a plain `:root`, so it still wins, and
it is the same one the light scheme uses.

To vary a token by scheme, write the pair rather than two rules:

```css
:root {
  --cirth-primary: light-dark(#2563eb, #93c5fd);
}
```

The pair is resolved wherever the token is used, against the color scheme in
effect at that point, so one line covers the page and any subtree that
forces a scheme. See
[Customization](/customization#overriding-a-color-in-one-scheme-only).

### The presets are renamed and redesigned

`cobalt` and `coral` are gone, replaced by `plain` and `playroom`. The
exports go with them:

```html
<!-- before -->
<link rel="stylesheet" href="dist/presets/cobalt.min.css">

<!-- after -->
<link rel="stylesheet" href="dist/presets/plain.min.css">
```

```js
// before
import "@cirthcss/cirth/presets/coral";

// after
import "@cirthcss/cirth/presets/playroom";
```

There is no drop-in equivalent of either old preset, and the new pair is
not a recolouring of the old one: they were redesigned around who they are
for (gh#86). `plain` is the conventional application baseline — reach for
it where you reached for `cobalt`. `playroom` is softer and more expressive
than `coral` was, with large radii, a rounded face and springy motion.

If you were depending on the exact colours of either, the honest migration
is to copy the values you cared about out of the old file and set them
yourself — which is now a much shorter list than it used to be, since the
accent's hover, focus and underline derive from `--cirth-primary`.

### While you are here

Neither of these is breaking, but both change what you have to write:

* **The accent is an input.** Setting `--cirth-primary` now retunes the
  background, hover, focus and underline tint with it. If you were setting
  all of them to keep them in step, you can delete every line but the first
   — unless you meant them to diverge, in which case they still do.
* **Status colors exist.** `--cirth-error`, `--cirth-success` and
  `--cirth-warning` drive the validation borders, the meter readings, the
  `<ins>`/`<del>` inks and the `<mark>` tint. Retuning a status treatment
  used to mean finding each consumer; now it is one token per family.
* **`--cirth-size-*` and `--cirth-outline-width-*` are gone**, both exact
  duplicates of scales that remain. Use `--cirth-space-*` for spacing,
  `--cirth-font-size-md` where the old `--cirth-size-4` stood in for the
  base text size, and `--cirth-border-width-*` for stroke widths.

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
