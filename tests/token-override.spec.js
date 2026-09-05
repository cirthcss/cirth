const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");
const { listPresetNames } = require("../scripts/lib/presets");
const { setContent } = require("./helpers/render");

// gh#92 — the documented customization path: a `:root` rule in a
// stylesheet loaded after Cirth changes the token, everywhere.
//
// Two things had to be true, and each was fixed in its own pass. First the
// weight: every colour is declared on the scheme roots, which used to read
// `:root:not([data-theme="dark"])` — (0,2,0) against a plain `:root`'s
// (0,1,0), so the override lost on specificity whatever the loading order.
// The filters moved inside :where(), giving up the weight of the choosing
// while keeping the choosing itself.
//
// Then the reach. Matching weight is not enough while the scheme blocks
// *redeclare* a token on the [data-theme] element: a declaration made on
// an element beats one inherited from an ancestor at any specificity, so
// an override written at :root stopped at the edge of any subtree that
// forced a scheme, and the docs had to tell people to repeat it there.
// The scheme differences now live once at the root as light-dark() pairs
// (theme/_dual.scss), so replacing a pair replaces both schemes and the
// value carries into forced-scheme subtrees.
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

const presets = listPresetNames();

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
	await setContent(page,
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

test("a root override reaches into a subtree that forces a scheme", async ({
	page,
}) => {
	// The reach half of the contract. `data-theme` switches the scheme; it
	// no longer redeclares the palette on itself, so a consumer who sets one
	// token at :root gets it inside the forced-dark subtree too. This used to
	// be the documented exception people worked around by repeating the
	// override on the scheme selectors.
	await page.emulateMedia({ colorScheme: "light" });
	await setContent(page,
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

	expect(color).toBe("rgb(4, 5, 6)");
});

test("a forced scheme still switches the tokens it was not given", async ({
	page,
}) => {
	// The other half: reach must not cost the switch. With no override in
	// play a forced-dark subtree still resolves to the dark value — that is
	// the light-dark() pair being evaluated against the subtree's own
	// color-scheme rather than the root's, which is the whole reason the
	// pairs can live at the root at all.
	await page.emulateMedia({ colorScheme: "light" });
	await setContent(page,
		`<style>${read("dist/cirth.css")}</style>` +
			`<p id="outside">Light.</p>` +
			`<div data-theme="dark"><p id="inside">Dark.</p></div>`,
	);

	const { outside, inside } = await page.evaluate(() => {
		/** @param {string} id */
		const color = (id) => {
			const element = document.getElementById(id);
			if (!element) {
				throw new Error(`missing #${id}`);
			}
			return getComputedStyle(element).color;
		};
		return { outside: color("outside"), inside: color("inside") };
	});

	expect(inside).not.toBe(outside);
});
