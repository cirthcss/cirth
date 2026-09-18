# Accent tokens named by role

| | |
| --- | --- |
| Issue | gh#96, gh#97 |
| Status | Landed |
| Baseline | `c4dcd4c5` on `master`; CI run `35379220685` passed |
| Breaking | Yes — custom properties only, no markup change |

The three public accent families — `primary`, `secondary`, `contrast` — rename
their downstream custom properties to say what they paint before naming a
state, matching the vocabulary the `error`, `success` and `warning` families
already use. A theme that overrides a downstream accent token must rename it.
A theme that only sets `--cirth-primary` is unaffected, and no class changes.

> **Retrospective.** This spec was reconstructed from the branch after the work
> was done, as the worked example for gh#127. It is not evidence that the
> process was followed here — the three commits on the branch carry empty
> bodies, so the reasoning was recoverable only from the diff and from
> `docs/src/pages/upgrading.md`. That is the gap this directory exists to
> close.

## Contract

After this lands:

- `--cirth-primary` stays the single input that retunes the accent. Its type
  and meaning do not change.
- Every downstream accent token names a paint role, then a state:
  `<family>-<role>` and `<family>-<role>-active`. Roles are `text`, `surface`,
  `border`, `underline`, and `on-surface`.
- `--cirth-primary-text` is a new derived role. It follows `--cirth-primary`.
- Values and relationships are unchanged. This is a rename, not a retheme;
  rendered output is expected to be identical except where a baseline records
  otherwise.
- The `.secondary` and `.contrast` classes are untouched.

It does **not** promise:

- That `--cirth-*-on-surface` derives from its accent. It remains an explicit
  light-or-dark ink that a theme must set deliberately. Renaming an existing
  `--cirth-primary-inverse` override is not enough to make a light accent
  legible; the value still has to be chosen.
- That component tokens follow the same vocabulary. They do not yet — see
  Open questions.

## Evidence ledger

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| No accent token still uses `inverse`, `hover-border` or `hover-underline` | `git grep` over `src/` at `d7f2d7aa`: 0 occurrences each | This working tree, 2026-09-18 | Verified |
| The new roles are actually emitted, not just documented | Same grep: `primary-on-surface` ×16, `primary-surface-active` ×9, `primary-text` ×11 | This working tree, 2026-09-18 | Verified |
| The migration table matches the renames applied in source | Table in `docs/src/pages/upgrading.md` compared against the `src/` diff, `master..d7f2d7aa` | This working tree, 2026-09-18 | Verified |
| 4 remaining `hover-background` matches are out of scope, not leftovers | All four are `--cirth-dropdown-hover-background-color`, a component token outside the accent families | `src/components/_dropdown.scss`, `src/theme/_light.scss`, `src/theme/_dark.scss` | Verified |
| `tests/token-override.spec.js` passes across 3 builds and every preset | `npm run check:behavior`: 1,074 passed, 9 skipped, including all token-override cases | `f7484d1c`, Playwright 1.61.1 on macOS 26.6.2, 2026-09-18 | Verified |
| Visual output is unchanged except where baselines were regenerated | `npm run check:visual:update`: 802 passed, 26 skipped; 162 Darwin baselines regenerated. Linux workflow `35374102169` regenerated the other 150 and passed | `74110491` locally and `f7484d1c` on GitHub Actions, 2026-09-18 | Verified |
| The source and emitted CSS pass the stylesheet gates | `npm run lint && npm run build && npm run check:dist`; all exited 0, including 20 parsed distribution files | `74110491` (same source as `f7484d1c`), 2026-09-18 | Verified |
| Root-level overrides reach into forced-scheme subtrees | `light-dark()` pairs on the root, with the reasoning recorded in `src/theme/_dual.scss` | Already on `master`; inherited by this branch, not introduced by it | Reported |

The last row matters for attribution: the override-reach work is context this
change relies on, not something it delivers. A ledger that blurred the two
would credit this branch with a fix it did not make.

## Decisions

| Decision | Basis | Rationale |
| --- | --- | --- |
| `on-surface` stays an explicit value | Constraint | No reliable way to pick legible ink across arbitrary hues at build time. |
| `contrast-color()` rejected | Constraint | Outside Cirth's browser floor (Chrome 123 / Firefox 130 / Safari 18.2). |
| Relative-color lightness threshold rejected | Design | A single threshold misjudges mid-lightness accents; failure mode is unreadable text, not a small visual regression. |
| Rename rather than alias the old names | Existing contract | Pre-1.0, and shipping both vocabularies would make the inconsistency permanent. |
| `primary` / `secondary` / `contrast` keep their names | Existing contract | The family names are the public vocabulary; only the downstream roles were inconsistent. |

## Acceptance

- [x] Every accent family exposes the same role set.
- [x] Migration table published in `docs/src/pages/upgrading.md`.
- [x] Override path covered by `tests/token-override.spec.js` for default,
      classless and scoped builds, with each preset stacked.
- [x] `npm run lint && npm run build && npm run check:dist` green on the branch
      head.
- [x] `npm run check:visual` green, or every diff accounted for by the rename.
- [x] `CHANGELOG.md` carries the breaking change before the release PR.

## Migration

Values and relationships are unchanged; only the names move.

| Before | After |
| --- | --- |
| `--cirth-secondary`, `--cirth-contrast` | `--cirth-secondary-text`, `--cirth-contrast-text` |
| `*-background` | `*-surface` |
| `*-hover` | `*-active` |
| `*-hover-background` | `*-surface-active` |
| `*-hover-border` | `*-border-active` |
| `*-hover-underline` | `*-underline-active` |
| `*-inverse` | `*-on-surface` |

Leave alone: `--cirth-primary` itself, the `.secondary` and `.contrast`
classes, and any theme that sets only the accent input.

## Open questions

1. **Component tokens do not follow the role vocabulary.**
   `--cirth-dropdown-hover-background-color` still reads `hover-background`
   while the accent families now read `surface-active`. Two vocabularies now
   coexist in one public surface. Deciding this is out of scope here, but
   leaving it unrecorded would let the inconsistency harden into the 1.0
   surface by default. Settle it under the Token API milestone, before 1.0.
2. **Whether `--cirth-primary-text` needs a documented contrast guarantee.**
   It derives from `--cirth-primary`, so a low-contrast accent produces
   low-contrast text with no warning at build time.
