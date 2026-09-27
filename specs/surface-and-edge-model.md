# Surface levels and edge roles

| | |
| --- | --- |
| Issue | None yet: technical-language foundations, `design/technical-language-system` |
| Status | Implementing |
| Baseline | `806fea7a` on `design/technical-language-system` (token values identical to `94f7c669`) |
| Breaking | Yes: custom property defaults redefined, two removed, four added |
| Decisions | 2026-09-27, maintainer: nothing frozen except accent hues; size budget not a constraint |

The page is built from four named surface levels (recessed, canvas, raised,
overlay) and three named edge roles (separator, container, control), each a
token with a declared relation to the canvas. Today the levels sit 1.03 to
1.06:1 from the canvas in light, so a card, a field and a code block are
told apart by their borders alone, and those borders run the wrong way
round in temperature (cool lines on a warm page) and, under
`prefers-contrast: more`, in strength. After this change the light canvas
steps down a little so the raised level has room above it, every level
roughly doubles its distance, fields stop being recessed and take the
surface they sit on, edges are made of the canvas they divide, and overlays
(modal included) share one elevation. Anyone who reads or overrides a
surface or border token sees new values; anyone who only sets
`--cirth-primary` or `--cirth-canvas` gets the new hierarchy for free.

## Grammar and tuning

The rules are the engineered part and are stated as tokens and relations.
The values are tuned by eye and by measurement, and each is declared where
it is set, never left as a local exception.

| Rule (grammar) | Value (tuning) |
| --- | --- |
| Four surface levels, ordered recessed < canvas < raised ≤ overlay in light and recessed < canvas < raised < overlay in dark | Light: −0.03 L below the canvas, and 85% of the way from the canvas to white with half its chroma. Dark: −0.035, +0.05, +0.085 L |
| Every level derives from `--cirth-canvas` at runtime, so a preset or consumer canvas carries the whole ladder | The light canvas default moves from L 97.3% to 96%; hue 44° and chroma 0.006 are unchanged |
| A control paints the surface under it (`--cirth-surface`, inherited, rebound by containers); only its border says "control" | Nothing to tune: the relation is the value |
| Three edge roles, separator < container ≤ control on every level | Separator −0.08 / +0.12 L from the canvas; control −0.36 / +0.41; container 25% of the way from separator to control |
| Edges carry the canvas's hue and chroma; ink stays in the neutral family | Chroma is the canvas's own, unscaled |
| Overlay elevation is one thing: the overlay level, the container edge and one shadow. A card never casts one | Two shadow layers, contact and ambient, dark alpha ×4 as before |
| Accent text keeps AA on every level for any accent | The derived text role clamps lightness: at most 0.53 in light, at least 0.72 in dark |

## The probe accent

Every measurement in this spec and the three that follow it
([typographic-roles](typographic-roles.md), [control-emphasis](control-emphasis.md),
[container-owned-flow](container-owned-flow.md)) is taken with four accents:
the shipped copper, the `plain` preset (blue, 258°), the `playroom` preset
(violet, 300°) and a probe:

```css
:root { --cirth-primary: light-dark(oklch(50% 0.09 200deg), oklch(72% 0.1 200deg)); }
```

A teal, 156° from copper and 178° from the error hue, chosen so that no
structural value can be tuned to copper without the probe noticing. It is
used in captures and tests only and is never published.

## Contract

### Surface levels

| Token | Light | Dark | Painted by |
| --- | --- | --- | --- |
| `--cirth-canvas` (input) | `oklch(96% 0.006 44deg)`, was 97.3% | `oklch(20.15% 0.0225 280deg)`, unchanged | the page |
| `--cirth-surface-recessed` (new) | canvas −0.03 L | canvas −0.035 L | `<pre>`, the recessed band a document puts code or a specimen in |
| `--cirth-surface-raised` (new) | canvas + 85% of the distance to white, chroma ×0.5 | canvas +0.05 L | `<article>` |
| `--cirth-surface-overlay` (new) | the raised value | canvas +0.085 L | `dialog > article`, `[popover]`, a dropdown's list |
| `--cirth-surface` (new, inherited) | the level an element sits on: the canvas at the root, rebound by every container above | same | fields, outline buttons |

The component tokens keep their names and alias a level:
`--cirth-card-background-color` → raised, `--cirth-code-background-color` →
recessed, `--cirth-dropdown-background-color` and
`--cirth-popover-background-color` → overlay. The card band
(`--cirth-card-sectioning-background-color`) sits halfway between the
canvas and the raised level.

A field (`input`, `select`, `textarea`) paints
`var(--cirth-form-element-background-color, var(--cirth-surface))`. The
first is no longer declared by default, so a field is the colour of the card,
modal or page it is in and its border alone marks it; a consumer who sets the
token still gets a fill. `--cirth-form-element-active-background-color` is
removed: focus no longer changes the fill (see
[control-emphasis](control-emphasis.md)).

### Edge roles

| Role | Token | Light | Dark | Used by |
| --- | --- | --- | --- | --- |
| Separator | `--cirth-muted-border-color` | canvas −0.08 L | canvas +0.12 L | `<hr>`, table rules (`--cirth-table-border-color` now aliases it), blockquote rule |
| Container | `--cirth-card-border-color` | `color-mix(in oklab, separator, control 25%)` | same | card, `<pre>`, dropdown, popover, dialog |
| Control | `--cirth-form-element-border-color` | canvas −0.36 L | canvas +0.41 L | fields, checkbox, radio, unchecked switch track, progress and meter frame |

The container is a relation, not a third number, so the order holds when a
preset overrides one end: playroom sets its own separator, and before this
change its separator came out stronger than the container under
`prefers-contrast: more`.

Under `prefers-contrast: more` the separator moves to −0.34 / +0.30 and the
control to −0.56 / +0.55; the container follows through the relation.

### Elevation

- `<article>` casts no shadow, as today.
- `dialog > article`, `[popover]` and the dropdown list paint the overlay
  level, the container edge and `--cirth-box-shadow`. The modal gains it; it
  had none.
- `--cirth-box-shadow` goes from seven layers to two: a 1px contact shadow and
  a wide ambient one, with the dark alpha still four times the light. The
  [dark elevation](dark-elevation-shadow.md) contract (the dark ΔL two pixels
  under a panel is at least 0.75 of the light one) is re-verified against the
  new geometry, not relaxed.

### Accent text

`--cirth-primary-text` becomes
`oklch(from var(--cirth-primary) min(l, 0.53) c h)` in light and
`max(l, 0.72)` in dark. `--cirth-primary` itself is untouched, byte for
byte, in light, dark and `prefers-contrast: more`. The clamp is what lets the
levels move without tuning them to copper: the shipped dark copper (L 0.657)
would read at 4.34:1 on the new overlay, and darkening the overlay until it
passed would have made copper the constraint on the whole dark ladder.

### Increased contrast in a forced dark root

`prefers-contrast: more` applies to every token it names when
`data-theme="dark"` is on the root element. It does not today (ledger). The
mechanism is chosen at implementation; the observable contract is this one,
and `tests/prefers-contrast.spec.js` gains the case.

### What this does not promise

- **The 3:1 control floor on a canvas nobody tested.** The formulas keep the
  order for any canvas; the floor is verified for the four accents and the
  two presets above, in both schemes. A consumer canvas far outside L
  0.90–0.99 (light) or 0.15–0.30 (dark) needs its own check.
- **Matching fields inside a consumer's own tinted container.** Such a
  container sets `--cirth-surface` to its background, or its fields paint the
  surface of whatever Cirth container is above it.
- **A new tint.** Canvas hue and chroma are unchanged in both schemes; the
  raised level halves the canvas chroma in light and keeps its hue.

## Measurements

Chromium 149.0.7827.55 on the docs served from this branch. "Before" is the
build; "after" is the prototype override recorded with this spec (see the
ledger), inserted in Cirth's layer before any preset so a preset still wins
over it. Ratios are WCAG contrast; the surface columns are against the
canvas.

### Surfaces

| Variant | Recessed | Raised | Overlay | Band | Raised against recessed |
| --- | --- | --- | --- | --- | --- |
| default light | 1.06 → **1.09** | 1.05 → **1.10** | 1.05 → **1.10** | 1.03 → **1.05** | 1.11 → **1.20** |
| default dark | 1.04 → **1.06** | 1.11 → **1.14** | 1.11 → **1.26** | 1.06 → **1.06** | 1.15 → **1.20** |
| plain light | 1.05 → **1.09** | 1.04 → **1.03** | 1.04 → **1.03** | 1.03 → **1.02** | 1.10 → **1.13** |
| plain dark | 1.04 → **1.06** | 1.10 → **1.14** | 1.10 → **1.26** | 1.06 → **1.06** | 1.14 → **1.21** |
| playroom light | 1.06 → **1.09** | 1.05 → **1.05** | 1.05 → **1.05** | 1.02 → **1.02** | 1.11 → **1.15** |
| playroom dark | 1.06 → **1.09** | 1.12 → **1.16** | 1.12 → **1.31** | 1.08 → **1.08** | 1.18 → **1.27** |
| probe light | 1.06 → **1.09** | 1.05 → **1.10** | 1.05 → **1.10** | 1.03 → **1.05** | 1.11 → **1.20** |
| probe dark | 1.04 → **1.06** | 1.11 → **1.14** | 1.11 → **1.26** | 1.06 → **1.06** | 1.15 → **1.20** |

Measured hue: canvas, recessed and band 44° ± 5° in light (8-bit quantisation
at chroma 0.005) and 280° ± 1° in dark, before and after.

### Edges

| Variant | Separator on canvas | Container on canvas | Control, worst level | Order on every level |
| --- | --- | --- | --- | --- |
| default light | 1.11 → **1.28** | 1.48 → **1.61** | 3.28 → **3.23** | yes → **yes** |
| default light · more | 4.14 → **3.26** | 1.95 → **4.06** | 8.24 → **7.48** | no → **yes** |
| default dark | 1.18 → **1.43** | 1.74 → **1.91** | 3.04 → **3.79** | yes → **yes** |
| default dark · more | 1.18 → **3.05** | 1.18 → **3.93** | 3.04 → **6.47** | no → **yes** |
| plain light | 1.15 → **1.28** | 1.50 → **1.59** | 3.41 → **3.15** | yes → **yes** |
| plain light · more | 4.29 → **3.18** | 1.98 → **3.94** | 8.56 → **7.30** | no → **yes** |
| plain dark | 1.18 → **1.43** | 1.75 → **1.91** | 3.06 → **3.79** | yes → **yes** |
| plain dark · more | 1.18 → **3.01** | 1.18 → **3.93** | 3.06 → **6.46** | no → **yes** |
| playroom light | 1.28 → **1.28** | 1.48 → **1.59** | 3.33 → **3.14** | yes → **yes** |
| playroom light · more | 4.07 → **4.07** | 1.97 → **4.79** | 8.35 → **7.30** | no → **yes** |
| playroom dark | 1.50 → **1.50** | 1.74 → **2.03** | 2.73 → **3.86** | yes → **yes** |
| playroom dark · more | 4.50 → **4.50** | 4.50 → **5.33** | 2.73 → **6.45** | no → **yes** |
| probe light | 1.11 → **1.28** | 1.48 → **1.61** | 3.28 → **3.23** | yes → **yes** |
| probe light · more | 4.14 → **3.26** | 1.95 → **4.06** | 8.24 → **7.48** | no → **yes** |
| probe dark | 1.18 → **1.43** | 1.74 → **1.91** | 3.04 → **3.79** | yes → **yes** |
| probe dark · more | 1.18 → **3.05** | 1.18 → **3.93** | 3.04 → **6.47** | no → **yes** |

"Worst level" is the lowest of canvas, recessed, raised and overlay.

### Text on every level

Worst of canvas, recessed, raised and overlay.

| Variant | Body ink | Muted | Accent text | Error border | Success border | Warning border |
| --- | --- | --- | --- | --- | --- | --- |
| default light | 9.83 → **9.14** | 4.72 → **5.27** | 4.90 → **4.56** | 3.03 → **6.84** | 3.07 → **4.10** | 3.31 → **5.26** |
| default dark | 9.73 → **8.54** | 5.19 → **5.35** | 4.95 → **5.53** | 5.71 → **5.96** | 6.53 → **4.86** | 6.10 → **5.35** |
| default dark · more | 9.73 → **12.84** | 5.19 → **7.35** | 4.95 → **5.53** | 5.71 → **5.96** | 6.53 → **4.86** | 6.10 → **5.35** |
| plain light | 10.21 → **9.86** | 4.90 → **5.68** | 5.10 → **4.92** | 3.15 → **7.37** | 3.19 → **4.42** | 3.43 → **5.67** |
| plain dark | 9.80 → **8.54** | 5.23 → **5.35** | 6.65 → **5.79** | 5.75 → **5.96** | 6.58 → **4.86** | 6.14 → **5.35** |
| playroom light | 9.74 → **9.46** | 4.96 → **4.82** | 5.74 → **5.57** | 2.90 → **6.96** | 3.23 → **4.51** | 3.10 → **5.25** |
| playroom dark | 11.93 → **10.22** | 5.45 → **4.66** | 5.25 → **4.84** | 5.07 → **5.17** | 7.34 → **5.32** | 6.26 → **5.36** |
| probe light | 9.83 → **9.14** | 4.72 → **5.27** | 5.00 → **4.65** | 3.03 → **6.84** | 3.07 → **4.10** | 3.31 → **5.26** |
| probe dark | 9.73 → **8.54** | 5.19 → **5.35** | 6.85 → **6.01** | 5.71 → **5.96** | 6.53 → **4.86** | 6.10 → **5.35** |

Status borders here are the status inputs themselves; the reasoning is in
[control-emphasis](control-emphasis.md). The `default dark · more` accent
text stays at 5.53 because the prototype cannot fix the forced-dark contrast
bug below; with it fixed the pass's own copper-250 applies.

## Evidence ledger

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| Surfaces are indistinguishable from the canvas | Light: card 1.05, band 1.03, field 1.03, code 1.06. Dark: at most 1.11 | Docs at `94f7c669`, Chromium 149.0.7827.55, 1440px, `evidence/before-default.json` | Verified |
| Edges are weak and cool on a warm page | Separator 1.11:1, card 1.48:1, field 3.47:1; card border `rgb(203,204,212)` (280°) on canvas `rgb(250,245,243)` (43°) | Same run | Verified |
| Checkbox and radio draw a 2px border | Computed `border-top-width: 2px` | Same run | Verified |
| The modal article casts no shadow; dropdown and popover use a seven-layer ramp | `box-shadow: none` on `dialog > article`; `--cirth-box-shadow` in `dist/cirth.min.css` is 625 characters of seven layers | Same run; `dist/cirth.min.css` at `806fea7a` | Verified |
| `prefers-contrast: more` does nothing to `_dual.scss` tokens when `data-theme="dark"` is on the root | `--cirth-ink`, `--cirth-muted-color` and `--cirth-primary` keep their `light-dark()` pairs; body text stays `oklch(0.83 0.011 280)` instead of `oklch(0.96 0 280)`. With the automatic scheme the pass applies | `dist/cirth.css` at `806fea7a`, Chromium 149.0.7827.55, Firefox 151.0, WebKit 26.5 | Verified |
| No test covers that case | `tests/prefers-contrast.spec.js` sets the scheme with `emulateMedia` only and never puts `data-theme` on the root | Source read, `806fea7a` | Verified |
| Under `more`, the separator outweighs the container | Light: separator 4.14, container 1.95 on the canvas | Docs at `806fea7a`, Chromium 149 | Verified |
| Playroom's field border fails 3:1 on a dark card | 2.73:1 against the card and the dropdown surface | Same run | Verified |
| The proposed levels, edges and inks meet every floor above in all four accents, both schemes, with and without `more` | The tables in this spec | Prototype override `prototype-source/prototype.css` over the docs at `806fea7a`, Chromium 149 | Verified |
| The same holds in Firefox and WebKit | Not measured for the prototype | Implementation acceptance | Reported |
| A two-layer shadow saves 99 B gzip on `cirth.min.css` | gzip -9 of `dist/cirth.min.css` with the seven-layer value replaced by a two-layer one | `806fea7a`, Node 24.18.0 | Verified |
| The two-layer shadow keeps the dark elevation contract | Not measured | Implementation acceptance | Reported |
| The prototype's upper-bound byte cost | Appending the whole override, which in the real change replaces existing declarations, adds 718 B gzip | Same | Verified |

The captures and the JSON behind every row are in
`~/crithcss/cirth-captures/technical-language-system/` (outside the
repository, by design): `before/`, `prototype/`, `evidence/`,
`prototype-source/`.

## Decisions

| Decision | Basis | Rationale |
| --- | --- | --- |
| Lower the light canvas to 96% | Design | At 97.3% the raised level can gain 0.027 L before white, 1.07:1. At 96% it gains 0.033 and the recessed level keeps its own 0.03 below. Hue and chroma do not move |
| Rejected: a white canvas with a grey raised level | Design | Inverts the page: the reading surface becomes the brightest thing and cards read as holes |
| Fields paint `--cirth-surface` | Design | One signal: the border. Recessed fields encoded "field" twice, with the fill and the border |
| Rejected: white fields everywhere | Design | On the canvas that is a fill difference plus a border, the same double encoding in the other direction |
| Rejected: transparent fields | Existing contract | Outline buttons rely on an opaque control surface, and a transparent field over an image or a stripe loses its text |
| Edges from the canvas, not from the neutral family | Design | The line belongs to the surface it divides. Cool lines on the warm canvas were the temperature conflict; canvas-derived lines follow plain to neutral and playroom to violet without a preset saying so |
| Rejected: accent-tinted lines | Constraint | Extends the accent beyond action and position |
| Container as a 25% relation between separator and control | Design | The order becomes a property of the definition rather than of three numbers happening to line up; survives a preset overriding one end |
| Clamp the accent text role instead of darkening the dark levels | Constraint | Darkening until copper passed would tune the structure to copper. The clamp moves only accents that would otherwise fail |
| Rejected: clamping `--cirth-primary` itself | Constraint | The accent input is frozen and must stay byte-identical |
| Two shadow layers | Design | The seven-layer ramp is inherited, costs 99 B gzip that the budget needs, and a contact plus an ambient layer is what an overlay's edge is read from |
| Rejected: a shadow on the card | Existing contract | Cards are sheets on the page, not floating; the raised level now carries what a shadow would have |
| Card band halfway between canvas and raised | Design | A group inside a container, told apart by surface; the line under it is the division |

## Acceptance

- [ ] With every border made transparent, canvas, recessed, raised and overlay
      are told apart in grayscale in both schemes at 1440 and 390px
      (default, plain, playroom, probe).
- [ ] Control border ≥ 3:1 on every level, separator < container ≤ control on
      every level, in both schemes, with and without `more`, for the four
      accents, in Chromium, Firefox and WebKit:
      `tests/surface-derivation.spec.js`, extended.
- [ ] Canvas hue within 44° ± 5° (light) and 280° ± 2° (dark);
      `--cirth-primary` computed value identical to `806fea7a` in light, dark
      and `more`.
- [ ] Accent text ≥ 4.5:1 on every level for the four accents.
- [ ] `prefers-contrast: more` applies under a root `data-theme="dark"`:
      `tests/prefers-contrast.spec.js`.
- [ ] `tests/box-shadow.spec.js` asserts two layers and passes the dark
      elevation ratio in three engines; `specs/dark-elevation-shadow.md` gets a
      row pointing here.
- [ ] `npm run check:size` reported (not gated; see Open questions, 3);
      `npm run check:tokens` green with the token export regenerated.
- [ ] `docs/src/pages/colors.md` (Surfaces) and `docs/src/pages/upgrading.md`
      (migration) updated.

## Migration

| If you | Then |
| --- | --- |
| Override `--cirth-canvas` | Nothing: every level follows it |
| Override `--cirth-card-background-color`, `--cirth-code-background-color`, `--cirth-dropdown-background-color` or `--cirth-popover-background-color` | Still works. To move a whole level, override `--cirth-surface-raised`, `-recessed` or `-overlay` instead |
| Override `--cirth-form-element-background-color` | Still works, and now wins everywhere. To match a container, remove it |
| Use `--cirth-form-element-active-background-color` | Removed. A focused field no longer changes its fill |
| Paint your own container background and put fields in it | Set `--cirth-surface` on it to the same colour |
| Override `--cirth-muted-border-color`, `--cirth-card-border-color` or `--cirth-form-element-border-color` | Still works. `--cirth-card-border-color` now follows the other two unless you set it |
| Read `--cirth-table-border-color` as the card's edge | It is the separator now |
| Count on the modal having no shadow | It has the overlay shadow; set `--cirth-box-shadow: none` on the dialog to remove it |
| Read `--cirth-box-shadow` as seven layers | It is two |
| Use `--cirth-primary-text` in dark as exactly `--cirth-primary` | It is lifted to L 0.72 when the accent is darker than that |

## Open questions

1. **Plain's raised step.** Its canvas leaves no room. Closed on 2026-09-27:
   presets are not frozen, so plain's canvas moves down to make room for its
   cards, like the default one, and stays achromatic.
2. **Is `--cirth-surface` public?** It has to be settable by consumers for
   their own containers, which makes it public in practice. Proposed: public,
   documented on Colors and Customization.
3. **Size budget.** `cirth.min.css` is 15129 B of a 15200 B budget. Closed on
   2026-09-27: the maintainer does not treat the budget as a constraint on
   this work and will revisit the numbers; `npm run check:size` is reported,
   not gated on, and a cleanup pass follows if it is needed.
4. **What stays fixed.** On 2026-09-27 the maintainer lifted every freeze
   except the accent hues, which a later palette round chooses. Lightness,
   chroma and ladder steps of any family may move; the accent's hue (44°)
   and the error, success and warning hues do not.
