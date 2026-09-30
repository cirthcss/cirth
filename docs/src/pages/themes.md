---
layout: docs.njk
description: Light and dark schemes, the shipped presets, and how to write and verify a theme of your own with --cirth-* custom properties.
---

# Themes

A theme in Cirth is a set of `--cirth-*` values, nothing more. The default
theme ships in every build with a light and a dark scheme; three presets
restate some of its tokens on top of it; and your own theme is a stylesheet
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

A preset is a stylesheet that restates some of the default theme's tokens,
and nothing else, so it works with any of the four builds. Cirth ships
three: `plain`, the conventional application look in five declarations;
`material`, Material Design 3's colour scheme, shapes and motion; and
`metro`, the manner of Windows Phone and Windows 8. Try each live with the
**Preset** control in this site's header.

{% colorSwatches %}

[Presets](/presets) describes what each one moves and leaves alone, how it
behaves in both schemes and under increased contrast, how to load it, and
how to give it its typeface, since a preset loads no font of its own.

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

Every shipped preset does this. [Accessibility and user
preferences](/guides/accessibility#increased-contrast) lists what the pass
changes.

## Verifying your theme

Cirth's shipped themes, the default and every preset, are verified: every
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
