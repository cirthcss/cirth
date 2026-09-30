---
layout: docs.njk
framework: react
description: Use Cirth in a React app built with Vite. Import it once where the app mounts; React renders the HTML Cirth styles.
---
{% from "install.njk" import packageManagers %}

# React

Cirth has no React components and does not need any: the elements your
components render are what it styles. This guide uses Vite's React template;
for Next.js, see the [Next.js guide](/installation/nextjs).

## 1. Install

{{ packageManagers("react") }}

## 2. Import it

Once, in the module that mounts the app, usually `src/main.jsx`:

```jsx
import "@cirthcss/cirth";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

Remove the template's own `index.css` import if you do not want its styles
competing with Cirth's.

## 3. Set the CSS target

Vite compiles CSS for older browsers than Cirth supports and rewrites its
`light-dark()` colours, which stops a `data-theme` subtree from switching
scheme. Add the target to `vite.config.js`:

```js
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    cssTarget: ["chrome123", "edge123", "firefox130", "safari18.2"],
  },
  plugins: [react()],
});
```

## 4. Write HTML

JSX is HTML with a few renamed attributes, and Cirth styles the result:

```jsx
export default function App() {
  return (
    <main className="container">
      <article>
        <header><h1>Hello, React</h1></header>
        <label>
          Email
          <input type="email" required />
        </label>
        <footer><button type="submit">Subscribe</button></footer>
      </article>
    </main>
  );
}
```

## Choosing a build

Import `@cirthcss/cirth/classless`, `@cirthcss/cirth/scoped` or
`@cirthcss/cirth/classless/scoped` instead. The scoped build suits a React
widget mounted inside a page you do not own: wrap its root in
`className="cirth"`. See [Choose a build](/installation/#choose-a-build).

## Next

[Customization](/customization) covers the `--cirth-*` properties; a
{% raw %}`style={{ "--cirth-primary": "#2563eb" }}`{% endraw %} on an element rethemes that
subtree.

<p class="docs-verified">Checked with React 19.3.0 and Vite 8.3.1 (create-vite 9.2.1, react template) on 27 September 2026: production build, then colours compared in Chromium against the untransformed stylesheet in the light scheme, the dark scheme and a forced-dark subtree.</p>
