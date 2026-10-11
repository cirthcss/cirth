---
layout: docs.njk
description: Find the verified Cirth installation guide for a build tool, frontend framework, server stack, CMS, static generator, desktop app or Rust project.
---
{% from "install.njk" import guideGrid %}

# Framework guides

Choose the tool that owns your global stylesheet. Each guide starts from the
tool's normal project structure, loads Cirth once, builds for production and
checks that forced light and dark regions still work.

If you only need a plain HTML page, use the
[Installation quickstart](/installation/) instead.

## Guides

{{ guideGrid(frameworks.groups) }}

## What a guide covers

Every guide answers four stack-specific questions:

1. Which file should import or link Cirth?
2. Does the tool transform already compiled CSS?
3. Does its browser target need to be changed?
4. How can you verify the production result?

The package command, default import and general browser requirements remain
authoritative on [Installation](/installation/),
[Package and builds](/package) and [Compatibility](/compatibility). The
guides do not redefine those shared contracts.

## Verification status

{% if frameworks.verifiedCount == frameworks.count -%}
All {{ frameworks.count }} guides are currently marked **Verified**.
{%- else -%}
{{ frameworks.verifiedCount }} of {{ frameworks.count }} guides are currently
marked **Verified**.
{%- endif %}

“Verified” means the documented steps were performed in a new project made
with the tool's own starter, the production build completed, and the result
was checked in Chromium with a light page and a forced dark subtree. The
individual guide records:

- the versions used;
- the verification date;
- what the CSS pipeline did;
- the observed result.

The current checks were performed between
{{ frameworks.checkedBetween[0] | longDate }} and
{{ frameworks.checkedBetween[1] | longDate }}. A later release of a tool may
change its starter or CSS processing. Treat the recorded versions as
evidence, then repeat the guide's final production check in your project.

Other possible labels are **Docs verified**, when a guide follows official
documentation but has not been built here; **Reported**, when a result has
not been reproduced; and **Not supported**. A guide must not present one of
those levels as a verified build.

## If your stack is not listed

Use the stack's official global-CSS mechanism:

1. install `@cirthcss/cirth`;
2. import `@cirthcss/cirth` once;
3. build for production;
4. confirm that `light-dark(` remains in the emitted stylesheet;
5. render a `data-theme="dark"` region while the system uses a light
   scheme.

The full diagnostic procedure is in
[Bundlers and CSS pipelines](/compatibility#bundlers-and-css-pipelines).
Open a focused contribution if the setup is repeatable and useful to other
readers.

## Logos and project names

Project names identify the tools their guides cover. Logo files are shown
only under the recorded source and usage decision for that project. Cirth is
not affiliated with or endorsed by the listed projects.

[Framework logo attributions](/attributions#framework-logos) contains the
complete inventory, source links, terms and text-only decisions.
