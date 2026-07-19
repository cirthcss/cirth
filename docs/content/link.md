# Link

Links are styled by tag: `a` (excluding `[role="button"]`) and any element
with `role="link"`, plus two class modifiers for the secondary and contrast
color groups.

<Demo src="links" />

```html
<a href="#">Primary link</a>
<a href="#" class="secondary">Secondary link</a>
<a href="#" class="contrast">Contrast link</a>
<a href="#" role="button">Link styled as a button</a>
```

## Behavior

* Color and underline come from `--cirth-primary` /
  `--cirth-primary-underline` by default.
* `:hover`, `:active`, `:focus`, and `[aria-current]` (excluding
  `aria-current="false"`) switch to the `-hover` variants and force an
  underline.
* `:focus-visible` adds a focus ring in `--cirth-primary-focus`.
* `a[role="button"]` opts out of link styling entirely and is styled by
  [Button](/content/button) instead. This is how you get a link that looks
  like a button.

## Modifiers

`.secondary` and `.contrast` swap the color group the same way they do for
[buttons](/content/button). They are available only in the default build with
classes enabled.
