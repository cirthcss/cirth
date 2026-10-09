---
layout: docs.njk
framework: quarkus
description: Use Cirth in a Quarkus app with Qute templates. Put the file in META-INF/resources, link it from a template, and run the production build.
---

Quarkus serves the files in `src/main/resources/META-INF/resources` as
they are, and Qute renders the templates in `src/main/resources/templates`.
Cirth is one static file, linked from a template.

## 1. Create the project

On [code.quarkus.io](https://code.quarkus.io), pick Java 21 and the
**REST Qute** extension (`quarkus-rest-qute`), or from the command line:

```sh
curl -o app.zip "https://code.quarkus.io/d?g=org.acme&a=cirth-qute&e=rest-qute&j=21&nc=true"
unzip app.zip && cd cirth-qute
```

## 2. Add the file

```sh
mkdir -p src/main/resources/META-INF/resources/css
curl -o src/main/resources/META-INF/resources/css/cirth.min.css \
  https://cdn.jsdelivr.net/npm/@cirthcss/cirth@{{ release.version }}/dist/cirth.min.css
```

Quarkus sends static files with `Cache-Control: public, immutable` and a
day's lifetime, so put the version in the file name or path when you
upgrade, or a browser can keep the old file for a day.

## 3. Link it

Create `src/main/resources/templates/subscribe.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Subscribe</title>
    <link rel="stylesheet" href="/css/cirth.min.css">
  </head>
  <body>
    <main class="container">
      <article>
        <header><h1>Hello, {name}</h1></header>
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

## 4. Return HTML from an endpoint

The injected template takes its name from the field,
`src/main/java/org/acme/SubscribeResource.java`:

```java
package org.acme;

import io.quarkus.qute.Template;
import io.quarkus.qute.TemplateInstance;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/")
public class SubscribeResource {

    @Inject
    Template subscribe;

    @GET
    @Produces(MediaType.TEXT_HTML)
    public TemplateInstance get() {
        return subscribe.data("name", "Quarkus");
    }
}
```

## 5. Build for production

```sh
./mvnw package
java -jar target/quarkus-app/quarkus-run.jar
```

That is the production JVM build, which runs with the `prod` profile.

## 6. Check it

Open `http://localhost:8080` with the system in light mode, then in dark
mode. The page follows the system, and the section with
`data-theme="dark"` stays dark both times.

{% from "guide.njk" import nextSteps %}{{ nextSteps("in a stylesheet in META-INF/resources, linked after Cirth") }}
