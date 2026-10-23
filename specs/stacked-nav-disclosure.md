# A nav inside a disclosure stacks

| | |
| --- | --- |
| Issue | Documentation dogfooding, `design/technical-language-system` |
| Status | Landed on `develop` |
| Baseline | `66d8a9cf0` on `design/technical-language-system` |
| Breaking | No |

A `nav` inside an `<aside>` already renders as a stacked rail: its list and
items are blocks, the inline gutter is zero and the current entry is marked
on the inline-start edge. A `nav` inside a `<details>` disclosure rendered as
a horizontal bar, so every collapsible menu, mobile index and "On this page"
disclosure had to undo the bar by hand, and the documented recipe for doing so
left the current-page marker under the link. After this change a `nav` inside
`<details>` stacks exactly as one inside `<aside>` does. Links and summaries
in either kind of stacked nav also draw their focus ring inside their own box,
so a scrolling rail no longer clips it.

## Contract

After this lands, in every build:

- `:is(aside, details) nav` is a stacked nav: the nav, its lists and its
  items are `display: block`, `--cirth-nav-element-spacing-horizontal` is
  `0`, items keep half the vertical rhythm, and a link's
  `aria-current`/`aria-selected="true"` state paints the inline-start edge
  in `--cirth-primary-text` instead of the block-end edge.
- A focused link or summary (`:focus-visible`) inside a stacked nav has
  `outline-offset: calc(var(--cirth-outline-width) * -1)`: the ring sits on
  the element's own edge, inside any overflow container the nav is in.

It does **not** promise:

- a stacked layout for a `nav` in any other container. A `dialog` can hold a
  horizontal bar, and a footer often does; those still use the recipe in the
  Nav page;
- anything about `details.dropdown` beyond what the dropdown already does:
  its menu is a positioned list, and a `nav` inside one simply stacks;
- a change to the navbar (`header > nav`) or to breadcrumbs.

## Evidence ledger

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| Before: a nav in `<details>` rendered as a row with the marker under the link | `ul` computed `display: flex`, the second `li` on the first row, current link `border-bottom-color` the accent and `border-left-width: 0px` | `dist/cirth.css` at `66d8a9cf0`; Chromium 149.0.7827.55, Firefox 151.0, WebKit 26.5; probe script, 2026-10-12 | Verified |
| Before: a nav in `<aside>` already stacked with the marker on the inline start | `ul` `display: block`, second `li` below the first, `border-left: 2px` accent | Same run | Verified |
| Before: a focused link in a stacked nav drew its ring 2px outside its box | `outline-offset: 2px` on the focused link inside a 200px `overflow-y: auto` rail | Same run | Verified |
| After: a nav in `<details>` stacks with the inline-start marker, a nav outside `aside` and `details` stays a bar, and stacked links and summaries draw an inset ring | `tests/nav-stacked.spec.js`, 12 of 12 passed | `dist/cirth.css` built from this branch; Chromium 149.0.7827.55, Firefox 151.0, WebKit 26.5, 2026-10-12 | Verified |
| This change alters the built stylesheets only in the stacked-nav selectors and the new focus rule | Structural diff of every file in `dist/` before and after the change to `src/components/_nav.scss` alone: nine declarations move from `aside nav` to `:is(aside, details) nav`, one is added | `dist/` from this branch, 2026-10-12 | Verified |
| A horizontal nav, its dropdowns and its target sizes are unchanged | `tests/nav-dropdown.spec.js`, `tests/nav-target-size.spec.js` and `tests/layout.spec.js` pass inside `npm run check:behavior` (1965 passed; the 5 failures were load timeouts in Firefox's whole-site resilience walks, which pass when rerun) | This branch, three engines, 2026-10-13 | Verified |
| The documentation's mobile index renders as before without its local stacking rules | Pixel comparison of the open "Documentation" disclosure on 37 pages, two schemes, two viewports, against the site built at `66d8a9cf0`: identical | Chromium 149.0.7827.55, 2026-10-12 | Verified |
| The documentation renders as before apart from the intended changes | `npm run check:visual`: 96 screenshots changed for documented reasons (the Nav page's text, the measured stylesheet size, the Themes swatch order) and were re-baselined on macOS; the rerun passed 1294 of 1294 | `docs/dist` from this branch; Chromium, Firefox and WebKit as above, 2026-10-13 | Verified |
| The documentation's "On this page" disclosure renders as before | The open disclosure's links move 2px toward the inline end: the stacked nav reserves the inline-start edge for the current marker, as the mobile index already did | Same comparison | Invalid |

## Decisions

| Decision | Basis | Rationale |
| --- | --- | --- |
| Extend the automatic trigger to `details` | Existing contract | A disclosure is where a stacked nav most often lives after a rail; the Nav page already named it as the case authors had to handle by hand. |
| Rejected: `dialog nav` | Design | A dialog can legitimately hold a horizontal bar. Kept out, as before. |
| Rejected: a `.stacked` class | Design | It would not exist in the classless build, and the element relation already says what the nav is. |
| Rejected: `aria-orientation` as the hook | Constraint | Not a supported property on the navigation role. |
| Inset focus ring only in stacked navs | Design | Rows in a stacked nav tile edge to edge, usually in a scrolling rail; an outset ring overlaps the neighbouring row and is clipped by the rail. A bar's links keep the outset ring every other control draws. |

## Acceptance

- [x] `tests/nav-stacked.spec.js` passes in Chromium, Firefox and WebKit.
- [x] `npm run check:visual` passes with the documentation's local stacking
  rules removed.
- [x] `docs/src/pages/components/nav.md` documents `details` beside `aside`.
- [x] `CHANGELOG.md` records the change under Unreleased.

## Open questions

None.
