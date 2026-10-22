---
layout: docs.njk
description: Mark up source code, keyboard input, program output, and preformatted blocks with the matching native HTML elements.
---

# Code

HTML has separate elements for source code, user input, and program output.
Cirth gives them a shared code typeface while preserving those meanings.

{% demo "code" %}

```html
<p>
  Run <code>npm test</code>, then press <kbd>Enter</kbd>.
  A successful run prints <samp>Tests passed</samp>.
</p>

<pre tabindex="0"><code>function greet(name) {
  return `Hello, ${name}!`;
}</code></pre>
```

## Choosing the element

| Element | Use it for |
| --- | --- |
| `<code>` | A fragment of source code, a command, a file name, or another machine-readable identifier |
| `<kbd>` | Input the user should enter with a keyboard, voice command, or other input device |
| `<samp>` | Output produced by a program or system |
| `<var>` | A variable or placeholder in a formula, command, or piece of prose |
| `<pre>` | Text whose spaces and line breaks must be preserved, usually a block of code or output |

`<pre>` preserves whitespace but does not identify its contents as source
code. Nest `<code>` or `<samp>` when that meaning matters.

## Native browser behavior

Browsers preserve spaces and line breaks inside `<pre>`. Inline elements such
as `<code>` continue to participate in the surrounding sentence. These
elements do not run code, copy it, or add syntax highlighting. Those features
require application behavior or another stylesheet.

A long preformatted line creates horizontal overflow rather than wrapping by
default. Add `tabindex="0"` when a `<pre>` block can scroll, so keyboard users
can focus and operate the scroll area.

## What Cirth adds

- All five elements use Cirth's code font and code color.
- Inline `<code>` and `<samp>` can break long tokens without widening the
  document.
- `<kbd>` is displayed as a padded key cap using the dedicated keyboard
  colors.
- `<var>` is italicized without a surrounding chip.
- `<pre>` receives a recessed surface, border, horizontal scrolling, and a
  visible focus outline.
- A direct `<code>` or `<samp>` inside `<pre>` becomes a padded block without
  a second background or font-size adjustment.

The main surface tokens are `--cirth-code-background-color`,
`--cirth-code-color`, `--cirth-code-kbd-background-color`, and
`--cirth-code-kbd-color`.

## Common mistakes

- Do not use `<code>` only to obtain a monospace font. Use it when the text is
  code or a machine-readable token.
- Do not put raw angle brackets inside an HTML example. Escape them as
  `&lt;` and `&gt;` so the browser displays them as text.
- Do not assume a scrollable `<pre>` is keyboard-reachable. Add
  `tabindex="0"` when overflow is possible.
- Do not use `<pre>` to align ordinary page content with spaces.

## Related pages

- [Typography](/content/typography)
- [Overflow auto](/layout/overflow-auto)
- [Print](/utilities/print)
