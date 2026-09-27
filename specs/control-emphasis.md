# Control emphasis and state

| | |
| --- | --- |
| Issue | None yet: technical-language foundations, `design/technical-language-system` |
| Status | Implementing |
| Baseline | `806fea7a` on `design/technical-language-system` |
| Breaking | Yes: the secondary variant, disabled state, focus ring, submit width, status borders and inline code change by default |

In a group of actions the primary is the heaviest element, in both schemes
and with any accent; today it is not. The filled secondary button (a dark
neutral) outweighs the primary in light, 5.99:1 against 5.18:1 on the
canvas, and ties with it in dark. Disabled controls are drawn at half
opacity, which turns the accent into a pale salmon; the focus ring is a
translucent band of the accent pressed against a fill of the same accent;
every submit button stretches to the full width of its form; status borders
fall under 3:1 on some surfaces; inline code sits in a padded chip in a
lighter ink than the sentence around it. After this change the secondary is
tonal, disabled is a neutral state with no opacity, focus is one opaque ring
separated from the fill by a gap, a submit button sizes to its label, status
borders are the status inputs themselves, and inline code is text in a
code face. Button geometry is unchanged, so swapping variants still moves
nothing.

## Grammar and tuning

| Rule (grammar) | Value (tuning) |
| --- | --- |
| Emphasis is luminance contrast against the surface: primary > secondary > outline > ghost, in every scheme and for every accent | Secondary fill: the ink at 9% over the surface it sits on (14% on hover) |
| Variants differ in paint, never in geometry | Unchanged: 44px floor, one 1px edge |
| Disabled is a state, not a transparency: a neutral fill, a quiet label, no border, no accent | Ink at 6% for the fill, ink at 50% for the label |
| Focus is one ring, opaque, ≥ 3:1, separated from the control by a gap equal to its width | `outline: var(--cirth-outline-width) solid <focus colour>`, `outline-offset: var(--cirth-outline-width)`: 2px and 2px |
| The ring takes the colour of the state it belongs to | Accent text for primary; secondary text, contrast text, error and success inputs for their variants and fields |
| A control's border and ring agree | The validation fix in `b86e7899` made this true for fields; this spec makes it the rule for every control |
| A status border is the status input; a status text is the darker/lighter derivation; a status surface is a tint | Inputs as shipped; text and surface formulas unchanged |
| Code in a sentence is text | `display: inline`, no padding, no background, body ink, 0.875em in the code face |
| One stroke for every resting edge, checkbox and radio included | 1px; the control border clears 3:1 at 1px on every level (see [surface-and-edge-model](surface-and-edge-model.md)) |

## Contract

### Variants

| Variant | Fill | Label | Edge |
| --- | --- | --- | --- |
| Primary (default) | `--cirth-primary-surface` | `--cirth-primary-on-surface` | the fill |
| `.secondary`, `[type="reset"]`, `::file-selector-button` | `oklch(from var(--cirth-ink) l c h / 9%)` over the surface | `--cirth-ink` | none (transparent, same width) |
| `.contrast` | `--cirth-contrast-surface` | `--cirth-contrast-on-surface` | the fill |
| `.danger` | as today | as today | the fill |
| `.outline`, `.ghost` | as today, over `--cirth-surface` | as today | as today |

`.contrast` and `.danger` are alternative primaries, not subordinates: a
group has one primary action, drawn in one of the three. The contract is
about the default primary against the secondary, outline and ghost next to
it.

The public tokens keep their names: `--cirth-secondary-surface` becomes the
9% wash, `--cirth-secondary-surface-active` the 14% one,
`--cirth-secondary-on-surface` the ink, `--cirth-secondary-border` and
`-border-active` transparent.

### Disabled

A disabled button, field, checkbox, radio or switch keeps its geometry, drops
its accent and its border colour, and paints a neutral wash with a label at
half the ink. Nothing is composited at an opacity: the hue of the fill does
not change, because there is no hue left to change.

`--cirth-opacity-disabled` and `--cirth-form-element-disabled-opacity` lose
their consumers and are removed.

### Focus

One rule for every focusable control Cirth styles (buttons, fields, checkbox,
radio, switch, links, `summary`, scroll containers):

```css
outline: var(--cirth-outline-width) solid var(--cirth-focus-color);
outline-offset: var(--cirth-outline-offset); /* = --cirth-outline-width */
```

`--cirth-primary-focus` becomes an alias of `--cirth-primary-text` (opaque;
it was the accent at 75% alpha in light and 80% in dark). Because the
accent text keeps 4.5:1 on every surface level for any accent (the clamp in
[surface-and-edge-model](surface-and-edge-model.md)), the ring keeps 3:1 by
construction. `--cirth-secondary-focus` and `--cirth-contrast-focus` alias
their text roles the same way; an invalid or valid field rings in its status
input.

The ring arrives instantly, as today. Under `forced-colors: active` the
browser repaints the outline in a system colour, so the transparent-outline
workaround each component carries becomes the ring itself and is deleted.

A control inside `.group` keeps the group's own ring, drawn on the group with
the same geometry, because a ring offset from one segment would overlap its
neighbours.

### Other defaults

- `button[type="submit"]` loses `width: 100%`. A form that wants a full-width
  submit says so.
- Status borders: `--cirth-error-border`, `--cirth-success-border` and
  `--cirth-warning-border` alias their inputs in both schemes, replacing six
  relative-colour derivations. Measured at 4.1:1 or more on every surface
  level; the derived ones fell to 2.82:1 on the recessed level.
- Inline `code` and `samp`: inline, no padding, no background, body ink.
  `kbd` keeps its key cap, because a key is an object. `pre` is unchanged.
- Checkbox and radio: 1px edge in the control colour, like every other
  resting edge. The switch keeps its 3px track inset, which is the thumb's
  margin rather than an edge.

### What this does not promise

- **That `.contrast` is lighter than the primary.** It is the ink, the
  heaviest thing on a light page, by design; it is a different primary, not
  a secondary.
- **A disabled label at 4.5:1.** WCAG 1.4.3 exempts inactive controls. The
  label is meant to stay legible and read as unavailable; its ratio has not
  been measured yet and is recorded at implementation.
- **The old focus colour for a consumer who set `--cirth-primary-focus`.**
  Their value still wins; if it is translucent, their ring stays translucent.

## Measurements

Chromium 149.0.7827.55, prototype over the docs at `806fea7a`. Fills are
composited over the canvas; the focus ring is its worst ratio across the
four surface levels.

| Variant | Primary fill | Secondary fill | Primary heaviest | Label on primary | Label on secondary | Focus ring | Disabled fill L / C / opacity |
| --- | --- | --- | --- | --- | --- | --- | --- |
| default light | 5.18 → **4.99** | 5.99 → **1.16** | no → **yes** | 5.60 → **5.60** | 6.47 → **8.59** | 3.10 → **4.56** | 0.75 / 0.052 / 0.5 → **0.93 / 0.004 / 1** |
| default light · more | 8.91 → **8.58** | 5.99 → **1.20** | yes → **yes** | 9.63 → **9.63** | 6.47 → **12.82** | 5.90 → **7.84** | 0.69 / 0.038 / 0.5 → **0.92 / 0.004 / 1** |
| default dark | 2.84 → **2.84** | 2.80 → **1.20** | yes → **yes** | 6.39 → **6.39** | 6.47 → **8.99** | 3.64 → **5.53** | 0.35 / 0.051 / 0.5 → **0.25 / 0.021 / 1** |
| default dark · more | 2.25 → **2.25** | 2.80 → **1.26** | no → **yes** | 8.07 → **8.07** | 6.47 → **12.85** | 5.84 → **5.53** | 0.32 / 0.045 / 0.5 → **0.26 / 0.021 / 1** |
| plain light | 5.37 → **5.37** | 6.20 → **1.17** | no → **yes** | 5.61 → **5.61** | 6.47 → **9.21** | 3.25 → **4.92** | 0.75 / 0.082 / 0.5 → **0.95 / 0.001 / 1** |
| plain dark | 3.59 → **3.59** | 2.80 → **1.20** | yes → **yes** | 5.04 → **5.04** | 6.47 → **8.98** | 4.75 → **5.79** | 0.38 / 0.057 / 0.5 → **0.25 / 0.008 / 1** |
| plain dark · more | 2.11 → **2.11** | 2.80 → **1.26** | no → **yes** | 8.58 → **8.58** | 6.47 → **12.84** | 5.88 → **9.27** | 0.31 / 0.081 / 0.5 → **0.25 / 0.008 / 1** |
| playroom light | 6.09 → **6.09** | 6.10 → **1.16** | no → **yes** | 6.46 → **6.46** | 6.47 → **8.87** | 3.45 → **5.57** | 0.74 / 0.083 / 0.5 → **0.95 / 0.012 / 1** |
| playroom dark | 2.93 → **2.93** | 2.55 → **1.27** | yes → **yes** | 5.63 → **5.63** | 6.47 → **10.53** | 3.93 → **4.84** | 0.39 / 0.069 / 0.5 → **0.29 / 0.024 / 1** |
| playroom dark · more | 1.82 → **1.82** | 2.55 → **1.29** | no → **yes** | 9.09 → **9.09** | 6.47 → **12.11** | 5.24 → **7.90** | 0.33 / 0.094 / 0.5 → **0.29 / 0.024 / 1** |
| probe light | 5.29 → **5.09** | 5.99 → **1.16** | no → **yes** | 5.72 → **5.72** | 6.47 → **8.59** | 3.19 → **4.65** | 0.73 / 0.057 / 0.5 → **0.93 / 0.004 / 1** |
| probe light · more | 5.29 → **5.09** | 5.99 → **1.20** | no → **yes** | 5.72 → **5.72** | 6.47 → **12.82** | 5.90 → **4.65** | 0.73 / 0.057 / 0.5 → **0.92 / 0.004 / 1** |
| probe dark | 3.72 → **3.72** | 2.80 → **1.20** | yes → **yes** | 4.87 → **4.87** | 6.47 → **8.99** | 4.84 → **6.01** | 0.38 / 0.046 / 0.5 → **0.25 / 0.021 / 1** |
| probe dark · more | 2.25 → **2.25** | 2.80 → **1.26** | no → **yes** | 8.07 → **8.07** | 6.47 → **12.85** | 5.84 → **6.01** | 0.32 / 0.045 / 0.5 → **0.26 / 0.021 / 1** |

The `more` rows not shown (plain and playroom in light) are "yes" before and
after and are in the evidence file. The probe has no `more` value of its own,
so under `more` it keeps its base accent, which is why its ring drops to 4.65
there while the shipped accent's rises. The disabled chroma
before is the accent at half strength (0.052 on copper: the salmon); after,
it is the ink's own trace, 0.001 to 0.024, in the ink's hue rather than the
accent's.

Status borders on the worst level: default light error 3.03 → 6.84, success
3.07 → 4.10, warning 3.31 → 5.26; playroom light error 2.90 → 6.96. The full
matrix is in [surface-and-edge-model](surface-and-edge-model.md).

## Evidence ledger

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| The filled secondary outweighs the primary | Light 5.99 against 5.18; dark 2.80 against 2.84 | Docs at `94f7c669`, Chromium 149.0.7827.55, `evidence/before-default.json` | Verified |
| Submit is full width by default | 702px in a 702px form | `/content/button/`, same run | Verified |
| Every variant is 44px with a 16px/600 label | 14 buttons measured, all 44px, all 16px/600 | Same page | Verified |
| A valid field with focus drew the accent border in a green ring | Border `rgb(157,84,52)`, ring `oklch(0.527 0.115 153)` | `/forms/validation/`, same run | Verified; fixed in `b86e7899` with `tests/forms-validity.spec.js` |
| Disabled turns the accent salmon | Copper fill at 0.5 over the stage composites to `oklch(0.751 0.052 45)` | `/content/button/`, `evidence/tables-before.json` | Verified |
| The focus ring is 2px, with no gap, in the fill's own colour | `box-shadow: … 0 0 0 2px oklch(0.527 0.107 44 / 0.75)` on a fill of `oklch(0.483 0.098 44)`; `outline-offset: 0px` | `/content/button/`, `evidence/before-default.json` | Verified |
| Inline code is a chip in the muted ink | `display: inline-block`, `padding: 4px 8px`, colour `oklch(0.527 0.031 280)`, background `oklch(0.954 0.006 44)` | `/components/card/`, same run | Verified |
| Derived status borders fall under 3:1 | 2.82 (error, light) on the recessed level of the proposed ladder; playroom error 2.90 today | Prototype and build, Chromium 149 | Verified |
| With the proposal the primary is the heaviest action in every variant, scheme and contrast mode | Table above | Prototype `prototype-source/prototype.css`, Chromium 149 | Verified |
| Outline follows `border-radius` and is repainted under forced colors in the browser floor | Chromium 94, Firefox 88 and Safari 16.4 shipped rounded outlines, all below the floor | Release notes, not reproduced here | Reported |
| The ring keeps 3:1 in Firefox and WebKit | Not measured for the prototype | Implementation acceptance | Reported |

## Decisions

| Decision | Basis | Rationale |
| --- | --- | --- |
| Tonal secondary | Design | The one channel emphasis did not use was luminance; a wash is visibly a button and never competes with the fill |
| Rejected: an outlined secondary | Design | Outline already exists as its own variant; making secondary an outline would leave two names for one look |
| Rejected: a lighter filled neutral | Design | Any opaque neutral with a white label needs about 4.5:1 against the label, which puts it near the primary's own weight again |
| Geometry identical across variants | Existing contract | Emphasis can be changed without moving layout; the paint now carries the hierarchy the geometry never did |
| Outline with an offset, not a box-shadow ring | Design | One mechanism for every control (the accordion, range, segmented control, `pre` and `.overflow-auto` already use it), no transition to suppress, repainted by forced colors without a workaround |
| Opaque ring from the text role | Constraint | A translucent ring's contrast depends on what it lands on; the text role's 4.5:1 guarantee gives 3:1 for any accent |
| Disabled without opacity | Design | Opacity composites the accent toward the canvas and changes its hue family; a neutral state says "unavailable" without inventing a colour |
| Status borders are the inputs | Design | The input is the colour the theme author chose; deriving it lighter bought nothing and failed 3:1 on darker surfaces |
| Submit sizes to its label | Design | A full-width button is a layout decision of the form, not a property of submitting |
| Inline code without a chip | Design | The face already says "code"; the chip broke the line's rhythm and its ink said the code mattered less than the prose |
| 1px checkbox and radio | Design | The control border clears 3:1 at 1px on every level; a second stroke weight for two controls was the exception the edge grammar exists to remove |

## Acceptance

- [ ] In every group of the button demo the primary has the highest
      luminance contrast against the surface, four accents, both schemes,
      with and without `more`: a new case in `tests/framework-specimen.spec.js`.
- [ ] Focus ring ≥ 3:1 against every surface level and not touching the fill
      (outline offset ≥ 2px), for buttons, fields, checkbox, radio, switch,
      link and summary, in three engines.
- [ ] A disabled control's fill has chroma ≤ 0.03 and its hue family is the
      neutral one; no computed opacity below 1 on any disabled control.
- [ ] A focused valid or invalid field: border and ring in its status colour
      (already covered for fields by `b86e7899`).
- [ ] A submit button's width equals its content width in a form.
- [ ] `tests/button-overflow.spec.js`, `tests/prefers-contrast.spec.js` and
      `tests/accessibility-resilience.spec.js` updated where they encoded the
      old values, each change explained in the commit.
- [ ] `docs/src/pages/content/button.md`, `forms/validation.md` and
      `docs/src/pages/upgrading.md` updated.

## Migration

| If you | Then |
| --- | --- |
| Relied on the dark filled secondary | Set `--cirth-secondary-surface`, `-surface-active`, `-on-surface` and `-border` to the old values |
| Relied on full-width submit buttons | Add `width: 100%` to them, or place them in a `.grid` |
| Set `--cirth-opacity-disabled` or `--cirth-form-element-disabled-opacity` | Removed. Style `[disabled]` directly if you want a different look |
| Set `--cirth-primary-focus` to a translucent colour | It still applies, as an outline; make it opaque to keep 3:1 |
| Styled inline `code` expecting the chip | Set `padding`, `background` and `display: inline-block` on it |
| Relied on 2px checkbox and radio borders | Set `--cirth-border-width` on `[type="checkbox"], [type="radio"]` |

## Open questions

1. **Hover on the tonal secondary.** 14% is a first value. Settled by the
   visual review at implementation, with the rule that hover stays below the
   primary's resting weight.
2. **The switch.** Its track is a fill, not an edge; it follows the control
   colour when unchecked. Whether its thumb inset should become 2px to match
   the ring is left to implementation.
