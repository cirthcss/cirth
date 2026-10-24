---
layout: docs.njk
description: Add Cirth from a CDN or package manager, load its global CSS, verify the result and continue to the guide for your stack.
---
{% from "install.njk" import packageManagers %}

# Installation

This quickstart loads Cirth's default stylesheet and confirms that it is
active. It works for a plain HTML page and for projects that bundle global
CSS.

## Prerequisites

You need an HTML page that you can edit, or a project with a documented place
for global CSS. Global CSS means a stylesheet whose rules can apply across
the page, rather than styles isolated to one component.

Your users' browsers must also meet the
[support floor](/compatibility#browser-support). Cirth has no legacy-browser
bundle.

## Choose a loading method

Use the CDN for a plain page or a quick evaluation. Use a package manager
when your project already has a build tool and dependency manifest.

A package manager such as npm, pnpm, Yarn or Bun downloads project
dependencies and records them in a manifest. A lockfile records the exact
version selected for repeatable installs. Pinning a version means requesting
one exact release instead of a moving tag or version range.

## CDN

Place this `link` element inside the page's `head`:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@cirthcss/cirth@0.16.0/dist/cirth.min.css"
  integrity="sha384-lI8cp0vEMgtcAMV0HDytp7C+rad0hVfW/yXmsl87XmnuvTiMsx7O7ADf2lg5IQZq"
  crossorigin="anonymous">
```

The `head` is the part of an HTML document that contains metadata and
resources for the page. It appears before the `body`, which contains the
visible content.

`rel="stylesheet"` tells the browser that the linked resource is CSS.
The URL includes `@0.16.0`, so it is pinned to this release.
`integrity` contains a digest of the expected file. The browser refuses a
different response. `crossorigin="anonymous"` lets the browser perform
that integrity check for the cross-origin CDN request without sending
credentials.

Keep the version and integrity value together. The
[delivery guide](/delivery#subresource-integrity) owns the advanced CDN,
self-hosting and caching details.

## Package manager

Install the package from your project directory:

{{ packageManagers("main") }}

Commit the dependency manifest and lockfile produced by your package
manager. If your project requires an exact dependency declaration, use that
package manager's exact-version option and follow your repository policy.

Import the default build once at the entry point where the project loads
global CSS:

```js
import "@cirthcss/cirth";
```

If your tool resolves package imports from a stylesheet, this is equivalent:

```css
@import "@cirthcss/cirth";
```

An import asks the build tool to include Cirth's compiled CSS in the
application stylesheet. It is not a JavaScript runtime import. Your stack may
require global CSS to be imported from one specific layout or entry file, so
use its [framework guide](/framework-guides) when available.

## Minimal page

After choosing one loading method, add semantic content:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Cirth quickstart</title>
    <!-- Put the CDN link here, or let your build load the package import. -->
  </head>
  <body>
    <main class="container">
      <article>
        <header>
          <h1>Project notes</h1>
        </header>
        <p>Cirth is loaded. This article has a surface, spacing and typography.</p>
        <button type="button">Create note</button>
      </article>
    </main>
  </body>
</html>
```

`<!doctype html>` selects modern HTML parsing. The viewport metadata lets
the layout use the device width on phones. `main` identifies the page's
primary content, `article` groups the self-contained panel, and
`.container` is an optional Cirth layout class that limits line length and
adds responsive side spacing.

## Expected result

{% demo "installation-quickstart" %}

You should see a centred content area, a raised article surface, a clear
heading and a filled accent button. Those are Cirth styles; the browser's
unstyled versions look different.

## Verify that Cirth is active

Open the browser's developer console and run:

```js
getComputedStyle(document.documentElement)
  .getPropertyValue("--cirth-primary")
  .trim()
```

A non-empty value confirms that the default build's root tokens are present.
If the value is empty, inspect the Network panel for a failed CDN request or
inspect the production bundle for the package import.

This check proves that the stylesheet loaded. It does not prove that a
scoped build covers a particular element or that another stylesheet has not
overridden a rule.

## Advanced builds

Start with `@cirthcss/cirth`. Choose a different build only when the
default ownership is unsuitable:

- **classless** removes optional component and layout classes, except for the
  `.no-cirth` exclusion marker;
- **scoped** styles content and components only inside `.cirth`;
- **classless scoped** combines those two constraints.

[Package and builds](/package#screen-builds) is the single inventory of
entry points, files, print companions, presets and token JSON.

## Guides

The [Framework guides](/framework-guides) index covers
{{ frameworks.count }} build tools, application frameworks, server stacks,
static site generators and desktop environments. Each guide shows the exact
global-CSS location, production build command and any required CSS target.

If your tool is not listed, import the package through its documented
global-CSS mechanism and follow the production checks in
[Compatibility](/compatibility#bundlers-and-css-pipelines).

## Common problems

### The page still looks unstyled

- For the CDN method, confirm that the `link` is in `head` and that its
  request returns HTTP 200.
- For a bundled project, confirm that the file containing the import is
  reachable from the application entry point.
- Check the console for an integrity error. A mismatched version and hash
  causes the browser to reject the CDN response.

### Development works but production differs

Build tools can process CSS differently for production. Inspect the emitted
file for `light-dark(` and follow
[If your build transpiles CSS](/compatibility#if-your-build-transpiles-css).

### Only part of the page is styled

If you selected a scoped build, place the content inside a `.cirth`
wrapper. If you selected a classless build, optional classes such as
`.container` and `.grid` are intentionally unavailable.

## Next steps

- [Customization](/customization) changes colour, type, spacing and motion.
- [Examples](/examples) combines the documented elements into full pages.
- [Accessibility](/guides/accessibility) separates Cirth's tested baseline
  from application responsibilities.
