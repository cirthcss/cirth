---
layout: docs.njk
description: Cirth's name, mark, colour and voice, where they come from, how the default theme carries them, and the files and terms for using them.
---

# Brand

Cirth's name, its mark and its voice: where they come from, how the default
theme carries them, and the files and terms for using them.

<section class="docs-brand-hero" aria-label="The Cirth lockup">
  <img class="docs-logo-light" src="/wordmark.svg" alt="Cirth" width="{{ brandLockup.width | round }}" height="{{ brandLockup.height }}" />
  <img class="docs-logo-dark" src="/wordmark_dark.svg" alt="Cirth" width="{{ brandLockup.width | round }}" height="{{ brandLockup.height }}" />
  <p class="docs-brand-hero-line">Named after a writing system, and drawn
  like a sign from one. HTML supplies the vocabulary; Cirth gives it one
  consistent reading.</p>
  <p class="docs-brand-hero-actions">
    <a href="/logo_brand.svg" download role="button">Download the mark<span class="sr-only">, SVG for light backgrounds</span></a>
    <a href="/wordmark.svg" download role="button" class="secondary outline">Download the lockup<span class="sr-only">, SVG for light backgrounds</span></a>
    <a href="#downloads">Every variant</a>
  </p>
</section>

## From the forge to the page

Cirth is named after the Cirth, an alphabet Tolkien devised for his
languages. Its signs are built as a system: related sounds take related
shapes, so the script can be learned by its rules rather than memorised
sign by sign. That is the property a stylesheet built on semantic HTML
wants for itself, and [About](/about#origin-of-the-name) explains why.

In the story the name comes from, the script was devised by a minstrel, a
singer and keeper of knowledge who gave a language its written signs.
Dwarves adopted it later, extended it, and cut it into stone.

Cirth's first identity told the second half of that story. Its mark was a
hammer set against angular, carved strokes, in copper, and the project
described itself in the same register: forging, hardness, things built by
hand. That made a stylesheet sound like a workshop. What it does is closer
to grammar: it gives the elements HTML already has a consistent
appearance, derived from what they mean and the order they are read in.

The identity now tells the first half. The figure is the minstrel, the one
who composes a script and passes it on, and what Cirth takes from it is a
set of qualities a reader can check: a structure that reads the same way
everywhere, a relation between an element and what it means, an order of
reading carried by type and spacing. The engineering is as concrete as it
was. Its precision is described as semantics, syntax and rhythm instead of
metal.

The reference stays where it belongs, in the name and on this page. The
interface carries none of it: no character, no instrument, no runes,
parchment or stone.

Cirth is not affiliated with, endorsed by, or associated with the
Tolkien estate, the Tolkien Society, Amazon's Middle-earth adaptations,
or any other rights holder. The Cirth is a script Tolkien devised, and
naming a stylesheet after it is a reference, not a claim of license or
partnership. The mark and the lockup are the project's own work, and
neither depicts a character from the books or their adaptations.

## The mark

The mark is the minstrel drawn as a sign: a feathered hat, a face turned
aside, a lute held across the body, all one filled shape. Two strokes run
through it on the same rising diagonal, full in the middle and sharp at
the ends, the way a broad pen draws them. With the round sound hole they
are what makes it read as a written character before it reads as a
figure.

It comes in two forms, each in colour and in one flat ink:

- **The mark** on its own, beside text that already names the project,
  and wherever a square has to be filled: an avatar, a favicon.
- **The lockup**, the mark with the name beside it, where the name has to
  travel with the mark. The name is drawn, not typeset: its outlines come
  from Martian Grotesk Condensed Bold, so it reads the same everywhere and
  needs no font installed.

No colour in these files is chosen by hand. Each is read from the theme's
accent and canvas scales when the files are generated, so the mark and the
interface's accent share a hue by construction. [Colour](#colour) lists
the steps.

**The drawing is a working version.** Its final geometry, clearspace and
minimum size are published with the definitive mark; until then, the files
below are the ones to use.

## Downloads

<div class="docs-brand-grid">
  <figure class="docs-brand-tile" data-theme="light">
    <img src="/logo_brand.svg" alt="Cirth mark, magenta" width="96" height="96" />
    <figcaption><strong>Mark</strong><span>Colour, light backgrounds</span></figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/logo_brand.svg" download>SVG<span class="sr-only">, mark for light backgrounds</span></a>
      <a class="secondary" href="/logo_brand.png" download>PNG<span class="sr-only">, mark for light backgrounds</span></a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="light">
    <img src="/logo_mono.svg" alt="Cirth mark, black" width="96" height="96" />
    <figcaption><strong>Mono mark</strong><span>One ink: print, badges, embossing</span></figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/logo_mono.svg" download>SVG<span class="sr-only">, black mark</span></a>
      <a class="secondary" href="/logo_mono.png" download>PNG<span class="sr-only">, black mark</span></a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="dark">
    <img src="/logo_brand_dark.svg" alt="Cirth mark, light magenta" width="96" height="96" />
    <figcaption><strong>Mark</strong><span>Colour, dark backgrounds</span></figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/logo_brand_dark.svg" download>SVG<span class="sr-only">, mark for dark backgrounds</span></a>
      <a class="secondary" href="/logo_brand_dark.png" download>PNG<span class="sr-only">, mark for dark backgrounds</span></a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="dark">
    <img src="/logo_mono_dark.svg" alt="Cirth mark, white" width="96" height="96" />
    <figcaption><strong>Mono mark</strong><span>One ink, dark backgrounds</span></figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/logo_mono_dark.svg" download>SVG<span class="sr-only">, white mark</span></a>
      <a class="secondary" href="/logo_mono_dark.png" download>PNG<span class="sr-only">, white mark</span></a>
    </p>
  </figure>
</div>

<div class="docs-brand-grid docs-lockup-grid">
  <figure class="docs-brand-tile" data-theme="light">
    <img src="/wordmark.svg" alt="Cirth lockup, magenta mark and dark name" width="{{ brandLockup.width | round }}" height="{{ brandLockup.height }}" />
    <figcaption><strong>Lockup</strong><span>Mark and name, light backgrounds</span></figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/wordmark.svg" download>SVG<span class="sr-only">, lockup for light backgrounds</span></a>
      <a class="secondary" href="/wordmark.png" download>PNG<span class="sr-only">, lockup for light backgrounds</span></a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="dark">
    <img src="/wordmark_dark.svg" alt="Cirth lockup, light magenta mark and light name" width="{{ brandLockup.width | round }}" height="{{ brandLockup.height }}" />
    <figcaption><strong>Lockup</strong><span>Mark and name, dark backgrounds</span></figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/wordmark_dark.svg" download>SVG<span class="sr-only">, lockup for dark backgrounds</span></a>
      <a class="secondary" href="/wordmark_dark.png" download>PNG<span class="sr-only">, lockup for dark backgrounds</span></a>
    </p>
  </figure>
  <figure class="docs-brand-tile" data-theme="light">
    <img src="/wordmark_mono.svg" alt="Cirth lockup in one ink" width="{{ brandLockup.width | round }}" height="{{ brandLockup.height }}" />
    <figcaption><strong>Mono lockup</strong><span>One ink, inlined to take your colour</span></figcaption>
    <p class="docs-brand-downloads">
      <a class="secondary" href="/wordmark_mono.svg" download>SVG<span class="sr-only">, one-ink lockup</span></a>
    </p>
  </figure>
</div>

SVG is the format to use; the PNGs are renders of the same files, 1024px
square for the marks and at four times their size for the lockups, for
the places that cannot take a vector. The mono lockup is vector only:
it paints with `currentColor`, so inlined it takes your ink, and loaded
through `<img>` it falls back to black, as the mono mark does. Every
file lives in
[`docs/public/`](https://github.com/cirthcss/cirth/tree/master/docs/public)
and is catalogued in
[`docs/BRAND_ASSETS.md`](https://github.com/cirthcss/cirth/blob/master/docs/BRAND_ASSETS.md).

| Context | Asset | Why |
| --- | --- | --- |
| Beside text that already names the project | Mark | The name is in the sentence; the mark identifies it |
| Name and mark together, with room for both: a third-party README, a slide, a badge | Lockup | Carries the name where the surrounding text does not |
| A square: an avatar, a profile picture | Mark | Its file is square, with the margin already in it; the lockup cannot fill a square |
| One flat ink: print, badges, embossing, a low-colour terminal | Mono mark or mono lockup | No second colour to lose |
| A browser tab for a page about Cirth | <a href="/favicon.svg"><code>favicon.svg</code></a>, <a href="/favicon_dark.svg"><code>favicon_dark.svg</code></a> | The mark cropped to its ink on a transparent ground, in the colour for each scheme |

The lockup does not replace the mark at small sizes. Shrinking it until
the name is legible makes the mark illegible first; at that point the mark
alone is the right asset, and the name belongs in the text next to it.

## Colour

The mark and the interface share one hue, {{ measured.accent.hue if measured else 324 }}°
in OKLCH, and they share it by construction: the brand files are
generated from the theme's accent and canvas scales, so a change to the
scale moves the mark with it.

| Role | Scale step | Value | Contrast |
| --- | --- | --- | --- |
| Mark, light backgrounds | `${{ brandMark.markLight.step }}` | `{{ brandMark.markLight.hex }}` (`{{ brandMark.markLight.oklch }}`) | {{ brandMark.contrast.light | ratio }} on the light canvas |
| Mark, dark backgrounds | `${{ brandMark.markDark.step }}` | `{{ brandMark.markDark.hex }}` (`{{ brandMark.markDark.oklch }}`) | {{ brandMark.contrast.dark | ratio }} on the dark canvas |

On light backgrounds the mark is the light accent itself. On dark ones it
takes one step lighter than the dark accent, because a mid-tone sign on a
near-black page reads dimmer than text at the same contrast. The mark is a
picture, so it is held to 3:1, not to the 4.5:1 of text; both variants
clear the higher figure anyway.

In interfaces, use the `--cirth-primary*` tokens rather than these hexes:
the tokens are the values measured for each role, and they follow an
author who changes the accent.
{%- if measured %}

| Token role | Light | Dark |
| --- | --- | --- |
| Accent, `--cirth-primary` | `{{ measured.accent.light.primary.hex }}` (`{{ measured.accent.light.primary.oklch }}`) | `{{ measured.accent.dark.primary.hex }}` (`{{ measured.accent.dark.primary.oklch }}`) |
| Accent as text, `--cirth-primary-text` | `{{ measured.accent.light.text.hex }}` (`{{ measured.accent.light.text.oklch }}`) | `{{ measured.accent.dark.text.hex }}` (`{{ measured.accent.dark.text.oklch }}`) |
| White label on a primary button | {{ measured.accent.light.label | ratio }} | {{ measured.accent.dark.label | ratio }} |
{%- endif %}

The accent has two jobs in an interface: **action** and **current
position**. A primary button, a link in running prose and a focus ring are
actions. The rail beside the page you are on, the edge under an active
in-page nav item and a checked control are position. Navigation at rest
takes the ink of whatever it sits in, so a menu is not a row of
accent-coloured words beside the one button that asks to be pressed.
Nothing else in a Cirth interface takes the accent: not a heading, not a
band behind a section, not a card, not a word picked out for emphasis.
See [Colors](/colors) for every role and its value.

## From the mark to the theme

The default theme and the mark are one system, drawn at two scales. The
theme was rebuilt for this direction first, and the mark was drawn in its
accent; what they share is concrete enough to check.

- **One signal on a quiet ground.** The mark is a single ink on the
  canvas. The theme keeps its accent for action and position, and draws
  everything else from a neutral family set opposite the accent's hue.
- **Mass, not outline.** The mark is a filled shape whose only thin parts
  are its two strokes. The theme separates content by surface level and
  space before it reaches for a line, and its edges are hairlines in three
  weights.
- **Curves with a few exact geometric parts.** The mark's one true circle
  is its sound hole. The theme has two small radii, assigned by kind, and
  keeps the circle and the pill for controls whose shape is their
  meaning: a radio, a switch.
- **An order of reading.** The mark is read top to bottom, hat, face,
  instrument. A Cirth page is read in roles: each differs from the next in
  at least two of size, weight, ink and tracking, and each gap is set by
  the relation between the two things it separates.

<section class="docs-brand-spec" aria-labelledby="signature-title">
  <header class="docs-brand-spec-header">
    <h2 id="signature-title">The part that survives a retheme.</h2>
    <p>The accent is the first token an adopter replaces, and a system whose
    character lives in one hue has none left once it is adopted. What stays
    is a grammar and its tuning: every text element takes a role, every
    surface a level, every edge one of three weights, and every gap the
    distance between the things it separates. Compare
    <a href="/specimen/default/">the default specimen</a> with
    <a href="/specimen/plain/">the plain one</a>: the values move, and the
    relations between them do not.</p>
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

The example below is Cirth's own markup and stylesheet, with nothing added
by this page. The card is a raised level on a recessed one, the field
draws the control edge, the title, body, label and meta text each take
their role, and the accent appears only on the link, the primary action
and the checked box. Move through it with the Tab key: every focusable
element draws the same opaque ring, offset from its fill.

{% demo "brand-system" %}

The grammar is the engineered half: rules stated once in the stylesheet
and checked by a test. The tuning is the other half: it follows how
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

Measured on this build, as the lowest contrast on any of the four levels:

| Role | Light | Dark |
| --- | --- | --- |
{%- for ink in measured.inks %}
| {{ ink.name }}, `--cirth-{{ ink.token }}` | {{ ink.light.worst | ratio }} | {{ ink.dark.worst | ratio }} |
{%- endfor %}
{%- for edge in measured.edges %}
| {{ edge.name }} edge, `--cirth-{{ edge.token }}` | {{ edge.light.worst | ratio }} | {{ edge.dark.worst | ratio }} |
{%- endfor %}
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

## Typography and voice

### Type

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
capitals to look technical.

The name in the lockup is the one piece of lettering that is drawn rather
than set. Its outlines come from Martian Grotesk Condensed Bold, by Evil
Martians, released under the
[SIL Open Font License 1.1](https://github.com/evilmartians/grotesk), with
-1.2% tracking. It belongs to the mark, not to the interface: no page, and
no part of the framework, loads the face as a font.

There is no font to install. Cirth ships the platform's own sans and mono
stacks, `system-ui` first, and this site uses them. Serif remains
available as a primitive token for an author to opt into; it is not part
of Cirth's product voice.

Write the name as **Cirth** (capitalized, never uppercase); the npm scope
is `@cirthcss/cirth`.

### Voice

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
- **Sentences of different lengths.** Let a short one land the point a
  longer one set up. One idea to a sentence.
- **Precision without jargon.** "Clears 4.5:1 on every surface level" is
  precise. "WCAG-compliant by design" is jargon, and it promises less than
  it sounds.

The subject is a language and what it is made of, so the vocabulary is
too. Favour **semantics**, **structure**, **syntax**, **grammar**,
**vocabulary**, **sign**, **relation**, **reading**, **source** and
**output**, **native**, **token**, **baseline** and **verify**.

**Rhythm**, **voice**, **cadence** and **composition** belong to the same
family and are held to a stricter rule: use them only for something a
reader can point at. Rhythm is the flow scale and the leading of a column;
voice is the register of the copy; composition is the order in which a
page is read. Without that referent the word is decoration.

Four registers to avoid:

1. **The workshop.** Forge, forging, carved, crafted, metal, hardened,
   anvil, battle-tested, purity, and tooling or engineering used as a
   mood. Engineering stays where it is literal: the architecture, the
   browser support, the build and its tests.
2. **The minstrel as atmosphere.** "Interfaces that sing", "a living
   language", "code with soul", and any other phrase that borrows the
   story without a mechanism behind it. The origin is told once, on this
   page.
3. **The organic.** Breathing, alive, natural, fluid. A page does not
   breathe; its reading column has a leading of
   {{ measured.type.leading.relaxed if measured else "1.625" }} and a
   measure of 30em. A layout is not fluid; its gap is a `clamp()`.
4. **The unfalsifiable.** Timeless, philosophy, "nothing to break", "fully
   accessible", "always delivered in one round trip". If a sentence cannot
   be checked against a script, a measurement or a source file, it is not
   doing the work this voice is for.

Example headlines:

- "Production-ready UI from semantic HTML."
- "One stylesheet. Runtime tokens. No JavaScript runtime."
- "A size budget on every bundle, checked on every build."

Example one-line descriptions:

- "Cirth turns native HTML elements into accessible, themeable
  interfaces, with zero shipped JavaScript."
- "An HTML-native CSS framework with a runtime design token system and a
  monitored gzipped size budget."

## Using the mark

The mark is built for the places technical work puts it: a README header,
an npm listing, a favicon, a slide, a terminal banner.

Do:

- Pick the variant by what the surface can carry: colour wherever colour
  is available, mono wherever one flat ink is preferable or required.
- Match the file to the ground: the light files on light backgrounds, the
  dark files on dark ones.
- Leave clear space on every side and keep other elements out of it. Err
  generous until the definitive mark's clearspace is published.
- Use it once on a surface: in a header, on a card, at the foot of a page.
- Keep what surrounds it contemporary and technical.

Do not:

- Stretch, rotate, crop, outline or redraw it, or set the lockup's name in
  another typeface.
- Recolour it outside the published variants, or add a glow, a shadow or a
  gradient.
- Place it on a ground it has no contrast against.
- Repeat it as a pattern, a watermark, a bullet or a texture behind
  content, or use it as a generic icon.
- Turn the figure into a character: no expressions, poses, costumes or
  props.
- Pair it with fantasy or medieval imagery: runes, stone, parchment,
  blackletter. Cirth is named after a writing system, and a page that
  dresses up the reference reads as a theme rather than as a tool.

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
* pick the colour or mono variant that keeps contrast on your background;
* don't recolor, outline, rotate, add effects, or redraw the strokes,
  and don't set the name in a typeface of your own; use
  [the lockup](#downloads) rather than re-typesetting the name.

<hr />

The rest of this page is reference: the third-party logos this
documentation shows and the terms each is shown under, and the one image
the site uses.

## Framework logos

The installation guides, the Installation page and the home page name the
tools Cirth has been checked with. The name is always printed, and naming a
project to say what a guide covers needs nobody's permission. Its logo is
shown beside the name when the file comes from the project's own site, kit
or repository, is used unmodified, and no official rule asks for permission
first or forbids the use; the colours, notices and links its owner asks for
are kept. Otherwise the project is named by text alone, and the note below
says why.

Four logos are shown as nominative references, by decision: Next.js's,
Stimulus's and Blazor's, although their owners' terms ask to be asked
first, and Jakarta EE's, on the conditions its guidelines set for
nominative use. Each
identifies the guide for that project and nothing else; the note under it
gives the file's source and the day it was taken, says that the use
implies no affiliation or endorsement, and that the logo comes down if its
owner asks. None rests on the project's open source licence, which covers
code and not trademarks.

Jakarta EE and Spring Boot show the difference between a name and a logo.
The Jakarta EE guidelines allow community members nominative fair use of
the marks, so the guide for Jakarta Servlet and JSP shows the standard
Jakarta EE logo, unmodified, never the Compatible or Member logo, with no
claim of certified compatibility, and with the attribution its owner asks
for. The Spring trademark guidelines allow the name Spring Boot as a
nominative reference but reserve the logo for Broadcom, and say that using
the name does not extend to the symbol; the Spring Boot guide is named by
text alone, with no leaf, no lookalike icon and no wordmark set in another
typeface, until Broadcom gives written permission.

Some owners ask for their logo to be a link to their own site: the Django
Software Foundation, the OpenJS Foundation, the Commonhaus Foundation and
JetBrains, which names www.jetbrains.com. On a guide's own page the logo
is that link. On the Installation page every card, its logo included, is
a single link to the guide, so there the logo is a decorative picture
inside a link to this site; the maintainers decided that, and the note
under each of those projects says so.

The logos belong to their projects, appear only to name the tool a guide
covers, and do not mean that any of these projects is affiliated with Cirth
or endorses it. On a guide's page the logo links to the project's own
site, or to the address its owner names for it; on the Installation page
the whole card, logo and name, links to the guide. Every file is served from this site, never hotlinked, and none is
recoloured: a file drawn only for light backgrounds, with no official
variant for dark ones, sits on a light ground in the dark scheme.

<div class="overflow-auto docs-table-scroll" tabindex="0" role="region" aria-label="Framework logo sources and decisions">
<table>
<thead><tr><th scope="col">Project</th><th scope="col">Shown as</th><th scope="col">Owner</th><th scope="col">Source</th><th scope="col">Policy read</th><th scope="col">Checked</th></tr></thead>
<tbody>
{%- for id, mark in frameworks.marks %}
<tr><th scope="row">{{ mark.name }}</th><td>{% if mark.file %}{{ "Wordmark" if mark.wide else "Logo" }}{% if mark.nominative %}, nominative use{% endif %}{% else %}Name only{% endif %}</td><td>{{ mark.owner }}</td><td>{% if mark.file %}<a href="{{ mark.source }}">{{ mark.source | replace("https://", "") | truncate(36, true, "…") }}</a>{% if mark.darkSource %} and <a href="{{ mark.darkSource }}">its dark variant</a>{% endif %}, retrieved {{ mark.retrieved or frameworks.retrieved }}{% else %}None shown{% endif %}</td><td><a href="{{ mark.termsUrl }}">{{ mark.terms }}</a></td><td>{{ frameworks.checked }}</td></tr>
{%- endfor %}
</tbody>
</table>
</div>

{% for id, mark in frameworks.marks %}{% if mark.textOnly or mark.nominative or mark.note or mark.permission or mark.trademarkNotice %}
- **{{ mark.name }}.** {{ mark.textOnly or mark.nominative or mark.note }}{% if mark.permission %} Permission the policy asks for: {{ mark.permission }}{% endif %}{% if mark.trademarkNotice %} Notice on the guide's page: {{ mark.trademarkNotice }}{% endif %}{% if mark.alsoRead %} Also read: {% for doc in mark.alsoRead %}<a href="{{ doc.url }}">{{ doc.text }}</a>{{ ", " if not loop.last else "." }}{% endfor %}{% endif %}{% endif %}{% endfor %}

## Images

The home page uses one image, the cover of the card in its theme
demonstration. It is an original illustration made for this documentation:
an imaginary relief map, drawn by a script in the repository
([`docs/src/images/atlas-cover.html`](https://github.com/cirthcss/cirth/blob/master/docs/src/images/atlas-cover.html))
and served from this site as AVIF and WebP. It is not a photograph or a
stock image, shows no text, logo or interface, and is licensed under
Apache-2.0 with the rest of the repository.
