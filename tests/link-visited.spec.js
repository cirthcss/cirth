const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");
const {
	assertDocsBuilt,
	createServer,
	startServer,
} = require("../scripts/lib/docs-site");

// gh#58 — a followed content link drops the accent for
// --cirth-link-visited-color, while navigation and the color variants keep
// theirs.
//
// Two layers, because :visited is deliberately unobservable. A page can
// never read it back (getComputedStyle answers with the unvisited color by
// design, so a page can't sniff history), and browsers only consult their
// history store when they feel like it: the ephemeral profiles automation
// drives never expose the state at all in Chromium and WebKit, and Firefox
// resolves it asynchronously after first paint. So the CSS contract is
// asserted against the built stylesheets, and the painted result is
// asserted only where the engine actually offers one — gated on a sentinel
// rule, skipped where it doesn't.

assertDocsBuilt("link-visited.spec");

const projectRoot = path.join(__dirname, "..");
const visitedPath = "/colors/";
const unvisitedPath = "/never-visited/";
const paintTimeout = 3000;

const builds = [
	{ classes: true, file: "dist/cirth.css", name: "default" },
	{ classes: false, file: "dist/cirth.classless.css", name: "classless" },
	{ classes: true, file: "dist/cirth.scoped.css", name: "scoped" },
];

/** @type {import("node:http").Server} */
let server;
/** @type {string} */
let origin;

test.beforeAll(async () => {
	server = createServer();
	origin = await startServer(server);
});

test.afterAll(() => {
	server.close();
});

/** @param {string} file */
const read = (file) => {
	const stylesheet = path.join(projectRoot, file);

	if (!fs.existsSync(stylesheet)) {
		throw new Error(
			`link-visited.spec: ${file} not found: run \`npm run build\` first.`,
		);
	}

	return fs.readFileSync(stylesheet, "utf8");
};

// --- The CSS contract, asserted on the built stylesheets ---------------

for (const build of builds) {
	test(`the visited rule ships in the ${build.name} build`, () => {
		const css = read(build.file);
		const rule = css
			.split("}")
			.find(
				(block) =>
					block.includes(":visited") &&
					block.includes("--cirth-link-visited-color"),
			);

		expect(rule, "a :visited rule using the visited token").toBeDefined();

		// The states that own the link color while they last, and navigation,
		// have to stay out of it.
		for (const exception of [
			'[aria-current]:not([aria-current="false"])',
			":hover",
			":active",
			":focus",
			"nav a",
		]) {
			expect(rule, `${exception} is excluded`).toContain(exception);
		}

		// The color variants and the dropdown are class-based, so they only
		// exist to exclude where classes ship.
		if (build.classes) {
			expect(rule).toContain(".secondary");
			expect(rule).toContain(".contrast");
			expect(rule).toContain("details.dropdown a");
		} else {
			expect(rule).not.toContain("details.dropdown");
		}
	});

	test(`both color schemes define the visited token in the ${build.name} build`, () => {
		const css = read(build.file);

		// Only the base schemes: the preference passes that follow them
		// (prefers-contrast: more, then @media print) deliberately redefine
		// the token again, and are asserted in their own specs.
		const preferences = css.indexOf("@media (prefers-contrast: more)");

		expect(preferences, "the preference passes follow the schemes").toBeGreaterThan(
			0,
		);

		const declarations =
			css.slice(0, preferences).match(/--cirth-link-visited-color:[^;]+;/g) ?? [];

		// Light, dark, and the explicit [data-theme="dark"] override.
		expect(declarations.length).toBeGreaterThanOrEqual(3);
		expect(new Set(declarations).size).toBe(2);
	});
}

test("the presets carry their own visited color", () => {
	for (const preset of ["dist/presets/cobalt.css", "dist/presets/coral.css"]) {
		const declarations =
			read(preset).match(/--cirth-link-visited-color:[^;]+;/g) ?? [];

		expect(declarations.length, `${preset} light and dark`).toBeGreaterThanOrEqual(2);
	}
});

// --- What actually gets painted, where the engine will show it ---------

/**
 * @param {import("@playwright/test").Page} page
 * @param {string} css
 * @param {string} body
 */
const render = async (page, css, body) => {
	await page.goto(`${origin}${visitedPath}`, { waitUntil: "networkidle" });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });
	await page.setContent(`<style>${css}</style>${body}`);
};

/** @param {import("@playwright/test").Page} page @param {string} id */
const paintOf = (page, id) => page.locator(`#${id}`).screenshot();

/**
 * The visited repaint lands asynchronously, so poll rather than snapshot
 * once.
 *
 * @param {import("@playwright/test").Page} page
 * @param {string} id
 * @param {string} reference
 * @param {boolean} expectedDifferent
 */
const settle = async (page, id, reference, expectedDifferent) => {
	const deadline = Date.now() + paintTimeout;
	let subject = await paintOf(page, id);
	let control = await paintOf(page, reference);

	while (subject.equals(control) === expectedDifferent && Date.now() < deadline) {
		await page.waitForTimeout(100);
		subject = await paintOf(page, id);
		control = await paintOf(page, reference);
	}

	return !subject.equals(control);
};

/** @param {string} id @param {string} target @param {string} [extra] */
const link = (id, target, extra = "") =>
	`<a id="${id}" href="${origin}${target}"${extra}>Sample link</a>`;

/** @param {import("@playwright/test").Page} page */
const exposesVisitedState = async (page) => {
	await render(
		page,
		"a{color:#000;text-decoration:none}a:visited{color:#0f0}",
		// Each on its own line and at the same offset: two links side by side
		// land on different sub-pixel boundaries and their screenshots differ
		// on antialiasing alone.
		`<p>${link("sentinel-visited", visitedPath)}</p>` +
			`<p>${link("sentinel-unvisited", unvisitedPath)}</p>`,
	);

	return settle(page, "sentinel-visited", "sentinel-unvisited", true);
};

test("a visited content link is repainted in the visited color", async ({
	page,
}) => {
	test.skip(
		!(await exposesVisitedState(page)),
		"this engine does not expose visited state to automation",
	);

	await render(
		page,
		read("dist/cirth.css"),
		`
			<p>${link("visited", visitedPath)}</p>
			<p>${link("unvisited", unvisitedPath)}</p>
			<p>${link("control", unvisitedPath, ' style="color: var(--cirth-link-visited-color)"')}</p>
		`,
	);

	expect(await settle(page, "visited", "unvisited", true)).toBe(true);
	expect(await settle(page, "visited", "control", false)).toBe(false);
});

test("navigation and secondary links keep their own color once visited", async ({
	page,
}) => {
	test.skip(
		!(await exposesVisitedState(page)),
		"this engine does not expose visited state to automation",
	);

	await render(
		page,
		read("dist/cirth.css"),
		`
			<nav><ul><li>${link("nav-visited", visitedPath)}</li></ul></nav>
			<nav><ul><li>${link("nav-unvisited", unvisitedPath)}</li></ul></nav>
			<p>${link("secondary-visited", visitedPath, ' class="secondary"')}</p>
			<p>${link("secondary-unvisited", unvisitedPath, ' class="secondary"')}</p>
		`,
	);

	expect(await settle(page, "nav-visited", "nav-unvisited", false)).toBe(false);
	expect(await settle(page, "secondary-visited", "secondary-unvisited", false)).toBe(
		false,
	);
});
