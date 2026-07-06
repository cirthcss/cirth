# Accessibility

A small set of interaction and accessibility fixes, applied by attribute
rather than by class.

## Behavior

- `[aria-controls]` gets `cursor: pointer` — a hint that the element toggles
  something else.
- `[aria-disabled="true"]` and `[disabled]` get `cursor: not-allowed`.
- `[aria-hidden="false"][hidden]` is shown (`display: initial`) rather than
  hidden, and visually clipped unless focused — for content that should stay
  in the accessibility tree but not take up layout space until focused (a
  common "skip to content" link pattern).
- Interactive elements (`a`, `area`, `button`, `input`, `label`, `select`,
  `summary`, `textarea`, `[tabindex]`) get
  `-ms-touch-action: manipulation`, removing the old IE10 tap delay.
- `[dir="rtl"]` sets `direction: rtl` — most components in Cirth already
  mirror their icons/spacing under this attribute (nav breadcrumbs,
  dropdown menus, form icons, tooltips); see each component's page for its
  specific RTL behavior.
