---
layout: docs.njk
framework: livewire
description: Use Cirth with Livewire. Load it through Laravel's Vite build; Livewire's updates morph markup into a page that already has it.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

Livewire renders components on the server and morphs their new HTML into
the page. The stylesheet is the Laravel app's, loaded once by `@vite`, so
Cirth comes from the [Laravel guide](/installation/laravel) and Livewire needs
nothing more.

## 1. Set up Laravel

Follow the [Laravel guide](/installation/laravel): Cirth imported in
`resources/css/app.css` and Vite's CSS target set.

## 2. Load it in the layout Livewire uses

The layout a full-page component renders into, and any page that embeds a
component, loads the build:

```blade
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
```

Livewire injects its own small stylesheet and script; they style nothing
Cirth does.

## 3. Write components

A component renders ordinary elements, and markup it adds on an update is
styled on arrival:

```blade
<div>
    <button type="button" wire:click="increment">Add one</button>
    <output>{% raw %}{{ $count }}{% endraw %}</output>
    @if ($count > 0)
        <article><p>Added {% raw %}{{ $count }}{% endraw %} times.</p></article>
    @endif
</div>
```

## 4. Check it

{{ checkIt(true, "check the CSS target in the Laravel guide") }}

{{ nextSteps("after the @import in resources/css/app.css") }}
