---
layout: docs.njk
framework: ktor
description: Use Cirth in a Ktor server. Serve the file with staticResources() and write the page with the HTML DSL. No Node.js.
---
{% from "guide.njk" import nextSteps %}

Ktor writes HTML with its HTML DSL, Kotlin code that builds the document,
and exposes classpath resources at public URLs with `staticResources()`.
Cirth is one of those files. The HTML DSL places its link in the document
head, where it applies across the page. No template engine or npm step is
needed.

## 1. Create the project

On the [Ktor project generator](https://start.ktor.io), add the
**HTML DSL** and **Static Content** plugins, keep Gradle, and download the
project.

## 2. Add the file

```sh
mkdir -p src/main/resources/static/css
curl -o src/main/resources/static/css/cirth.min.css \
  https://cdn.jsdelivr.net/npm/@cirthcss/cirth@{{ release.version }}/dist/cirth.min.css
```

The generator puts a sample `index.html` in `static/`; delete it. If the
project already uses npm, copy `node_modules/@cirthcss/cirth/dist/cirth.min.css`
to the same place.

## 3. Serve it, and write the page

In `src/main/kotlin/Routing.kt`:

```kotlin
package com.example

import io.ktor.server.application.*
import io.ktor.server.html.*
import io.ktor.server.http.content.*
import io.ktor.server.routing.*
import kotlinx.html.*

fun Application.configureRouting() {
    routing {
        staticResources("/static", "static")
        get("/") {
            call.respondHtml {
                lang = "en"
                head {
                    meta(charset = "utf-8")
                    meta(name = "viewport", content = "width=device-width, initial-scale=1")
                    title("Subscribe")
                    link(rel = "stylesheet", href = "/static/css/cirth.min.css")
                }
                body {
                    main(classes = "container") {
                        article {
                            header { h1 { +"Hello, Ktor" } }
                            form(action = "/subscribe", method = FormMethod.post) {
                                label {
                                    +"Email"
                                    input(type = InputType.email, name = "email") { required = true }
                                }
                                button(type = ButtonType.submit) { +"Subscribe" }
                            }
                        }
                        section {
                            attributes["data-theme"] = "dark"
                            article {
                                p { +"Dark, whatever the system scheme is." }
                            }
                        }
                    }
                }
            }
        }
    }
}
```

`respondHtml` sends the document as `text/html`, with its doctype.

## 4. Build for production

The Ktor Gradle plugin packs the server and its dependencies into one jar:

```sh
./gradlew buildFatJar
java -jar build/libs/cirth-ktor-all.jar
```

## 5. Check it

Open `http://localhost:8080` with the system in light mode, then in dark
mode. The page follows the system, and the section with
`data-theme="dark"` stays dark both times.

{{ nextSteps("in a stylesheet in static/css, linked after Cirth") }}
