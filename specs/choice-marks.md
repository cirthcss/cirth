# Choice marks

| | |
| --- | --- |
| Issue | None yet: documentation redesign, `design/technical-language-system` |
| Status | Implemented: every acceptance check passes on this tree (2026-10-03); lands with the branch |
| Baseline | `a0c077e5` on `design/technical-language-system` |
| Breaking | Yes: the drawing of every checkbox and radio changes, and a wrapping label gains a hanging indent; no token renamed, removed or added |
| Decisions | 2026-10-01, maintainer: radios look oversized, empty and set down at random beside their label, and inside `.segmented` they read as stray circles |

A radio and a checkbox keep their 24px box, which is the target, and draw a
20px mark inside it instead of filling it. A checked radio is the accent
with a dot in the label colour, the same family as a checked checkbox; an
unchecked one answers a pointer; its focus ring sits 2px off the mark like
every other control's; and the mark is centred on the first line's capital
height rather than on its box. A label that wraps hangs its later lines
under its first word instead of under the mark. Inside `.segmented`, the
chosen segment's radio is a ring and a dot in the label colour. Anyone with
checkboxes or radios sees the new drawing; nothing an author wrote stops
working.

## The problem

Measured on `dist/cirth.css` from `a0c077e5`, default theme and the three
presets, Chromium 149.0.7827.55, Firefox 151.0 and WebKit 26.5. Captures:
`~/crithcss/cirth-captures/choice-marks/before-*.png`.

- **The mark is the whole target.** The 24px box that WCAG 2.5.8 asks of
  the control is drawn edge to edge, so beside 16px text a radio is a
  circle one and a half times the text's line height across: the largest
  thing in the row.
- **Checked is a ring 6.7px thick.** The selection is drawn as a border of
  0.42em around a light centre, which reads as a donut rather than as a
  chosen option, and, disabled, as a grey one.
- **Nothing answers a pointer.** Every other control in the library has a
  hover state; a radio and a checkbox had none.
- **The mark sits 0.4px below the capital height's centre** of its first
  line in all three engines (0.42, 0.44, 0.41), and a label that wraps puts
  its second line under the mark, at the label's edge.
- **In `.segmented`** an unchosen segment carries an empty 24px circle and
  the chosen one a white disc on the accent: the circles are the loudest
  thing in the control and say nothing about which is chosen.

## Contract

### The mark

| | Before | After |
| --- | --- | --- |
| Box (the target) | 1.5em, drawn | 1.5em, not drawn: a transparent 0.125em band |
| Mark | 1.5em | 1.25em, inside the band |
| Edge | `--cirth-border-width` border | the same width and colour, drawn as an inset ring of the mark |
| Gap to the label's text | 0.5em margin and a space | 0.125em margin and a space, about 0.5em from the mark |
| Checkbox corner | `--cirth-checkbox-border-radius` on the box | the same radius on the mark |

The box, its width, height and margin-top are what layout sees, so a row of
controls does not move; only the drawing shrinks.

### States

| State | Radio | Checkbox |
| --- | --- | --- |
| Unchecked | Control edge on the field's surface | Same |
| Hover, unchecked (pointer devices) | Edge 55% of the way to the ink, and a 6% wash of the ink | Same |
| Checked | Accent fill and edge, a 0.5em dot in `--cirth-primary-on-surface` | Accent fill and edge, the check mark, unchanged |
| Hover, checked | `--cirth-primary-surface-active` fill and `-border-active` edge | Same |
| Focus | The focus ring, offset 0 from the box, so 2px from the mark, on `:focus` (see [Focus](#focus)) | The same ring, on `:focus-visible` |
| Disabled | The disabled wash, the separator for an edge | Same |
| Disabled, checked | The wash, `--cirth-disabled-color` edge and dot | Wash, disabled mark, unchanged |
| `aria-invalid="true"` or `:user-invalid` | Invalid edge; checked, the invalid colour fills | Same, unchanged for the checkbox |
| `aria-invalid="false"`, checked | The valid colour fills | Same, unchanged for the checkbox |

The dot is the selection's non-colour signal: a checked radio differs from
an unchecked one in shape, not only in hue. Hover is limited to fine
pointers, as the field hover is, and a label under the pointer counts as
the control.

### Alignment

A checkbox or radio that is the first element in its label is centred on
the capital height of the label's first line, and the label hangs: its
inline-start padding and negative text indent are both 1.875em, the box,
the margin and a space, so a second line starts under the first word. A
switch, which is wider, is unchanged. A label in `fieldset.segmented` keeps
the segment's own padding and is centred by its flex box.

### Focus

A radio draws its ring on `:focus`; a checkbox, on `:focus-visible`. WebKit
does not match `:focus-visible` on a radio its arrow keys moved to, and no
CSS state tells keyboard focus from pointer focus, so the radio's ring is
keyed to the one state every engine sets when focus lands on it. The
cost, accepted: in Chromium and Firefox a radio focused by a click shows
the ring until focus moves on. WebKit does not focus a radio on click, so
there it shows only for the keyboard. A checkbox is reached with Tab,
which every engine marks `:focus-visible`, and keeps the narrower rule.

Inside `fieldset.segmented` the segment draws the ring, on
`:has(:focus-visible, [type="radio"]:focus)`, and the radio inside it draws
none: two rings, one on the accent fill, read as a fault.

### Forced colours

The mark's ring is a box shadow, which forced colours removes, so the box's
own border takes `CanvasText` there, and `GrayText` when disabled; the
radio's dot is `CanvasText`.

### Segmented

A chosen segment keeps the primary fill. Its radio becomes a ring and a dot
in `--cirth-primary-on-surface`, transparent between them, so the choice is
marked by a shape on the accent rather than by a white disc. Unchosen
segments keep the plain unchecked radio. Segment geometry, focus and
disabled states are unchanged.

### What this does not promise

- **A 24px mark.** The target is 24px; the drawing is 20px. A design that
  wants the old size sets `width` and `height` on the input to 1.75em.
- **The hanging indent in a label that is a flex or grid container.** Its
  items are laid out by the container; set `padding-inline-start: 0` and
  `text-indent: 0` on such a label, as this site does for its own rows of
  choices.
- **Exact first-word alignment for every face.** The indent assumes a space
  of about a quarter em; measured, the second line lands within 0.5px of the
  first word in all three engines with the system face.

## Measurements

Prototype over `dist/` from `a0c077e5`, the label in the default theme at
16px. "Cap offset" is the mark's centre minus the centre of the capital
height of the first line; positive is lower.

| Engine | Cap offset before | Cap offset after | First word, second line before | After |
| --- | --- | --- | --- | --- |
| Chromium 149.0.7827.55 | +0.42px | **−0.08px** | 52.19px, 16px | **46.19px, 46px** |
| Firefox 151.0 | +0.44px | **−0.06px** | 52.5px, 16px | **46.5px, 46px** |
| WebKit 26.5 | +0.41px | **−0.09px** | 52px, 16px | **46px, 46px** |

Inside `fieldset.segmented`, centred by the label's flex box: −0.36px,
−0.36px and −0.37px.

## Evidence ledger

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| Before, the drawn mark is the 24px box and the checked radio a 0.42em ring | Computed `width` 24px, `border-width` 6.72px checked | `dist/cirth.css` from `a0c077e5`, Chromium 149.0.7827.55 | Verified |
| Before, radio and checkbox have no hover state | The field hover rule excludes `[type="checkbox"], [type="radio"]`; captures show no change under the pointer | Same | Verified |
| After, the mark centres on the cap height within 0.1px | Table above | Prototype, three engines | Verified |
| After, a wrapped line starts within 0.5px of the first word | Table above | Prototype, three engines | Verified |
| A space is about a quarter em in the system face | 4.19px in Chromium and WebKit, 4.5px in Firefox, at 16px | Canvas `measureText(" ")`, three engines | Verified |
| The hanging indent left a segmented label alone | It did not at first: the indent's selector outweighed `fieldset.segmented > label`, and the text ran over the radio | Prototype, Chromium 149.0.7827.55 | Invalid |
| With the indent's selector at zero weight, a segment keeps its padding | Captures, default, material, metro, plain, both schemes | Same | Verified |
| Under forced colours the checked radio keeps a visible dot and every mark an edge | `forcedColors: "active"`, both schemes | Same | Verified |
| The implementation paints what the prototype painted | Cap offsets −0.08, −0.06, −0.09px and wrapped lines at 46.19, 46.5, 46px, identical to the prototype; segmented −0.36, −0.36, −0.37px; captures of default, material, metro and plain in both schemes and forced colours match | `dist/cirth.css` from this change, Chromium 149.0.7827.55, Firefox 151.0, WebKit 26.5 | Verified |
| Box, mark, edge, states, focus offset, alignment, segmented and forced colours as the contract says | `tests/choice-marks.spec.js`: 10 tests per engine, every shipped theme; the forced-colours test runs where the emulation exists | Chromium 149.0.7827.55, Firefox 151.0, WebKit 26.5 | Verified |
| A checkbox's corner is still the small mark's | `tests/radius-relations.spec.js` reads the drawn corner (the box's less the band, clamped at zero): 72 tests pass | Same | Verified |
| The keyboard's ring shows on every radio it reaches | Not in WebKit: a radio the arrow keys move to does not match `:focus-visible` there, for this drawing and the one before it, so no ring is drawn; the first radio, reached with Option+Tab, has one | WebKit 26.5, ring keyed to `:focus-visible` | Invalid |
| With the ring keyed to `:focus`, the keyboard's ring shows on every radio it reaches | After Tab and after each arrow key the focused radio paints a solid ring, in all three engines; inside `.segmented` the segment paints it and the radio does not; at page zoom 2 and 4; on a radio whose label wraps; and, in Chromium's forced-colors emulation, in a system colour | `tests/choice-marks.spec.js`, `dist/cirth.css` from this change, Chromium 149.0.7827.55, Firefox 151.0, WebKit 26.5 | Verified |
| A click focuses a radio | In Chromium and Firefox, yes, and the ring shows (the compromise); in WebKit focus stays where it was | Same run | Verified |
| Before the change, WebKit lost the segment's ring too | After an arrow key in `.segmented`, neither the radio nor the segment painted a ring, and the radio inside a Tab-focused segment drew a second ring on the accent | Probe over `dist/cirth.css` before this change, WebKit 26.5 and Chromium 149.0.7827.55 | Verified |
| The change fits the size budgets | `cirth.min.css` 14770 → 15092 B gzip (108 B left of 15200), `cirth.scoped.min.css` 15340 B (60 B left of 15400), classless 13070 B, classless scoped 13246 B | `npm run check:size` over `dist/` built from this change, 2026-10-02 | Verified |
| No build carries an empty functional pseudo-class | `[aria-current]` written into the button's state list compiled to `::file-selector-button:is()` in every build; it now sits in a rule of its own, and `check:dist` fails any empty `:is()`, `:where()`, `:not()` or `:has()` in the expanded and minified files | `npm run check:dist` over `dist/` from this change and over `dist/` from `a0c077e5` (fails there, as it should) | Verified |
| The whole behaviour suite passes with the change | 1796 tests pass and 13 are skipped by design, none retried, across `tests/choice-marks.spec.js`, `tests/segmented.spec.js`, `tests/radius-relations.spec.js` and every other behaviour spec | `npm run check:behavior` on this tree, 2026-10-02, Chromium 149.0.7827.55, Firefox 151.0, WebKit 26.5 | Verified |
| The work leaves no dead CSS of its own in the documentation | `docs/src/styles/style.css`: 1099 declarations over 1584 renderings, 847 live, 86 inert (84 confirmed in Firefox, WebKit and under Material; taken out together they move the Installation page in Firefox, so they are not one deletion), 94 never matched, 70 not observable. `home.css`: 377 declarations, 236 live, 51 inert (50 confirmed; taken out together they move nothing). Of what this work added, the unused logo-list rules and six declarations inert in every engine by pixels as well as by layout were removed, and the visual suite stayed at 1078 passing | `scripts/audit-dead-css.js` and `scripts/verify-dead-css.js` over `docs/dist` built from this tree, 2026-10-02 and 2026-10-03; the `home.css` run limited to the home page, the only page that links it | Verified |
| Every capture the drawing changes was updated, and nothing else | The visual suite against `a0c077e5`'s macOS baselines differs in 367 captures, all on pages that draw a checkbox, a radio or a segment, the guides, or the home page; captures last committed before the palette F commit (`f7fc5d2aa`) that still pass within Playwright's default threshold were left as committed. After the update, 1078 pass and 26 are skipped by design | `npx playwright test` (12 macOS projects), Chromium 149.0.7827.55, Firefox 151.0, WebKit 26.5 | Verified |

## Decisions

| Decision | Basis | Rationale |
| --- | --- | --- |
| A radio's ring on `:focus` | Constraint | WebKit's `:focus-visible` misses arrow-key focus in a radio group; the library is CSS only, so no modality script and no engine detection |
| Rejected: `:focus:not(:hover)` and similar pointer guesses | Design | They hide the keyboard's ring whenever the pointer happens to rest on the radio or its label; keyboard visibility comes first |
| Rejected: keeping `:focus-visible` and documenting WebKit | Design | A keyboard user in Safari loses the indicator after one key, which is a WCAG 2.4.7 failure, not a footnote |
| Keep the 24px box, draw a 20px mark | Existing contract | The box is the WCAG 2.5.8 target "without relying on the adjacent label" (forms/_checkbox-radio-switch.scss); the drawing is what read as oversized |
| Edge as an inset ring, not the border | Constraint | The border is now the transparent band; the ring keeps `--cirth-border-width` and `--cirth-border-color`, so every state that rebinds the edge still reaches it |
| Rejected: a 20px box | Existing contract | It would leave the target to the label |
| Checked radio as accent fill and dot | Design | The same family as the checked checkbox and the switch beside it; the dot is the non-colour signal |
| Rejected: ring and dot (Material, Fluent) for the plain radio | Design | Beside a filled checkbox it reads as a second, lighter family; kept only on the accent of a segment, where a fill cannot show |
| Checkbox shrinks with the radio | Design | One size for the two marks that sit side by side in forms |
| Hanging indent | Design | A wrapped option lines up under its own text, as in every platform's native checkbox |
| The indent's selector at zero specificity | Constraint | Any author or component rule on a label's padding has to win, `.segmented` first |
| No new token | Existing contract | Sizes are em fractions of the existing box; colours are the existing roles |

## Acceptance

- [x] Box 1.5em, mark 1.25em, edge `--cirth-border-width`, in Chromium,
      Firefox and WebKit: `tests/choice-marks.spec.js`.
- [x] Checked radio: accent fill, dot present; disabled and invalid as the
      table says; hover changes the edge on a fine pointer.
- [x] Focus ring 2px from the mark.
- [x] The ring after Tab, after arrow keys and after a click, plain and
      segmented, at zoom 2 and 4, under forced colours, in three engines:
      `tests/choice-marks.spec.js`.
- [x] Mark centred on the cap height within 1px; a wrapped line within 1px
      of the first word.
- [x] Segmented: chosen radio drawn as ring and dot; segment padding kept
      (`tests/segmented.spec.js` checks the dot rather than a thick border).
- [x] Forced colours: border and dot in system colours.
- [x] `npm run check:size` within every budget; `tests/radius-relations.spec.js`
      reads the mark's corner.
- [x] `docs/src/pages/forms/checkbox-radio-switch.md` and `upgrading.md`
      describe the drawing.
- [x] The interactive state matrix (`tests/visual.spec.js`) captures a radio
      at rest, hovered, focused and checked, per theme and scheme.

## Migration

| If you | Then |
| --- | --- |
| Set your own size on checkboxes or radios | It still applies to the box; the mark is the box less 0.125em on each side |
| Laid a checkbox or radio label out with flex or grid | Set `padding-inline-start: 0` and `text-indent: 0` on it |
| Relied on the thick checked ring | It is a fill and a dot now; nothing to set |

## Open questions

1. **Should the switch hang its label too?** It is 2.7em wide, and a
   wrapped switch label is rare. Left as it is until one is reported.
