---
layout: docs.njk
---


# Colors

Cirth has one official theme: copper, with hand tuned light and dark
variants. `plain` and `playroom` are optional **presets**: stylesheets that
override CSS custom properties on top of the default theme. No component
styles, reset rules, or light/dark switching logic are duplicated.

They are also deliberately the two ends of the same worked example. One
changes as little as a preset can; the other changes as much as one
reasonably should.

{% colorSwatches %}

* **`plain`** is the conventional application baseline: a familiar blue
  accent and a plain white page. It is the whole point of the token model
  in five declarations: two colour inputs and three role choices. The accent
  states and the complete surface ladder follow on their own. Reach for it
  when you want an interface that looks unremarkable in the good sense.
* **`playroom`** is the expressive end: a soft violet accent, surfaces
  tinted toward it, large radii, a rounded system face, generous spacing,
  springy motion, and a wide soft shadow. It reaches across colour,
  geometry, typography, motion and depth — and overrides two *derived*
  tokens on purpose, so its hover lightens rather than darkens. Suited to a
  consumer app, a community site, or a tool aimed at children.

The default theme uses the system sans stack for product UI and headings;
monospace is reserved for code, token names, values, and technical proof.

Like the default theme, presets use font stacks that ship with every major
OS: no `@import`, no webfont, zero network requests beyond the stylesheet
itself. To use a custom font, load it yourself (hosted by you or from a CDN
you trust) and point `--cirth-font-family` at it after the preset.

## Using a preset

Load the main stylesheet, then load a preset after it. The preset only sets
the custom properties it needs to change, so it works with any of the
default, classless, or scoped builds:

```html
<link rel="stylesheet" href="dist/cirth.min.css">
<link rel="stylesheet" href="dist/presets/plain.min.css">
```

```css
@import "@cirthcss/cirth";
@import "@cirthcss/cirth/presets/plain";
```

Presets are generated from `src/presets/` by `scripts/build-presets.js`
during `npm run build`; see [Contributions](/contributions) for how the build works.

## Picking a different primary without a preset

If you only need a single custom accent, override the primary color group with
your own values directly instead of loading a preset; see
[Customization](/customization#the-accent). This is the
right tool when a single page or component needs a custom brand color; read
`plain` when you want to see how little a retheme can be, and `playroom`
when you want to see how far one can go.

## Underlying palette

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
opposite case — it covers whole surfaces and appears on every screen, so
the fraction that makes a status mark legible would make the accent shout.
The families don't peak at the same step because sRGB's gamut boundary
shape differs per hue. For example, red's ceiling sits at a darker
lightness than green's, but every step of every scale sits at the same
fraction of what's actually displayable, so the shape difference is the
gamut talking, not an inconsistency between families.

`$neutral-*` is derived differently, because it isn't an accent. Its chroma
is a bell that peaks mid-ladder and fades to nothing at the pale end — a
light grey needs more chroma than a dark one to read as cool rather than as
plain grey, and a large pale surface needs none at all — but it doesn't
return to zero at the dark end. It floors at 70% of the peak, because the
dark scheme builds its canvas out of the two darkest steps, and a bell that
closed symmetrically left that canvas achromatic whatever hue the family
was given.

The neutral's hue does real work: at 280deg it is predominantly blue with a
violet lift, and it sits 124deg from the brand hue. That distance is the
point. Copper is only legible *as* a warm signal against something cool, so
the graphite is what the accent is measured against rather than a bystander
— move the family round toward plum and the page loses its blue, leaving
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

## Theme history

Cirth previously inherited a set of twenty accent color themes from Pico CSS, then
briefly maintained three full themes (azure, jade, slate). That has been
reduced further to a single official theme plus two token override presets,
`plain` and `playroom`. The official theme's accent was an amber until
0.15; it is now the copper described above, with the neutral, surface and
status families rebuilt around it rather than adapted to it. See
[About Cirth](/about) for the project philosophy and
[Contributions](/contributions) before proposing color system changes.
