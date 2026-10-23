---
layout: docs.njk
description: Structure headings, paragraphs, lists, quotations, and inline meaning with semantic HTML and Cirth's type system.
---

# Typography

HTML describes the structure and meaning of text. Cirth supplies its visual
type scale, spacing, colors, and readable defaults. Choose an element for what
the content means, not for the size or style that a browser happens to give
it.

{% demo "typography" %}

```html
<article>
  <hgroup>
    <h1>Deploying a web service</h1>
    <p>A short checklist for a safe first release.</p>
  </hgroup>

  <h2>Before deployment</h2>
  <ul>
    <li>Run the automated tests.</li>
    <li>Back up the production database.</li>
  </ul>

  <h2>Deployment order</h2>
  <ol>
    <li>Apply database migrations.</li>
    <li>Deploy the application.</li>
    <li>Verify the health endpoint.</li>
  </ol>

  <blockquote>
    <p>Make each change small enough to understand and reverse.</p>
    <footer><cite>Operations handbook</cite></footer>
  </blockquote>
</article>
```

## Structure and appearance

A heading identifies a section whether it is large, small, bold, or plain. A
list remains a list when its bullets are hidden. This semantic structure lets
browsers, search tools, and assistive technologies present the content in ways
that CSS alone cannot provide.

Cirth styles the elements directly, so no typography classes are required.
Application CSS can change the appearance without changing the element's
meaning.

## Headings

Headings from `<h1>` through `<h6>` form a hierarchy. Start the page with a
clear `<h1>`. Use `<h2>` for its major sections, `<h3>` for subsections within
an `<h2>`, and continue in order as the content becomes more deeply nested.

Do not select a heading level because of its font size. Skipping from `<h2>`
to `<h4>` makes the document structure harder to understand. If a heading
needs a different appearance, customize its tokens or apply a local style
while preserving the correct level.

Cirth gives every level its own size, line height, and color token. Headings
use the display font and balanced wrapping. Flow spacing keeps a heading
closer to the content it introduces than to the preceding section.

Relevant tokens include `--cirth-h1-color` through `--cirth-h6-color`,
`--cirth-heading-font-weight`, `--cirth-title-font-weight`, and the heading
font-size roles.

## Type roles

Cirth sets type by role rather than by element. Each role differs from its
neighbours in at least two of size, weight, ink and tracking, so a legend
reads above the labels in its fieldset and a column head reads as data about
its cells.

| Role | Elements | Size | Weight | Ink |
| --- | --- | --- | --- | --- |
| Heading | `h1`, `h2` | 28px, 24px | 600 | strong |
| Title | `h3` to `h6` | 20px, 18px, 16px, 14px | 600 | strong for `h3` and `h4`, body for `h5` and `h6` |
| Body | running text, table cells, `dd`, the label of a checkbox or radio | 16px | 400 | body |
| Label | a field's `label` | 14px | 500 | body |
| Control text | buttons, `summary`, `dt` | 16px | 500 | body |
| Group | a fieldset's `legend` | 16px | 600 | strong |
| Meta | `thead` and `tfoot` cells, `figcaption`, a quotation's `footer`, help text after a field | 13px | 500 | muted |
| Code | `code`, `kbd`, `samp`, `var`, `pre` | 0.875em | 400 | body |

Headings keep these sizes at every viewport width. A hero that needs a
larger, fluid size uses `--cirth-display-font-size` and
`--cirth-display-font-weight`, which no element takes by default.

Tracking follows size through one relation, `--cirth-tracking-optical`: none
at the body size, slightly positive below it and slightly negative above it.
Set it to `0` to turn the correction off.

## Heading groups

`<hgroup>` groups one heading with related secondary text such as a subtitle,
tagline, or byline:

```html
<hgroup>
  <h1>Cirth documentation</h1>
  <p>Semantic HTML with a production-ready baseline.</p>
</hgroup>
```

The heading still supplies the section level. The paragraph adds supporting
context; it does not become a second heading. Cirth removes the internal flow
gap and styles the final supporting line in the regular, muted text role.

Use separate headings instead when the two lines introduce separate sections.
Do not use `<hgroup>` merely to place arbitrary controls beside a title.

## Paragraphs and lists

Use `<p>` for a paragraph of prose. Cirth applies readable line height and
asks supporting browsers to avoid leaving a single word on the last line.

Use `<ul>` when order does not change the meaning, such as a set of features.
Use `<ol>` for steps, rankings, or any sequence where position matters. Each
item belongs in `<li>`:

```html
<ul>
  <li>Email notifications</li>
  <li>Weekly reports</li>
</ul>

<ol>
  <li>Create an account.</li>
  <li>Confirm the email address.</li>
</ol>
```

Browsers expose the list type and item count to assistive technology. Cirth
uses square bullets for unordered lists, adds one line of space between items,
and keeps nested lists visually attached to their parent item.

Do not replace a list with paragraphs that start with typed hyphens or numbers.
That text lacks list structure and will not renumber automatically.

## Quotations and citations

Use `<blockquote>` for an extended quotation from another source. Put the
quoted prose in one or more paragraphs when it has paragraph structure. A
`<footer>` inside the blockquote can hold the attribution. `<cite>` identifies
the title of the cited work, not a generic italic phrase:

```html
<blockquote cite="https://example.com/handbook">
  <p>Make each change small enough to understand and reverse.</p>
  <footer><cite>Operations handbook</cite></footer>
</blockquote>
```

The optional `cite` attribute records a source URL for machines, but browsers
do not display it automatically. Write a visible attribution when readers need
one.

Cirth draws a logical start-edge border, adds padding, and gives a nested
footer the muted meta-text treatment. The edge moves to the other side in a
right-to-left document.

Use quotation marks or `<q>` for a short quotation inside a sentence rather
than creating a blockquote.

## Inline meaning

| Element | Meaning | Cirth treatment |
| --- | --- | --- |
| `<strong>` | Strong importance, seriousness, or urgency | Semibold or the surrounding heading weight, whichever is heavier |
| `<em>` | Stress that changes the emphasis of a sentence | Browser italic styling |
| `<mark>` | Text relevant to the reader's current task, such as a search match | Highlight surface and text colors |
| `<ins>` | Content inserted into a document | Success-colored text |
| `<del>` | Content removed from a document | Error-colored text |
| `<abbr title="...">` | An abbreviation with its expansion in `title` | Dotted underline and help cursor |
| `<sub>` / `<sup>` | Subscript or superscript, such as a chemical formula or footnote marker | Reduced and repositioned text without changing line height |

`<b>` draws attention without adding importance, while `<i>` marks text in an
alternate voice or convention. Their typical bold and italic appearance does
not make them interchangeable with `<strong>` and `<em>`.

### The `<i>` element is text, not an icon

```html
<p>The phrase <i lang="la">in situ</i> means “in its original place.”</p>
```

Here `<i>` marks a span of text set apart from the surrounding prose by a
different voice or convention. A technical term, a taxonomic name, or a phrase
from another language can have that role. The `lang="la"` attribute identifies
the example as Latin. Browsers and assistive tools can use that language
information when they process the phrase. Browsers normally render `<i>` in
italics; Cirth does not add a separate treatment.

The `i` in the tag name does not mean “icon.” The element does not load a
graphic, explain an icon to assistive technology, or label a control. Some icon
libraries use `<i>` only as a CSS class hook, but that convention does not
change the element's HTML meaning. Use an inline SVG, or a neutral `<span>`
when application CSS supplies the artwork. Hide a decorative icon from
assistive technology. An icon-only control still needs a text label that
assistive technology can announce. See [Embedded content](/content/embedded)
and [Screen-reader only](/utilities/sr-only) for the relevant patterns.

The text inside `title` on `<abbr>` is supplementary. Expand an unfamiliar
abbreviation in visible prose on its first use when every reader needs the
definition.

For `<code>`, `<kbd>`, `<samp>`, `<var>`, and preformatted blocks, see
[Code](/content/code).

## Common mistakes

- Do not choose heading levels for their visual size.
- Do not use `<br>` repeatedly to create paragraph spacing. Use separate
  paragraphs or CSS layout.
- Do not use `<strong>` for every visually bold label when the text has no
  added importance.
- Do not use `<mark>` simply as a decorative brand highlight. It represents
  relevance in the current context.
- Do not type bullets, numbers, or quotation indentation by hand when a native
  element expresses the structure.
- Do not rely on color alone to explain inserted or deleted text. The elements
  themselves carry the change semantics.

## Related pages

- [Code](/content/code)
- [Description list](/content/description-list)
- [Section](/layout/section)
- [Customization](/customization)
