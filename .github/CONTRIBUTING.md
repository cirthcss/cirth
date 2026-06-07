# Contributing to Cirth

Thanks for your interest in contributing to Cirth.

The repository is still moving toward a stable internal organization, so the
contribution workflow is intentionally simple for now. Contributions do not need
to be limited to bug fixes, but larger changes should start with an issue so the
direction can be discussed before implementation.

## Issues

The [issue tracker](https://github.com/cirthcss/cirth/issues) is the primary
public support and feedback channel currently enabled.

Before opening an issue, please search for existing or closed issues. For bug
reports, include a reduced reproduction when possible.

Issues are also welcome for documentation improvements, tooling questions, API
proposals, utility class review, component ideas, and theme cleanup.

## Pull Requests

Pull requests are welcome when they are focused and easy to review.

Please open an issue first for substantial changes, new public APIs, broad
refactors, or anything that changes the project direction.

## Working Locally

Cirth uses npm as the package manager.

```sh
npm install
npm run build
```

Source files live in `src/`. Generated CSS output lives in `dist/`.

For now, keep `dist/` updated when changing source files:

```sh
npm run build
```

The project will decide later when generated output should stop being committed
and move fully to CI, release artifacts, or package publishing.
