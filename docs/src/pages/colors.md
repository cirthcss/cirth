---
layout: docs.njk
description: The copper accent and the roles derived from it, the status colours, the surface ladder, and how the default palette is built.
---

# Colors

Cirth's colour is a handful of inputs and the roles derived from them. Set
`--cirth-primary` and every link, button, focus ring and checked control
follows; set `--cirth-canvas` and the whole surface ladder moves with it.
This page lists what each input drives. For light and dark, the `plain` and
`playroom` presets and writing a theme of your own, see [Themes](/themes).

The default theme is copper on mineral paper in light, and on graphite in
dark. Copper is reserved for signal: links, primary actions, focus and
selection. Everything else is ink, surface and hairline.

## The accent

`--cirth-primary` is the input. These follow it, and you do not normally
set them:

| Token | Relationship |
| --- | --- |
| `--cirth-primary-text` | The accent as text: links and quiet controls |
| `--cirth-primary-surface` | The filled surface. Same as the accent in light; darker in dark |
| `--cirth-primary-border` | The edge of that filled surface |
| `--cirth-primary-active` | Active text and quiet-control edges; darker in light, lighter in dark |
| `--cirth-primary-surface-active` | The filled surface, one step further |
| `--cirth-primary-border-active` | The active edge of that surface |
| `--cirth-primary-underline` | The accent at 50% alpha |
| `--cirth-primary-underline-active` | The underline while its link is active |
| `--cirth-primary-focus` | The accent at 75% alpha, the focus ring |
| `--cirth-primary-on-surface` | The text that sits *on* the accent |

`--cirth-primary-on-surface` is the one to check when you pick an unusual
accent. It is white by default, which is right for most accents and wrong
for a light one: a pale yellow accent with white text on it is
unreadable. It is a plain value rather than a derivation because choosing
between light and dark text is a decision, not a mix. A relative-color
threshold was tested across 936 accents: 10 results missed 4.5:1 and it
chose the worse of black and white in 14 cases, concentrated around
cyan–teal. The exact `contrast-color()` decision is outside Cirth's browser
floor, so the role remains explicit until the platform can choose reliably.
A future theme generator can make the same choice before it emits a theme.

```css
:root {
  --cirth-primary: #fbbf24;          /* a light amber */
  --cirth-primary-on-surface: #1c1917;  /* so the label stays readable */
}
```

The name now says the role before it says the state: `text`, `surface`,
`border`, `underline`, `focus`, and `on-surface`, with `-active` appended
where a state needs another value. That is the same vocabulary the status
families use below, rather than the former mix of `background`, `hover` and
`inverse`.

`--cirth-secondary-text` and `--cirth-contrast-text` anchor the other two
colour groups, with the same shape. They are roles rather than inputs: the
default theme chooses their neutral and maximum-contrast values directly.
`.secondary` and `.contrast` on a button or link swap which group it reads
from; `.outline` and `.ghost` keep the group and drop the fill. See
[Button](/content/button).

## Status colours

Three inputs, each driving four roles:

| Role | Used by |
| --- | --- |
| `--cirth-error` | The solid reading: a worst-band `<meter>` and the `.danger` button fill |
| `--cirth-error-text` | `<del>`, and status text on the page |
| `--cirth-error-border` | An `[aria-invalid="true"]` field |
| `--cirth-error-active` | That field while it has focus |
| `--cirth-error-surface` | A tint to sit status content on |

`--cirth-success` and `--cirth-warning` are identical in shape. A `<mark>`
does not imply warning: its background is derived from `--cirth-primary`, so
highlighted evidence follows the chosen accent while status content stays on
the explicit `*-surface` families.

Status hues are deliberately not fixed constants. If your brand overlaps a
conventional status hue, move the status family rather than avoiding the
brand: what has to stay true is that the two remain distinguishable, and
that state is never signalled by colour alone (WCAG 1.4.1). Cirth's own
validity styling pairs colour with an icon for that reason.

## Surfaces

| Token | What it is |
| --- | --- |
| `--cirth-canvas` | The page surface |
| `--cirth-ink` | The page text colour |
| `--cirth-code-background-color` | A recessed band: `<pre>`, inline `<code>` |
| `--cirth-form-element-background-color` | A field at rest |
| `--cirth-card-sectioning-background-color` | A card's header and footer band |
| `--cirth-card-background-color` | An `<article>`; a dropdown and a popover follow it |
| `--cirth-form-element-active-background-color` | A focused field; rises back to the canvas |
| `--cirth-muted-color` | Subordinate text |
| `--cirth-muted-border-color` | Hairlines: tables, cards, blockquotes |

`--cirth-canvas` and `--cirth-ink` are the two inputs in this family: the
page's surface and the page's ink. Set either and the tokens that alias it
follow: `--cirth-background-color` and the surface ladder from the canvas,
`--cirth-color` and the component inks (accordion summary, dropdown,
popover, the `<kbd>` fill) from the ink. The others are runtime
relationships: code is the deepest recess, the resting field sits between it
and the canvas, the band and card add lightness, and a focused field rises to
the canvas. Dropdown and popover alias the card because they are floating
sheets. Overriding any derived token directly still breaks its relationship
on purpose.

The ladder preserves the canvas hue and chroma, so warm paper stays warm,
Plain becomes neutral, and Playroom carries its violet temperature without
restating a parallel scale. Both schemes now tell the same semantic story:

```
light: code 95.5 < control 96.6 < canvas 97.4 < band 98.3 < card 99.2
dark:  code 18.2 < control 19.4 < canvas 20.2 < band 22.7 < card 24.2
```

A single `--cirth-canvas` override therefore moves card, form, code, dropdown,
and popover in light, dark, and forced-theme subtrees. Plain uses that one
surface input; it does not enumerate the ladder.

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

Scales are named for what they visually are (`$copper-*` the brand accent,
`$neutral-*` the graphite) except the status colors, which are named for
the role they play instead of their hue: `$error-*`, `$success-*`, and
`$warning-*`, not `$red-*`, `$moss-*`, or `$gold-*`, because that's what
they actually mean everywhere they're used (invalid/valid form state,
deleted/inserted text, the `<mark>` highlight).

All five scales share one lightness ladder with 19 steps, from 950
(darkest) to 50 (lightest) in increments of 50 and evenly spaced from 18%
to 96%. Every family defines every step, and picking one is the same
exercise regardless of which family you're in. Chroma is derived rather
than chosen by hand.

Each chromatic scale is pinned to one hue and held at a constant fraction
of that hue's own maximum sRGB chroma within the gamut at every step. The
fraction is the family's voice. `$error-*`, `$success-*` and `$warning-*`
sit at 85%: a status color has to be recognisable at a glance in a small,
rare mark. `$copper-*` sits at 70%, because the brand accent is the
opposite case: it covers whole surfaces and appears on every screen, so
the fraction that makes a status mark legible would make the accent shout.
The families don't peak at the same step because sRGB's gamut boundary
shape differs per hue. For example, red's ceiling sits at a darker
lightness than green's, but every step of every scale sits at the same
fraction of what's actually displayable, so the shape difference is the
gamut talking, not an inconsistency between families.

`$neutral-*` is derived differently, because it isn't an accent. Its chroma
is a bell that peaks mid-ladder and fades to nothing at the pale end: a
light grey needs more chroma than a dark one to read as cool rather than as
plain grey, and a large pale surface needs none at all, but it doesn't
return to zero at the dark end. It floors at 70% of the peak, because the
dark scheme builds its canvas out of the two darkest steps, and a bell that
closed symmetrically left that canvas achromatic whatever hue the family
was given.

The neutral's hue does real work: at 280deg it is predominantly blue with a
violet lift, and it sits 124deg from the brand hue. That distance is the
point. Copper is only legible *as* a warm signal against something cool, so
the graphite is what the accent is measured against rather than a bystander:
move the family round toward plum and the page loses its blue, leaving
every surface, ink and signal reading as one temperature.

`$copper-*`'s hue (44deg) isn't an arbitrary pick; it's lifted directly
from the brand mark, so the theme's primary accent and the logo are the
same color by construction rather than by manual matching. `$error-*` sits
a deliberate 22deg away from it: a destructive action and a primary one
share a page, and the palette has to keep them apart without either raising
its voice.

`plain` and `playroom` (`src/presets/`) declare only the values for the
inputs and roles they intentionally change. They do not duplicate the theme's
surface ladder, component styles, reset rules, or scheme wiring: each scheme
difference is stated once as a `light-dark()` pair, which is why `plain` fits
in five declarations.

Cirth targets browsers with native `oklch()` support (see the `browserslist`
field in `package.json`), so the compiled CSS ships `oklch()` directly rather
than converting it to a `hex` / `lab()` fallback.

</details>

## Theme history

Cirth previously inherited a set of twenty accent color themes from Pico CSS, then
briefly maintained three full themes (azure, jade, slate). That has been
reduced further to a single official theme plus two token override presets,
`plain` and `playroom`. The official theme's accent was an amber until
0.15; it is now the copper described above, with the neutral, surface and
status families rebuilt around it rather than adapted to it. See
[About](/about) for the project's history and
[Contributions](/contributions) before proposing color system changes.
