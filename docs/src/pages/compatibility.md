---
layout: docs.njk
description: Supported browsers, what the package contains, how Cirth sits beside your own CSS and third-party widgets, and how the stylesheet reaches a browser.
---

# Compatibility

Cirth needs a current browser, and it shares the page with the CSS a
project already has. In short:

- **Browsers:** {{ browsers.sentence }}.
- **Modern CSS:** colours are written with `light-dark()` and relative
  colour syntax, forms rely on `:user-invalid`, and every rule sits in a
  cascade layer. Below the floor, those declarations are dropped.
- **Your build:** many bundlers rewrite `light-dark()` for older browsers
  by default, and a scheme forced on part of the page then stops working.
  [Which tools do, and the one setting that stops it](#if-your-build-transpiles-css).
- **Scoped builds:** `@cirthcss/cirth/scoped` styles only what is inside a
  `.cirth` element, for a page or an app shell with styles of its own
  ([every build](#what-the-package-contains)).
- **Existing CSS and component libraries:** your own unlayered CSS beats
  Cirth's at any specificity, and `.no-cirth` keeps Cirth's components off a
  third-party widget ([beside your own CSS](#beside-your-own-css)).

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

Measured with each tool's own starter, between
{{ frameworks.checkedBetween[0] | longDate }} and
{{ frameworks.checkedBetween[1] | longDate }}; each guide has its versions.

| Tool | Rewrites `light-dark()` by default | What to set |
| --- | --- | --- |
{% for guide in frameworks.pipelines.lowers -%}
| <a href="{{ guide.link }}">{{ guide.name }}</a> | Yes | {{ guide.fix }} |
{% endfor -%}
| {% for guide in frameworks.pipelines.keeps %}<a href="{{ guide.link }}">{{ guide.name }}</a>{% if not loop.last %}, {% endif %}{% endfor %} | No | Nothing |

{% for guide in frameworks.pipelines.asIs %}<a href="{{ guide.link }}">{{ guide.name }}</a>{% if loop.revindex == 2 %} and {% elif not loop.last %}, {% endif %}{% endfor %}
serve or copy the file as it is, so nothing rewrites it.

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

The scoped build (`@cirthcss/cirth/scoped`) styles only what is inside a
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
[guides](/installation/#guides) show where the import goes in each. A component library that renders its own styled markup can live on
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

### Every build from the CDN

The [Installation](/installation/#cdn) snippet links the default build.
Every other file is linked the same way, and each carries its own hash.

Classless, for a page with no classes at all:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@cirthcss/cirth@0.16.0/dist/cirth.classless.min.css"
  integrity="sha384-GZZdP20mqrkcypnIg17t08a5FoGdAKJ49eU1GBK8aXcaT+BwFnqIn5vK52i0gIQm"
  crossorigin="anonymous">
```

Scoped, to style only what is inside a `.cirth` element:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@cirthcss/cirth@0.16.0/dist/cirth.scoped.min.css"
  integrity="sha384-yFHmovn3OOvzinHeO2HC8iG31iDb+lzxgD4N1MlNchcoGDoFtCB07aY2FOyH/pPD"
  crossorigin="anonymous">
```

Scoped classless:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@cirthcss/cirth@0.16.0/dist/cirth.classless.scoped.min.css"
  integrity="sha384-pmLwIliHSNEo//m1i4cVpTDvwB8TWoXibgRIsG/pCjCS1CjZWI+xzd9xPL27iDal"
  crossorigin="anonymous">
```

The print sheet goes after the build, with `media="print"`. This one pairs
with the default build; each build has its own ([Print](/utilities/print)):

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@cirthcss/cirth@0.16.0/dist/cirth.print.min.css"
  integrity="sha384-YN/sJVAjTOf20mXWrLlQ2XLbgm3EzefQEiFukKfZstkH6fR92hz6dP7eQQTXQE6I"
  crossorigin="anonymous"
  media="print">
```

A preset goes after the build too ([Themes](/themes)):

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@cirthcss/cirth@0.16.0/dist/presets/plain.min.css"
  integrity="sha384-kcc0qmhEMFGjevUPPKQe8HsvALQEf5WLYgSB0GDaiwpnVkdOQ3FdmeCj7K8GgIA2"
  crossorigin="anonymous">
```

Every hash here is checked against the pinned files by `npm run check:sri`.

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
