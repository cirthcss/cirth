---
layout: docs.njk
description: Supported browsers, what the package contains, how Cirth sits beside your own CSS and third-party widgets, and how the stylesheet reaches a browser.
---

# Compatibility

What to know before adopting Cirth: where it runs, what the package
contains, how it sits beside the CSS you already have, and how the file gets
to a browser.

<dl class="docs-facts">
<div><dt>Browsers</dt><dd>{{ browsers.sentence }}</dd></div>
<div><dt>JavaScript</dt><dd>None shipped, none required</dd></div>
<div><dt>Package</dt><dd>Compiled CSS, four builds, print sheets, presets, design tokens as JSON</dd></div>
<div><dt>Default build</dt><dd>{{ proof.size.label if proof.size else "about 15 KB" }} gzipped, measured on this build</dd></div>
</dl>

## Browser support

{{ browsers.sentence }}.

That list is the Browserslist target in `package.json`: the engines the
stylesheet is compiled for and tested in. It is held to one engine floor
across every family, so a browser that shares an engine with a supported one
is supported from the same version.

Below the floor, Cirth is not tested and parts of it do not work. Its colours
are declared with `light-dark()` and relative colour syntax, its forms rely
on `:user-invalid`, and its rules sit in a cascade layer: an engine that
understands none of these drops those declarations. No version of Internet
Explorer is supported.

### If your build transpiles CSS

Cirth arrives already compiled for the floor above and needs no PostCSS or
Lightning CSS pass of its own. Many build tools run every stylesheet through
one anyway, aimed at an older default set of browsers, and that pass rewrites
`light-dark()` into an emulation that does not keep Cirth's behaviour:

- the page still follows the system scheme and a `data-theme` on the root;
- an element with `data-theme` that forces the **other** scheme inside the
  page, a dark sidebar on a light page for example, no longer changes colour.

Measured on 27 September 2026, with each tool's own starter:

| Tool | Rewrites `light-dark()` by default | What to set |
| --- | --- | --- |
| Vite 8, and React, Vue and SvelteKit on it | Yes | `build.cssTarget` ([Vite](/installation/vite)) |
| Nuxt 4 | Yes | `vite.build.cssTarget` ([Nuxt](/installation/vue)) |
| Next.js 16 | Yes | `browserslist` in `package.json` ([Next.js](/installation/nextjs)) |
| Astro 7, Angular 22, Eleventy 3 | No | Nothing |

In each case the fix is the same: tell the tool Cirth's browsers, so it has
nothing to lower.

## What the package contains

Compiled CSS and nothing else that runs. Every entry point has a short
`exports` path:

| Import | File | What it is |
| --- | --- | --- |
| `@cirthcss/cirth` | `dist/cirth.min.css` | The default build |
| `@cirthcss/cirth/classless` | `dist/cirth.classless.min.css` | No classes; landmarks are the layout |
| `@cirthcss/cirth/scoped` | `dist/cirth.scoped.min.css` | Styles only inside `.cirth` |
| `@cirthcss/cirth/classless/scoped` | `dist/cirth.classless.scoped.min.css` | Both |
| `@cirthcss/cirth/print` | `dist/cirth.print.min.css` | Print sheet for the default build, one per build |
| `@cirthcss/cirth/presets/plain` | `dist/presets/plain.min.css` | Token preset, loaded after a build |
| `@cirthcss/cirth/tokens/light` | `dist/tokens/light.tokens.json` | The token surface as W3C Design Tokens, one file per scheme |

The `dist/*` paths keep resolving for anyone importing a file directly.
[Contributions](/contributions#package-exports) has the complete map.

The SCSS in the repository is how these files are produced. It is not a
published Sass API, and nothing in the package asks you to compile it.

### Versions

Cirth is before 1.0, and a minor release can change something you rely on.
Those changes are listed, with what to do about each, on
[Upgrading](/upgrading). Patch releases fix bugs without changing the public
surface.

## Beside your own CSS

### Cascade layer

Every stylesheet Cirth ships keeps all of its rules in one cascade layer,
`cirth`. CSS you write outside a layer beats it at any specificity and in any
loading order, so an override is a plain rule rather than a selector built to
outweigh Cirth's. If you use layers yourself, name `cirth` in your order
statement; [Cascade layers](/customization#cascade-layers) shows how.

### Inside an existing page

The [scoped build](/installation/#scoped) styles only what is inside a
`.cirth` element, so it can be added to a page, a CMS or an application shell
that already has its own styles. The page around the wrapper is left alone.

### Excluding a third-party component

When a datatable, map, rich-text editor or other widget brings its own CSS,
mark its root with `.no-cirth`:

```html
<div class="no-cirth">
  <!-- third-party widget markup -->
</div>
```

**Cirth's component declarations do not target that element or its
descendants.** This applies to all four screen builds, including an element
that carries both `.cirth` and `.no-cirth` in a scoped build. Nested
`.no-cirth` boundaries stay excluded; there is no re-entry class and nothing
to initialize.

The name is shorter than the contract. It does **not** turn all of Cirth off
or restore browser defaults. The global reset, theme custom properties,
inherited fonts and colours, layout classes, accessibility and reduced-motion
rules, and the separate print stylesheet still apply. A Cirth selector whose
subject is outside the boundary can also still react to an excluded
descendant through `:has()`, or to an excluded earlier sibling. When a widget
needs a real style boundary, mount it in a shadow root.

### Frameworks and component libraries

Cirth styles elements, not components, so it does not matter what produced
the DOM: a template, a server, or a client framework. The
[framework guides](/installation/#framework-guides) show where the import goes
in each. A component library that renders its own styled markup can live on
the same page; give its root `.no-cirth` if the two disagree.

## Delivering the stylesheet

None of this is required: the [CDN snippet](/installation/#cdn) works as it
stands. It matters once you care how many milliseconds the stylesheet costs.

### A CDN or your own origin

A CDN needs nothing built or hosted, and the file may already be cached near
your visitor. It costs a second connection: a new hostname to resolve and a
new TLS handshake before the first byte of CSS arrives, while a stylesheet in
the `<head>` blocks rendering.

Serving the file from the same origin as your HTML skips that setup, because
the connection is already open. It also puts compression and caching under
your control.

### Caching

A version-pinned URL names bytes that never change, so it can be cached for
as long as you like:

```http
Cache-Control: public, max-age=31536000, immutable
```

That holds for a CDN URL with an exact version in it and for a self-hosted
copy under a versioned or content-hashed path. It does **not** hold for a URL
that tracks a moving target, such as a version range or a file you overwrite
on each deploy.

### Integrity

The CDN snippet carries a Subresource Integrity hash. The digest covers the
decoded stylesheet, so compression does not affect it, but it is tied to the
exact version in the URL: change the version and take that release's hash
with it.

### Compression

The sizes quoted on this site are gzip, because that is what ordinary hosting
sends without being asked: the default build is
**{{ proof.size.label if proof.size else "about 15 KB" }}**. Check what your
own host puts on the wire:

```sh
curl -s -o /dev/null -D - -H 'Accept-Encoding: br, gzip' \
  https://example.com/cirth.min.css \
  | grep -i 'content-encoding\|content-length'
```

Some hosts never negotiate Brotli; others compress it on the fly at a low
quality setting, where it can come out larger than gzip. If you serve the file
yourself, compress it once at deploy time instead, which brings the default
build to **{{ proof.size.brotliLabel if proof.size else "about 13 KB" }}**.

<details>
<summary>Precompressing with Brotli</summary>

```sh
brotli -k -q 11 cirth.min.css     # writes cirth.min.css.br
```

Servers with static-precompression support find the neighbouring file and set
the headers for you: nginx with `brotli_static on;` (the ngx_brotli module)
and `gzip_static on;`, or Caddy with `precompressed br gzip` inside
`file_server`. Elsewhere, rewrite the request onto the `.br` file and set all
three headers yourself:

```http
Content-Encoding: br
Content-Type: text/css
Vary: Accept-Encoding
```

Keep the `.css` URL in your markup. A `.br` file linked directly arrives
without a `Content-Encoding` header, and the page loads unstyled. `Vary` is
the one that is easy to forget: without it a shared cache can hand compressed
bytes to a client that never asked for them.

If you bundle Cirth with your own CSS, precompress the bundle's output rather
than `cirth.min.css`, which no longer describes anything you serve.

</details>

### Print

Print styling is a separate file that no screen request needs.
[Print](/utilities/print) covers which sheet goes with which build.
