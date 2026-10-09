---
layout: docs.njk
framework: slim
description: Use Cirth in a Slim 4 app. Put the file in public/css and link it from a PHP-View layout; Slim has no asset pipeline to configure.
---

Slim has no view layer and no asset pipeline of its own: a route returns a
response, and the web server serves `public/` as it is. Cirth is one file
there, linked from a template rendered with PHP-View, the template
renderer Slim documents alongside Twig-View.

## 1. Create the project

```sh
composer create-project slim/slim-skeleton my-app
cd my-app
composer require slim/php-view
```

On PHP 8.4 or later, also run `composer require php-di/php-di:^7 -W`. The
skeleton's PHP-DI 6 prints deprecation notices when errors are displayed,
and anything printed before `<!doctype html>` puts the page in quirks mode,
which no stylesheet can undo.

## 2. Add the file

```sh
mkdir -p public/css
curl -o public/css/cirth.min.css \
  https://cdn.jsdelivr.net/npm/@cirthcss/cirth@{{ release.version }}/dist/cirth.min.css
```

## 3. Link it

Create `templates/layout.php`. PHP-View renders every template inside it,
as `$content`:

```php
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= htmlspecialchars($title, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></title>
    <link rel="stylesheet" href="/css/cirth.min.css">
  </head>
  <body>
    <main class="container">
      <?= $content ?>
    </main>
  </body>
</html>
```

## 4. Render a page

`templates/subscribe.php`:

```php
<article>
  <header><h1>Hello, <?= htmlspecialchars($name, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></h1></header>
  <form method="post" action="/subscribe">
    <label>
      Email
      <input type="email" name="email" required>
    </label>
    <button type="submit">Subscribe</button>
  </form>
</article>

<section data-theme="dark">
  <article>
    <p>Dark, whatever the system scheme is.</p>
  </article>
</section>
```

In `app/routes.php`, the home route renders it in the layout:

```php
use Slim\Views\PhpRenderer;

$app->get('/', function (Request $request, Response $response) {
    $renderer = new PhpRenderer(__DIR__ . '/../templates', ['title' => 'Subscribe'], 'layout.php');

    return $renderer->render($response, 'subscribe.php', ['name' => 'Slim']);
});
```

## 5. Run it in production mode

Set `displayErrorDetails` to `false` in `app/settings.php`, install without
the development packages and serve `public/`:

```sh
composer install --no-dev --optimize-autoloader
php -S localhost:8080 -t public
```

PHP's built-in server is for trying the app; in production, Slim's
[web servers page](https://www.slimframework.com/docs/v4/start/web-servers.html)
shows Apache, nginx and others with `public/` as the document root.

## 6. Check it

Open `http://localhost:8080` with the system in light mode, then in dark
mode. The page follows the system, and the section with
`data-theme="dark"` stays dark both times.

{% from "guide.njk" import nextSteps %}{{ nextSteps("in a stylesheet linked after Cirth") }}
