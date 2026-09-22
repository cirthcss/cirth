# Form controls in table cells

| | |
| --- | --- |
| Issue | gh#108 |
| Status | Draft — the core API decision is the maintainer's, taken at review of this branch |
| Baseline | `c4dcd4c5` on `master`, branch `feat/issue-108-table-controls` |
| Breaking | No — a new opt-in class; existing tables render as before |

Class-based builds gain `table.controls`. When a cell holds a form control
directly, the cell gives most of its padding to the control, and the control
drops its stacking margin. A row of fields then stops reading as a box inside
a box. The controls themselves do not change. The classless builds are
byte-identical to `master`.

## Contract

After this lands, in a `table.controls`:

- a `th` or `td` whose direct child is an `input` (not checkbox, radio or
  hidden), `select`, `textarea` or `button` has a padding of a quarter of
  `--cirth-spacing` on every side. Text cells keep the standard padding;
- that control has no margin;
- a `select` in such a cell is never narrower than its content, so a narrow
  table scrolls in its container instead of hiding the selected value;
- border, background, opacity, hover, focus ring, readonly, disabled and
  validity states are exactly the ones the same control has outside a
  table, and every control keeps the 44px block size.

It does **not** promise:

- Accessible names. Headers do not label controls, and the variant cannot
  add a name. The documented pattern is `aria-labelledby` pointing at the
  column header and the row header; a repeated button uses
  `aria-describedby` with the row header.
- Any data-grid behaviour: arrow-key navigation between cells, selection,
  editing state, sorting or virtualisation (out of scope per gh#108).
- Transparent resting borders. See Decisions.
- Anything for checkboxes and radios beyond what tables already do. They
  are small enough that the double container does not arise.

## Evidence ledger

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| Control cells lose padding and text cells keep theirs; controls have no margin and stay ≥ 44px | `tests/table-controls.spec.js`, 10 tests × 3 engines: 30 passed | `dist/cirth.css` from this branch on `c4dcd4c5`; Chromium 149.0.7827.55, Firefox 151.0, WebKit 26.5 (Playwright 1.61.1, macOS 26.6.2), 2026-09-18 | Verified |
| Every state is unchanged by the variant | Same run: border colour, style and width, opacity and background equal a reference control outside the table, for default, `aria-invalid`, disabled, readonly and button; hover border and focus box-shadow equal too | Same | Verified |
| The state test can fail | Adding `border-color: transparent` to the cell controls failed that test in all three engines. Restored afterwards | Same | Verified |
| Names come from `aria-labelledby`/`aria-describedby` as documented | Same run: `spinbutton "Quantity Apples"`, `combobox "Bin Apples"`, `textbox "Note Pears"`, `button "Save"` described by "Apples" | Same | Verified |
| Focus rings are not clipped by `.overflow-auto`; at 320px the table scrolls in its container and the page does not | Same run, first and last column | Same | Verified |
| Without the `select` floor, auto table layout hid the selected value | At 420px, the demo's select measured 58px against a 78–79px content width in all three engines, with or without `.controls`. With the floor it measured 79px | Same engines, before and after the rule | Verified |
| RTL, forced colors and axe | Same run: controls stay inside their cells with the row header on the right in RTL; every control keeps a solid border under `forcedColors: "active"` in all three engines; axe finds nothing on the region. `npm run check:a11y`: no new violations across 50 pages × 3 themes × 3 modes | Same; `check:a11y` on Chromium 149 | Verified |
| Cost | `cirth.min.css` +333 B minified, +53 B gzip-9 (14,255 → 14,308); `cirth.scoped.min.css` +354 B, +54 B; classless +0 | Compared with `dist/` built from `c4dcd4c5` | Verified |
| Only one docs page changes visually | `class="controls"` appears only in `docs/dist/content/table/index.html`; its 12 Darwin baselines were regenerated | This branch | Verified |
| A cell plus a full bordered control reads as a heavy double container | Described in gh#108, from picocss/pico discussion #495; also visible in a side-by-side render made for this branch | Not measured | Reported |

A defect found along the way, not caused or fixed here: a `.sr-only` element
inside `.overflow-auto` escapes the scroll container. It is absolutely
positioned with no positioned ancestor, and it widens the page. A plain
wide table with one `.sr-only` cell overflowed a 320px page by 1,111px. The
first draft of the demo used `.sr-only` for an "Actions" header and
overflowed by 26px; the demo now uses a visible header.

## Decisions

| Decision | Basis | Rationale |
| --- | --- | --- |
| Reduce the cell's padding; keep the control's border | Constraint | The border is what identifies a field (WCAG 1.4.11). The field background differs from the canvas by only `l − 0.008`, far below 3:1. Rejected: transparent resting borders revealed on hover and focus, which leave an untouched field unidentifiable. |
| Opt-in with a table class, classes build only | Existing contract | Same shape as `.striped`. A `:has()` trigger on every table would restyle tables that did not ask for it. |
| Let a direct-child control trigger the cell change | Design | This keeps the markup plain (`<td><input></td>`) and leaves mixed rows of text and controls alone. |
| Hold `select` at its content width | Design | Auto table layout squeezes a select below its value before it lets the table overflow. Rejected: a floor on every control, which would make number and text fields needlessly wide. |
| No new custom properties | Design | This keeps the token surface and the size cost down. |

## Acceptance

- [x] Text/number inputs, select, buttons, readonly, disabled, valid/invalid,
      hover and focus (`tests/table-controls.spec.js`, registered in
      `playwright.behavior.config.js`).
- [x] 44px floor; accessible-name pattern documented and tested.
- [x] `.overflow-auto`, RTL, forced colors and all three engines.
- [x] CSS cost measured (ledger).
- [x] Documentation and live example: "Form controls in cells" in
      `docs/src/pages/content/table.md`, `docs/src/content/demos/table-controls.html`.
- [ ] **Decision recorded on gh#108**: promote (merge this branch), revise, or
      reject.

## Open questions

- **Name.** `.controls` names what the table holds. The alternatives
  considered were `.fields`, which does not cover buttons, `.flush`, which
  names the look but could read as "no padding anywhere", and `.editable`,
  rejected because it implies an editing state this does not provide.
- **Size budget.** This leaves 206 B gzip under the `cirth.min.css` budget.
  gh#107, prototyped in parallel, needs 136 B of the same headroom. Together
  they fit, with about 70 B to spare.
- **The `.sr-only` leak** is fixed separately on
  `fix/box-shadow-and-sr-only-overflow` (`position: relative` on
  `.overflow-auto`). Once that lands, the demo could return to an
  `.sr-only` "Actions" header; the visible one is kept because it reads
  fine and does not depend on the fix.
