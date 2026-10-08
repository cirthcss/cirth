---
layout: docs.njk
framework: flask
description: Use Cirth in a Flask app. Put the file in static/ and link it from the base template with url_for.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

Flask serves the `static/` folder next to your app as it is. Cirth is one
file there, linked from the base template.

## 1. Add the file

```sh
mkdir -p static/css
curl -o static/css/cirth.min.css \
  https://cdn.jsdelivr.net/npm/@cirthcss/cirth@{{ release.version }}/dist/cirth.min.css
```

## 2. Link it

In `templates/base.html`:

```html
{% raw %}<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="{{ url_for('static', filename='css/cirth.min.css') }}">
    <title>{% block title %}My site{% endblock %}</title>
  </head>
  <body>
    <main class="container">{% block content %}{% endblock %}</main>
  </body>
</html>{% endraw %}
```

In production, let the web server in front of Flask serve `static/`
directly, with a long cache lifetime and the version in the file name or
query string.

## 3. Check it

{{ checkIt() }}

{{ nextSteps("in a stylesheet linked after Cirth") }}
