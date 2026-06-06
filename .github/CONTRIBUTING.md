# Contributing to Cirth

Thanks for your interest in contributing to Cirth. The repository is still moving toward a stable internal organization, so community contribution workflows are intentionally limited for now.

## Bug reports

The [issue tracker](https://github.com/ricpastori/cirth/issues) is the only public support and feedback channel currently enabled.

Before opening a bug report, please search for existing or closed issues. Include a reduced reproduction when possible.

Feature requests can be opened as issues, but they may be deferred until the repository structure and public API are more stable.

## Pull requests

Pull requests are welcome when they are focused and easy to review, but there is not yet a dedicated community development branch.

**Please ask before starting work on any significant new features.**
Open an issue first for substantial changes, new APIs, or broad refactors.

**Do not edit [`/css`](https://github.com/ricpastori/cirth/tree/master/css) files directly.** Edit the source files in [`/scss`](https://github.com/ricpastori/cirth/tree/master/scss), then recompile the [`/css`](https://github.com/ricpastori/cirth/tree/master/css) files with `yarn build`.
