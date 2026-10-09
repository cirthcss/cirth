---
layout: docs.njk
framework: spring-boot
description: Use Cirth in a Spring Boot app. Put the file in the static resources and link it from Thymeleaf in an executable jar, or from JSP in a WAR.
---

Spring Boot® serves anything in `src/main/resources/static` as it is,
whichever view technology renders the pages. Cirth is one file there.
Thymeleaf, in an executable jar, is the way to start; JSP needs a WAR, and
suits an existing app or a deployment to a servlet container.

## 1. Create the project

On [start.spring.io](https://start.spring.io), pick Maven, Java 21 and the
Spring Web dependency, then Thymeleaf, or packaging **War** for JSP. From
the command line, for Thymeleaf:

```sh
curl https://start.spring.io/starter.zip \
  -d type=maven-project -d javaVersion=21 \
  -d dependencies=web,thymeleaf \
  -d groupId=com.example -d artifactId=demo -o demo.zip
unzip demo.zip -d demo && cd demo
```

For JSP, ask for `-d dependencies=web -d packaging=war` instead.

## 2. Add the file

```sh
mkdir -p src/main/resources/static/css
curl -o src/main/resources/static/css/cirth.min.css \
  https://cdn.jsdelivr.net/npm/@cirthcss/cirth@{{ release.version }}/dist/cirth.min.css
```

Spring Boot serves it at `/css/cirth.min.css`, from a jar and from a WAR
alike. Nothing here needs Node.js; if the project already uses npm, copy
`node_modules/@cirthcss/cirth/dist/cirth.min.css` to the same place.

## 3. Link the stylesheet

Link it through the app's context path, so the link still holds when the
app is deployed under a path. In a Thymeleaf template:

```html
<link rel="stylesheet" th:href="@{/css/cirth.min.css}">
```

In a JSP:

```jsp
<link rel="stylesheet" href="${pageContext.request.contextPath}/css/cirth.min.css">
```

Link a stylesheet of your own after it to override `--cirth-*` properties.

## 4. Choose a view technology

| | [Thymeleaf](#thymeleaf) | [JSP](#jsp) |
| --- | --- | --- |
| Packaging | Executable jar | WAR, executable or deployed to a container |
| Templates | `src/main/resources/templates` | `src/main/webapp/WEB-INF/jsp` |
| Use it for | A new app | An existing app, or a traditional deployment |

Spring Boot's documentation is plain about the difference: JSPs are not
supported in an executable jar. With Tomcat or Jetty they work in a WAR,
and an executable WAR runs with `java -jar` and also deploys to a standard
container. The stylesheet is served the same way in both.

## 5. Check it

Build and run the app as its section below shows, then open the page with
the system in light mode and then in dark mode. The stylesheet arrives as
`/css/cirth.min.css` (or under the context path in a container), the page
follows the system, and the section with `data-theme="dark"` stays dark
both times.

## Thymeleaf

### The template

`src/main/resources/templates/subscribe.html`:

```html
<!doctype html>
<html lang="en" xmlns:th="http://www.thymeleaf.org">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Subscribe</title>
    <link rel="stylesheet" th:href="@{/css/cirth.min.css}">
  </head>
  <body>
    <main class="container">
      <article>
        <header><h1>Hello, Spring</h1></header>
        <form method="post" th:action="@{/subscribe}">
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

### The controller

`src/main/java/com/example/demo/SubscribeController.java` returns the
template's name:

```java
package com.example.demo;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SubscribeController {

	@GetMapping("/")
	public String subscribe() {
		return "subscribe";
	}
}
```

### Build and run the jar

```sh
./mvnw package
java -jar target/demo-0.0.1-SNAPSHOT.jar
```

To give the file a long cache lifetime, let Spring Boot put a content hash
in its name, in `src/main/resources/application.properties`:

```properties
spring.web.resources.chain.strategy.content.enabled=true
spring.web.resources.chain.strategy.content.paths=/**
```

`th:href` then links `/css/cirth.min-<hash>.css`, and the file behind it is
still Cirth's, byte for byte.

## JSP

### WAR packaging and Jasper

A project created with packaging War has `<packaging>war</packaging>`, a
`ServletInitializer` for deployment to a container, and Tomcat as a
`provided` dependency. Add Jasper, which compiles the JSPs, in the same
scope:

```xml
<dependency>
  <groupId>org.apache.tomcat.embed</groupId>
  <artifactId>tomcat-embed-jasper</artifactId>
  <scope>provided</scope>
</dependency>
```

and tell Spring MVC's view resolver where the views are, in
`src/main/resources/application.properties`:

```properties
spring.mvc.view.prefix=/WEB-INF/jsp/
spring.mvc.view.suffix=.jsp
```

### The view

JSPs go in the web application folder, which only a WAR packages, under
`WEB-INF` so that no browser can request them directly.
`src/main/webapp/WEB-INF/jsp/subscribe.jsp`:

```jsp
<%@ page contentType="text/html;charset=UTF-8" %>
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Subscribe</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/cirth.min.css">
  </head>
  <body>
    <main class="container">
      <article>
        <header><h1>Hello, ${name}</h1></header>
        <form method="post" action="${pageContext.request.contextPath}/subscribe">
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

The context path is empty under `java -jar` and is the WAR's name in a
container, so the link is right in both. Expression language prints values
as they are, unescaped; print text that comes from a user with JSTL's
`<c:out>`.

### The controller

```java
package com.example.demo;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SubscribeController {

	@GetMapping("/")
	public String subscribe(Model model) {
		model.addAttribute("name", "JSP");
		return "subscribe";
	}
}
```

### Build the WAR, run it or deploy it

```sh
./mvnw package
java -jar target/demo-0.0.1-SNAPSHOT.war
```

The same file deploys to a container. With Tomcat 11, copy it to
`webapps/` as `demo.war`, and the app answers under `/demo`:

```sh
cp target/demo-0.0.1-SNAPSHOT.war "$CATALINA_HOME/webapps/demo.war"
```

Spring Boot 4 deploys to any container that implements Servlet 6.1 or
later, Tomcat 11 among them.

{% from "guide.njk" import nextSteps %}{{ nextSteps("in a stylesheet in static/css, linked after Cirth") }}
