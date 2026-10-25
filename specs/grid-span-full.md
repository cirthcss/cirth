# A grid child that spans every column

| | |
| --- | --- |
| Issue | gh#152 |
| Status | Implementing: every acceptance check passes (2026-10-25); lands with its pull request |
| Baseline | `3857cfea3` on `develop` |
| Breaking | No: one class is added; no existing rule changes |

`.grid` wraps its children into as many equal columns as its width allows.
A record form often needs one child to cross all of them: a notes field
after short fields, a validation summary, an action row. Today that takes a
local `grid-column: 1 / -1`. After this change, `.span-full` on a direct
child of `.grid` makes it cross every column, at any width. Nothing else
changes, and markup without the class renders exactly as before.

## Contract

After this lands:

- `.grid > .span-full` sets `grid-column: 1 / -1`, in the class builds
  (default and scoped). The classless builds have no such rule.
- The child spans every column `.grid` creates. When the grid fits more
  columns than it has children, the empty ones collapse (`auto-fit`), so the
  child still meets both edges of the grid. In one column it is as wide as
  the grid.
- The siblings keep the columns: two short fields beside a `.span-full`
  child share the row it does not take, at equal widths.
- The span follows the inline direction: in right-to-left text it starts at
  the right edge, because grid lines are logical.
- Long content does not widen the grid: every `.grid` child already has
  `min-width: 0`.

It does **not** promise:

- anything outside a direct child of `.grid`. On a child of `.row`, on a
  grandchild of `.grid` or on an element outside any grid, the class does
  nothing. A grandchild that is itself the child of a nested `.grid` spans
  that inner grid, not the outer one;
- a numerical span (two columns, three columns). gh#111 keeps those as local
  recipes, and so does this spec: "every column" is the one case whose
  meaning does not depend on how many columns the container fits;
- a full-width block outside a grid. Width and grid span are different
  operations, which is why the class is not called `.full-width`.

## Evidence ledger

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| Without the rule, a child cannot cross the columns | With the declaration removed from the build, the child is one track wide in a 1200px grid and the two wide-layout cases of `tests/layout.spec.js` fail | `dist/cirth.css` from this change, Chromium 149.0.7827.55, 2026-10-25 | Verified |
| The child meets both edges, wide, narrow and right to left | `tests/layout.spec.js` (span-full crosses every column of a .grid): left edge and width equal to the grid's within half a pixel at 1200px LTR and RTL and at 300px; the two siblings share the rest of the row at equal widths | Same build, Chromium 149.0.7827.55, Firefox 151.0, WebKit 26.5 | Verified |
| Long content does not overflow | A 320-character unbroken word in a `.span-full` child of a 320px grid stays inside it | Same run | Verified |
| No effect outside a direct child of `.grid` | `grid-column-start` stays `auto` on a `.row` child and on a loose element; a grandchild in a nested `.grid` spans only that grid | Same run | Verified |
| Class builds only | The classless build contains no `span-full`; the scoped build emits `.cirth .grid > .span-full` | Same build | Verified |
| The size budgets hold | `cirth.min.css` 16452 B gzip of 16700 B | Same build, Node 24.18.0 | Verified |

## Decisions

| Decision | Basis | Rationale |
| --- | --- | --- |
| One exception to gh#111's "no span utilities" | Design | gh#111 rejects numerical spans because their meaning depends on how many columns an intrinsic grid fits at a given width. "Every column" is the only span whose meaning does not, and it is the one a form needs |
| `.span-full`, scoped to `.grid >` | Design | The name says what it does to the grid; the selector keeps it from promising anything elsewhere, as `.breakout` does for `.container` |
| Rejected: `.full-width` | Design | `width: 100%` only fills the child's own track; it does not cross the others |
| Rejected: a classless contract | Constraint | Without a class, the classless build has no way to say which child should span |

## Acceptance

- [x] `tests/layout.spec.js` passes in Chromium, Firefox and WebKit and its
      wide cases fail without the rule.
      Six cases in three engines, 18 passed; the two wide cases fail with the rule removed (2026-10-25).
- [x] `docs/src/pages/layout/grid.md` documents the class with a live
      example; `CHANGELOG.md` records it under Unreleased.
      Grid has "A child across every column" with the `grid-span-full` demo; the changelog entry is under Unreleased.
- [x] gh#111 records the exception.
      Commented on gh#111, 2026-10-25.
- [x] `npm run build` stays inside every size budget.
      `cirth.min.css` 16481 B gzip of 16700 B with both new utilities.
