---
layout: docs.njk
framework: fastapi
description: Use Cirth in a FastAPI app that renders HTML. Serve the file with StaticFiles, render pages with Jinja2Templates, and link it with url_for.
---
{% from "guide.njk" import checkIt, nextSteps %}

FastAPI is known for JSON APIs, and it renders HTML too: `Jinja2Templates`
turns a template into a response, and `StaticFiles` serves a folder as it
is. This guide is for an app that sends pages to a browser; an API that only
returns JSON has no stylesheet to link.

## 1. Install

```sh
pip install "fastapi[standard]" jinja2
```

## 2. Add the file

```sh
mkdir -p static/css templates
curl -o static/css/cirth.min.css \
  https://cdn.jsdelivr.net/npm/@cirthcss/cirth@{{ release.version }}/dist/cirth.min.css
```

## 3. Mount the files and the templates

In `main.py`:

```python
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


@app.get("/", response_class=HTMLResponse)
async def subscribe(request: Request):
    return templates.TemplateResponse(
        request=request, name="subscribe.html", context={"name": "FastAPI"}
    )
```

## 4. Link it from the base template

`templates/base.html` links the file through `url_for`, which knows where
`/static` is mounted:

```html
{% raw %}<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{% block title %}My site{% endblock %}</title>
    <link rel="stylesheet" href="{{ url_for('static', path='/css/cirth.min.css') }}">
  </head>
  <body>
    <main class="container">{% block content %}{% endblock %}</main>
  </body>
</html>{% endraw %}
```

and `templates/subscribe.html` extends it:

```html
{% raw %}{% extends "base.html" %}

{% block content %}
<article>
  <header><h1>Hello, {{ name }}</h1></header>
  <form method="post" action="/subscribe">
    <label>
      Email
      <input type="email" name="email" required>
    </label>
    <button type="submit">Subscribe</button>
  </form>
</article>
{% endblock %}{% endraw %}
```

Run it with `fastapi run main.py`; `fastapi dev main.py` reloads on every
change while you work.

## 5. Check it

{{ checkIt() }}

{{ nextSteps("in a stylesheet in static/css, linked after Cirth") }}
