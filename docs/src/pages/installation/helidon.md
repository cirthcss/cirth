---
layout: docs.njk
framework: helidon
description: Use Cirth in a Helidon SE app. Serve the file with Helidon's static content feature and answer HTML from a route. No Node.js.
---
{% from "guide.njk" import nextSteps %}

Helidon SE is a set of libraries around a web server, not a template
engine: a route writes whatever HTML the app renders, and the static
content feature exposes files stored in the application's classpath. Cirth
is one of those files, linked in the document head returned by the route.
Nothing here needs Node.js.

## 1. Create the project

With the Helidon CLI, or the [project starter](https://helidon.io/starter)
on helidon.io, create an SE quickstart:

```sh
helidon init --batch -Dflavor=se -Dapp-type=quickstart
cd quickstart-se
```

Helidon 27 builds for Java 27.

## 2. Add the static content module

In `pom.xml`, beside `helidon-webserver`:

```xml
<dependency>
  <groupId>io.helidon.webserver</groupId>
  <artifactId>helidon-webserver-static-content</artifactId>
</dependency>
```

## 3. Add the file

```sh
mkdir -p src/main/resources/static/css
curl -o src/main/resources/static/css/cirth.min.css \
  https://cdn.jsdelivr.net/npm/@cirthcss/cirth@{{ release.version }}/dist/cirth.min.css
```

If the project already uses npm, copy
`node_modules/@cirthcss/cirth/dist/cirth.min.css` to the same place.

## 4. Serve it, and answer HTML

In `Main.java`, register the classpath folder as static content under
`/static`, and add a route that sends a page as `text/html`:

```java
import io.helidon.common.media.type.MediaTypes;
import io.helidon.webserver.staticcontent.StaticContentFeature;

WebServer server = WebServer.builder()
        .config(config.get("server"))
        .addFeature(StaticContentFeature.builder()
                .addClasspath(cl -> cl.location("/static").context("/static"))
                .build())
        .routing(Main::routing)
        .build()
        .start();

static void routing(HttpRouting.Builder routing) {
    routing.get("/", (req, res) -> {
        res.headers().contentType(MediaTypes.TEXT_HTML);
        res.send(PAGE);
    });
}
```

`PAGE` is the document, here a text block; in an app it is whatever your
code renders:

```java
private static final String PAGE = """
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Subscribe</title>
            <link rel="stylesheet" href="/static/css/cirth.min.css">
          </head>
          <body>
            <main class="container">
              <article>
                <header><h1>Hello, Helidon</h1></header>
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
        """;
```

## 5. Build for production

```sh
mvn package
java -jar target/quickstart-se.jar
```

## 6. Check it

Open `http://localhost:8080` with the system in light mode, then in dark
mode. The page arrives as `text/html`, the stylesheet as `text/css`, the
page follows the system, and the section with `data-theme="dark"` stays
dark both times.

{{ nextSteps("in a stylesheet in the same static folder, linked after Cirth") }}
