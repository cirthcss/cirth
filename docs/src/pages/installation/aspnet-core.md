---
layout: docs.njk
framework: aspnet-core
description: Use Cirth in an ASP.NET Core app with Razor Pages or MVC. Put the file in wwwroot and link it from the layout; MapStaticAssets fingerprints it.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

# ASP.NET Core

ASP.NET Core serves `wwwroot/` as static web assets. Since .NET 9,
`MapStaticAssets` also fingerprints and compresses them, and the layout's
`~/` links resolve to the fingerprinted names. Cirth is one file there and
one `<link>`.

## 1. Add the file

```sh
mkdir -p wwwroot/css
curl -o wwwroot/css/cirth.min.css \
  https://cdn.jsdelivr.net/npm/@cirthcss/cirth@{{ release.version }}/dist/cirth.min.css
```

## 2. Link it

In `Pages/Shared/_Layout.cshtml` (or `Views/Shared/_Layout.cshtml` for MVC),
in place of the template's Bootstrap link:

```html
<link rel="stylesheet" href="~/css/cirth.min.css" />
<link rel="stylesheet" href="~/css/site.css" asp-append-version="true" />
```

The published page links `/css/cirth.min.<hash>.css`, served with a long
cache lifetime and a compressed copy beside it. The template's Bootstrap
scripts and markup classes can go too; Cirth needs neither.

## 3. Write Razor

Tag helpers render ordinary elements, and the validation helpers add the
attributes Cirth reads:

```html
<form method="post">
  <label>
    Email
    <input asp-for="Email" type="email" />
  </label>
  <button type="submit">Subscribe</button>
</form>
```

## 4. Check it

{{ checkIt() }}

{{ nextSteps("in site.css, linked after Cirth") }}
