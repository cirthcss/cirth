const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");

// gh#59 — <meter> is styled as progress's matched pair, and paints one of
// three colors depending on which region low/high/optimum put the value
// in.
//
// Asserted against pixels, not computed style: the three regions live in
// shadow trees each engine exposes differently (::-webkit-meter-*-value in
// Blink and WebKit, :-moz-meter-sub-optimum::-moz-meter-bar in Firefox),
// and getComputedStyle answers for none of them. So each meter is
// screenshotted and compared against a plain <div> painted with the token
// it should be using — an exact buffer match or nothing.
//
// The same method catches the geometry regression that made this element
// worth a test of its own: Blink lays the value out at half the track's
// height and centers it, ignoring an author `height`, so an 8px meter used
// to fill 4px. A full-width meter must therefore be pixel-identical to a
// swatch of its own value color.

const projectRoot = path.join(__dirname, "..");

/** @param {string} file */
const read = (file) => {
	const stylesheet = path.join(projectRoot, file);

	if (!fs.existsSync(stylesheet)) {
		throw new Error(
			`meter.spec: ${file} not found: run \`npm run build\` first.`,
		);
	}

	return fs.readFileSync(stylesheet, "utf8");
};

const css = read("dist/cirth.css");

// Each fixture is a *full* bar — value at max — that still lands in a
// different region, which is what makes a whole-element pixel comparison
// possible. The spec's classification does the work: with `optimum` above
// `high`, a value at max is optimum; with `optimum` below `low`, a value
// at max is suboptimal when `high` is max too, and worse than that when
// `high` leaves room above it.
const regions = [
	{
		attributes: 'low="3" high="7" optimum="10"',
		id: "optimum",
		token: "--cirth-meter-optimum-color",
	},
	{
		attributes: 'low="3" high="10" optimum="0"',
		id: "suboptimum",
		token: "--cirth-meter-suboptimum-color",
	},
	{
		attributes: 'low="3" high="7" optimum="0"',
		id: "even-less-good",
		token: "--cirth-meter-even-less-good-color",
	},
];

// Full value, no border, no radius: every pixel of the element is the
// value color, so the comparison is not about anti-aliased edges.
const flatten = `
	meter, .swatch {
		display: block;
		width: 120px;
		height: 24px;
		margin: 0;
		border: 0;
		border-radius: 0;
	}
`;

const markup = regions
	.map(
		({ attributes, id, token }) =>
			`<meter id="${id}" value="10" min="0" max="10" ${attributes}></meter>` +
			`<div class="swatch" id="${id}-swatch" style="background: var(${token})"></div>`,
	)
	.join("");

/**
 * @param {import("@playwright/test").Page} page
 * @param {"light" | "dark"} scheme
 */
const render = async (page, scheme) => {
	await page.emulateMedia({ colorScheme: scheme });
	await page.setContent(`<style>${css}${flatten}</style>${markup}`);
};

for (const scheme of /** @type {const} */ (["light", "dark"])) {
	for (const region of regions) {
		test(`${scheme} scheme: the ${region.id} region paints ${region.token}`, async ({
			page,
		}) => {
			await render(page, scheme);

			const bar = await page.locator(`#${region.id}`).screenshot();
			const swatch = await page.locator(`#${region.id}-swatch`).screenshot();

			expect(bar.equals(swatch)).toBe(true);
		});
	}

	test(`${scheme} scheme: the regions are three different colors`, async ({
		page,
	}) => {
		await render(page, scheme);

		const painted = await Promise.all(
			regions.map((region) => page.locator(`#${region.id}`).screenshot()),
		);

		expect(painted[0].equals(painted[1])).toBe(false);
		expect(painted[1].equals(painted[2])).toBe(false);
		expect(painted[0].equals(painted[2])).toBe(false);
	});
}

test("the frame is borrowed from progress", () => {
	const source = read("dist/cirth.css");

	for (const [token, source_] of [
		["--cirth-meter-background-color", "--cirth-progress-background-color"],
		["--cirth-meter-border-color", "--cirth-progress-border-color"],
	]) {
		expect(source, `${token} defaults to ${source_}`).toContain(
			`${token}: var(${source_})`,
		);
	}
});

test("both engines' spellings of the three regions ship", () => {
	const source = read("dist/cirth.css");

	for (const selector of [
		"::-webkit-meter-optimum-value",
		"::-webkit-meter-suboptimum-value",
		"::-webkit-meter-even-less-good-value",
		"::-moz-meter-bar",
		":-moz-meter-sub-optimum",
		":-moz-meter-sub-sub-optimum",
	]) {
		expect(source, `${selector} is styled`).toContain(selector);
	}
});
