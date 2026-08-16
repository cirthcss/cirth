const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");

// gh#75 — a long unbroken label (a URL, a token, a hash) used to grow a
// button to its intrinsic width and carry it outside its container. The
// control now caps at the width it was given and the label wraps inside
// it. Checked for every button-like element, for the busy state (which
// suppresses wrapping elsewhere), and inside a group.

const projectRoot = path.join(__dirname, "..");
const containerWidth = 280;
const longLabel = "Supercalifragilisticexpialidocious1234567890ABCDEFGHIJKLM";

const builds = [
	{ file: "dist/cirth.css", name: "default", scope: "" },
	{ file: "dist/cirth.classless.css", name: "classless", scope: "" },
	{ file: "dist/cirth.scoped.css", name: "scoped", scope: "cirth" },
];

// The group is class-driven in the classes builds and role-driven in the
// classless ones, so each variant gets the trigger its build understands.
/** @param {string} name */
const groupAttributes = (name) =>
	name === "classless" ? 'role="group"' : 'class="group" role="group"';

/** @param {string} name */
const markup = (name) => `
	<div id="container" style="width: ${containerWidth}px">
		<button id="button" type="button">${longLabel}</button>
		<a id="role-button" href="#" role="button">${longLabel}</a>
		<input id="input-submit" type="submit" value="${longLabel}">
		<input id="input-reset" type="reset" value="${longLabel}">
		<input id="input-button" type="button" value="${longLabel}">
		<button id="busy-button" type="button" aria-busy="true">${longLabel}</button>
		<div id="group" ${groupAttributes(name)}>
			<button id="group-button" type="button">${longLabel}</button>
		</div>
		<div id="group-with-input" ${groupAttributes(name)}>
			<input type="text" aria-label="Value">
			<button id="group-input-button" type="submit">${longLabel}</button>
		</div>
	</div>
`;

const constrained = [
	"button",
	"role-button",
	"input-submit",
	"input-reset",
	"input-button",
	"busy-button",
	"group",
	"group-button",
	"group-with-input",
	"group-input-button",
];

/**
 * @param {import("@playwright/test").Page} page
 * @param {{ file: string, name: string, scope: string }} build
 */
const render = async (page, build) => {
	const stylesheet = path.join(projectRoot, build.file);

	if (!fs.existsSync(stylesheet)) {
		throw new Error(
			`button-overflow.spec: ${build.file} not found: run \`npm run build\` first.`,
		);
	}

	const content = markup(build.name);

	await page.setContent(
		build.scope ? `<div class="${build.scope}">${content}</div>` : content,
	);
	await page.addStyleTag({ path: stylesheet });
};

for (const build of builds) {
	test(`button-like controls stay inside their container (${build.name} build)`, async ({
		page,
	}) => {
		await render(page, build);

		for (const id of constrained) {
			const box = await page.locator(`#${id}`).boundingBox();
			expect(box, `#${id} has a box`).not.toBeNull();
			// Sub-pixel layout rounding only, not a wrapped-vs-overflowing
			// difference: the unconstrained control measured ~800px here.
			expect(box?.width ?? 0, `#${id} width`).toBeLessThanOrEqual(
				containerWidth + 1,
			);
		}
	});

	test(`a long label wraps instead of scrolling the page (${build.name} build)`, async ({
		page,
	}) => {
		await render(page, build);

		const overflow = await page.evaluate(
			() =>
				document.documentElement.scrollWidth -
				document.documentElement.clientWidth,
		);
		expect(overflow).toBeLessThanOrEqual(0);

		// Wrapping, not clipping: the button is taller than a single line.
		const lines = await page.locator("#button").evaluate((element) => {
			const style = getComputedStyle(element);
			return element.clientHeight / Number.parseFloat(style.lineHeight);
		});
		expect(lines).toBeGreaterThan(1);
	});

	test(`a busy button keeps its spinner and still wraps (${build.name} build)`, async ({
		page,
	}) => {
		await render(page, build);

		const busy = page.locator("#busy-button");

		expect(
			await busy.evaluate(
				(element) => getComputedStyle(element).whiteSpace !== "nowrap",
			),
		).toBe(true);
		expect(
			await busy.evaluate(
				(element) =>
					getComputedStyle(element, "::before").maskImage !== "none" ||
					getComputedStyle(element, "::before").webkitMaskImage !== "none",
			),
		).toBe(true);
	});
}
