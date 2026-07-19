# Customization

Cirth is CSS first. Every color, spacing, radius, shadow, and font is a
`--cirth-*` custom property. Override them in your own stylesheet, loaded
after Cirth. No Sass, no build step, no rebuild required.

```css
:root {
  --cirth-font-family: Inter, system-ui, sans-serif;
  --cirth-primary: #2563eb;
  --cirth-primary-background: #2563eb;
  --cirth-primary-border: #2563eb;
  --cirth-border-radius: 0.375rem;
  --cirth-spacing: 1rem;
}
```

For scoped builds, put the overrides on the scoped root instead of `:root`:

```css
.cirth {
  --cirth-font-family: Inter, system-ui, sans-serif;
  --cirth-primary: #2563eb;
}
```

<Demo src="customization" />

The generated CSS in `dist/cirth.css` (the build that is not minified) is the most
reliable, always current reference for the full custom property surface;
grep it for `--cirth-` when in doubt.

## Two layers of tokens

Cirth's variables come in two layers, and it helps to know which one to
touch:

1. **Foundation tokens** are raw scales that rarely need overriding directly:
   `--cirth-space-*`, `--cirth-size-*`, `--cirth-radius-*`,
   `--cirth-font-family-*`, `--cirth-font-size-*`, `--cirth-font-weight-*`,
   `--cirth-line-height-*`, `--cirth-duration-*`, `--cirth-ease-*`.
2. **Semantic tokens** are what components actually consume, and what you
   should override: `--cirth-primary`, `--cirth-spacing`,
   `--cirth-border-radius`, `--cirth-form-element-border-color`,
   `--cirth-card-background-color`, and so on. Most semantic tokens default to
   a foundation token or to another semantic token (`--cirth-primary-border:
   var(--cirth-primary-background)`), so overriding one upstream variable
   often updates several components at once.

## Primary, secondary, and contrast

Buttons, links, and form focus rings are driven by three semantic color
groups, each with a base, hover, focus, and inverse text color variant:

| Group | Key variables |
| --- | --- |
| Primary | `--cirth-primary`, `--cirth-primary-background`, `--cirth-primary-border`, `--cirth-primary-hover`, `--cirth-primary-hover-background`, `--cirth-primary-focus`, `--cirth-primary-inverse` |
| Secondary | `--cirth-secondary`, `--cirth-secondary-background`, `--cirth-secondary-hover-background`, `--cirth-secondary-focus`, `--cirth-secondary-inverse` |
| Contrast | `--cirth-contrast`, `--cirth-contrast-background`, `--cirth-contrast-hover-background`, `--cirth-contrast-focus`, `--cirth-contrast-inverse` |

`.secondary`, `.contrast`, and `.outline` (see [Button](/content/button) and
[Link](/content/link)) simply swap which group a `button` or `a` reads its
`--cirth-background-color`/`--cirth-color` from.

The `cobalt` and `coral` [presets](/colors) build on exactly this: each
overrides the primary group's variables (light and dark) to swap the
accent, plus a handful of tokens from other layers: surface neutrals,
`--cirth-box-shadow`, `--cirth-font-family`, `--cirth-spacing`,
`--cirth-transition`, and the radius tokens. Together they show how far a
restyle can go while still just being custom property overrides.

## Light and dark

Every theme ships a light and a dark color scheme, switched through the same
mechanism Cirth inherited from Pico CSS:

* **Automatic** follows the OS/browser `prefers-color-scheme`.
* **Forced** means setting `data-theme="light"` or `data-theme="dark"` on the root
  element (`<html>`, or your `.cirth` wrapper for scoped builds) to override
  the system preference.

```html
<html data-theme="dark">
```

This site uses that same attribute: the theme toggle in the nav bar sets
`data-theme` on `<html>`, and since the whole site is styled by Cirth,
everything, including chrome, prose, and live examples, switches scheme through the
framework's own mechanism.

### `data-theme` in scoped builds

The two builds intentionally differ in *where* they look for the attribute:

* **Unscoped builds** respond to `data-theme` on any ancestor, conventionally
  `<html>`, but any wrapper element works, and different subtrees can force
  different schemes.
* **Scoped builds** only look at the `.cirth` element itself (or elements
  inside it). A `data-theme` on an ancestor *outside* the scope, such as
  `<html data-theme="dark">` around a `.cirth` widget, has no effect,
  because every generated selector is anchored to `.cirth`.

If you embed a scoped Cirth widget in a host page that manages its own
dark mode, mirror the host's theme onto the wrapper:

```html
<div class="cirth" data-theme="dark">…</div>
```

## Spacing and typography

* `--cirth-spacing` drives most component padding/margins; it defaults to
  `--cirth-space-4` (`1rem`).
* `--cirth-block-spacing-vertical` / `--cirth-block-spacing-horizontal` control the vertical
  rhythm of `body > header/main/footer`, `section`, and `article`.
* `--cirth-typography-spacing-vertical` controls the space below paragraphs,
  lists, and other text blocks; `--cirth-typography-spacing-top` (set per
  heading level) controls the space *above* a heading that follows a block.
* Root font size is fixed at `100%` across all breakpoints, so body text
  and interactive controls (44px tall by default) stay stable at every
  viewport width. Headings scale fluidly instead, via `clamp()` on their
  `--cirth-font-size` for each level.

## What's not customizable through variables

A few structural choices are Sass switches decided at compile time, not runtime CSS
variables, because they change what selectors are generated at all:

* **Enabling or disabling selectors based on classes** (`.container`, `.grid`,
  `.secondary`, `.dropdown`, …) is the classless vs. default build
  choice, made when the CSS was compiled.
* **Scoping every selector under `.cirth`** is the scoped vs. unscoped build
  choice.
* **Breakpoints and container maximum widths** are fixed in `src/_breakpoints.scss`
  at build time.

If you need different values for these, you're changing which published
build you load (see [Get Started](/get-started)), not overriding a variable.
