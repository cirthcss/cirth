// Documentation lines.
//
// The docs are not archived per release — they are archived at breaking
// changes. A line covers every version that documents the same API, and a
// new one starts only where something stopped working the way it used to,
// which is why the labels are ranges ("up to v0.10.0") rather than single
// versions. Before 1.0 that boundary is a minor; after it, a major, and
// this list stops needing a human to decide.
//
// Adding a line, at a breaking release:
//   1. archive the outgoing site under docs/versions/<dir>/ (see
//      scripts/archive-docs.js),
//   2. move `current: true` onto the new entry,
//   3. write the migration guide on the Upgrading page.

// Where the site itself lives, which is not where this build lives: the
// /next/ preview is served from a subdirectory, so a link that has to
// reach another documentation line — the switcher, the banner's way out —
// must be built from the site root rather than from the build's own
// pathPrefix, which Eleventy's `url` filter would otherwise apply.
const root = process.env.GITHUB_PAGES === "true" ? "/cirth/" : "/";

const lines = [
	{
		current: true,
		href: root,
		label: "from v0.13.0",
		shortLabel: "v0.13",
		summary:
			"The palette is driven by input tokens, and print ships as its own stylesheet.",
	},
	{
		href: `${root}v0.12/`,
		label: "up to v0.12.0",
		shortLabel: "v0.12",
		summary:
			"The last line where print rode inside the bundle and every colour was declared per scheme.",
	},
	{
		href: `${root}v0.10/`,
		label: "up to v0.10.0",
		shortLabel: "v0.10",
		summary:
			"The last line with [data-tooltip] and the .modal-is-* classes.",
	},
];

// The preview build of the unreleased branch, published alongside the
// released site so docs can be reviewed before they are promised to
// anyone. Everything it says is subject to change, and it says so.
const isNext = process.env.DOCS_VARIANT === "next";

module.exports = {
	current: lines.find((line) => line.current),
	isNext,
	lines,
	next: `${root}next/`,
	root,
};
