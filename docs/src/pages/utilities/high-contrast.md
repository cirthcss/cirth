---
layout: docs.njk
---

# High contrast

Cirth responds to `prefers-contrast: more`, the preference a reader sets
when the default palette is not separating enough for them. It applies in
both color schemes, and needs no class, no attribute, and no JavaScript.

## Two different mechanisms

They are often confused, and Cirth supports both:

| Preference | Who owns the palette | What Cirth does |
| --- | --- | --- |
| `forced-colors: active` (Windows High Contrast) | The operating system, which replaces author colors outright | Makes sure nothing *disappears* under the replacement — focus rings are backed by a transparent `outline` (a stripped `box-shadow` would leave no visible focus), and the loading spinner falls back to `CanvasText` |
| `prefers-contrast: more` | Cirth | Keeps the palette and stops spending it on subtlety |

`prefers-contrast: more` is the softer of the two: the design still looks
like itself, it just stops being quiet.

## Behavior

Under `prefers-contrast: more`, in both light and dark:

* **Text goes to WCAG AAA.** Body ink reaches 15:1 or better against the
  surface it sits on, and the six-step heading ramp collapses onto it —
  six shades of near-black is a screen luxury, not information.
* **Secondary ink reaches 8.7:1 or better**, up from a shade over the AA
  floor. Muted text, code, and visited links stay subordinate without
  staying faint.
* **Hairlines become real lines.** `--cirth-muted-border-color` (table
  rules, card and blockquote edges, `<hr>`, accordion dividers) and
  `--cirth-form-element-border-color` climb well past the 3:1 non-text
  floor. In the dark scheme a card's border is normally its own background
  — an invisible seam — and becomes a visible edge here.
* **Link underlines lose their tint.** The half-alpha underline under
  links goes to the full link color.
* **Focus rings turn opaque.** A translucent ring composites against
  whatever is behind it, which is exactly what "more contrast" is asking
  us to stop doing.
* **State-bearing fills strengthen**: the unchecked switch track and the
  progress track's extent, plus the valid/invalid field borders.

## Presets

The [`cobalt` and `coral`](/customization) presets carry their own version
of this pass. They have to: a preset is loaded after Cirth and redeclares
the same tokens on the same roots, so anything the framework's pass
strengthened would be handed straight back to the screen values.
Each preset restates only the tokens it overrides — its accent, muted
inks, hairlines, and visited color — at its own hue and at the same
targets, verified against its own canvas. If you write your own preset,
do the same for whichever color tokens you override.

## What stays the same

**Geometry.** No border grows, no control resizes, no spacing changes.
Cirth's control height (44px, the WCAG 2.5.5 target size) is computed from
`--cirth-border-width`, so thickening borders under this preference would
silently resize every control in the library. The extra contrast is bought
with color instead.

## Testing it

* **macOS** — System Settings → Accessibility → Display → Increase
  contrast.
* **Windows** — Settings → Accessibility → Contrast themes (this also
  triggers `forced-colors: active`).
* **Chrome DevTools** — Rendering panel → "Emulate CSS media feature
  prefers-contrast" → `more`.

## Customization

The overrides are plain token declarations, applied through the same
light/dark wiring as the schemes themselves. That is also what your own
overrides have to match: like every other color token in Cirth, these are
declared on the scheme roots (`:root:not([data-theme="dark"])` and
`[data-theme="dark"]`), so a bare `:root` rule is less specific and loses,
however late it is loaded.

```css
@media (prefers-contrast: more) {
  :root:not([data-theme="dark"]) {
    --cirth-primary: #6b3f00;
    --cirth-muted-border-color: #595f6b;
  }

  [data-theme="dark"] {
    --cirth-primary: #ffd48a;
  }
}
```

In a scoped build, swap `:root` for the scope wrapper
(`.cirth:not([data-theme="dark"])`).
