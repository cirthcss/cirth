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
* `src/presets/` contains `cobalt` and `coral`, token override presets published
  alongside the default build.
* `docs/` contains this site (VitePress), styled by Cirth's own build.
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
  "./presets/coral": "./dist/presets/coral.min.css",
  "./presets/cobalt": "./dist/presets/cobalt.min.css"
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
npm run lint          # stylelint + custom property audit + doc links
npm run build         # compile src/ to dist/
npm run check:dist    # structural invariants of the 12 dist files
npm run check:size    # ≤ 14 KiB gzipped per root bundle
npm run docs:build    # build this site (input for the two checks below)
npm run check:a11y    # axe WCAG A/AA audit of every docs page
npm run check:visual  # screenshot diff of every docs page
```

The two browser-based checks need a Playwright Chromium once:
`npx playwright install chromium`.

### Dist invariants — `check:dist`

Runs mechanical assertions over every file in `dist/` right after the
build, so the contracts of each build variant can't erode silently:

* every build re-parses with Lightning CSS and is non-empty;
* classless builds emit **no class selectors** (the `.cirth` wrapper is
  the single exception in the scoped variant);
* scoped builds keep **every rule inside the `.cirth` subtree** — no
  selector can style markup that didn't opt in;
* presets only set custom properties on theme roots, never rules.

### Accessibility — `check:a11y`

Runs [axe-core](https://github.com/dequelabs/axe-core) with the
WCAG 2.x A/AA rule set against every page of the built docs site, in
both light and dark schemes. Since the component demos live on these
pages, this continuously re-verifies the framework's own AA claim, not
just the site around it.

The check fails on any violation not listed in
`scripts/a11y-baseline.json`. That baseline exists so an intentionally
accepted finding can be recorded explicitly — but it is empty, and the
goal is to keep it that way: fix violations rather than baseline them.

### Visual regression — `check:visual`

Playwright screenshots every docs page — full page, light and dark, at
1440 px and 390 px — and compares each against a committed baseline in
`tests/__screenshots__/`. Any unexplained pixel difference fails the
check; the docs demos make this double as visual coverage of every
component.

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
  visibility, and the 44px control height are verified properties of the
  source; a PR that trades them away for aesthetics won't land.
* **Stay on the spacing scale.** Spacing values are `--cirth-space-*`
  tokens (0.25rem steps to 1.5, 0.5 steps to 3, then whole rems). If a
  value isn't on the scale, that's a design smell worth flagging.
* **Match the CSS first philosophy.** Runtime customization through custom
  properties beats switches decided at compile time; those switches beat new
  build variants.

## License

Contributions are accepted under the project's
[MIT License](https://github.com/cirthcss/cirth/blob/master/LICENSE.md).
Documentation contributions fall under the same terms.
