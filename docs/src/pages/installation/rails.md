---
layout: docs.njk
framework: rails
description: Use Cirth in a Rails app with Propshaft. Put the file in vendor/assets/stylesheets and link it before the app's own stylesheets.
---
{% from "install.njk" import packageManagers %}
{% from "guide.njk" import whyTarget, checkIt, nextSteps %}

# Rails

A new Rails app serves stylesheets with Propshaft, which copies each file
unchanged under a digest. Cirth is one vendored file and one
`stylesheet_link_tag`, before the app's own.

## 1. Add the file

```sh
mkdir -p vendor/assets/stylesheets
curl -o vendor/assets/stylesheets/cirth.min.css \
  https://cdn.jsdelivr.net/npm/@cirthcss/cirth@{{ release.version }}/dist/cirth.min.css
```

`vendor/assets` is on Propshaft's load path, and keeping Cirth out of
`app/assets/stylesheets` keeps it out of `stylesheet_link_tag :app`, which
links that folder's files in alphabetical order.

## 2. Link it

In `app/views/layouts/application.html.erb`, before the app's stylesheets:

```erb
<%= stylesheet_link_tag "cirth.min", "data-turbo-track": "reload" %>
<%= stylesheet_link_tag :app, "data-turbo-track": "reload" %>
```

`bin/rails assets:precompile` writes `cirth.min-<digest>.css`, byte for byte,
and the tag links it.

## 3. Write views

Form helpers render labels and inputs, which Cirth styles as they are:

```erb
<%= form_with model: @subscriber do |form| %>
  <%= form.label :email do %>
    Email <%= form.email_field :email, required: true %>
  <% end %>
  <%= form.submit "Subscribe" %>
<% end %>
```

With Turbo, navigations keep the head, so the stylesheet loads once. For
Stimulus controllers that set Cirth's states, see the
[Stimulus guide](/installation/stimulus).

## 4. Check it

{{ checkIt() }}

{{ nextSteps("in app/assets/stylesheets") }}
