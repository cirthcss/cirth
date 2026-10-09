---
layout: docs.njk
framework: micronaut
description: Use Cirth in a Micronaut app with Thymeleaf views. Put the file in the static resources, map them in application.properties, and link it from a view. No Node.js.
---

Micronaut serves static resources from the classpath once a mapping says
which paths to look up, and Micronaut Views renders Thymeleaf templates.
Cirth is one file in the resources, linked from a view. Nothing here needs
Node.js.

## 1. Create the project

On [Micronaut Launch](https://micronaut.io/launch), pick a Java application
built with Maven and add the `views-thymeleaf` feature, or with the
Micronaut CLI:

```sh
mn create-app com.example.cirth --build=maven --lang=java --features=views-thymeleaf
cd cirth
```

Micronaut 5 builds with Java 25.

## 2. Add the file

```sh
mkdir -p src/main/resources/static/css
curl -o src/main/resources/static/css/cirth.min.css \
  https://cdn.jsdelivr.net/npm/@cirthcss/cirth@{{ release.version }}/dist/cirth.min.css
```

If the project already uses npm, copy
`node_modules/@cirthcss/cirth/dist/cirth.min.css` to the same place.

## 3. Map the static resources

Micronaut looks a request up as a static resource only under a mapping. In
`src/main/resources/application.properties`:

```properties
micronaut.router.static-resources.css.mapping=/css/*.css
micronaut.router.static-resources.css.paths=classpath:static/css
```

A request for `/css/cirth.min.css` that no controller answers is then
served from `static/css` in the jar. A narrow mapping like this one keeps
every other request from searching the resources first.

## 4. Write the view

Micronaut Views looks for templates in `src/main/resources/views`.
`subscribe.html`:

```html
<!doctype html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Subscribe</title>
    <link rel="stylesheet" href="/css/cirth.min.css">
  </head>
  <body>
    <main class="container">
      <article>
        <header><h1 th:text="|Hello, ${name}|">Hello</h1></header>
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
    </main>
  </body>
</html>
```

A controller names the view and returns its model,
`src/main/java/com/example/SubscribeController.java`:

```java
package com.example;

import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;
import io.micronaut.views.View;
import java.util.Map;

@Controller
public class SubscribeController {

    @View("subscribe")
    @Get
    public Map<String, String> index() {
        return Map.of("name", "Micronaut");
    }
}
```

## 5. Build for production

```sh
./mvnw package
java -jar target/cirth-0.1.jar
```

## 6. Check it

Open `http://localhost:8080` with the system in light mode, then in dark
mode. The page follows the system, and the section with
`data-theme="dark"` stays dark both times.

{% from "guide.njk" import nextSteps %}{{ nextSteps("in a stylesheet in static/css, linked after Cirth") }}
