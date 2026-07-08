# Build Tooling

This guide explains how Cirth builds its CSS, why the Node dependency set is
intentionally small, and what contributors should know before changing the
tooling.

For the day-to-day contribution workflow, start with
[`.github/CONTRIBUTING.md`](https://github.com/cirthcss/cirth/blob/develop/.github/CONTRIBUTING.md). This document is the
deeper reference for build, package, and dependency decisions.

If you are coming from Pico CSS, treat this repository as a related but
independent project. Cirth keeps the semantic-first CSS philosophy, but its
package setup and build tooling are intentionally smaller and shaped around
this codebase.

## Common Commands

Cirth uses npm as the only supported package manager.

```sh
npm install
```

Useful commands:

```sh
npm run build
npm run dev
npm run format
npm run lint
npm run lint:fix
```

## Package Policy

Cirth uses npm as the package manager for the build toolchain.

Do not add Yarn, Composer, pnpm, Bun, or another package manager unless there
is a concrete distribution or build need for it. The goal is to keep one clear
install path and one lockfile.

Before adding a new dependency, prefer one of these options:

1. Use an existing direct dependency.
2. Use a small local Node script when the task is project-specific.
3. Add a package only when it provides a real build capability that would be
   risky or noisy to maintain locally.

This is especially important for tooling packages that only orchestrate other
commands. Cirth currently keeps that logic inside local scripts.

## Public Package Surface

The npm package ships compiled CSS from `dist/` only.

SCSS files in `src/` are repository source and build infrastructure. They are
available to contributors, but they are not part of the published package
surface.

Package metadata points consumers to the default compiled stylesheet:

```json
{
  "main": "dist/cirth.min.css",
  "style": "dist/cirth.min.css",
  "files": ["dist"]
}
```

Customizing Cirth should remain CSS-first through custom properties. Sass can
still be used internally to generate the compiled stylesheets and variants.

## Package Exports

`package.json` also declares an `exports` map with one entry per generated
build, so bundlers and Node's own resolver can resolve a build without
knowing the `dist/` filename convention:

```json
{
  "exports": {
    ".": "./dist/cirth.min.css",
    "./classless": "./dist/cirth.classless.min.css",
    "./scoped": "./dist/cirth.scoped.min.css",
    "./classless/scoped": "./dist/cirth.classless.scoped.min.css",
    "./presets/cobalt": "./dist/presets/cobalt.min.css",
    "./presets/coral": "./dist/presets/coral.min.css",
    "./presets/*": "./dist/presets/*",
    "./dist/*": "./dist/*",
    "./package.json": "./package.json"
  }
}
```

The `.`/`classless`/`scoped` entries compose the four structural build
variants, all sharing the one official (amber) theme. `./presets/cobalt` and
`./presets/coral` are separate, optional stylesheets — token-override
presets, not alternate builds — meant to be loaded after any of the four.
They live in `dist/presets/` and go through the same Lightning CSS
transform and minify passes as every other build. The `./dist/*` and
`./presets/*` wildcards are kept so existing deep imports
(`@cirthcss/cirth/dist/cirth.min.css`, as shown in
[Get Started](/get-started)) keep resolving unchanged.

When `scripts/build-presets.js` or `scripts/build.js` change which files get
generated, update this map to match — there is no code that derives it
automatically.

The source configuration is deliberately internal and split by responsibility:

- `src/_config.scss` contains only switches used to generate Cirth's supported
  build variants;
- `src/_breakpoints.scss` contains fixed responsive build data;
- `src/theme/` is the single source of Cirth's official design tokens
  (foundation scales, semantic tokens, and the light/dark color schemes) —
  there's no per-theme folder structure to navigate, since there's only one
  theme;
- `src/_index.scss` composes the internal modules, plus `src/theme/`,
  included in every build.

There is no public Sass settings or module-selection API. Internal modules are
included directly, while the top-level entry points configure only the variants
that Cirth publishes.

## Direct Dependencies

The direct development dependencies are intentionally limited:

```json
{
  "devDependencies": {
    "lightningcss-cli": "...",
    "prettier": "...",
    "sass-embedded": "...",
    "stylelint": "...",
    "stylelint-config-standard-scss": "..."
  }
}
```

### sass-embedded

`sass-embedded` compiles SCSS source files into CSS.

It is called by `scripts/build.js` through the Sass Embedded Node API. The
build script cleans `dist/`, then compiles only top-level `src/cirth*.scss`
entry points into matching `.css` files under `dist/`.

```js
const sass = require("sass-embedded");

const result = sass.compile(source, {
  sourceMap: false,
  style: "expanded"
});
```

It is also used from `scripts/build-presets.js` through the Sass Embedded Node
API to compile each `src/presets/*.scss` entry point into `dist/presets/*.css`.

### lightningcss-cli

Lightning CSS processes the compiled CSS after Sass.

It is called by `scripts/process-css.js` during the build:

```sh
node scripts/process-css.js --transform
node scripts/process-css.js --minify
```

`scripts/process-css.js` calls the local `lightningcss` binary for every
non-minified file in `dist/` and `dist/presets/`.

In transform mode, it:

- reads browser targets through the project `browserslist` setting;
- applies supported CSS transforms;
- handles vendor prefixing;
- rewrites the non-minified CSS files.

In minify mode, it:

- reads the same non-minified CSS files;
- generates matching `.min.css` files;
- uses the same browser target configuration.

### prettier

Prettier formats SCSS source files.

It is used by:

```json
{
  "format": "prettier --write --log-level silent 'src/**/*.scss'"
}
```

Formatting is intentionally separate from semantic source organization.
Prettier handles syntax layout; contributors are responsible for keeping SCSS
declarations readable and consistent.

### stylelint

Stylelint checks SCSS source quality after Prettier has normalized formatting.

It is used by:

```json
{
  "lint": "stylelint 'src/**/*.scss' && node scripts/check-css-variables.js",
  "lint:fix": "stylelint 'src/**/*.scss' --fix && node scripts/check-css-variables.js"
}
```

The configuration lives in `stylelint.config.cjs` and extends
`stylelint-config-standard-scss`. The local overrides avoid enforcing naming
patterns that would fight the existing Cirth API, CSS custom properties, or
selector conventions. It also rejects `!important`; Cirth resolves cascade
behavior through selectors and source order instead of forced priority.

`scripts/check-css-variables.js` complements Stylelint with project-specific
checks for the `--cirth-` prefix, valid custom property names, obsolete Sass
prefix interpolation, and Sass expressions that require interpolation inside
custom property values.

## Build Flow

The public build command is:

```sh
npm run build
```

That command runs:

```json
{
  "build": "node scripts/build.js"
}
```

`scripts/build.js` is the build orchestrator. It runs the pipeline in this order:

1. Format SCSS with Prettier.
2. Lint SCSS with Stylelint.
3. Check CSS custom property usage with `scripts/check-css-variables.js`.
4. Clean generated CSS from `dist/`.
5. Compile top-level `src/cirth*.scss` entry points with `sass-embedded`.
6. Compile preset CSS with `scripts/build-presets.js` (`src/presets/*.scss` →
   `dist/presets/*.css`).
7. Transform compiled CSS (`dist/`, including `dist/presets/`) with
   Lightning CSS.
8. Generate minified CSS for `dist/` (including `dist/presets/`) with
   Lightning CSS.

The script exists so the project does not need an orchestration dependency such
as `npm-run-all`. Keep the public npm scripts short and stable; put
project-specific build logic in `scripts/`.

## Watch Mode

The public development command is:

```sh
npm run dev
```

That command runs:

```json
{
  "dev": "node scripts/watch.js"
}
```

`scripts/watch.js` replaces `nodemon`.

It:

- scans `src/` for `.scss` files;
- starts one initial build;
- checks for changes on a short polling interval;
- debounces rebuilds;
- avoids concurrent builds by queueing one rebuild when changes arrive during
  an active build.

The watcher uses polling instead of system file watchers. This avoids
file-handle limits in this repository while keeping the implementation
dependency-free.

## Generated CSS

The `dist/` directory (including `dist/presets/`) contains generated
output. It is ignored by Git and regenerated by local builds, CI, release
workflows, and npm publishing.

The build cleans `dist/` before regenerating CSS, so removed or renamed
entry points do not leave stale files behind. When changing SCSS sources or
build tooling, run:

```sh
npm run build
```

Then review the source or tooling diff before committing. Generated `dist/`
files should not be committed.

Large CSS output changes can be normal when changing the processor, minifier,
browser targets, or Sass output style. Use the local build, CI package check,
and release artifacts to verify the generated CSS surface.

CI also runs `npm pack --dry-run` after the build so package contents stay
aligned with the generated CSS surface.

## Tools Intentionally Removed

### npm-run-all

`npm-run-all` is not used.

It was previously useful for sequencing npm scripts with `run-s`. Cirth now
uses `scripts/build.js` for that job.

Do not reintroduce an orchestration package just to run existing npm scripts in
order. Prefer extending `scripts/build.js`.

### nodemon

`nodemon` is not used.

It was previously useful for watching source files and rerunning the build.
Cirth now uses `scripts/watch.js`.

Do not reintroduce a watcher dependency unless the local script becomes unable
to support the project workflow.

### PostCSS and Autoprefixer

PostCSS is not part of the current build.

The following tools were removed from the direct toolchain:

- `postcss`;
- `postcss-cli`;
- `autoprefixer`;
- `postcss-scss`.

Lightning CSS now handles the compiled CSS transforms and vendor prefixing that
used to require PostCSS plus Autoprefixer.

PostCSS can be reconsidered later if the project needs a specific plugin that
Lightning CSS does not cover.

### CleanCSS

CleanCSS is not used.

Minification is handled by Lightning CSS through:

```sh
node scripts/process-css.js --minify
```

### css-declaration-sorter

Automatic SCSS declaration sorting is not used.

Declaration order now belongs to the source files and contributor judgment.
This avoids churn from automated reordering and keeps the toolchain smaller.

### caniuse-lite

`caniuse-lite` is not maintained as a direct dependency.

Browser targeting remains declared in `package.json`:

```json
{
  "browserslist": ["defaults"]
}
```

Lightning CSS CLI reads that setting when it runs with `--browserslist`.

## Contributing To The Toolchain

When changing the build system, keep these rules in mind:

- Keep npm scripts as public entry points, not as the main place for build logic.
- Put project-specific behavior in `scripts/`.
- Avoid dependencies that only replace a few lines of local Node code.
- Keep generated CSS reproducible from `npm run build`.
- Update this guide when dependency behavior changes.

For most build changes, a good verification pass is:

```sh
node -c scripts/build.js
node -c scripts/build-presets.js
node -c scripts/watch.js
node -c scripts/process-css.js
npm run build
npm pack --dry-run
```

If the change affects watch mode, also run:

```sh
npm run dev
```

Confirm that the initial build completes and that editing an SCSS file triggers
one rebuild.
