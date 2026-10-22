---
layout: docs.njk
framework: elysia
description: Use Cirth with Elysia on Bun. Serve the package's dist folder with the static plugin and link it from your pages.
---
{% from "guide.njk" import checkIt, nextSteps %}

Elysia serves files with its static plugin. Cirth's package is a folder of
finished CSS, so the server can expose that folder from `node_modules` at a
public URL. A `<link>` in the returned document loads it for the whole page.

## 1. Install

```sh
bun add @cirthcss/cirth @elysiajs/static
```

## 2. Serve it and link it

```ts
import { Elysia } from "elysia";
import { staticPlugin } from "@elysiajs/static";

const page = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="/cirth/cirth.min.css">
    <title>Elysia</title>
  </head>
  <body>
    <main class="container"><h1>Hello, Elysia</h1></main>
  </body>
</html>`;

new Elysia()
  .use(staticPlugin({ assets: "node_modules/@cirthcss/cirth/dist", prefix: "/cirth" }))
  .get("/", ({ set }) => {
    set.headers["content-type"] = "text/html; charset=utf-8";
    return page;
  })
  .listen(3000);
```

The plugin sends the file as `text/css`, unchanged. A JSX or template
plugin writes the same `<link>`.

## 3. Check it

{{ checkIt() }}

{{ nextSteps() }}
