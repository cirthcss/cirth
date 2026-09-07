# Cirth vX.Y.Z-beta.N

<!--
  The model for a prerelease's notes. Copy to .github/releases/vX.Y.Z-beta.N.md
  and fill in; the Package workflow uploads whichever file matches the tag.

  Write for someone deciding whether to try this on their own site. That
  means what changed, what it will do to their pages, and what to do about
  it. It does not mean how the change was arrived at: no session history,
  no audit numbers, no refactor diary. Those belong in CHANGELOG.md and in
  the commits.

  Delete every section that has nothing in it. An empty "Breaking changes"
  heading reads as a promise, not as an absence.
-->

One paragraph: what this beta is for, and what you would be trying it to
find out.

## This is a beta

Visual defaults may still change during the beta series. That is what the
series is for — the point of publishing it is to get the defaults in front
of real pages before they are settled, not to announce that they are.

```sh
npm install @cirthcss/cirth@beta
```

`npm install @cirthcss/cirth` is unaffected and still resolves to the
current stable release. Pin the exact version if you want to stay on one
beta:

```sh
npm install @cirthcss/cirth@X.Y.Z-beta.N
```

## Breaking changes

What stops working, and the smallest change on the reader's side that
fixes it. One entry per break, each with a before and an after.

## What looks different

Changes that repaint an existing page without anyone editing it: colour,
spacing, type, the default rendering of an element. Say which elements,
and roughly how much.

## New and changed defaults

Custom properties added, renamed, or given a different default value, and
what now derives from what.

## API

Selectors, classes, and attributes that are now styled, styled
differently, or no longer styled.

## Known issues

What is still wrong, so nobody spends an afternoon rediscovering it. Link
the issue where there is one.

## Feedback

What would be most useful to hear about, and where to say it —
<https://github.com/cirthcss/cirth/issues>.
