const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");

// gh#92 — the documented customization path: a `:root` rule in a
// stylesheet loaded after Cirth changes the token.
//
// It used to be true only for the foundation and style tokens. Every
// *color* is declared on the scheme roots, which were written as
// `:root:not([data-theme="dark"])` — (0,2,0) against a plain `:root`'s
// (0,1,0), so the override lost on specificity and no amount of loading
// order could save it. The filters now sit inside :where(), which is what
// this asserts: the shape of the selector is an implementation detail, the
// override winning is the contract.
//
// Checked for both schemes, in every build, with each preset stacked on
// top, because each of those is a separate stylesheet declaring the same
// tokens on the same roots.

const projectRoot = path.join(__dirname, "..");

/** @param {string} file */
const read = (file) => {
	const stylesheet = path.join(projectRoot, file);

	if (!fs.existsSync(stylesheet)) {
		throw new Error(
			`token-override.spec: ${file} not found: run \`npm run build\` first.`,
		);
	}

	return fs.readFileSync(stylesheet, "utf8");
};

const builds = [
	{ file: "dist/cirth.css", name: "default", root: ":root", wrapper: "" },
	{
		file: "dist/cirth.classless.css",
		name: "classless",
		root: ":root",
		wrapper: "",
	},
	{
		file: "dist/cirth.scoped.css",
		name: "scoped",
		root: ".cirth",
		wrapper: "cirth",
	},
];

const presets = ["cobalt", "coral"];

// One from each scheme layer, so a regression in any of them shows up:
// text, an accent, a surface, and a border.
const overrides = {
	"--cirth-card-background-color": "rgb(7, 8, 9)",
	"--cirth-color": "rgb(4, 5, 6)",
	"--cirth-muted-border-color": "rgb(10, 11, 12)",
	"--cirth-primary": "rgb(1, 2, 3)",
};

const markup = `
	<p id="text">Body copy.</p>
	<p><a id="link" href="#anchor">A link</a></p>
	<article id="card">On a card.</article>
	<hr id="rule">
`;

/**
 * @param {import("@playwright/test").Page} page
 * @returns {Promise<Record<string, string>>}
 */
const painted = (page) =>
	page.evaluate(() => {
		/** @param {string} id */
		const style = (id) => {
			const element = document.getElementById(id);
			if (!element) {
				throw new Error(`missing #${id}`);
			}
			return getComputedStyle(element);
		};

		return {
			"--cirth-card-background-color": style("card").backgroundColor,
			"--cirth-color": style("text").color,
			"--cirth-muted-border-color": style("rule").borderTopColor,
			"--cirth-primary": style("link").color,
		};
	});

/**
 * @param {import("@playwright/test").Page} page
 * @param {{ build: (typeof builds)[number], override: string, preset?: string,
 *   scheme: "light" | "dark" }} options
 */
const render = async (page, { build, override, preset, scheme }) => {
	await page.emulateMedia({ colorScheme: scheme });
	await page.setContent(
		`<style>${read(build.file)}</style>` +
			(preset ? `<style>${read(`dist/presets/${preset}.css`)}</style>` : "") +
			`<style>${override}</style>` +
			(build.wrapper
				? `<div class="${build.wrapper}">${markup}</div>`
				: markup),
	);
};

/** @param {string} selector */
const block = (selector) =>
	`${selector} {${Object.entries(overrides)
		.map(([property, value]) => `${property}: ${value};`)
		.join("")}}`;

for (const build of builds) {
	for (const scheme of /** @type {const} */ (["light", "dark"])) {
		test(`${build.name} build, ${scheme} scheme: a plain root override wins`, async ({
			page,
		}) => {
			await render(page, { build, override: block(build.root), scheme });

			expect(await painted(page)).toEqual(overrides);
		});
	}

	// The shape consumers had to write while gh#92 was open is more
	// specific than the scheme roots ever were, so it keeps working.
	test(`${build.name} build: a scheme-scoped override still wins`, async ({
		page,
	}) => {
		await render(page, {
			build,
			override: block(`${build.root}:not([data-theme="dark"])`),
			scheme: "light",
		});

		expect(await painted(page)).toEqual(overrides);
	});
}

for (const preset of presets) {
	for (const scheme of /** @type {const} */ (["light", "dark"])) {
		test(`with the ${preset} preset, ${scheme} scheme: a plain root override still wins`, async ({
			page,
		}) => {
			await render(page, {
				build: builds[0],
				override: block(":root"),
				preset,
				scheme,
			});

			expect(await painted(page)).toEqual(overrides);
		});
	}
}

test("an explicitly re-themed subtree keeps its own scheme", async ({
	page,
}) => {
	// The counterpart of the rule above: `[data-theme]` declares the whole
	// palette on that element, so a root override does not reach into it.
	// That is the point of the attribute, not a leak in the fix.
	await page.emulateMedia({ colorScheme: "light" });
	await page.setContent(
		`<style>${read("dist/cirth.css")}</style>` +
			`<style>:root { --cirth-color: rgb(4, 5, 6); }</style>` +
			`<div data-theme="dark"><p id="text">Body copy.</p></div>`,
	);

	const color = await page.evaluate(() => {
		const element = document.getElementById("text");
		if (!element) {
			throw new Error("missing #text");
		}
		return getComputedStyle(element).color;
	});

	expect(color).not.toBe("rgb(4, 5, 6)");
});
