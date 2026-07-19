# Button

`button`, `[type="submit"]`, `[type="reset"]`, `[type="button"]`,
`[role="button"]`, and a file input's `::file-selector-button` all share the
same button styling, with no `.btn` class required.

<Demo src="buttons" />

```html
<button type="button">Primary</button>
<button type="button" class="secondary">Secondary</button>
<button type="button" class="contrast">Contrast</button>
<button type="button" class="outline">Primary outline</button>
<button type="button" disabled>Disabled</button>
```

## Color modifiers

Modifier classes (default build only) swap which color group a button reads
`--cirth-background-color`/`--cirth-border-color`/`--cirth-color` from:

| Class | Color group |
| --- | --- |
| *(none)* | Primary |
| `.secondary` | Secondary |
| `.contrast` | Contrast |
| `.outline` | Primary, transparent background |
| `.outline.secondary` | Secondary, transparent background |
| `.outline.contrast` | Contrast, transparent background |

Without `$enable-classes` (the classless build), `[type="reset"]` and a file
input's selector button still get secondary styling automatically, since
there's no way to add `.secondary` to them.

## States

* `:hover` / `:active` / `:focus` / `[aria-current]` switch to the
  hover background and hover border tokens.
* `:focus` additionally layers a focus ring in `--cirth-primary-focus` (or
  the matching `-focus` token for the active color group) on top of the
  hover shadow.
* `[disabled]` drops opacity to `--cirth-opacity-disabled` and disables
  pointer events.
* Combine with [Loading](/components/loading) (`aria-busy="true"`) to show a
  spinner and disable interaction while a button's action is pending.
