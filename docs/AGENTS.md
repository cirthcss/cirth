# Documentation agent instructions

The root [`AGENTS.md`](../AGENTS.md) is authoritative. Its safety, prose,
specification, release and verification policies apply here.

## Retrieve context selectively

1. Identify the documentation subsystem affected by the request.
2. Consult [`ai-context/file-map.md`](ai-context/file-map.md) when the entry
   point or related files are unclear.
3. Read only the relevant section of
   [`ai-context/architecture.md`](ai-context/architecture.md) when cross-file
   behavior or an architectural constraint matters.
4. Verify the map against the current source files before editing.
5. Expand searches only when the targeted sources do not answer the question.
6. Run the checks required by the root policy and the change's scope. The
   canonical check guidance is in `docs/src/pages/contributions.md`.

Prefer file, selector and symbol searches over broad repository scans.
`docs/dist/` and `docs/src/styles/generated/` are generated: never edit them,
and inspect them only when the task specifically concerns built output. Treat
`docs/versions/` as frozen history and screenshot directories as test
artifacts; do not search them by default. Initial exploration does not require
a docs build, browser suite, visual suite or dead-CSS audit.

## Maintain the context

Update the affected knowledge-base entries when a change moves a referenced
file or changes subsystem ownership, rendering or asset pipelines, important
dependencies, or documented architectural constraints. Ordinary content
edits, isolated CSS adjustments and bug fixes do not require context updates.

Change only the affected entries, remove obsolete references and verify every
new reference against current source. Do not regenerate unaffected sections.
These documents are navigation aids; current source remains authoritative.
