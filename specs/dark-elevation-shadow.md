# Visible elevation in the dark scheme

| | |
| --- | --- |
| Issue | Documentation redesign, `docs/documentation-redesign` |
| Status | Implementing |
| Baseline | `204e0319` on `develop` |
| Breaking | No |

`--cirth-box-shadow`, the elevation that dropdown menus and popovers paint
(through `--cirth-dropdown-box-shadow` and `--cirth-popover-box-shadow`), used
one alpha ramp for both schemes. On the paper canvas that ramp is a visible
step; on the graphite canvas it darkened the page by less than a hundredth of
lightness, so a floating panel in the dark scheme had no edge except its
border. After this change the dark half of every shadow layer carries four
times the alpha of the light half, and the step under a floating panel is
about the same size in both schemes. Anyone who reads the token in the dark
scheme sees a darker shadow; the light scheme is unchanged.

## Contract

After this lands:

- `--cirth-box-shadow` keeps its geometry: seven layers, the same offsets and
  blur radii, one `light-dark()` colour per layer. Only the dark colour's
  alpha changes.
- Each dark layer's alpha is four times the light layer's alpha at the same
  position in the ramp, capped at 1.
- Under an open popover on the default theme, the OKLab lightness step two
  pixels below the panel's edge in the dark scheme is at least three
  quarters of the step in the light scheme, in Chromium, Firefox and WebKit.
  `tests/box-shadow.spec.js` measures that on painted pixels.

It does **not** promise:

- that cards gain a shadow. `--cirth-card-box-shadow` stays `none`; a card is
  a hairline surface, not a floating one, and that is unchanged;
- a particular appearance for a consumer who overrides `--cirth-box-shadow`,
  `--cirth-dropdown-box-shadow` or `--cirth-popover-box-shadow`. An override
  replaces the value outright, as before;
- anything under `forced-colors: active`, where the browser drops
  `box-shadow` and the border carries the edge, as before.

## Evidence ledger

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| Before the change, the dark shadow was nearly invisible | Pixel two pixels under an open `[popover]`: ΔL −0.0095 against the canvas in dark, against −0.0368 (Chromium), −0.0358 (Firefox), −0.0331 (WebKit) in light. At 24px the dark step was −0.0044, −0.0006 and −0.0006 | `dist/cirth.min.css` at `204e0319`; Chromium 149.0.7827.55, Firefox 151.0, WebKit 26.5 (Playwright 1.61.1), 2026-09-27 | Verified |
| With a factor of 4 the dark step matches the light one | ΔL at 2px: −0.0346 (Chromium), −0.0328 (Firefox), −0.0299 (WebKit); at 24px: −0.0140, −0.0140, −0.0129. Light is unchanged | `dist/cirth.min.css` built from this branch, same browsers, 2026-09-27 | Verified |
| The regression test detects the old behaviour | `tests/box-shadow.spec.js` "a floating panel lifts off the dark canvas…" fails in all three engines with the factor set back to 1, and passes at 4 | `npx playwright test --config=playwright.behavior.config.js tests/box-shadow.spec.js`, same browsers, 2026-09-27 | Verified |
| The layer count and geometry are unchanged | The existing "seven layers" and "same geometry, different colour" assertions in `tests/box-shadow.spec.js` pass unchanged | Same run | Verified |
| The size budgets hold | `npm run build`: `cirth.min.css` 15112 B gzip (budget 15200), `cirth.scoped.min.css` 15295 B (budget 15400, +10 B against the baseline's 15285 B) | This branch, Node 24.18.0, 2026-09-27 | Verified |
| Graphite needs more shadow ink than paper for the same perceived lift | General design practice for dark interfaces; the measurement above is what this spec relies on, not the rule of thumb | Not reproduced as a general claim | Reported |

## Decisions

| Decision | Basis | Rationale |
| --- | --- | --- |
| Scale the dark alpha rather than retune the light ramp | Existing contract | The light scheme's elevation has visual baselines and nobody reported it as wrong; only the dark half was missing. |
| A single factor of 4, not a per-layer table | Design | The ramp's shape (tight contact shadow, wide ambient one) is right in both schemes; only its strength was not. One number keeps the helper readable and the change reviewable. |
| Rejected: a lighter shadow colour (a glow) in the dark scheme | Design | A light halo reads as an outline or a focus state, and the dark border already exists. Darkening the canvas beside the panel is what elevation means on every other surface. |
| Rejected: giving cards a shadow while here | Existing contract | Cards are deliberately flat; that is a brand decision (`docs/NATIVE_BASELINE_REWORK.md`), not a defect, and it would change every card on every page. |
| Keep the factor inside `src/helpers/_functions.scss` | Constraint | SCSS is not a published API. Consumers retune the result through the custom properties, as they always could. |

## Acceptance

- [x] `tests/box-shadow.spec.js` passes in Chromium, Firefox and WebKit, and
  its new test fails when the factor is 1.
- [x] `npm run build` stays inside every size budget.
- [x] `npm run check:visual` baselines are regenerated and reviewed on
  macOS (Chromium, Firefox, WebKit) in commit `ca819d1d`, together with the
  documentation redesign they ship in.
- [ ] The Linux baselines are regenerated by the `update-visual-baselines`
  workflow once the branch is pushed.
- [x] `CHANGELOG.md` records the change under Unreleased.

## Open questions

- Should `--cirth-box-shadow` become an input with a documented dark variant,
  so a theme can tune the dark lift without restating seven layers? Not
  needed for this fix; worth revisiting with the theme generator (gh#90).
