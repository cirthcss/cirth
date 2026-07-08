# Colors

Cirth has one official theme — amber — with hand-tuned light and dark
variants. `cobalt` and `coral` are optional **presets**: stylesheets that
override an existing set of CSS custom properties on top of the default
theme. They're worked examples of how far a customization can reasonably
go — color, shadow, type, spacing, and motion — without becoming a
separately maintained theme: no component styles, reset rules, or
light/dark switching logic are duplicated.

<ColorSwatches />

- **`cobalt`** — a corporate look: a deep navy primary accent, cool-toned
  neutrals, a crisp flat shadow (no blur), a business-like Arial/Helvetica
  font stack, denser spacing, snappier motion, and square corners.
- **`coral`** — a playful look: a vivid warm primary accent, warm-toned
  neutrals, a soft coral-tinted glow shadow with a matching button-hover
  lift, a friendly Trebuchet MS font stack, looser spacing, bouncy motion,
  and extra-rounded corners.

Like the default theme, presets use font stacks that ship with every major
OS — no `@import`, no webfont, zero network requests beyond the stylesheet
itself. To use a custom font, load it yourself (self-hosted or from a CDN
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
during `npm run build`; see [Build tooling](/build-tooling) for how it works.

## Picking a different primary without a preset

If you only need a one-off accent, override the primary color group with
your own values directly instead of loading a preset — see
[Customization](/customization#primary-secondary-and-contrast). This is the
right tool when a single page or component needs a custom brand color; reach
for `cobalt` or `coral` when you want a worked example of restyling the
system more broadly — accent, shadow, type, spacing, and motion together —
with light/dark variants already handled.

## Underlying palette

The theme's color scales are Sass `oklch()` literals declared in
`src/theme/_colors.scss` and consumed by `_light.scss` / `_dark.scss`. These
Sass variables aren't part of the public CSS custom property surface — they
only exist at build time to derive the semantic tokens (`--cirth-primary`,
`--cirth-primary-hover`, …) baked into the compiled stylesheet.

Scales are named for what they visually are (`$amber-*` the brand accent,
`$neutral-*` the cool gray) except the status colors, which are named for
the role they play instead of their hue: `$error-*`, `$success-*`, and
`$warning-*` — not `$red-*`, `$jade-*`, `$gold-*` — because that's what
they actually mean everywhere they're used (invalid/valid form state,
deleted/inserted text, the `<mark>` highlight).

All five scales share one 19-step lightness ladder, 950 (darkest) to 50
(lightest) in steps of 50, evenly spaced from 18% to 96% — so every family
defines every step, and picking one is the same exercise regardless of
which family you're in. Chroma is derived rather than hand-picked:
`$neutral-*` holds a small, symmetric chroma bell peaking at the 500 step;
each accent scale (`$amber-*`, `$error-*`, `$success-*`, `$warning-*`) is
pinned to one fixed hue and set to a constant 85% of that hue's own
maximum in-gamut sRGB chroma at every step. The four accent scales don't
peak at the same step — sRGB's gamut boundary shape differs per hue, e.g.
red-orange's ceiling sits at a darker lightness than green's — but every
step of every scale sits at the same fraction of what's actually
displayable, so the shape difference is the gamut talking, not an
inconsistency between families.

`$amber-*`'s hue (69.35deg) isn't an arbitrary pick — it's lifted directly
from the brand mark, so the theme's primary accent and the logo are the
same color by construction rather than by manual matching.

`cobalt` and `coral` (`src/presets/`) declare only the `oklch()` literals
their overridden tokens need — they don't duplicate the theme's full
palette, component styles, or reset rules. `coral`'s glow shadow reuses the
theme's own shadow generator (`src/helpers/_functions.scss`), just recolored,
rather than reimplementing it.

Cirth targets browsers with native `oklch()` support (see the `browserslist`
field in `package.json`), so the compiled CSS ships `oklch()` as-is rather
than a downleveled `hex` / `lab()` fallback.

## Roadmap note

Cirth previously inherited a 20-color accent theme set from Pico CSS, then
briefly maintained three full themes (azure, jade, slate). That has been
reduced further to a single official theme plus two token-override presets,
`cobalt` and `coral` — see the [project roadmap](/about#roadmap).
