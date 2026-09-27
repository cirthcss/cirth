---
layout: docs.njk
---

# Upgrading

Cirth is pre-1.0, so a breaking change ships in a minor release. Every one
gets an entry here saying what stopped working and what to do about it, and
one that leaves the documented API behind it also starts a new line of
documentation: the selector in the header switches between them.

After 1.0 the same boundary becomes a major release, and this page keeps
working the way it already does.

## Next release, from v0.16.x

Not released yet: this section describes the development line. The class
list stays the same; the defaults underneath it change in four places.
Surfaces and edges come from four named levels and three named edges, type
comes from roles, the primary is always the heaviest action, and space
between elements comes from their relation rather than from margins they
carry. Each change has a spec in the repository's `specs/` directory.

### Surfaces and edges

| If you | Then |
| --- | --- |
| Override `--cirth-canvas` | Nothing: every surface level and every edge follows it |
| Override `--cirth-card-background-color`, `--cirth-code-background-color`, `--cirth-dropdown-background-color` or `--cirth-popover-background-color` | Still works. To move a whole level, override `--cirth-surface-raised`, `-recessed` or `-overlay` instead |
| Rely on fields being darker than the page | A field now paints the surface it sits on, `--cirth-surface`; set `--cirth-form-element-background-color` to give every field a fill of its own |
| Use `--cirth-form-element-active-background-color` | Removed: focus no longer changes a field's fill |
| Paint your own container background and put fields in it | Set `--cirth-surface` on it to the same colour |
| Read `--cirth-table-border-color` as the card's edge | It is the separator now; `--cirth-card-border-color` sits between the separator and the control edge unless you set it |
| Count on the modal having no shadow | It takes the overlay shadow; set `--cirth-modal-box-shadow: none` |
| Read `--cirth-box-shadow` as seven layers | It is two |
| Read `--cirth-primary-text` as exactly `--cirth-primary` | It is the accent held within the lightness range every surface level can carry: at most 0.52 in light, at least 0.72 in dark |

### Type

| If you | Then |
| --- | --- |
| Set `--cirth-letter-spacing-tight` or `-snug` | Removed. Set `--cirth-tracking-optical` (0 turns the correction off), or `--cirth-letter-spacing` on one heading |
| Relied on headings at 700 | Set `--cirth-heading-font-weight` and `--cirth-title-font-weight` |
| Relied on buttons, summaries or terms at 600 | Set `--cirth-font-weight` on them |
| Styled column heads as body text | They are metadata now (13px, medium, muted); set `font-size` and `color` on `thead th` |
| Relied on the heading colour fade from h1 to h6 | Set `--cirth-h1-color` … `--cirth-h6-color` |
| Read `--cirth-code-color` as the muted ink | It is the body ink |

### Controls

| If you | Then |
| --- | --- |
| Relied on the dark filled `.secondary` button | It is tonal now; set `--cirth-secondary-surface`, `-surface-active`, `-on-surface` and `-border` to the old values |
| Relied on full-width submit buttons | Add `width: 100%` to them, or place them in a `.grid` |
| Set `--cirth-opacity-disabled` or `--cirth-form-element-disabled-opacity` | Removed. Disabled controls take `--cirth-disabled-surface` and `--cirth-disabled-color` |
| Set `--cirth-form-element-active-border-color` or the valid/invalid `-active-border-color` tokens | Removed: an edge keeps its colour on focus, and the ring (`--cirth-form-element-focus-color`, rebound by each state) carries the focus |
| Set `--cirth-group-box-shadow-focus-with-button` or `-with-input` | Removed: a group draws one outline ring around the row |
| Styled a focus ring through `box-shadow` | Focus is an `outline` with `outline-offset: var(--cirth-outline-offset)` |
| Styled inline `code` expecting the chip | Set `padding`, `background` and `display: inline-block` on it |
| Relied on 2px checkbox and radio borders | Set `--cirth-border-width` on `[type="checkbox"], [type="radio"]` |

### Space between elements

| If you | Then |
| --- | --- |
| Zeroed `margin-bottom` on a Cirth element to remove its space | Zero `margin-block-start` on the element after it, or `margin: 0` on both |
| Built a flex or grid row out of Cirth blocks (`article`, `label`, `fieldset`, fields, paragraphs) | Give the row `gap` and its children `margin: 0`: the second item would otherwise take the element step as a vertical offset |
| Relied on space after a `div` wrapper | A `div` is not a flow block; put the space on the wrapper, or use a block element |
| Set `--cirth-typography-spacing-top` on a heading | Removed. Set `margin-block-start` on the heading, or change `--cirth-flow-section` or `--cirth-flow-group` |
| Relied on 4px between list items | Items are a line apart (`--cirth-flow-line`, 8px at the default) |
| Set `--cirth-spacing` | Nothing: every step of the flow follows it |

## To v0.16.0, from v0.14.x

The public class list stays the same. Every stylesheet now keeps its rules
in a cascade layer, the accent token families use role names, and containers
and modals size continuously instead of stepping through a shared viewport
table. Check the cases below if other CSS on your page relied on Cirth
overriding it, if your CSS overrides an accent role, or if you depended on
the old layout details.

### Cirth's rules are in a cascade layer

Every build, print sheet and preset now wraps all of its rules in
`@layer cirth`. CSS outside a layer beats it whatever its specificity and
wherever it loads, so an override no longer has to match or out-weigh
Cirth's selector. Nothing inside Cirth moved: the rules, their order and
their weight are the ones the previous release shipped, and build, preset
and print sheet still load in that order.

What changes is everything on the page that is not Cirth. Anything that
used to lose to Cirth on specificity or on loading order now wins:

| If you… | Now | Do this |
| --- | --- | --- |
| Load a stylesheet *before* Cirth so Cirth overrides it (a reset, legacy base styles, a third-party widget's theme) | That stylesheet beats Cirth wherever they overlap | Put it in a layer ordered before Cirth's: `@layer legacy, cirth;` then `@import url("legacy.css") layer(legacy);` |
| Embed a scoped build in a page with its own global CSS | The host's unlayered rules win inside `.cirth`; the prefix no longer out-weighs a host `button { … }` | If the host CSS is yours, layer it the same way. If it is not, mount the widget in a shadow root |
| Rely on `[hidden]` or `.sr-only` beating your own element rules | Your `display` or `position` wins | Exclude the state in your selector, e.g. `nav ul:not([hidden])` |
| Have a layout rule that reaches a popover by accident, e.g. `.panel > :last-child { margin-bottom: 0 }` | It beats the popover's own centring, and the open panel slides to an edge | Leave popovers out: `.panel > :last-child:not([popover])` |
| Rely on Cirth's reduced-motion or print pass to neutralize your own animations or screen styles | They no longer reach your rules | Write your own `@media (prefers-reduced-motion: reduce)` or `@media print` rules |
| Wrote `.cirth`-prefixed, repeated-class or `:root:not(…)` selectors to beat Cirth | Nothing breaks | Optional: simplify them |
| Import Cirth into a layer yourself, `@import … layer(cirth)` | Nothing breaks: Cirth nests as `cirth.cirth` and sorts where `cirth` does | Optional: switch back to a plain `<link>` |
| Load a preset with a scoped build | The preset now applies inside `.cirth`; before, it silently did nothing | Remove any workaround that copied preset values onto the wrapper |

If you use layers of your own, state their order before Cirth loads, for
example `@layer reset, cirth, components;`, so that it does not depend on
which stylesheet the page happens to load first. See
[Cascade layers](/customization#cascade-layers) for the full model and the
CDN and npm forms.

### Accent tokens are named by role

`primary`, `secondary` and `contrast` still identify the three public colour
groups, and `--cirth-primary` remains the input that retunes the accent.
Their downstream tokens now say what they paint before naming a state. This
brings them into the `text` / `border` / `active` / `surface` vocabulary
already used by the error, success and warning families.

If your theme overrides a downstream accent token, rename it with this map;
the values and relationships have not changed:

| Before | After |
| --- | --- |
| `--cirth-secondary` / `--cirth-contrast` | `--cirth-secondary-text` / `--cirth-contrast-text` |
| `*-background` | `*-surface` |
| `*-hover` | `*-active` |
| `*-hover-background` | `*-surface-active` |
| `*-hover-border` | `*-border-active` |
| `*-hover-underline` | `*-underline-active` |
| `*-inverse` | `*-on-surface` |

`--cirth-primary-text` is the new derived text role; it follows the unchanged
`--cirth-primary` input. The `.secondary` and `.contrast` classes are also
unchanged: this is a custom-property migration, not a markup migration.

`--cirth-primary-on-surface` remains an explicit light-or-dark ink rather
than deriving from `--cirth-primary`. Existing themes only rename their
`--cirth-primary-inverse` override; a light accent still needs a deliberately
dark on-surface value. The available relative-color threshold cannot make
that choice reliably across hues, and `contrast-color()` is outside Cirth's
browser floor.

### Container gutters have their own token

`.container`, `.container-fluid`, and the classless `header`/`main`/`footer`
landmarks now use `--cirth-container-gutter`, whose default is
`clamp(1rem, 4%, 3rem)`. Changing `--cirth-spacing` no longer changes their
inline gutter; it remains the flow knob: prose rhythm, section margins and
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
or Space, because CSS cannot reach keyboard activation, so the protection
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
activation alike: `aria-disabled` describes the state, it does not enforce
it.

This line of documentation still covers v0.13.0: nothing above changes the
token surface, the build layout or the class list that v0.13.0 introduced,
so the switcher keeps one entry for both.

## To v0.13.0, from v0.12.x

Two behaviour changes. Neither touches your markup, and one of them is a
line you have to add.

### Print is a separate stylesheet

The `@media print` pass no longer rides inside the main build. A page that
links only `cirth.min.css` now prints with no pass at all: the same
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
has its matching sheet: `cirth.print.classless.min.css`,
`cirth.print.scoped.min.css`, `cirth.print.classless.scoped.min.css`, or,
from npm, `@cirthcss/cirth/print` and its `classless`/`scoped` variants.

It moved because print styling is around 900 B gzipped that is never needed
to paint the screen. Kept in the bundle it was charged to every visitor on
the first round trip, including the ones who never print; as a separate
sheet whose media query does not match the display, the browser fetches it
at low priority.

### A `:root` override now reaches into forced-scheme subtrees

Nothing to change if you customize at `:root` and let the page follow one
scheme; that case only got more predictable. This matters if you force a
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

If you were relying on the old behaviour (an override that deliberately
did *not* reach a forced-scheme widget), scope it to say so:

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
[Customization](/themes#light-and-dark).

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
for (gh#86). `plain` is the conventional application baseline: reach for
it where you reached for `cobalt`. `playroom` is softer and more expressive
than `coral` was, with large radii, a rounded face and springy motion.

If you were depending on the exact colours of either, the honest migration
is to copy the values you cared about out of the old file and set them
yourself, which is now a much shorter list than it used to be, since the
accent's hover, focus and underline derive from `--cirth-primary`.

### `.outline` buttons have a surface now

An outline button used to be transparent. It paints `--cirth-canvas`, the
page surface, and tints it on hover. Nothing changes where one sits on the
page, which is most places, but on a card, a coloured band or a header it
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

`input`, `select` and `textarea` had no `:hover` at all. They do now: the
border moves toward the field's own ink, which is deliberately not the
focus treatment. Nothing to change unless you were relying on a field
looking identical whether or not the pointer was over it; `[readonly]` and
`[aria-invalid]` fields are left alone.

### While you are here

Neither of these is breaking, but both change what you have to write:

* **The accent is an input.** Setting `--cirth-primary` now retunes the
  background, hover, focus and underline tint with it. If you were setting
  all of them to keep them in step, you can delete every line but the first
   Unless you meant them to diverge, in which case they still do.
* **Status colors exist.** `--cirth-error`, `--cirth-success` and
  `--cirth-warning` drive the validation borders, the meter readings, the
  `<ins>`/`<del>` inks and status surfaces. Retuning a status treatment used
  to mean finding each consumer; now it is one token per family. `<mark>`
  follows `--cirth-primary` instead: relevance no longer borrows the warning
  family.
* **`--cirth-canvas` is new**: the page surface as a value of its own.
  `--cirth-background-color` is the slot components paint through: a
  button rebinds it to its own fill, so it was never a reliable way to
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
ordinary content, but the tooltip text, which lived inside the attribute,
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
reaches it even while it is closed. See [Popover](/components/popover),
and note that it opens on activation rather than hover, which is a
deliberate difference and not a limitation to work around.

If the text is essential, put it in the page instead. A popover is
supplementary by design.

### The modal's JavaScript hooks are gone

`.modal-is-open`, `.modal-is-opening`, `.modal-is-closing` and
`--cirth-scrollbar-width` no longer exist. A script that still toggles
those classes keeps working: they simply do nothing, so nothing breaks
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
to do nothing: the scheme roots outweighed it, whatever the loading order
, so an override written, found ineffective and left in the codebase now
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
and keeps winning. [Customization](/themes#light-and-dark)
covers overriding one scheme at a time.

### The browser floor moved

To Chrome 123, Firefox 130, Safari 18.2, roughly 78% of global browser
usage, up from the previous line's floor but no longer covering Safari
17.x and older. The features the removals above depend on (`popover`,
`@starting-style`, `scrollbar-gutter`, `:has()`) are why.

If you support older browsers, stay on the `up to v0.10.0` line: it is
still published, still documented, and `0.10.0` remains installable.

```sh
npm install @cirthcss/cirth@0.10.0
```
