---
layout: docs.njk
description: Cirth's purpose, scope, principles, maintenance, relationship to Pico CSS, license and governance.
---

# About

Cirth is a semantic-first CSS framework for building interfaces from
standard HTML. It supplies compiled styles for document structure, content,
forms, layout utilities and a focused set of native components.

Riccardo Pastori maintains the project with contributions from the community.
Source, documentation, tests and release tooling are developed in the
[Cirth repository](https://github.com/cirthcss/cirth).

## Purpose

Cirth aims to make well-structured HTML useful before an application adopts
a component abstraction. Its primary API is the browser's element
vocabulary, with a small set of optional classes for patterns HTML does not
name by itself.

The project is designed for:

- documents and applications built from native elements;
- client-rendered, server-rendered and static HTML;
- light and dark colour schemes;
- CSS-first customization;
- progressive enhancement of browser controls;
- coexistence with an established page through a scoped build.

It is not a JavaScript component library, application framework or complete
design system for every product-specific widget.

## Principles

### Meaning before presentation

Choose an element for what it represents. Cirth then styles it. Visual
variants use a class only when HTML has no equivalent meaning.

### Browser behavior before imitation

Native disclosure, dialog, popover, meter and form behavior stays owned by
the browser. Cirth adds styling and bounded CSS enhancements. Application
logic stays with the application.

### CSS as the customization surface

Public `--cirth-*` custom properties control the visual system. Published
CSS is already compiled, so consumers do not need the repository's Sass
source.

### Evidence with a stated boundary

Automated checks cover package exports, generated selectors, browser
behavior, accessibility specimens, links and visual regressions. A check is
evidence for the artifact and scenario it ran against. It is not a guarantee
about every interface a consumer can build.

### Small, explicit scope

New styles must justify the selector, token and maintenance surface they add.
Cirth prefers native vocabulary and a focused component set over parallel
APIs for every design pattern.

## Relationship to Pico CSS

Cirth began as a fork of
[Pico CSS](https://github.com/picocss/pico). Pico's semantic HTML approach
is an important part of the project's foundation.

Cirth is maintained as an independent framework. It has its own package,
browser floor, token system, build variants, component contracts,
documentation and release process. It is not a compatibility layer for Pico,
and matching names do not imply that the two projects will behave identically.

The Apache 2.0
[`NOTICE.md`](https://github.com/cirthcss/cirth/blob/master/NOTICE.md)
records the inherited work and its MIT license. Use each project's own
documentation when moving code between them.

## Origin of the name

The name refers to Cirth, a writing system invented by J. R. R. Tolkien. The
project chose it as a reference to a compact, systematic vocabulary.

The software project is not affiliated with, endorsed by or associated with
the Tolkien Estate, the Tolkien Society, Amazon or another rights holder.
The Cirth project mark and wordmark are original project assets. Their usage
terms are on the [Brand](/brand) page.

## What the project includes

- SCSS source used by the maintainers to produce the package;
- four compiled screen builds and four matching print stylesheets;
- maintained token presets;
- light and dark token JSON;
- this versioned documentation and its rendered examples;
- automated package, selector, browser, accessibility and visual checks.

The public npm package contains compiled CSS, token JSON and required package
metadata. It does not contain runtime JavaScript or the source SCSS. The
complete consumer surface is documented on
[Package and builds](/package).

## Size, and what it is a budget for

Compressed size is a maintained regression budget. It helps reviewers notice
when a change expands every consumer's download.

The budget is not the project's main product goal, and a current measurement
is not a permanent promise. A justified browser fix, accessibility
improvement or supported element may add bytes. The build records current
gzip and Brotli measurements, while [Delivery](/delivery#compression)
explains how to check what a real server transfers.

Size does not replace other measures. Selector ownership, compatibility,
rendered behavior and accessibility are checked separately.

### Why small matters here

Cirth is broad CSS that may load on every page. Avoiding redundant selectors
and declarations reduces that baseline cost. Applications should still
measure their complete CSS and transfer path rather than treating one library
number as a performance verdict.

## License

Cirth code is available under the
[Apache License 2.0](https://github.com/cirthcss/cirth/blob/master/LICENSE.md).
The npm manifest declares the same license. The license permits commercial
and private use, modification and redistribution under its conditions,
including preservation of the required notices. It also includes patent
terms and a warranty disclaimer.

This summary is not legal advice. Read the license and
[`NOTICE.md`](https://github.com/cirthcss/cirth/blob/master/NOTICE.md) for
the authoritative terms.

The code license does not grant rights to present another product as Cirth or
to imply endorsement. Project marks follow the [brand terms](/brand#terms).
Third-party marks shown in the documentation retain their owners and terms,
listed under [Attributions](/attributions).

## Governance and contributions

The maintainer reviews changes in the public repository. Issues and
discussions are the normal places to propose a bug fix, accessibility
finding, documentation correction or scoped feature.

Observable changes to the published artifact require the repository's
specification and evidence process. Releases follow protected automation and
maintainer approval. Contribution setup, code locations and quality gates
are documented in [Contributions](/contributions).

## Project links

- [Source](https://github.com/cirthcss/cirth)
- [Issues](https://github.com/cirthcss/cirth/issues)
- [Discussions](https://github.com/orgs/cirthcss/discussions)
- [npm](https://www.npmjs.com/package/@cirthcss/cirth)
- [Changelog](https://github.com/cirthcss/cirth/blob/master/CHANGELOG.md)
