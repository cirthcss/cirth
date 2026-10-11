---
layout: docs.njk
framework: electron
description: "Use Cirth in an Electron app. Link it from the renderer's page, and allow data: images in the Content Security Policy so Cirth's icons load."
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import checkIt, nextSteps %}

An Electron app's renderer is the Chromium page shown inside a window. Link
Cirth in that page's `<head>`, where it applies to the whole rendered
document. The Content Security Policy also needs to allow `data:` images,
because Cirth uses them for its icons.

## 1. Install

{{ packageManagers("electron") }}

## 2. Link it

In the page the window loads, with a policy that allows `data:` images:

```html
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'self'; style-src 'self'; img-src 'self' data:">
  <link rel="stylesheet" href="./node_modules/@cirthcss/cirth/dist/cirth.min.css">
</head>
```

Without `data:` in `img-src`, the policy blocks the check of a checkbox, the
chevron of a select and every other icon, and logs each one. If the renderer
is bundled with Vite (Electron Forge's Vite template), import Cirth as in
the [Vite guide](/installation/vite) instead, and set the CSS target there.

## 3. Check it

{{ checkIt() }}

`nativeTheme.themeSource = "dark"` in the main process switches the whole
window, and Cirth with it.

{{ nextSteps() }}
