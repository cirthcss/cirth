---
layout: docs.njk
framework: lit
description: Use Cirth in Lit components. A document stylesheet does not reach a shadow root, so each component adopts Cirth in its static styles.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, nextSteps %}

A Lit component renders into a shadow root, and a stylesheet in the document
does not reach inside one. A shadow root is an isolated document subtree.
Cirth therefore goes into each component's own `styles`, imported as text
and adopted there rather than loaded as global document CSS.

## 1. Install

{{ packageManagers("lit") }}

## 2. Adopt it in the component

Import the stylesheet as a string with Vite's `?inline`, and put it first in
`static styles`, before the component's own rules:

```js
import cirth from "@cirthcss/cirth?inline";
import { LitElement, css, html, unsafeCSS } from "lit";

export class SignUp extends LitElement {
  static styles = [
    unsafeCSS(cirth),
    css`
      :host {
        display: block;
      }
    `,
  ];

  render() {
    return html`
      <article>
        <label>Email <input type="email" required></label>
        <button type="submit">Sign up</button>
      </article>
    `;
  }
}

customElements.define("sign-up", SignUp);
```

The browser parses the sheet once and shares it between every instance.
`unsafeCSS` is safe here: the text is Cirth's file, not user input.

## 3. Set the CSS target

{{ whyTarget("Vite") }}

```js
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    cssTarget: ["chrome123", "edge123", "firefox130", "safari18.2"],
  },
});
```

## 4. Check it

A shadow root takes its scheme from the system unless the component says
otherwise. A `data-theme` on the page around the component does not reach
inside, but one on the component's own element does: Cirth reads the
shadow host's attribute from within the shadow root.

```html
<order-panel data-theme="dark"></order-panel>
```

An attribute on an element in the template themes just that part:

```js
render() {
  return html`
    <section data-theme="dark">
      <article><p>Dark, whatever the system scheme is.</p></article>
    </section>
  `;
}
```

Build for production: the component is dark on a light page. If it is not,
check the CSS target above.

{{ nextSteps("in the component's own css after Cirth's, or as custom properties set on its element") }}
