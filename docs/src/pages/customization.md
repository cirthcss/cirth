---
layout: docs.njk
---

# Customization

Cirth is CSS first. Every colour, space, radius, shadow and font is a
`--cirth-*` custom property, and the supported way to change one is a rule
in your own stylesheet, loaded after Cirth. No Sass, no build step, no
rebuild.

```html
<link rel="stylesheet" href="dist/cirth.min.css">
<link rel="stylesheet" href="your-theme.css">
```

```css
/* your-theme.css */
:root {
  --cirth-primary: #2563eb;
}
```

That one line is a worked example rather than a teaser: it moves the accent
everywhere it is used — links, focus rings, the filled button, its hover,
the underline tint, the checkbox mark, the switch, the range thumb — because
those are derived from it rather than listed alongside it. The next section
is about why, because it is the thing that makes the rest of this page
short.

## How the token system works

Cirth's tokens are not one flat list. There are five kinds, and knowing
which one you are looking at tells you what will happen when you set it.

### Inputs

A small set of tokens that other tokens are built from. `--cirth-primary`
is the clearest one, and the status trio — `--cirth-error`,
`--cirth-success`, `--cirth-warning` — behaves the same way. Setting an
input is the cheapest possible change: everything downstream follows.

```css
:root {
  --cirth-error: #b91c1c;
}
```

That moves the invalid field border, the border it takes while you are
typing in it, the `<del>` ink, the low reading on a `<meter>`, and the tint
a status surface would sit on. You do not have to know which of those
exists to retune them together.

### Derived tokens

Tokens computed from an input, at runtime, by the browser. They are written
as relationships:

```css
--cirth-primary-hover: color-mix(in oklch, var(--cirth-primary) 83.5%, black);
--cirth-primary-underline: oklch(from var(--cirth-primary) l c h / 50%);
```

You can set a derived token directly, and sometimes you should — that is
how you break a relationship on purpose. The `playroom` preset does exactly
this so its buttons brighten on hover instead of darkening, which no
proportional darkening could produce. What you should know is that doing so
opts that token out permanently: it stops following the input, and a later
change to the accent will leave it behind.

### Slots

A handful of names are not theme settings at all. They are the variables a
component paints *through*, and components rebind them constantly:

`--cirth-background-color` · `--cirth-color` · `--cirth-border-color` ·
`--cirth-box-shadow` · `--cirth-underline` · `--cirth-font-size` ·
`--cirth-font-weight` · `--cirth-line-height` · `--cirth-letter-spacing` ·
`--cirth-text-decoration`

`--cirth-color` is declared on the page, and then again on every heading,
on a button, inside a dropdown, on a form field — each time pointing at the
token that element should use. Setting it at `:root` changes the page
default and nothing else, because everything else was already given its own
value.

That is worth stating plainly because it is the one place where an override
can look like it silently did nothing:

```css
:root {
  --cirth-color: rebeccapurple;   /* body text turns purple */
}
/* headings do not: they are given --cirth-h1-color and friends */
```

If you want the headings too, set the tokens the headings actually read
(`--cirth-h1-color` … `--cirth-h6-color`). The reference at the end of this
page marks every token with its kind, so you can tell at a glance whether
you are setting a value or a slot.

When you need to refer to *the page itself* — an opaque background for a
control, a tint mixing toward the page — use `--cirth-canvas`. That is the
page surface as a value, and no component is allowed to shadow it.
`--cirth-background-color` defaults to it.

### Roles

Standalone semantic settings that a component reads directly. A role does
not promise to drive a family of other tokens: `--cirth-modal-max-width`,
`--cirth-code-color`, and `--cirth-form-element-border-color` each configure
one responsibility. Set one when that responsibility is exactly what you
want to change.

### Scales

The raw ladders: `--cirth-space-*`, `--cirth-radius-*`,
`--cirth-font-size-*`, `--cirth-border-width-*`, `--cirth-duration-*`.
Every step exists whether or not the library uses it, so picking one is the
same exercise wherever you are. You will usually reach for the role token
that sits on top of a scale — `--cirth-spacing` rather than
`--cirth-space-5` — but the steps are there when you want to move one
component without moving the rest.

## Start here

Four tokens carry most of a retheme. If you change nothing else, change
these.

| Token | What it moves |
| --- | --- |
| `--cirth-primary` | The whole accent: links, buttons, focus rings, controls |
| `--cirth-canvas` | The page surface, and anything that tints toward it |
| `--cirth-font-family` | Body text, and every control that inherits it |
| `--cirth-border-radius` | Every radius, including the ones derived from it |

The `plain` preset is those first two plus three role choices, and nothing
else — see
[Colors](/colors) for what it looks like. It exists partly to prove the
point: a coherent, accessible, light-and-dark theme in five declarations.

Here is a custom accent applied live, which is two declarations — the pair
and a radius — over the build this page is already using:

{% demo "customization" %}

## Colour

### The accent

`--cirth-primary` is the input. These follow it, and you do not normally
set them:

| Token | Relationship |
| --- | --- |
| `--cirth-primary-background` | The filled surface. Same as the accent in light; darker in dark |
| `--cirth-primary-hover` | The accent, darkened (light) or lightened (dark) |
| `--cirth-primary-hover-background` | The filled surface, one step further |
| `--cirth-primary-underline` | The accent at 50% alpha |
| `--cirth-primary-focus` | The accent at 75% alpha — the focus ring |
| `--cirth-primary-inverse` | The text that sits *on* the accent |

`--cirth-primary-inverse` is the one to check when you pick an unusual
accent. It is white by default, which is right for most accents and wrong
for a light one — a pale yellow accent with white text on it is
unreadable. It is a plain value rather than a derivation because choosing
between light and dark text is a decision, not a mix.

```css
:root {
  --cirth-primary: #fbbf24;          /* a light amber */
  --cirth-primary-inverse: #1c1917;  /* so the label stays readable */
}
```

`--cirth-secondary` and `--cirth-contrast` are the other two colour groups,
with the same shape. `.secondary` and `.contrast` on a button or link swap
which group it reads from; `.outline` and `.ghost` keep the group and drop
the fill. See [Button](/content/button).

### Status colours

Three inputs, each driving four roles:

| Role | Used by |
| --- | --- |
| `--cirth-error` | The solid reading — a `<meter>` in its worst band |
| `--cirth-error-text` | `<del>`, and status text on the page |
| `--cirth-error-border` | An `[aria-invalid="true"]` field |
| `--cirth-error-active` | That field while it has focus |
| `--cirth-error-surface` | A tint to sit status content on |

`--cirth-success` and `--cirth-warning` are identical in shape.
`--cirth-warning-surface` is what a `<mark>` sits on.

Status hues are deliberately not fixed constants. If your brand overlaps a
conventional status hue, move the status family rather than avoiding the
brand — what has to stay true is that the two remain distinguishable, and
that state is never signalled by colour alone (WCAG 1.4.1). Cirth's own
validity styling pairs colour with an icon for that reason.

### Surfaces

| Token | What it is |
| --- | --- |
| `--cirth-canvas` | The page |
| `--cirth-code-background-color` | A recessed band: `<pre>`, inline `<code>` |
| `--cirth-form-element-background-color` | A field at rest |
| `--cirth-card-sectioning-background-color` | A card's header and footer band |
| `--cirth-card-background-color` | An `<article>`; a dropdown and a popover follow it |
| `--cirth-form-element-active-background-color` | A focused field; rises back to the canvas |
| `--cirth-muted-color` | Subordinate text |
| `--cirth-muted-border-color` | Hairlines: tables, cards, blockquotes |

`--cirth-canvas` is the only input in this family. The others are runtime
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

### Light and dark

Cirth ships both schemes. The scheme follows the operating system, and
`data-theme="light"` or `data-theme="dark"` on any element forces one for
that subtree.

```html
<html data-theme="dark">
```

A `:root` override applies to **both** schemes, and it applies everywhere —
including inside a subtree that forces one:

```css
:root {
  --cirth-primary: #2563eb;
}
```

When light and dark should differ, give the token both values at once with
[`light-dark()`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark):

```css
:root {
  --cirth-primary: light-dark(#2563eb, #93c5fd);
}
```

This is the same shape Cirth uses internally. The pair is resolved where
the token is *used*, against the colour scheme in effect at that point, so
one line covers the page and any widget that forces its own scheme.

You can still target the scheme selectors directly. They are more specific
than a plain `:root`, which makes them the tool for changing one scheme
without touching the other:

```css
:root:not([data-theme="dark"]) {
  --cirth-primary: #2563eb;
}

[data-theme="dark"] {
  --cirth-primary: #93c5fd;
}
```

For a value that should hold everywhere, prefer the pair: it is one line,
and it cannot fall out of step with itself.

### `data-theme` in scoped builds

The builds differ in *where* they look for the attribute.

* **Unscoped builds** respond to `data-theme` on any ancestor.
* **Scoped builds** only look at the `.cirth` element itself, or elements
  inside it. `<html data-theme="dark">` around a `.cirth` widget has no
  effect, because every generated selector is anchored to the wrapper.

If you embed a scoped widget in a host page that manages its own dark mode,
mirror the host's choice onto the wrapper:

```html
<div class="cirth" data-theme="dark">…</div>
```

### Increased contrast

Cirth carries a `prefers-contrast: more` pass that strengthens inks,
hairlines and focus rings. Your overrides load after it, so a token you set
unconditionally will win there too — which usually means the preference
stops working for that token.

```css
/* your accent, in both modes */
:root {
  --cirth-primary: #2563eb;
}

/* and a stronger one where the user asked for it */
@media (prefers-contrast: more) {
  :root {
    --cirth-primary: #1e3a8a;
  }
}
```

Both presets do this, and it is worth copying if you set colours at all.

## Typography

```css
:root {
  --cirth-font-family: Inter, system-ui, sans-serif;
  --cirth-font-family-display: Inter, system-ui, sans-serif;
}
```

`--cirth-font-family` is body text and every control that inherits it.
`--cirth-font-family-display` is headings — it points at the serif stack by
default, which is part of Cirth's own identity; setting it to
`var(--cirth-font-family)` is how both presets make headings match the body.

Cirth loads no webfonts. If you want one, load it yourself and point the
token at it afterwards:

```html
<link rel="stylesheet" href="https://your-cdn.example/inter.css">
<link rel="stylesheet" href="your-theme.css">
```

The scale runs `--cirth-font-size-xs` through `-7xl`. `h4`–`h6` read steps
from it directly; `h1`–`h3` are fluid and read their clamp *bounds* from it,
so moving a step still moves the heading:

```css
:root {
  --cirth-font-size-6xl: 2.25rem;   /* h1 stops growing sooner */
}
```

The shipped ladder is **44 / 32 / 24 / 20 / 18 / 16** at the default root
size. If you want display type beyond that, ask for it on the element rather
than moving the scale everyone else reads:

```css
/* a campaign page, opting in through the slot every heading resolves
   through — no second API, and the rest of the site keeps product scale */
.hero h1 {
  --cirth-font-size: clamp(2.75rem, 2rem + 1.9vw, 3.5rem);
}
```

`--cirth-line-height`, `--cirth-font-weight` and `--cirth-letter-spacing`
are slots: set at the root they change the page default, and elements that
were given their own value keep it. The two tracking steps have consumers —
`--cirth-letter-spacing-tight` on `h1`/`h2`, `--cirth-letter-spacing-snug`
on `h3`/`h4` — so overriding one moves the headings that read it.
`--cirth-form-label-font-weight` is separate so labels can be heavier than
the prose around them.

## Spacing and layout

`--cirth-spacing` is the knob. Everything vertical between blocks, the gaps
in a `.grid`, and the padding inside controls derive from it:

```css
:root {
  --cirth-spacing: 0.75rem;   /* a denser interface */
}
```

| Token | What it moves |
| --- | --- |
| `--cirth-spacing` | The base rhythm |
| `--cirth-block-spacing-vertical` | Space between landmarks and sections |
| `--cirth-typography-spacing-vertical` | Space between paragraphs and lists |
| `--cirth-form-element-spacing-vertical` | Padding inside a control |
| `--cirth-container-gutter` | Fluid inline gutter for containers and classless landmarks |
| `--cirth-container-max-width` | The `.container` measure |
| `--cirth-grid-min-column` | When `.grid` wraps to a new row |
| `--cirth-modal-max-width` | The fluid modal card's upper width bound |

A note on control height: Cirth's controls are at least 44px tall — WCAG
2.5.5's target size. Button, input, select and one-line textarea share one
runtime formula made from `--cirth-font-size-md`, line-height, vertical
padding and border. Text inputs use that result as their fixed one-line
height; controls that may legitimately grow use it as a floor. Changing the
padding therefore changes their internal proportions without letting an
equivalent control fall out of alignment. Navigation opts down to a 40px
band — comfortably clear of WCAG 2.5.8's 24px AA minimum — because a nav row
is compact by design and a header should not have to fight the framework for
a height.

## Borders, radii and outlines

```css
:root {
  --cirth-border-radius: 0;        /* square corners everywhere */
}
```

`--cirth-border-radius` is the single knob. The per-component radii are
derived from it — a card is softer, a checkbox and inline code are capped
so they never read as circles — so zeroing it zeroes them too.

| Token | Relationship |
| --- | --- |
| `--cirth-card-border-radius` | `--cirth-border-radius` × 1.5 — the container/control pair |
| `--cirth-checkbox-border-radius` | Capped at `--cirth-radius-sm` |
| `--cirth-code-border-radius` | Capped at `--cirth-radius-sm` |
| `--cirth-radius-pill` | Untouched by the knob — switches stay pills |

`--cirth-border-width` and `--cirth-outline-width` read steps from one
stroke ladder, `--cirth-border-width-*`.

## Motion

```css
:root {
  --cirth-transition: 120ms ease-out;
}
```

One token covers every transition in the library. It is composed from
`--cirth-duration-*` and `--cirth-ease-*`, which are there if you want a
different pairing per component.

Cirth already honours `prefers-reduced-motion`, with one deliberate
exception: a busy indicator keeps moving, because a spinner that has
stopped says the opposite of what it means.

## Worked examples

### Rebrand the accent

Everything the accent touches, in one line per scheme:

```css
:root {
  --cirth-primary: light-dark(#7c3aed, #a78bfa);
}

@media (prefers-contrast: more) {
  :root {
    --cirth-primary: light-dark(#5b21b6, #c4b5fd);
  }
}
```

Check `--cirth-primary-inverse` if your accent is light: the label on a
filled button has to clear 4.5:1 against it.

### Swap the typography

```css
:root {
  --cirth-font-family: "IBM Plex Sans", system-ui, sans-serif;
  --cirth-font-family-display: "IBM Plex Serif", Georgia, serif;
  --cirth-line-height: 1.6;
}
```

### Make it denser

```css
:root {
  --cirth-spacing: 0.75rem;
  --cirth-border-radius: 0.25rem;
  --cirth-transition: 100ms ease-out;
}
```

Controls keep their 44px floor: the padding shrinks, the target does not.

### Change the dark scheme only

```css
[data-theme="dark"] {
  --cirth-canvas: #0b1120;
  --cirth-card-background-color: #111827;
}
```

Or, as a pair, if you are setting the light value anyway:

```css
:root {
  --cirth-canvas: light-dark(#ffffff, #0b1120);
}
```

### Theme one embedded widget

Scoped builds put everything under `.cirth`, so a widget can carry a theme
the host page knows nothing about:

```html
<link rel="stylesheet" href="dist/cirth.scoped.min.css">

<div class="cirth" data-theme="dark" style="--cirth-primary: #34d399">
  <article>
    <h2>Settings</h2>
    <button type="button">Save</button>
  </article>
</div>
```

## Verifying your theme

Cirth's shipped themes — the default and both presets — are verified: every
text pair clears WCAG AA (4.5:1, or 7:1 under `prefers-contrast: more`) and
every non-text indicator clears 3:1, checked in light and dark on every page
of this site.

That verification covers the values Cirth ships. **It does not extend to
values you set.** The relationships hold — a derived hover stays
proportionally darker than whatever accent you give it — but whether the
result clears a threshold depends on the colour you chose. When you change
an input, the pairs worth checking are:

* your accent against the page, as link text;
* `--cirth-primary-inverse` against `--cirth-primary-background`, as a
  button label;
* `--cirth-muted-color` against the page;
* the status borders against a field.

## What you cannot change with a variable

Some choices are Sass switches decided when the CSS was compiled, because
they change which selectors exist at all:

* **Class-based selectors** (`.container`, `.grid`, `.secondary`,
  `.outline`, `.ghost`, …) exist in the default build and not in the
  classless one.
* **Scoping every selector under `.cirth`** is the scoped build.
* **The `.row` breakpoint** is fixed in `src/_breakpoints.scss`.

If you need different values for these you are choosing a different
published build, not overriding a variable. See [Get Started](/get-started).

## Token reference

Every `--cirth-*` token Cirth declares, grouped by what it affects. The
**kind** column is the distinction from
[How the token system works](#how-the-token-system-works):

* **input** — set this; other tokens follow
* **derived** — computed from an input; set it only to break that
* **slot** — a variable components paint through, not a theme setting
* **role** — a named setting a component reads directly
* **scale** — a step on a ladder

#### Accent and status

| Token | Kind |
| --- | --- |
| `--cirth-contrast` | role |
| `--cirth-contrast-background` | role |
| `--cirth-contrast-border` | derived |
| `--cirth-contrast-focus` | role |
| `--cirth-contrast-hover` | role |
| `--cirth-contrast-hover-background` | role |
| `--cirth-contrast-hover-border` | derived |
| `--cirth-contrast-hover-underline` | derived |
| `--cirth-contrast-inverse` | role |
| `--cirth-contrast-underline` | role |
| `--cirth-error` | input |
| `--cirth-error-active` | derived |
| `--cirth-error-border` | derived |
| `--cirth-error-surface` | derived |
| `--cirth-error-text` | derived |
| `--cirth-primary` | input |
| `--cirth-primary-background` | derived |
| `--cirth-primary-border` | derived |
| `--cirth-primary-focus` | derived |
| `--cirth-primary-hover` | derived |
| `--cirth-primary-hover-background` | derived |
| `--cirth-primary-hover-border` | derived |
| `--cirth-primary-hover-underline` | derived |
| `--cirth-primary-inverse` | role |
| `--cirth-primary-underline` | derived |
| `--cirth-secondary` | role |
| `--cirth-secondary-background` | role |
| `--cirth-secondary-border` | derived |
| `--cirth-secondary-focus` | role |
| `--cirth-secondary-hover` | role |
| `--cirth-secondary-hover-background` | role |
| `--cirth-secondary-hover-border` | derived |
| `--cirth-secondary-hover-underline` | derived |
| `--cirth-secondary-inverse` | role |
| `--cirth-secondary-underline` | role |
| `--cirth-success` | input |
| `--cirth-success-active` | derived |
| `--cirth-success-border` | derived |
| `--cirth-success-surface` | derived |
| `--cirth-success-text` | derived |
| `--cirth-warning` | input |
| `--cirth-warning-active` | derived |
| `--cirth-warning-border` | derived |
| `--cirth-warning-surface` | derived |
| `--cirth-warning-text` | derived |

#### Surfaces and text

| Token | Kind |
| --- | --- |
| `--cirth-background-color` | slot |
| `--cirth-blockquote-border-color` | derived |
| `--cirth-blockquote-footer-color` | derived |
| `--cirth-canvas` | input |
| `--cirth-card-background-color` | derived |
| `--cirth-card-border-color` | derived |
| `--cirth-card-border-radius` | role |
| `--cirth-card-box-shadow` | role |
| `--cirth-card-sectioning-background-color` | derived |
| `--cirth-code-background-color` | derived |
| `--cirth-code-border-radius` | role |
| `--cirth-code-color` | role |
| `--cirth-code-kbd-background-color` | derived |
| `--cirth-code-kbd-color` | derived |
| `--cirth-color` | slot |
| `--cirth-del-color` | derived |
| `--cirth-ins-color` | derived |
| `--cirth-link-visited-color` | role |
| `--cirth-mark-background-color` | derived |
| `--cirth-mark-color` | role |
| `--cirth-muted-border-color` | role |
| `--cirth-muted-color` | role |
| `--cirth-text-selection-color` | role |

#### Typography

| Token | Kind |
| --- | --- |
| `--cirth-font-family` | role |
| `--cirth-font-family-display` | role |
| `--cirth-font-family-emoji` | scale |
| `--cirth-font-family-mono` | scale |
| `--cirth-font-family-sans` | scale |
| `--cirth-font-family-serif` | scale |
| `--cirth-font-size` | slot |
| `--cirth-font-size-2xl` | scale |
| `--cirth-font-size-3xl` | scale |
| `--cirth-font-size-4xl` | scale |
| `--cirth-font-size-5xl` | scale |
| `--cirth-font-size-6xl` | scale |
| `--cirth-font-size-7xl` | scale |
| `--cirth-font-size-lg` | scale |
| `--cirth-font-size-md` | scale |
| `--cirth-font-size-sm` | scale |
| `--cirth-font-size-xl` | scale |
| `--cirth-font-size-xs` | scale |
| `--cirth-font-weight` | slot |
| `--cirth-font-weight-bold` | scale |
| `--cirth-font-weight-light` | scale |
| `--cirth-font-weight-medium` | scale |
| `--cirth-font-weight-regular` | scale |
| `--cirth-font-weight-semibold` | scale |
| `--cirth-letter-spacing` | slot |
| `--cirth-letter-spacing-snug` | scale |
| `--cirth-letter-spacing-tight` | scale |
| `--cirth-line-height` | slot |
| `--cirth-line-height-loose` | scale |
| `--cirth-line-height-none` | scale |
| `--cirth-line-height-normal` | scale |
| `--cirth-line-height-relaxed` | scale |
| `--cirth-line-height-snug` | scale |
| `--cirth-line-height-tight` | scale |
| `--cirth-text-underline-offset` | role |
| `--cirth-typography-spacing-top` | role |
| `--cirth-typography-spacing-vertical` | role |

#### Spacing and layout

| Token | Kind |
| --- | --- |
| `--cirth-block-spacing-horizontal` | role |
| `--cirth-block-spacing-vertical` | role |
| `--cirth-container-gutter` | role |
| `--cirth-container-max-width` | role |
| `--cirth-grid-column-gap` | role |
| `--cirth-grid-min-column` | role |
| `--cirth-grid-row-gap` | role |
| `--cirth-nav-breadcrumb-divider` | role |
| `--cirth-nav-element-spacing-horizontal` | role |
| `--cirth-nav-element-spacing-vertical` | role |
| `--cirth-nav-link-spacing-horizontal` | role |
| `--cirth-nav-link-spacing-vertical` | role |
| `--cirth-space-0` | scale |
| `--cirth-space-1` | scale |
| `--cirth-space-10` | scale |
| `--cirth-space-12` | scale |
| `--cirth-space-16` | scale |
| `--cirth-space-2` | scale |
| `--cirth-space-20` | scale |
| `--cirth-space-24` | scale |
| `--cirth-space-3` | scale |
| `--cirth-space-4` | scale |
| `--cirth-space-5` | scale |
| `--cirth-space-6` | scale |
| `--cirth-space-8` | scale |
| `--cirth-spacing` | role |

#### Borders, radii and outlines

| Token | Kind |
| --- | --- |
| `--cirth-border-color` | slot |
| `--cirth-border-radius` | role |
| `--cirth-border-width` | role |
| `--cirth-border-width-0` | scale |
| `--cirth-border-width-1` | scale |
| `--cirth-border-width-2` | scale |
| `--cirth-border-width-4` | scale |
| `--cirth-outline-width` | role |
| `--cirth-radius-2xl` | scale |
| `--cirth-radius-lg` | scale |
| `--cirth-radius-md` | scale |
| `--cirth-radius-none` | scale |
| `--cirth-radius-pill` | scale |
| `--cirth-radius-sm` | scale |
| `--cirth-radius-xl` | scale |
| `--cirth-radius-xs` | scale |

#### Motion, depth and layering

| Token | Kind |
| --- | --- |
| `--cirth-box-shadow` | slot |
| `--cirth-duration-fast` | scale |
| `--cirth-duration-instant` | scale |
| `--cirth-duration-normal` | scale |
| `--cirth-duration-slow` | scale |
| `--cirth-duration-slower` | scale |
| `--cirth-ease-in` | scale |
| `--cirth-ease-in-out` | scale |
| `--cirth-ease-linear` | scale |
| `--cirth-ease-out` | scale |
| `--cirth-opacity-disabled` | scale |
| `--cirth-opacity-overlay` | scale |
| `--cirth-transition` | role |
| `--cirth-z-index-dropdown` | scale |
| `--cirth-z-index-fixed` | scale |
| `--cirth-z-index-modal` | scale |
| `--cirth-z-index-modal-backdrop` | scale |
| `--cirth-z-index-sticky` | scale |

#### Form controls

| Token | Kind |
| --- | --- |
| `--cirth-checkbox-border-radius` | role |
| `--cirth-form-element-active-background-color` | derived |
| `--cirth-form-element-active-border-color` | derived |
| `--cirth-form-element-background-color` | derived |
| `--cirth-form-element-border-color` | role |
| `--cirth-form-element-color` | role |
| `--cirth-form-element-disabled-opacity` | derived |
| `--cirth-form-element-focus-color` | derived |
| `--cirth-form-element-invalid-active-border-color` | derived |
| `--cirth-form-element-invalid-border-color` | derived |
| `--cirth-form-element-invalid-focus-color` | derived |
| `--cirth-form-element-placeholder-color` | derived |
| `--cirth-form-element-selected-background-color` | role |
| `--cirth-form-element-spacing-horizontal` | role |
| `--cirth-form-element-spacing-vertical` | role |
| `--cirth-form-element-valid-active-border-color` | derived |
| `--cirth-form-element-valid-border-color` | derived |
| `--cirth-form-element-valid-focus-color` | derived |
| `--cirth-form-label-font-weight` | role |
| `--cirth-icon-checkbox` | role |
| `--cirth-icon-chevron` | role |
| `--cirth-icon-close` | role |
| `--cirth-icon-date` | role |
| `--cirth-icon-height` | role |
| `--cirth-icon-invalid` | role |
| `--cirth-icon-loading` | role |
| `--cirth-icon-minus` | role |
| `--cirth-icon-position` | role |
| `--cirth-icon-search` | role |
| `--cirth-icon-time` | role |
| `--cirth-icon-valid` | role |
| `--cirth-icon-width` | role |
| `--cirth-meter-background-color` | role |
| `--cirth-meter-border-color` | role |
| `--cirth-meter-even-less-good-color` | derived |
| `--cirth-meter-optimum-color` | derived |
| `--cirth-meter-suboptimum-color` | derived |
| `--cirth-progress-background-color` | role |
| `--cirth-progress-border-color` | role |
| `--cirth-progress-color` | derived |
| `--cirth-range-active-border-color` | role |
| `--cirth-range-border-color` | role |
| `--cirth-range-thumb-active-color` | derived |
| `--cirth-range-thumb-border-color` | derived |
| `--cirth-range-thumb-color` | derived |
| `--cirth-switch-background-color` | role |
| `--cirth-switch-checked-background-color` | derived |
| `--cirth-switch-color` | derived |
| `--cirth-switch-thumb-box-shadow` | role |

#### Components

| Token | Kind |
| --- | --- |
| `--cirth-accordion-active-summary-color` | derived |
| `--cirth-accordion-close-summary-color` | derived |
| `--cirth-accordion-open-summary-color` | derived |
| `--cirth-dropdown-background-color` | derived |
| `--cirth-dropdown-border-color` | derived |
| `--cirth-dropdown-box-shadow` | derived |
| `--cirth-dropdown-color` | derived |
| `--cirth-dropdown-hover-background-color` | derived |
| `--cirth-group-box-shadow` | role |
| `--cirth-group-box-shadow-focus-with-button` | role |
| `--cirth-group-box-shadow-focus-with-input` | role |
| `--cirth-modal-max-width` | role |
| `--cirth-modal-overlay-backdrop-filter` | role |
| `--cirth-modal-overlay-background-color` | derived |
| `--cirth-popover-background-color` | derived |
| `--cirth-popover-border-color` | role |
| `--cirth-popover-box-shadow` | role |
| `--cirth-popover-color` | role |
| `--cirth-popover-display` | role |
| `--cirth-popover-max-width` | role |
| `--cirth-print-border-color` | role |
| `--cirth-print-color` | role |
| `--cirth-print-muted-color` | role |
| `--cirth-table-border-color` | derived |
| `--cirth-table-row-stripped-background-color` | role |
| `--cirth-text-decoration` | slot |
| `--cirth-underline` | slot |

#### Everything else

| Token | Kind |
| --- | --- |
| `--cirth-button-box-shadow` | derived |
| `--cirth-button-hover-box-shadow` | derived |
| `--cirth-h1-color` | role |
| `--cirth-h2-color` | role |
| `--cirth-h3-color` | role |
| `--cirth-h4-color` | role |
| `--cirth-h5-color` | role |
| `--cirth-h6-color` | role |
