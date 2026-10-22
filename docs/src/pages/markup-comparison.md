---
layout: docs.njk
description: Fixtures, counting method, reproducibility and limitations for Cirth's semantic HTML markup comparison.
---

{% set benchCirth = benchmark.implementations[0] -%}
{% set benchUtility = benchmark.implementations[1] -%}
{% set benchClasses = benchmark.metrics[0] -%}
{% set benchBytes = benchmark.metrics[1] -%}

# Markup comparison

This comparison supports one narrow claim: a semantic-first stylesheet can
keep repeated visual instructions out of a component's HTML. It does not
rank complete frameworks or measure a whole application.

## Result

| Metric | {{ benchCirth.label }} | {{ benchUtility.label }} | Reduction |
| --- | --: | --: | --: |
| {{ benchClasses.label }} | {{ benchClasses.values.cirth | grouped }} | {{ benchClasses.values.utility | grouped }} ({{ benchUtility.distinctClasses }} distinct) | {{ benchClasses.reduction }}% |
| {{ benchBytes.label }} | {{ benchBytes.values.cirth | grouped }} B | {{ benchBytes.values.utility | grouped }} B | {{ benchBytes.reduction }}% |
| Elements | {{ benchCirth.elements }} | {{ benchUtility.elements }} | none |

Measured on {{ benchmark.measured | longDate }} against Cirth
{{ benchmark.cirthVersion }}. The repository regenerates the result with
`npm run benchmark` and checks it with `npm run check:benchmark`.

## Shared brief

Both fixtures implement the same sign-in card with:

- the same {{ benchCirth.elements }} HTML elements;
- the same text and meaningful attributes;
- a card surface;
- light and dark colour schemes that follow the system;
- a visible focus indicator on every control;
- hover and pressed button states;
- an invalid state for an empty required field;
- an accent-coloured checkbox.

Equal element count is a fixture constraint, not a performance result. It
keeps the comparison focused on how visual instructions appear in markup.

## Cirth fixture

```html
{{ benchmark.sources.cirth | safe }}
```

## Utility-style fixture

```html
{{ benchmark.sources.utility | safe }}
```

The Cirth project authored this fixture in a common utility-first vocabulary
to meet the brief. It is not an official example from, or a critique of, a
specific utility framework.

## Counting method

### Class occurrences

A class occurrence is one whitespace-separated token in a `class`
attribute. Repeating the same token on another element counts again. The
distinct-class count is reported separately.

### HTML bytes

The script encodes the fixture as UTF-8 after replacing each whitespace run
with one space and removing whitespace between adjacent tags. It does not
remove attributes, shorten values or alter text.

### Reduction

For each measured metric:

```text
(utility-style value - Cirth value) / utility-style value
```

The result is rounded to a whole percentage.

## What the comparison excludes

The measurement excludes both stylesheets, JavaScript and build tooling.
That matters:

- Cirth's default stylesheet is downloaded even when a page uses only part
  of it.
- A generated utility stylesheet can contain only the classes discovered in
  the project.
- Compression affects repeated class strings and CSS differently.
- A template component can keep a long class list in one source location,
  even though rendered HTML still contains each occurrence.

For those reasons, fewer HTML bytes do not guarantee fewer total transferred
bytes. Measure the deployed application when transfer size is the decision.

## Interpretation

The comparison is useful when maintainers care about the amount of
presentation detail carried by templates. It says little about:

- the flexibility of a bespoke component design;
- how quickly a team works in either model;
- unused CSS across a complete site;
- runtime performance;
- accessibility outside the stated fixture;
- long-term maintenance in a specific codebase.

Treat those as separate evaluation questions. [Why Cirth](/why-cirth)
summarizes the adoption tradeoffs without extending this fixture beyond what
it measures.

## Reproduce the measurement

The two fixtures live in
[`docs/benchmark/`](https://github.com/cirthcss/cirth/tree/master/docs/benchmark).
From a checkout with dependencies installed:

```sh
npm run benchmark
npm run check:benchmark
```

The first command prints the current values. The second fails if fixture
changes and stored results no longer agree.

When changing the comparison, preserve the shared brief and element parity.
Document any new metric before presenting it as evidence.
