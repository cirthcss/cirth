---
layout: docs.njk
framework: lit
description: Use Cirth in Lit components. A document stylesheet does not reach a shadow root, so each component adopts Cirth in its static styles.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

# Lit

A Lit component renders into a shadow root, and a stylesheet in the document
does not reach inside one. Cirth goes into the component's own `styles`,
imported as text and adopted there.

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

A shadow root takes its scheme from the system, not from the page around
it: a `data-theme` on an ancestor, or on the component's own element, does
not reach Cirth inside it. To force a scheme, put the attribute on an
element in the component's template:

```js
render() {
  return html`
    <section data-theme="dark">
      <article><p>Dark, whatever the system scheme is.</p></article>
    </section>
  `;
}
```

Build for production: that article is dark on a light page. If it is not,
check the CSS target above.

{{ nextSteps("in the component's own css after Cirth's, or as custom properties set on its element") }}
