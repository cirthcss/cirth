# Component exclusion with `.no-cirth`

| | |
| --- | --- |
| Issue | gh#125 |
| Status | Implementing |
| Baseline | `66aae745` on `develop` |
| Breaking | No — new opt-out class; existing markup without it is unchanged |

`.no-cirth` lets a consumer place a third-party widget inside a Cirth page
without Cirth's content, form, or component declarations directly styling the
marked element or anything below it. Layout, theme, accessibility, motion and
print rules remain active, as do inheritance and selectors whose declaration
subject is outside the excluded subtree.

## Contract

After this lands:

- Every component-owned section in `src/content/`, `src/forms/` and
  `src/components/` constrains its declaration subject with the
  zero-specificity guard `:where(:not(.no-cirth, .no-cirth *))`. Normalizing
  reboot rules in those files are explicitly outside the owned sections and
  remain global.
- The element carrying `.no-cirth`, all its descendants and pseudo-elements
  originating from either stop receiving those component declarations.
  Nested exclusions remain excluded; there is no re-entry class.
- The guard contributes no specificity. Existing selector specificity,
  declaration order and cascade position otherwise stay unchanged.
- The contract is the same in default, classless, scoped and scoped-classless
  builds. In a scoped build, `.cirth` still limits where Cirth operates and
  `.no-cirth` limits component declarations within that scope.
- Layout, theme, utilities and the separate print stylesheets remain global.
  Custom properties, `box-sizing`, document typography, inherited colour and
  font values, reduced-motion rules and explicitly requested layout classes
  can therefore still affect excluded content.
- Guards constrain only the element receiving a declaration. An outside
  element can still match because of excluded content inside `:has()`, and an
  outside sibling can still match a selector whose earlier sibling is inside
  the exclusion. This is intentional and is covered by acceptance tests.
- Adding or removing `.no-cirth` takes effect through ordinary selector
  matching. No JavaScript, stylesheet rewrite or initialization step is
  involved.

The public meaning is: **Cirth's component declarations do not target this
element or its descendants.** It does not mean “Cirth is off here”, restore
user-agent defaults, isolate inheritance, or create a CSS containment or
Shadow DOM boundary.

## Evidence ledger

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| The unguarded baseline builds successfully | `npm run build` exited 0 | `dist/cirth*.css` from `66aae745`, Node build on macOS, 2026-09-22 | Verified |
| The four screen bundles currently emit 620–757 selector branches | Parsed expanded CSS with PostCSS: default 757, classless 620, scoped 755, scoped-classless 618 | `dist/cirth*.css` from `66aae745`, 2026-09-22 | Verified |
| The baseline default bundle is 14,241 B gzip-9 | `npm run build` size report | `dist/cirth.min.css` from `66aae745`, 2026-09-22 | Verified |
| A subject guard preserves selector specificity | The guard is wholly inside `:where()` | CSS Selectors behavior relied on by gh#125; not yet re-measured on Cirth output | Reported |
| `:where()` plus a complex selector in `:not()` is below Cirth's browser floor | Compatibility assessment in gh#125 | Upstream/browser data not reproduced for this spec yet | Reported |
| The reference implementation keeps reset, inheritance and motion rules active | Measurements recorded by nimble.css and repeated in gh#125 | Not reproduced on Cirth yet | Reported |
| Guarding only the subject lets outside `:has()` and sibling selectors react across the boundary | Selector-model analysis in gh#125 | Not reproduced on Cirth yet | Reported |

Implementation evidence, recorded after the contract above was written:

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| Every owned selector branch is guarded and every intentionally global rule is not | `npm run check:exclusion`: 590/484/589/483 component branches guarded in default/classless/scoped/classless-scoped; 100/75/100/75 global rules unchanged; expanded and minified output parsed | Working tree from `66aae745`, Node 26.9.0 on macOS 26.7, 2026-09-22 | Verified |
| The four screen variants exclude the subject and descendants, including nested and dynamic boundaries | Focused Playwright suite: 27 passed across Chromium 149.0.7827.55, Firefox 151.0 and WebKit 26.5 | `tests/exclusion.spec.js`, macOS 26.7, 2026-09-22 | Verified |
| Reset, custom properties, inherited font, layout and reduced-motion rules remain active | Same suite checks `box-sizing`, `--cirth-primary`, button font inheritance, `.grid` and the neutralized transition token inside `.no-cirth` | `tests/exclusion.spec.js`, three Playwright engines, 2026-09-22 | Verified |
| Outside `:has()` and sibling subjects react across the boundary | An excluded modal still makes the outside `html:has(dialog:modal)` lock scroll; `input.no-cirth + small` still styles the outside `small`, while a helper inside an excluded wrapper is not styled | `tests/exclusion.spec.js`, three Playwright engines, 2026-09-22 | Verified |
| The guard does not add specificity | A later plain `button` rule overrides Cirth's guarded plain `button` rule in all three engines | `tests/exclusion.spec.js`, three Playwright engines, 2026-09-22 | Verified |
| Real Safari implements the default and scoped contracts | Manual acceptance fixtures reported 11/11 and 5/5 assertions | Safari 27.0 (21625.1.29.18.28) on macOS 26.7, `tests/fixtures/exclusion/`, 2026-09-22 | Verified |
| The change does not regress the existing behavior suite | `npm run check:behavior`: 1,101 passed, 9 skipped | Chromium 149.0.7827.55, Firefox 151.0 and WebKit 26.5 on macOS 26.7, 2026-09-22 | Verified |
| Updated documentation renders without visual regressions | Visual baseline run: 624 passed; 48 intentional macOS snapshots updated for home, About, Contributions and Get Started across light/dark, desktop/mobile and three engines | `tests/__screenshots__/*-darwin/`, macOS 26.7, 2026-09-22 | Verified |
| The published package remains CSS-only and consumable | `npm run check:package && npm run check:consumer`: 20 build outputs plus 4 metadata files packed; tarball installed and 12 entry points resolved in a clean project | Working tree package from `66aae745`, Node 26.9.0 on macOS 26.7, 2026-09-22 | Verified |

Final minified bundle measurements, using Node's gzip level 9 and default
Brotli compressor on both a clean `git archive 66aae745` and this working
tree:

| Bundle | Minified before → after | gzip-9 before → after | Brotli before → after |
| --- | ---: | ---: | ---: |
| classless | 99,886 → 116,833 B (+17.0%) | 12,455 → 12,971 B (+4.1%) | 10,769 → 11,173 B (+3.8%) |
| classless scoped | 104,031 → 120,950 B (+16.3%) | 12,649 → 13,102 B (+3.6%) | 10,882 → 11,254 B (+3.4%) |
| default | 118,315 → 138,972 B (+17.5%) | 14,241 → 14,885 B (+4.5%) | 12,318 → 12,742 B (+3.4%) |
| scoped | 123,404 → 144,033 B (+16.7%) | 14,445 → 15,054 B (+4.2%) | 12,454 → 12,861 B (+3.3%) |

## Decisions

| Decision | Basis | Rationale |
| --- | --- | --- |
| Guard content, forms and components | Design | Those are Cirth's automatic semantic styling surface and include the motivating tables, inputs and buttons. |
| Leave layout, theme, utilities and print unguarded | Existing contract | The class is a component opt-out, not a second scope system or a reset boundary. |
| Guard the declaration subject only | Design | It makes the boundary local and preserves selector meaning; trying to erase excluded nodes from every relationship would require different selectors or `@scope`. |
| Keep cross-boundary `:has()` and sibling reactions | Constraint | They target an element outside the boundary. Suppressing them would exceed the stated subject-level contract and change unrelated outside rendering. |
| Use a build-time parsed-selector transform | Constraint | Cirth publishes compiled CSS only. One parser-backed transform can cover nested Sass output, selector lists and pseudo-elements without a hand-maintained parallel selector language. |
| Mark component ownership in SCSS source | Design | The transform and invariant need an explicit, reviewable distinction between component and intentionally global rules. |
| Reject a generated-CSS regex rewrite | Constraint | Regex cannot reliably identify selector branches, pseudo-elements, functional pseudos or keyframes. |
| Reject `@scope` | Browser floor | Firefox support named in gh#125 is above Cirth's declared Firefox 130 floor. |
| No configuration switch | Existing contract | SCSS is build infrastructure, not a published package surface; every shipped CSS build should have one predictable contract. |

## Acceptance

- [x] `npm run check:exclusion` parses generated selectors and proves every
      component branch has one correctly placed guard while intentionally
      global branches have none.
- [x] The invariant covers default, classless, scoped and scoped-classless
      builds, selector lists, nested Sass, pseudo-elements and keyframes.
- [x] Browser fixtures cover the excluded element itself, descendants, nested
      exclusions, dynamic toggling, scoped output and explicit third-party
      overrides.
- [x] Browser fixtures demonstrate that layout, custom properties,
      inheritance and reduced-motion behavior keep applying.
- [x] Browser fixtures pin the decided `:has()` and sibling-combinator
      behavior across the boundary.
- [x] Behavior is verified in the current Chromium, Firefox and WebKit test
      engines; real Safari evidence is recorded separately and not inferred
      from Playwright WebKit.
- [x] `npm run lint && npm run build && npm run check:dist` passes.
- [x] The gzip delta for all four screen bundles is measured and the per-file
      size budgets are reviewed explicitly.
- [x] Consumer documentation states the one-sentence contract and the limits
      directly beneath the `.no-cirth` example.

## Open questions

1. **Exact compressed cost — closed.** The four-bundle table above replaces
   the issue's broad upper bound. Gzip growth is 3.6–4.5%; budgets now retain
   roughly 300 B of headroom per screen bundle.
2. **Real Safari verification — closed.** Safari 27.0 on macOS 26.7 passed
   both manual fixtures. Playwright WebKit remains recorded separately.
