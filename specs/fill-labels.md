# Labels on filled controls

| | |
| --- | --- |
| Issue | None yet; related to gh#96 (the explicit on-surface role). Prerequisite of `specs/material-preset.md` |
| Status | Implementing |
| Baseline | `f1caa145` on `design/technical-language-system` |
| Breaking | No: one custom property added; a chevron colour changes on filled `summary` elements |

Two things painted on a filled control stopped following the label of that
fill. A `.danger` button took its label from `--cirth-primary-on-surface`,
the primary button's label, so a theme that set a dark label for a light
accent, as `docs/src/pages/colors.md` shows, put dark ink on a deep red
fill. And a `summary` drawn as a filled button forced its chevron to white
with a filter, whatever its label was: a white chevron on the pale wash of a
`.secondary` summary, and on the fill of any theme with a dark label. After
this change the danger label is its own role, `--cirth-danger-on-surface`,
white by default, and a filled summary paints its chevron in its label
colour. The default theme renders the same, except for the `.secondary`
summary's chevron, which becomes visible.

## Contract

- `--cirth-danger-on-surface` is declared at the theme root, in builds with
  `$enable-classes`, as white in both schemes. A `.danger` button's label,
  resting and in every interactive state, is this token.
- The token is a role, not a derivation, for the reason
  `--cirth-primary-on-surface` is one: light or dark ink on a fill is a
  decision (`src/theme/_light.scss`).
- `--cirth-primary-on-surface` no longer reaches `.danger`. A theme that sets
  it changes the primary label, the checkbox mark, the radio dot, the switch
  thumb and the selected segment, as before, and nothing painted on the
  error fill.
- A `summary[role="button"]` that is not `.outline` paints its chevron in
  `currentColor`, which is the label of its variant: the primary, secondary
  or contrast on-surface role. The chevron is no longer filtered.
- Classless builds carry no `.danger` and no new token.

Not promised:

- **That the danger fill suits a light label for any error input.** The
  fill is the error input in light, so an author who sets a light error
  sets this label too.
- **The outline and ghost variants.** Their labels are text roles on the
  page surface and do not change.

## Evidence ledger

"This build" is `dist/cirth.css` built from this change on `f1caa145`, with
the palette of `specs/default-palette.md`. Engines: Chromium 149.0.7827.55,
Firefox 151.0 and WebKit 26.5.

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| Before: the documented light-accent example made the danger label unreadable | `--cirth-primary: #fbbf24; --cirth-primary-on-surface: #1c1917` put `#1c1917` on the danger fill: 1.75:1 in light (`#811b1b`), 2.37:1 in dark (`#6e4e4a`) | The old rule (`--cirth-color: var(--cirth-primary-on-surface)`) on this build's fills, computed | Verified |
| After: the same example keeps the danger label at the default's contrast | White on `#811b1b` 9.97:1, on `#6e4e4a` 7.36:1; the primary and dropdown chevrons follow the dark label, 10.48:1 in light and 4.96:1 in dark | This build plus the override, three engines, painted to an 8-bit canvas | Verified |
| Before: a `.secondary` filled summary drew a white chevron on its wash | White on the light wash (`#e0e2dd` on the canvas): 1.30:1 | The removed `filter: brightness(0) invert(1)`, computed on this build's wash | Verified |
| After: its chevron is its label | `#393e2e` on `#e0e2dd`, 8.46:1 in light; `#c6c8c1` on `#25281c`, 8.89:1 in dark | This build, three engines | Verified |
| The default theme's primary summary and danger button render as before | White chevron on the primary fill (4.95:1 light, 7.75:1 dark), white danger label (9.97:1, 7.36:1); no filter left on the chevrons | This build, three engines | Verified |
| The dark scheme's `.contrast` chevron rule is redundant once the chevron is `currentColor` | The rule filtered the chevron to black; `--cirth-contrast-on-surface` is black in dark, so `currentColor` paints the same colour | Source read, `src/theme/_dark.scss` and `_dual.scss`. Removed with this change; the loading spinner's matching rule is untouched | Verified |

## Decisions

| Decision | Basis | Rationale |
| --- | --- | --- |
| A new role, `--cirth-danger-on-surface` | Design | The label of a fill belongs to that fill. The name follows the on-surface vocabulary and the button modifier it serves |
| Rejected: `--cirth-error-on-surface` | Design | Reads as the ink on `--cirth-error-surface`, the pale status tint, which is not the danger fill |
| Rejected: a hard-coded white label | Design | A theme with a light error input could not fix it without a component rule |
| Rejected: tokens for the danger fill and its hover | Design | The fill already derives from `--cirth-error`; only the label is a decision |
| Declared at the root, not per scheme | Existing contract | A root declaration reaches every forced-scheme subtree; one value covers both schemes |
| Chevron as `currentColor` | Design | The accordion's chevron was already masked over `currentColor`; the filter predates the masks and could only produce white or black |
| Supersedes the 0.15.0-beta.2 note that `.danger` "adds no custom property" | Design | That note held while the label was shared; sharing it is the defect |

## Acceptance

- [x] `.danger` reads `--cirth-danger-on-surface` in `src/content/_button.scss`;
      the token is declared in `src/theme/_dual.scss` under `$enable-classes`.
- [x] The filled summary's chevron rule in `src/theme/_styles.scss` paints
      `currentColor`; the dark `.contrast` chevron filter is gone.
- [x] `docs/src/pages/customization.md`, `docs/src/pages/colors.md` and
      `docs/src/pages/content/button.md` name the token.
- [x] `npm run check:behavior`, `check:a11y` and `check:visual` on the
      branch.
