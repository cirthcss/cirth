---
layout: docs.njk
---

# Examples

Three interfaces composed entirely from the same components documented
throughout this site — real markup, the default and scoped builds, and
the live theme toggle in the header for light and dark mode. Every block
below is rendered by the actual `cirth.min.css` this site loads; "Show
HTML" opens the exact source.

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

Scoped build, `.cirth` wrapper:

{% demo "scoped" %}

## More components

Every layout primitive, form control, and component has its own live
demo with full HTML source on its documentation page — see
[Layout](/layout/document), [Forms](/forms/), and
[Components](/components/card) — and [Get Started](/get-started) walks
through a complete starter document build by build.
