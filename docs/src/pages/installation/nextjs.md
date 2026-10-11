---
layout: docs.njk
framework: nextjs
description: Use Cirth in a Next.js App Router project. Import it in the root layout and give the project a browserslist that matches Cirth's.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

In the App Router, global CSS is imported from the root layout. Cirth is one
import there, plus a browser list so Next does not rewrite its colours.

## 1. Install

{{ packageManagers("nextjs") }}

## 2. Import it

At the top of `app/layout.js` (or `layout.tsx`):

```jsx
import "@cirthcss/cirth";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

Drop the starter's `globals.css` import, or keep it after Cirth's for your
own rules.

## 3. Declare Cirth's browsers

{{ whyTarget("Next.js") }}

Next.js reads this `browserslist` from `package.json`:

```json
{
  "browserslist": [
    "chrome >= 123",
    "edge >= 123",
    "firefox >= 130",
    "safari >= 18.2",
    "ios_saf >= 18.2"
  ]
}
```

## 4. Write HTML

Server and client components render ordinary elements, and Cirth styles
them:

```jsx
export default function Page() {
  return (
    <main className="container">
      <article>
        <header><h1>Hello, Next.js</h1></header>
        <p>Rendered on the server, styled by one stylesheet.</p>
        <footer><a href="/docs" role="button">Read the docs</a></footer>
      </article>
    </main>
  );
}
```

## 5. Check it

{{ checkIt(true, "check the browserslist above") }}

{{ nextSteps("in a global stylesheet imported after Cirth") }}
