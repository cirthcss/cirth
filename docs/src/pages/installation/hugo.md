---
layout: docs.njk
framework: hugo
description: Use Cirth on a Hugo site. Put the file in assets/, fingerprint it with Hugo Pipes and link it with its integrity hash.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

Hugo Pipes can fingerprint a stylesheet from `assets/` and give its link a
Subresource Integrity hash. Cirth is one file there and one block in the
base template.

## 1. Add the file

```sh
mkdir -p assets/css
curl -o assets/css/cirth.min.css \
  https://cdn.jsdelivr.net/npm/@cirthcss/cirth@{{ release.version }}/dist/cirth.min.css
```

## 2. Link it

In `layouts/baseof.html` (or `layouts/_default/baseof.html` before Hugo
0.146):

```html
{% raw %}<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  {{ with resources.Get "css/cirth.min.css" | fingerprint }}
    <link rel="stylesheet" href="{{ .RelPermalink }}" integrity="{{ .Data.Integrity }}" crossorigin="anonymous">
  {{ end }}
  <title>{{ .Title }}</title>
</head>{% endraw %}
```

The file is already minified; Hugo's `minify` can be added to the pipe and
keeps Cirth's colours, but saves almost nothing.

## 3. Check it

{{ checkIt() }}

Markdown becomes the elements Cirth styles, with no shortcodes or classes.

{{ nextSteps("in a second stylesheet linked after Cirth") }}
