---
layout: docs.njk
description: Decide whether Cirth's semantic HTML, CSS-only delivery, customization model and tested accessibility baseline fit your project.
faq:
  - q: Do I need JavaScript to use Cirth?
    a: >-
      No. Cirth distributes CSS and has no runtime JavaScript. Your
      application can still use JavaScript for data, state and behavior.
  - q: Is a build step required?
    a: >-
      No. You can use the CDN link from
      <a href="/installation/#cdn">Installation</a>. If your project
      already bundles CSS, install the package and import it instead.
  - q: Does Cirth work with my framework?
    a: >-
      Cirth styles the HTML produced by client frameworks, server templates
      and static site generators. See the
      <a href="/framework-guides">framework guides</a> for exact setup.
  - q: Does Cirth make every interface accessible?
    a: >-
      No framework can guarantee that. Cirth tests its own defaults and
      documentation as a baseline. Your content, labels, validation and
      application behavior still need review. See
      <a href="/guides/accessibility">Accessibility</a>.
  - q: What does the package contain?
    a: >-
      Compiled CSS builds, print stylesheets, presets and token JSON. It
      contains no runtime JavaScript and no published Sass API. See
      <a href="/package">Package and builds</a>.
  - q: Where can I read about the name and license?
    a: >-
      <a href="/about">About</a> explains the project, its relationship to
      Pico CSS, the name and the Apache 2.0 code license. Brand assets have
      separate terms on the <a href="/brand">Brand</a> page.
---

# Why Cirth

Cirth is a semantic-first CSS framework. You write standard HTML and load one
stylesheet. Cirth supplies a coherent visual system without requiring a
component runtime or a large class vocabulary.

<dl class="grid docs-facts">
<div><dt>API</dt><dd>Standard HTML, plus a small set of optional classes</dd></div>
<div><dt>Runtime</dt><dd>No distributed JavaScript</dd></div>
<div><dt>Rendering</dt><dd>Client, server and static output</dd></div>
<div><dt>Customization</dt><dd>CSS custom properties in one cascade layer</dd></div>
</dl>

## HTML is the API

Start with the element that describes the content:

```html
<article>
  <header>
    <h2>Invite a teammate</h2>
  </header>

  <label>
    Email
    <input type="email" name="email" autocomplete="email" required>
  </label>

  <footer>
    <button type="submit">Send invite</button>
  </footer>
</article>
```

The `article` groups a self-contained piece of content. Its `header` names
that content, the `label` gives the field an accessible name, and the
`footer` contains its action. The browser understands those relationships
before Cirth is loaded. Cirth adds the card surface, typography, spacing and
control styles.

This model keeps meaning in the markup. It also means that markup remains
useful if you replace Cirth later.

## Browser features remain browser features

Cirth styles native controls instead of recreating them. A `details`
element expands and collapses because the browser implements that behavior.
A `dialog` can be shown as a modal through the browser's dialog API. A
`popover` can enter the top layer, which is the browser-managed layer above
normal page content.

Cirth adds appearance and carefully bounded CSS behavior. It does not take
ownership of application state, data submission or business rules.

<span id="pure-css-nothing-to-run"></span>

## No runtime to initialize

The published package has no JavaScript runtime. There is no component tree
to mount and no Cirth state to synchronize with the DOM.

Your application may still need JavaScript. A confirmation dialog, for
example, needs application logic to decide what is being confirmed and what
happens next. Cirth only styles the dialog and its controls.

## Works with different renderers

Cirth sees the final DOM, not the tool that produced it. A button rendered by
Laravel, Django, React, Vue or a static site generator is still a
`button` in the browser.

This makes Cirth a practical fit for server-rendered applications and for
projects that change rendering tools over time. Stack-specific setup is
limited to loading global CSS. The [framework guides](/framework-guides)
show where that import belongs.

## Customization uses CSS

Cirth exposes `--cirth-*` custom properties for colour, typography,
spacing, borders, motion and component slots. A custom property is a named
CSS value that other declarations can reuse. Override it in your stylesheet
and the dependent styles follow.

All shipped rules live in the `cirth` cascade layer. A cascade layer gives
authors an explicit order for groups of CSS rules. Unlayered application CSS
normally wins over Cirth without increasingly specific selectors.

[Customization](/customization) explains the model. The
[token reference](/tokens) lists the public properties.

## A tested accessibility baseline

Cirth provides visible focus styles, contrast-aware palettes, reduced-motion
handling and styles for semantic HTML controls. The project runs automated
accessibility checks across its built documentation, colour modes and tested
states.

That evidence applies to the shipped styles and specimens. It does not prove
that every interface built with Cirth is accessible. Authors must still
choose correct elements, provide labels and alternatives, communicate
errors, manage application behavior and test real user flows.

Read [Accessibility and user preferences](/guides/accessibility) for the
verified baseline and the responsibilities that remain with the application.

{% set benchCirth = benchmark.implementations[0] -%}
{% set benchUtility = benchmark.implementations[1] -%}
{% set benchClasses = benchmark.metrics[0] -%}
{% set benchBytes = benchmark.metrics[1] -%}

## Less markup, measured

The project maintains one controlled sign-in-card comparison to demonstrate
the effect of putting visual decisions in CSS rather than repeating them as
classes. It is evidence for that narrow positioning claim, not a general
ranking of frameworks.

| Metric | {{ benchCirth.label }} | {{ benchUtility.label }} | Reduction |
| --- | --: | --: | --: |
| {{ benchClasses.label }} | {{ benchClasses.values.cirth | grouped }} | {{ benchClasses.values.utility | grouped }} | {{ benchClasses.reduction }}% |
| {{ benchBytes.label }} | {{ benchBytes.values.cirth | grouped }} B | {{ benchBytes.values.utility | grouped }} B | {{ benchBytes.reduction }}% |
| Elements | {{ benchCirth.elements }} | {{ benchUtility.elements }} | none |

Both fixtures use the same element count and requirements. The comparison
measures HTML only, so it does not claim that Cirth always produces a smaller
total download. Read the [fixtures, method and limitations](/markup-comparison)
before using the figures in a decision.

## Where Cirth fits

Cirth is a strong option when:

- forms, tables, navigation, articles and other standard elements make up
  most of the interface;
- a small team needs a consistent baseline without maintaining a component
  library;
- server-rendered or progressively enhanced HTML is central to the project;
- avoiding a framework-specific runtime is useful;
- an existing page needs an opt-in styled region through the scoped build.

## Where another approach may fit better

Consider a bespoke design system, a component library or a utility workflow
when:

- the product is designed from custom components that do not map closely to
  native elements;
- you need a large catalogue of complex widgets with application behavior;
- strict visual reproduction matters more than semantic defaults;
- the team already has a coherent system and Cirth would duplicate it;
- the required browsers fall below Cirth's support floor.

## Tradeoffs

Cirth reduces the amount of framework-specific markup, but its defaults are
intentionally opinionated. Native elements bring useful browser behavior,
but browser support still determines which advanced behaviors are available.
A global semantic stylesheet is convenient on a new page, but an established
application may need the scoped build or explicit exclusion boundaries.

Review [Compatibility](/compatibility) for environment limits and
[Package and builds](/package) for the available isolation choices.

## Common questions

{% for item in faq %}
<details name="faq">
<summary>{{ item.q }}</summary>
<p>{{ item.a | safe }}</p>
</details>
{% endfor %}

## Next steps

- [Compatibility](/compatibility) checks browsers, CSS processing and
  coexistence constraints.
- [Installation](/installation/) adds the default build and verifies that it
  loaded.
- [Examples](/examples) shows complete interfaces made from documented
  patterns.
