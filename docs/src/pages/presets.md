---
layout: docs.njk
description: The plain, material and metro presets, what each is for, which tokens it moves, how it behaves in light, dark and increased contrast, and how to give it its fonts.
---

# Presets

A preset is a stylesheet that restates some of the default theme's
`--cirth-*` tokens and nothing else: no component styles, no reset rules,
no scheme logic. It works with any of the four builds, loads after the
build, and shares its [cascade layer](/customization#cascade-layers), so a
token you set yourself beats both, wherever you load it. Try each one with
the **Preset** control in this site's header.

| Preset | For | Moves |
| --- | --- | --- |
| `plain` | A conventional application look with no decisions to make | Five declarations: accent, canvas, heading face, radius, motion |
| `material` | An interface that should read as Material Design 3 | Colour roles, face, weights, radius, focus ring, elevation, motion, and derived tokens |
| `metro` | An interface in the manner of Windows Phone and Windows 8 | Accent, canvas, neutrals, face, weights, heading sizes, radius, flow, shadows, motion |

## Loading a preset

```html
<link rel="stylesheet" href="dist/cirth.min.css">
<link rel="stylesheet" href="dist/presets/material.min.css">
```

```css
@import "@cirthcss/cirth";
@import "@cirthcss/cirth/presets/material";
```

Swap `material` for `plain` or `metro`. Load one preset at a time: they
restate some of the same tokens, and the later one would win on each of
those alone.

A preset makes no network request. It names its typeface and lets the
platform supply it, so a preset's face shows only where it is installed:
see [Fonts](#fonts) for how to load one yourself.

## plain

The quietest treatment Cirth ships: a familiar blue accent, a plain
near-white page, headings in the body face, squarer controls and brisk motion. It is
also the short half of a worked example: the token model in five
declarations, with the accent's states and the whole surface ladder
following from the two colour inputs on their own.

| Area | What it sets | Left to the default |
| --- | --- | --- |
| Colour | `--cirth-primary`, a blue at 258°; `--cirth-canvas`, a neutral page (an achromatic 97% in light, a cool near-black in dark) | Ink, muted and secondary text, status colours |
| Typography | `--cirth-font-family-display` follows the body face | The system stack, weights, sizes |
| Radius | `--cirth-border-radius` at 2px; cards derive 3px | |
| Space | | The flow and every padding |
| Motion | `--cirth-transition` at 100ms, ease-out | |

**Light, dark and increased contrast.** Each colour is one `light-dark()`
pair. Under `prefers-contrast: more` it restates a stronger accent, the fill
and its hover (so the white label gets stronger rather than weaker) and the
visited link.

## material

Cirth dressed as [Material Design 3](https://m3.material.io/): M3's
baseline colour scheme, a Roboto stack, its corners, state layer, focus
ring, elevation and easing, as far as Cirth's tokens carry them. Every
colour is one of M3's own values, from the tokens Google publishes.

It is the long half of the worked example: where plain changes five
declarations, material overrides broadly, *derived* tokens included, where
M3 derives a state differently from Cirth.

| Area | What it sets | M3 source |
| --- | --- | --- |
| Colour | Accent `#6750a4` / `#d0bcff`; canvas `#fef7ff` / `#141218`; ink, muted and secondary text and the contrast surface from M3's roles; the error from M3's medium-contrast scheme in light, where the baseline red sat too close to Cirth's warning, and from its baseline in dark | [Color roles](https://m3.material.io/styles/color/roles) |
| Typography | Roboto, then Roboto Flex, then the system stack; headings and display at 400, titles at 500; display from 36 to 57px | [Type scale](https://m3.material.io/styles/typography/type-scale-tokens) |
| Radius | 8px controls, 12px cards and dialogs | [Corner radius scale](https://m3.material.io/styles/shape/corner-radius-scale) |
| Focus | A 3px ring, 2px outside the control, in M3's secondary colour | Focus indicator tokens |
| Elevation | Menus, popovers and dropdowns at level 2, dialogs at level 3; cards flat | [Applying elevation](https://m3.material.io/styles/elevation/applying-elevation) |
| Motion | 200ms on M3's standard easing, `cubic-bezier(0.2, 0, 0, 1)` | [Easing and duration](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs) |
| Derived tokens | The filled button is the accent in both schemes, with M3's on-primary as its label; hover is M3's state layer (the label at 8% over the fill); edges are M3's outline and outline-variant; the dialog backdrop is M3's scrim | [State layers](https://m3.material.io/foundations/interaction/states/state-layers) |

**Left to the default:** success and warning (M3 defines neither), the
flow and control heights, the heading sizes, and the icons a data URI bakes
from the default neutrals.

**What a preset cannot reproduce.** M3 draws pill buttons, 4px fields and
28px dialogs. Cirth has one control radius, and containers derive theirs
from it, so no box is rounder than the one it sits in; 8px is the corner M3
itself names for a button that should not be a pill, and it puts cards on
M3's 12px. M3 Expressive animates with springs, which a CSS transition
cannot express; the preset uses the easing M3 still documents for
transitions. Dynamic colour is computed at runtime from a source colour,
and ripples and floating labels are components; none of them is a token.

**Light and dark.** In dark, the filled button is M3's light violet with a
deep violet label, as M3 draws it. The same label marks checkboxes, radios,
the switch thumb and the selected segment. A danger button keeps its own
white label (`--cirth-danger-on-surface`). The derived tokens are restated
on every `data-theme` element too, so a subtree that forces a scheme keeps
the preset.

**Increased contrast.** Under `prefers-contrast: more` the preset switches
to M3's own high-contrast scheme: a deep violet accent in light and a near
white one in dark, black or white ink and labels, strong outlines.

## metro

Metro was the design language of Windows Phone 7 and 8 and of Windows 8.
In the words of its first design guide, it "uses type to echo the visual
language of airport and metro system signage": clean, light, open and fast,
with generous space and one accent on a black or white page. A Windows
Phone theme was exactly that, a background and an accent colour, and this
preset is one in Cirth's tokens. Sources: Microsoft's
[theme resources](https://learn.microsoft.com/en-us/previous-versions/windows/apps/ff769552(v=vs.105))
and [themes](https://learn.microsoft.com/en-us/previous-versions/windows/apps/ff402557(v=vs.105))
for Windows Phone, the
[Windows 8 layout grid](https://learn.microsoft.com/en-us/previous-versions/windows/apps/hh872191(v=win.10)),
and [MSDN Magazine, December 2011](https://learn.microsoft.com/en-us/archive/msdn-magazine/2011/december/windows-phone-how-to-translate-common-design-principles-to-the-windows-phone).

| Area | What it sets | Metro source |
| --- | --- | --- |
| Colour | Cobalt `#0050ef`, filled the same in both schemes, with a light cobalt for text in dark; a near white or near black page; achromatic neutrals, ink one step stronger | Windows Phone 8's accent palette; the dark and light backgrounds |
| Typography | Segoe UI Variable, Segoe UI, Selawik, Open Sans, then the system stack; headings semilight (350), display light (300); the heading ladder opens to 32px and display runs to 72px | Windows Phone's Segoe WP styles: titles semilight, huge text light, sizes 32 and 72 |
| Radius | None: square corners on every box. The radio, the switch and the range thumb keep their shapes | |
| Space | `--cirth-spacing` at 20px, so the flow steps are 10, 20, 40, 60 and 100px | The Windows 8 grid, in 20px units |
| Shadows | None, on cards and overlays alike; the dialog dims the page to black | |
| Motion | 167ms on `cubic-bezier(0.1, 0.9, 0.2, 1)` | The Windows animation library's curve and press timing |

**Left to the default:** the status colours, the single hairline on every
edge (Windows Phone drew 3px borders), the title weight, and control sizes.

**What a preset cannot reproduce.** Live tiles, panoramas, pivots and the
application bar are components and layouts. Metro's page transitions slid
and turned content, and a preset can time a transition, not move one. Metro
also put white text on cyan and teal at under 3:1; Cirth's label has to
clear 4.5:1, which is one reason the accent is cobalt.

**Light and dark.** On the phone the accent did not change with the
background, and here it does not either: the filled button is the same
cobalt on both pages. Accent text lightens in dark so that it reads on the
near black page.

**Increased contrast.** Under `prefers-contrast: more` cobalt deepens in
light and lightens as text in dark, while the dark fill stays a deep cobalt
under its white label; the muted and secondary inks and the visited link
strengthen and stay grey.

## Fonts

Presets load no fonts, so a preset's typeface shows only where it is
already installed: Roboto on Android and ChromeOS, Segoe UI on Windows.
Everywhere else the stack falls through to the system face, which keeps the
layout and loses some of the look. To have the full look everywhere, load
the face yourself, before the preset.

This site does not load any of these fonts; the examples below are for your
page.

### Roboto, for material

Roboto and Roboto Flex are under the SIL Open Font License, and served by
[Bunny Fonts](https://fonts.bunny.net/), a drop-in replacement for the
Google Fonts CSS API run by an EU company that states it keeps no logs of
your visitors:

```html
<link rel="preconnect" href="https://fonts.bunny.net" crossorigin>
<link rel="stylesheet" href="https://fonts.bunny.net/css?family=roboto:400,500,700">
<link rel="stylesheet" href="dist/cirth.min.css">
<link rel="stylesheet" href="dist/presets/material.min.css">
```

or, in CSS, before any other rule:

```css
@import url("https://fonts.bunny.net/css?family=roboto:400,500,700");
@import "@cirthcss/cirth";
@import "@cirthcss/cirth/presets/material";
```

Any font service sees your visitors' addresses when their browsers ask it
for a file. If that matters to you, download the files and serve them from
your own origin with `@font-face`; the preset only needs the family to be
called `Roboto`.

### Segoe, for metro

Segoe UI ships with Windows and cannot be redistributed, so on other
systems metro falls back to Selawik, Microsoft's open replacement for it,
if the page provides it. Selawik is under the SIL Open Font License, comes
in light, semilight, regular, semibold and bold from
[its repository](https://github.com/microsoft/Selawik/releases), and is not
on Bunny Fonts, so serve it yourself:

```css
@font-face {
  font-family: Selawik;
  src: url("/fonts/selawksl.woff2") format("woff2");
  font-weight: 350;
  font-display: swap;
}

@font-face {
  font-family: Selawik;
  src: url("/fonts/selawk.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
}
```

Add `selawkl` at 300 for display text and `selawksb` at 600 for titles, the
same way. Open Sans, the next face in the stack, is on Bunny Fonts and is a
closer approximation than the system face if you would rather not host
files:

```html
<link rel="stylesheet" href="https://fonts.bunny.net/css?family=open-sans:300,400,600">
```

## Writing your own

A preset is the same thing as a theme of your own, packaged: see
[Themes](/themes#your-own-theme) for the shape, and for how to keep
increased contrast working when you override a colour.
