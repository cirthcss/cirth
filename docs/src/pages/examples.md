---
layout: docs.njk
---

# Examples

Three interfaces composed entirely from the same components documented
throughout this site — real markup, the default and scoped builds, and
the live theme toggle in the header for light and dark mode. Every block
below is rendered by the actual `cirth.min.css` this site loads; "Show
HTML" opens the exact source.

<section class="docs-build-comparison" aria-labelledby="build-comparison-title">
  <header>
    <h2 id="build-comparison-title">One interface, four real builds.</h2>
    <p>Each frame is isolated from the documentation shell and loads a stylesheet compiled directly from <code>src/</code>. No preview overrides are applied.</p>
  </header>
  <div>
    <figure><figcaption><strong>Default</strong><code>cirth.min.css</code></figcaption><iframe tabindex="-1" title="Default Cirth build example" src="/lab/default/?theme=light"></iframe></figure>
    <figure><figcaption><strong>Classless</strong><code>cirth.classless.min.css</code></figcaption><iframe tabindex="-1" title="Classless Cirth build example" src="/lab/classless/?theme=light"></iframe></figure>
    <figure><figcaption><strong>Scoped</strong><code>cirth.scoped.min.css</code></figcaption><iframe tabindex="-1" title="Scoped Cirth build example" src="/lab/scoped/?theme=dark"></iframe></figure>
    <figure><figcaption><strong>Scoped + classless</strong><code>cirth.classless.scoped.min.css</code></figcaption><iframe tabindex="-1" title="Scoped classless Cirth build example" src="/lab/scoped-classless/?theme=dark"></iframe></figure>
  </div>
  <footer><strong>Documentation JavaScript:</strong> none required for these frames. Theme and build are separate static URLs.</footer>
</section>

## Documentation

A docs-style layout: landmark regions, a vertical nav, prose, and a data
table — the layout primitives most content sites need, no components
beyond them. Default build.

{% demo "landmarks" %}
{% demo "nav-vertical" %}
{% demo "table-striped" %}

## Dashboard

Cards, a striped table, progress indicators, and a busy state for an
internal tool. Default build, retheming shown live: the button and link
below override `--cirth-primary` and `--cirth-border-radius` in seven
lines of plain CSS, with no rebuild.

{% demo "card" %}
{% demo "progress" %}
{% demo "loading" %}
{% demo "customization" %}

## Settings form

Form controls, validation states, and a checkbox/radio/switch set —
the pieces of a settings page. Default build; the callout shows the same
idea wrapped for the **scoped** build, which styles only what's inside a
`.cirth` container so it can sit inside an existing app shell without
leaking.

{% demo "forms-basics" %}
{% demo "forms-validation" %}
{% demo "checkbox-radio-switch" %}

Scoped markup boundary, `.cirth` wrapper (the isolated scoped build is shown
in Fig. E01 above; this inline source stays inside the site-wide default
build):

{% demo "scoped" %}

## More components

Every layout primitive, form control, and component has its own live
demo with full HTML source on its documentation page — see
[Layout](/layout/document), [Forms](/forms/), and
[Components](/components/card) — and [Get Started](/get-started) walks
through a complete starter document build by build.
