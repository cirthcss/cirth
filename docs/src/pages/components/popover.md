---
layout: docs.njk
---

# Popover

`popover` is an attribute, not an element: it lifts anything into the top
layer and lets the browser dismiss it. Cirth styles the **surface** that
comes with that — a sheet above the page — and leaves what you put inside
it entirely to you.

{% demo "popover" %}

```html
<button
  type="button"
  popovertarget="passphrase-hint"
  aria-describedby="passphrase-hint">
  Passphrase requirements
</button>

<span id="passphrase-hint" popover>
  At least twelve characters.
</span>
```

That example is a hint, because a hint is what replaced the old tooltip —
but it is one use of the attribute, not the use. Two attributes carry it:
`popovertarget` makes the button an invoker, which gives you click, tap,
`Enter` and `Space` for free, and `aria-describedby` is what a screen
reader announces with the control. The second works even while the panel
is closed, which is the entire reason this replaced the old tooltip.

## What else it is for

The same surface, different content. Cirth imposes no width beyond a cap
and no type size, so these need nothing but their own markup.

**A menu.** The items bring their own padding, so the sheet drops its own:

```html
<button type="button" popovertarget="row-actions">Actions</button>

<ul id="row-actions" popover style="padding: 0">
  <li><a href="/edit">Edit</a></li>
  <li><a href="/duplicate">Duplicate</a></li>
  <li><a href="/archive">Archive</a></li>
</ul>
```

**A filter or settings panel.** A form works unchanged inside one —
`method="dialog"` is for `<dialog>`, so submit or close it as you would
anywhere else:

```html
<button type="button" popovertarget="filters">Filters</button>

<form id="filters" popover>
  <label>Status <select><option>Any</option><option>Open</option></select></label>
  <label><input type="checkbox"> Only mine</label>
  <button type="submit">Apply</button>
</form>
```

**A disclosure that has to escape its container.** Where `<details>` would
be clipped by an ancestor's `overflow`, the top layer is not:

```html
<button type="button" popovertarget="legend">What do these colors mean?</button>

<article id="legend" popover>
  <p>Green is within range, amber is borderline, red is out of range.</p>
</article>
```

What Cirth does **not** style is `popover="manual"` — see Behavior below —
so a toast or an overlay your own script drives is left untouched.

## Why this is not called a tooltip

Cirth used to ship `[data-tooltip]`, which drew its message with
`content: attr()` on a pseudo-element. That could never satisfy
[WCAG 1.4.13 Content on Hover or Focus](https://www.w3.org/WAI/WCAG21/Understanding/content-on-hover-or-focus.html):
generated content is not reliably exposed to the accessibility tree, no
trigger can reference it with `aria-describedby`, replaced elements like
`<input>` render no pseudo-element at all, and there is no way to make it
dismissible, hoverable and persistent without JavaScript. It looked like a
tooltip and was not one, which is worse than not having it (gh#51).

This component is deliberately opened by **explicit activation** rather
than hover, and named for what it is. A true hover tooltip needs
`interestfor` together with `popover="hint"`, which hands the browser the
interest delay, hover persistence, `Escape` handling and input-modality
rules. `popover="hint"` is not supported in Safari at all and has an
unstable history elsewhere, and `interestfor` is not yet broadly tracked —
so it is a future addition, not a thing to ship now.

## Behavior

* **Hidden unless open.** `[popover]` is `display: none` and only the
  `:popover-open` state reveals it. If a browser does not recognise the
  attribute, the content stays hidden rather than spilling into the page:
  it fails closed.
* Surface: `--cirth-popover-background-color` and
  `--cirth-popover-border-color`, with `--cirth-popover-box-shadow`. All
  three default to the card's own surface tokens, so a preset that
  recolors cards recolors this with them. The border is the muted hairline
  rather than the card's, because a sheet floating above the page needs an
  edge where a card sitting on it does not.
* Width is capped by `--cirth-popover-max-width` (30rem, and never more
  than the viewport minus a gutter) so a single long line cannot run the
  width of the screen. It is a safety rail, not a statement about how wide
  a panel should be — override it per popover when the content asks.
* Type size, line length and layout inside are untouched. A menu, a form
  and a paragraph all keep the styling they would have anywhere else.
* It fades in and out using `@starting-style` and discrete transitions —
  no class toggling, no script. Under
  [reduced motion](/utilities/reduce-motion) the fade collapses with
  everything else.
* `<dialog popover>` is left alone: dialogs have their own component and
  their own surface. See [Modal](/components/modal).
* So is `popover="manual"`. A manual popover is shown and hidden entirely
  by its author's script — application chrome, a toast, an overlay injected
  by tooling — and a library that paints a border and a fade onto it is
  redecorating something it knows nothing about. Only `auto` (the default,
  written as a bare `popover`) and `hint` are styled: those are the ones
  the browser light-dismisses on the reader's behalf, which is what makes
  them a panel.

## Positioning

A popover opens in the middle of the viewport. That is the browser's own
default, but Cirth states it rather than relying on it: the user agent
centres a popover by giving it `margin: auto` on all four sides, and any
rule of yours that sets a margin on that element — a container zeroing its
last child's, say — leaves the remaining sides to absorb the free space and
slides the panel to an edge. Cirth sets `inset: 0; margin: auto` on the open
panel so the centring survives ordinary layout CSS.

It does mean a hint can land on top of the control that opened it.

Attaching it to its trigger needs CSS anchor positioning, which is outside
Cirth's [browser floor](https://github.com/cirthcss/cirth#browser-support)
(Chrome 125, Firefox 147, Safari 26). Shipping it behind `@supports` would
serve one engine and not the others, so it is left to you — `position-area`
takes precedence over the centring above, so nothing needs undoing first:

```css
@supports (anchor-name: --hint) {
  [popovertarget] {
    anchor-name: --hint;
  }

  [popover] {
    position-anchor: --hint;
    position-area: block-end;
    margin: var(--cirth-space-2);
  }
}
```

## Accessibility

Most of this applies to the hint pattern; a menu or a panel opened from a
plain button carries its own semantics and needs none of it.

* **Keep hint content supplementary.** A reader whose browser lacks the
  Popover API sees nothing, by design. Anything essential belongs in the
  page, or behind a control that navigates somewhere it exists.
* **Always pair `popovertarget` with `aria-describedby`.** The first makes
  it work, the second makes it announced. Neither implies the other.
* **Use `type="button"`.** Inside a form, a button without it submits, and
  an unsupported attribute must not turn a hint trigger into a submit
  control.
* **Do not put `popovertarget` on a control that already does something.**
  On a submit or delete button, opening a panel is not the primary action.
  Give the hint its own trigger next to it.
