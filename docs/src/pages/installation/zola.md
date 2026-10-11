---
layout: docs.njk
framework: zola
description: Use Cirth on a Zola site. Put the file in static/ and link it with get_url and a cache-busting hash.
---
{% from "guide.njk" import checkIt, nextSteps %}

Zola copies `static/` into the published site unchanged. Its base template
supplies the document head shared by generated pages, so one Cirth link
loads the stylesheet globally. `get_url` can add a cache-busting hash to the
file's URL.

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
