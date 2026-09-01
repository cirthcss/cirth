const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");

const projectRoot = path.join(__dirname, "..");

/** @param {string} file */
const read = (file) =>
	fs.readFileSync(path.join(projectRoot, file), "utf8");

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
	{
		file: "dist/cirth.classless.scoped.css",
		name: "classless scoped",
		root: ".cirth",
		wrapper: "cirth",
	},
];

const surfaceRoles = /** @type {const} */ ([
	"band",
	"canvas",
	"card",
	"code",
	"field",
	"popover",
]);

const content = (suffix = "") => `
	<div id="canvas${suffix}" style="background-color: var(--cirth-canvas)"></div>
	<article id="card${suffix}">
		<header id="band${suffix}">Surface band</header>
		<label>Field <input id="field${suffix}" value="Surface field"></label>
	</article>
	<pre id="code${suffix}"><code>const surface = true;</code></pre>
	<details class="dropdown">
		<summary>Dropdown</summary>
		<ul id="dropdown${suffix}"><li>Item</li></ul>
	</details>
	<div popover="auto" id="popover${suffix}" style="background-color: var(--cirth-popover-background-color)">Popover</div>
`;

/**
 * @param {import("@playwright/test").Page} page
 * @param {string} suffix
 */
const surfaces = (page, suffix = "") =>
	page.evaluate((currentSuffix) => {
		/** @param {string} id */
		const background = (id) => {
			const element = document.getElementById(`${id}${currentSuffix}`);
			if (!element) throw new Error(`missing #${id}${currentSuffix}`);
			return getComputedStyle(element).backgroundColor;
		};

		return {
			band: background("band"),
			canvas: background("canvas"),
			card: background("card"),
			code: background("code"),
			dropdown: background("dropdown"),
			field: background("field"),
			popover: background("popover"),
		};
	}, suffix);

/**
 * @param {import("@playwright/test").Page} page
 * @param {(typeof builds)[number]} build
 * @param {string} [override]
 */
const render = async (page, build, override = "") => {
	const markup = build.wrapper
		? `<div class="${build.wrapper}">${content()}<section data-theme="dark">${content("-forced")}</section></div>`
		: `${content()}<section data-theme="dark">${content("-forced")}</section>`;
	await page.setContent(
		`<style>${read(build.file)}</style><style>${override}</style>${markup}`,
	);
};

for (const build of builds) {
	test(`${build.name}: one surface input propagates in light, dark, and a forced subtree`, async ({
		page,
	}) => {
		await page.emulateMedia({ colorScheme: "light" });
		await render(page, build);
		const lightBefore = await surfaces(page);
		const forcedBefore = await surfaces(page, "-forced");

		const input =
			"light-dark(oklch(94% 0.025 145deg), oklch(26% 0.03 145deg))";
		await render(page, build, `${build.root} { --cirth-canvas: ${input}; }`);
		const lightAfter = await surfaces(page);
		const forcedAfter = await surfaces(page, "-forced");

		for (const role of surfaceRoles) {
			expect(lightAfter[role], `${role} changes in light`).not.toBe(
				lightBefore[role],
			);
			expect(forcedAfter[role], `${role} changes in forced dark`).not.toBe(
				forcedBefore[role],
			);
			expect(forcedAfter[role], `${role} resolves its dark relation`).not.toBe(
				lightAfter[role],
			);
		}

		for (const sample of [lightAfter, forcedAfter]) {
			const ladder = [
				sample.code,
				sample.field,
				sample.canvas,
				sample.band,
				sample.card,
			];
			expect(
				new Set(ladder).size,
				`the surface ladder has five perceptible roles: ${ladder.join(" | ")}`,
			).toBe(ladder.length);
		}

		for (const suffix of ["", "-forced"]) {
			const rest = (suffix ? forcedAfter : lightAfter).field;
			await page.locator(`#field${suffix}`).focus();
			const focused = await page
				.locator(`#field${suffix}`)
				.evaluate((element) => getComputedStyle(element).backgroundColor);
			expect(focused, `a focused field${suffix} rises from rest`).not.toBe(rest);
			expect(focused, `a focused field${suffix} rises to canvas`).toBe(
				(suffix ? forcedAfter : lightAfter).canvas,
			);
		}

		// Classless builds intentionally omit the dropdown component.
		if (!build.file.includes("classless")) {
			expect(lightAfter.dropdown).not.toBe(lightBefore.dropdown);
			expect(lightAfter.dropdown).toBe(lightAfter.card);
			expect(forcedAfter.dropdown).toBe(forcedAfter.card);
		}
		expect(lightAfter.popover).toBe(lightAfter.card);
		expect(forcedAfter.popover).toBe(forcedAfter.card);

		await page.emulateMedia({ colorScheme: "dark" });
		await render(page, build, `${build.root} { --cirth-canvas: ${input}; }`);
		const darkAfter = await surfaces(page);
		for (const role of surfaceRoles) {
			expect(darkAfter[role], `${role} switches with the root scheme`).toBe(
				forcedAfter[role],
			);
		}
	});
}

test("a direct derived-token override intentionally breaks the surface relation", async ({
	page,
}) => {
	await page.emulateMedia({ colorScheme: "light" });
	const values = {
		"--cirth-card-background-color": "rgb(7 8 9)",
		"--cirth-card-sectioning-background-color": "rgb(10 11 12)",
		"--cirth-code-background-color": "rgb(13 14 15)",
		"--cirth-form-element-background-color": "rgb(16 17 18)",
		"--cirth-popover-background-color": "rgb(19 20 21)",
	};
	const override = `:root { ${Object.entries(values)
		.map(([token, value]) => `${token}: ${value};`)
		.join(" ")} }`;
	await render(page, builds[0], override);

	expect(await surfaces(page)).toMatchObject({
		band: "rgb(10, 11, 12)",
		card: "rgb(7, 8, 9)",
		code: "rgb(13, 14, 15)",
		field: "rgb(16, 17, 18)",
		popover: "rgb(19, 20, 21)",
	});
});

test("Plain keeps its five-declaration root contract and no surface scale", () => {
	const source = read("src/presets/plain.scss");
	const rootBlock = source.match(/@include selectors\.root \{([\s\S]*?)\n\}/);
	if (!rootBlock) throw new Error("Plain root block is missing");
	const declarations = rootBlock[1].match(/^\s*--cirth-[\w-]+:/gm) ?? [];
	expect(declarations).toHaveLength(5);
	expect(rootBlock[1]).not.toMatch(
		/--cirth-(?:card|code|dropdown|form-element|popover)-.*background-color/,
	);
});

test("the public token reference is exact", () => {
	const publicBuilds = [
		"dist/cirth.css",
		"dist/cirth.classless.css",
		"dist/cirth.scoped.css",
		"dist/cirth.classless.scoped.css",
		"dist/cirth.print.css",
		"dist/cirth.print.classless.css",
		"dist/cirth.print.scoped.css",
		"dist/cirth.print.classless.scoped.css",
	];
	const publicTokens = [
		...new Set(
			publicBuilds.flatMap(
				(file) => read(file).match(/--cirth-[a-z0-9-]+/g) ?? [],
			),
		),
	].sort();
	const reference = read("docs/src/pages/customization.md").split(
		"## Token reference",
	)[1];
	if (!reference) throw new Error("token reference is missing");
	const documentedTokens = [
		...new Set(reference.match(/--cirth-[a-z0-9-]+/g) ?? []),
	].sort();

	expect(documentedTokens).toEqual(publicTokens);
});
