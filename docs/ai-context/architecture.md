# Documentation architecture

Use this for cross-file relationships and constraints. Use `file-map.md` to
choose an entry point. Current source remains authoritative.

Shorthand basenames resolve under `docs/src/_includes/`, `_data/`, `pages/`
or `styles/` according to their role; `public/` is under `docs/`.

## Rendering pipeline

- `docs/eleventy.config.js` reads pages from `docs/src/pages/`, includes
  from `docs/src/_includes/` and data from `docs/src/_data/`; output goes
  to ignored `docs/dist/`.
- Markdown runs Nunjucks before Markdown-it. HTML and Nunjucks pages also run
  Nunjucks. Front matter selects `docs.njk`, `home.njk`, `base.njk`, or
  `layout: false` for isolated targets.
- Markdown-it enables authored HTML, build-time highlighting, GitHub-style
  `h2` to `h4` anchors and keyboard-scrollable table wrappers.
- `base.njk` derives a missing title from the first rendered `h1`, loads
  assets, and composes the header, page content, footer and search dialog.
  `docs.njk` adds navigation, breadcrumbs, pagination and page outlines.
- The `demo` shortcode emits a marker that survives Markdown. The
  `cirth-demos` transform replaces it with live markup and highlighted
  source after rendering.
- `EleventyHtmlBasePlugin` applies the active `pathPrefix` to root-relative
  URLs. A safe pre-build hook cleans only the reported output; a post-build
  hook creates Pagefind in that same output.

## Data and page ownership

- `nav.js` owns top navigation, sidebar, redirects, footer, reading order
  and pager. Filesystem order never defines navigation.
- `frameworks.js` is the integration-guide registry. It feeds navigation,
  guide pages, the framework index, compatibility, the home orbit and logo
  attribution. The `frameworkGuide` filter adds each guide's only `h1`,
  project card, numbered steps and evidence note.
- `examples.js` maps showcase entries to demo files. `themeDemo.js` owns
  the home theme sequence. `versions.js` owns documentation lines and
  unreleased-preview state.
- Eleventy global data reads canonical project sources for build and token
  measurements, browser targets, presets, documented version, brand assets
  and benchmark results. Some measurements are null without root `dist/`.
- `pages/moved.njk` paginates `nav.redirects`. Forwarders preserve mapped
  or unchanged fragments and stay outside search, collections and audits.

## Layout and responsive shell

- `base.njk` owns the document frame. `site-header.njk` and
  `site-footer.njk` own site chrome. `docs.njk` owns the sidebar, reading
  column and table-of-contents rail.
- `docs-nav.njk` renders one `nav.sidebar` tree into desktop and mobile
  containers, plus both outline forms. The pager follows `nav.readingOrder`,
  not the nested sidebar or filesystem.
- At `64rem`, rails and desktop header controls appear. Below it, header
  JavaScript moves the one control set into a modal drawer. Its media query
  must remain identical to the CSS query.
- At `80rem`, the outline moves from a top disclosure to its own rail.
  Other stable boundaries are `48rem`, `36rem` and `22.5rem`; search
  also fills the viewport at heights at or below `30rem`.
- Desktop rails are sticky, scroll internally, stop before the footer and
  reveal active items without changing document scroll. Mobile surfaces use
  safe-area insets.

## Styling boundary

- `style.css` first imports generated `cirth-docs.css`, the real default
  Cirth build plus print. Later rules own only docs chrome and layout.
- The shell consumes public `--cirth-*` tokens. Root `--docs-*` tokens are
  limited to shell and reading widths, rail dimensions, chrome radius, index
  title size and the saved Cirth line height.
- Navigate the file by its stable section comments: Header, Search dialog,
  Header controls, Drawer, Layout, Page outline, Pagination, Footer, Prose
  and code, Brand and color pages, Content column, Live examples, Index tree,
  Plates, Navigation lists and guides, Breadcrumb, Framework guide page,
  Examples page and Print.
- Template structure and CSS specificity are coupled. Preserve source comments
  explaining specificity, focus, reduced motion, forced colors, safe areas
  and divided-grid strokes.
- Docs CSS must not restyle Cirth components inside `.docs-demo-preview`.
  Direct-child prose selectors, restored line height and demo-boundary checks
  enforce the separation.
- `home.css` loads after shared styles. Its base state is complete without
  JavaScript; `home.njk` adds held scenes and motion only where allowed.

## Interaction ownership

| Behavior | Owner | Coupled contract |
| --- | --- | --- |
| Theme | `base.njk`, `site-header.njk` | `html[data-theme]`, `cirth-theme`, `.docs-theme-toggle` |
| Preset | `base.njk` | `data-cirth-preset-select`, generated preset link |
| Mobile site menu | `site-header.njk` | `.docs-drawer`, header controls, `64rem` query |
| Sidebar state | `docs.njk` | `docs-nav.njk`, `nav.sidebar`, `cirth-nav-open` |
| Outline spy | `docs.njk` | `headings` and `outline` filters, `data-toc-*` |
| Search | `search-dialog.njk`, `public/search.js` | header trigger, Pagefind, `data-pagefind-body` |
| Copy and package choice | `base.njk` | code blocks, `install.njk`, local storage |
| Home scenes | `home.njk` | `home.css`, theme, benchmark and framework data |
| Specimen controls | owning specimen include | `framework-specimen.njk`, `surface-matrix.njk` |

Search and menu use native modal dialogs; navigation and outlines use native
`details`. Most demos rely on native HTML and no script. Cirth itself ships
no JavaScript; these scripts belong to docs chrome or maintained specimens.

## Demo and isolated rendering

- Demo source lives once in `docs/src/content/demos/<name>.html`. The
  shortcode injects the same bytes into the preview and source. An immediately
  following HTML listing replaces the disclosure, avoiding duplicate source.
- `.docs-demo` provides the recessed stage; `.docs-demo-preview` restores
  Cirth rhythm. `frame="narrow"` changes stage padding, never the example.
- `examples.njk` renders `examples.js` through the same shortcode. Its
  build comparison uses layout-free `/lab/` pages. `lab-ui.njk` loads one
  authentic build, wraps scoped variants in `.cirth`, omits `.container`
  for classless variants and keeps the iframe body inert.
- Home preset and theme comparisons use declarative shadow roots and scoped
  Cirth. Host docs styles, theme and preset must not leak into those copies;
  scheme state belongs on the inner `.cirth`.

## Assets, search, versions and deployment

- `npm run docs:assets` runs `scripts/build-docs.js`, producing
  `cirth-docs.css`, four lab builds and presets under ignored
  `docs/src/styles/generated/`.
- `npm run docs:build` builds assets, runs Eleventy and checks links.
  `docs/public/`, authored styles, generated styles and frozen versions are
  passthrough inputs. Root `npm run build` supplies `dist/` measurements.
- Pagefind indexes current-site HTML individually and excludes copied
  archives. `public/search.js` loads it lazily.
- Built-site tools use `scripts/lib/docs-site.js` to enumerate pages, serve
  output and snapshot `docs/dist/` before long checks. Archives, redirects,
  lab pages and capture routes are excluded from normal enumeration.
- `docs/versions/` contains tracked, frozen sites created only at a breaking
  documentation line. `scripts/archive-docs.js` builds the ending tag in a
  detached worktree. Normal maintenance never rebuilds an archive.
- Deployment always builds `master` at the site root and separately builds
  `develop` under `/next/` with `DOCS_VARIANT=next`. `docsPathPrefix()`
  is shared by Eleventy and link checking.

## Verification boundaries

- Root `AGENTS.md` is mandatory. Check selection is documented canonically
  under Quality gates in `docs/src/pages/contributions.md`.
- `docs:build` covers generation, Pagefind and built links. Source links,
  demo isolation and other static checks also run through `npm run lint`.
- Relevant suites are mapped by feature in `file-map.md`.
  `check:behavior`, `check:a11y`, `check:visual` and the dead-CSS audit
  are broad or long-running; select them only after identifying the subsystem
  and follow the shared-working-tree rules before starting.
