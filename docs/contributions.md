# Contributions

Cirth is developed in the open at
[github.com/cirthcss/cirth](https://github.com/cirthcss/cirth).
Bug reports, accessibility findings, and focused pull requests are all
welcome. The full workflow lives in
[`.github/CONTRIBUTING.md`](https://github.com/cirthcss/cirth/blob/master/.github/CONTRIBUTING.md);
this page is the practical summary.

## Getting set up

npm is the only supported package manager — one install path, one lockfile:

```sh
git clone https://github.com/cirthcss/cirth.git
cd cirth
npm install
```

The commands you'll actually use:

```sh
npm run build      # compile src/ to dist/ (format, lint, compile, minify)
npm run dev        # rebuild on change
npm run lint       # stylelint + CSS custom property check
npm run lint:fix
npm run docs:dev   # run this docs site locally
```

## Where things live

- `src/` — SCSS source. Repository infrastructure, **not** a public Sass
  API: the npm package ships compiled CSS from `dist/` only, and
  customization stays CSS-first through `--cirth-` custom properties.
- `src/theme/` — design tokens: color scales, foundations, and the
  light/dark schemes. Most visual changes start here, not in components.
- `src/presets/` — `cobalt` and `coral`, token-override presets published
  alongside the default build.
- `docs/` — this site (VitePress), styled by Cirth's own build.
- `scripts/` — local Node build scripts. Prefer extending these over
  adding tooling dependencies; a new package needs to provide a real build
  capability that would be risky to maintain locally.

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

## What makes a good contribution

- **Keep the surface small.** New components need a strong case; new
  utility classes need a stronger one. If native HTML can express it,
  style the element instead.
- **Don't regress the accessibility floor.** Contrast ratios, focus
  visibility, and the 44px control height are verified properties of the
  source — a PR that trades them away for aesthetics won't land.
- **Stay on the spacing scale.** Spacing values are `--cirth-space-*`
  tokens (0.25rem steps to 1.5, 0.5 steps to 3, then whole rems). If a
  value isn't on the scale, that's a design smell worth flagging.
- **Match the CSS-first philosophy.** Runtime customization through custom
  properties beats compile-time switches; compile-time switches beat new
  build variants.

## License

Contributions are accepted under the project's
[MIT License](https://github.com/cirthcss/cirth/blob/master/LICENSE.md).
Documentation contributions fall under the same terms.
