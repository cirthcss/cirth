---
layout: docs.njk
---

# Upgrading

Cirth is pre-1.0, so a breaking change ships in a minor release. Every one
gets an entry here saying what stopped working and what to do about it, and
one that leaves the documented API behind it also starts a new line of
documentation — the selector in the header switches between them.

After 1.0 the same boundary becomes a major release, and this page keeps
working the way it already does.

## Unreleased, from v0.14.x

The public class list stays the same, but containers and modals now size
continuously instead of stepping through a shared viewport table. Check the
few cases below if your CSS depended on the old implementation details.

### Container gutters have their own token

`.container`, `.container-fluid`, and the classless `header`/`main`/`footer`
landmarks now use `--cirth-container-gutter`, whose default is
`clamp(1rem, 4%, 3rem)`. Changing `--cirth-spacing` no longer changes their
inline gutter; it remains the flow knob — prose rhythm, section margins and
grid gaps. (Control and card padding have never followed it either; see
[Spacing and layout](/customization#spacing-and-layout) for which tokens do
and which deliberately do not.)

Move an intentional page-gutter override to the new role token:

```css
/* before */
:root { --cirth-spacing: 1.5rem; }

/* after */
:root { --cirth-container-gutter: 1.5rem; }
```

### `.breakout` belongs directly to `.container`

The selector is now `.container > .breakout`, backed by named `content` and
`full` grid lines. This prevents the utility from unexpectedly spanning an
unrelated grid. If an existing breakout is wrapped, put the class on the
direct child or move `.container` to the element that owns the content:

```html
<!-- before: the figure is not a direct grid item -->
<section class="container">
  <div><figure class="breakout">…</figure></div>
</section>

<!-- after -->
<section class="container">
  <figure class="breakout">…</figure>
</section>
```

Code that used `.breakout` as a generic `grid-column: 1 / -1` utility outside
`.container` needs a local rule instead. That broad behavior was never the
documented purpose of the class and is no longer global.

### Modal width has one runtime cap

The modal card no longer switches between the old `sm` and `md` widths. It
uses the available width up to `--cirth-modal-max-width` (default `43.75rem`):

```css
:root {
  --cirth-modal-max-width: 36rem;
}
```

No HTML changes are required. Override the token only if the former stepped
widths were part of your design.

## To v0.14.0, from v0.13.x

One behaviour change, on an attribute that was doing more than it says.

### `aria-busy` no longer blocks interaction

`aria-busy="true"` set `pointer-events: none` on buttons and links, so a
busy control could not be clicked. It could still be activated with Enter
or Space, because CSS cannot reach keyboard activation — so the protection
covered the pointer and left the keyboard open, which is worse than not
having it: the behaviour differed by input method and nothing announced it.

`aria-busy` is a status. It tells assistive technology that a region is
being updated, and that is all it means now.

```html
<!-- before: interaction stopped for a mouse, not for a keyboard -->
<button type="submit" aria-busy="true">Saving…</button>

<!-- after: say what you mean -->
<button type="submit" aria-busy="true" disabled>Saving…</button>
```

Set `disabled` when the action starts and remove it when the action
settles. For a control that is not a native button, use
`aria-disabled="true"` and have its script ignore pointer and keyboard
activation alike — `aria-disabled` describes the state, it does not enforce
it.

This line of documentation still covers v0.13.0: nothing above changes the
token surface, the build layout or the class list that v0.13.0 introduced,
so the switcher keeps one entry for both.

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
[Customization](/customization#light-and-dark).

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

### `.outline` buttons have a surface now

An outline button used to be transparent. It paints `--cirth-canvas`, the
page surface, and tints it on hover. Nothing changes where one sits on the
page — which is most places — but on a card, a coloured band or a header it
used to show the backdrop through and now does not.

If transparent was what you wanted, that is `.ghost`: no surface, no
border, and a hover that tints its background with its own colour group.
It is the right variant for an icon button in a header or a toolbar, and it
is what this documentation site's own theme toggle uses.

```html
<!-- a quiet button that keeps a surface -->
<button type="button" class="outline">Cancel</button>

<!-- a quiet button that has none -->
<button type="button" class="ghost">Dismiss</button>
```

One related fix: `[type="reset"].outline` used to come out with the
secondary colours whether or not it asked for them. It takes the primary
group now, and `.outline.secondary` still gets secondary.

### Form fields answer the pointer

`input`, `select` and `textarea` had no `:hover` at all. They do now — the
border moves toward the field's own ink, which is deliberately not the
focus treatment. Nothing to change unless you were relying on a field
looking identical whether or not the pointer was over it; `[readonly]` and
`[aria-invalid]` fields are left alone.

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
* **`--cirth-canvas` is new**: the page surface as a value of its own.
  `--cirth-background-color` is the slot components paint through — a
  button rebinds it to its own fill — so it was never a reliable way to
  refer to *the page*. It defaults to `--cirth-canvas` now. If you set the
  page colour, set the canvas; if you were setting
  `--cirth-background-color` at `:root`, it still works, but anything
  tinting toward the page will follow the canvas instead.
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
and keeps winning. [Customization](/customization#light-and-dark)
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
