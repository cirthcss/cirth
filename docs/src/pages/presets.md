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

The order is the build, then the print stylesheet if you use one, then the
preset. The preset restates tokens the build declares, so it has to come
after the build:

```html
<link rel="stylesheet" href="dist/cirth.min.css">
<link rel="stylesheet" href="dist/cirth.print.min.css" media="print">
<link rel="stylesheet" href="dist/presets/material.min.css">
```

Every preset sets both colour schemes and its own increased-contrast pass,
so `data-theme` and `prefers-contrast: more` keep working with it.

### From a CDN or a download

[CDN files](/delivery#cdn-files) has a version-pinned jsDelivr snippet, with
its integrity hash, for each preset. Without a package manager or a CDN,
download `cirth-dist-<version>.tar.gz` from
[GitHub Releases](https://github.com/cirthcss/cirth/releases): the presets
are in its `dist/presets/` folder, next to the builds.

### Starting from a preset

A preset is a starting point, not a lock. Load it, then set the few tokens
you want to change in your own stylesheet:

```html
<link rel="stylesheet" href="dist/cirth.min.css">
<link rel="stylesheet" href="dist/presets/material.min.css">
<link rel="stylesheet" href="theme.css">
```

```css
/* theme.css */
:root {
  --cirth-primary: light-dark(#006a6a, #4cdada);
  --cirth-border-radius: var(--cirth-radius-sm);
}
```

Your rules are outside Cirth's cascade layer, so they win over the preset
wherever they load, and every role derived from the accent follows the new
one: links, the primary button, focus rings, the selected state.

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
| Colour | `--cirth-primary`, a blue at 258°; `--cirth-canvas`, a neutral page (an achromatic 97.8% in light, a cool near-black in dark) | Ink, muted and secondary text, status colours |
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

A preset sets a font-family stack but downloads no font. The browser uses the
first installed family in that stack and falls back to a system face.

The material preset prefers Roboto and Roboto Flex. The metro preset prefers
Segoe UI, then Selawik and Open Sans. Layout and controls still work when those
families are absent; the visual resemblance is simply less exact.

To use a webfont consistently, host licensed font files with the application
or use a provider allowed by the project's privacy and security policy. Load
the font before the preset is rendered:

```html
<link rel="stylesheet" href="/fonts/application-fonts.css">
<link rel="stylesheet" href="/assets/cirth.min.css">
<link rel="stylesheet" href="/assets/material.min.css">
```

A self-hosted font stylesheet can define the family with `@font-face`:

```css
@font-face {
  font-family: "Roboto";
  src: url("/fonts/roboto-regular.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

Provide every weight the preset uses. Material uses regular and medium
weights for its main roles. Metro can use light, semilight, regular and
semibold weights. A browser synthesizes a missing weight, but the result may
not match the intended design.

Roboto and Selawik are available under the SIL Open Font License from their
respective projects. Segoe UI is supplied with Windows and is not a font file
Cirth redistributes. Review a font's license before self-hosting it.

## Writing your own

A preset is the same thing as a theme of your own, packaged: see
[Themes](/themes#your-own-theme) for the shape, and for how to keep
increased contrast working when you override a colour.
