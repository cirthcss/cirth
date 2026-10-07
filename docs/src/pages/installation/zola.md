---
layout: docs.njk
framework: zola
description: Use Cirth on a Zola site. Put the file in static/ and link it with get_url and a cache-busting hash.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

# Zola

Zola copies `static/` into the site unchanged, and `get_url` can add a hash
of the file to its URL. Cirth is one file there and one link.

## 1. Add the file

```sh
mkdir -p static/css
curl -o static/css/cirth.min.css \
  https://cdn.jsdelivr.net/npm/@cirthcss/cirth@{{ release.version }}/dist/cirth.min.css
```

## 2. Link it

In `templates/base.html`:

```html
{% raw %}<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="{{ get_url(path='css/cirth.min.css', cachebust=true) }}">
  <title>{{ config.title }}</title>
</head>{% endraw %}
```

Keep `compile_sass` for your own Sass if you use it; Cirth is plain CSS and
goes in `static/`.

## 3. Check it

{{ checkIt() }}

{{ nextSteps("in a stylesheet linked after Cirth") }}
