---
layout: docs.njk
framework: htmx
description: Use Cirth with htmx. Link it once in the page htmx swaps into; every fragment the server returns is styled on arrival.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

# htmx

htmx asks the server for HTML and swaps it into the page. Cirth styles
elements, not components, so a fragment needs nothing: link the stylesheet
once, in the page, and whatever arrives is styled.

## 1. Link it

In the layout the server renders, next to htmx:

```html
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="/css/cirth.min.css">
  <script src="/js/htmx.min.js" defer></script>
</head>
```

Serve the file the way your backend serves static files (see its guide, or
the [CDN link](/installation/#cdn)). With `hx-boost`, htmx swaps the body and
keeps the head, so the stylesheet loads once for the whole visit.

## 2. Return plain fragments

A fragment is ordinary HTML, with the states Cirth reads written as
attributes:

```html
<article>
  <header>Subscribed</header>
  <label>
    Email
    <input type="email" name="email" aria-invalid="true" aria-describedby="email-error">
  </label>
  <small id="email-error">That address bounced.</small>
</article>
```

An element with `class="htmx-indicator"` and `aria-busy="true"` is Cirth's
spinner, and htmx shows it only while a request is in flight.

## 3. Check it

{{ checkIt() }}

Swap the same markup in with `hx-get`: it arrives styled.

{{ nextSteps() }}
