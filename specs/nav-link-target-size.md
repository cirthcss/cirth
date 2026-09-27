# A 24px floor for nav links on the inline axis

| | |
| --- | --- |
| Issue | Documentation redesign, `docs/documentation-redesign` |
| Status | Implementing |
| Baseline | `204e0319` on `develop` |
| Breaking | No |

A link in a horizontal `nav` is 40px tall and as wide as its label plus its
padding. A one-character label (the "1" of a pagination nav) came out 23px
wide, and because nav links tile with no space between them, WCAG 2.5.8's
spacing exception does not apply: axe reported it as a `target-size`
violation. After this change a nav link is never narrower than 24px. Only
links whose label is a single narrow character get wider; every other nav
renders exactly as before.

## Contract

After this lands:

- Every `nav li` link that is not a `[role="button"]` has
  `min-inline-size: var(--cirth-space-6)` (24px at the default scale), in
  every build.
- A one-character label inside such a link produces a target at least 24px
  wide and at least 24px tall, in Chromium, Firefox and WebKit.
- Links already wider than 24px keep their width, and links in a stacked
  (vertical) nav keep the full width of their column.

It does **not** promise:

- that the label is centred inside the extra width. The floor adds at most
  a pixel or two to a single character, and centring would move the text of
  every block-level link in a vertical nav;
- anything about buttons in a nav, which already take the 40px control band
  on both axes;
- a target size for links outside a `nav`, which WCAG 2.5.8 exempts when
  they sit inline in a sentence.

## Evidence ledger

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| A one-character nav link was under 24px wide | Pagination "1" in the Data table example measured 23 × 42px, "2" 25px, adjacent with no gap; `npm run check:a11y` failed `target-size` (serious) on `examples/index.html` in 9 theme and mode combinations | `docs/dist` built from this branch before the fix, axe-core 4.12 via `@axe-core/playwright`, Chromium 149.0.7827.55, 2026-09-27 | Verified |
| With the floor, one-character links clear 24px on both axes | `tests/nav-target-size.spec.js` passes; it fails in all three engines with the declaration removed | `dist/cirth.css` from this branch; Chromium 149.0.7827.55, Firefox 151.0, WebKit 26.5, 2026-09-27 | Verified |
| Stacked navs are unchanged | Same spec: a one-letter row and a long row in an `aside nav` have the same width | Same run | Verified |
| The existing nav and layout behaviour holds | `tests/nav-dropdown.spec.js` and `tests/layout.spec.js` pass in all three engines | Same run | Verified |
| The size budgets hold | `npm run build`: `cirth.min.css` 15123 B gzip (budget 15200), `cirth.scoped.min.css` 15305 B (budget 15400) | This branch, Node 24.18.0, 2026-09-27 | Verified |

## Decisions

| Decision | Basis | Rationale |
| --- | --- | --- |
| A minimum, not a padding change | Design | More padding would widen every link in every nav bar. A minimum only acts on labels too short to reach it. |
| `--cirth-space-6` rather than a literal | Existing contract | The size follows the spacing scale like every other measure in the nav, and the scale's 24px step is exactly the AA floor. |
| Rejected: `text-align: center` alongside it | Constraint | Links in a stacked nav are blocks; centring would move their labels off the rail. |
| Rejected: fixing only the documentation example | Design | Pagination is an ordinary use of `nav`; any consumer with a numbered nav would have shipped the same failure. |

## Acceptance

- [x] `tests/nav-target-size.spec.js` passes in Chromium, Firefox and WebKit
  and fails without the declaration.
- [x] `npm run check:a11y` reports no `target-size` violation on the
  examples page.
- [x] `npm run build` stays inside every size budget.
- [x] `CHANGELOG.md` records the change under Unreleased.
