# Print visibility utilities

| | |
| --- | --- |
| Issue | gh#151 |
| Status | Implementing: every acceptance check passes (2026-10-25); lands with its pull request |
| Baseline | `3857cfea3` on `develop` |
| Breaking | No: two classes are added; existing print and screen output is unchanged without them |

Cirth's print stylesheet hides nothing, because only the application knows
which regions are chrome. So every application that prints a table or a
record writes the same `@media print { display: none }` rule for its navbar,
sidebar and toolbar. After this change it can say so with a class:
`.no-print` leaves an element off the paper, and `.print-only` shows one
only on paper. Markup without either class prints and renders as before.

## Contract

After this lands:

- `.no-print` sets `display: none` under `@media print`.
- `.print-only` sets `display: none` under `@media not print`. In print,
  nothing in Cirth hides it, so it takes its normal display.
- Both are in the class builds (default and scoped), not in the classless
  builds. They live in the main build, which since
  [print-in-main-build](print-in-main-build.md) also carries the print
  pass; the separate print stylesheets they once had to work without are
  removed.
- They compose by nesting: `.print-only` inside `.no-print` is never shown;
  `.no-print` inside other content hides only itself.
- `[hidden]` wins over `.print-only`: a hidden element stays hidden on paper.
- On screen, a `.print-only` element is out of the accessibility tree, as
  any `display: none` element is. A `.no-print` element is unaffected on
  screen.

It does **not** promise:

- to bring back content that is not in the DOM. A virtualised table, a lazy
  panel or a closed dialog prints what the page holds at the moment of
  printing, and no class can add to it;
- to beat a display the page sets itself. The classes sit in the `cirth`
  cascade layer, so an unlayered or inline `display` rule on the same
  element wins, as it wins over every Cirth rule;
- a print-region mode that hides everything outside one subtree. Nested
  regions, dialogs and several printable panels make that contract
  surprising, and the application can mark its chrome instead;
- anything on screen for `.no-print`, or anything in print for `.print-only`
  beyond not hiding it.

## Evidence ledger

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| Each class hides on one medium only, nested or not | `tests/print.spec.js`: with `emulateMedia` screen, the `.print-only` heading and a `.print-only` inside `.no-print` are hidden and the chrome is shown; with print, the chrome and a nested `.no-print` aside are hidden and the heading is shown. `checkVisibility()` on each element | `dist/cirth.css` and `dist/cirth.scoped.css` from this change, with and without the print sheet; Chromium 149.0.7827.55, Firefox 151.0, WebKit 26.5, 2026-10-25 | Verified |
| `[hidden]` wins | A `.print-only[hidden]` element stays hidden on screen and in print | Same run | Verified |
| A display of the page's own wins | A `.no-print` element with an inline `display: flex` is visible in print | Same run | Verified |
| On screen, `.print-only` leaves the accessibility tree and `.no-print` stays in it | `ariaSnapshot()` of the body contains the `.no-print` link and aside text and not the `.print-only` text | Same run | Verified |
| Screen readers in print media | Not applicable: assistive technology reads the screen rendering, and print media has no accessibility tree a reader traverses | Specification of `display: none` and how AT consumes the rendering; not reproduced with a screen reader | Reported |
| Without the rules the tests fail | With both selectors renamed in the build, five of the six new tests fail in Chromium | Same build | Verified |
| Class builds only | Neither class appears in the classless builds or the print stylesheet; the scoped build emits `.cirth .no-print` and `.cirth .print-only` | Same build | Verified |
| The print stylesheet cannot undo `.no-print` | It sets `display` only on `thead` and `tfoot`, one type selector each, below a class | `src/utilities/_print.scss` at `3857cfea3` | Verified |
| The size budgets hold | `cirth.min.css` 16481 B gzip of 16700 B; `cirth.scoped.min.css` 16733 B of 17000 B | Same build, Node 24.18.0 | Verified |

## Decisions

| Decision | Basis | Rationale |
| --- | --- | --- |
| Hide-on-print alone is not sufficient: ship `.print-only` too | Design | A printed heading, a URL spelled out or a signature line needs the opposite rule, and writing it locally is the same boilerplate the issue set out to remove. On screen it is `display: none`, so it cannot duplicate content for assistive technology |
| In the main build, not the print stylesheet | Constraint | `.print-only` has to act on screen, where the print stylesheet does not apply. Keeping both classes together also makes `.no-print` work for a page that loads no print stylesheet |
| `.no-print` and `.print-only` | Design | `.no-print` reads like `.no-cirth`: leave this out of print. `.print-only` reads like `.sr-only`: present only there |
| Rejected: a print-region component | Design | It would hide everything outside one subtree, which breaks for nested regions, dialogs and several printable panels |
| Rejected: a classless contract | Constraint | Without a class there is no way to say which region is chrome, and guessing is what the print stylesheet refuses to do |

## Acceptance

- [x] `tests/print.spec.js` passes in Chromium, Firefox and WebKit and fails
      without the rules.
      Six cases in three engines, 18 passed; five fail with the rules renamed (2026-10-25).
- [x] `docs/src/pages/utilities/print.md` documents both classes, the
      accessibility rule for `.print-only`, and that content absent from the
      DOM cannot be recovered by CSS.
      Print has "Leaving things off the paper".
- [x] `CHANGELOG.md` records them under Unreleased.
      Under Unreleased, Added.
- [x] `npm run build` stays inside every size budget.
      `cirth.min.css` 16481 B of 16700 B; `cirth.scoped.min.css` 16733 B of 17000 B.
