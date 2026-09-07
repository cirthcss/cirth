# Releasing Cirth

> **Develop anywhere. Release only from `master`. Publish only through the
> release workflow.**

This file is the canonical release process. It is the only complete
description of it: `.github/CONTRIBUTING.md` and `AGENTS.md` point here
rather than restating it, so there is never a second version to fall out
of date.

npm is a permanent public record. A version, once live, is the version
everyone with a caret range may install, and it cannot be taken back
cleanly. So nothing reaches it that does not already exist in this
repository's history — and nothing reaches it without a person deciding
twice.

## The shape of it

```text
Phase A   develop anywhere
              ↓
Phase B   prepare the release      →  ■ CHECKPOINT 1: a human merges it
              ↓
Phase C   cut the release          →  ■ CHECKPOINT 2: a human approves npm
```

Everything between the two checkpoints can be automated, and most of it
is. The checkpoints themselves are not automatable by policy, not by
accident:

| # | The question only a person answers |
|---|---|
| 1 | Is this release content ready to enter `master`? |
| 2 | Should this exact staged artifact become public on npm? |

---

## Phase A — normal development

There is no required branching ceremony. A small fix goes straight to a
pull request:

```text
fix/… or feat/…  →  PR  →  master
```

Larger work can be integrated on `develop` first, if that is useful:

```text
feature A ─┐
feature B ─┼→  develop  →  PR  →  master
feature C ─┘
```

`develop` is an **integration branch, not a release source**. Neither is
any feature or experiment branch. No version tag is cut on them, no npm
version originates from them, and no release commit exists that did not
pass through `master`.

Whichever route the work takes, Phase B does not begin until the change
is in `master` and CI is green on that commit.

---

## Phase B — prepare the release

```text
master (green)
      ↓
release/vX.Y.Z
      ↓  PR
master  →  CI green
```

The release branch carries **release material only**: the version in
`package.json`, the lockfile if it moved, `CHANGELOG.md`, the release
notes, and related metadata. Fixes discovered *during* preparation belong
here too — nothing else does. Normal development does not continue on a
release branch.

### The mechanical half

```sh
npm run release:prepare -- --version 0.15.0-beta.2
```

That validates the version, checks the working tree is clean, refuses to
start from anything but the current `origin/master`, creates or verifies
`release/vX.Y.Z`, bumps `package.json`, scaffolds the release notes from
the template, opens a `CHANGELOG.md` section, rebuilds `dist/`, and runs
the checks. It commits nothing and pushes nothing.

### The editorial half

The script deliberately does not write the prose. Compare the previous
release with what is now on `master`, decide which changes a consumer can
actually see, and write them up:

> **Release notes describe changes in Cirth, not how the maintainers
> arrived at them.**

No session history, no audit numbers, no refactor diary. Those belong in
the commits. Start from `.github/releases/TEMPLATE-prerelease.md` for a
prerelease, and delete every heading you leave empty — an empty
"Breaking changes" reads as a promise, not as an absence.

### Then

Open the pull request, and **stop**.

> ### ■ Checkpoint 1
>
> An agent preparing a release **stops before merging the release PR into
> `master`**, unless the maintainer has authorized that merge in the same
> turn.
>
> Report: version, PR, files changed, changelog and release notes, CI
> status, and any blocker.

---

## Phase C — cut the release

Once the release PR is merged and CI is green on that `master` commit:

```text
master (green)
      ↓  tag
      ↓  Package        → GitHub Release + artifacts
      ↓  Publish npm    → validation, gates, pack, smoke, stage
   npm staging
```

### Where you are

```sh
npm run release:status -- --version 0.15.0-beta.2
```

Reports which of the steps below have happened and names the next legal
one. It composes what already exists — it is not a second release engine.

### The steps

```sh
# 1 — tag the master commit the release PR produced, on the remote
gh api repos/cirthcss/cirth/git/refs \
  -f ref=refs/tags/v0.15.0-beta.2 -f sha=<master sha>

# 2 — GitHub Release and artifacts
gh workflow run package.yml --ref master -f tag=v0.15.0-beta.2

# 3 — npm, staged
gh workflow run npm-publish.yml --ref master \
  -f tag=v0.15.0-beta.2 -f channel=beta -f mode=stage
```

The tag is created **on the remote, at a named `master` commit**, rather
than pushed from a local one. That is not a workaround for the pre-push
guard — it is why the guard refuses a local `v*` push at all. A tag pushed
from a clone points wherever that clone's history happens to put it; a tag
created against an explicit SHA cannot point anywhere else, and the `v*`
ruleset still requires an admin to create it.

Both workflows are dispatched **from `master` with the tag as an input**,
never "from" the tag. A `workflow_dispatch` against a tag ref runs the
workflow file *as it exists on that tag* — so a tag cut on a working
branch would bring its own copy of these rules, without the rule that
says it may not publish. Running from `master` means the rules always
come from `master`, and the tag is only data to be validated.

The publish is **staged**. Nothing is live.

> ### ■ Checkpoint 2
>
> An agent **stops at the staged package**. It does not approve the
> stage, does not supply 2FA, and does not make the version public.
>
> Report: version, commit, tag, channel, package checks, consumer smoke,
> provenance.

### The maintainer's approval

```sh
npm stage list @cirthcss/cirth
npm stage view <stage-id>       # metadata, files, dist-tag
npm stage download <stage-id>   # the tarball itself, to inspect
npm stage approve <stage-id>    # prompts for 2FA — this is the publish
npm stage reject <stage-id>     # if anything is wrong
```

Approval is blocked until npm's malware scan finishes.

### Afterwards

```sh
npm dist-tags ls @cirthcss/cirth       # latest must not have moved
npm view @cirthcss/cirth@beta version
```

For a **stable** release only, once jsDelivr has fetched it:
`npm run check:sri -- --from-cdn`.

---

## Which number to bump

Cirth is pre-1.0, so the minor slot carries everything a 1.0 project would
split between major and minor:

- **Minor** (`0.X.0`) for a new feature, a new public custom property, any
  breaking change, and any change to how existing markup renders by
  default. A visited-link color that repaints every site's links is a
  minor, even though it removes nothing.
- **Patch** (`0.x.Y`) only for changes that bring behavior back to what
  was already documented or intended: bug fixes, and internal or tooling
  work with no effect on the published CSS.

Minor numbers are not scarce, and 0.9.0 is not obliged to be the last stop
before 1.0. When a release is a close call, bump the minor: a caret range
(`^0.8.0` resolves to `>=0.8.0 <0.9.0`) means a patch reaches everyone
automatically, and the version number is the only warning most people get.
v0.8.1 is the counterexample to learn from: it shipped as a patch while
carrying a change its own changelog entry labels breaking.

## Channels

A prerelease is opt-in, and stays opt-in:

| version | dist-tag | reached by |
| --- | --- | --- |
| `0.15.0` | `latest` | `npm install @cirthcss/cirth` |
| `0.15.0-beta.2` | `beta` | `npm install @cirthcss/cirth@beta` |
| `0.15.0-rc.1` | `rc` | `npm install @cirthcss/cirth@rc` |

The dist-tag is **derived, never chosen**: it is the version's own
prerelease identifier, or `latest` when there is none. The workflow asks
for a channel anyway, as a statement of intent, and fails if the two
disagree — so `v0.15.0` dispatched to the beta channel is refused, and so
is `v0.15.0-beta.1` dispatched to `latest`.

`latest` never moves during a prerelease series. Someone who installs
Cirth without asking for a beta keeps getting the stable release until a
stable release replaces it.

Promoting a prerelease means cutting a new version, not moving a dist-tag:
`0.15.0-beta.4` becomes `0.15.0` by releasing `0.15.0` from `master` like
any other version. And a bad beta is superseded, never overwritten —
`beta.2` broken means `beta.3`. `npm unpublish` is not the rollback path;
`npm deprecate` on the specific version is, when one is needed at all.

The documented CDN snippets follow `latest`, not the version in
`package.json`: during a prerelease series `npm run sri` deliberately
rewrites nothing, because `dist/` holds the prerelease's bytes and the
snippets point at the last stable release's. The README does not
advertise a beta.

## What the release workflow checks

`Publish npm` is not a wrapper around `npm publish`. In order:

1. the dispatch ref is `master`;
2. the tag is well-formed, and names the same version as `package.json`;
3. the requested channel is the one that version belongs to;
4. `origin` agrees the tag points at the commit being released;
5. **that commit is reachable from `origin/master`**;
6. **CI already concluded successfully on that exact commit** — which is
   where the browser suites live (behavior, accessibility, and the visual
   baselines, which are Linux-specific Git LFS objects). The release job
   reads that result rather than spending twenty minutes reproducing it;
   if CI was cancelled or never ran, the release fails and the fix is to
   re-run CI, not to lower the bar;
7. `lint`, `build`, `check:dist`, `check:size`, `docs:build` and
   `check:tooling`, in a clean checkout with nothing left over from
   development;
8. `check:package` and `check:consumer` — the tarball's exact contents,
   and a real install of it into an empty project.

Gate 5 fails with:

> Releases must be published from commits already merged into master.

**These gates fail closed and have no bypass.** There is no `--force`, no
`--skip-master`, no `--skip-ci`. If one of them is wrong, the fix is a
pull request, not a flag.

`npm run check:release --unpublished` exists for asking the same question
*before* the tag is cut. It is advisory: it skips the remote-tag check,
prints that it is advisory, and refuses to emit the workflow outputs a
publish would consume.

Authentication is npm **trusted publishing** over GitHub OIDC. No npm
token is stored in this repository, the identity is minted per run, and
provenance is generated automatically, linking the published tarball back
to this repository, this workflow, and the `master` commit it was built
from. The trusted publisher is bound to the workflow **filename**, so
`npm-publish.yml` cannot be renamed without reconfiguring it on npmjs.com.

## Subresource Integrity

The CDN snippets in `README.md` and on the Get Started page carry a
`sha384` `integrity` hash and `crossorigin="anonymous"`, so a browser
refuses a jsDelivr response whose bytes are not the ones documented here.
A hash only means anything next to the version it was taken from, which is
why `npm run sri` rewrites the version pin and the hash in one pass: never
bump one by hand.

Run it **after the last change to the CSS**. It hashes what is in `dist/`
at the moment it runs, so anything that touches the source afterwards
leaves the snippets pointing at a build that will never be published, and
browsers refuse the file. The rewritten `README.md` and
`docs/src/pages/get-started.md` belong in the release commit.

`npm run check:sri` runs as part of `npm run lint`. It is offline and
structural: every snippet pins the documented version, carries a
well-formed hash, and sets `crossorigin`. It cannot tell whether the hash
matches the published file, because between releases `dist/` has already
moved past the version the snippets pin. `npm run check:sri -- --from-cdn`,
after a stable release, is the check that compares against the real
published bytes.

The documented version is the one in `package.json`, **unless that is a
prerelease** — then it is the last stable release, read from the filenames
in `.github/releases/`. A `<link>` in the README is an instruction to a
reader who asked for the framework, not for a beta of it, which is the
same reason a prerelease never takes the `latest` dist-tag. While
`package.json` is at a prerelease, write mode refuses to rewrite anything:
`dist/` holds the prerelease's bytes, and hashing them next to the stable
pin would produce a digest that does not match what jsDelivr serves, so
every browser would refuse the stylesheet outright. Use
`npm run sri -- --from-cdn` if the snippets ever need re-deriving during a
beta series — that reads the published files, which are the right ones.

If `--from-cdn` disagrees after a release, the build was not reproducible:
regenerate from the published files with `npm run sri -- --from-cdn`,
commit the correction, then look into why the two builds differed.

---

---

## Enforcement

Four layers, and it matters which is which. Only the first is guaranteed
by this repository.

### Repository-enforced — cannot be talked out of

- `scripts/check-release.js`: tag grammar, tag ↔ `package.json`, channel ↔
  version shape, remote tag agreement, **master ancestry**.
- `.github/workflows/npm-publish.yml`: `if: github.ref ==
  'refs/heads/master'`, the CI-conclusion gate, and every check above.
- `.github/workflows/package.yml`: the same ancestry gate before a GitHub
  Release exists, and automatic prerelease marking.
- `scripts/check-package-surface.js` and `scripts/smoke-consumer.js`, in
  CI on every push and again before publishing.
- `scripts/update-sri.js`: refuses to repin CDN snippets to a prerelease.

### Local defense-in-depth — installed per clone

Two guards refuse the dangerous commands before they run. Set them up once
per machine:

```sh
npm run setup:hooks           # Git pre-push guard
npm run setup:claude-hooks    # only when using Claude Code
npm run check:hooks           # verifies the first is active
```

- **`.githooks/pre-push`** refuses a direct push to `master` or to a `v*`
  tag, whatever tool made it — a shell, an IDE, any coding agent. Git will
  not run a hook a repository merely ships, so `core.hooksPath` has to be
  pointed at `.githooks/`, which `npm run setup:hooks` does locally (never
  `--global`). That directory also carries the Git LFS hooks, because
  `core.hooksPath` replaces `.git/hooks/` wholesale and the visual
  baselines live in LFS — dropping them would make pushes succeed with the
  objects missing.
- **A Claude Code `PreToolUse` hook** refuses `npm publish`,
  `npm stage publish`, `npm stage approve`, `npm dist-tag add`/`rm`, and
  the same dangerous pushes, before the shell sees them. It covers what
  Git cannot: those commands never touch a ref. `.claude/` is gitignored,
  so the configuration is per-machine; the installer and the guard it
  points at are tracked.

Both read one definition of what is protected,
`scripts/lib/release-guard.js`, and `npm run check:guards` — inside
`npm run check:tooling` — asserts in both directions: the dangerous forms
are refused, and `git push origin feature/x`, `npm pack`,
`npm stage list`, `npm stage reject` are not. A guard that blocked ordinary
work would be switched off within the hour, and then nothing would be
guarded at all.

**Neither is a security boundary.** `git push --no-verify` skips the first;
repointing `core.hooksPath` or editing `.claude/settings.local.json` skips
either. Whoever owns the machine owns both. They exist to stop an accident
and to make the canonical path the path of least resistance. GitHub and
npm are what actually refuse.

### GitHub — configured

- **`master`: `pull request and green CI`** (ruleset, active). Pull request
  required, `Lint and build` as a required status check, force-push and
  deletion blocked, and **no bypass actors at all** — the maintainer and
  every workflow token included. Master's history changes only through a
  pull request, which is what makes "release only from master" mean
  something. To do otherwise the ruleset has to be edited, which is a
  deliberate, auditable act rather than a slip.
- **`refs/tags/v*`: creation, update and deletion protected** (ruleset,
  active), bypassed only by the repository admin, who is the one who cuts
  releases by hand in Phase C. It stops an ordinary collaborator or token
  from minting a release tag; it does not, and cannot, constrain an admin.
- Required approvals are **0**: this repository has one maintainer, and
  GitHub does not let anyone approve their own pull request.
  `require_extra_approval_for_unattributed_changes` is off for the same
  reason — with zero required approvals it could only ever be a lockout,
  never a review.
- The branch is not required to be up to date before merging. CI takes
  about twenty-five minutes and master rarely moves during a pull request;
  requiring it would buy little and cost a rebase-and-rerun each time.
- Because master takes no direct pushes, the **Update visual baselines**
  workflow opens a pull request there instead of committing, and pushes
  directly only on ordinary branches. Granting its token a bypass would
  have meant any workflow could write to master — including one added on
  a branch, which is precisely the hole the ruleset closes.
- Optionally, an `npm` environment with required reviewers, as a gate
  before the publish workflow runs at all. It must be declared on both
  sides — the workflow and the npm trusted-publisher configuration — or
  the OIDC subject stops matching. Not configured: npm's own staged
  approval already puts a person and a 2FA prompt in the same place.

### npm configuration required

- **Trusted publisher** on `@cirthcss/cirth`: organization `cirthcss`,
  repository `cirth`, workflow filename `npm-publish.yml`, environment
  empty. Case-sensitive, exact.
- **2FA on the account** — a prerequisite of staged publishing, and
  required to approve.
- Leave the configuration in **staging mode**, which is the default for
  new trusted-publisher configurations.
- No `NPM_TOKEN`. This repository has no Actions secrets at all, and
  should not acquire one.

### Instruction-only — depends on cooperation

- Stopping at Checkpoint 1 rather than merging the release PR.
- Stopping at Checkpoint 2 rather than approving the stage.
- Not replacing the workflows with equivalent shell commands.

These are in `AGENTS.md`. They are defense in depth, not the security
boundary. The boundary is the layer above: branch protection, tag
protection, and npm's own 2FA.

---

## Setting up a clone

```sh
npm ci
npm run setup:hooks           # Git pre-push guard — every clone
npm run setup:claude-hooks    # only when using Claude Code
npm run check:tooling         # includes the guard tests
npm run check:hooks           # confirms the Git guard is active
```

`check:hooks` is deliberately not part of `check:tooling`: CI configures no
hooks and does not need any, and a check that failed for every consumer of
this repository would be switched off within a week.

## Command reference

| | |
|---|---|
| `npm run release:prepare -- --version X.Y.Z` | Phase B, mechanical half |
| `npm run release:status -- --version X.Y.Z` | where a release is, and what is next |
| `npm run check:release -- --tag vX.Y.Z --channel <c>` | the gate, as CI runs it |
| `npm run check:package` | what npm would publish |
| `npm run check:consumer` | pack, install into a clean project, resolve every entry point |
| `gh workflow run package.yml --ref master -f tag=vX.Y.Z` | GitHub Release |
| `gh workflow run npm-publish.yml --ref master -f tag=vX.Y.Z -f channel=<c> -f mode=stage` | npm, staged |
| `npm stage approve <id>` | Checkpoint 2, maintainer only |
| `npm run setup:hooks` | install the Git pre-push guard in this clone |
| `npm run setup:claude-hooks` | install the Claude Code PreToolUse guard |
| `npm run check:hooks` | confirm the Git guard is active here |
| `npm run check:guards` | assert both guards refuse the right things |
| `gh api repos/cirthcss/cirth/git/refs -f ref=refs/tags/vX.Y.Z -f sha=<sha>` | create a release tag at a named master commit |
