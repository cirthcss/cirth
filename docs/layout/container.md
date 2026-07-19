# Container

`.container` centers content and constrains its width at each responsive
breakpoint. `.container-fluid` centers content edge to edge without a maximum
width. Both are only available in the **default** build with classes enabled;
the classless build applies the same behavior to `body > header/main/footer`
directly instead (see [Landmarks](/layout/landmarks)).

<Demo src="container" />

```html
<main class="container">
  <p>Centered content with constrained width.</p>
</main>
```

## Breakpoints

`.container`'s max width steps up at each breakpoint (from `src/_breakpoints.scss`):

| Breakpoint | Viewport ≥ | `.container` maximum width |
| --- | --- | --- |
| `sm` | 576px | 510px |
| `md` | 768px | 700px |
| `lg` | 1024px | 950px |
| `xl` | 1280px | 1200px |
| `xxl` | 1536px | 1450px |

Below `sm`, `.container` is full width with `--cirth-spacing` as side
padding. These breakpoints are fixed at build time; they are not CSS custom
properties.
