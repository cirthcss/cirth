---
layout: docs.njk
framework: wordpress
description: Use Cirth in a WordPress theme. Add the stylesheet to the theme and enqueue it from functions.php with wp_enqueue_style.
---

# WordPress

A theme loads its stylesheets by enqueueing them, so WordPress can print each
one once, in order, with a version for caching. Cirth is one file in the
theme and one call in `functions.php`.

Cirth suits a classic theme, whose templates are the HTML you write. A
block theme styles its blocks through `theme.json` and its own class names;
this guide does not cover it.

## 1. Add the file

Put the default build in your theme, for example in `assets/css/`:

```sh
mkdir -p assets/css
curl -o assets/css/cirth.min.css \
  https://cdn.jsdelivr.net/npm/@cirthcss/cirth@{{ release.version }}/dist/cirth.min.css
```

## 2. Enqueue it

In the theme's `functions.php`, on the `wp_enqueue_scripts` hook:

```php
<?php
add_action( 'wp_enqueue_scripts', 'my_theme_enqueue_styles' );

function my_theme_enqueue_styles() {
	wp_enqueue_style(
		'cirth',
		get_theme_file_uri( 'assets/css/cirth.min.css' ),
		array(),
		'{{ release.version }}'
	);
}
```

The fourth argument is the version WordPress appends to the URL, so a
browser fetches the file again when you update it. Enqueue your own
stylesheet after this one, with `array( 'cirth' )` as its dependencies, to
override `--cirth-*` properties ([Customization](/customization)).

## 3. Write templates

The theme's templates call `wp_head()` in the `<head>`, which is where the
enqueued stylesheet is printed, and render ordinary elements:

```php
<!doctype html>
<html <?php language_attributes(); ?>>
	<head>
		<meta charset="<?php bloginfo( 'charset' ); ?>">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<?php wp_head(); ?>
	</head>
	<body <?php body_class(); ?>>
		<?php wp_body_open(); ?>
		<main class="container">
			<?php while ( have_posts() ) : the_post(); ?>
				<article>
					<header><h1><?php the_title(); ?></h1></header>
					<?php the_content(); ?>
				</article>
			<?php endwhile; ?>
		</main>
		<?php wp_footer(); ?>
	</body>
</html>
```

Post content is headings, paragraphs, lists, images and tables, which Cirth
styles without classes.
