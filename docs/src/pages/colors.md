---
layout: docs.njk
---


# Colors

Cirth has one official theme — the standard build, a machine-orange
brand color over warm paper and graphite, with hand tuned light and dark
variants. `cobalt` and `coral` are optional **presets**: stylesheets that
override an existing set of CSS custom properties on top of the default
theme. They're worked examples of how far a customization can reasonably
go across color, shadow, type, spacing, and motion without becoming a
separately maintained theme: no component styles, reset rules, or
light/dark switching logic are duplicated.

{% colorSwatches %}

* **`cobalt`** gives a corporate look: a deep navy primary accent, cool toned
  neutrals, a crisp flat shadow (no blur), a businesslike Arial/Helvetica
  font stack, denser spacing, snappier motion, and square corners.
* **`coral`** gives a softer look: a vivid warm primary accent, warm toned
  neutrals, a soft coral glow shadow with a matching hover lift for buttons,
  a friendly Trebuchet MS font stack, looser spacing, bouncier motion, and
  the largest corner radius in the set (4px, against the standard theme's
  2px and cobalt's square 0).

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
<link rel="stylesheet" href="dist/presets/cobalt.min.css">
```

```css
@import "@cirthcss/cirth";
@import "@cirthcss/cirth/presets/cobalt";
```

Presets are generated from `src/presets/` by `scripts/build-presets.js`
during `npm run build`; see [Contributions](/contributions) for how the build works.

## Picking a different primary without a preset

If you only need a single custom accent, override the primary color group with
your own values directly instead of loading a preset; see
[Customization](/customization#primary-secondary-and-contrast). This is the
right tool when a single page or component needs a custom brand color; reach
for `cobalt` or `coral` when you want a worked example of restyling the
system more broadly across accent, shadow, type, spacing, and motion,
with light/dark variants already handled.

## Underlying palette

The theme's color scales are Sass `oklch()` literals declared in
`src/theme/_colors.scss` and consumed by `_light.scss` / `_dark.scss`. These
Sass variables aren't part of the public CSS custom property surface; they
only exist at build time to derive the semantic tokens (`--cirth-primary`,
`--cirth-primary-hover`, …) baked into the compiled stylesheet.

Scales are named for the role they play rather than the hue they happen
to be: `$brand-*` (the primary accent), `$neutral-*` (the warm graphite
and steel used for text, panels and borders), `$error-*`, `$success-*`
and `$warning-*`. Naming them `$orange-*` or `$red-*` would hide what
they actually mean everywhere they're used, and would leave two families
called "red" once the brand accent moved next to the error color.

All five scales share one lightness ladder with 19 steps, from 950
(darkest) to 50 (lightest) in increments of 50 and evenly spaced from 18%
to 96%. Every family defines every step, and picking one is the same
exercise regardless of which family you're in. Chroma is derived rather
than chosen by hand:
`$neutral-*` holds a small, symmetric chroma bell peaking at the 500 step;
each accent scale (`$brand-*`, `$error-*`, `$success-*`, `$warning-*`) is
pinned to one fixed hue and set to a constant 85% of that hue's own
maximum sRGB chroma within the gamut at every step. The four accent scales
don't peak at the same step because sRGB's gamut boundary shape differs per
hue. `$brand-*` is the clearest case: orange's ceiling collapses toward mid
lightness, so the scale peaks up at the 350 step rather than in the middle
like the red-based families do. Every step of every scale still sits at the
same fraction of what's actually displayable, so the shape difference is
the gamut talking, not an inconsistency between families.

The hues are chosen for separation as much as for looks. `$brand-*` sits
at 48deg, a machine orange kept 30deg away from `$error-*` (18deg) so an
invalid field never reads as a branded one, and clear of the `coral`
preset (35deg) so a preset stays a different livery rather than a near
copy of the default. The brand mark is currently drawn in an older amber
that doesn't match the token; the mark is due to be redrawn, and the
token is the thing consumers inherit, so the token led.

`cobalt` and `coral` (`src/presets/`) declare only the `oklch()` literals
their overridden tokens need. They don't duplicate the theme's full
palette, component styles, or reset rules. `coral`'s glow shadow reuses the
theme's own shadow generator (`src/helpers/_functions.scss`), just recolored,
rather than reimplementing it.

Cirth targets browsers with native `oklch()` support (see the `browserslist`
field in `package.json`), so the compiled CSS ships `oklch()` directly rather
than converting it to a `hex` / `lab()` fallback.

## Theme history

Cirth previously inherited a set of twenty accent color themes from Pico CSS, then
briefly maintained three full themes (azure, jade, slate). That has been
reduced further to a single official theme plus two token override presets,
`cobalt` and `coral`; see [About Cirth](/about) for the project philosophy
and [Contributions](/contributions) before proposing color system changes.
