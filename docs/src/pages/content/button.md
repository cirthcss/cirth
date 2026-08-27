---
layout: docs.njk
---


# Button

`button`, `[type="submit"]`, `[type="reset"]`, `[type="button"]`,
`[role="button"]`, and a file input's `::file-selector-button` all share the
same button styling, with no `.btn` class required.

{% demo "buttons" %}

```html
<button type="button">Primary</button>
<button type="button" class="secondary">Secondary</button>
<button type="button" class="contrast">Contrast</button>
<button type="button" class="outline">Primary outline</button>
<button type="button" class="ghost">Primary ghost</button>
<button type="button" disabled>Disabled</button>
```

## Color modifiers

Modifier classes (default build only) swap which color group a button reads
`--cirth-background-color`/`--cirth-border-color`/`--cirth-color` from:

| Class | Color group |
| --- | --- |
| *(none)* | Primary |
| `.secondary` | Secondary |
| `.contrast` | Contrast |
| `.outline` | Primary, on the page surface |
| `.outline.secondary` | Secondary, on the page surface |
| `.outline.contrast` | Contrast, on the page surface |
| `.ghost` | Primary, no surface and no border |
| `.ghost.secondary` | Secondary, no surface and no border |
| `.ghost.contrast` | Contrast, no surface and no border |

### Quiet variants

`.outline` and `.ghost` are the two quiet treatments, and they differ in
one thing: whether the control owns an opaque surface.

`.outline` does. It paints `--cirth-canvas`, the page surface, so it stays
a control wherever it sits rather than letting whatever is behind it show
through — and it draws a border. `.ghost` owns neither, which makes it the
right choice for an icon button in a header or a toolbar, where a border
would be one line too many.

Both answer `:hover` by tinting their own background with their colour
group rather than switching to a filled treatment: the point of a quiet
button is that it stays quiet, and a wash is enough to say it is live.
`.ghost` mixes toward `transparent` so the wash composites over whatever it
is actually on — a card, a header, a popover — while `.outline`, already
opaque, mixes toward the canvas it is painting.

A ghost button keeps a transparent border rather than removing it, so
swapping between the variants never moves the layout.

Without `$enable-classes` (the classless build), `[type="reset"]` and a file
input's selector button still get secondary styling automatically, since
there's no way to add `.secondary` to them.

## States

* `:hover` / `:active` / `:focus` / `[aria-current]` switch to the
  hover background and hover border tokens.
* `:focus` additionally layers a focus ring in `--cirth-primary-focus` (or
  the matching `-focus` token for the active color group) on top of the
  hover shadow.
* `[disabled]` drops opacity to `--cirth-opacity-disabled` and disables
  pointer events.
* A submit button (`[type="submit"]`, or a plain `button` with no `type`,
  which defaults to submit) inside a `form:invalid` drops to
  `--cirth-opacity-disabled` too, but stays **fully clickable** — no
  `pointer-events: none`, no `[disabled]`. This is deliberate: a truly
  disabled submit button can't be activated, so it can never trigger the
  browser's own constraint-validation messages, and screen reader users get
  no explanation for why nothing happens. Leaving it operable means a click
  (or Enter) still surfaces the native "please fill in this field" UI with
  zero JS. Note a required-but-untouched form is already `:invalid` on
  first paint, so the button can look muted before the user has done
  anything wrong — accepted as the trade-off for zero-JS feedback once
  fields start getting filled in.
* Combine with [Loading](/components/loading) (`aria-busy="true"`) to show a
  spinner while a button's action is pending. Add the native `disabled`
  property separately if the action must not run twice.

## Native behavior first

Prefer a native `<button>` for actions. Styling `[role="button"]` does not
make a generic element focusable and does not add Enter or Space activation;
those behaviors, disabled-state handling, and form behavior remain the
application's responsibility. Use the ARIA role only when native HTML cannot
represent the control and its complete keyboard interaction is implemented.

For navigation, keep an anchor's link semantics. Do not add `role="button"`
to an `<a href>` merely to change its appearance: a link announces and
behaves differently from a button, and CSS cannot repair that semantic
mismatch.
