---
layout: docs.njk
framework: stimulus
description: Use Cirth with Stimulus. Load the stylesheet from your build, and let controllers set the attributes Cirth already styles.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

Stimulus adds behaviour to HTML the server already rendered; it has no CSS
step of its own. Load Cirth the way your app loads stylesheets, then let
controllers change state through attributes, which is how Cirth reads it.

## 1. Install

{{ packageManagers("stimulus", "@cirthcss/cirth @hotwired/stimulus") }}

## 2. Import it

With Vite, at the top of the entry module, before the controllers:

```js
import "@cirthcss/cirth";
import { Application } from "@hotwired/stimulus";
```

Set Vite's CSS target as in the [Vite guide](/installation/vite#3-set-the-css-target).
In Rails, follow the [Rails guide](/installation/rails) instead.

## 3. Set attributes, not classes

A controller that marks a button busy while it saves:

```js
import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["button"];

  save() {
    this.buttonTarget.setAttribute("aria-busy", "true");
  }
}
```

```html
<form data-controller="save">
  <button type="submit" data-save-target="button" data-action="save#save">Save</button>
</form>
```

The same goes for `aria-invalid` on a field, `aria-expanded` on a toggle, and
`open` on a `<details>` or `<dialog>`.

## 4. Check it

{{ checkIt(true, "check the CSS target in the Vite guide") }}

{{ nextSteps("in a stylesheet imported after Cirth") }}
