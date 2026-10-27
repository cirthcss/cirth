const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");
const { setContent } = require("./helpers/render");

// data-theme on a shadow host (specs/shadow-host-theme.md).
//
// A web component that loads Cirth into its shadow root is themed with an
// attribute on its own element, the host. Every build is mounted in a shadow
// root under a themed, an unthemed and a light-forced host, under both
// system schemes, and has to render exactly what the same markup renders in
// the light DOM themed the same way: the colour scheme, the accent's text
// role, a card and a button. Before the fix a dark host left the default and
// classless builds without their derived tokens (transparent cards), and the
// scoped builds ignored the host altogether.

const projectRoot = path.join(__dirname, "..");

/** @param {string} file */
const read = (file) => {
	const stylesheet = path.join(projectRoot, file);
	if (!fs.existsSync(stylesheet)) {
		throw new Error(`shadow-host-theme.spec: ${file} not found: run \`npm run build\` first.`);
	}
	return fs.readFileSync(stylesheet, "utf8");
};

const builds = [
	{ name: "default", css: read("dist/cirth.css"), scoped: false },
	{ name: "classless", css: read("dist/cirth.classless.css"), scoped: false },
	{ name: "scoped", css: read("dist/cirth.scoped.css"), scoped: true },
	{ name: "classless scoped", css: read("dist/cirth.classless.scoped.css"), scoped: true },
];

const card = `<article id="card">Card <button id="button">Save</button></article>`;

/**
 * The content a build styles: inside the scoped wrapper for a scoped build.
 *
 * @param {boolean} scoped
 * @param {string | null} theme the attribute on the content's own root
 */
const content = (scoped, theme) => {
	const attribute = theme ? ` data-theme="${theme}"` : "";
	return scoped ? `<div class="cirth"${attribute}>${card}</div>` : `<main${attribute}>${card}</main>`;
};

/**
 * What the card shows, read inside `root` (the document or a shadow root).
 *
 * @param {import("@playwright/test").Page} page
 * @param {boolean} inShadow
 */
const appearance = (page, inShadow) =>
	page.evaluate((shadow) => {
		const root = shadow
			? /** @type {ShadowRoot} */ (/** @type {HTMLElement} */ (document.getElementById("host")).shadowRoot)
			: document;
		const cardElement = /** @type {HTMLElement} */ (root.getElementById("card"));
		const button = /** @type {HTMLElement} */ (root.getElementById("button"));
		const probe = document.createElement("span");
		probe.style.color = "var(--cirth-primary-text)";
		cardElement.append(probe);
		const style = getComputedStyle(cardElement);
		const result = {
			colorScheme: style.colorScheme,
			accentText: getComputedStyle(probe).color,
			card: style.backgroundColor,
			button: getComputedStyle(button).backgroundColor,
		};
		probe.remove();
		return result;
	}, inShadow);

/**
 * @param {import("@playwright/test").Page} page
 * @param {string} css
 * @param {string | null} hostTheme
 * @param {string} inner
 */
const mount = async (page, css, hostTheme, inner) => {
	await setContent(page, `<div id="host"${hostTheme ? ` data-theme="${hostTheme}"` : ""}></div>`);
	await page.evaluate(
		([stylesheet, markup]) => {
			const host = /** @type {HTMLElement} */ (document.getElementById("host"));
			host.attachShadow({ mode: "open" }).innerHTML = `<style>${stylesheet}</style>${markup}`;
		},
		[css, inner],
	);
};

for (const build of builds) {
	for (const system of /** @type {const} */ (["light", "dark"])) {
		for (const hostTheme of [null, "light", "dark"]) {
			test(`${build.name}, ${system} system: a ${hostTheme ?? "unthemed"} shadow host themes its tree`, async ({
				page,
			}) => {
				await page.emulateMedia({ colorScheme: system });

				// The reference: the same markup in the light DOM, themed on
				// the element a page would theme.
				await setContent(page, `<style>${build.css}</style>${content(build.scoped, hostTheme)}`);
				const expected = await appearance(page, false);
				expect(expected.colorScheme).toBe(hostTheme ?? system);

				await mount(page, build.css, hostTheme, content(build.scoped, null));
				expect(await appearance(page, true)).toEqual(expected);
			});
		}
	}

	test(`${build.name}: a theme inside the shadow tree wins over the host's`, async ({ page }) => {
		await page.emulateMedia({ colorScheme: "light" });
		await setContent(page, `<style>${build.css}</style>${content(build.scoped, "light")}`);
		const light = await appearance(page, false);

		await mount(page, build.css, "dark", content(build.scoped, "light"));
		expect(await appearance(page, true)).toEqual(light);
	});
}

test("a preset follows a themed shadow host", async ({ page }) => {
	const css = read("dist/cirth.css") + read("dist/presets/material.css");
	await page.emulateMedia({ colorScheme: "light" });
	await setContent(page, `<style>${css}</style>${content(false, "dark")}`);
	const expected = await appearance(page, false);
	expect(expected.colorScheme).toBe("dark");

	await mount(page, css, "dark", content(false, null));
	expect(await appearance(page, true)).toEqual(expected);
});
