---
layout: docs.njk
---

# Brand

Assets and guidelines for representing Cirth in articles, talks,
integrations, and anywhere else the project is named.

<section class="docs-brand-spec" aria-labelledby="signature-title">
  <header class="docs-brand-spec-header">
    <h2 id="signature-title">The part that survives a retheme.</h2>
    <p>Cirth's identity is not its accent. The accent is the first token an
    adopter replaces, and a system whose character lives in one hue has
    none left once it is adopted. What stays is a grammar and its tuning:
    every text element takes a role, every surface a level, every edge one
    of three weights, and every gap the distance between the things it
    separates. Compare <a href="/specimen/default/">the default specimen</a>
    with <a href="/specimen/plain/">the plain one</a>: the values move, and
    the relations between them do not.</p>
  </header>
  <dl class="grid docs-brand-measures">
    <div><dt>Surface levels</dt><dd>Recessed · canvas · raised · overlay, all from <code>--cirth-canvas</code></dd></div>
    <div><dt>Edges</dt><dd>Separator · container · control{% if measured %}: <code>{{ measured.edges[0].light.onCanvas | ratio }}</code> · <code>{{ measured.edges[1].light.onCanvas | ratio }}</code> · <code>{{ measured.edges[2].light.onCanvas | ratio }}</code> on the canvas{% endif %}</dd></div>
    <div><dt>Type roles</dt><dd>Display · heading · title · group · body · label · meta · code</dd></div>
    <div><dt>Flow</dt><dd>Line to chapter{% if measured %}: {% for step in measured.flow %}<code>{{ step.px }}px</code>{% if not loop.last %} · {% endif %}{% endfor %}{% endif %}</dd></div>
    <div><dt>Corners</dt><dd>{% if proof.radius and proof.radius.control %}<code>{{ proof.radius.control }}</code> control · <code>{{ proof.radius.container }}</code> container; {% endif %}none rounder than its container</dd></div>
    <div><dt>Target floor</dt><dd><code>44px</code> controls · <code>40px</code> in a nav</dd></div>
  </dl>
</section>

The grammar is the engineered half: rules stated once in the stylesheet
and checked by a test. The tuning is the organic half: it follows how
people read and scan, and each part of it is a declared relation rather
than a value chosen for one element.

{% if measured %}
| Rule | Its tuning |
| --- | --- |
| Every text element maps to one role | Leading narrows as type grows: {{ measured.type.leading.tight }} for headings, {{ measured.type.leading.normal }} for controls, {{ measured.type.leading.relaxed }} in a reading column |
| Tracking is one relation of size | `calc({{ measured.tracking.coefficient }} * (1rem - 1em))`: {% for point in measured.tracking.at %}{{ point.label }} at {{ point.size }}px{% if not loop.last %}, {% endif %}{% endfor %} |
| A gap is set by the relation between two siblings | The steps are not evenly spaced: {% for step in measured.flow %}{{ step.multiple }}{% if not loop.last %}, {% endif %}{% endfor %} times `--cirth-spacing`, so the gap between two chapters is {{ (measured.flow[4].multiple / measured.flow[0].multiple) | round }} times the gap between two lines of one item |
| Surfaces are levels derived from one canvas | Every level keeps the canvas's hue: chroma {{ measured.levels[1].light.c }} at {{ measured.levels[1].light.h }}° in light, {{ measured.levels[1].dark.c }} at {{ measured.levels[1].dark.h }}° in dark |
| Edges come in three weights | Only the control edge is held to 3:1, on every level; the separator and the container divide and bound content, and sit at {{ measured.edges[0].light.onCanvas | ratio }} and {{ measured.edges[1].light.onCanvas | ratio }} on the light canvas |
| Two radii, assigned by kind | The container's is one and a half times the control's, so nothing is rounder than what holds it |
{% endif %}

The same rules hold everywhere; which half leads depends on what the page
is for. On this site:

- **A guide** is read from the top, so the tuning leads: a lead at 20px,
  leading {{ measured.type.leading.relaxed if measured else "relaxed" }} at
  a measure of 30em, and chapters divided by more space instead of a rule.
- **A reference page** is consulted, so the grammar leads: a lead at 18px,
  a separator over every chapter, column heads in the meta role, and token
  names in the code face with no chip behind them.
- **A demo** shows a component instead of framing it. The example stands
  on the recessed level with no border, rebinds `--cirth-surface` so the
  fields in it paint the level they sit on, and its source is one listing
  under it.
- **A component** is where the engineering is least negotiable: a 44px
  target, a control edge at 3:1 or more, one opaque focus ring offset from
  the fill, and a primary that is the heaviest action in its group.

Those are the relations to keep when Cirth is restyled. Replacing
`--cirth-primary`, the canvas, the radius or the spacing unit is expected
and supported. Collapsing two surface levels into one, drawing a control
edge under 3:1, or setting a gap by hand where a relation already sets it
takes the interface out of the system.

## The mark

Cirth's name comes from a writing system, and the mark is the project's
own sign rather than a letter borrowed from one. It is built to hold at the
sizes technical work actually puts it in: a README header, an npm listing,
a favicon, a tab strip. It still carries the copper of the palette it was
drawn with, which is no longer the interface's accent; the redrawn mark
takes the accent's hue.

The mark is being redrawn. The files in the grid below are the current
ones and remain the assets to use until they are replaced; the geometry
that describes them (construction grid, clearspace, minimum size,
alignment in the lockup) is not published here, because a rule measured
against the outgoing drawing would be wrong about the incoming one.

<section class="docs-brand-spec" aria-labelledby="mark-pending-title">
  <header class="docs-brand-spec-header">
    <h2 id="mark-pending-title">Measured on the mark, not before it.</h2>
    <p>Everything in this list is a number, and a number about a drawing
    can only be taken off that drawing. Each one is specified here once the
    definitive mark is in the repository, and not sooner. What the rest of
    this page documents does not depend on the drawing and is current:
    the colour roles, the typographic voice, the proportions of the
    interface, the terms of use.</p>
  </header>
  <dl class="grid docs-brand-measures">
    <div><dt>Clearspace</dt><dd>Pending the definitive mark</dd></div>
    <div><dt>Minimum size</dt><dd>Pending the definitive mark</dd></div>
    <div><dt>Construction grid</dt><dd>Pending the definitive mark</dd></div>
    <div><dt>Size thresholds</dt><dd>Pending the definitive mark</dd></div>
    <div><dt>Lockup alignment</dt><dd>Pending the definitive mark</dd></div>
    <div><dt>Reduced variant</dt><dd>Pending the definitive mark</dd></div>
  </dl>
</section>

Cirth is not affiliated with, endorsed by, or associated with the
Tolkien estate, the Tolkien Society, Amazon's Middle-earth adaptations,
or any other rights holder. The Cirth is a script Tolkien devised, and
naming a stylesheet after it is a reference, not a claim of license or
partnership. The mark and the wordmark are the project's own work.

<div class="docs-brand-grid">
  <figure class="docs-brand-tile" data-theme="light">
    <img src="/logo_brand.svg" alt="Cirth brand mark, copper on light" width="96" height="96" />
    <figcaption>Brand · light</figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/logo_brand.svg" download>SVG</a>
      <a class="secondary" href="/logo_brand.png" download>PNG</a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="light">
    <img src="/logo_mono.svg" alt="Cirth monochrome mark, black on light" width="96" height="96" />
    <figcaption>Mono · light</figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/logo_mono.svg" download>SVG</a>
      <a class="secondary" href="/logo_mono.png" download>PNG</a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="light">
    <img src="/logo_brand_app.svg" alt="Cirth icon on its background tile, light" width="96" height="96" />
    <figcaption>Icon · light</figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/logo_brand_app.svg" download>SVG</a>
      <a class="secondary" href="/logo_brand_app.png" download>PNG</a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="dark">
    <img src="/logo_brand_dark.svg" alt="Cirth brand mark, copper on dark" width="96" height="96" />
    <figcaption>Brand · dark</figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/logo_brand_dark.svg" download>SVG</a>
      <a class="secondary" href="/logo_brand_dark.png" download>PNG</a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="dark">
    <img src="/logo_mono_dark.svg" alt="Cirth monochrome mark, white on dark" width="96" height="96" />
    <figcaption>Mono · dark</figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/logo_mono_dark.svg" download>SVG</a>
      <a class="secondary" href="/logo_mono_dark.png" download>PNG</a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="dark">
    <img src="/logo_brand_app_dark.svg" alt="Cirth icon on its background tile, dark" width="96" height="96" />
    <figcaption>Icon · dark</figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/logo_brand_app_dark.svg" download>SVG</a>
      <a class="secondary" href="/logo_brand_app_dark.png" download>PNG</a>
    </p>
  </figure>
</div>

Each variant above is downloadable as SVG (preferred) or PNG. The full set
lives in
[`docs/public/`](https://github.com/cirthcss/cirth/tree/master/docs/public)
and is catalogued in
[`docs/BRAND_ASSETS.md`](https://github.com/cirthcss/cirth/blob/master/docs/BRAND_ASSETS.md),
including the two combinations this grid does not show: the mono mark on
its own background tile, light and dark, for square containers that have to
stay one colour.

Use the **brand** (copper) mark wherever color is available, matching the
variant to the background. Use **mono** in one color contexts such as print,
badges, embossing. The **icon** variants sit on their own background
tile; use them where the mark needs to fill a square: favicons, social
avatars, bookmark icons. Not for inline use next to text.

## Operational rules

Pick the variant by what the surface can carry, not by taste: **brand**
wherever colour is available, **mono** wherever one flat ink is preferable
or required, the **icon tile** wherever the mark has to fill a square. Give
the mark a margin of clear space on every side and keep other elements out
of it. How much, exactly, is one of the numbers waiting on the definitive
mark; until it is measured, err generous.

The mark is a sign, not a pattern. It marks the project once on a surface:
in a header, on a card, at the foot of a page. It is not a texture, a
watermark, a bullet, or a shape to repeat behind content.

### Incorrect use

Do not stretch it, rotate it, outline it, add a glow or a shadow, recolour
it outside the variants published here, place it on a surface it has no
contrast against, repeat it as wallpaper, or pair it with fantasy imagery.

## Color

The accent has two jobs in an interface: **action** and **current
position**. A primary button, a link in running prose and a focus ring are
actions. The rail beside the page you are on, the edge under an active
in-page nav item and a checked control are position. Navigation at rest
takes the ink of whatever it sits in, so a menu is not a row of
accent-coloured words beside the one button that asks to be pressed.
Nothing else in a Cirth interface takes the accent: not a heading, not a
band behind a section, not a word picked out for emphasis.

Everything else belongs to four families of roles:

- **Surface levels**, derived from `--cirth-canvas`: recessed, canvas,
  raised and overlay. Each keeps the canvas's hue, so a theme that tints
  its canvas tints every level with it, and no level is a wash of the
  accent.
- **Edges**, derived from the same canvas: separator, container and
  control, in rising contrast.
- **Inks**: strong, ink, secondary and muted, each measured against every
  level.
- **States**: error, success and warning, each with a text, an edge and a
  surface. Disabled is not a state colour but a neutral wash, with the
  label at half the ink, the same for every variant.

{% if measured %}
Measured on this build, as the lowest contrast on any of the four levels:

| Role | Light | Dark |
| --- | --- | --- |
{%- for ink in measured.inks %}
| {{ ink.name }}, `--cirth-{{ ink.token }}` | {{ ink.light.worst | ratio }} | {{ ink.dark.worst | ratio }} |
{%- endfor %}
{%- for edge in measured.edges %}
| {{ edge.name }} edge, `--cirth-{{ edge.token }}` | {{ edge.light.worst | ratio }} | {{ edge.dark.worst | ratio }} |
{%- endfor %}

A primary button's label on its fill: {{ measured.accent.light.label | ratio }}
in light, {{ measured.accent.dark.label | ratio }} in dark.
{% endif %}

The mark and the accent do not share a hue yet. The files below are the
copper mark, at 44° in OKLCH; the default accent scale is generated from
{{ measured.accent.hue if measured else 324 }}°, and the redrawn mark takes
that hue, so that the theme's accent and the logo match by construction
rather than by eye. The mark is more saturated than the interface tokens
because it is a sign to recognise, not a colour that text has to clear
4.5:1 against.

| Role | Value |
| --- | --- |
| Mark, light backgrounds | `#BD5928` (`oklch(0.58 0.143 44.2)`) |
| Mark, dark backgrounds | `#E16B31` (`oklch(0.66 0.163 44.2)`) |
{%- if measured %}
| Accent, light | `{{ measured.accent.light.primary.hex }}` (`{{ measured.accent.light.primary.oklch }}`), from `$accent-500` |
| Accent, dark | `{{ measured.accent.dark.primary.hex }}` (`{{ measured.accent.dark.primary.oklch }}`), from `$accent-450` |
| Accent as text, light | `{{ measured.accent.light.text.hex }}` (`{{ measured.accent.light.text.oklch }}`) |
| Accent as text, dark | `{{ measured.accent.dark.text.hex }}` (`{{ measured.accent.dark.text.oklch }}`) |
{%- endif %}

In interfaces, use the `--cirth-primary*` tokens rather than the logo
hexes: the tokens are the values measured for contrast. See
[Colors](/colors) for every role and its value.

## The lockup

The horizontal lockup is the mark with the name beside it: "Cirth" in the
sans voice, bold, with the mark sized to the cap height and sitting on the
same baseline. Use it where the name has to travel with the mark and there
is room for both: a third-party README, a talk slide, a conference badge,
a social post.

<div class="docs-brand-grid docs-lockup-grid">
  <figure class="docs-brand-tile" data-theme="light">
    <img src="/wordmark.svg" alt="Cirth horizontal lockup, copper mark and graphite name on light" width="240" height="57" />
    <figcaption>Lockup · light</figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/wordmark.svg" download>SVG</a>
      <a class="secondary" href="/wordmark.png" download>PNG</a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="dark">
    <img src="/wordmark_dark.svg" alt="Cirth horizontal lockup, copper mark and paper name on dark" width="240" height="57" />
    <figcaption>Lockup · dark</figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/wordmark_dark.svg" download>SVG</a>
      <a class="secondary" href="/wordmark_dark.png" download>PNG</a>
    </p>
  </figure>
</div>

<p>A one-colour lockup is available as
<a class="secondary" href="/wordmark_mono.svg" download><code>wordmark_mono.svg</code></a>
for print, badges and embossing. It paints with <code>currentColor</code>, so
inline it to give it your own ink; loaded through <code>&lt;img&gt;</code> it
falls back to black, the same as the mono mark.</p>

**The name is live text, not outlines.** The lockup carries `<text>` in the
system sans stack the framework itself ships, which is the whole of the
typographic claim: there is no font to install, and nothing to license. The
cost is that the word's width moves a little between platforms: SF Pro sets
it narrowest, Helvetica and Arial about 2.5% wider, so the box reserves
room for the widest face in the stack and a narrower one leaves a little air
on the right. That is the intended behaviour, not a mis-export.

### Which asset, for which context

| Context | Asset | Why |
| --- | --- | --- |
| Name and mark together, with room for both | Lockup | Carries the name where the surrounding text does not |
| Square container: favicon, avatar, app tile | Icon tile | The mark fills the square; the lockup cannot |
| Beside text that already names the project | Mark | The name is in the sentence; the mark identifies it |
| One flat ink: print, badges, embossing | Mono mark or mono lockup | No second colour to lose |

The lockup does not replace the mark at small sizes. Shrinking it until the
name is legible makes the mark illegible first; at that point the mark alone
is the correct asset and the name belongs in the text next to it. The size
each asset stops working at is a measurement, and it is
[waiting on the definitive mark](#the-mark).

## Typography

Type is assigned by role, not by element. Each role differs from the next
in at least two of size, weight, ink and tracking:

| Role | Size | Weight | Ink | Used by |
| --- | --- | --- | --- | --- |
| Display | 40 to 64px | {{ measured.type.headingWeight if measured else 650 }} | Strong | One headline on a page, opted into |
| Heading | 22 to 40px | {{ measured.type.headingWeight if measured else 650 }} | Strong | `h1`, `h2` |
| Title | 14 to 22px | {{ measured.type.titleWeight if measured else 600 }} | Strong, body ink from `h5` | `h3` to `h6` |
| Group | 16px | {{ measured.type.titleWeight if measured else 600 }} | Strong | A fieldset's `legend` |
| Body | 16px | 400 | Ink | Running text, table cells, option labels |
| Label | {{ measured.type.labelSize if measured else 14 }}px, 16px as a control's text | {{ measured.type.labelWeight if measured else 500 }} | Ink | Field labels, buttons, `summary`, `dt` |
| Meta | {{ measured.type.metaSize if measured else 13 }}px | 500 | Muted | Captions, column heads, help text, attributions |
| Code and data | 0.875em, never under 12px | 400 | Ink | `pre`, `code`, `kbd`, `samp`, `var` |

Monospace is for code and data only: a listing, a token name, a file name,
a key. It is not a voice for labels or annotations, and nothing is set in
capitals to look technical. The name in this site's header is the one
exception, and it belongs to the lockup as it is drawn today rather than to
the typographic system: the header sets "Cirth" in the code face beside the
mark, and no other label on the site does.

There is no font to install. Cirth ships the platform's own sans and mono
stacks, `system-ui` first, and this site uses them. Serif remains
available as a primitive token for an author to opt into; it is not part
of Cirth's product voice.

Write the name as **Cirth** (capitalized, never uppercase); the npm scope
is `@cirthcss/cirth`.

## Using the mark in technical contexts

The mark is built to survive small, high-contrast, low-color placements:
READMEs, npm listings, CI badges, terminal output headers, favicons. Use
the **mono** variant wherever a single flat color is preferable to copper
(badges, print, embossing, low-color terminals), and the **icon** tile
wherever the mark needs to fill a square container. Keep what surrounds it
contemporary and technical: no fantasy illustration, no parchment or stone
texture, no medieval lettering. Cirth is named after a writing system, and
a page that dresses up the reference reads as a theme rather than as a
tool.

## Voice

Cirth's writing is technical language written for people. It is precise
and evidence-led: assertive about what is verified, open about trade-offs,
and never ideological. Prefer *claim → mechanism → proof*. State what the
framework does, explain how it does it, then point at something checkable:
a script, a number, a source file.

Written for people means four habits:

- **Plain words.** "Sets", "keeps" and "draws", not "leverages" or
  "empowers". A technical term is used where it is the precise one
  (`light-dark()`, a cascade layer) and explained the first time a page
  uses it.
- **The example before the abstraction.** Show the `<article>` and the
  card it renders, then name the relation that produced it.
- **Sentences with rhythm.** Vary their length, and let a short one land
  the point a longer one set up. One idea to a sentence.
- **Precision without jargon.** "Clears 4.5:1 on every surface level" is
  precise. "WCAG-compliant by design" is jargon, and it promises less than
  it sounds.

The subject is a language and what it is made of, so the vocabulary is
too. Favour **semantics**, **structure**, **syntax**, **vocabulary**,
**grammar**, **relation**, **scope**, **token**, **runtime**, **source**,
**output**, **native**, **integrate**, **baseline**, **verify** and
**transformation**.

Three habits to avoid. The first is the workshop register: **carving**,
**forging**, **craft**, **tooling**, **hardness**, **purity**, **metal**
and engineering as a metaphor for manual labour. Cirth is named after a
writing system, not a trade, and a page that reaches for the anvil is
describing an atmosphere instead of a mechanism. The material reading of
the name belongs in the origin story, once, and nowhere else.

The second is its mirror image, the organic register used as atmosphere:
**breathing**, **alive**, **natural**, **fluid** and their kin, with no
mechanism behind the word. A page does not breathe; its reading column has
a leading of 1.625 and a measure of 30em. A layout is not fluid; its gap is
a `clamp()`. Where the mechanism exists, name it instead of the feeling it
produces. Where it does not, the word is decoration.

The third is the unfalsifiable claim: **timeless**, **philosophy**,
"nothing to break", "fully accessible", "always delivered in one round
trip". If a sentence cannot be checked against a script, a measurement or
a source file, it is not doing the work this voice is for.

Example headlines:

- "Production-ready UI from semantic HTML."
- "One stylesheet. Runtime tokens. No JavaScript runtime."
- "A size budget on every bundle, checked on every build."

Example one-line descriptions:

- "Cirth turns native HTML elements into accessible, themeable
  interfaces, with zero shipped JavaScript."
- "An HTML-native CSS framework with a runtime design token system and a
  monitored gzipped size budget."

## Usage agreement

The Cirth code is released under the Apache License 2.0; the name and logo are brand assets with
their own terms:

1. **Naming projects.** You may use the Cirth name as part of a
   noncommercial open source project's name, for example
   "cirth-react" or "cirth-starter", as long as it's clear the project
   is built *for* Cirth, not *by* Cirth. Using the name in a commercial
   product or service requires prior written permission.
2. **Using the logo.** The mark may be used in articles, talks,
   tutorials, and documentation that reference Cirth, with attribution.
   It may not be used as (or inside) the logo of another project,
   product, or company, whether open source or commercial.
3. **Merchandise.** Using the Cirth name or logo on merchandise
   (shirts, stickers, and similar) requires explicit written consent.
4. **No implied endorsement.** Neither the name nor the mark may be used
   in a way that suggests Cirth endorses, certifies, or maintains an
   external product.

For permissions, open an issue on
[GitHub](https://github.com/cirthcss/cirth/issues).

### Keeping the mark intact

When you do use the mark:

* keep a generous margin of clear space around it on every side;
* pick the brand or mono variant that keeps contrast on your background;
* don't recolor, outline, rotate, add effects, or redraw the strokes,
  and don't set the wordmark in another typeface; use
  [the lockup](#the-lockup) rather than re-typesetting the name.
