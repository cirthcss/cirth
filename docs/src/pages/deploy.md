---
layout: docs.njk
---

# Deploy

Cirth is one static stylesheet. This page is about how that file reaches a
browser: which path it travels, how many bytes arrive, and what your server
has to say about it. None of it changes the CSS, and none of it is required
to use Cirth — the snippet in [Get Started](/get-started) works as it
stands.

## Where the file comes from

### A CDN

The [Get Started](/get-started#cdn) snippet points at jsDelivr. Nothing to
build and nothing to host, and the file is probably already cached at an
edge near your visitor.

What it costs is a second connection. The stylesheet lives on another
origin, so the browser resolves a new hostname, opens a new TCP connection
and completes a new TLS handshake before the first byte of CSS arrives — and
a stylesheet in the `<head>` blocks rendering until it does. That setup is
usually worth more milliseconds than any compression choice further down
this page will win back.

### Your own origin

Serving Cirth from the same origin as your HTML skips all of that. The
connection is already open and warmed by the document request, so the
stylesheet is a request on a connection that exists rather than a new one.

It also puts compression under your control, which is the rest of this
page.

## Compression

The sizes quoted across this site are gzip: the default build is
**{{ proof.size.label }}**, measured from `dist/cirth.min.css` on the build
this site was made from. Gzip is the figure because it is what ordinary
hosting sends without being asked.

### Check what your delivery actually sends

Whatever a compression figure says, the number that matters is the one your
host puts on the wire. Ask it:

```sh
curl -s -o /dev/null -D - -H 'Accept-Encoding: br, gzip' \
  https://example.com/cirth.min.css \
  | grep -i 'content-encoding\|content-length'
```

That makes a real request and throws the body away. A `HEAD` request is
shorter to type, but some origins skip compression for it and report the
uncompressed length, which is the one number you are not asking about.

Two answers are worth expecting. Some hosts never negotiate Brotli at all
and reply `content-encoding: gzip` whatever you ask for. Others do negotiate
it, but compress on the fly, which trades ratio for encoder speed — no CDN
can afford to spend a second per file.

That second case has a result people rarely expect: at a low enough quality
setting, Brotli output can land *above* the same file's gzip, so a browser
that advertises Brotli downloads more than one that does not. Brotli is not
automatically the smaller answer. On a path you do not control, measure it.

### Precompress, if you serve the file yourself

Compression at maximum quality is only affordable when it happens once, at
deploy time, rather than per request. If you host the file, do it there:

```sh
brotli -k -q 11 cirth.min.css     # writes cirth.min.css.br
```

That brings the default build to **{{ proof.size.brotliLabel }}**. The same
step suits every stylesheet you ship, so in practice Cirth is one more input
to a precompression pass you already run for your own CSS and JavaScript.

Servers with static-precompression support find the neighbouring file on
their own and set the response headers for you:

```nginx
# nginx, with the ngx_brotli module
brotli_static on;
gzip_static on;
```

Caddy does the same with `precompressed br gzip` inside its `file_server`
block. Apache has no equivalent switch: there you rewrite onto the `.br`
file and set the response headers yourself — the three listed below.

**Keep the `.css` URL in your markup.** A `.br` file is an HTTP
representation, not a stylesheet. Linking it directly hands the browser
compressed bytes with no `Content-Encoding` header to explain them, and the
page loads unstyled. If you are wiring the negotiation by hand rather than
with one of the servers above, the response to the `.css` request needs all
three of:

```http
Content-Encoding: br
Content-Type: text/css
Vary: Accept-Encoding
```

`Vary` is the one that is easy to forget and the one that breaks other
people: without it a shared cache can hand compressed bytes to a client that
never asked for them.

### If you bundle Cirth with your own CSS

A bundler concatenates Cirth into an output file of its own, so a
precompressed copy of `cirth.min.css` no longer describes anything you
serve. Precompress the bundler's output instead, and let Cirth be an input
like any other.

Bundling also decides cascade order. [Customization](/customization#cascade-layers)
covers how the `cirth` layer sorts against your own.

## What a smaller stylesheet actually buys

Around 14 KiB is the figure people quote, and it is worth understanding
rather than aiming at.

It approximates the
[initial congestion window](https://datatracker.ietf.org/doc/html/rfc6928)
that TCP and [QUIC](https://www.rfc-editor.org/rfc/rfc9002.html#section-7.2)
use for a new connection: the data a server may send before it has to stop
and wait for the client's first acknowledgment. A response that fits inside
that first flight saves a round trip of waiting.

Three things stop that from being a line you can design against.

**The window belongs to the connection, not to your stylesheet.** On a
connection that has already carried the HTML document it has grown past its
initial size, so by the time the stylesheet is requested the threshold has
moved.

**A cross-origin stylesheet never gets a warm connection.** It pays DNS, TCP
and TLS first, and that setup costs more than the round trip the threshold
is about. Trimming bytes to cross a line you are already paying past several
times over is the wrong lever; moving the file to your own origin is the
right one.

**The first flight is usually spent on the document.** The HTML is fetched
before the browser knows the stylesheet exists, so it is the response that
actually competes for that first window.

None of which makes a smaller stylesheet worthless — fewer bytes are fewer
bytes on a slow link, and the budgets in
[`check-css-size.js`](https://github.com/cirthcss/cirth/blob/master/scripts/check-css-size.js)
exist so growth is noticed. It makes the threshold a reason the project
keeps Cirth small rather than a promise about any one request.
[About](/about#why-it-is-a-guard-and-not-a-promise) covers why that number
is a per-bundle regression guard and not a ceiling.

## Caching

A version-pinned URL names bytes that will never change, so it can be cached
for as long as you like:

```http
Cache-Control: public, max-age=31536000, immutable
```

That applies to a CDN URL with an exact version in it, and to a self-hosted
copy under a versioned or content-hashed path. It does **not** apply to a
URL that tracks a moving target, such as a version range or a file you
overwrite on each deploy: cache one of those for a year and you have no way
to ship a fix.

## Integrity

The CDN snippet in [Get Started](/get-started#cdn) carries a Subresource
Integrity hash, and it is worth keeping. The digest is taken over the
decoded stylesheet, not over the transferred bytes, so it is unaffected by
whether the response arrives gzipped, Brotli-compressed or plain — but it is
tied to the exact version in the URL. Change the version and take that
release's hash with it.

## The print stylesheet

Print styling ships as a separate file that no screen request needs. Loading
it is a deliberate step, and [Print](/utilities/print) covers which sheet
pairs with which build and what happens if you skip it.

## Next steps

* [Get Started](/get-started): the install snippets and the four builds.
* [Customization](/customization): the custom property surface and cascade
  layers.
* [About Cirth](/about): what the size budget is a budget for.
