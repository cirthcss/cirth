---
layout: docs.njk
description: What Cirth does for accessibility by default, how it follows increased contrast, forced colors and reduced motion, and what stays the job of the interface you build.
---

# Accessibility and user preferences

Cirth styles native HTML, so the semantics a browser and assistive
technology rely on are the ones you already wrote. On top of that it sets a
checked baseline for contrast, focus and target size, and follows the
preferences a reader sets in their system, with no class, attribute or
script from you.

<dl class="grid docs-facts">
<div><dt>Contrast</dt><dd>WCAG 2.2 AA in both schemes and every shipped preset</dd></div>
<div><dt>Focus</dt><dd>Always visible, including under forced colors</dd></div>
<div><dt>Targets</dt><dd>44px buttons and controls, 40px inside a nav bar</dd></div>
<div><dt>Preferences</dt><dd>Increased contrast, forced colors, reduced motion</dd></div>
</dl>

## The baseline

- **Contrast.** Text, icons, control borders and focus rings meet WCAG 2.2 AA
  against the surfaces they sit on, in the light and dark schemes and in
  every shipped preset. Every page of this site is audited with axe
  in each of those, on every push.
- **Focus.** Every interactive element shows a focus ring when it is reached
  from the keyboard. The ring is backed by an `outline`, so it survives modes
  that strip `box-shadow`.
- **Target size.** Buttons, fields and selects are at least 44px tall
  whatever their font size (WCAG 2.5.5). Inside a `nav` the floor becomes a
  compact 40px band, still well above the 24px of WCAG 2.5.8.
- **Native behaviour.** Accordions, dropdowns, modals and popovers are
  `<details>`, `<dialog>` and `[popover]`, so keyboard handling, focus
  management and dismissal are the browser's.
- **Validation that waits.** `:user-invalid` shows an error only after the
  reader has interacted with a field, never on load. See
  [Validation and states](/forms/validation).

That is a floor Cirth checks for its own elements and defaults. The
interface you build on top of it still needs its own review: headings in a
sensible order, names for icon-only buttons, labels for every field, and
testing with the assistive technology your readers use.

## Attributes Cirth responds to

A few interaction hints are applied by attribute rather than by class:

- `[aria-controls]` gets `cursor: pointer`, a hint that the element toggles
  something else.
- `[aria-disabled="true"]` and `[disabled]` get `cursor: not-allowed`.
- `[aria-hidden="false"][hidden]` is shown (`display: initial`) and visually
  clipped until it is focused, for content that must stay in the
  accessibility tree without taking space.
- `[dir="rtl"]` sets `direction: rtl`. Components that draw icons or
  directional spacing (breadcrumbs, dropdowns, form icons) mirror under it;
  each component page notes its own behaviour.

For text that only assistive technology should read, use the
[screen-reader only](/utilities/sr-only) utility.

## Increased contrast

Under `prefers-contrast: more`, in both schemes, Cirth keeps its palette and
stops spending it on subtlety:

- **Text goes to WCAG AAA.** Body ink reaches 15:1 or better against its
  surface, and the six heading shades collapse onto it.
- **Secondary ink reaches 8.7:1 or better**: muted text, code and visited
  links stay subordinate without staying faint.
- **Hairlines become real lines.** Table rules, card and blockquote edges,
  `<hr>`, accordion dividers and field borders climb well past the 3:1
  non-text floor. In the dark scheme a card edge that is normally a quiet
  seam becomes a visible line.
- **Link underlines lose their tint**, and **focus rings turn opaque**.
- **State-bearing fills strengthen**: the unchecked switch track, the
  progress track, and the valid and invalid field borders.

Geometry does not change: no border grows and no control resizes. A thicker
border would make every control taller, so the extra contrast is bought with
colour.

The shipped presets carry their own version of this pass,
because a preset redeclares the same tokens after Cirth and would otherwise
hand the screen values back. If you write your own theme, restate the colour
tokens you override inside the same media query:

```css
@media (prefers-contrast: more) {
  :root {
    --cirth-muted-border-color: #595f6b;
  }
}
```

To give the two schemes different values, write the pair with `light-dark()`
as described in [Themes](/themes#light-and-dark).

## Forced colors

`forced-colors: active` (Windows contrast themes) is a different mechanism:
the operating system replaces author colours outright. Cirth's job there is
to make sure nothing disappears:

- Focus rings are drawn with a transparent `outline` behind the
  `box-shadow`, so the system paints a visible ring when it strips the
  shadow.
- Icons drawn with a mask (the checkbox tick, the accordion and dropdown
  chevrons, the modal's close control) are painted in `CanvasText`, and the
  loading spinner falls back to it too.
- `<mark>` uses the system's `Mark` and `MarkText` colours.
- The segmented control keeps its radio dots and borders, so the selection
  does not depend on a fill the system removes.

| Preference | Who owns the palette | What Cirth does |
| --- | --- | --- |
| `prefers-contrast: more` | Cirth | Strengthens its own colours |
| `forced-colors: active` | The operating system | Keeps every edge, icon and focus ring visible |

## Reduced motion

Under `prefers-reduced-motion: reduce`, every element except one with
`aria-busy="true"` gets:

- animations collapsed to effectively instant (`animation-duration: 1ms`,
  one iteration);
- transitions collapsed to `--cirth-duration-instant` (`0ms`), and
  `--cirth-transition` itself pointed at that duration;
- `scroll-behavior: auto` and `background-attachment: initial`.

The [loading](/components/loading) spinner is exempt on purpose: it is how a
busy state is communicated, and stopping it would hide that.

Re-pointing the token is what reaches inside native controls. A selector list
covers elements and their `::before` and `::after`, but not the engine
pseudo-elements a control is built from, such as the range thumb, and a list
naming one engine's pseudo-element is discarded whole by the other. Those
parts inherit the custom property, so anything built from
`--cirth-transition` follows the preference: Cirth's own
[progress](/components/progress) sweep, [popover](/components/popover)
fade, [modal](/components/modal) animation and [range](/forms/input-range)
thumb, and any transition you write with the token.

## Print

Printing is a user preference too. Cirth's print styles ship as a separate
stylesheet; [Print](/utilities/print) covers which one goes with which
build.

## Testing the preferences

- **macOS**: System Settings → Accessibility → Display → Increase contrast,
  and Reduce motion.
- **Windows**: Settings → Accessibility → Contrast themes (this triggers
  `forced-colors: active`), and Visual effects → Animation effects.
- **Chrome DevTools**: the Rendering panel emulates `prefers-contrast`,
  `prefers-reduced-motion`, `prefers-color-scheme` and `forced-colors`.
