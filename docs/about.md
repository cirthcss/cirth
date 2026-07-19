# About Cirth

Cirth is a CSS framework built around semantic HTML and one claim: **HTML
already describes your interface.** A `<button>` is a button, a `<nav>` is
navigation, an `<article>` is a complete unit of content. A stylesheet's
job is to read that structure, rather than replace it with a parallel
vocabulary of class names.

## Why semantic HTML first

Most CSS frameworks ask you to learn their language: component classes,
utility recipes, variant modifiers. That language lives in your markup,
which means every redesign is a migration and every snippet is coupled to
one framework's dialect.

Cirth inverts this. The framework's "API" is HTML itself:

* **Elements are styled by default.** `<button>`, `<table>`, `<input>`,
  `<details>`, `<dialog>` come out finished, with hover, focus, disabled,
  dark mode, and accessible target sizes included.
* **Classes are an escape hatch, not a language.** The default build ships
  a handful (`.secondary`, `.outline`, `.container`, `.grid`, …) for the
  few distinctions HTML can't express. The classless build ships none.
* **Customization lives in CSS, not markup.** Every color, radius, spacing,
  and font is a `--cirth-` custom property. Restyling a project means
  overriding tokens once, not editing class lists at every call site.

The practical consequence: markup written for Cirth is just… markup. It
outlives the framework. If you removed the stylesheet tomorrow, the
document would still be correct, accessible, and machine readable.

## Constraints are the product

Cirth is deliberately small, and stays that way on purpose:

* **No JavaScript.** Interactive patterns (accordion, dropdown, modal) use
  native elements such as `<details>` and `<dialog>`, along with their
  native behavior.
* **No component catalog.** Layout primitives, forms, typography, and a
  small set of components. If a pattern needs a tower of `div` elements, it
  doesn't belong here.
* **Fully customizable.** Every color, spacing, radius, font, and shadow
  is one of hundreds of `--cirth-` custom properties: override them after
  loading the framework and the whole theme follows, with no build step and
  no Sass. `cobalt` and `coral` ship as ready made token override presets.
* **Accessibility is a floor, not a feature.** WCAG 2.2 AA contrast,
  visible focus rings that survive forced colors mode, 44px touch targets,
  and `prefers-reduced-motion` support are verified in the source.

## The name

Cirth is the runic alphabet Tolkien designed for carving: every letter
reduced to the strokes the material allows. That is the discipline this framework
aims at: remove what the medium
doesn't need, and what remains is durable. Semantic HTML is the closest
thing the web has to carving: class names wash away; the document is what
lasts.

The visual identity built on that idea, including the rune form mark, the
amber hue, and the wordmark, is documented on the [Brand](/brand) page.

## Relationship to Pico CSS

Cirth began as a fork of [Pico CSS](https://picocss.com), which pioneered
this approach, and it remains indebted to that work. Treat Cirth as an
independent framework rather than a promise of permanent direct
compatibility. The most important differences for users are:

* The package name is `@cirthcss/cirth` and the custom property prefix is
  `--cirth-`.
* The published package is CSS only; SCSS is repository source, not a
  public Sass API.
* The active build set is default, classless, scoped, and scoped
  classless.
* Scoped builds target a `.cirth` wrapper, including custom properties,
  document styles, color schemes, and modal states.
* The inherited set of twenty accent themes has been reduced to a single official
  theme (amber), with `cobalt` and `coral` published as optional
  token override presets; see [Colors](/colors).
* A WCAG 2.2 AA baseline (contrast, focus visibility, target size) is
  verified in the source.

## Project

* Contributing: [Contributions](/contributions)
* License: [MIT](https://github.com/cirthcss/cirth/blob/master/LICENSE.md)
