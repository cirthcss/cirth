---
layout: docs.njk
framework: dioxus
description: Use Cirth in a Dioxus web app. Declare it with asset!() and minification off, and link it with document::Stylesheet.
---
{% from "guide.njk" import checkIt, nextSteps %}

Dioxus collects files declared with the `asset!()` macro and gives them a URL
in the finished application. `document::Stylesheet` places that URL in the
document head, so the CSS applies to the whole page. In a release bundle,
Dioxus would also rewrite Cirth's `light-dark()` colours, so disable
minification for this already minified file. [Compatibility](/compatibility)
explains why transforming the compiled stylesheet can change theme regions.

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
