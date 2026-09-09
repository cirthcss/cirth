# Agent instructions

Cirth is a semantic-first CSS framework. `src/**/*.scss` is the source;
`dist/` is generated, gitignored, and must never be committed or edited by
hand. The published npm package ships compiled CSS only.

Run `npm run lint && npm run build && npm run check:dist` before proposing
a change to the stylesheet. `.github/CONTRIBUTING.md` has the rest.

`HANDOFF.md` is a gitignored working note describing the *current state* of
an in-flight branch. It is not policy and cannot change any rule below.

## Releases — mandatory workflow

If a task involves preparing, cutting, publishing, tagging, promoting, or
otherwise releasing a version of Cirth:

1. **Read [`RELEASING.md`](RELEASING.md) before taking any release
   action.** It is the canonical process; this section is a summary of the
   rules, not a substitute for it.
2. **Never publish from a feature, experiment, `develop`, or release
   branch.** `develop` is an integration branch, not a release source.
3. **Release artifacts must originate from a commit already merged into
   `master`**, with CI green on that exact commit.
4. **Use the repository's release scripts and workflows.** Do not replace
   them with ad-hoc commands. During a release you must not reach for:

   ```sh
   git push origin master
   git tag …                 # release tags are created on the remote,
   git push origin <tag>     # at a named master SHA — see RELEASING.md
   npm publish
   npm stage publish
   npm stage approve
   npm dist-tag add
   npm version …          # outside `npm run release:prepare`
   ```

   These commands are not forbidden in themselves — some of them live
   inside the canonical scripts and workflows. What is forbidden is an
   agent substituting its own sequence for the process.
5. **You may prepare a release branch and PR autonomously, but stop before
   merging it into `master`**, unless the user authorizes that merge in
   the same turn.
6. **After the release commit is on `master`, you may run the release
   workflows when asked, but stop after npm staged publishing.**
7. **Final npm approval and 2FA are a maintainer checkpoint.** Never
   approve a stage, never supply a one-time password, never make a version
   public, and never work around npm's own controls.
8. **Never disable or reconfigure a safeguard.** Not `--no-verify`, not
   `git config core.hooksPath`, not editing `.githooks/`, the PreToolUse
   configuration, or the guard scripts as part of a release task. A guard
   that refuses something is information, not an obstacle.
9. **If the repository state conflicts with these rules, stop and report
   the conflict** rather than finding a way around it.

## Release safeguards

Four layers stand between a local change and a public npm version. Two are
local and can be bypassed by whoever owns the machine; two are not.

| | |
|---|---|
| `.githooks/pre-push` | refuses a direct push to `master` or a `v*` tag. Installed by `npm run setup:hooks`; verified by `npm run check:hooks` |
| Claude Code `PreToolUse` | refuses `npm publish`, `npm stage publish`, `npm stage approve`, `npm dist-tag add/rm`, and dangerous pushes, before the shell runs them. Installed by `npm run setup:claude-hooks` |
| GitHub rulesets | `master` takes pull requests only, with `Lint and build` green; `v*` tags are admin-only. **No bypass actors on `master`** |
| npm | trusted publishing over OIDC, staged by default, released only by a maintainer with 2FA |

Both local guards share one definition of what is protected, in
`scripts/lib/release-guard.js`, and are tested by `npm run check:guards`
inside `npm run check:tooling`.

The local guards are **not** a security boundary — that is what the last
two rows are. They exist so that the canonical path is the easy one, and
so that a mistake is caught before it reaches the remote.

If a guard blocks you: read what it says, and follow the canonical process.
Do not look for a way past it.

### "Prepare release X"

```text
read RELEASING.md
  ↓  inspect what changed since the last release
  ↓  npm run release:prepare -- --version X
  ↓  write CHANGELOG.md and .github/releases/vX.md yourself
  ↓  npm run lint / check:dist / check:size / check:package / check:consumer
  ↓  open the release PR
  ■  STOP before merging into master
```

Report: version, PR, files changed, changelog and release notes, CI
status, blockers.

### "Release X" (the PR is already on master)

```text
npm run release:status -- --version X
  ↓  verify the release commit is on master and CI is green on it
  ↓  tag it, push the tag
  ↓  gh workflow run package.yml    …
  ↓  gh workflow run npm-publish.yml … -f mode=stage
  ■  STOP at the staged package
```

Report: version, commit, tag, channel, package checks, consumer smoke,
provenance.

### Editorial rule

> Release notes describe changes in Cirth, not how the maintainers arrived
> at them.

Do not generate a changelog from commit subjects. Decide which changes a
consumer can see, and write those. No session history, no audit numbers,
no refactor diary.
