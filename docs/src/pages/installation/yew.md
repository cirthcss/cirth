---
layout: docs.njk
framework: yew
description: Use Cirth in a Yew application built with Trunk. Add the stylesheet to the project and link it from index.html with a Trunk css asset.
---

# Yew

Trunk builds a Yew application from its `index.html`, and copies every
stylesheet that file links. Cirth is one file in the project and one
`<link>`.

## 1. Add the file

Put the default build next to your `index.html`, for example in `styles/`:

```sh
mkdir -p styles
curl -o styles/cirth.min.css \
  https://cdn.jsdelivr.net/npm/@cirthcss/cirth@{{ release.version }}/dist/cirth.min.css
```

## 2. Link it

In `index.html`, a `data-trunk` link with `rel="css"`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Hello, Yew</title>
    <link data-trunk rel="css" href="styles/cirth.min.css">
  </head>
  <body></body>
</html>
```

Trunk copies the file to `dist/` under a hashed name, unchanged, and adds an
`integrity` hash to the link it writes. Its optional `--minify` reformats the
file and keeps Cirth's `light-dark()` colours, so there is no CSS target to
set.

## 3. Write HTML

The `html!` macro renders ordinary elements:

```rust
use yew::prelude::*;

#[function_component(App)]
fn app() -> Html {
    html! {
        <main class="container">
            <article>
                <header><h1>{ "Hello, Yew" }</h1></header>
                <label>
                    { "Email" }
                    <input type="email" name="email" required=true />
                </label>
                <footer><button type="submit">{ "Subscribe" }</button></footer>
            </article>
        </main>
    }
}

fn main() {
    yew::Renderer::<App>::new().render();
}
```
