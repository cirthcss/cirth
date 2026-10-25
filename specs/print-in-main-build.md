# The print pass inside every main build

| | |
| --- | --- |
| Issue | None: maintainer decision, 2026-10-25, while landing gh#151 |
| Status | Draft |
| Baseline | `74c65f46f` on `feat/v0.17-finish` |
| Breaking | Yes: a page that links only the main build now prints with the print pass |

Since 0.13.0 the print pass has shipped as its own stylesheet,
`cirth.print.min.css`, loaded after the main build with `media="print"`. A
page that forgets it prints with no pass at all: printed while the dark
scheme is active, it keeps its near-white text while the browser drops the
dark background, and the sheet comes out nearly blank. `.no-print` and
`.print-only` (gh#151) already live in the main build so they work without
the print sheet; the rest of the print behaviour still depends on it. After
this change every main build carries the print pass, last in the sheet, and
one `<link>` prints correctly. The print stylesheets keep shipping through
the 0.17 line, deprecated, and load harmlessly beside it.

## Contract

After this lands:

- Every main build (default, classless, scoped, classless scoped) emits the
  print pass under `@media print`, inside `@layer cirth`, after every other
  rule of the build. It is the same pass, generated from the same module,
  as the print stylesheet of the same build.
- A page that links only the main build prints with the pass: black ink on
  white whatever the scheme, flattened surfaces, link destinations spelled
  out, colour kept where it carries a state, nothing torn at the fold.
- On screen nothing changes: no rule of the pass applies outside print.
- The pass wins over component rules by source order, as it did from its
  own sheet loaded after the build, and a preset loaded after the build
  does not undo it: the pass declares the print ink on the body (the
  wrapper, scoped), which beats a token inherited from `:root`.
- `cirth.print*.css`, `cirth.print*.min.css` and the `./print`,
  `./classless/print`, `./scoped/print` and `./classless/scoped/print`
  exports still ship in 0.17, deprecated. Loading one after its main build
  restates the same declarations, so printed output is identical with or
  without it. They are removed in 0.18.0.
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

## Decisions

| Decision | Basis | Rationale |
| --- | --- | --- |
| Fold the pass back into the main build | Maintainer, 2026-10-25 | 0.13.0 split it out to keep about 630 B off the critical path and to let the browser fetch it at low priority. With the bytes no longer a constraint, a correct print by default and one `<link>` are worth more, and the print utilities of gh#151 already live in the main build |
| Keep the print stylesheets through 0.17, deprecated | Design | Removing them would break every import of `@cirthcss/cirth/print` in the same release that makes them unnecessary. Loaded beside the build they restate the same values, so keeping them costs nothing but bytes |
| Last in the build, after the theme | Constraint | From its own sheet the pass followed every rule of the build; it has to keep winning over component rules by source order |

## Acceptance

- [ ] `tests/print.spec.js` tests each main build alone, and shows that
      adding its deprecated print sheet changes nothing printed.
- [ ] A preset loaded after the main build does not change the printed ink.
- [ ] `npm run check:consumer` expects `@media print` in every main build.
- [ ] The documentation site loads one stylesheet; Print, Delivery, Package
      and Presets describe one `<link>`; Upgrading and `CHANGELOG.md` carry
      the change and the deprecation.
- [ ] `npm run check:size` budgets are raised by what the pass measures, and
      said so in the commit.
