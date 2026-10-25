---
layout: docs.njk
description: Reference for every published Cirth build, package export, generated file, preset, print stylesheet and token JSON document.
---

# Package and builds

`@cirthcss/cirth` publishes compiled CSS, token JSON and package metadata.
It does not publish a JavaScript runtime or a Sass API.

Start with the default entry point:

```js
import "@cirthcss/cirth";
```

Choose another entry point only when you need a different ownership boundary
or a companion file.

## Screen builds

All four screen builds come from the same source and expose the same token
system.

| Build | Package import | Minified file | Use it when |
| --- | --- | --- | --- |
| Default | `@cirthcss/cirth` | `dist/cirth.min.css` | Cirth owns the page and optional classes are useful |
| Classless | `@cirthcss/cirth/classless` | `dist/cirth.classless.min.css` | You want semantic-element styling without Cirth's optional component and layout classes |
| Scoped | `@cirthcss/cirth/scoped` | `dist/cirth.scoped.min.css` | Only content inside a `.cirth` wrapper should opt in |
| Classless scoped | `@cirthcss/cirth/classless/scoped` | `dist/cirth.classless.scoped.min.css` | You need both constraints |

The classless builds retain `.no-cirth`, because it is the documented
component-exclusion boundary. They do not make every selector class-free in
the literal sense.

The scoped builds require a wrapper:

```html
<section class="cirth">
  <h1>Scoped application</h1>
  <button type="button">Save</button>
</section>
```

Theme tokens are established on that wrapper. Put region-specific token
overrides on `.cirth` or a descendant. Read
[Using Cirth with existing CSS](/guides/existing-css) before mixing the
scoped build with third-party styles.

## Package exports

These are the public paths declared by the package manifest:

| Export | Resolves to |
| --- | --- |
| `@cirthcss/cirth` | `dist/cirth.min.css` |
| `@cirthcss/cirth/print` | `dist/cirth.print.min.css`, deprecated |
| `@cirthcss/cirth/classless` | `dist/cirth.classless.min.css` |
| `@cirthcss/cirth/classless/print` | `dist/cirth.print.classless.min.css`, deprecated |
| `@cirthcss/cirth/scoped` | `dist/cirth.scoped.min.css` |
| `@cirthcss/cirth/scoped/print` | `dist/cirth.print.scoped.min.css`, deprecated |
| `@cirthcss/cirth/classless/scoped` | `dist/cirth.classless.scoped.min.css` |
| `@cirthcss/cirth/classless/scoped/print` | `dist/cirth.print.classless.scoped.min.css`, deprecated |
| `@cirthcss/cirth/presets/plain` | `dist/presets/plain.min.css` |
| `@cirthcss/cirth/presets/material` | `dist/presets/material.min.css` |
| `@cirthcss/cirth/presets/metro` | `dist/presets/metro.min.css` |
| `@cirthcss/cirth/tokens/light` | `dist/tokens/light.tokens.json` |
| `@cirthcss/cirth/tokens/dark` | `dist/tokens/dark.tokens.json` |
| `@cirthcss/cirth/package.json` | `package.json` |

Two wildcard exports support deliberate lower-level access:
`@cirthcss/cirth/presets/*` maps into `dist/presets/*`, and
`@cirthcss/cirth/dist/*` maps into `dist/*`. Prefer the named paths above
when one exists. Named paths express intent and avoid depending on a filename
convention.

## Companion files

### Print stylesheets

Every build carries its print rules since v0.17.0. The separate print
entries below still ship through the 0.17 line, deprecated, so existing
imports keep resolving: loading one after its build changes nothing
printed. They are removed in v0.18.0.

| Screen build | Print import |
| --- | --- |
| Default | `@cirthcss/cirth/print` |
| Classless | `@cirthcss/cirth/classless/print` |
| Scoped | `@cirthcss/cirth/scoped/print` |
| Classless scoped | `@cirthcss/cirth/classless/scoped/print` |

The [Print](/utilities/print) page documents what the print rules change.

### Presets

Presets override tokens and must load after a screen build:

```css
@import "@cirthcss/cirth";
@import "@cirthcss/cirth/presets/plain";
```

The maintained presets are `plain`, `material` and `metro`.
[Presets](/presets) documents their visual choices, limitations and font
requirements. A preset is not a separate component build.

### Token JSON

The `light` and `dark` JSON exports expose the root token surface for
design and build tooling. They do not replace the CSS required in a browser,
and they do not include every component-local slot.

[Tokens outside CSS](/tokens#tokens-outside-css) explains the document
shape and safe uses.

## Physical files

The published `dist/` directory contains 24 generated files:

| Directory | Files |
| --- | --- |
| `dist/` builds, print rules included | `cirth.css`, `cirth.classless.css`, `cirth.scoped.css`, `cirth.classless.scoped.css`, plus each `.min.css` counterpart |
| `dist/` print CSS, deprecated | `cirth.print.css`, `cirth.print.classless.css`, `cirth.print.scoped.css`, `cirth.print.classless.scoped.css`, plus each `.min.css` counterpart |
| `dist/presets/` | `plain.css`, `material.css`, `metro.css`, plus each `.min.css` counterpart |
| `dist/tokens/` | `light.tokens.json`, `dark.tokens.json` |

The npm tarball also contains `package.json`, `README.md`,
`LICENSE.md` and `NOTICE.md`. Source SCSS remains in the repository and
is not part of the published package.

Expanded CSS is useful for inspection and debugging. The named package
exports intentionally resolve to minified CSS for normal consumption.

## Choose a build

Use this sequence:

1. Start with the default build.
2. Choose classless if optional Cirth classes are forbidden or unnecessary.
3. Choose scoped if Cirth must not own the whole document.
4. Combine them only when both requirements are real.
5. Add the matching print entry only if the product needs Cirth's print
   behavior.
6. Add one preset after the build if its design direction fits.

Do not load two screen builds together. They contain overlapping rules from
the same source and provide no useful composition.

## CDN files

The same physical CSS files can be loaded from a CDN or hosted on your own
origin. Use the version-pinned links and integrity values on
[Delivery and deployment](/delivery#cdn-files), not a guessed path.

## Verification

The repository checks that every export resolves from a packed tarball, that
consumer imports work, and that the generated variants keep their selector
boundaries. These checks validate the package surface. They do not validate
your bundler configuration, so run the production check in the guide for
your stack.

## Related pages

- [Installation](/installation/) for the shortest working setup.
- [Compatibility](/compatibility) for browsers and CSS transforms.
- [Customization](/customization) for overriding the visual system.
- [Delivery and deployment](/delivery) for CDN and self-hosting choices.
