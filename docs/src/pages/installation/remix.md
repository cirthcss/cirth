---
layout: docs.njk
framework: remix
description: Use Cirth in a Remix 3 app. Serve the stylesheet from public/ with staticFiles() and link it in the document, rather than through the asset server.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

Remix 3 serves files two ways: `staticFiles()` hands out `public/` as it is,
and the asset server compiles what is under `app/`. Cirth is a finished
file, so it belongs in `public/`. Through the asset server, Remix 3.0.0 loses
the repeated `data:` icons in Cirth's dark-scheme rules, and they 404.

## 1. Install

{{ packageManagers("remix") }}

## 2. Put it in public/

```sh
mkdir -p public/css
cp node_modules/@cirthcss/cirth/dist/cirth.min.css public/css/
```

The generated router already serves `public/` with `staticFiles()`. Copy the
file again when you update the package, or use the [CDN link](/installation/#cdn).

## 3. Link it

In `app/actions/document.tsx`, in the document's `<head>`:

```tsx
<head>
  <meta charSet="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="/css/cirth.min.css" />
  <title>{title}</title>
</head>
```

Components render ordinary elements with `class`, which Cirth styles. Rules
written with `css()` live in Remix's own layer and stay after Cirth's.

## 4. Check it

{{ checkIt() }}

Open a `<select>` or a search field inside the dark subtree too: its icon
shows. If the stylesheet came through the asset server, it would be missing.

{{ nextSteps("in a stylesheet linked after Cirth") }}
