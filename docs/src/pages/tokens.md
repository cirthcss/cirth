---
layout: docs.njk
description: Complete reference for Cirth's public CSS custom properties and generated light and dark token JSON.
---

# Token reference

This page is the authoritative inventory of the public `--cirth-*` custom
properties in Cirth's builds. Start with
[Customization](/customization) if you need to learn which level to
override and where to place the rule.

A CSS custom property stores a reusable value. Reading a token in this list
does not mean every token is intended as a high-level theme control. The
**kind** column distinguishes theme inputs, derived values, component slots,
roles and scale steps.

## Tokens outside CSS

The package also ships the default theme's tokens as
[W3C Design Tokens](https://www.designtokens.org/tr/2025.10/format/) (DTCG 2025.10)
JSON, for design tools and other platforms that cannot read a stylesheet:

```js
import light from "@cirthcss/cirth/tokens/light" with { type: "json" };
import dark from "@cirthcss/cirth/tokens/dark" with { type: "json" };
```

Each file is one colour scheme and complete on its own, so a tool that
treats files as modes can load one per mode. Token names drop the
`--cirth-` prefix: `--cirth-primary-surface` is `primary-surface`.

The files are generated from the compiled stylesheet on every build, and
they follow the kinds described above:

* A token that is another token (`var(--cirth-primary)`) is exported as an
  alias, `{primary}`, so the relationship survives.
* A derived colour, a `color-mix()` or a relative colour, is exported as
  the value it resolves to in that scheme. DTCG cannot express the
  relationship, so the CSS it came from is kept under
  `$extensions["com.github.cirthcss"].css`. A tool that reads the value
  gets the right colour today, but it does not follow a new accent the
  way the stylesheet does.
* A value no DTCG type can hold (a `calc()`, an `em` length, an icon
  `url()`) is not exported as a token. It is listed, with its CSS and the
  reason, under `$extensions["com.github.cirthcss"].unrepresented` in the
  same file.

The export describes the default theme only: not the presets, and not the
`prefers-contrast: more` adjustments.

## Complete property inventory

Every `--cirth-*` token Cirth declares, grouped by what it affects. The
**kind** column is the distinction from
[How the token system works](/customization#how-the-token-system-works):

* **input**: set this; other tokens follow
* **derived**: computed from an input; set it only to break that
* **slot**: a variable components paint through, not a theme setting
* **role**: a named setting a component reads directly
* **scale**: a step on a ladder

#### Accent and status

| Token | Kind |
| --- | --- |
| `--cirth-contrast-active` | role |
| `--cirth-contrast-border` | derived |
| `--cirth-contrast-border-active` | derived |
| `--cirth-contrast-focus` | derived |
| `--cirth-contrast-on-surface` | role |
| `--cirth-contrast-surface` | role |
| `--cirth-contrast-surface-active` | role |
| `--cirth-contrast-text` | role |
| `--cirth-contrast-underline` | role |
| `--cirth-contrast-underline-active` | derived |
| `--cirth-danger-on-surface` | role |
| `--cirth-error` | input |
| `--cirth-error-active` | derived |
| `--cirth-error-border` | derived |
| `--cirth-error-surface` | derived |
| `--cirth-error-text` | derived |
| `--cirth-primary` | input |
| `--cirth-primary-active` | derived |
| `--cirth-primary-border` | derived |
| `--cirth-primary-border-active` | derived |
| `--cirth-primary-focus` | derived |
| `--cirth-primary-on-surface` | role |
| `--cirth-primary-surface` | derived |
| `--cirth-primary-surface-active` | derived |
| `--cirth-primary-text` | derived |
| `--cirth-primary-underline` | derived |
| `--cirth-primary-underline-active` | derived |
| `--cirth-secondary-active` | role |
| `--cirth-secondary-border` | derived |
| `--cirth-secondary-border-active` | derived |
| `--cirth-secondary-focus` | derived |
| `--cirth-secondary-on-surface` | derived |
| `--cirth-secondary-surface` | derived |
| `--cirth-secondary-surface-active` | derived |
| `--cirth-secondary-text` | role |
| `--cirth-secondary-underline` | role |
| `--cirth-secondary-underline-active` | derived |
| `--cirth-success` | input |
| `--cirth-success-active` | derived |
| `--cirth-success-border` | derived |
| `--cirth-success-surface` | derived |
| `--cirth-success-text` | derived |
| `--cirth-warning` | input |
| `--cirth-warning-active` | derived |
| `--cirth-warning-border` | derived |
| `--cirth-warning-surface` | derived |
| `--cirth-warning-text` | derived |

#### Surfaces and text

| Token | Kind |
| --- | --- |
| `--cirth-background-color` | slot |
| `--cirth-blockquote-border-color` | derived |
| `--cirth-blockquote-footer-color` | derived |
| `--cirth-canvas` | input |
| `--cirth-card-background-color` | derived |
| `--cirth-card-border-color` | derived |
| `--cirth-card-border-radius` | role |
| `--cirth-card-box-shadow` | role |
| `--cirth-card-sectioning-background-color` | derived |
| `--cirth-code-background-color` | derived |
| `--cirth-code-border-radius` | role |
| `--cirth-code-color` | derived |
| `--cirth-code-kbd-background-color` | derived |
| `--cirth-code-kbd-color` | derived |
| `--cirth-color` | slot |
| `--cirth-del-color` | derived |
| `--cirth-ink` | input |
| `--cirth-ink-strong` | input |
| `--cirth-ins-color` | derived |
| `--cirth-link-visited-color` | role |
| `--cirth-mark-background-color` | derived |
| `--cirth-mark-color` | role |
| `--cirth-muted-border-color` | derived |
| `--cirth-muted-color` | role |
| `--cirth-surface` | slot |
| `--cirth-surface-overlay` | derived |
| `--cirth-surface-raised` | derived |
| `--cirth-surface-recessed` | derived |
| `--cirth-text-selection-color` | role |

#### Typography

| Token | Kind |
| --- | --- |
| `--cirth-display-font-size` | role |
| `--cirth-display-font-weight` | role |
| `--cirth-font-family` | role |
| `--cirth-font-family-display` | role |
| `--cirth-font-family-emoji` | scale |
| `--cirth-font-family-mono` | scale |
| `--cirth-font-family-sans` | scale |
| `--cirth-font-family-serif` | scale |
| `--cirth-font-size` | slot |
| `--cirth-font-size-2xl` | scale |
| `--cirth-font-size-3xl` | scale |
| `--cirth-font-size-4xl` | scale |
| `--cirth-font-size-5xl` | scale |
| `--cirth-font-size-6xl` | scale |
| `--cirth-font-size-7xl` | scale |
| `--cirth-font-size-lg` | scale |
| `--cirth-font-size-md` | scale |
| `--cirth-font-size-sm` | scale |
| `--cirth-font-size-xl` | scale |
| `--cirth-font-size-xs` | scale |
| `--cirth-font-weight` | slot |
| `--cirth-font-weight-bold` | scale |
| `--cirth-font-weight-light` | scale |
| `--cirth-font-weight-medium` | scale |
| `--cirth-font-weight-regular` | scale |
| `--cirth-font-weight-semibold` | scale |
| `--cirth-heading-font-weight` | role |
| `--cirth-label-font-size` | role |
| `--cirth-letter-spacing` | slot |
| `--cirth-line-height` | slot |
| `--cirth-line-height-loose` | scale |
| `--cirth-line-height-none` | scale |
| `--cirth-line-height-normal` | scale |
| `--cirth-line-height-relaxed` | scale |
| `--cirth-line-height-snug` | scale |
| `--cirth-line-height-tight` | scale |
| `--cirth-meta-font-size` | role |
| `--cirth-text-underline-offset` | role |
| `--cirth-title-font-weight` | role |
| `--cirth-tracking-optical` | scale |
| `--cirth-typography-spacing-vertical` | role |

#### Spacing and layout

| Token | Kind |
| --- | --- |
| `--cirth-block-spacing-horizontal` | role |
| `--cirth-block-spacing-vertical` | role |
| `--cirth-container-gutter` | role |
| `--cirth-container-max-width` | role |
| `--cirth-flow-chapter` | scale |
| `--cirth-flow-element` | scale |
| `--cirth-flow-group` | scale |
| `--cirth-flow-line` | scale |
| `--cirth-flow-section` | scale |
| `--cirth-grid-column-gap` | role |
| `--cirth-grid-max-columns` | role |
| `--cirth-grid-min-column` | role |
| `--cirth-grid-row-gap` | role |
| `--cirth-nav-breadcrumb-divider` | role |
| `--cirth-nav-element-spacing-horizontal` | role |
| `--cirth-nav-element-spacing-vertical` | role |
| `--cirth-nav-link-spacing-horizontal` | role |
| `--cirth-nav-link-spacing-vertical` | role |
| `--cirth-row-min-column` | role |
| `--cirth-space-0` | scale |
| `--cirth-space-1` | scale |
| `--cirth-space-10` | scale |
| `--cirth-space-12` | scale |
| `--cirth-space-16` | scale |
| `--cirth-space-2` | scale |
| `--cirth-space-20` | scale |
| `--cirth-space-24` | scale |
| `--cirth-space-3` | scale |
| `--cirth-space-4` | scale |
| `--cirth-space-5` | scale |
| `--cirth-space-6` | scale |
| `--cirth-space-8` | scale |
| `--cirth-spacing` | role |

#### Borders, radii and outlines

| Token | Kind |
| --- | --- |
| `--cirth-border-color` | slot |
| `--cirth-border-radius` | role |
| `--cirth-border-width` | role |
| `--cirth-border-width-0` | scale |
| `--cirth-border-width-1` | scale |
| `--cirth-border-width-2` | scale |
| `--cirth-border-width-4` | scale |
| `--cirth-outline-offset` | role |
| `--cirth-outline-width` | role |
| `--cirth-radius-2xl` | scale |
| `--cirth-radius-lg` | scale |
| `--cirth-radius-md` | scale |
| `--cirth-radius-none` | scale |
| `--cirth-radius-pill` | scale |
| `--cirth-radius-sm` | scale |
| `--cirth-radius-xl` | scale |
| `--cirth-radius-xs` | scale |

#### Motion, depth and layering

| Token | Kind |
| --- | --- |
| `--cirth-box-shadow` | slot |
| `--cirth-control-press-offset` | role |
| `--cirth-duration-fast` | scale |
| `--cirth-duration-instant` | scale |
| `--cirth-duration-normal` | scale |
| `--cirth-duration-slow` | scale |
| `--cirth-duration-slower` | scale |
| `--cirth-ease-in` | scale |
| `--cirth-ease-in-out` | scale |
| `--cirth-ease-linear` | scale |
| `--cirth-ease-out` | scale |
| `--cirth-opacity-overlay` | scale |
| `--cirth-transition` | role |
| `--cirth-z-index-dropdown` | scale |
| `--cirth-z-index-fixed` | scale |
| `--cirth-z-index-modal` | scale |
| `--cirth-z-index-modal-backdrop` | scale |
| `--cirth-z-index-sticky` | scale |

#### Form controls

| Token | Kind |
| --- | --- |
| `--cirth-checkbox-border-radius` | role |
| `--cirth-disabled-color` | derived |
| `--cirth-disabled-surface` | derived |
| `--cirth-form-element-background-color` | derived |
| `--cirth-form-element-border-color` | derived |
| `--cirth-form-element-color` | role |
| `--cirth-form-element-focus-color` | derived |
| `--cirth-form-element-invalid-border-color` | derived |
| `--cirth-form-element-invalid-focus-color` | derived |
| `--cirth-form-element-placeholder-color` | derived |
| `--cirth-form-element-selected-background-color` | role |
| `--cirth-form-element-spacing-horizontal` | role |
| `--cirth-form-element-spacing-vertical` | role |
| `--cirth-form-element-valid-border-color` | derived |
| `--cirth-form-element-valid-focus-color` | derived |
| `--cirth-form-label-font-weight` | role |
| `--cirth-icon-checkbox` | role |
| `--cirth-icon-chevron` | role |
| `--cirth-icon-close` | role |
| `--cirth-icon-date` | role |
| `--cirth-icon-height` | role |
| `--cirth-icon-invalid` | role |
| `--cirth-icon-loading` | role |
| `--cirth-icon-minus` | role |
| `--cirth-icon-position` | role |
| `--cirth-icon-search` | role |
| `--cirth-icon-time` | role |
| `--cirth-icon-valid` | role |
| `--cirth-icon-width` | role |
| `--cirth-meter-background-color` | role |
| `--cirth-meter-border-color` | role |
| `--cirth-meter-even-less-good-color` | derived |
| `--cirth-meter-optimum-color` | derived |
| `--cirth-meter-suboptimum-color` | derived |
| `--cirth-progress-background-color` | derived |
| `--cirth-progress-border-color` | derived |
| `--cirth-progress-color` | derived |
| `--cirth-range-active-border-color` | derived |
| `--cirth-range-border-color` | derived |
| `--cirth-range-thumb-active-color` | derived |
| `--cirth-range-thumb-border-color` | derived |
| `--cirth-range-thumb-color` | derived |
| `--cirth-switch-background-color` | derived |
| `--cirth-switch-checked-background-color` | derived |
| `--cirth-switch-color` | derived |
| `--cirth-switch-thumb-box-shadow` | role |

#### Components

| Token | Kind |
| --- | --- |
| `--cirth-accordion-active-summary-color` | derived |
| `--cirth-accordion-close-summary-color` | derived |
| `--cirth-accordion-open-summary-color` | derived |
| `--cirth-dropdown-background-color` | derived |
| `--cirth-dropdown-border-color` | derived |
| `--cirth-dropdown-box-shadow` | derived |
| `--cirth-dropdown-color` | derived |
| `--cirth-dropdown-hover-background-color` | derived |
| `--cirth-group-box-shadow` | role |
| `--cirth-modal-background-color` | derived |
| `--cirth-modal-box-shadow` | role |
| `--cirth-modal-max-width` | role |
| `--cirth-modal-overlay-backdrop-filter` | role |
| `--cirth-modal-overlay-background-color` | derived |
| `--cirth-popover-background-color` | derived |
| `--cirth-popover-border-color` | role |
| `--cirth-popover-box-shadow` | role |
| `--cirth-popover-color` | role |
| `--cirth-popover-display` | role |
| `--cirth-popover-max-width` | role |
| `--cirth-print-border-color` | role |
| `--cirth-print-color` | role |
| `--cirth-print-muted-color` | role |
| `--cirth-table-border-color` | derived |
| `--cirth-table-row-stripped-background-color` | role |
| `--cirth-text-decoration` | slot |
| `--cirth-underline` | slot |

#### Everything else

| Token | Kind |
| --- | --- |
| `--cirth-button-box-shadow` | derived |
| `--cirth-button-hover-box-shadow` | derived |
| `--cirth-h1-color` | derived |
| `--cirth-h2-color` | derived |
| `--cirth-h3-color` | derived |
| `--cirth-h4-color` | derived |
| `--cirth-h5-color` | derived |
| `--cirth-h6-color` | derived |
