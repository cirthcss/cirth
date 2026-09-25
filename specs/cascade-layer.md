# Cirth ships in one cascade layer

| | |
| --- | --- |
| Issue | gh#124, superseding the "do not wrap" decision recorded in gh#110 |
| Status | Implementing |
| Baseline | `c4dcd4c5` on `master`; implemented in `7a98b5d6` on `feat/issue-124-cascade-layers` |
| Breaking | Yes — cascade only; no class, token, file or markup change |

Every stylesheet Cirth publishes — the four screen builds, their four print
sheets and every preset — puts all of its rules inside one cascade layer,
`@layer cirth`. CSS a consumer writes outside a layer now beats Cirth whatever
its specificity and wherever it loads. That affects anyone who relied on Cirth
overriding other CSS: a stylesheet loaded *before* Cirth so that Cirth would
win, a host page around a scoped build, or animations and print styles that
Cirth's reduced-motion and print passes used to overrule. Separately, presets
now reach inside a scoped build's wrapper, which they never did.

## Contract

After this lands:

- Every rule in every `dist/*.css` and `dist/presets/*.css`, expanded and
  minified, sits inside one top-level `@layer cirth { … }` block. Nothing else
  is at the top level except `@charset`. There are no sub-layers and no other
  layer names.
- Inside that block the rules, their order and their specificity are exactly
  what the unlayered build emitted. Cirth's own cascade — theme against
  components, preset against theme, print against components — resolves as it
  did before.
- A declaration outside any layer beats every Cirth declaration, whatever its
  specificity and whatever the loading order.
- A consumer's own layers sort against `cirth` by the ordinary rules: a
  `@layer` statement placed before Cirth loads fixes the order
  (`@layer reset, cirth, app;`); without one, `cirth` takes the position where
  it first appears.
- Presets and print sheets are in the same layer, so between Cirth's own
  stylesheets source order still decides: build, then preset, then print.
- Scoped builds are layered like the others. Their containment promise is
  unchanged — no rule matches outside `.cirth`.
- A preset declares on `:root`, `:host` and `.cirth`, so it applies inside a
  scoped build's wrapper as well as on an unscoped page.
- Importing Cirth into a layer yourself, the gh#110 path
  (`@import url(…) layer(cirth)`), still works: the rules land in `cirth.cirth`,
  which sorts wherever `cirth` does.
- Cirth emits no `!important`. Inside a layer an important declaration would
  outrank every unlayered important one, so the contract depends on it.

It does **not** promise:

- **Any name below `cirth`.** There are no sub-layers. Do not write
  `cirth.base` or similar into your own order statement. If sub-layers are
  added later they go inside `cirth`, and anything ordered against `cirth` as a
  whole will not see the change.
- **That a scoped build holds its ground against its host page.** It never
  promised this. The `.cirth` prefix happened to give every selector an extra
  `(0,1,0)`, so a host `h1 {}` or `button {}` lost inside the wrapper, while a
  host `.entry-content a {}` already won. Now every unlayered host rule wins.
  Isolation from a host you do not control is a shadow root's job: the host's
  rules do not cross it.
- **That a token set on `:root` or `html` reaches inside a scoped wrapper.**
  The wrapper declares its tokens on itself, and a declaration on an element
  beats one it would inherit, at any layer or specificity. That is inheritance,
  not the cascade, and layering does not change it. Set scoped tokens on
  `.cirth`.
- **That Cirth's defensive rules override your CSS.** `[hidden]`, `.sr-only`,
  a popover's declared centring, the reduced-motion pass and the print pass
  still override Cirth's own rules. They no longer override yours. The
  popover is the sharpest case: `cef91fa6` declared its centring so that an
  accidental layout rule could not knock it off while an author naming the
  element still could. A layer cannot tell those two apart, so both now
  win.

## Evidence ledger

Browsers are Playwright 1.61.1's engines — Chromium 149.0.7827.55, Firefox
151.0, WebKit 26.5 — on macOS 26.6.2, measured 2026-09-19. "Baseline dist"
means `npm run build` at `c4dcd4c5`; "branch dist" means `npm run build` of
the source committed in `7a98b5d6`.

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| Consumer CSS competes with Cirth on specificity | 609 of the 757 selectors in `dist/cirth.css` are more specific than a bare type selector. In `dist/cirth.scoped.css` all 755 are at least `(0,1,0)` | Baseline dist, selector specificity computed with `postcss-selector-parser` | Verified |
| The issue's count of 71 `:where()` uses | 71 in `dist/cirth.css`, 71 in `dist/cirth.min.css` | Baseline dist, `grep -o` | Verified |
| Natural overrides lose today and win once layered | 8 one-line overrides (`summary {color}`, `html {--cirth-primary}`, a dropdown link, a striped `th`, `.secondary`, `nav a`, …). Default build: 4 of 8 lose as shipped, 0 of 8 when wrapped in `@layer cirth`. Scoped build: 7 of 8 lose as shipped, 1 of 8 when wrapped — the `html` token case, which is inheritance (see Contract) | Baseline dist, Chromium 149 | Verified |
| Wrapping with `meta.load-css()` inside `@layer` changes nothing inside the layer | The docs' `@use "src"; @use "src/utilities/print"` compiled plain and inside `@layer cirth { @include meta.load-css(…) }`: the unwrapped rule text is identical, ignoring blank lines | sass-embedded 1.100 over `c4dcd4c5` source | Verified |
| Ordered sub-layers would change Cirth's own rendering | The docs' `src` build compiled twice — one flat `cirth` layer, and seven sub-layers in source order (`layout`, `content`, `forms`, `components`, `utilities`, `theme`, `print`), and each swapped in for `cirth-docs.css`. Computed styles of every element and generated pseudo-element on 50 pages, light and dark: all 100 renders differ, 2,102 (element, property) pairs. Among them `<select>` inline padding 40px → 8px, which runs text under the chevron, and `cursor: pointer` → `not-allowed` on busy `.secondary` buttons | Docs build of `c4dcd4c5`, Chromium 149 | Verified |
| Inside the layer, every shipped artifact is the unlayered build | All 20 files in `dist/` are one `@layer cirth` block. Unwrapped, the minified files are byte-identical to baseline dist and the expanded ones identical but for the block's two spaces of indentation; the presets differ only in the added `.cirth` root | Branch dist against baseline dist | Verified |
| Layering changes nothing the docs site renders at rest | The same 50-page, two-scheme computed-style comparison, unlayered against flat-layered: 0 differing pairs once custom-property values are compared with whitespace collapsed. Uncollapsed, 5,028,360 pairs differ, all of them the extra indentation Sass writes into multi-line custom-property values inside the block, which `getPropertyValue()` preserves and rendering ignores | Docs build of `c4dcd4c5`, Chromium 149 | Verified |
| The first, uncollapsed comparison showed the layer changing the docs' rendering | Its 5,028,360 differing pairs were whitespace inside custom-property values, not rendering (row above) | As above | Invalid |
| An accidental layout rule now moves an open popover | The docs Popover demo opened 355px below the viewport's centre with the layer and `.docs-demo-preview > :last-child { margin-bottom: 0 }`; centred again with `:not([popover])` added. `tests/popover.spec.js`'s former "stays centred even when page CSS zeroes its margin" failed in all three engines on branch dist before it was rewritten | Branch docs build, Chromium 149; behavior suite on branch dist | Verified |
| The homepage theme preview depended on root-level rules | Reading `presets/plain.css` compiled with the layer: 0 of its 2 rules sit at the root, so the preview would have listed no declarations. After the reader change the served `states` are byte-identical to the baseline site's | `docs/eleventy.config.js`, branch docs build | Verified |
| The fixture proves the layer and nothing else | `tests/cascade-layers.spec.js` and `tests/popover.spec.js` against baseline dist: 33 fail and 19 pass in each engine. The passes are containment and the host-layer remedy (true either way), the gh#110 import of an unlayered file, and the 14 popover cases the layer does not touch | Baseline dist, three engines | Verified |
| `check:dist` refuses an unlayered build | 3,188 violations on baseline dist; clean on branch dist | `node scripts/check-dist.js` | Verified |
| The published package carries the layer | `check:consumer` packs, installs and resolves 12 entry points; each opens with `@layer cirth` | Branch dist, packed with npm 11.19.1 | Verified |
| The documented import examples work as written, and a broken one is caught | `tests/cascade-layers.spec.js` loads the three CSS examples with an `@import` from Customization → Cascade layers verbatim, specifiers resolved through the package's `exports`: every import survives parsing, loads, and lands in the layer it names. With one import moved below a rule, example 1 failed | Branch dist, three engines; the broken variant in Chromium 149 | Verified |
| The layer and gh#126's build-time prefix compose | `feat/issue-126-configurable-prefix` (`a5702b78`) merged into this branch in a throwaway worktree: text merges cleanly, only the Contributions baselines conflict. Its `check-prefix.js` passes (7 checks, 20 files differ by the prefix alone); `npm run build -- --prefix "--acme-"` passes `check:dist`, leaves no `--cirth-`, keeps `@layer cirth`; a preset applies and `html { --acme-primary }` loaded before both wins | Trial merge of `fc633a6e` and `a5702b78`, Chromium 149 | Verified |
| The change holds on Linux CI, visual baselines included | CI run 35406816022 on `dde39b45`, the bot's Linux baseline regeneration: every step green. The behavior suite passed 1,203 with 9 skipped and no retry, visual passed 802 with 26 skipped, plus axe, `check:tooling`, package contents and tarball install. The bot regenerated exactly the Linux counterparts of the macOS set (the same 8 pages × 12 projects) and nothing else | GitHub Actions `ubuntu-latest`, 2026-09-19 | Verified |
| The layer costs bytes inside the budget | `dist/cirth.min.css` 14,241 → 14,251 B gzipped, print sheets +8 B; every file still under its budget | `npm run build` size check, baseline and branch | Verified |
| Presets never reached a scoped build | `cirth.scoped.css` + `presets/plain.css`: a link inside `.cirth` paints `oklch(0.527 0.107 44)`, the copper default, not plain's blue | Baseline dist, Chromium 149 | Verified |
| `docs/src/pages/colors.md` says a preset "works with any of the default, classless, or scoped builds" | False for scoped (row above) | `c4dcd4c5` | Invalid |
| gh#124 says gh#110 "documents the opt-in `@import … layer(cirth)` path" | No page documents it. `git grep "layer(cirth"` finds nothing on any local or remote branch, no PR references gh#110, and gh#110 is still open. The guidance exists only in the issue body | Every local and remote ref except this branch, 2026-09-19 | Invalid |
| Inside a scoped wrapper, host element rules lose today and win once layered | `button {background-color}`, `a {color}` and `h1 {font-size}` in an unlayered sheet: Cirth's values hold as shipped; the host's values apply when Cirth is wrapped | Baseline dist, Chromium 149 | Verified |
| Cascade layers are inside the browser floor | `@layer` shipped in Chrome 99, Firefox 97 and Safari 15.4; the floor is Chrome 123 / Firefox 130 / Safari 18.2 | MDN compatibility data, not reproduced on floor browsers | Reported |
| Prior art: nimble.css layers every rule, in `nimble.reset`, `nimble.base` and `nimble.utilities` | Quoted in gh#124 | Not inspected here | Reported |

## Decisions

| Decision | Basis | Rationale |
| --- | --- | --- |
| Layer everything Cirth emits | Design | "Unlayered consumer CSS beats all of Cirth" is a rule with no exceptions to learn. |
| — rejected: layer the reset and base, leave components and utilities unlayered | Design | Leaves the specificity contest in place for the rules people override most, and unlayered Cirth rules would beat layered Cirth rules at any specificity, which reorders Cirth's own cascade. |
| — rejected: leave the defensive rules (`[hidden]`, `.sr-only`, reduced motion) unlayered | Design | The same internal reordering, plus an exception list in the public contract. What they stop doing is recorded under Migration instead. |
| One flat layer named `cirth` | Evidence | The only arrangement that is provably neutral for Cirth's own cascade: same rules, same order, same specificity. |
| — rejected: ordered sub-layers (`cirth.reset`, `cirth.base`, …, nimble-style) | Evidence, Design | Moving rules into ordered layers overrides specificity *between Cirth's own rules*, and the measurement shows that changes rendered output. Sub-layer names would also become API, and a consumer has no use for interleaving with them. Flat now keeps the door open, because sub-layers can be added inside `cirth` later without moving it. |
| The existing artifacts become layered; no new artifact | Constraint | A second set doubles 8 root builds plus presets and splits the documentation. It would also add nothing, because anyone wanting unlayered-then-layered behaviour already had the gh#110 import. |
| Scoped builds are layered too | Constraint, Design | A preset is one file for every build. Next to an unlayered scoped build, a layered preset always loses to the wrapper's own declarations. An unlayered preset would fall back into the consumer's tier and fight their overrides on specificity. The protection given up was partial, accidental and undocumented, and the project already isolates its own embedded demo in a shadow root. |
| — rejected: keep scoped builds unlayered | Design | Splits the rule into "layered except in two of eight builds" and breaks presets, as above. |
| Presets emit into `cirth`, after the build, rather than into a later layer | Design | Source order already puts them after the theme, exactly as today. A second top-level name (`cirth-presets`) would make ordering depend on which file a page happened to load first, unless every file carried an order statement. |
| Presets declare on `.cirth` as well as `:root, :host` | Existing contract | The docs promise presets work with scoped builds. Per-build preset files would grow the matrix. |
| The layer is added in SCSS, through one mixin (`src/helpers/_cascade.scss`): `_index.scss` loads the unchanged module list, now `_modules.scss`, inside it with `meta.load-css()`; `utilities/_print.scss` and each preset wrap themselves | Design | The docs site compiles `src` directly (`scripts/build-docs.js`), so a wrapper added by a build script or in the entrypoints would leave the site dogfooding a different cascade from the package. `@use` cannot be nested; `meta.load-css()` emits the same modules with the same configuration in the same order. |
| The popover keeps its margin-based centring (`inset: 0; margin: auto`), and the lost guarantee is documented | Constraint | Nothing can defend a rule against an unlayered author rule without `!important`. Centring by `translate` would stop `position-area` overriding it cleanly, which `cef91fa6` promised; `place-self` on an absolutely positioned box is outside the browser floor and would fight `position-area` too. The docs site's own trailing-margin rule now excludes `[popover]`. |
| The layer name does not follow gh#126's custom-property prefix | Design | A prefix exists because custom properties inherit and collide with a host's tokens. A layer name does neither: two stylesheets that share one merge into a single cascade position. The `.cirth` scope class stays fixed under that branch for the same reason, and a consumer who needs Cirth elsewhere in their order imports it into a layer of their own. A second name would split every order statement in the documentation by build flag. |
| No `@layer cirth;` order statement is emitted | Design | With one name, the block itself is the declaration. A consumer who needs a fixed position writes their own statement before Cirth loads. |
| `!important` stays banned, now asserted in the emitted CSS too | Existing contract | Stylelint already refuses it in the source. Inside a layer it would invert against the consumer, so `check:dist` checks the output as well. |

## Acceptance

- [x] `npm run check:dist` asserts that every build and preset, expanded and
      minified, is one top-level `@layer cirth` block with no other layer name
      and no `!important`.
- [x] `npm run check:consumer` finds `@layer cirth` in every published entry
      point.
- [x] `tests/cascade-layers.spec.js`, on Chromium, Firefox and WebKit
      (111 passed on branch dist):
  - [x] unlayered author CSS beats Cirth with a selector no more specific than
        a type or single class, loaded before *and* after Cirth, in the
        default, classless, scoped and classless-scoped builds;
  - [x] every preset beats the theme and loses to the consumer in every build,
        in either loading order of consumer and preset;
  - [x] scoped: nothing outside `.cirth` is styled, host rules now win inside
        it, and both remedies — a host layer declared before `cirth`, and a
        shadow root — hold;
  - [x] the gh#110 `@import … layer(cirth)` path nests as `cirth.cirth` and
        keeps every outcome above;
  - [x] a consumer order statement places `cirth` deterministically.
- [x] Every artifact's rules, unwrapped, are identical to the baseline's
      except the preset root selector.
- [x] `tests/popover.spec.js` pins the popover trade-off in both directions:
      centred against layout CSS that yields to Cirth, moved by an unlayered
      rule that reaches it. The docs Popover demo opens centred.
- [x] The docs site renders as before apart from its edited text: computed
      styles unchanged, and `npm run check:visual` failing only on the pages
      whose copy changed, with those baselines regenerated — the Darwin
      set in `33e775f0`; the Linux set is left to
      `update-visual-baselines.yml` on push.
- [x] Documentation: `docs/src/pages/customization.md#cascade-layers`, plus
      `get-started.md`, `colors.md`, `upgrading.md`,
      `utilities/print.md` and `about.md` no longer contradict it.
- [x] gh#110's remaining acceptance — a documentation fixture that catches
      a broken import example — met by the Customization-page examples in
      `tests/cascade-layers.spec.js`.
- [x] `CHANGELOG.md` states what stops winning and what starts winning.
- [x] `npm run lint`, `build`, `check:dist`, `check:size`, `check:package`,
      `check:consumer` and `check:tooling` exit 0 on `33e775f0`, as do
      `check:behavior` (1,188 passed, 9 skipped) and `check:visual` (802
      passed, 26 skipped), on macOS.
- [x] CI green with the Linux baselines included: run 35406816022 on
      `dde39b45`, the head of gh#135 once the bot's baselines landed.

## Migration

| If you… | What changes | Do this |
| --- | --- | --- |
| Override Cirth in your own stylesheet | Nothing breaks, and your rule now wins at any specificity, in any loading order | You can drop `:root:not(…)`, `.cirth`-prefixed or repeated-class selectors you wrote to out-weigh Cirth |
| Load a stylesheet *before* Cirth so Cirth overrides it (a reset, legacy base styles, a third-party widget theme) | That stylesheet now beats Cirth wherever they overlap | Put it in a layer that sorts before Cirth: `@layer legacy, cirth;` then `@import url(legacy.css) layer(legacy);` |
| Embed a scoped build in a page with its own global CSS | The host's unlayered rules now win inside `.cirth` | If the host CSS is yours, layer it as above. If it is not, mount the widget in a shadow root |
| Rely on `[hidden]` or `.sr-only` beating your own element rules | Your `display` or `position` now wins | Scope your rule, e.g. `nav ul:not([hidden])` |
| Have a layout rule that reaches a popover by accident (`.panel > :last-child { margin-bottom: 0 }`) | It beats the popover's own centring (`inset: 0; margin: auto`), and the open panel slides to an edge | Leave popovers out: `:last-child:not([popover])` |
| Rely on Cirth's reduced-motion or print pass to neutralise your own animations or screen styles | They no longer reach your rules | Add your own `@media (prefers-reduced-motion: reduce)` / `@media print` rules |
| Import Cirth with `@import url(…) layer(cirth)` (gh#110) | Nothing: it nests as `cirth.cirth` and sorts the same | Optional: switch back to a plain `<link>` and drop the import's serial fetch |
| Import Cirth into a layer of another name to position it | Nothing, it nests as `yourname.cirth` | Optional: replace it with an order statement naming `cirth` |
| Load a preset with a scoped build | The preset now applies inside `.cirth`; before, it silently did nothing | Remove any workaround that copied preset values onto `.cirth` |

Leave alone: every class, every custom property, every file name and export
path, and the loading order of build, preset and print sheet.

## Open questions

1. **gh#110 is still open.** Its decision — "do not wrap the standard build in
   `@layer`" — is reversed here, and its documentation acceptance is met by
   `customization.md#cascade-layers`. Closing it against this change is the
   maintainer's call.

   *Closed.* Every acceptance item of gh#110 is now met: the local-package
   and CDN forms, layer order, the precedence of unlayered styles and the
   `@import` placement rule on the Customization page; scoped and preset
   ordering there and in the fixture; and a fixture that runs the page's
   import examples. The pull request closes gh#110 together with gh#124
   when it merges, not before.
2. **Sub-layers.** Rejected for now on evidence. Revisit only with a concrete
   consumer case that cannot be expressed as "before `cirth`" or "after
   `cirth`", and move every rule at once so that `cirth` itself stays empty.
3. **A configurable prefix (gh#126, in flight on
   `feat/issue-126-configurable-prefix`).** That branch renames `--cirth-*` at
   build time. Whether the layer name should follow the prefix is its
   decision. If it does, `src/helpers/_cascade.scss` and `layerName` in
   `scripts/lib/dist-manifest.js` are the two places to change, and
   `check:dist` will refuse a build where they disagree.

   *Closed: it does not* ; see Decisions. A trial merge of the two branches
   proved they compose unchanged (Evidence ledger). Whichever lands second
   regenerates the Contributions-page baselines, the one conflict.
