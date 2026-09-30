# Radius relations

| | |
| --- | --- |
| Issue | None yet: technical-language refinement, `design/technical-language-system` |
| Status | Implementing |
| Baseline | `cf4c9ae3` on `design/technical-language-system` |
| Breaking | Yes: search fields lose the pill shape, and popovers take the container radius |

Cirth has two radii from one knob: the control radius
(`--cirth-border-radius`) and the container radius
(`--cirth-card-border-radius`, one and a half times the first). Two things
break the pair. A search field is a pill, in every preset and in the search
group, so it is rounder than any card that holds it and it is the one round
box on the `plain` preset's square page. A popover is a floating container,
like the dialog's article, but it takes the control radius while the
article takes the container one. After this change every box Cirth draws
takes one of the two radii by what it is (something operated, or something
that holds content), and none is rounder than the containers around it.
Consumers who kept a search field or a popover at its default shape see it
change.

## Contract

Two radii, one knob, assigned by kind:

| Kind | Radius | Elements |
| --- | --- | --- |
| Control | `--cirth-border-radius` | fields (search included), select, buttons, the dropdown summary and its list, segmented and group ends, code blocks, nav link highlights, progress, meter, the range track |
| Container | `--cirth-card-border-radius` = control × 1.5 | `article` and its bands, the dialog's article, popovers |
| Small mark | `min(control, --cirth-radius-sm)` | checkbox, `kbd` |
| Shape | its own | radio (circle), switch track and thumb (pill), range thumb (circle) |

- **No box is rounder than the container radius.** For every element in the
  first three rows, radius ≤ `--cirth-card-border-radius`, in the default
  theme and every shipped preset, in both schemes.
- **Search is a field.** `[type="search"]` and `[role="search"]` take the
  control radius. The magnifier icon, which every search field already
  carries, is what identifies it.
- **Shapes are exempt**, because a shape is the control's meaning: a circle
  is one choice of many, a track with a thumb is a state.

Not promised:

- **Concentric corners.** A nested box is never rounder than its container,
  but its radius is not reduced by the padding between them: a card inside a
  card has the same radius, not a smaller one.
- **A pill knob.** Setting `--cirth-border-radius` to a pill makes containers
  pills too, since they are derived from it. A theme that wants pill
  controls sets `--cirth-card-border-radius` as well.
- **Radii an author sets.** A `border-radius` in the author's own stylesheet
  is outside the relation.

## Evidence ledger

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| The search field is rounder than every container that holds it | Search 9999px, standalone and in `[role="search"]`; text field 4 / 2 / 8px; `article` 6 / 3 / 12px (default / plain / playroom) | `dist/cirth.css` and `dist/presets/*.css` at `cf4c9ae3`; Chromium 149.0.7827.55, Firefox 151.0, WebKit 26.5 | Verified |
| Popovers and the dialog's article, both floating containers, take different radii | Popover 4 / 2 / 8px, the control radius; dialog `article` 6 / 3 / 12px, the container radius | Same run | Verified |
| A popover renders square | The first run read 0px in all three engines. The harness had opened a `<dialog>` with `show()` after the popover, which hides open popovers, so the value was the closed element's. Opened last, it reads 4 / 2 / 8px | Same build and engines | Invalid |
| The container radius is never below the control radius | `article` = 1.5 × the text field in all three presets | Same run | Verified |
| Checkbox and `kbd` stay small marks | 4px in `playroom`, where the control radius is 8px | Same run | Verified |
| A search field in a generic group kept pill corners against the group's square ones | gh#69, fixed then by rebinding the radius to `inherit` inside a group | Not reproduced: the fix is in place at the baseline | Reported |

## Decisions

| Decision | Basis | Rationale |
| --- | --- | --- |
| Search takes the control radius | Design | The icon already says search. A pill ignores the radius knob, so it is the one round box in `plain`, and it is rounder than any card holding it |
| Rejected: pill everywhere (every field and button) | Design | A look, not a relation, and it would make containers pills through the derivation; a theme can still choose it |
| Rejected: pill on the standalone field only | Existing contract | Two search profiles by context is the current state, and it already needed a group exception to hold together |
| Popovers take the container radius | Design | A popover holds content on the overlay level, as the dialog's article does |
| The dropdown list keeps the control radius | Design, constraint | It belongs to its summary and matches its width. A larger radius would show the first and last items' hover fill past the curve (3px at `playroom`'s 12px against a 4px inset), and the list cannot clip because a nested dropdown opens inside it |
| Rejected: concentric radii (inner = outer − inset) | Design | Needs the padding in the relation for every container, and a card's padding is fluid; "never rounder" is the promise that holds at any padding |

## Acceptance

- [ ] `tests/radius-relations.spec.js`: the kind table and the "never
      rounder" rule, measured on the built CSS in the default, classless and
      scoped builds with each preset, in three engines.
- [ ] `tests/group-search-radius.spec.js`: a search field in a generic group
      still matches the group, and the search group matches a text group.
- [ ] `docs/src/pages/forms/input-search.md`, `docs/src/pages/components/group.md`
      and `docs/src/pages/components/popover.md` describe the new shapes;
      `docs/src/pages/upgrading.md` carries the migration.

## Migration

| You relied on | Now | To keep the old shape |
| --- | --- | --- |
| A pill search field | The control radius | `[type="search"], [role="search"] { --cirth-border-radius: var(--cirth-radius-pill); }` and, for a search field inside a generic group, `.group [type="search"] { --cirth-border-radius: inherit; }` |
| A popover at the control radius | The container radius | `[popover] { border-radius: var(--cirth-border-radius); }` |

## Open questions

None.
