---
layout: docs.njk
framework: blazor
description: Use Cirth in a Blazor Web App. Put the file in wwwroot and link it through @Assets in App.razor, in place of Bootstrap.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

A Blazor Web App links its stylesheets in `Components/App.razor`, through
`@Assets`, which resolves each path to its fingerprinted name. Cirth is one
file in `wwwroot/` and one `<link>`, in place of the template's Bootstrap.

## 1. Add the file

```sh
mkdir -p wwwroot/css
curl -o wwwroot/css/cirth.min.css \
  https://cdn.jsdelivr.net/npm/@cirthcss/cirth@{{ release.version }}/dist/cirth.min.css
```

## 2. Link it

In `Components/App.razor`:

```html
<link rel="stylesheet" href="@Assets["css/cirth.min.css"]" />
<link rel="stylesheet" href="@Assets["app.css"]" />
<link rel="stylesheet" href="@Assets["BlazorApp.styles.css"]" />
```

The last line is the template's bundle of scoped component styles, named
after the project; keep yours as it is.

## 3. Write components

Components render ordinary elements, and markup an interactive component
adds later is styled the same way:

```razor
@page "/"
@rendermode InteractiveServer

<button type="button" @onclick="() => count++">Count @count</button>

@if (count > 0)
{
    <article><p>Rendered after @count clicks.</p></article>
}

@code {
    private int count;
}
```

## 4. Check it

{{ checkIt() }}

{{ nextSteps("in app.css") }}
