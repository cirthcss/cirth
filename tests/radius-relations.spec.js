const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");
const { listPresetNames } = require("../scripts/lib/presets");
const { setContent } = require("./helpers/render");

// specs/radius-relations.md: two radii from one knob, assigned by kind.
// Something operated takes the control radius, something that holds
// content takes the container radius, a checkbox or a key cap stays a
// small mark, and no box Cirth draws is rounder than the containers
// around it. Measured on the built CSS, under every shipped preset, because
// the relation is the promise and the values are each theme's own.

const projectRoot = path.join(__dirname, "..");

const builds = [
	{ file: "dist/cirth.css", name: "default", scope: "", group: 'class="group" role="group"' },
	{ file: "dist/cirth.classless.css", name: "classless", scope: "", group: 'role="group"' },
	{ file: "dist/cirth.scoped.css", name: "scoped", scope: "cirth", group: 'class="group" role="group"' },
];

const themes = ["default", ...listPresetNames()];

/** @param {string} group */
const markup = (group) => `
	<article id="card">
		<header><h3>Card</h3></header>
		<input id="text" type="text" aria-label="Text">
		<input id="search" type="search" aria-label="Search">
		<select id="select" aria-label="Select"><option>One</option></select>
		<button id="button" type="button">Button</button>
		<form id="search-group" role="search">
			<input id="grouped-search" type="search" aria-label="Query">
			<button type="submit">Go</button>
		</form>
		<div id="group" ${group}>
			<input id="grouped-text" type="text" aria-label="Value">
			<button type="button">Save</button>
		</div>
		<pre id="pre"><code>code</code></pre>
		<progress id="progress" value="40" max="100"></progress>
		<p><kbd id="kbd">K</kbd></p>
		<label><input id="checkbox" type="checkbox"> Check</label>
		<label><input id="radio" type="radio" name="r"> Radio</label>
	</article>
	<dialog id="dialog" open><article id="dialog-article"><p>Dialog</p></article></dialog>
	<div id="popover" popover>Popover</div>
`;

/** @param {import("@playwright/test").Page} page */
const measure = (page) =>
	page.evaluate(() => {
		// The popover is opened last: showing a dialog hides open popovers.
		/** @type {HTMLElement} */ (document.getElementById("popover")).showPopover();
		/** @param {string} id */
		const corners = (id) => {
			const style = getComputedStyle(/** @type {Element} */ (document.getElementById(id)));
			return [
				style.borderStartStartRadius,
				style.borderStartEndRadius,
				style.borderEndStartRadius,
				style.borderEndEndRadius,
			].map((value) => Number.parseFloat(value));
		};
		/** @param {string} id */
		const radius = (id) => Math.max(...corners(id));
		const ids = [
			"card", "text", "search", "select", "button", "search-group",
			"group", "pre", "progress", "kbd", "checkbox",
			"dialog-article", "popover",
		];
		return {
			radii: Object.fromEntries(ids.map((id) => [id, radius(id)])),
			groupedSearch: corners("grouped-search"),
			groupedText: corners("grouped-text"),
			radio: getComputedStyle(
				/** @type {Element} */ (document.getElementById("radio")),
			).borderRadius,
			searchIcon: getComputedStyle(
				/** @type {Element} */ (document.getElementById("search")),
			).backgroundImage,
			small: Number.parseFloat(
				getComputedStyle(
					/** @type {Element} */ (document.getElementById("card")),
				).getPropertyValue("--cirth-radius-sm"),
			) * 16,
		};
	});

for (const build of builds) {
	for (const theme of themes) {
		for (const colorScheme of /** @type {const} */ (["light", "dark"])) {
			test(`every box takes its kind's radius and none is rounder than a container (${build.name} build, ${theme}, ${colorScheme})`, async ({
				page,
			}) => {
				const stylesheet = path.join(projectRoot, build.file);
				if (!fs.existsSync(stylesheet)) {
					throw new Error(`radius-relations.spec: ${build.file} not found: run \`npm run build\` first.`);
				}
				await page.emulateMedia({ colorScheme });
				const content = markup(build.group);
				await setContent(page, build.scope ? `<div class="${build.scope}">${content}</div>` : content);
				await page.addStyleTag({ path: stylesheet });
				if (theme !== "default") {
					await page.addStyleTag({ path: path.join(projectRoot, `dist/presets/${theme}.css`) });
				}

				const { radii, groupedSearch, groupedText, radio, searchIcon, small } = await measure(page);
				const control = radii.text;
				const container = radii.card;

				// The pair: the container is one and a half controls. A square
				// preset (metro) zeroes the knob, and the pair is zero and zero:
				// theme/_styles.scss derives every radius so that zeroing the
				// knob zeroes them all, cards included.
				expect(control).toBeGreaterThanOrEqual(0);
				expect(container).toBeCloseTo(control * 1.5, 1);

				// Operated: the control radius, search included.
				for (const id of ["search", "select", "button", "search-group", "group", "pre", "progress"]) {
					expect(radii[id], `${id} takes the control radius`).toBe(control);
				}
				expect(groupedSearch).toEqual(groupedText);

				// Holding content: the container radius, floating or not.
				for (const id of ["dialog-article", "popover"]) {
					expect(radii[id], `${id} takes the container radius`).toBe(container);
				}

				// Small marks stay small.
				for (const id of ["checkbox", "kbd"]) {
					expect(radii[id], `${id} stays a small mark`).toBe(Math.min(control, small));
				}

				// No box is rounder than a container. The radio is a shape,
				// not a box, and keeps its circle.
				for (const [id, value] of Object.entries(radii)) {
					expect(value, `${id} is not rounder than a container`).toBeLessThanOrEqual(container);
				}
				expect(radio).toBe("50%");

				// What says "search" is the icon, not the corners.
				expect(searchIcon).toMatch(/^url\(/);
			});
		}
	}
}
