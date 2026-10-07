---
layout: docs.njk
framework: django
description: Use Cirth in a Django project. Put the stylesheet in an app's static folder, link it with the static tag, and deploy it with collectstatic.
---

# Django

Django serves CSS as a static file, and nothing in its pipeline rewrites it.
Cirth goes in an app's static folder and is linked from your base template.

## 1. Add the file

Put the default build in your app's `static` directory, inside a folder
named after the app, which is how Django tells apart two apps' files with
the same name. For an app called `pages`:

```sh
mkdir -p pages/static/pages/css
curl -o pages/static/pages/css/cirth.min.css \
  https://cdn.jsdelivr.net/npm/@cirthcss/cirth@{{ release.version }}/dist/cirth.min.css
```

The app has to be in `INSTALLED_APPS`, and `django.contrib.staticfiles`
already is in a new project. If the project uses npm, copy
`node_modules/@cirthcss/cirth/dist/cirth.min.css` instead. To skip the file
altogether, put the [CDN link](/installation/#cdn) in the template.

## 2. Link it

In your base template, load the `static` tag and link the file:

```html
{% raw %}{% load static %}
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{% block title %}My site{% endblock %}</title>
    <link rel="stylesheet" href="{% static 'pages/css/cirth.min.css' %}">
  </head>
  <body>
    <main class="container">
      {% block content %}{% endblock %}
    </main>
  </body>
</html>{% endraw %}
```

Link a stylesheet of your own after it to override `--cirth-*` properties
([Customization](/customization)).

## 3. Write templates

A Django form renders labels and inputs, which Cirth styles as they are:

```html
{% raw %}{% extends "pages/base.html" %}

{% block content %}
  <article>
    <header><h1>Hello, Django</h1></header>
    <form method="post">
      {% csrf_token %}
      <label>
        Email
        <input type="email" name="email" required>
      </label>
      <button type="submit">Subscribe</button>
    </form>
  </article>
{% endblock %}{% endraw %}
```

## Deploying

`python manage.py collectstatic` copies the file into `STATIC_ROOT` with
everything else. With `ManifestStaticFilesStorage`, the copy gets a hashed
name that the `static` tag resolves, and its content stays as it was:
Cirth's icons are `data:` URLs, which the storage leaves alone. See Django's
[static files deployment guide](https://docs.djangoproject.com/en/stable/howto/static-files/deployment/).
