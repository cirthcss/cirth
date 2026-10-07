---
layout: docs.njk
framework: dioxus
description: Use Cirth in a Dioxus web app. Declare it with asset!() and minification off, and link it with document::Stylesheet.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

# Dioxus

Dioxus collects assets with the `asset!()` macro and, in a release bundle,
minifies CSS for older browsers than Cirth supports, rewriting its
`light-dark()` colours. Cirth is already minified: turn that step off for it.

## 1. Add the file

```sh
mkdir -p assets
curl -o assets/cirth.min.css \
  https://cdn.jsdelivr.net/npm/@cirthcss/cirth@{{ release.version }}/dist/cirth.min.css
```

## 2. Link it

In `src/main.rs`:

```rust
use dioxus::prelude::*;

const CIRTH: Asset = asset!("/assets/cirth.min.css", AssetOptions::css().with_minify(false));

fn main() {
    dioxus::launch(App);
}

#[component]
fn App() -> Element {
    rsx! {
        document::Stylesheet { href: CIRTH }
        main { class: "container",
            article {
                h1 { "Hello, Dioxus" }
                button { r#type: "button", "Save" }
            }
        }
    }
}
```

With `with_minify(false)`, `dx bundle --release` copies the file byte for
byte under a hashed name. Without it, the page still follows the system
scheme, but a `data-theme` subtree stops changing colour.

## 3. Check it

{{ checkIt(true, "check that minification is off for it") }}

{{ nextSteps("in a second asset!() linked after Cirth") }}
