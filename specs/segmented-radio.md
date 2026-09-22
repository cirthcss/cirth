# Segmented radio group

| | |
| --- | --- |
| Issue | gh#107 |
| Status | Draft — the promote/revise/reject decision is the maintainer's, taken at review of this branch |
| Baseline | `c4dcd4c5` on `master`, branch `feat/issue-107-segmented-radio` |
| Breaking | No — a new opt-in class; existing markup renders as before |

Class-based builds gain `fieldset.segmented`. It draws a radio group as joined
segments, and the group stays a native radio group. Nothing changes for
markup that does not use the class. The classless builds are byte-identical
to `master`.

## Contract

After this lands, a `fieldset.segmented` whose direct-child labels each wrap
one `input[type="radio"]`:

- keeps native radio semantics. The group is named by its `legend` and each
  option by its label. Arrow keys move the selection and skip disabled
  options, and the checked value submits with the form;
- lays its labels out as joined segments, rounded only at the inline-start
  and inline-end corners, with the order following `dir`;
- gives each segment a block size of at least 44px, like a button;
- fills the selected segment with the primary button's surface and
  on-surface ink, and keeps the radio rendered with its dot. The selection
  is therefore also shown by shape;
- draws keyboard focus as an outline around the whole segment, outside the
  fill. That outline remains in forced-colors mode, as do the dot and the
  borders;
- fades a segment whose radio is disabled once, not twice.

It does **not** promise:

- Any styling in the classless builds. There is no classless opt-in; see
  Decisions.
- Other markup shapes: radios outside labels, `input` + `label[for]`
  siblings, checkboxes (multi-select), or links styled as a segmented nav.
  A segmented *navigation* is a different pattern (`aria-current`) and is
  out of scope.
- Wrapping behaviour beyond `flex-wrap: wrap`. On a narrow screen, segments
  wrap onto a second line with square inner corners. A long set of options
  should be a `select`.
- Hover styling. There is none; the pointer cursor comes from the existing
  rule for a label that wraps a radio.

## Evidence ledger

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| The group and options keep their names; arrow keys move and skip disabled; the value submits; a disabled option ignores the pointer | `tests/segmented.spec.js`, 12 tests × 3 engines: 36 passed, 0 skipped | `dist/cirth.css` from this branch on `c4dcd4c5`; Chromium 149.0.7827.55, Firefox 151.0, WebKit 26.5 (Playwright 1.61.1, macOS 26.6.2), 2026-09-18 | Verified |
| Radios stay rendered, segments are ≥ 44 × 44px, joined, with outer corners only; RTL reverses the order | Same run | Same | Verified |
| Selection is shown by shape as well as fill, including in forced colors | Same run: the checked radio's border is ≥ 3× the empty one's, with `forcedColors: "active"` confirmed by `matchMedia` in all three engines | Same | Verified |
| The focus test can fail | Replacing the segment outline with `outline: none` failed 6 of 36 tests (focus, normal and forced colors, in each engine). Restored afterwards | Same | Verified |
| An earlier run of that mutation did not prove anything | A `/* removed */` substitution failed the build silently (output sent to `/dev/null`), so the tests ran against the previous `dist/` and passed | Same session | Invalid |
| No axe violations | `AxeBuilder` on the focused group (wcag2a/aa, 21a/aa, 22aa) in each engine; `npm run check:a11y`: no new violations across 50 docs pages × 3 themes × 3 modes, including the new demo | Same; `check:a11y` on Chromium 149 | Verified |
| The classless builds are unaffected | `fieldset.segmented` computes `display: block` with `dist/cirth.classless.css`; `cirth.classless*.min.css` byte-identical to `master` | Same | Verified |
| Cost | `cirth.min.css` +1,434 B minified, +136 B gzip-9 (14,255 → 14,391); `cirth.scoped.min.css` +1,497 B, +126 B gzip (14,466 → 14,592); classless +0 | Compared with `dist/` built from `c4dcd4c5` | Verified |
| Only one docs page changes visually | `class="segmented"` appears only in `docs/dist/forms/checkbox-radio-switch/index.html`; its 12 Darwin baselines were regenerated. Other pages were not re-run | This branch | Verified |
| The upstream pattern hides the inputs with `display: none` | Described in gh#107, citing picocss/pico discussion #567 | Not reproduced here | Reported |

## Decisions

| Decision | Basis | Rationale |
| --- | --- | --- |
| Opt-in via `fieldset.segmented`, classes build only | Existing contract | A role or a bare-`fieldset` trigger would restyle semantic groups that did not ask for it, which is the hijack gh#19 removed from `[role="group"]`. Rejected: `fieldset[role="radiogroup"]` for classless, which reuses ARIA as a styling hook. |
| Keep the radio visible inside each segment | Design | This is the non-colour selection signal, and forced colors keeps it. Rejected: a visually hidden input with a fill-only selection, which needs a separate forced-colors and non-colour treatment and costs more bytes. |
| Segment-level `outline` for focus, offset outside | Constraint | Focus lands on the checked radio, whose own ring would sit on the accent fill. An outline is repainted by forced colors; a box-shadow is not. |
| Reuse the primary button's surface/on-surface pair | Existing contract | The theme already verifies that pair for contrast, so no new tokens are needed. |
| No new custom properties | Design | This keeps the token surface and the size cost down. A theme restyles it through the tokens it already reads. |

## Acceptance

- [x] Keyboard, form submission, names, forced colors, RTL, disabled and the
      44px floor are exercised in all three engines (`tests/segmented.spec.js`,
      registered in `playwright.behavior.config.js`).
- [x] axe: in the spec and across the docs (`npm run check:a11y`).
- [x] CSS and minified cost measured (ledger).
- [x] Documentation and a live example: "Segmented choice" in
      `docs/src/pages/forms/checkbox-radio-switch.md`,
      `docs/src/content/demos/segmented.html`.
- [ ] **Decision recorded on gh#107**: promote (merge this branch), revise, or
      reject.

## Open questions

- **Size budget.** This leaves 123 B gzip under the `cirth.min.css` budget
  and 179 B under the scoped one. gh#108, prototyped in parallel, draws on
  the same headroom. Promoting both may require raising a budget, which is a
  separate decision.
- **Name.** `segmented` describes the look rather than the role. The
  alternatives considered were `choice` and `toggle-group`. Renaming is cheap
  now and breaking after a release.
