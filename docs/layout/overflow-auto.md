# Overflow auto

`.overflow-auto` adds a scroll container around content that's wider than its
parent, most commonly a wide table, instead of letting it overflow the page.

<Demo src="overflow-auto" />

```html
<div class="overflow-auto">
  <table><!-- a table with many columns --></table>
</div>
```

It's a single declaration (`overflow: auto`), available only in the default
build with classes enabled.
