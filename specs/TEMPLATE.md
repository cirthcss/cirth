# <Change name>

| | |
| --- | --- |
| Issue | gh#<n> |
| Status | Draft · Implementing · Landed |
| Baseline | `<commit>` on `<branch>` |
| Breaking | Yes / No |

<One paragraph: what changes, and for whom. If a reader stops here, they should
still know whether this affects them.>

## Contract

What Cirth promises once this lands, stated so that it can be falsified.

Say what the change does **not** promise too. Most support questions come from
a reasonable reading of a contract that was never written down: name the
reading you are ruling out.

## Evidence ledger

| Claim | Evidence | Where | Verdict |
| --- | --- | --- | --- |
| <the behavioral claim> | <what was observed> | <browser + version, or command + artifact> | Verified |
| <an inherited claim> | <who reported it, when> | <not reproduced here> | Reported |
| <a claim that did not hold> | <what was actually observed> | <where> | Invalid |

Verdicts: **Verified** (reproduced here, now) · **Reported** (believed, not
reproduced) · **Invalid** (did not support its label; keep the row).

## Decisions

| Decision | Basis | Rationale |
| --- | --- | --- |
| <what was chosen> | Design / Constraint / Existing contract | <why, in one line> |

Record the rejected options with them. A decision without its alternatives
reads as inevitable, and gets reopened by the next person who thinks of one.

## Acceptance

- [ ] <Observable condition, checkable by someone who did not write the change.>
- [ ] <Verification command or fixture, named.>
- [ ] <Documentation or migration note, named by file.>

## Migration

Delete this section if the change is not breaking. Otherwise: what a consumer
must change, as a table they can work through, and what they can leave alone.

## Open questions

What is still unresolved, and what would settle it. Close each one in place
rather than deleting it, so the reasoning stays attached to the outcome.
