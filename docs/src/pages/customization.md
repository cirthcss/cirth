---
layout: docs.njk
description: Customize Cirth with CSS custom properties, understand token relationships and place overrides correctly in the cascade.
---

# Customization

Cirth is customized with ordinary CSS. Put overrides in a stylesheet that
your application loads:

```css
:root {
  --cirth-primary: #2563eb;
  --cirth-font-family: Inter, system-ui, sans-serif;
  --cirth-border-radius: 0.375rem;
}
```

A CSS custom property is a named value whose name begins with `--`. Cirth
reads `--cirth-*` properties throughout its rules. Changing a high-level
input such as `--cirth-primary` updates the values derived from it.

{% demo "customization" %}

## Put overrides in the right place

For the default or classless build, set page-wide values on `:root`:

```css
:root {
  --cirth-primary: oklch(55% 0.19 255);
}
```

`:root` represents the document's root element, normally `html`.

For a scoped build, set them on the `.cirth` wrapper:

```css
.cirth {
  --cirth-primary: oklch(55% 0.19 255);
}
```

The scoped build declares its tokens on that wrapper. A value on `:root`
cannot override a value declared directly on the descendant wrapper through
inheritance. [Using Cirth with existing CSS](/guides/existing-css) covers
that boundary in detail.

## How the token system works

The [token reference](/tokens) labels each public property with one of five
kinds. The label helps predict the effect of an override.

### Inputs

Inputs are sources for a family of related values. Set these for broad
changes:

```css
:root {
  --cirth-primary: #7c3aed;
  --cirth-error: #b91c1c;
  --cirth-success: #15803d;
  --cirth-warning: #a16207;
}
```

`--cirth-primary` feeds accent text, filled controls, focus indicators and
related states. Status inputs feed validation and status roles.

### Derived values

Derived tokens are calculated from another token:

```css
--cirth-primary-active: color-mix(
  in oklch,
  var(--cirth-primary) 83.5%,
  black
);
```

Override a derived value only when you intend to break that relationship.
Afterward it no longer follows changes to its original input.

### Roles

A role configures one responsibility, such as
`--cirth-modal-max-width`, `--cirth-code-color` or
`--cirth-form-element-border-color`. Use a role when the responsibility
named by that property is exactly what you need to change.

### Scales

Scales provide reusable steps such as `--cirth-space-*`,
`--cirth-radius-*`, `--cirth-font-size-*`,
`--cirth-border-width-*` and `--cirth-duration-*`.

Prefer a role built on the scale when the change is semantic. For example,
set `--cirth-modal-max-width` for modal width. Reach for a raw scale step
when you are defining a new application pattern.

### Slots

Slots are internal paint channels that components rebind. Examples include
`--cirth-color`, `--cirth-background-color`,
`--cirth-border-color`, `--cirth-font-size` and
`--cirth-box-shadow`.

Setting `--cirth-color` on `:root` changes default body text, but a
heading or button can rebind that slot to its own role. Use
`--cirth-ink` for the page's text role or the relevant component token
when you want a broader, predictable result.

<span id="start-here"></span>

## Common customizations

### Accent

```css
:root {
  --cirth-primary: light-dark(#6d28d9, #c4b5fd);
}
```

`light-dark(light, dark)` chooses a value from the element's active colour
scheme. Check the filled-control label token,
`--cirth-primary-on-surface`, when selecting a light accent. Your colour
pair still needs contrast testing in every state.

To move the accent to another hue, write it in OKLCH, where the lightness
is the first number, and keep the light accent dark enough for a white label
on the filled button:

```css
:root {
  --cirth-primary: light-dark(oklch(50% 0.09 200), oklch(72% 0.1 200));
}
```

- A white label reads 4.5:1 on the filled button up to a lightness of 0.55,
  whatever the hue.
- Accent text takes care of itself: Cirth darkens it in light, and lightens
  it in dark, until it reads 4.5:1 on every surface level, for any accent.
- A hue close to a status colour, such as a red near the error colour or a
  green near the success colour, makes a link read like a status message.
  Compare them side by side.

[Colors](/colors) explains the accent, status roles and surfaces.
[Themes](/themes) explains colour schemes and `data-theme`.

### Typography

```css
:root {
  --cirth-font-family: "IBM Plex Sans", system-ui, sans-serif;
  --cirth-font-family-display: "IBM Plex Serif", Georgia, serif;
  --cirth-line-height: 1.6;
}
```

Cirth does not download fonts. Load any webfont yourself, then put its family
first in the appropriate stack. `--cirth-font-family` is the body and
control family. `--cirth-font-family-display` is the heading family.

Use the element's semantic heading level for document structure. Change its
appearance with tokens or application CSS, not by choosing a different
heading number. [Typography](/content/typography) explains that distinction.

### Spacing and layout

```css
:root {
  --cirth-spacing: 0.75rem;
  --cirth-container-max-width: 72rem;
  --cirth-grid-min-column: 16rem;
}
```

`--cirth-spacing` changes the flow rhythm and values derived from it. Form
control padding remains separate so a density change does not silently
remove the control-size floor. Adjust
`--cirth-form-element-spacing-vertical` and
`--cirth-form-element-spacing-horizontal` deliberately when controls need
different proportions.

No element carries an outer margin of its own. The second of two siblings
takes one step of the flow scale, chosen by what the two are to each other:

| Step | Default | Between |
| --- | --- | --- |
| `--cirth-flow-line` | 8px | a label and its field, a field and its help text, two list items, a heading and what follows it |
| `--cirth-flow-element` | 16px | two blocks: paragraphs, lists, tables, fields |
| `--cirth-flow-group` | 32px | a block and an `h3` to `h6`; a fieldset and its neighbours; two articles |
| `--cirth-flow-section` | 48px | a block and an `h1` or `h2`; two sections |
| `--cirth-flow-chapter` | 80px | two top-level sections of `main` |

Every step is a multiple of `--cirth-spacing`, so changing it retimes all
five; set one step to change a single relation. The flow rules have zero
specificity, so any margin rule of your own wins. Containers own the space
inside them: a card or dialog its padding, `.grid` and `.row` their gap.

### Borders and radius

```css
:root {
  --cirth-border-radius: 0;
  --cirth-border-width: 1px;
}
```

The main radius feeds control and container roles. Shape-dependent controls
such as radio buttons and switches keep the geometry that communicates their
function.

### Motion

```css
:root {
  --cirth-transition: 120ms ease-out;
}
```

Cirth applies reduced-motion preferences to its transitions. A busy
indicator continues moving because stopping it would communicate a different
state. Application animations remain your responsibility.

## Light, dark and increased contrast

Use [Themes](/themes) when a value changes by colour scheme or when a
subtree must force one scheme. Use
`@media (prefers-contrast: more)` for adjustments that belong only to a
user's increased-contrast preference.

```css
:root {
  --cirth-primary: light-dark(#6d28d9, #c4b5fd);
}

@media (prefers-contrast: more) {
  :root {
    --cirth-primary: light-dark(#4c1d95, #ede9fe);
  }
}
```

Do not assume a mathematically related colour passes the required contrast.
Test actual text, controls, focus indicators and states in both schemes.

## Cascade layers

A cascade layer is a named level in the CSS cascade. It lets authors decide
which groups of rules win before selector specificity is compared.

Every Cirth build, preset and print stylesheet places its rules in one layer
named `cirth`. Cirth has no sublayers and ships no `!important`
declarations.

Unlayered author CSS has priority over layered author CSS:

```css
button {
  border-radius: 999px;
}
```

That ordinary unlayered rule can override Cirth without copying or
outweighing Cirth's selector.

### Your own layers

If the application uses layers too, declare their order before any rule
fills them:

```css
@layer reset, cirth, components;
@import "@cirthcss/cirth";
@import "@cirthcss/cirth/presets/plain";

@layer reset {
  /* Lower priority than Cirth. */
}

@layer components {
  /* Higher priority than Cirth. */
}

.site-footer {
  /* Unlayered, so it has priority over every normal layer above. */
}
```

A CSS `@import` must precede normal style rules. A layer-order statement is
allowed before it. Moving the imports below a style rule causes the browser
to ignore them.

The HTML form establishes the same order before linked stylesheets:

```html
<style>
  @layer reset, cirth, components;
</style>
<link rel="stylesheet" href="/assets/cirth.min.css">
<link rel="stylesheet" href="/assets/application.css">
```

### Presets

A preset shares the `cirth` layer with the build. Load it after the build
so its token declarations follow the defaults:

```css
@import "@cirthcss/cirth";
@import "@cirthcss/cirth/presets/plain";
```

Your unlayered overrides can load before or after that pair and still have
higher cascade priority. Source order still decides between declarations
with otherwise equal priority inside the same layer.

### Importing Cirth into another layer

This is valid:

```css
@import "@cirthcss/cirth" layer(frameworks);
```

It nests Cirth's own layer under the outer one. It is rarely necessary,
because the package already supplies the `cirth` layer. Prefer an explicit
layer-order statement when all you need is ordering.

## What tokens cannot change

Custom properties change values, not which selectors exist. Choose a
different [package build](/package#screen-builds) for:

- removal of optional class selectors;
- scoping under a `.cirth` wrapper;
- the combination of those two boundaries.

The responsive behavior encoded in selector structure and fixed breakpoints
also cannot be replaced by a custom-property override.

<span id="token-reference"></span>
<span id="tokens-outside-css"></span>

## Complete reference and JSON

[Token reference](/tokens) lists every public property by category and
kind. It also documents the light and dark JSON exports for tools that
cannot read CSS.

The JSON represents the root token surface for the default theme. It is not
a browser stylesheet, a preset export or a promise that every local
component slot can be represented in design-tool formats.

## Common mistakes

- Setting a slot when you intended to set a theme input or role.
- Putting scoped-build overrides on `:root` instead of `.cirth`.
- Loading a preset before the screen build.
- adding `!important` before checking layer order.
- Changing colours without testing contrast and interaction states.
- Loading multiple screen builds together.

## Related pages

- [Colors](/colors) for colour roles and derivation.
- [Themes](/themes) for schemes, subtree themes and user preferences.
- [Presets](/presets) for maintained token override sets.
- [Using Cirth with existing CSS](/guides/existing-css) for ownership
  boundaries.
