# Elena-informed default theme refresh

| | |
| --- | --- |
| Issue | None yet: local work on `design/technical-language-system` |
| Status | Landed on `develop` |
| Baseline | `ed959bcf9e5d4d90d99a9e26cc70d91bafc72385` on `design/technical-language-system` |
| Breaking | Yes: default heading sizes and weight, default radii, and interactive motion change; no public selector or token is removed or renamed |

Implementation and local verification are complete, and the work is
integrated on `develop`.

Cirth already has the right structural language for a quiet technical UI:
semantic elements, thin edges, inherited surface roles, restrained elevation,
and one focus model. Its remaining defaults do not form the same compact
system. The desktop heading ladder grows to 40px, the default card radius is
only 6px, pressed buttons have no physical response, and the documentation
outline has a static active rail. This refresh makes those choices deliberate
and coherent while preserving Cirth's palette, CSS-only package, semantic-first
modes, browser floor, and target sizes.

Elena is a visual and interaction reference, not a source to transplant. The
reference was inspected at commit
[`8c51392b9db01d7e66bd1d238fdc51427ead60c6`](https://github.com/arielsalminen/elena/commit/8c51392b9db01d7e66bd1d238fdc51427ead60c6),
especially
[`custom.css`](https://github.com/arielsalminen/elena/blob/8c51392b9db01d7e66bd1d238fdc51427ead60c6/docs/.vitepress/theme/custom.css)
and
[`VPDocAsideOutline.vue`](https://github.com/arielsalminen/elena/blob/8c51392b9db01d7e66bd1d238fdc51427ead60c6/docs/.vitepress/theme/components/VPDocAsideOutline.vue).

## Goal

The default theme should read as a calm technical interface at wide and narrow
viewports. It should use a compact 600-weight heading ladder, precise radii,
flat content surfaces, light elevation only where depth communicates state,
and short interaction feedback. The light and dark schemes must express the
same hierarchy. Documentation examples should change because the library
theme changes, except for documentation-only patterns such as callouts and the
page outline.

## Adopted from the reference

- System UI typography with a compact hierarchy and predominantly 600-weight
  headings.
- Thin borders, quiet surfaces, modest radii, and shadows reserved for
  genuinely elevated UI.
- Fast tonal hover feedback and a vertical pressed response no greater than
  1px.
- A 2px page-outline marker with a short ease-out movement.
- A soft primary tint for the current sidebar entry.
- Small fade and transform entrances for overlays, with no layout animation.

## Deliberately not adopted

- Elena's orange, VitePress canvas values, and VitePress surface values. Cirth
  keeps the palette and derivation graph present in this baseline. In this
  worktree that means the current 324-degree primary accent and the
  120-degree neutral canvas, not the copper from another branch and not
  Elena's `#f95b1f`.
- Elena's web font and branded monospace face. Both Cirth body and display
  roles remain on the existing `system-ui` stack; code keeps the local
  system monospace stack.
- CSS Anchor Positioning. Elena uses it for navigation and sidebar markers
  without a fallback, which does not meet Cirth's browser floor.
- Elena's exact heading sizes. Cirth keeps its distinct display role and uses
  the requested content ladder of approximately 28px, 24px, and 20px.
- Elena's inline-code chip. Cirth keeps inline code as text in a code face, as
  defined by `specs/control-emphasis.md`; block code receives the panel
  treatment.
- Elena's long search-backdrop transition and its exact overlay shadows.
- A JavaScript runtime in the package. The page-outline controller remains
  documentation-only.

## Cirth invariants

1. `--cirth-primary`, `--cirth-canvas`, `--cirth-surface`, and every existing
   derivation from them retain their values and graph.
2. Body and display fonts both resolve to `--cirth-font-family-sans`, whose
   first family is `system-ui`.
3. Ordinary buttons, fields, selects, and text areas retain a 44px minimum
   block size. Compact navigation controls retain the intentional 40px band.
4. Classless, scoped, and explicit-class builds consume the same source rules.
5. Published artifacts remain CSS-only. No script enters `src/` or the npm
   package.
6. Existing public selectors and tokens remain available. New decisions are
   expressed through the existing scales or through role tokens.
7. Focus remains an opaque 2px outline with a 2px gap; forced-colors mode may
   replace its paint with a system color.
8. `dist/` remains generated output and is not edited or committed.

## Token contract

| Token | Change |
| --- | --- |
| `--cirth-heading-font-weight` | Becomes `var(--cirth-font-weight-semibold)` (600) instead of 650 |
| `--cirth-border-radius` | Becomes `var(--cirth-radius-md)` (6px) instead of `--cirth-radius-sm` (4px) |
| `--cirth-card-border-radius` | Remains derived at `1.5 ×` the control radius, yielding 9px by default |
| `--cirth-checkbox-border-radius` | Remains capped at `--cirth-radius-sm` (4px) |
| `--cirth-code-border-radius` | Remains capped at `--cirth-radius-sm` (4px) for inline objects |
| `--cirth-control-press-offset` | New role token, derived from `--cirth-border-width`, yielding a 1px maximum response by default |
| `--cirth-transition` | Keeps the existing standard 200ms ease-out composition |
| duration and easing scales | Unchanged: components reuse the existing 100ms, 200ms, 300ms and ease-out primitives |

The content heading ladder becomes scale-based rather than viewport-based:
`h1` uses `--cirth-font-size-3xl` (28px), `h2` uses
`--cirth-font-size-2xl` (24px), and `h3` uses `--cirth-font-size-xl`
(20px). The separate display role remains fluid for pages that need a hero.
This supersedes only the fluid content-heading tuning in
`specs/typographic-roles.md`; its role mapping, tracking relation, inks, and
remaining type contract stay intact.

## Component contract

- Links keep primary-colored current and hover states, clear underlines in
  prose, and an immediate visible focus outline.
- Buttons add `transform` to their transition list. An enabled active button
  moves down by `--cirth-control-press-offset` only when motion is allowed;
  the existing tonal pressed wash remains in every preference.
- Inputs, selects, and text areas keep their 44px floor, inherited surface,
  1px edge, tonal hover, opaque focus ring, and neutral disabled state.
- Cards use the derived 9px radius, one raised surface, a 1px edge, and the
  existing contact shadow. They do not gain overlay elevation.
- Tables retain full-width rules and quiet row separators. Header hierarchy
  remains a meta role rather than a stronger panel.
- Block code uses the content-panel radius and recessed surface. Inline code
  remains unboxed; `kbd` remains a small object with its capped radius.
- Documentation callouts use the content-panel radius, thin status edge, and
  no decorative shadow.
- Navigation, segmented controls, and current states continue to use
  `aria-current` or native checked state as their semantic source.
- Details and accordion retain the divider model and native disclosure
  semantics.
- Dropdown, popover, and dialog entrances use only opacity and transform,
  complete within 300ms, and keep an immediate functional fallback.
- Disabled controls do not move and do not communicate state through opacity
  alone.

## Light and dark schemes

No foundational color input changes. Both schemes consume their existing
recessed, current, raised, and overlay surfaces. The same radius, type, border,
motion, and target-size rules apply in both schemes. Existing dark elevation
compensation remains in place so elevated panels separate from the canvas
without a light halo. Every new primary tint is mixed from the active Cirth
primary rather than from a fixed color.

## Motion and reduced motion

Immediate feedback uses the existing fast scale where a distinct duration is
needed; ordinary state transitions use 200ms; overlay entrances stay at or
below 300ms. Motion is limited to color, border color, background, opacity,
and transform. No component animates layout geometry.

Under `prefers-reduced-motion: reduce`, transition duration resolves to zero,
scrolling is not smooth, pressed controls retain their tonal state without a
translation, and overlay and outline states appear at their final position.
Information, current-state indication, and focus are unchanged.

## Documentation page outline

The desktop outline keeps a static 1px rail as its no-script fallback. Its
navigation receives an explicit decorative marker with `aria-hidden="true"`.
The marker is approximately 2px wide and 18px high, and exposes color, height,
and vertical position as documentation-scoped custom properties. Its position
is calculated from the current link's real geometry and applied with
`transform: translateY(...)`.

`aria-current` is the sole state source. A requestAnimationFrame scheduler
coalesces scroll work. Resize, hash navigation, page restoration, font loading,
and observed layout changes trigger a geometry refresh. The first section is
selected at the page start; the final section is selected at the true document
end. Thresholds come from computed scroll padding and measured boxes, not
undocumented pixel offsets. Reduced motion makes the marker transition
immediate. The mobile `details.docs-toc-top` remains a native disclosure and
shares the same destinations without receiving desktop-only motion.

## Accessibility

- Focus is visible in keyboard navigation and remains distinct in forced
  colors.
- Current state stays in `aria-current`; the marker is decorative and cannot
  replace it.
- Motion never carries unique information and is removed, not delayed, for
  reduced-motion users.
- The 44px ordinary target and 40px navigation exception remain measured in
  rendered tests.
- Text, state edges, and focus continue to meet the repository contrast
  contracts on every surface level.
- The outline marker does not affect document flow, scrolling, hit targets,
  or assistive-technology order.

## Browser compatibility

The implementation targets the repository floor: Chrome and Edge 123,
Firefox 130, Safari and iOS 18.2, Opera 109, and Samsung Internet 27. It uses
ordinary custom properties, transforms, requestAnimationFrame,
ResizeObserver, and existing discrete-transition feature queries. CSS Anchor
Positioning is not required. Browsers without the enhanced overlay transition
still receive the open and closed states immediately.

## Test strategy

1. Build all three selector modes and assert the heading, radius, target-size,
   token, and surface invariants from computed styles.
2. Exercise pressed, hover, focus, disabled, open, close, current, and
   reduced-motion states in Chromium, Firefox, and WebKit.
3. Exercise the page outline at the start, middle, and end of a long page,
   after hash navigation and resize, and with reduced motion and JavaScript
   disabled.
4. Run accessibility, behavior, token, size, distribution, documentation, and
   visual checks.
5. Compare intentional visual differences at 1440px and 390px in light and
   dark on the home, typography, form, button, card, table, code, callout,
   modal, and popover views before regenerating snapshots.
6. Confirm no horizontal overflow, scrolling jump, missing focus indication,
   target regression, or collapse of preset differentiation.

## Evidence ledger

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| The baseline uses system UI for body and display roles | Both tokens resolve to `--cirth-font-family-sans`; the foundation starts with `system-ui` | `src/theme/_styles.scss` and `src/theme/_foundations.scss` at `ed959bcf9` | Verified |
| Ordinary controls have a 44px floor and navigation uses 40px | Shared metric and nav override inspected; rendered behavior is already covered by `tests/form-sizing.spec.js` | Source and tests at `ed959bcf9` | Verified |
| The desktop content ladder reaches about 40px, 28px, and 22px | Computed captures and the three clamp declarations agree | Chromium 149.0.7827.55 at 1440×900; `src/theme/_styles.scss` at `ed959bcf9` | Verified |
| The default control and card radii are 4px and 6px | Root role tokens and rendered screenshots agree | Chromium 149.0.7827.55; source at `ed959bcf9` | Verified |
| The current docs outline is a static rail with a current-link border | Source inspection and baseline captures at several scroll positions | `docs/src/styles/style.css`, `docs/src/_includes/docs.njk`, and `/tmp/cirth-elena-baseline-before/` | Verified |
| Elena uses system UI, compact 600-weight headings, thin surfaces, and short pressed feedback | Source inspection and live computed styles | Elena commit `8c51392b`, Chromium 149.0.7827.55 at 1440×900 | Verified |
| Elena's outline marker is 2×18px with a 250ms `cubic-bezier(0, 1, .5, 1)` position transition | Component source inspection | `VPDocAsideOutline.vue` at Elena commit `8c51392b` | Verified |
| Elena's outline implementation meets Cirth's semantics and compatibility requirements unchanged | It uses `.active`, animates `top`, relies on literal offsets, and its navigation indicators depend on Anchor Positioning without a fallback | Same source and `custom.css` | Invalid |
| Elena's button source itself proves a conforming 44px target | Its min-height calculation multiplies a font-family custom property and is not a valid target-size reference | Elena `packages/components/src/button/button.css` at `8c51392b` | Invalid |
| The Cirth translation preserves its token graph and contrast checks on every supported engine | `check:tokens` accounted for 226 light and 227 dark tokens and passed 717 colour comparisons within ΔOklab 0.002; `check:a11y` found no new WCAG A/AA violations | Working tree based on `ed959bcf9`; Chromium 149.0.7827.55, Firefox 151.0, and WebKit 26.5 on 2026-10-12 | Verified |
| The refreshed interaction and selector contracts work across engines and modes | 1,958 behavior tests passed with 17 expected skips | `npm run check:behavior`, working tree based on `ed959bcf9`, on 2026-10-12 | Verified |
| The visual refresh is stable across theme, viewport, engine, open-state, and preset matrices | 1,294 visual comparisons passed with 122 expected skips after intentional baseline review | `npm run check:visual`, 12 project combinations, working tree based on `ed959bcf9`, on 2026-10-12 | Verified |

## Decisions

| Decision | Basis | Rationale |
| --- | --- | --- |
| Preserve the current branch palette | User invariant and current baseline | Importing Elena orange or restoring another branch's copper would overwrite user work and break the active token graph |
| Set content headings to 28/24/20 and 600 | User direction plus Elena hierarchy | A stable content ladder is calmer at desktop width; the separate display role retains expressive range |
| Move the radius knob from 4px to 6px | Existing relation model | Controls reach the requested range and the existing 1.5 relation yields a 9px card without adding an independent literal |
| Keep inline code unboxed | Existing `control-emphasis` contract | Code remains part of the sentence and does not become an indiscriminate pill |
| Keep one contact shadow on cards | Existing `surface-depth` contract | The shadow is already slight and communicates the raised surface; overlay shadows remain clearly stronger |
| Add button translation only during an allowed active state | Motion and rendering | It avoids a permanent transform containing block while retaining immediate tonal feedback in every preference |
| Use documentation JavaScript for the moving outline | Compatibility and package boundary | It preserves `aria-current`, avoids Anchor Positioning, and keeps the published library CSS-only |
| Keep the main library navigation indicator static | Package boundary and browser floor | A cross-item moving marker would require consumer JavaScript or unsupported anchor dependence; current state stays clear through color and edge |

## Acceptance

- [x] Default content headings compute to approximately 28px, 24px, and
      20px at 390px and 1440px, with weight 600.
- [x] Body and display roles still resolve to the system UI stack.
- [x] Default control and card radii compute to 6px and 9px; Plain, Material,
      and Metro remain visibly and numerically distinct.
- [x] Ordinary controls remain at least 44px tall and compact nav controls
      remain 40px where intended.
- [x] Primary, canvas, surface, and all existing derivations are unchanged in
      light and dark.
- [x] Enabled button press feedback moves no more than 1px with ordinary
      motion, and does not move with reduced motion.
- [x] Modal, popover, and dropdown motion uses transform and opacity without
      causing a document reflow; their reduced-motion state is immediate.
- [x] Desktop page-outline marker follows `aria-current` at start, middle,
      end, hash navigation, resize, and layout change; the page does not jump.
- [x] The no-script outline retains a static current-state rail and the marker
      is absent from the accessibility tree.
- [x] Forced colors preserve focus and current state; light and dark checks
      preserve contrast.
- [x] Classless, scoped, and explicit-class builds pass their existing API and
      selector tests.
- [x] `npm run lint`, `build`, `check:dist`, `check:size`, `check:tokens`,
      `docs:build`, `check:a11y`, `check:behavior`, and `check:visual` pass.
- [x] Visual differences were reviewed before updating any snapshot.
- [x] `dist/` and `.tool-versions` are unchanged in the working tree.

## Migration

| If you | Then |
| --- | --- |
| Relied on fluid `h1` to `h3` sizes | Set `--cirth-font-size` on the heading, or use the display tokens for a hero |
| Relied on 650-weight `h1` or `h2` | Set `--cirth-heading-font-weight: 650` in your theme |
| Relied on the 4px default control radius | Set `--cirth-border-radius: var(--cirth-radius-sm)`; derived container radii follow it |
| Need to remove pressed movement without changing the OS preference | Set `--cirth-control-press-offset: 0px` |

## Open questions

None for implementation. A future CSS platform floor may allow a CSS-only
moving navigation marker, but this change does not depend on it.
