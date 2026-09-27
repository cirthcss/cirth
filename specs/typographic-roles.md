# Typographic roles

| | |
| --- | --- |
| Issue | None yet: technical-language foundations, `design/technical-language-system` |
| Status | Implementing |
| Baseline | `806fea7a` on `design/technical-language-system` |
| Breaking | Yes: default weights, sizes and inks of headings, labels, legends, table headers and code change; two tracking tokens are replaced |

Type is assigned by role, not by element or by habit. Eight roles (display,
heading, title, body, label, group, meta, code/data) each own a size, a
weight, a line height, a tracking rule and an ink step, and every role
differs from its neighbours on at least two of those channels. Today the
same 700 weight runs from 12px to 70px, labels, legends and option labels
are all 16px/500, and muted text, secondary text and code share one colour
in light. After this change a legend outranks the labels under it, a button
is a label rather than a heading, a table header reads as metadata, code
reads as content, and tracking and leading follow size through declared
relations instead of per-element literals. Pages that use the default type
see new weights and a slightly smaller heading ladder; a consumer who set
`--cirth-font-size` on a heading keeps it.

## Grammar and tuning

| Rule (grammar) | Value (tuning) |
| --- | --- |
| Every text element maps to exactly one role | The mapping table below |
| A role differs from the next one on at least two of size, weight, ink step, tracking | Checked per pair in the role table |
| Tracking is a function of size, declared once: positive below the body size, zero at it, negative above | `letter-spacing: calc(var(--cirth-tracking-optical) * (1rem - 1em))`, with `--cirth-tracking-optical: 0.04`. That is +0.009em at 13px, 0 at 16px, −0.018em at 28px, −0.024em at 40px, −0.03em at 64px |
| Leading narrows as size grows, and widens with the length of what is read | Headings `tight` (1.125), titles `snug` (1.25), controls and application body `normal` (1.5), long-form reading `relaxed` (1.625): the existing line-height scale, assigned by role |
| The heading ladder compresses at small widths | Fluid clamps whose minimums sit closer together than their maximums: 28/22/19 at 390px against 40/28/22 at 1440px |
| Weight by role, never by element habit | 650 heading and display, 600 title and group, 500 label and meta, 400 body and code; `<strong>` is 600 |
| Four ink steps with named jobs | Strong (headings), ink (body and code), secondary (secondary actions), muted (metadata and placeholders) |
| Monospace for code and data only | `pre`, `code`, `kbd`, `samp`, `var`; tabular figures in tables |
| A field's value is never below 16px | `font-size: max(var(--cirth-font-size-md), 16px)`: iOS zooms into anything smaller |

## Contract

### Roles

| Role | Elements | Size | Weight | Leading | Ink |
| --- | --- | --- | --- | --- | --- |
| Display | none by default; opt in with the tokens (the documentation home page does) | `clamp(2.5rem, 1.5rem + 3.5vw, 4rem)` | 650 | tight | strong |
| Heading | `h1`, `h2` | `clamp(1.75rem, 1.35rem + 1.6vw, 2.5rem)`, `clamp(1.375rem, 1.2rem + 0.75vw, 1.75rem)` | 650 | tight | strong |
| Title | `h3`, `h4`; `h5`, `h6` at body and small size | `clamp(1.1875rem, 1.1rem + 0.35vw, 1.375rem)`, 1.125rem, 1rem, 0.875rem | 600 | snug | strong (h3, h4), ink (h5, h6) |
| Body | running text, `td`, `dd`, option labels (a `label` wrapping a checkbox or radio) | 1rem | 400 | normal, relaxed in reading columns | ink |
| Label | field `label`, buttons, `summary`, `dt`, the current nav item | 0.875rem for field labels; 1rem for control text | 500 | normal | ink |
| Group | `fieldset > legend` | 1rem | 600 | normal | strong |
| Meta | `thead`/`tfoot` cells, `figcaption`, help text after a field, a blockquote's `footer` | 0.8125rem | 500 | normal | muted |
| Code and data | `pre`, `code`, `kbd`, `samp`, `var` | 0.875em | 400 | inherited; relaxed inside `pre` | ink |

Channels per neighbouring pair: heading/title differ by size, weight and
tracking; title/body by size, weight and ink; label/body by size and
weight; group/label by size, weight and ink; meta/body by size, weight, ink
and tracking; code/body by size and face.

### Tokens

| Token | Status | Value |
| --- | --- | --- |
| `--cirth-ink-strong` | New input | `light-dark($neutral-900, $neutral-50)` |
| `--cirth-h1-color` … `--cirth-h4-color` | Redefined | `var(--cirth-ink-strong)` (was a six-step fade from 900 to 650) |
| `--cirth-h5-color`, `--cirth-h6-color` | Redefined | `var(--cirth-ink)` |
| `--cirth-muted-color` | Redefined | neutral 600 in light (was 550), 350 in dark (was 400) |
| `--cirth-secondary-text` | Redefined | neutral 650 in light (was 550), 300 in dark (was 350) |
| `--cirth-code-color` | Redefined | `var(--cirth-ink)` (was the muted value) |
| `--cirth-tracking-optical` | New | `0.04` |
| `--cirth-letter-spacing-tight`, `--cirth-letter-spacing-snug` | Removed | Replaced by the relation; `--cirth-letter-spacing` stays as the per-element slot |
| `--cirth-display-font-size`, `--cirth-display-font-weight`, `--cirth-heading-font-weight`, `--cirth-title-font-weight`, `--cirth-label-font-size`, `--cirth-meta-font-size` | New | As in the role table |
| `--cirth-form-label-font-weight` | Kept, becomes the label role's weight (500) | Legends read `--cirth-title-font-weight` instead |

Under `prefers-contrast: more` the heading ramp already collapses onto the
body ink; it now collapses by setting `--cirth-ink-strong` and `--cirth-ink`,
and secondary and muted meet at one AAA step. There they are equal by
declaration: the pass exists to stop spending contrast on subtlety.

### What this does not promise

- **A given number of size/weight pairs on a page.** The role count bounds
  what the library emits; a page that adds its own sizes adds pairs.
- **650 on every platform.** System faces with variable weights (San
  Francisco, Segoe UI Variable) render 650; a static family falls to 700 by
  the font-matching rules, which is the old value.
- **Tracking inheritance.** `letter-spacing` inherits as a computed length,
  so the relation is applied on each role element, not on the root. A
  consumer's letter-spacing on a container reaches plain text as before and
  stops at a role element, as it did at a heading.

## Measurements

### Inks, worst level

Chromium 149.0.7827.55, prototype over the docs at `806fea7a`, worst of the
four surface levels from [surface-and-edge-model](surface-and-edge-model.md).

| Variant | Body ink | Headings | Secondary | Muted | Code |
| --- | --- | --- | --- | --- | --- |
| default light | 9.83 → **9.14** | 15.10 → **14.05** | 4.72 → **6.36** | 4.72 → **5.27** | 4.72 → **9.14** |
| default light · more | 15.10 → **14.05** | 15.10 → **14.05** | 8.24 → **7.66** | 8.24 → **7.66** | 9.83 → **14.05** |
| default dark | 9.73 → **8.54** | 14.64 → **12.84** | 6.10 → **6.30** | 5.19 → **5.35** | 5.19 → **8.54** |
| default dark · more | 9.73 → **12.84** | 14.64 → **12.84** | 6.10 → **7.35** | 5.19 → **7.35** | 5.19 → **12.84** |
| plain light | 10.21 → **9.86** | 15.69 → **15.14** | 4.90 → **6.85** | 4.90 → **5.68** | 4.90 → **9.86** |
| plain dark | 9.80 → **8.54** | 14.74 → **12.84** | 6.14 → **6.29** | 5.23 → **5.35** | 5.23 → **8.54** |
| playroom light | 9.74 → **9.46** | 15.32 → **14.88** | 4.79 → **6.74** | 4.96 → **4.82** | 4.79 → **9.46** |
| playroom dark | 11.93 → **10.22** | 13.14 → **11.25** | 5.47 → **5.52** | 5.45 → **4.66** | 4.66 → **10.22** |
| probe light | 9.83 → **9.14** | 15.10 → **14.05** | 4.72 → **6.36** | 4.72 → **5.27** | 4.72 → **9.14** |
| probe dark | 9.73 → **8.54** | 14.64 → **12.84** | 6.10 → **6.30** | 5.19 → **5.35** | 5.19 → **8.54** |

Body ink falls in light because the canvas steps down, not because the ink
moves. Playroom sets its own ink and muted colour, which stay above 4.5:1.

### Census

Distinct (font-size, font-weight) pairs among rendered elements that own a
visible text node, at 1440px, whole page and inside the reading column only,
on the docs at `806fea7a` (the home page there has already lost the
decorations removed in `363a9ba7`, hence 19 rather than the 20 measured at
`94f7c669`).

| Page | Before, page / column | Prototype, page / column |
| --- | --- | --- |
| `/components/card/` | 12 / 10 | 11 / 10 |
| `/forms/text-inputs/` | 12 / 10 | 11 / 10 |
| `/content/table/` | 11 / 9 | 11 / 10 |
| `/customization/` | 13 / 11 | 13 / 12 |
| `/` | 19 / n/a | 21 / n/a |

The count barely moves, and that is the finding: the problem was never the
number of pairs on a docs page but that the pairs did not mean anything (700
at 12, 14, 16, 24, 32 and 44px). The remaining excess is the documentation
shell's own type (sidebar, outline, captions, footer), which the documentation
work that follows these specs brings onto the same roles.

## Evidence ledger

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| The Card page carries 16 size/weight pairs and the home page 26 | This census counts 12 and 20 on the same pages | Docs at `94f7c669`, Chromium 149.0.7827.55, `evidence/before-default.json` | Invalid |
| Weight 700 spans from 14px to 70px on the home page | 700 appears at 12, 14, 16, 20, 24, 32, 36 and 70px | Same run | Verified, with a lower bound of 12px |
| Field labels, legends and checkbox labels are all 16px/500 | `legend` 16px/500, a checkbox's `label` 16px/500, a field `label` 16px/500 | `/forms/checkbox-radio-switch/` and `/forms/text-inputs/`, same run | Verified |
| Buttons, summaries, table heads, `dt`, sidebar and outline are semibold | Buttons 16px/600, demo `summary` 16px/600, sidebar group 14px/600, outline link 14px/600; `th` and `dt` from `src/theme/_styles.scss:353` and `src/content/_typography.scss:187` | Same run; source at `806fea7a` | Verified |
| Muted text, secondary text and code share one value | Light: all three `oklch(0.527 0.031 280)`. Dark: muted and code `oklch(0.657 0.025 280)`, secondary `oklch(0.699 0.022 280)` | Same run | Verified in light; Invalid in dark |
| The library has no meta, label or data role | No token or rule assigns one; the documentation invents a monospace uppercase voice in `docs/src/styles/style.css` and `home.css` | Source at `94f7c669` | Verified |
| The proposed inks clear AA on every level in every variant | Table above | Prototype, Chromium 149 | Verified |
| The census after the prototype | Table above | `prototype-source/census.js`, Chromium 149 | Verified |
| 650 falls back to 700 on static families | CSS Fonts 4 font-matching for weights above 500 | Specification text, not reproduced on a static-font machine here | Reported |

## Decisions

| Decision | Basis | Rationale |
| --- | --- | --- |
| Tracking as one relation of size, not a value per heading | Design | The correction is optical, so it belongs to size; declaring it once covers headings, labels and meta and any size a consumer sets |
| Rejected: tracking tokens per role | Design | Eight literals that would drift out of step with the sizes they correct |
| Rejected: a length-based line height at the root (`1em + 0.5rem`) | Existing contract | `line-height` would inherit as a computed length and overlap the lines of any consumer block with a larger font |
| Headings at 650, not 700 | Design | The weight carries the role; at 40px, 700 in a system face reads as a poster |
| Buttons at 500 | Design | A button is a label for an action, not a heading; the fill carries its emphasis |
| Legend above labels | Design | A legend names a group of fields; it has to outrank each field's own name |
| Table headers in meta | Design | Column names are metadata about the cells, which are the content |
| Code in body ink | Design | Code is content; the muted ink told the reader it mattered less than the sentence around it |
| Rejected: a monospace label or annotation voice | Design | Monospace is for code and data; a voice made of capitals and a code face is decoration |
| h5 and h6 in body ink | Design | At body size a strong ink is the only thing separating them from bold text |

## Acceptance

- [ ] The role table holds on the built CSS: sizes, weights, leading and ink
      per element, in the default, classless and scoped builds:
      `tests/native-element-defaults.spec.js`, extended.
- [ ] Tracking measured at 13, 16, 28, 40 and 64px equals the relation.
- [ ] Field value font-size ≥ 16px with `--cirth-font-size-md` set to 14px.
- [ ] No text below 4.5:1 on any level, four accents, both schemes, with and
      without `more`.
- [ ] Every docs page at most about 10 pairs by the census above, after the
      shell work.
- [ ] `docs/src/pages/content/typography.md` documents the roles;
      `docs/src/pages/upgrading.md` carries the migration.

## Migration

| If you | Then |
| --- | --- |
| Set `--cirth-letter-spacing-tight` or `-snug` | Set `--cirth-tracking-optical` (0 turns the correction off), or `--cirth-letter-spacing` on the element |
| Relied on headings at 700 | Set `--cirth-heading-font-weight` and `--cirth-title-font-weight` to 700 |
| Relied on buttons at 600 | Set `--cirth-font-weight` on your buttons |
| Styled `th` in `thead` as body text | Set `font-size` and `color` on it; the meta role is a default |
| Relied on the heading colour fade h1 → h6 | Set `--cirth-h1-color` … `--cirth-h6-color` |
| Read `--cirth-code-color` as the muted ink | It is the body ink |

## Open questions

1. **Display role consumers.** No element takes it by default. Offering a
   class for it would be the first typographic class in the library;
   proposed: tokens only.
2. **Field labels at 14px.** Smaller than the value they name, which is the
   usual hierarchy, but a reader who scales text only through `rem` gets
   both larger. Settled if the label role's size is in `rem` (proposed).
