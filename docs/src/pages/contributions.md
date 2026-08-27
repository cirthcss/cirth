---
layout: docs.njk
---

# Contributions

Cirth is developed in the open at
[github.com/cirthcss/cirth](https://github.com/cirthcss/cirth).
Bug reports, accessibility findings, and focused pull requests are all
welcome. The full workflow lives in
[`.github/CONTRIBUTING.md`](https://github.com/cirthcss/cirth/blob/master/.github/CONTRIBUTING.md);
this page is the practical summary.

## Getting set up

npm is the only supported package manager: one install path, one lockfile.
Node.js 24.18 (current LTS) is the version CI and the release workflows run
on; `.nvmrc` pins it for local use with `nvm use`.

```sh
git lfs install    # once per machine — visual test baselines are Git LFS objects
git clone https://github.com/cirthcss/cirth.git
cd cirth
npm install
```

If you cloned before installing [Git LFS](https://git-lfs.com), the
screenshot baselines under `tests/__screenshots__/` are small pointer
files instead of images; `git lfs pull` fetches the real ones.

The commands you'll actually use:

```sh
npm run build      # compile src/ to dist/ (format, lint, compile, minify)
npm run dev        # rebuild on change
npm run lint       # stylelint + CSS custom property check
npm run lint:fix
npm run docs:dev   # run this docs site locally
```

## Where things live

* `src/` contains SCSS source. It is repository infrastructure, **not** a public Sass
  API: the npm package ships compiled CSS from `dist/` only, and
  customization stays CSS first through `--cirth-` custom properties.
* `src/theme/` contains design tokens: color scales, foundations, and the
  light/dark schemes. Most visual changes start here, not in components.
* `src/presets/` contains `plain` and `playroom`, token override presets published
  alongside the default build.
* `docs/` contains this site (Eleventy), styled by Cirth's own build — and
  also doubles as the fixture the library's own QA runs against: `tests/`
  (visual regression) and `check:a11y` render the built docs site to catch
  unintended rendering/accessibility changes from a source edit. Kept in
  this repository rather than a dedicated one **on purpose, for now**: the
  library is still under heavy, fast-moving revision, co-locating docs
  with source keeps a change and its matching docs update in the same
  commit checked by the same CI, and the QA coupling above means anyone
  doing serious library work needs the docs build regardless of where it
  lives. Whether to eventually split docs into their own repository — and
  do a full manual review pass over everything written so far — is
  something to evaluate later, not a settled plan; noted here so the
  current layout isn't mistaken for either the permanent shape of the
  project or a fixed roadmap item.
* `scripts/` contains local Node build and check scripts. Prefer extending
  these over adding tooling dependencies; a new package needs to provide a
  real build capability that would be risky to maintain locally.
* `tests/` contains the visual regression suite and its screenshot
  baselines (stored in Git LFS).

## Package exports

`package.json` declares an `exports` map with one entry per generated
build, so bundlers and Node's resolver can pick a build without knowing
the `dist/` filename convention:

```json
{
  ".": "./dist/cirth.min.css",
  "./classless": "./dist/cirth.classless.min.css",
  "./scoped": "./dist/cirth.scoped.min.css",
  "./classless/scoped": "./dist/cirth.classless.scoped.min.css",
  "./presets/plain": "./dist/presets/plain.min.css",
  "./presets/playroom": "./dist/presets/playroom.min.css"
}
```

A `./dist/*` wildcard keeps existing deep imports resolving. If you add a
build variant, add its export path and verify it resolves from a packed
tarball (`npm pack`) before opening the PR.

## Quality gates

The properties this site advertises — the size, the WCAG AA compliance,
what each build variant does and doesn't contain — are not checked by
review attention. Each one is enforced by an automated check that runs
in CI on every push, and the same checks run locally:

```sh
npm run lint          # stylelint + custom property audit + browser target + doc links + CDN hashes
npm run build         # compile src/ to dist/
npm run check:dist    # structural invariants of the 12 dist files
npm run check:size    # ≤ 14 KiB gzipped per root bundle
npm run docs:build    # build this site (input for the browser checks below)
npm run check:behavior # interaction, reflow, user styles, and input parity across three engines
npm run check:a11y    # axe WCAG 2.0–2.2 A/AA audit of every docs page
npm run check:visual  # screenshot diff of selected component/layout pages
```

The browser-based checks need the Playwright browsers once:
`npx playwright install chromium firefox webkit`.

### Interaction regressions: `check:behavior`

Runs focused interaction tests against Chromium, Firefox, and WebKit. These
tests cover browser-managed states that static screenshots cannot exercise,
such as focus, blur, `:user-valid`, and `:user-invalid`; mouse, Enter, and
Space activation parity; and open dialog and popover states. For the default,
`plain`, and `playroom` themes, the suite also checks every docs page at 320
CSS px, with text at 200%, with WCAG text-spacing overrides, and with
`forced-colors: active`. Reflow assertions compare
`documentElement.scrollWidth` with its `clientWidth`, detect clipped text, and
check open top-layer surfaces independently. WebKit provides the closest
automated coverage available for Safari's rendering engine.

### Dist invariants — `check:dist`

Runs mechanical assertions over every file in `dist/` right after the
build, so the contracts of each build variant can't erode silently:

* every build re-parses with Lightning CSS and is non-empty;
* classless builds emit **no class selectors** (the `.cirth` wrapper is
  the single exception in the scoped variant);
* scoped builds keep **every rule inside the `.cirth` subtree** — no
  selector can style markup that didn't opt in;
* presets only set custom properties on theme roots, never rules.

### CDN integrity — `check:sri`

The `<link>` snippets on [Get Started](/get-started#cdn) and in the README
pin a version *and* carry the `sha384` hash of the file that version
serves. `check:sri` (part of `npm run lint`) keeps the two honest: every
snippet has to pin the version in `package.json`, carry a well-formed hash,
and set `crossorigin="anonymous"`, without which the browser cannot verify
the response at all.

Version and hash are rewritten together by `npm run sri` at release time,
then verified against the bytes jsDelivr actually serves with
`npm run check:sri -- --from-cdn` after publishing. Editing either by hand
is how you ship a snippet that every browser refuses to load; the
[releasing section of `.github/CONTRIBUTING.md`](https://github.com/cirthcss/cirth/blob/master/.github/CONTRIBUTING.md#releasing)
has the full sequence.

### Browser target — `check:browserslist`

The Browserslist target names ten browser families but describes a single
engine floor: Opera and Samsung Internet are Chromium forks, Firefox for
Android is the same Gecko as the desktop build, and iOS Safari is WebKit
either way. Raising `Chrome` and forgetting `Opera` does not widen
support — it quietly lowers the floor back to whatever Chromium that Opera
release was built on, because Lightning CSS compiles for the oldest engine
in the list, and nothing else in the repository notices.

`check:browserslist` (part of `npm run lint`) asserts that invariant: every
Chromium family on the same version, the two forks on the releases built
from it, Firefox and Safari in step with their mobile counterparts, and the
legacy Android Browser absent — it is the same engine as Chrome for
Android and including it makes Lightning CSS expand every grouped selector
in the library. The Chromium-to-fork table lives in the script with a note
on how it was derived; when the floor moves past it, the check says so
instead of passing quietly.

### Documentation lines

The site is versioned at breaking changes, not at releases. A line covers
every version that documents the same API, which is why the switcher in the
header reads `up to v0.10.0` / `from v0.11.0` rather than listing patches.
Before 1.0 that boundary is a minor release; after it, a major.

Three things make it work:

* `docs/src/_data/versions.js` lists the lines. Adding one is a hand edit —
  a deliberate decision, not something a script infers from tags.
* `docs/versions/<dir>/` holds the frozen sites. They are built once, at the
  release that ends them, and committed as-is. They are never rebuilt: an
  archived line should not have to keep compiling against a toolchain that
  has moved on.
* `npm run docs:archive -- <tag> <dir>` does the freezing, in a detached
  worktree so the working tree is untouched. It repoints the tag's
  `pathPrefix` at the archive's own subdirectory before building, since a
  tag predates the directory it ends up in.

At a breaking release, in order: archive the outgoing line
(`npm run docs:archive -- v0.10.0 v0.10`), move `current: true` onto the
new entry in `versions.js`, and write the migration on
[Upgrading](/upgrading). The archived line is excluded from `check:a11y`
and the visual suite on purpose — auditing it would re-audit what the
toolchain thought a year ago, and any finding would be unfixable.

### Where the site is published

The root is always `master`, which is to say the version on npm. `develop`
is built beside it under `/next/`, with a banner on every page saying that
what you are reading has not shipped. Both come out of one Pages artifact,
built by the same workflow, so a push to either branch refreshes both and
neither goes stale while the other moves.

### Accessibility — `check:a11y`

Runs [axe-core](https://github.com/dequelabs/axe-core) with the explicit
`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, and `wcag22aa` tags against every
page of the built docs site. The complete matrix covers the default, `plain`,
and `playroom` themes in light, dark, and forced-colors modes. Dialog and
popover demos are audited once more while open. Since the component demos live
on these pages, this continuously re-verifies the framework's own AA claim, not
just the site around it.

axe's contrast algorithm cannot model the system-color remapping performed by
forced-colors mode, so `color-contrast` remains enabled in light and dark and
is disabled only for that emulation. The behavior suite covers the forced-
colors rendering directly, including focus rings, loading indicators, borders,
open surfaces, and horizontal reflow.

The check fails on any violation not listed in
`scripts/a11y-baseline.json`. That baseline exists so an intentionally
accepted finding can be recorded explicitly — but it is empty, and the
goal is to keep it that way: fix violations rather than baseline them.

### Visual regression — `check:visual`

Playwright screenshots selected component and layout pages at full-page size,
in light and dark modes, at 1440 px and 390 px, and compares each against a committed
baseline in `tests/__screenshots__/`. Any unexplained pixel difference fails
the check. Primarily editorial pages are intentionally excluded because the
docs build, link check, and accessibility audit already cover them without
multiplying text-only snapshots across every browser project.

Two things to know about the baselines:

* **They are per-platform.** System font rendering differs between
  operating systems, so macOS runs compare against the `*-darwin` sets
  and CI compares against the `*-linux` sets. You never edit the Linux
  sets by hand — see below.
* **They live in Git LFS**, so the repository history stays small while
  the images stay versioned.

When your change **intentionally** alters how something renders:

1. regenerate your platform's baselines —
   `npm run check:visual:update`;
2. commit them with the change, and say in the PR what changed visually
   and why.

You don't need to touch the Linux sets. On every push that could affect
rendering, the `update-visual-baselines` workflow regenerates them on a
CI runner and, if anything actually differs, commits them back to the
branch as `github-actions[bot]` — this self-heals both a first-time
bootstrap and a partial change (only the pages your PR touched drift).
Review that commit's images like any other diff.

That commit lands as a separate, later push, so **`check:visual` in the
same CI run as your content change can fail against the not-yet-updated
Linux baseline** — this is expected for a visual change, not a
regression. Re-run the check (or wait for the bot commit and push again)
once it lands. If `check:visual` fails and you *didn't* intend a visual
change, that's the check working — fix the regression instead of
updating baselines.

## What makes a good contribution

* **Keep the surface small.** New components need a strong case; new
  utility classes need a stronger one. If native HTML can express it,
  style the element instead.
* **Don't regress the accessibility floor.** Contrast ratios, focus
  visibility, and the 44px control target size are verified properties of
  the source; a PR that trades them away for aesthetics won't land. The
  target size is a floor, not a fixed height — controls may grow past it,
  and `nav` opts down to WCAG 2.5.8's 24px — so the property to preserve is
  that nothing drops below what it is entitled to.
* **Stay on the spacing scale.** Spacing values are `--cirth-space-*`
  tokens (0.25rem steps to 1.5, 0.5 steps to 3, then whole rems). If a
  value isn't on the scale, that's a design smell worth flagging.
* **Match the CSS first philosophy.** Runtime customization through custom
  properties beats switches decided at compile time; those switches beat new
  build variants.

## License

Contributions are accepted under the project's
[Apache License 2.0](https://github.com/cirthcss/cirth/blob/master/LICENSE.md)
(see [NOTICE.md](https://github.com/cirthcss/cirth/blob/master/NOTICE.md) for
attribution). Documentation contributions fall under the same terms.
