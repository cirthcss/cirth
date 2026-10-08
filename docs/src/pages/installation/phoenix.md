---
layout: docs.njk
framework: phoenix
description: Use Cirth in a Phoenix application. Install it into assets with npm, import it from app.js so esbuild bundles it, and link the result from the root layout.
---

A new Phoenix application builds its CSS with Tailwind and daisyUI, and its
JavaScript with esbuild. Without Tailwind, esbuild bundles CSS too, so Cirth
is one import in `app.js` and one link in the root layout.

## 1. Start without Tailwind

Generate the application with `--no-tailwind`:

```sh
mix phx.new my_app --no-tailwind
```

In an existing application, remove Tailwind's configuration, dependency and
build steps as Phoenix's
[asset management guide](https://hexdocs.pm/phoenix/asset_management.html)
describes.

## 2. Install

From the project root, into `assets/`, where esbuild resolves packages:

```sh
npm install @cirthcss/cirth --prefix assets
```

## 3. Import it

At the top of `assets/js/app.js`:

```js
import "@cirthcss/cirth";
```

esbuild writes every stylesheet that `app.js` imports to a separate file
beside the script: `priv/static/assets/js/app.css`.

## 4. Link it

In `lib/my_app_web/components/layouts/root.html.heex`, link that file in
place of `default.css`, the daisyUI styles a project made without Tailwind
ships so that its generated components are not unstyled:

```heex
<link phx-track-static rel="stylesheet" href={~p"/assets/js/app.css"} />
```

`default.css` itself can then be deleted. esbuild keeps Cirth's
`light-dark()` colours as they are, so there is no CSS target to set.

## 5. Write HTML

HEEx templates render ordinary elements:

```heex
<main class="container">
  <article>
    <header><h1>Hello, Phoenix</h1></header>
    <label>
      Email
      <input type="email" name="email" required />
    </label>
    <footer><button type="submit">Subscribe</button></footer>
  </article>
</main>
```
