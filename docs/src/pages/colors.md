---
layout: docs.njk
description: The accent and the roles derived from it, the surface levels, edges, inks and states, and how the default palette is built.
---

# Colors

Cirth's colour is a few inputs and the roles derived from them. Set
`--cirth-primary` and every link, primary button, focus ring and checked
control follows; set `--cirth-canvas` and every surface level and every
edge moves with it. This page lists each role, what it is for, and its
value in the build this site loads. For light and dark and writing a theme
of your own, see [Themes](/themes); for the shipped presets, see
[Presets](/presets).

The accent is for action and position. Everything else is a surface level,
an edge, an ink or a state.

{% if not measured %}
The measured values on this page are read from `dist/tokens/` when the
site is built, and this build ran without it, so only the token names are
shown.
{% endif %}

## The accent

`--cirth-primary` is the input. These follow it, and you do not normally
set them:

| Token | Role |
| --- | --- |
| `--cirth-primary-text` | The accent as text: links and the current position. Its lightness is held at or under 0.52 in light and at or over 0.72 in dark, the range every surface level can carry text in |
| `--cirth-primary-surface` | The fill of a primary button. The accent itself in light; a deeper step in dark, so a white label keeps 4.5:1 |
| `--cirth-primary-border` | The edge of that fill |
| `--cirth-primary-active` | Text while active; darker in light, lighter in dark |
| `--cirth-primary-surface-active` | The fill while pressed |
| `--cirth-primary-border-active` | Its edge while pressed |
| `--cirth-primary-underline` | A link's underline: the accent at 50% alpha |
| `--cirth-primary-underline-active` | The underline while its link is active |
| `--cirth-primary-focus` | The focus ring: the accent's text role, opaque |
| `--cirth-primary-on-surface` | The label on the fill |

{% if measured %}
Measured on this build:

| Role | Light | Dark |
| --- | --- | --- |
| `--cirth-primary` | `{{ measured.accent.light.primary.hex }}`, `{{ measured.accent.light.primary.oklch }}` | `{{ measured.accent.dark.primary.hex }}`, `{{ measured.accent.dark.primary.oklch }}` |
| `--cirth-primary-text` | `{{ measured.accent.light.text.hex }}`, `{{ measured.accent.light.text.oklch }}` | `{{ measured.accent.dark.text.hex }}`, `{{ measured.accent.dark.text.oklch }}` |
| `--cirth-primary-surface` | `{{ measured.accent.light.surface.hex }}`, `{{ measured.accent.light.surface.oklch }}` | `{{ measured.accent.dark.surface.hex }}`, `{{ measured.accent.dark.surface.oklch }}` |
| Accent text, lowest contrast on any level | {{ measured.accent.light.textWorst | ratio }} | {{ measured.accent.dark.textWorst | ratio }} |
| Focus ring, lowest contrast on any level | {{ measured.accent.light.focusWorst | ratio }} | {{ measured.accent.dark.focusWorst | ratio }} |
| Label on the fill | {{ measured.accent.light.label | ratio }} | {{ measured.accent.dark.label | ratio }} |
{% endif %}

`--cirth-primary-on-surface` is the one to check when you pick an unusual
accent. It is white by default, which is right for most accents and wrong
for a light one: a pale yellow accent with white text on it is
unreadable. It is a plain value rather than a derivation because choosing
between light and dark text is a decision, not a mix. A relative-color
threshold was tested across 936 accents: 10 results missed 4.5:1 and it
chose the worse of black and white in 14 cases, concentrated around
cyan–teal. The exact `contrast-color()` decision is outside Cirth's browser
floor, so the role remains explicit until the platform can choose reliably.

```css
:root {
  --cirth-primary: #fbbf24;             /* a light yellow */
  --cirth-primary-on-surface: #1c1917;  /* so the label stays readable */
}
```

Each name says the role before the state: `text`, `surface`, `border`,
`underline`, `focus` and `on-surface`, with `-active` appended where a
state needs another value. The status families below use the same
vocabulary.

`--cirth-secondary-text` and `--cirth-contrast-text` anchor the other two
colour groups, with the same shape. The secondary group is tonal: its fill
is the ink at 9% (14% pressed) with no edge, so a secondary button never
outweighs the primary beside it. The contrast group is the maximum-contrast
fill. `.secondary` and `.contrast` on a button or link swap which group it
reads from; `.outline` and `.ghost` keep the group and drop the fill. See
[Button](/content/button).

## Surface levels

Four levels, each derived from `--cirth-canvas` with relative colour
syntax, lowest first. The light canvas is near white, so the level above
it is a sheet of near-white paper and the level below it has the room;
the dark canvas is near black, so every level above it has room to read
as lifted.

{% if measured %}
| Level | Token | Rule | Light | Dark |
| --- | --- | --- | --- | --- |
{%- for level in measured.levels %}
| {{ level.name }} | `--cirth-{{ level.token }}` | {% if level.light.rule %}`{{ level.light.rule }}`{% if level.dark.rule != level.light.rule %}; dark: `{{ level.dark.rule }}`{% endif %}{% else %}The input{% endif %} | `{{ level.light.hex }}`, L {{ level.light.l }} | `{{ level.dark.hex }}`, L {{ level.dark.l }} |
{%- endfor %}
{% else %}
| Level | Token |
| --- | --- |
| Recessed | `--cirth-surface-recessed` |
| Canvas | `--cirth-canvas` |
| Raised | `--cirth-surface-raised` |
| Overlay | `--cirth-surface-overlay` |
{% endif %}

What sits on each:

- **Recessed**: a code block, a live example's stage, a band that groups a
  section of a page.
- **Canvas**: the page.
- **Raised**: an `<article>`. A card's header and footer bands sit halfway
  between the canvas and this level
  (`--cirth-card-sectioning-background-color`). In light the step above the
  canvas is small, and a one-layer contact shadow
  (`--cirth-card-box-shadow`) completes it.
- **Overlay**: a dialog, a popover, a dropdown list. In light it is the
  raised level and its larger shadow lifts it; in dark it is also a clear
  step lighter than the raised level, so a floating sheet is lighter than
  what it covers as well as shadowed, and a one-pixel highlight catches its
  top edge.

Every level keeps the canvas's hue (the raised level in light keeps a
quarter of its chroma on its way to white), so a preset that tints its
canvas tints every level with it: `plain` is neutral, `material` keeps its
own hue, and no level is a wash of the accent.

`--cirth-surface` is the level the current element sits on: the canvas at
the root, rebound by every container that paints a level (an `<article>`,
a card's bands, a dialog, a popover, a dropdown list). A field paints
`--cirth-surface`, so it takes the level of whatever holds it. If you paint
a container of your own, set `--cirth-surface` on it to the same colour and
the fields inside follow.

Component tokens alias a level: `--cirth-card-background-color` is the
raised level, `--cirth-code-background-color` the recessed one, and the
dropdown and popover backgrounds the overlay one. Override the level to
move every component on it, or the component token to move one.

## Elevation

Two shadows, one per level that rises. A card casts a single contact
layer; a dialog, a popover and a dropdown list cast `--cirth-box-shadow`,
a contact layer and a wide ambient one. In dark the shadow is black and
denser, since a near-black page has little room below it, and the overlay
adds a one-pixel highlight on its top edge. `--cirth-modal-box-shadow`
follows `--cirth-box-shadow`, so one declaration turns every floating
shadow off; a card's is its own token. `material` keeps Material's own
elevation levels and flat cards; `metro` turns every shadow off.

## Edges

Three roles, derived from the same canvas, in rising contrast. Every edge
is one stroke, `--cirth-border-width`, on all four sides.

{% if measured %}
| Edge | Token | Rule | Light | Dark | On the canvas | Lowest on any level |
| --- | --- | --- | --- | --- | --- | --- |
{%- for edge in measured.edges %}
| {{ edge.name }} | `--cirth-{{ edge.token }}` | `{{ edge.light.rule }}`{% if edge.dark.rule != edge.light.rule %}; dark: `{{ edge.dark.rule }}`{% endif %} | `{{ edge.light.hex }}` | `{{ edge.dark.hex }}` | {{ edge.light.onCanvas | ratio }} · {{ edge.dark.onCanvas | ratio }} | {{ edge.light.worst | ratio }} · {{ edge.dark.worst | ratio }} |
{%- endfor %}

Contrast columns read light · dark.
{% endif %}

- **Separator** divides content inside a surface: table rows, a card's
  bands, a rule, a blockquote's edge.
- **Container** bounds a surface: a card, a popover, a dropdown list. It
  sits a quarter of the way from the separator to the control edge unless
  you set it.
- **Control** bounds something you operate: a field, a checkbox, a select,
  a meter.

Only the control edge carries a contrast requirement, WCAG 1.4.11's 3:1
for the boundary of a control, and it keeps it on every level in both
schemes. The separator and the container divide and bound content, and
stay as light as that job allows. Under `prefers-contrast: more` all three
move further from the canvas.

## Inks

{% if measured %}
| Ink | Token | Light | Dark | Lowest on any level | For |
| --- | --- | --- | --- | --- | --- |
{%- for ink in measured.inks %}
| {{ ink.name }} | `--cirth-{{ ink.token }}` | `{{ ink.light.hex }}` | `{{ ink.dark.hex }}` | {{ ink.light.worst | ratio }} · {{ ink.dark.worst | ratio }} | {{ ink.job }} |
{%- endfor %}

Contrast reads light · dark.
{% else %}
`--cirth-ink-strong` for headings, `--cirth-ink` for body text and code,
`--cirth-secondary-text` for secondary actions, `--cirth-muted-color` for
metadata, and `--cirth-primary-text` for links.
{% endif %}

`--cirth-ink` is the input of this family: `--cirth-color` and the
component inks (accordion summary, dropdown, popover, the `<kbd>` fill)
alias it. Headings `h1` to `h4` take the strong ink; `h5` and `h6` take the
body ink, because at body size a stronger ink is the one thing that would
separate them from bold text.

## States

Three families, each driving the same roles:

| Role | Used by |
| --- | --- |
| `--cirth-error` | The solid reading: a worst-band `<meter>` and the `.danger` button fill |
| `--cirth-error-text` | `<del>`, and status text on the page |
| `--cirth-error-border` | An `[aria-invalid="true"]` field, and its focus ring |
| `--cirth-error-active` | The edge of an outline `.danger` button while hovered or pressed |
| `--cirth-error-surface` | A tint to sit status content on |

`--cirth-success` and `--cirth-warning` have the same shape. The error family
has one role more, `--cirth-danger-on-surface`: the label on a `.danger`
button. It is white, and it is its own token rather than the primary's
label, so a theme that sets a dark `--cirth-primary-on-surface` for a light
accent keeps a readable label on a deep red fill. Set it only if your error
colour is light enough to need dark ink.

{% if measured %}
| State | Hue | Text, lowest on any level | Edge, lowest on any level |
| --- | --- | --- | --- |
{%- for status in measured.statuses %}
| {{ status.name | capitalize }} | {{ status.hue }}° | {{ status.light.textWorst | ratio }} · {{ status.dark.textWorst | ratio }} | {{ status.light.borderWorst | ratio }} · {{ status.dark.borderWorst | ratio }} |
{%- endfor %}

Contrast reads light · dark.
{% endif %}

A field in a validation state draws its focus ring in the state's edge
colour, so focus and validity never show two different colours on one
control. Disabled is not a state colour: every control takes
`--cirth-disabled-surface` (the ink at 6%) and `--cirth-disabled-color`
(the ink at 50%) and keeps its geometry, so a disabled primary button is
the same neutral as a disabled secondary one.

A `<mark>` does not imply warning: its background is derived from
`--cirth-primary`, so highlighted evidence follows the chosen accent while
status content stays on the explicit `*-surface` families.

Status hues are deliberately not fixed constants. If your brand overlaps a
conventional status hue, move the status family rather than avoiding the
brand: what has to stay true is that the two remain distinguishable, and
that state is never signalled by colour alone (WCAG 1.4.1). Cirth's own
validity styling pairs colour with an icon for that reason.

## Underlying palette

How the default palette is built. None of this is needed to use or retheme
Cirth: it is the reasoning behind the values, for anyone proposing a change
to them.

<details>
<summary>How the scales are derived</summary>

The theme's primitive color scales are Sass `oklch()` literals declared in
`src/theme/_colors.scss` and consumed by `_dual.scss`, `_light.scss`, and
`_dark.scss`. These Sass variables are not public CSS tokens. They seed the
defaults for public inputs such as `--cirth-primary`; relationships from those
inputs to derived semantic tokens remain in the compiled CSS as `var()`,
`color-mix()`, and relative `oklch()` rather than being baked into literals.

Scales are named for the role they play, not for their hue: `$accent-*`
seeds the default accent, `$neutral-*` carries ink, lines and the dark
canvas, and the status colors are `$error-*`, `$success-*` and
`$warning-*`, not `$red-*`, `$green-*` or `$yellow-*`, because that's what
they mean everywhere they're used (invalid/valid form state,
deleted/inserted text).

All five scales share one lightness ladder with 19 steps, from 950
(darkest) to 50 (lightest) in increments of 50 and evenly spaced from 18%
to 96%. Every family defines every step, and picking one is the same
exercise regardless of which family you're in. Chroma is derived rather
than chosen by hand.

Each chromatic scale is pinned to one hue and held at a constant fraction
of that hue's own maximum sRGB chroma within the gamut at every step. The
fraction is the family's voice. `$error-*`, `$success-*` and `$warning-*`
sit at 85%: a status color has to be recognisable at a glance in a small,
rare mark. `$accent-*` sits at 70%, because the accent is the opposite
case: it fills a primary button on every screen, so the fraction that makes
a status mark legible would make the accent the loudest thing on the page.
The families don't peak at the same step because sRGB's gamut boundary
shape differs per hue. For example, red's ceiling sits at a darker
lightness than green's, but every step of every scale sits at the same
fraction of what's actually displayable, so the shape difference is the
gamut talking, not an inconsistency between families.

`$neutral-*` is derived differently, because it isn't an accent. Its chroma
is a bell that peaks mid-ladder and fades to nothing at the pale end: a
light grey needs more chroma than a dark one to read as tinted rather than as
plain grey, and a large pale surface needs none at all, but it doesn't
return to zero at the dark end. It floors at 70% of the peak, because the
deepest inks and the shadow of a light page come from the two darkest
steps, and a bell that closed symmetrically left them achromatic whatever
hue the family was given.

The neutral's hue does real work: at {{ measured.neutralHue if measured else 120 }}deg it
is a grey with a trace of olive, opposite the accent on both of Oklab's
colour axes: green where the accent is red, yellow where it is blue. That is
what lets the accent read as a signal for a reader who loses one of those
axes. Under protanopia, deuteranopia or tritanopia the neutral at the
accent's lightness stays clearly apart from it, where a neutral moved round
toward the accent's hue would leave lightness as the only thing separating
a link from the text around it. Both canvases take the neutral's hue too,
so the accent is left to action and position.

`$accent-*`'s hue (324deg, a magenta) isn't an arbitrary pick. Of the hues
that keep the accent apart from the neutrals and from the status colours
under colour vision deficiency, it sits furthest from the accents of widely
used systems and CSS tools. `$error-*` sits a deliberate 62deg away from it:
a destructive action and a primary one share a page, and the palette has to
keep them apart without either raising its voice.

The presets (`src/presets/`) declare only the values for the
inputs and roles they intentionally change. They do not duplicate the theme's
surface levels, component styles, reset rules, or scheme wiring: each scheme
difference is stated once as a `light-dark()` pair, which is why `plain` fits
in five declarations.

Cirth targets browsers with native `oklch()` support (see the `browserslist`
field in `package.json`), so the compiled CSS ships `oklch()` directly rather
than converting it to a `hex` / `lab()` fallback.

</details>

## Theme history

Cirth previously inherited a set of twenty accent color themes from Pico CSS, then
briefly maintained three full themes (azure, jade, slate). That has been
reduced further to a single official theme plus token override presets,
first `plain` and `playroom`, now `plain` and `material`. The official theme's accent was a yellow-orange until
0.15 and a copper through 0.16; it is now the magenta described above, with
the neutral, surface and status families rebuilt around it rather than
adapted to it. See
[About](/about) for the project's history and
[Contributions](/contributions) before proposing color system changes.
