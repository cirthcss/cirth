# Specs

A spec is the durable record of one behavior-changing change: what Cirth
promises after it lands, how that was verified, and what was decided along the
way.

It is written **before** the implementation and kept **after** the merge. A
spec that only appears at review time has already lost most of its value,
because the decisions it would have shaped were taken without it.

## When a spec is required

Write one when the change alters what a consumer can observe in the published
artifact:

- a public custom property or class is renamed, removed, or changes meaning;
- cascade behavior, specificity, or selector structure changes;
- the browser floor moves, or a feature is adopted that sits near it;
- a default changes, so existing markup renders differently;
- anything carrying the `💥 breaking change` label.

## When a spec is not required

Most work. Do not write one for a bug fix whose contract is already obvious, a
documentation change, tooling, dependency bumps, test coverage, or visual
polish that leaves the public surface alone.

If you are unsure, the question is not "is this important?" but "could a
consumer be surprised after upgrading?" Only the second one asks for a spec.

## What a spec is not

| | |
| --- | --- |
| `HANDOFF.md` | Gitignored, transient, one branch. The *current status* of work in flight. A spec is tracked, durable, and survives the branch. |
| `docs/*.md` records | Narrative records of a body of work, written as it happened. A spec is the contract and its evidence for one change. |
| A pull request description | Review-time summary. It is not read again a year later, and it cannot be updated once the branch is gone. |
| `docs/src/pages/**` | Consumer-facing documentation. A spec is written for whoever maintains Cirth, including the person who wrote it. |

## The evidence ledger

The part that earns the document. Every claim about behavior gets a row saying
what was observed, where, and what it licenses you to claim.

Three verdicts, and the distinction between them is the point:

- **Verified**: reproduced here, now, on a named browser, artifact, or
  command. Record the version; "latest Chrome" ages into a useless claim.
- **Reported**: believed, but inherited from an earlier run, an upstream
  issue, or another project. Not reproduced for this document.
- **Invalid**: evidence that turned out not to support its label. **Keep the
  row.** Deleting it means the next reader repeats the mistake, and the fact
  that a check failed to prove something is itself worth knowing.

A ledger with no `Reported` rows is usually a ledger that is not being honest
about the difference.

Two rules that sound pedantic and are not:

- Say which artifact was measured. `dist/cirth.min.css` at a named commit is
  evidence; "the build" is not.
- Never promote a row's verdict without re-running it. If a `Reported` row
  becomes `Verified`, the run that did it goes in the row.

## Writing one

Copy [`TEMPLATE.md`](TEMPLATE.md) to `specs/<short-slug>.md`. Name it after the
change, not the issue number, so it is still findable when the tracker is not
to hand — `accent-token-roles.md`, not `issue-96.md`. Link the issue from the
header instead.

[`accent-token-roles.md`](accent-token-roles.md) is a worked example.

Keep it short. A spec that nobody finishes reading protects nothing.
