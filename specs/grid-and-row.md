# Card grids and rows that fill

| | |
| --- | --- |
| Issue | gh#152, gh#111 |
| Status | Implementing: every acceptance check passes (2026-10-26); lands with its pull request |
| Baseline | `e53192ce3` on `feat/v0.17-finish` |
| Breaking | Yes: `.grid` columns are wider and at most three; `.row` wraps by the width of its items instead of switching at 768px |

Cirth has two layout classes, and each was asked to do the other's job.
`.grid` made as many 12rem columns as fit, so cards came out 211px wide on a
wide page, six to a row; used for a form, it kept its columns aligned, so two
fields and a full-width notes field left a hole on the fields' row
(gh#152). `.row` put every child on one line from 768px up, however many
there were, and stacked them below. After this change each does one thing.
`.grid` lays out a collection of peers, cards above all, in aligned columns
at least 16rem wide and never more than three. `.row` lays out a line of
fields or controls that always fills: its children wrap by their own width,
share each line equally, and `.full-line` gives one child a line of its own.

## Contract

After this lands, in the class builds (default and scoped):

### `.grid`

- Columns are at least `min(100%, var(--cirth-grid-min-column))` wide;
  `--cirth-grid-min-column` defaults to `16rem` (was `12rem`).
- There are never more than `--cirth-grid-max-columns` columns, a new token
  defaulting to `3`. Every column is at least `(100% − (max − 1) × gap) / max`
  wide, so no more than that many fit.
- Columns stay aligned from row to row; a last row with fewer items leaves
  the rest of it empty. Fewer items than columns share the one row
  (`auto-fit`).
- Narrower than two minimum columns and a gap, the grid is one column wide.
- Both tokens can be set on one grid: a collection of small tiles takes a
  smaller minimum and a higher maximum.
- Direct children keep `min-width: 0` and lose their flow margin, as before.

### `.row`

- A flex row that wraps. Every direct child grows from a basis of
  `--cirth-row-min-column`, a new token defaulting to `12rem`, and all grow
  equally: a line holds as many children as their bases allow, at equal
  widths, and fills.
- A child that wraps alone fills its line; on a container narrower than one
  basis every child takes a line, which is the stacked layout. No viewport
  breakpoint decides it.
- `.row > .full-line` takes a line of its own (`flex-basis: 100%`), so two
  or three fields and a notes field below them never leave a hole.
- Gaps come from `--cirth-grid-column-gap` and `--cirth-grid-row-gap`;
  direct children keep `min-width: 0` and lose their flow margin, as before.

It does **not** promise:

- aligned columns across the lines of a `.row`. Use `.grid` when alignment
  matters more than filling the line;
- that a `.row` keeps all its children on one line. A `.row` with many
  children wraps; set `--cirth-row-min-column` lower when they should stay
  together;
- `.full-line` anywhere but on a direct child of `.row`. In a card grid a
  full-width child holds every column open and leaves holes, which is why
  it is not offered there;
- a numerical span or a fixed column count class. gh#111 keeps those as
  recipes; `--cirth-grid-max-columns` is the one knob.

## Evidence ledger

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| A `.grid` child spanning every column leaves holes on a partial row | Two fields and a `.span-full` child, as the class was then named, in a grid that fits three take two columns and leave the third empty; the spanning child occupies every column, so `auto-fit` collapses none | `docs/src/content/demos/grid-span-full.html` at `e53192ce3`, Chromium 149.0.7827.55 | Verified |
| The proposed `.grid` keeps cards between about 225 and 345px and at most three to a row | Prototype in a `.container`, 3 cards: 1 column at 360px, 268+268 / 268 at 600px, 345+345 / 345 at 768px, 303 × 3 at 1024px, 309 × 3 at 1440px; with 18rem the 600px case stayed one 552px column | Prototype over `dist/cirth.css` at `e53192ce3`, Chromium 149.0.7827.55, 2026-10-26 | Verified |
| The proposed `.row` fills every line | Two fields and `.full-line`: stacked at 360px, 268+268 / 552 at 600px, 463+463 / 942 at 1024px; three fields: 225 × 3 at 768px, 268+268 / 552 at 600px | Same prototype | Verified |
| `.row` is the wrong tool for aligned tiles | Six tiles in the prototype `.row` at 1024px: four at 224px and two at 463px; in a `.grid` with six columns at most and a 10rem minimum, five and one, aligned | Same prototype | Verified |
| `.grid` as built: at most three columns of at least 16rem | `tests/layout.spec.js`: five cards in a 300px grid stack; 292+292 / 292+292 / 292 at 600px; 309 × 3 / 309 × 2 at 960px; 456 × 3 / 456 × 2 at 1400px; two cards share a 960px row at 472px; a grid with an 8rem minimum and six columns at most holds six at 147px | `dist/cirth.css` from this change, Chromium 149.0.7827.55, Firefox 151.0, WebKit 26.5, 2026-10-26 | Verified |
| `.row` as built: lines that fill, and `.full-line` on its own line | Same file, left to right and right to left: two fields and notes 472+472 / 960; three fields 309 × 3 / 960 wide, 242+242 / 500 / 500 at 500px, one per line at 300px; seven controls 228 × 4 / 309 × 3; the first child starts at the inline start; long content stays inside | Same build and engines | Verified |
| The field rows of the specimen and the state matrix look as before | Moved from `.grid` to `.row`, they matched their earlier baselines exactly: 61 captures, no difference | `npx playwright test tests/visual.spec.js`, macOS, three engines | Verified |
| Nothing in the classless builds | Neither `.grid`, `.row` nor `full-line` appears in them; the scoped build emits `.cirth .row > .full-line` | Same build | Verified |
| `.full-line` acts only on a direct child of the `.row` it sits in (gh#152's nested and parent checks) | `tests/layout.spec.js`: a `.full-line` in a row nested inside a row child takes a line of the inner row only, and the field before it fills its own; on a grandchild of `.row` and on an element outside any row it computes `flex-basis: auto` and the outer line stays two equal items. With the rule removed the first fails; with it unscoped the second fails | `dist/cirth.css` at `85c0f8066`, Chromium 149.0.7827.55, Firefox 151.0, WebKit 26.5, 2026-10-26 | Verified |

## Decisions

| Decision | Basis | Rationale |
| --- | --- | --- |
| `.grid` for collections, `.row` for lines that fill | Maintainer, 2026-10-26 | No CSS layout keeps columns aligned across rows and also fills a partial row; the two needs are different, so each class takes one |
| 16rem minimum, three columns at most | Maintainer, 2026-10-26 | Cards narrower than about 256px rarely work. At 18rem a 600px page kept one 552px card per row; above 768px the cap decides and the two values agree |
| 12rem basis for `.row` | Maintainer, 2026-10-26 | Fields and controls are narrower than cards: three fields share a line from about 610px |
| `.full-line` only in `.row` | Maintainer, 2026-10-26 | In a grid it cannot avoid holes (the earlier [grid-span-full](grid-span-full.md), withdrawn); in a row it can |
| Named `.full-line`, not `.span-full` | Maintainer, 2026-10-26 | In markup `span-full` reads as the `<span>` element, and in a flex row nothing spans: the child takes a line of its own, which the name now says. It promises no width outside `.row`, where it does nothing |
| Rejected: `auto-fill` for `.grid` | Design | Two cards would take two thirds of the row and leave the last third empty |
| Rejected: keeping the 768px breakpoint in `.row` | Design | The width that decides is the row's own, not the viewport's: a row inside a card or a sidebar would switch at the wrong moment |

## Acceptance

- [x] `tests/layout.spec.js`: `.grid` column counts and widths at several
      container widths, the three-column cap, a per-grid override, and one
      column on a phone; `.row` filling, wrapping, stacking and
      `.full-line`, in left-to-right and right-to-left text; nothing in the
      classless builds; three engines.
      26 cases, three engines, 2026-10-26 (ledger).
- [x] The examples and demos that lay out form fields with `.grid` use
      `.row`; card collections keep `.grid`.
      Checkout, settings, the text-input and validation demos, the specimen's
      and the state matrix's field rows and the order-facts list use `.row`;
      the dashboard, pricing, checkout panels, sections and swatches keep
      `.grid`.
- [x] Grid, Row, Customization, Tokens, Upgrading and `CHANGELOG.md`
      describe the change.
      All six, 2026-10-26.
- [x] `npm run check:tokens` exports the two new tokens; `npm run check:size`
      passes.
      Both pass.
