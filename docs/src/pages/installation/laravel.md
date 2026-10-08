---
layout: docs.njk
framework: laravel
description: Use Cirth in a Laravel application. Import it in resources/css/app.css in place of Tailwind, keep Vite's CSS target at Cirth's browser floor, and load it with the @vite directive.
---
{% from "install.njk" import packageManagers %}

Laravel builds its front end with Vite, and a new application imports
Tailwind from `resources/css/app.css`. Cirth takes Tailwind's place in that
file, and Vite gets one line of configuration.

## 1. Install

{{ packageManagers("laravel") }}

A new application also installs Tailwind, which styles the same elements
from the opposite direction. Remove it:

```sh
npm uninstall tailwindcss @tailwindcss/vite
```

## 2. Import it

Replace the contents of `resources/css/app.css`, Tailwind's `@import`,
`@source` and `@theme`, with:

```css
@import "@cirthcss/cirth";
```

Rules of your own go after this line.

## 3. Configure Vite

In `vite.config.js`, remove the `tailwindcss()` plugin and its import, and
add `build.cssTarget`. Without it, Vite compiles CSS for older browsers than
Cirth supports and rewrites its `light-dark()` colours: the page still
switches between light and dark, but an element with `data-theme` that
forces the other scheme inside the page stops changing colour.

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';

export default defineConfig({
    build: {
        cssTarget: ['chrome123', 'edge123', 'firefox130', 'safari18.2'],
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: true,
            fonts: [
                bunny('Instrument Sans', {
                    weights: [400, 500, 600],
                }),
            ],
        }),
    ],
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
```

The `fonts` and `server` entries are the starter's own and can stay.

## 4. Load it in Blade

The `@vite` directive in your layout's `<head>` loads the built stylesheet,
or the development server's while `npm run dev` is running:

```blade
{% raw %}<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ $title ?? config('app.name') }}</title>
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body>
        <main class="container">
            @yield('content')
        </main>
    </body>
</html>{% endraw %}
```

## 5. Write HTML

Blade renders ordinary elements, and Cirth styles them:

```blade
{% raw %}@extends('layouts.app')

@section('content')
    <article>
        <header><h1>Hello, Laravel</h1></header>
        <form method="POST" action="/subscribe">
            @csrf
            <label>
                Email
                <input type="email" name="email" required>
            </label>
            <button type="submit">Subscribe</button>
        </form>
    </article>
@endsection{% endraw %}
```

Override `--cirth-*` properties after the `@import` in `app.css`; see
[Customization](/customization).
