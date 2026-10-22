---
layout: docs.njk
description: Set up the Cirth repository, choose the required checks and submit focused code or documentation contributions.
---

# Contributions

Cirth is developed in public at
[github.com/cirthcss/cirth](https://github.com/cirthcss/cirth). Bug reports,
accessibility findings, documentation corrections and focused pull requests
are welcome.

The repository's
[`.github/CONTRIBUTING.md`](https://github.com/cirthcss/cirth/blob/master/.github/CONTRIBUTING.md)
is the canonical workflow. This page explains the common path and the reason
for each quality gate.

## Set up the repository

Use Node.js 24.18 or the version recorded by `.nvmrc`. npm is the supported
package manager for repository development.

```sh
git lfs install
git clone https://github.com/cirthcss/cirth.git
cd cirth
npm install
npm run setup:hooks
```

Git LFS is still required: the repository's Git hooks call it, and commits
made before October 2026 stored the visual-regression baselines in it. Current
baselines are not in Git; `npm run check:visual` downloads the ones the
checked-out commit pins.

Start the documentation locally:

```sh
npm run dev
```

It serves the documentation at `http://localhost:8080` and rebuilds as files
change: a page or template rebuilds the site, and a change to `src/`
recompiles the stylesheets the site is styled with, reloads them in the open
page, and rebuilds `dist/` for the test suites. Eleventy's own options pass
through, as in `npm run dev -- --port=8081`. `npm run docs:dev` is the same
command.

## Repository map

| Path | Responsibility |
| --- | --- |
| `src/` | SCSS sources for generated Cirth builds |
| `src/theme/` | theme foundations and public custom-property defaults |
| `src/presets/` | maintained token override presets |
| `docs/src/` | Eleventy documentation sources, examples and shared data |
| `docs/versions/` | frozen documentation lines; do not rewrite them |
| `scripts/` | build, package and invariant checks |
| `specs/` | contracts for observable changes to published artifacts |
| `tests/` | behavior, accessibility and visual coverage |
| `dist/` | generated package output; never edit or commit it |

The npm package publishes compiled CSS and token JSON, not `src/`. The
consumer-facing inventory is maintained on
[Package and builds](/package).

## Decide whether the change needs a spec

Write a spec in `specs/` before implementation when a consumer can observe
a changed public contract. Examples include:

- a public token or class renamed, removed or redefined;
- a selector, cascade or specificity contract that changes;
- a changed default or browser floor;
- a breaking change.

Documentation, tests, tooling, dependency maintenance and visual polish do
not need a spec when they do not change the published artifact.

Use `specs/TEMPLATE.md`. Its evidence ledger distinguishes:

- **Verified:** reproduced now with a named artifact and command or browser;
- **Reported:** believed or received from another source, but not reproduced;
- **Invalid:** tested evidence that did not support the claim.

Keep invalid findings in the ledger. They prevent another contributor from
mistaking a failed check for missing work.

## Make a focused change

### Styles

Edit `src/**/*.scss`, not `dist/`. Keep selectors in their documented
ownership group so classless, scoped and `.no-cirth` variants remain
mechanically verifiable.

Public custom properties use the `--cirth-` prefix. Rules belong to the
single `cirth` cascade layer. Avoid `!important`; the generated builds are
checked to contain none.

When a component depends on browser behavior, update its rendered specimen
and behavior test with the implementation.

### Documentation

Edit current pages under `docs/src/pages/`. Put live-example markup in
`docs/src/content/demos/` so the preview and copyable source stay aligned.

Each topic has one authoritative page. Other pages should provide only the
context needed there and link to the owner. Keep migration-only information
in [Upgrading](/upgrading) and release history in the changelog.

Do not edit `docs/dist/`; it is generated. Do not update
`docs/versions/` as part of normal documentation maintenance, because those
directories are frozen archives.

### Package surface

Update `package.json` and package checks together when adding an entry
point. Confirm that the export resolves from a packed consumer project. Then
update the authoritative [package inventory](/package) rather than copying
the table across other pages.

## Run the checks

For a stylesheet change, run the required baseline:

```sh
npm run lint
npm run build
npm run check:dist
```

Choose additional checks in proportion to the change:

| Command | What it verifies |
| --- | --- |
| `npm run docs:build` | Eleventy output, search index and internal links |
| `npm run check:package` | packed file inventory and public exports |
| `npm run check:consumer` | real consumer resolution and sealed internals |
| `npm run check:tokens` | generated light and dark token JSON |
| `npm run check:size` | compressed bundle budgets |
| `npm run check:behavior` | interaction and rendering invariants in Chromium, Firefox and WebKit |
| `npm run check:a11y` | axe audits across built documentation pages and states |
| `npm run check:visual` | screenshot regressions |
| `npm run check:sri` | versioned CDN snippets and integrity attributes |
| `npm run check:brand-assets` | generated brand SVG and manifest consistency |
| `npm run check:tooling` | repository audit and guard invariants |

Browser checks require the Playwright engines once:

```sh
npx playwright install chromium firefox webkit
```

### What the broad checks mean

`check:behavior` exercises native states, reflow, forced colours and
interaction parity. Current Playwright engines provide regression coverage;
they do not claim that every exact browser-floor release was launched.

`check:a11y` tests the built documentation and maintained specimens. A
clean result is a verified baseline for those pages, not automatic proof that
every consumer interface is accessible.

`check:visual` compares rendered pages with reviewed baselines, one set per
platform, since font rendering differs between macOS and Linux. Each set is
an asset of the
[`visual-baselines`](https://github.com/cirthcss/cirth/releases/tag/visual-baselines)
pre-release, and `tests/visual-baselines.json` pins the sets each commit
compares against; `check:visual` downloads the ones for your platform first.
Regenerate baselines only when the visual change is intentional, with
`npm run check:visual:update`, and inspect every changed image. A maintainer
then publishes them with `npm run baselines:push` and commits the updated
`tests/visual-baselines.json` with the change. CI regenerates and publishes
the Linux set by itself. `npm run baselines:status` shows which local sets
are current, stale or changed.

## Documentation lines

The version switcher points to documentation lines that describe distinct
public APIs. A line may cover several releases. Frozen output lives under
`docs/versions/` and remains unchanged after it is archived.

When a breaking release requires a new line, use the repository's
`docs:archive` workflow documented in the contributor guide. Do not copy or
rebuild an archive manually.

## CDN snippets

The maintained jsDelivr snippets pin a release and include a SHA-384
Subresource Integrity digest. When release preparation changes the documented
version, the release workflow runs:

```sh
npm run sri
```

Normal documentation edits should not invent a digest. The detailed consumer
explanation lives on [Delivery and deployment](/delivery).

## Commit and pull request

Before opening a pull request:

1. review the diff for generated or unrelated files;
2. run `git diff --check`;
3. run the baseline checks and relevant focused checks;
4. describe the consumer-visible result, not the editing process;
5. list commands run and any check that could not be completed;
6. link the spec when the change requires one.

Keep pull requests focused enough to review as one change. Report an
unverified compatibility claim as unverified instead of strengthening the
wording.

## Good documentation contributions

A useful page:

- starts with a complete example;
- separates browser behavior from Cirth styling;
- explains uncommon elements and attributes on first use;
- uses only selectors, tokens and imports present in the built artifact;
- avoids release history outside Upgrading and the changelog;
- preserves or redirects existing routes and anchors;
- builds without broken links.

## License

Contributions are accepted under the project's
[Apache License 2.0](https://github.com/cirthcss/cirth/blob/master/LICENSE.md).
Inherited notices are recorded in
[`NOTICE.md`](https://github.com/cirthcss/cirth/blob/master/NOTICE.md).
