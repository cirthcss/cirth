# The print pass inside every main build

| | |
| --- | --- |
| Issue | None: maintainer decision, 2026-10-25, while landing gh#151 |
| Status | Implementing: every acceptance check passes (2026-10-26), the print stylesheets removed instead of deprecated; lands with its pull request |
| Baseline | `74c65f46f` on `feat/v0.17-finish` |
| Breaking | Yes: a page that links only the main build now prints with the print pass, and the print stylesheets and their four exports are removed |

Since 0.13.0 the print pass has shipped as its own stylesheet,
`cirth.print.min.css`, loaded after the main build with `media="print"`. A
page that forgets it prints with no pass at all: printed while the dark
scheme is active, it keeps its near-white text while the browser drops the
dark background, and the sheet comes out nearly blank. `.no-print` and
`.print-only` (gh#151) already live in the main build so they work without
the print sheet; the rest of the print behaviour still depends on it. After
this change every main build carries the print pass, last in the sheet, and
one `<link>` prints correctly. The separate print stylesheets go: with the
pass in every build they had nothing left to do.

## Contract

After this lands:

- Every main build (default, classless, scoped, classless scoped) emits the
  print pass under `@media print`, inside `@layer cirth`, after every other
  rule of the build, generated from `src/utilities/_print.scss`.
- A page that links only the main build prints with the pass: black ink on
  white whatever the scheme, flattened surfaces, link destinations spelled
  out, colour kept where it carries a state, nothing torn at the fold.
- On screen nothing changes: no rule of the pass applies outside print.
- The pass wins over component rules by source order, as it did from its
  own sheet loaded after the build, and a preset loaded after the build
  does not undo it: the pass declares the print ink on the body (the
  wrapper, scoped), which beats a token inherited from `:root`.
- `cirth.print*.css`, `cirth.print*.min.css`, their `src/cirth.print*.scss`
  entries and the `./print`, `./classless/print`, `./scoped/print` and
  `./classless/scoped/print` exports are removed in 0.17.0. An import of
  `@cirthcss/cirth/print` fails to resolve, and a CDN link to
  `cirth.print.min.css` at 0.17.0 or later answers 404; deleting the import
  or the `<link>` is the whole migration, because the build already prints
  the same pass.
- Unlayered `@media print` rules of the page still win over the pass,
  wherever they load.

It does **not** promise:

- a way to switch the pass off other than overriding it. A page with its
  own print design sets its own rules, which win because they are outside
  Cirth's layer;
- that the bytes stay off the critical path. The pass adds about 0.9 KB
  gzip to each main build, fetched and parsed with the rest of it.

## Evidence ledger

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| Linking only the main build prints with no pass today | The 0.13.0 changelog says so, and `tests/print.spec.js` concatenates each build with its print sheet to test the pass | `CHANGELOG.md`, `tests/print.spec.js` at `74c65f46f` | Reported |
| The pass is about 0.9 KB gzip per build | `cirth.print.min.css` 939 B, `cirth.print.scoped.min.css` 929 B, the classless pair 917 B and 908 B | `npm run check:size` at `74c65f46f`, Node 24.18.0 | Verified |
| Every main build carries the pass, verbatim and last | The body of each `cirth.print*.css` occurs byte for byte in its main build, and the main build ends with it | `dist/` built from `8c2f230ca`, 2026-10-25 | Verified |
| A page that links only the main build prints with the pass | `tests/print.spec.js` now loads each build alone: ink, flattened surfaces, link destinations and the fold, both schemes, 63 passed | Same build, Chromium 149.0.7827.55, Firefox 151.0, WebKit 26.5 | Verified |
| The deprecated print sheet changes nothing printed | Computed colour, background, border, display and `::after` content of ten elements, both schemes, identical with and without the sheet after the build, in the default, classless and scoped builds | Same run | Verified |
| A preset after the build keeps the print ink | Body, heading and link print `oklch(0 0 0)` in light and dark with material, plain or metro after the build, and with the old order build, print sheet, material | Same build, Chromium 149.0.7827.55 | Verified |
| The pass still outranks the build and loses to an author print rule | `tests/cascade-layers.spec.js` (the print pass outranks the rest of the build), with the build alone | Same run, Chromium 149.0.7827.55, Firefox 151.0, WebKit 26.5 | Verified |
| The pass adds about 0.7 KB gzip once it compresses with the build | `cirth.min.css` 16481 B → 17175 B, `cirth.scoped.min.css` 16733 B → 17430 B, the classless pair 15070 B and 15236 B | `npm run check:size`, Node 24.18.0 | Verified |
| The package keeps every entry point | `check:package`: 28 files, 16 entry points resolve; `check:consumer` finds `@media print` in every main build and in every deprecated print entry | Same build | Verified |
| Removing the print sheets changes nothing a page that loaded one prints | Follows from the row "The deprecated print sheet changes nothing printed": the sheet restated the pass the build already carries, so without it the page keeps exactly the rules it printed with | Reasoning on the verified row above, not a new measurement | Reported |
| The print entries are gone from the package | `check:package`: 20 files, 16 build outputs, 12 entry points, none of them `./print`; `dist/` holds no `cirth.print*` file; `check:consumer`, `check:dist` and `check:size` pass without them | `dist/` built from this change, Node 24.18.0, 2026-10-26 | Verified |

## Decisions

| Decision | Basis | Rationale |
| --- | --- | --- |
| Fold the pass back into the main build | Maintainer, 2026-10-25 | 0.13.0 split it out to keep about 630 B off the critical path and to let the browser fetch it at low priority. With the bytes no longer a constraint, a correct print by default and one `<link>` are worth more, and the print utilities of gh#151 already live in the main build |
| Keep the print stylesheets through 0.17, deprecated | Design | Reversed on 2026-10-26 by the next row. Removing them would break every import of `@cirthcss/cirth/print` in the same release that makes them unnecessary. Loaded beside the build they restate the same values, so keeping them costs nothing but bytes |
| Remove the print stylesheets in 0.17 | Maintainer, 2026-10-26 | Cirth is before 1.0, the known consumers do not load the print sheets, and a deprecated copy kept for one release costs four builds, four exports, size budgets and tests. The break is one line to delete, and Upgrading says which |
| Last in the build, after the theme | Constraint | From its own sheet the pass followed every rule of the build; it has to keep winning over component rules by source order |

## Acceptance

- [x] `tests/print.spec.js` tests each main build alone.
      Every paint test loads the build alone.
- [x] The print entries, files and exports are gone: `check:package` lists
      12 entry points and no `cirth.print*`; the build, the size guard, the
      dist manifest, the consumer smoke test and the tests no longer name
      them.
      Done (ledger).
- [x] Upgrading names the removal and the one-line migration, Package and
      Print no longer offer the sheets, and `CHANGELOG.md` moves them from
      Deprecated to Removed.
      Upgrading lists the removed exports and files, how each use fails and
      what to delete; Package, Print, About, Delivery, Compatibility and
      Tokens no longer mention the sheets.
- [x] A preset loaded after the main build does not change the printed ink.
      `tests/print.spec.js` (a preset loaded after the build still prints
      black ink).
- [x] `npm run check:consumer` expects `@media print` in every main build.
      Done in `scripts/smoke-consumer.js`.
- [x] The documentation site loads one stylesheet; Print, Delivery, Package
      and Presets describe one `<link>`; Upgrading and `CHANGELOG.md` carry
      the change.
      `scripts/build-docs.js` builds `cirth-docs.css` from the build alone;
      Print, Delivery, Package, Presets, Compatibility, About and the
      existing-CSS guide describe one `<link>`; Upgrading and the changelog
      carry the change.
- [x] `npm run check:size` budgets are raised by what the pass measures, and
      said so in the commit.
      By 700 to 800 B each, in `8c2f230ca`.
