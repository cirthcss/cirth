const path = require("node:path");
const { expect, test } = require("@playwright/test");
const { checkBuiltLinks } = require("../scripts/lib/check-built-links");

// The link checker's own test. It runs against a fixture site rather than
// against docs/dist, because a check that only ever sees a passing site is
// a check nobody has watched fail: every case below is a link broken on
// purpose, in one of the four ways a documentation site breaks links.
//
// tests/fixtures/doc-links/ is four small pages. The good one links to a
// real page, a real cross-page fragment, a file the site ships, an
// off-site URL and a bare `#` placeholder, and none of those may be
// reported. The other two link at a page that does not exist, at fragments
// that are not there, and up and across the tree with `../`.

const fixture = path.join(__dirname, "fixtures/doc-links");

const run = () => checkBuiltLinks({ root: fixture, reportRoot: fixture });

// A second fixture whose absolute hrefs carry a path prefix, the way
// Eleventy writes them when the site is served from a subdirectory.
const prefixed = path.join(__dirname, "fixtures/doc-links-prefixed");

test("the built-link check reads every page in the fixture", () => {
	const { checked, pages } = run();
	expect(pages).toBe(3);
	expect(checked).toBe(3);
});

test("a missing page is a violation", () => {
	expect(run().violations).toContainEqual(
		expect.stringContaining('Link "/missing/" resolves to /missing/'),
	);
});

test("a cross-page fragment is checked against that page's ids", () => {
	const { violations } = run();
	expect(violations).toContainEqual(
		expect.stringContaining('Link "/good/#absent" points at #absent'),
	);
	// …and the same shape, reached with ../, from two directories down.
	expect(violations).toContainEqual(
		expect.stringContaining('Link "../../good/#gone" points at #gone'),
	);
});

test("a same-page fragment is checked against this page's ids", () => {
	expect(run().violations).toContainEqual(
		expect.stringContaining('Link "#not-here" points at #not-here'),
	);
});

test("a relative link is resolved from the page it is written on", () => {
	const { violations } = run();
	expect(violations).toContainEqual(
		expect.stringContaining(
			'Link "deep/nowhere/" resolves to /broken/deep/nowhere/',
		),
	);
	// The sibling that does exist is not reported, and neither is `../`.
	expect(violations.join("\n")).not.toContain('"deep/"');
	expect(violations.join("\n")).not.toContain('"../"');
});

test("real links, shipped files, off-site URLs and `#` are left alone", () => {
	const report = run().violations.join("\n");
	for (const href of [
		"#anchored",
		"/broken/",
		"/broken/#present",
		"../assets/paper.css",
		"https://example.com/#nowhere",
		"../../good/#anchored",
	]) {
		expect(report, `${href} was reported`).not.toContain(`"${href}"`);
	}
});

test("every violation names a file and a line", () => {
	for (const violation of run().violations) {
		expect(violation).toMatch(/^[\w./-]+:\d+ Link /);
	}
});

test("the fixture breaks in exactly the five ways it is meant to", () => {
	expect(run().violations).toHaveLength(5);
});

// The site is served from the root in every local build and from /cirth/
// on GitHub Pages, so the second spelling is only exercised on the deploy
// — where a mistake is a failed deployment rather than a failed check.
// It happened: the checker resolved /cirth/colors against a tree whose
// pages are at /colors, and reported the entire site as missing.
test("absolute links resolve under the prefix the site is served from", () => {
	const { pages, violations } = checkBuiltLinks({
		root: prefixed,
		reportRoot: prefixed,
		pathPrefix: "/cirth/",
	});
	expect(pages).toBe(2);
	expect(violations).toEqual([]);
});

test("the same site read without its prefix is all broken", () => {
	const { violations } = checkBuiltLinks({
		root: prefixed,
		reportRoot: prefixed,
	});
	// Not an assertion about a number, but about the failure being total:
	// every absolute href in the fixture is prefixed, and none of them can
	// resolve against routes that are not.
	expect(violations.length).toBeGreaterThan(0);
	expect(violations.join("\n")).toContain("/cirth/deep/page/");
});
