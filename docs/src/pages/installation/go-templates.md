---
layout: docs.njk
framework: go-templates
description: Use Cirth in a Go web app built on the standard library. Serve the file with net/http, link it from an html/template, and embed both in the binary.
---
{% from "guide.njk" import checkIt, nextSteps %}

Go's standard library has a web server and HTML templates, and `embed` can
put the templates and the stylesheet inside the binary. Cirth is one file
among them. Gin, Echo and other routers serve static files and render
`html/template` the same way, with their own calls.

## 1. Add the file

In a module (`go mod init example.com/app`), next to `main.go`:

```sh
mkdir -p static/css templates
curl -o static/css/cirth.min.css \
  https://cdn.jsdelivr.net/npm/@cirthcss/cirth@{{ release.version }}/dist/cirth.min.css
```

## 2. Link it from a template

`templates/head.html` holds what every page's head shares:

```html
{% raw %}{{define "head"}}
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="/static/css/cirth.min.css">
{{end}}{% endraw %}
```

and `templates/subscribe.html` is a page that uses it:

```html
{% raw %}<!doctype html>
<html lang="en">
  <head>
    {{template "head" .}}
    <title>Subscribe</title>
  </head>
  <body>
    <main class="container">
      <article>
        <header><h1>Hello, {{.Name}}</h1></header>
        <form method="post" action="/subscribe">
          <label>
            Email
            <input type="email" name="email" required>
          </label>
          <button type="submit">Subscribe</button>
        </form>
      </article>
    </main>
  </body>
</html>{% endraw %}
```

`html/template` escapes what it prints for the place it prints it, so
`.Name` cannot inject markup.

## 3. Serve both

`main.go` embeds the two folders, serves `static/` under `/static/` and
renders the page:

```go
package main

import (
	"embed"
	"html/template"
	"io/fs"
	"log"
	"net/http"
)

//go:embed static templates
var files embed.FS

var pages = template.Must(template.ParseFS(files, "templates/*.html"))

func main() {
	static, err := fs.Sub(files, "static")
	if err != nil {
		log.Fatal(err)
	}
	http.Handle("GET /static/", http.StripPrefix("/static/", http.FileServerFS(static)))
	http.HandleFunc("GET /{$}", func(w http.ResponseWriter, r *http.Request) {
		if err := pages.ExecuteTemplate(w, "subscribe.html", map[string]string{"Name": "Go"}); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	})
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

## 4. Build for production

```sh
go build -o app .
./app
```

The binary carries the stylesheet and the templates; copy it alone to the
server.

## 5. Check it

{{ checkIt() }}

{{ nextSteps("in a stylesheet in static/css, linked after Cirth") }}
