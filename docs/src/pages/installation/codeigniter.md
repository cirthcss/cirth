---
layout: docs.njk
framework: codeigniter
description: Use Cirth in a CodeIgniter 4 app. Put the file in public/css, link it from a view layout with link_tag(), and serve it as a static file.
---
{% from "guide.njk" import nextSteps %}

CodeIgniter® serves `public/`, its web root, as it is. A web root is the
directory a browser can request files from. Cirth is one file there, linked
from a layout that every view extends.

## 1. Create the project

```sh
composer create-project codeigniter4/appstarter my-app
cd my-app
```

## 2. Add the file

```sh
mkdir -p public/css
curl -o public/css/cirth.min.css \
  https://cdn.jsdelivr.net/npm/@cirthcss/cirth@{{ release.version }}/dist/cirth.min.css
```

Everything in `public/` is reachable from the browser, and nothing else in
the project is. To skip the file altogether, put the
[CDN link](/installation/#cdn) in the layout.

## 3. Link it

Create `app/Views/layouts/main.php`:

```php
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= esc($title ?? 'My site') ?></title>
    <?= link_tag('css/cirth.min.css') ?>
  </head>
  <body>
    <main class="container">
      <?= $this->renderSection('content') ?>
    </main>
  </body>
</html>
```

`link_tag()` comes with the HTML helper and builds the address from
`app.baseURL`, so that has to be where the app is served (step 5). A plain
`<link rel="stylesheet" href="/css/cirth.min.css">` works as well. Link a
stylesheet of your own after Cirth's to override `--cirth-*` properties.

## 4. Write a view

`app/Views/subscribe.php` extends the layout:

```php
<?= $this->extend('layouts/main') ?>

<?= $this->section('content') ?>
<article>
  <header><h1>Hello, CodeIgniter</h1></header>
  <?= form_open('subscribe') ?>
    <label>
      Email
      <input type="email" name="email" required>
    </label>
    <button type="submit">Subscribe</button>
  <?= form_close() ?>
</article>

<section data-theme="dark">
  <article>
    <p>Dark, whatever the system scheme is.</p>
  </article>
</section>
<?= $this->endSection() ?>
```

The controller loads the HTML and form helpers and renders it, in
`app/Controllers/Home.php`:

```php
<?php

namespace App\Controllers;

class Home extends BaseController
{
    protected $helpers = ['html', 'form'];

    public function index(): string
    {
        return view('subscribe', ['title' => 'Subscribe']);
    }
}
```

## 5. Run it in production mode

Copy the starter's `env` file to `.env` and set:

```ini
CI_ENVIRONMENT = production
app.baseURL = 'http://localhost:8080/'
```

Then install without the development packages and start the server:

```sh
composer install --no-dev --optimize-autoloader
php spark serve
```

`php spark serve` is for trying the app on your machine. In production,
point the web server's document root at `public/` and give the stylesheet a
long cache lifetime, with the version in its name or query string.

## 6. Check it

Open `http://localhost:8080` with the system in light mode, then in dark
mode. The page follows the system, and the section with
`data-theme="dark"` stays dark both times. If the page has no styles at
all, `app.baseURL` points somewhere else: the link in the page source says
where.

{{ nextSteps("in a stylesheet linked after Cirth") }}
