# Filled icon set

| | |
| --- | --- |
| Issue | gh#82 |
| Status | Landed |
| Baseline | `66c30160e` on `design/technical-language-system` |
| Breaking | No: existing icon tokens keep their names, but their default drawings change |

Cirth replaces its thin stroked interface icons with compact filled drawings
that share one visual language. Existing markup and custom property names keep
working; consumers that rely on the exact default glyphs will see the new
shapes after upgrading.

## Contract

- `--cirth-icon-checkbox`, `--cirth-icon-minus`,
  `--cirth-icon-chevron`, `--cirth-icon-date`, `--cirth-icon-time`,
  `--cirth-icon-search`, `--cirth-icon-close`, `--cirth-icon-valid` and
  `--cirth-icon-invalid` use filled 24 by 24 SVG drawings.
- The light and dark schemes retain their existing semantic colour roles for
  neutral, success and error icons.
- Checkbox and minus continue to work as masks. The remaining icons continue
  to work in their existing background-image positions.
- Firefox date and datetime-local fields render one Cirth calendar icon, not
  that icon beside Firefox's native picker icon. Month, time and week fields
  retain Cirth's own icon behavior.
- Existing token names, selectors and markup requirements do not change.

The contract does not promise that these paths are byte-for-byte copies of
Firefox or Acorn assets. It promises a coherent filled family and the existing
functional behavior at each use site.

## Evidence ledger

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| The baseline uses thin stroked paths for the affected icon tokens | Source inspection found `stroke`, `line`, `polyline`, `rect` and `circle` drawings in the affected data URIs | `src/theme/_styles.scss`, `src/theme/_light.scss` and `src/theme/_dark.scss` at `66c30160e`, 2026-10-15 | Verified |
| The optimized filled paths keep every bundle under the 14 KB gzip budget | The branch commit records 13,675 B, 13,964 B, 12,120 B and 12,345 B for the four minified bundles | Commit `0470992a9`; not reproduced for this spec | Reported |
| The optimized paths render pixel-for-pixel like the initial filled paths | The branch commit records a comparison of all eight changed shapes | Commit `0470992a9`; not reproduced for this spec | Reported |
| The integrated icon family fits reviewed bundle budgets | The four main bundles grew from 13,155, 13,315, 15,201 and 15,429 B to 14,383, 14,552, 16,443 and 16,695 B gzip; `npm run check:size` passed with 217 to 305 B headroom | `dist/*.min.css` built from the working tree based on `66c30160e`, Node 24.18.0, 2026-10-15 | Verified |
| Firefox renders one Cirth icon for date and datetime-local, keeps the text visible and still opens the picker | The isolated page showed one calendar glyph in each field; computed styles resolved the field colour to transparent, `-webkit-text-fill-color` to the form colour and the background to the filled Cirth SVG; `showPicker()` returned without error from a user-activated button | Firefox 151.0 on macOS 26.7.1, Playwright 1.61.1, `dist/cirth.css` from the working tree based on `66c30160e`, 2026-10-15 | Verified |
| The integrated icon set is visually stable across the local browser matrix | Snapshot regeneration completed with 1,294 passed and 122 expected skips; representative date, choice, search, modal and specimen captures were inspected | Chromium, Firefox 151.0 and WebKit through Playwright 1.61.1 on macOS 26.7.1, 2026-10-15 | Verified |

## Decisions

| Decision | Basis | Rationale |
| --- | --- | --- |
| Use the optimized filled paths from `0470992a9` | Constraint | They preserve the intended drawings while substantially reducing the branch's recorded size overhead |
| Keep the current Firefox date-field fix during the merge | Existing contract | The icon redesign must not restore the duplicate native calendar icon or remove Cirth's month, time and week icons |
| Keep the loading spinner drawing, with an explicit 24 by 24 size | Design | Firefox and Acorn do not provide a corresponding spinner asset, and its circular motion already belongs with the family |
| Reject renaming the custom properties | Existing contract | The change concerns their default drawings, not their semantic roles |
| Raise the four main gzip guards | Constraint | The deliberate icon drawings add 1,228 to 1,266 B gzip on this branch; the new limits leave 217 to 305 B of regression headroom |

## Acceptance

- [x] The nine affected tokens contain the optimized filled SVG paths in all
      schemes where they are declared.
- [x] Firefox renders one Cirth calendar icon on date and datetime-local
      fields, with the picker still operable.
- [x] `npm run lint`, `npm run build`, `npm run check:dist` and
      `npm run check:size` pass on the integrated source.
- [x] The macOS visual baselines that contain affected controls are
      regenerated from the integrated branch rather than inherited from the
      older icon branch.
- [ ] The repository's Update visual baselines workflow regenerates the Linux
      set after this branch is pushed.

## Open questions

None. Linux baseline generation is an automated follow-up to the next push,
not an open design decision.
