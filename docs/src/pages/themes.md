---
layout: docs.njk
description: Light and dark schemes, the plain and playroom presets, and how to write and verify a theme of your own with --cirth-* custom properties.
---

# Themes

A theme in Cirth is a set of `--cirth-*` values, nothing more. The default
theme ships in every build with a light and a dark scheme; two presets
restate a handful of tokens on top of it; and your own theme is a stylesheet
that does the same.

## Light and dark

Cirth ships both schemes. The scheme follows the operating system, and
`data-theme="light"` or `data-theme="dark"` on any element forces one for
that subtree.

```html
<html data-theme="dark">
```

A `:root` override applies to **both** schemes, and it applies everywhere,
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

This is the shape Cirth uses internally. The pair is resolved where the token
is *used*, against the colour scheme in effect at that point, so one line
covers the page and any widget that forces its own scheme. If your build tool
transpiles CSS for older browsers it can break exactly this;
[Compatibility](/compatibility#if-your-build-transpiles-css) lists the tools
that do and the setting that stops them.

You can still target the scheme selectors directly, which is the tool for
changing one scheme without touching the other:

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

- **Unscoped builds** respond to `data-theme` on any ancestor.
- **Scoped builds** only look at the `.cirth` element itself, or elements
  inside it. `<html data-theme="dark">` around a `.cirth` widget has no
  effect, because every generated selector is anchored to the wrapper.

If you embed a scoped widget in a host page that manages its own dark mode,
mirror the host's choice onto the wrapper:

```html
<div class="cirth" data-theme="dark">…</div>
```

## Presets

A preset is a stylesheet that restates some of the default theme's tokens.
It contains no component styles, reset rules or scheme logic, so it works
with any of the four builds. Try both live with the **Preset** control in
this site's header.

{% colorSwatches %}

- **`plain`** is the conventional application baseline: a familiar blue
  accent and a plain white page. It is the token model in five declarations:
  two colour inputs and three role choices, with the accent states and the
  whole surface ladder following on their own.
- **`playroom`** is the expressive end: a soft violet accent, surfaces tinted
  toward it, large radii, a rounded system face, generous spacing, springy
  motion and a wide soft shadow. It overrides two *derived* tokens on
  purpose, so its hover lightens rather than darkens.

Load a preset after the build:

```html
<link rel="stylesheet" href="dist/cirth.min.css">
<link rel="stylesheet" href="dist/presets/plain.min.css">
```

```css
@import "@cirthcss/cirth";
@import "@cirthcss/cirth/presets/plain";
```

A preset shares the build's [cascade layer](/customization#cascade-layers),
which is why the order between the two matters and why a token you set
yourself beats both, wherever you load it. Like the default theme, presets
use font stacks that ship with every major operating system: no webfont, no
request beyond the stylesheet.

## Your own theme

Start from the four tokens that carry most of a retheme, listed under
[Start here](/customization#start-here), and add only what you need. Some
common shapes:

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

### Keep increased contrast working

Cirth carries a `prefers-contrast: more` pass that strengthens inks,
hairlines and focus rings. Your overrides sit outside Cirth's layer, so a
token you set unconditionally wins there too, which switches the preference
off for that token. Give it a stronger value where the reader asked for one:

```css
/* your accent, in both schemes */
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

Both presets do this. [Accessibility and user
preferences](/guides/accessibility#increased-contrast) lists what the pass
changes.

## Verifying your theme

Cirth's shipped themes, the default and both presets, are verified: every
text pair clears WCAG AA (4.5:1, or 7:1 under `prefers-contrast: more`) and
every non-text indicator clears 3:1, in light and dark, on every page of this
site.

That verification covers the values Cirth ships. **It does not extend to
values you set.** The relationships hold, so a derived hover stays
proportionally darker than whatever accent you give it, but whether the
result clears a threshold depends on the colour you chose. When you change an
input, check:

- your accent against the page, as link text;
- `--cirth-primary-on-surface` against `--cirth-primary-surface`, as a button
  label;
- `--cirth-muted-color` against the page;
- the status borders against a field.
