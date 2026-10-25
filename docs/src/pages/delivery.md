---
layout: docs.njk
description: Deliver Cirth from a CDN or your own origin with version pinning, Subresource Integrity, caching and compression.
---

# Delivery and deployment

Installation explains how to load Cirth. This page covers how to serve the
chosen file reliably in production.

## Choose an origin

A CDN is convenient when you do not want to copy or bundle the stylesheet.
The browser makes a request to a separate origin, and that origin controls
availability and response headers.

Self-hosting keeps the stylesheet on the same origin as the application. It
lets you deploy HTML and CSS together and control caching and compression.
Bundling Cirth into an application stylesheet is also self-hosting; the file
to cache and compress is the final bundle, not Cirth's source file.

Neither choice changes Cirth's CSS behavior. Choose based on the deployment
system, security policy and failure boundary your project already uses.

## Pin the bytes

A production URL should identify immutable bytes. The CDN snippets use an
exact package version:

```text
https://cdn.jsdelivr.net/npm/@cirthcss/cirth@0.16.0/dist/cirth.min.css
```

For self-hosting, keep the version in the path or add a content hash to the
filename. Do not give a long immutable cache lifetime to a path whose
contents are overwritten on every deployment.

## Subresource Integrity

Subresource Integrity, usually shortened to SRI, lets the browser verify a
cryptographic digest before applying a cross-origin stylesheet:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@cirthcss/cirth@0.16.0/dist/cirth.min.css"
  integrity="sha384-lI8cp0vEMgtcAMV0HDytp7C+rad0hVfW/yXmsl87XmnuvTiMsx7O7ADf2lg5IQZq"
  crossorigin="anonymous">
```

The digest is tied to the exact file and version. Changing either one
requires a new digest. `crossorigin="anonymous"` makes the cross-origin
request eligible for the integrity check without credentials.

SRI detects bytes that differ from the expected file. It does not make an
untrusted stylesheet safe to use, and it does not replace HTTPS.

## CDN files

The [package inventory](/package) explains which build to choose. The
snippets below are the authoritative version-pinned CDN forms. Load one
build, then optionally one preset. Every build carries its print rules.

<details>
<summary>Screen builds</summary>

**Default**

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@cirthcss/cirth@0.16.0/dist/cirth.min.css"
  crossorigin="anonymous"
  integrity="sha384-lI8cp0vEMgtcAMV0HDytp7C+rad0hVfW/yXmsl87XmnuvTiMsx7O7ADf2lg5IQZq">
```

**Classless**

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@cirthcss/cirth@0.16.0/dist/cirth.classless.min.css"
  crossorigin="anonymous"
  integrity="sha384-GZZdP20mqrkcypnIg17t08a5FoGdAKJ49eU1GBK8aXcaT+BwFnqIn5vK52i0gIQm">
```

**Scoped**

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@cirthcss/cirth@0.16.0/dist/cirth.scoped.min.css"
  crossorigin="anonymous"
  integrity="sha384-yFHmovn3OOvzinHeO2HC8iG31iDb+lzxgD4N1MlNchcoGDoFtCB07aY2FOyH/pPD">
```

**Classless scoped**

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@cirthcss/cirth@0.16.0/dist/cirth.classless.scoped.min.css"
  crossorigin="anonymous"
  integrity="sha384-pmLwIliHSNEo//m1i4cVpTDvwB8TWoXibgRIsG/pCjCS1CjZWI+xzd9xPL27iDal">
```

</details>

<details>
<summary>Presets</summary>

A preset must follow the screen build so its token values win within the
same cascade layer.

**Plain**

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@cirthcss/cirth@0.16.0/dist/presets/plain.min.css"
  crossorigin="anonymous"
  integrity="sha384-kcc0qmhEMFGjevUPPKQe8HsvALQEf5WLYgSB0GDaiwpnVkdOQ3FdmeCj7K8GgIA2">
```

**Material and Metro**

<!-- Material and Metro first ship in 0.17.0. The snippets pin the last
stable release, which does not have them during the 0.17 beta series:
restore their two snippets when 0.17.0 is stable, and `npm run sri` writes
the pin and the hash. -->

These two presets first ship in v0.17.0, which is in beta. The snippets on
this page pin the last stable release, so their jsDelivr links appear here
when v0.17.0 is stable. To try them now, install the beta from npm:
`npm install @cirthcss/cirth@beta`.

</details>

Every jsDelivr `link` in the maintained documentation is checked for an
exact version, a SHA-384 integrity value and anonymous cross-origin mode.
The release process also verifies those values against the published files.

## Self-hosting

Copy the minified file selected on [Package and builds](/package) into the
application's static assets. Keep its license and notice with your
distribution as required by the Apache 2.0 license.

```html
<link rel="stylesheet" href="/assets/cirth-0.16.0.min.css">
```

Use the asset mechanism provided by your framework when it fingerprints
filenames. Avoid copying from `src/`: the supported consumer artifact is
the compiled file from the npm package.

## Caching

An exact version or content-hashed URL can use a long immutable lifetime:

```http
Cache-Control: public, max-age=31536000, immutable
```

Change the URL when the bytes change. HTML should then point to the new URL.
If a path is intentionally stable and overwritten, use a revalidation policy
instead of `immutable`.

## Compression

The sizes reported by the project are compressed measurements, not the raw
file size. The current default build is
**{{ proof.size.label if proof.size else "about 15 KB" }} with gzip** and
**{{ proof.size.brotliLabel if proof.size else "about 13 KB" }} with
Brotli** in the documentation build.

Check the actual response from your host:

```sh
curl -s -o /dev/null -D - -H 'Accept-Encoding: br, gzip' \
  https://example.com/assets/cirth.min.css
```

Look for `Content-Encoding: br` or `Content-Encoding: gzip`. Also confirm
`Content-Type: text/css` and `Vary: Accept-Encoding` when the server can
return different encodings.

If the application bundles Cirth with other CSS, measure and precompress the
final bundle. Precompressing the standalone Cirth file does not help when
that file is never served.

## Content Security Policy

A Content Security Policy can restrict which origins may provide
stylesheets. Add the chosen CDN origin to the policy only if the application
uses that CDN. A same-origin file normally fits a stricter `style-src`
policy, although the exact directive depends on the rest of the application.

SRI and Content Security Policy solve different problems. SRI checks file
bytes; the policy controls which sources the page may load.

## Deployment checklist

- Load exactly one screen build.
- Pin an immutable URL.
- Keep the CDN version and SRI digest together.
- Match the print file to the selected screen build.
- Load a preset after the screen build.
- Confirm the production response's status, content type, cache policy and
  compression.
- Repeat the [visual verification](/installation/#verify-that-cirth-is-active)
  from the deployed application.
