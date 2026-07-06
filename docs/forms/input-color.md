# Input color

`[type="color"]` gets its native swatch reshaped to match Cirth's border
radius, without changing its behavior.

<Demo src="input-color" />

```html
<input type="color" value="#0172ad">
```

Only the swatch wrapper padding and the swatch's own border/radius are
touched (`::-webkit-color-swatch`, `::-moz-color-swatch`, and their wrapper
pseudo-elements) — the native color picker itself is untouched.
