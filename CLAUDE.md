@AGENTS.md

## Claude Code

The repository's instructions are in `AGENTS.md`, imported above. Release
work additionally requires reading `RELEASING.md` in full before acting —
the summary in `AGENTS.md` is not enough to cut a release from.

Two local guards will refuse dangerous release commands: a Git `pre-push`
hook and a `PreToolUse` hook on Bash. Do not bypass them with
`--no-verify`, by repointing `core.hooksPath`, or by editing their
configuration. Direct npm publishing and final staged approval are not
valid agent actions in any circumstance.

If a guard blocks something you believe is correct, stop and say so rather
than working around it.

Long checks (`check:behavior`, `check:visual`, the dead-CSS audit) take
minutes and share this working tree. Before starting one, confirm no other
session is writing here; report a conflict rather than terminating another
process.
