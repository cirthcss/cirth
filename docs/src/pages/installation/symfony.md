---
layout: docs.njk
framework: symfony
description: Use Cirth in a Symfony app with AssetMapper. Require the stylesheet through the importmap and import it from assets/app.js.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

AssetMapper, Symfony's default for front-end assets, can bring a stylesheet
from an npm package without Node: `importmap:require` downloads it, and an
import in `assets/app.js` links it on every page that renders the importmap.

## 1. Require it

```sh
php bin/console importmap:require @cirthcss/cirth/dist/cirth.min.css
```

The file lands in `assets/vendor/`, and `importmap.php` records it with its
version.

## 2. Import it

At the top of `assets/app.js`, before the app's own stylesheet:

```js
import "@cirthcss/cirth/dist/cirth.min.css";
import "./styles/app.css";
```

The `importmap('app')` call in `templates/base.html.twig` now writes a
`<link>` for Cirth before the app's CSS. In production,
`php bin/console asset-map:compile` copies it unchanged under a digest.

## 3. Write Twig

Form themes render labels and inputs Cirth styles as they are; the default
`form_div_layout.html.twig` needs no Bootstrap theme:

```twig
{% raw %}{% extends 'base.html.twig' %}

{% block body %}
<main class="container">
  {{ form_start(form) }}
    {{ form_row(form.email) }}
    <button type="submit">Subscribe</button>
  {{ form_end(form) }}
</main>
{% endblock %}{% endraw %}
```

## 4. Check it

{{ checkIt() }}

{{ nextSteps("in assets/styles/app.css") }}
