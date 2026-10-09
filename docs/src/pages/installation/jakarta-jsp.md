---
layout: docs.njk
framework: jakarta-jsp
description: Use Cirth in a Java web app built on Jakarta Servlet and JSP. Put the file in the webapp folder, link it through the context path, and deploy the WAR to Tomcat. No Node.js.
---

Jakarta Servlet and Jakarta Pages (JSP) are two of the Jakarta® EE
specifications, implemented by servlet containers such as Tomcat. A web app
packaged as a WAR serves everything in `src/main/webapp` that is not under
`WEB-INF` as it is. Cirth is one file there, linked from a JSP layout
through the app's context path, so the link holds wherever the WAR is
deployed. Nothing here needs Node.js or npm.

## 1. Create the project

Maven's webapp archetype writes a WAR project:

```sh
mvn archetype:generate -DinteractiveMode=false \
  -DarchetypeGroupId=org.apache.maven.archetypes \
  -DarchetypeArtifactId=maven-archetype-webapp \
  -DarchetypeVersion=1.5 \
  -DgroupId=com.example -DartifactId=signup
cd signup
```

In `pom.xml`, compile for Java 21 and add the Servlet API, which the
container provides at run time:

```xml
<properties>
  <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  <maven.compiler.release>21</maven.compiler.release>
</properties>

<dependencies>
  <dependency>
    <groupId>jakarta.servlet</groupId>
    <artifactId>jakarta.servlet-api</artifactId>
    <version>6.1.0</version>
    <scope>provided</scope>
  </dependency>
</dependencies>
```

Delete the archetype's `index.jsp`, and declare the current schema in
`src/main/webapp/WEB-INF/web.xml`, with the servlet below as the welcome
page:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="https://jakarta.ee/xml/ns/jakartaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="https://jakarta.ee/xml/ns/jakartaee https://jakarta.ee/xml/ns/jakartaee/web-app_6_1.xsd"
         version="6.1">
  <welcome-file-list>
    <welcome-file>signup</welcome-file>
  </welcome-file-list>
</web-app>
```

## 2. Add the file

```sh
mkdir -p src/main/webapp/assets
curl -o src/main/webapp/assets/cirth.min.css \
  https://cdn.jsdelivr.net/npm/@cirthcss/cirth@{{ release.version }}/dist/cirth.min.css
```

## 3. Link it from a layout

A tag file is a layout every JSP can reuse. Create
`src/main/webapp/WEB-INF/tags/page.tag`:

```jsp
<%@ tag pageEncoding="UTF-8" %>
<%@ attribute name="title" required="true" %>
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/cirth.min.css">
  </head>
  <body>
    <main class="container">
      <jsp:doBody/>
    </main>
  </body>
</html>
```

`${pageContext.request.contextPath}` is the path the app is deployed under
(`/signup` here, nothing at the root), so the link does not break when the
WAR is renamed or moved.

## 4. Write a page

A servlet handles the request and forwards to a JSP under `WEB-INF`, which
no browser can request directly. `src/main/java/com/example/signup/SignupServlet.java`:

```java
package com.example.signup;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@WebServlet("/signup")
public class SignupServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.setAttribute("product", "Jakarta");
        request.getRequestDispatcher("/WEB-INF/views/signup.jsp").forward(request, response);
    }
}
```

`src/main/webapp/WEB-INF/views/signup.jsp` uses the layout:

```jsp
<%@ page contentType="text/html;charset=UTF-8" %>
<%@ taglib prefix="t" tagdir="/WEB-INF/tags" %>
<t:page title="Sign up">
  <article>
    <header><h1>Hello, ${product}</h1></header>
    <form method="post" action="${pageContext.request.contextPath}/signup">
      <label>
        Email
        <input type="email" name="email" required>
      </label>
      <fieldset>
        <legend>Plan</legend>
        <label><input type="radio" name="plan" value="free" checked> Free</label>
        <label><input type="radio" name="plan" value="team"> Team</label>
      </fieldset>
      <button type="submit">Sign up</button>
    </form>
  </article>

  <section data-theme="dark">
    <article>
      <p>Dark, whatever the system scheme is.</p>
    </article>
  </section>
</t:page>
```

Expression language prints values as they are, unescaped. For text that
comes from a user, print it with JSTL's `<c:out>`.

## 5. Build and deploy the WAR

```sh
mvn package
cp target/signup.war "$CATALINA_HOME/webapps/"
```

Tomcat 10.1 and later implement the Jakarta namespace; Tomcat 11 deploys
the WAR under `/signup` as soon as the file lands in `webapps/`. Any other
container that implements Servlet 6 and Pages takes the same file.

## 6. Check it

Open `http://localhost:8080/signup/` with the system in light mode, then
in dark mode. The page links `/signup/assets/cirth.min.css`, follows the
system, and keeps the section with `data-theme="dark"` dark both times.

{% from "guide.njk" import nextSteps %}{{ nextSteps("in a stylesheet linked after Cirth, in the same tag file") }}
