# Build Tooling and Dependency Guide

This guide explains how Cirth uses its Node tooling, why the dependency set is intentionally small, and what contributors should know before changing the build pipeline.

If you are coming from Pico CSS, treat this repository as a related but independent project. Cirth keeps the semantic-first CSS philosophy, but its package setup and build tooling are being simplified around the needs of this codebase.

## Quick Start

Install dependencies with npm:

```sh
npm install
```

Build the project:

```sh
npm run build
```

Run the local watch mode:

```sh
npm run dev
```

Format SCSS sources:

```sh
npm run format
```

Lint SCSS sources:

```sh
npm run lint
```

## Package Policy

Cirth uses npm as the package manager for the build toolchain.

Do not add Yarn, Composer, or another package manager unless there is a concrete distribution or build need for it. The goal is to keep one clear install path and one lockfile.

Before adding a new dependency, prefer one of these options:

1. Use an existing direct dependency.
2. Use a small local Node script when the task is project-specific.
3. Add a package only when it provides a real build capability that would be risky or noisy to maintain locally.

This is especially important for tooling packages that only orchestrate other commands. Cirth currently keeps that logic inside local scripts.

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

`sass-embedded` compiles the SCSS source files into CSS.

It is called by `scripts/build.js` through the Sass Embedded Node API. The build script cleans `dist/`, then compiles only top-level `src/cirth*.scss` entry points into matching `.css` files under `dist/`.

```js
const sass = require("sass-embedded");

const result = sass.compile(source, {
  sourceMap: false,
  style: "expanded"
});
```

It is also used from `scripts/build-themes.js` through the Sass Embedded Node API to generate theme variants.

SCSS is source and build infrastructure for this repository. The published npm
package contains compiled CSS output only.

### lightningcss-cli

Lightning CSS processes the compiled CSS after Sass.

It is called by `scripts/process-css.js` during the build:

```sh
node scripts/process-css.js --transform
node scripts/process-css.js --minify
```

`scripts/process-css.js` calls the local `lightningcss` binary for every non-minified file in `dist/`.

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

Formatting is intentionally separate from semantic source organization. Prettier handles syntax layout; contributors are responsible for keeping SCSS declarations readable and consistent.

### stylelint

Stylelint checks SCSS source quality after Prettier has normalized formatting.

It is used by:

```json
{
  "lint": "stylelint 'src/**/*.scss'",
  "lint:fix": "stylelint 'src/**/*.scss' --fix"
}
```

The configuration lives in `stylelint.config.cjs` and extends `stylelint-config-standard-scss`. The local overrides avoid enforcing naming patterns that would fight the existing Cirth API, CSS custom properties, or selector conventions.

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
3. Clean generated CSS from `dist/`.
4. Compile top-level `src/cirth*.scss` entry points with `sass-embedded`.
5. Compile theme CSS with `scripts/build-themes.js`.
6. Transform compiled CSS with Lightning CSS.
7. Generate minified CSS with Lightning CSS.

The script exists so the project does not need an orchestration dependency such as `npm-run-all`. Keep the public npm scripts short and stable; put project-specific build logic in `scripts/`.

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
- avoids concurrent builds by queueing one rebuild when changes arrive during an active build.

The watcher uses polling instead of system file watchers. This avoids file-handle limits in this repository while keeping the implementation dependency-free.

## Generated CSS

The `dist/` directory contains generated output. It is ignored by Git and
regenerated by local builds, CI, release workflows, and npm publishing.

The build cleans `dist/` before regenerating CSS, so removed or renamed entry
points do not leave stale files behind. When changing SCSS sources or build
tooling, run:

```sh
npm run build
```

Then review the source or tooling diff before committing. Generated `dist/`
files should not be committed.

Large CSS output changes can be normal when changing the processor, minifier,
browser targets, or Sass output style. Use the local build, CI package check,
and release artifacts to verify the generated CSS surface.

## Tools Intentionally Removed

### npm-run-all

`npm-run-all` is not used.

It was previously useful for sequencing npm scripts with `run-s`. Cirth now uses `scripts/build.js` for that job.

Do not reintroduce an orchestration package just to run existing npm scripts in order. Prefer extending `scripts/build.js`.

### nodemon

`nodemon` is not used.

It was previously useful for watching source files and rerunning the build. Cirth now uses `scripts/watch.js`.

Do not reintroduce a watcher dependency unless the local script becomes unable to support the project workflow.

### PostCSS and Autoprefixer

PostCSS is not part of the current build.

The following tools were removed from the direct toolchain:

- `postcss`;
- `postcss-cli`;
- `autoprefixer`;
- `postcss-scss`.

Lightning CSS now handles the compiled CSS transforms and vendor prefixing that used to require PostCSS plus Autoprefixer.

PostCSS can be reconsidered later if the project needs a specific plugin that Lightning CSS does not cover.

### CleanCSS

CleanCSS is not used.

Minification is handled by Lightning CSS through:

```sh
node scripts/process-css.js --minify
```

### css-declaration-sorter

Automatic SCSS declaration sorting is not used.

Declaration order now belongs to the source files and contributor judgment. This avoids churn from automated reordering and keeps the toolchain smaller.

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
node -c scripts/watch.js
node -c scripts/process-css.js
npm run build
```

If the change affects watch mode, also run:

```sh
npm run dev
```

Confirm that the initial build completes and that editing an SCSS file triggers one rebuild.
