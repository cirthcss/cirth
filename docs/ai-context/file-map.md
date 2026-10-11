# Documentation feature map

Use this to choose first files. Verify identifiers against current source.

## Global page frame

- Primary: `docs/src/_includes/base.njk`
- Related: `docs/src/_includes/site-header.njk`, `docs/src/_includes/site-footer.njk`, `docs/src/_includes/search-dialog.njk`, `docs/src/styles/style.css`
- Locate and preserve: `pageTitle`, `firstHeading`, `#main-content`, skip link and early theme or preset scripts.
- Verify: `tests/docs-stack.spec.js`, `tests/baseline-consistency.spec.js`

## Page rendering and Markdown

- Primary: `docs/eleventy.config.js`
- Related: `docs/src/pages/**/*.md`, `docs/src/_includes/docs.njk`
- Locate and preserve: Markdown-it setup, `firstHeading`, `headings`, `outline`, `docsKind`; heading ids feed permalinks and outlines.
- Verify: `npm run docs:build`, `tests/docs-build-output.spec.js`

## Header and footer

- Primary: `docs/src/_includes/site-header.njk`, `site-footer.njk`
- Related: `docs/src/_includes/base.njk`, `docs/src/_data/nav.js`, `docs/src/_data/versions.js`, `docs/src/styles/style.css`
- Locate and preserve: `.docs-header`, `.docs-drawer`, `data-docs-version-select`, `.docs-footer`; content comes from nav and brand data.
- Verify: `tests/docs-stack.spec.js`, `tests/baseline-consistency.spec.js`

## Sidebar and documentation navigation

- Primary: `docs/src/_includes/docs.njk`
- Related: `docs/src/_includes/docs-nav.njk`, `docs/src/_data/nav.js`, `docs/eleventy.config.js`, `docs/src/styles/style.css`
- Locate and preserve: `.docs-sidebar`, `.docs-mobile-nav`, `navTree`, `hasActiveItem`, `breadcrumb`, `cirth-nav-open`; desktop and mobile share one tree.
- Verify: `tests/docs-navigation.spec.js`, `tests/docs-stack.spec.js`

## Table of contents

- Primary: `docs/src/_includes/docs.njk`
- Related: `docs/src/_includes/docs-nav.njk`, `docs/eleventy.config.js`, `docs/src/styles/style.css`
- Locate and preserve: `pageOutline`, `.docs-toc-top`, `.docs-toc`, `data-toc-*`; rendered `h2` and `h3` elements are the source.
- Verify: `tests/docs-navigation.spec.js`, `tests/baseline-consistency.spec.js`

## Search

- Primary: `docs/public/search.js`
- Related: `docs/src/_includes/search-dialog.njk`, `docs/src/_includes/site-header.njk`, `scripts/build-pagefind.js`, `docs/src/styles/style.css`
- Locate and preserve: `data-docs-search-*`, `normalizePagefindQuery`, `loadPagefind`, `data-pagefind-body`; current search excludes version archives.
- Verify: `tests/shell-overlays.spec.js`, `npm run docs:build`

## Responsive shell and mobile navigation

- Primary: `docs/src/styles/style.css`
- Related: `docs/src/_includes/site-header.njk`, `docs/src/_includes/docs.njk`, `docs/src/_includes/docs-nav.njk`
- Locate and preserve: Breakpoints, Drawer, Layout, Page outline and Index tree comments; JS and CSS share `64rem`, search also uses `30rem` height.
- Verify: `tests/docs-stack.spec.js`, `tests/docs-navigation.spec.js`, `tests/accessibility-resilience.spec.js`, `tests/visual.spec.js`

## Theme switching

- Primary: `docs/src/_includes/base.njk`
- Related: `docs/src/_includes/site-header.njk`, `docs/src/styles/style.css`, `docs/src/_includes/home.njk`
- Locate and preserve: `data-theme`, `cirth-theme`, `.docs-theme-toggle`; apply before paint and mirror inside home shadow copies.
- Verify: `tests/docs-stack.spec.js`, `tests/docs-home.spec.js`

## Preset switching

- Primary: `docs/src/_includes/base.njk`
- Related: `docs/src/_includes/site-header.njk`, `scripts/build-docs.js`, `scripts/lib/presets.js`
- Locate and preserve: `cirth-preset`, `data-cirth-preset-select`, `#cirth-preset-stylesheet`; names come from `src/presets/`.
- Verify: `tests/docs-stack.spec.js`, `tests/docs-home.spec.js`

## Code blocks and package commands

- Primary: `docs/src/_includes/base.njk`
- Related: `docs/src/_includes/install.njk`, `docs/eleventy.config.js`, `docs/src/styles/style.css`
- Locate and preserve: `pre > button.copy`, `data-copy-status`, `data-docs-install`, `data-pm`; copy skips demos and package choice is CSS-driven.
- Verify: `tests/docs-stack.spec.js`

## Live demos and source previews

- Primary: `docs/src/content/demos/<name>.html`
- Related: `docs/eleventy.config.js`, `docs/src/styles/style.css`, the calling page
- Locate and preserve: `demo`, `buildDemo`, `adoptListing`, `.docs-demo*`; one source produces preview and listing, and docs CSS cannot restyle the preview.
- Verify: `scripts/check-demo-boundary.js`, `tests/docs-boundary.spec.js`, `tests/docs-stack.spec.js`

## Examples and isolated build comparison

- Primary: `docs/src/pages/examples.njk`
- Related: `docs/src/_data/examples.js`, `docs/src/_includes/lab-ui.njk`, `docs/src/pages/lab/*.njk`, `scripts/build-docs.js`
- Locate and preserve: `.docs-example-block`, `.docs-build-comparison`, `labStylesheet`, `labScoped`, `labClassless`; frames load authentic builds and remain inert.
- Verify: `tests/docs-boundary.spec.js`, `tests/visual.spec.js`

## Home page interactions

- Primary: `docs/src/_includes/home.njk`
- Related: `docs/src/styles/home.css`, `docs/src/_data/themeDemo.js`, `docs/src/_data/frameworks.js`, `scripts/lib/markup-benchmark.js`
- Locate and preserve: `data-docs-facts`, `data-docs-story`, `data-docs-theme`, `data-docs-compare`, shadow roots; no-script and reduced-motion states stay complete.
- Verify: `tests/docs-home.spec.js`, `tests/docs-stack.spec.js`, `tests/visual.spec.js`

## Framework guides

- Primary: `docs/src/_data/frameworks.js`
- Related: `docs/src/_data/nav.js`, `docs/src/_includes/install.njk`, `docs/src/_includes/docs.njk`, `docs/src/pages/installation/*.md`
- Locate and preserve: `groups`, `byId`, `featured`, `frameworkGuide`, `guideGrid`; registry owns metadata, evidence, pipelines and logo provenance.
- Verify: `tests/docs-integrations.spec.js`, `tests/docs-navigation.spec.js`

## Documentation styling

- Primary: `docs/src/styles/style.css`
- Related: shell templates, `scripts/build-docs.js`, `docs/src/styles/home.css`
- Locate and preserve: stable section comments, `.docs-*`, root `--docs-*`; generated Cirth imports first and selector specificity follows template structure.
- Verify: `scripts/check-demo-boundary.js`, `tests/docs-stack.spec.js`, `tests/baseline-consistency.spec.js`, `tests/accessibility-resilience.spec.js`

## Build and generated assets

- Primary: `scripts/build-docs.js`
- Related: `docs/eleventy.config.js`, `package.json`, `scripts/build-pagefind.js`, `scripts/lib/build-output.js`
- Locate and preserve: `variants`, `docs:assets`, `docs:build`, `cirth-docs.css`, `cirth-lab-*.css`; generated styles and `docs/dist/` stay ignored.
- Verify: `tests/docs-build-output.spec.js`, `npm run docs:build`

## Versioning, previews and redirects

- Primary: `docs/src/_data/versions.js`
- Related: `docs/versions/`, `scripts/archive-docs.js`, `scripts/lib/docs-site.js`, `.github/workflows/deploy-docs.yml`, `docs/src/_data/nav.js`, `docs/src/pages/moved.njk`
- Locate and preserve: `lines`, `isNext`, `DOCS_VARIANT`, `docsPathPrefix`, `nav.redirects`; archives are frozen, and redirect fragments may need maps.
- Verify: `tests/docs-navigation.spec.js`, `tests/doc-links.spec.js`
