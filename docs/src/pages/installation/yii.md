---
layout: docs.njk
framework: yii
description: Use Cirth in a Yii 2 app. Put the file in web/css and list it in AppAsset in place of Bootstrap, before the app's own stylesheet.
---
{% from "guide.njk" import nextSteps %}

A new Yii 2 app links its stylesheets through `AppAsset`, an asset bundle,
and is built on Bootstrap 5. An asset bundle tells the shared layout which
files to place in the document head. Cirth takes Bootstrap's place there,
ahead of the app's own stylesheet.

## 1. Create the project

```sh
composer create-project --prefer-dist yiisoft/yii2-app-basic my-app
cd my-app
```

## 2. Add the file

```sh
curl -o web/css/cirth.min.css \
  https://cdn.jsdelivr.net/npm/@cirthcss/cirth@{{ release.version }}/dist/cirth.min.css
```

`web/` is the app's web root. A bundle whose `basePath` is `@webroot`
links files where they are, so nothing is copied or processed on the way.

## 3. List it in AppAsset

In `assets/AppAsset.php`, put Cirth first and drop the Bootstrap
dependency and the starter's script, which only switches Bootstrap's own
colour mode:

```php
<?php

namespace app\assets;

use yii\web\AssetBundle;
use yii\web\YiiAsset;

class AppAsset extends AssetBundle
{
    public $basePath = '@webroot';
    public $baseUrl = '@web';
    public $css = [
        'css/cirth.min.css',
        'css/site.css',
    ];
    public $depends = [
        YiiAsset::class,
    ];
}
```

The order of `$css` is the order of the `<link>` elements, so `site.css`
comes after Cirth and can override `--cirth-*` properties. Empty it first:
the starter's rules are written for Bootstrap's layout and its variables.

## 4. Write the layout and a view

The starter's layout draws Bootstrap's navbar and breadcrumbs widgets, and
those register Bootstrap's assets again. Replace `views/layouts/main.php`
with plain HTML:

```php
<?php

use app\assets\AppAsset;
use yii\helpers\Html;

AppAsset::register($this);
?>
<?php $this->beginPage() ?>
<!doctype html>
<html lang="<?= Yii::$app->language ?>">
<head>
    <meta charset="<?= Yii::$app->charset ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php $this->registerCsrfMetaTags() ?>
    <title><?= Html::encode($this->title) ?></title>
    <?php $this->head() ?>
</head>
<body>
<?php $this->beginBody() ?>
<main class="container">
    <?= $content ?>
</main>
<?php $this->endBody() ?>
</body>
</html>
<?php $this->endPage() ?>
```

and give `views/site/index.php` some content:

```php
<?php

use yii\helpers\Html;

$this->title = 'Subscribe';
?>
<article>
    <header><h1>Hello, Yii</h1></header>
    <?= Html::beginForm(['site/contact']) ?>
        <label>
            Email
            <?= Html::input('email', 'email', '', ['required' => true]) ?>
        </label>
        <?= Html::submitButton('Subscribe') ?>
    <?= Html::endForm() ?>
</article>

<section data-theme="dark">
    <article>
        <p>Dark, whatever the system scheme is.</p>
    </article>
</section>
```

## 5. Run it in production mode

Comment out the two lines in `web/index.php` that turn on `YII_DEBUG` and
the `dev` environment, then install without the development packages and
serve `web/`:

```sh
composer install --no-dev --optimize-autoloader
php -S localhost:8080 -t web
```

`php yii serve` does the same during development, with the development
packages installed. In production, point the web server's document root at
`web/`.

## 6. Check it

Open `http://localhost:8080` with the system in light mode, then in dark
mode. The page source links `css/cirth.min.css`, then `css/site.css`, and
no Bootstrap; the page follows the system, and the section with
`data-theme="dark"` stays dark both times.

{{ nextSteps("in web/css/site.css") }}
