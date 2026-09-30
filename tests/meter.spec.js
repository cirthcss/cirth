const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");
const { parseColor, srgbToOklab } = require("../scripts/lib/color");
const { listPresetNames } = require("../scripts/lib/presets");
const { setContent } = require("./helpers/render");

// gh#59 — <meter> is styled as progress's matched pair, and paints one of
// three colors depending on which region low/high/optimum put the value
// in.
//
// Asserted against pixels, not computed style: the three regions live in
// shadow trees each engine exposes differently (::-webkit-meter-*-value in
// Blink and WebKit, :-moz-meter-sub-optimum::-moz-meter-bar in Firefox),
// and getComputedStyle answers for none of them. So each meter is
// screenshotted and compared against a plain <div> painted with the token
// it should be using: an exact buffer match or nothing.
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

// Each fixture is a *full* bar (value at max) that still lands in a
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
	await setContent(page, `<style>${css}${flatten}</style>${markup}`);
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

// The three readings also carry an order of lightness, so that severity
// reads without telling the hues apart: on a light track each step down
// the scale is darker, on a dark track lighter (theme/_light.scss,
// theme/_dark.scss). A palette change that moves a status step can break
// the order while every hue and contrast check stays green, so it is held
// here: for the default theme and each preset stacked on it, in both
// schemes, with and without prefers-contrast: more. Lightness is OKLCh L
// as the engine computes it.
const presets = listPresetNames().map((name) => ({
	css: read(`dist/presets/${name}.css`),
	name,
}));
const themes = [{ css: "", name: "default" }, ...presets];

/** @param {string} value */
const oklchLightness = (value) => {
	const match = /^oklch\(\s*([\d.]+)(%?)/.exec(value.trim());

	if (match) {
		const lightness = Number.parseFloat(match[1]);
		return match[2] === "%" ? lightness / 100 : lightness;
	}

	// A preset that transcribes another system's hex values (material.scss)
	// comes back as rgb(): the same L, read through Oklab.
	if (/^rgba?\(/.test(value.trim())) {
		return srgbToOklab(parseColor(value)).lightness;
	}

	throw new Error(`meter.spec: expected an oklch() or rgb() colour, got ${value}`);
};

/** @param {import("@playwright/test").Page} page */
const reportsContrastPreference = async (page) => {
	await page.emulateMedia({ contrast: "more" });
	// Both colours come from the stylesheet: an inline style would outrank
	// the media block and make every engine look unsupported.
	await setContent(
		page,
		"<style>#s{color:rgb(255,0,0)}" +
			"@media (prefers-contrast: more){#s{color:rgb(0,255,0)}}</style>" +
			'<p id="s">sentinel</p>',
	);

	return page.evaluate(() => {
		const sentinel = document.getElementById("s");
		return sentinel !== null && getComputedStyle(sentinel).color === "rgb(0, 255, 0)";
	});
};

for (const theme of themes) {
	for (const scheme of /** @type {const} */ (["light", "dark"])) {
		for (const more of [false, true]) {
			const label = `${theme.name} ${scheme}${more ? " · more" : ""}`;

			test(`${label}: the readings order severity by lightness`, async ({
				page,
			}) => {
				if (more) {
					test.skip(
						!(await reportsContrastPreference(page)),
						"engine does not emulate prefers-contrast",
					);
				}

				await page.emulateMedia({
					colorScheme: scheme,
					contrast: more ? "more" : "no-preference",
				});
				await setContent(
					page,
					`<style>${css}</style><style>${theme.css}</style><p id="probe">probe</p>`,
				);

				const [optimum, suboptimum, evenLessGood] = (
					await page.evaluate(
						(tokens) => {
							const probe = document.getElementById("probe");
							if (!probe) throw new Error("missing #probe");
							return tokens.map((token) => {
								probe.style.color = `var(${token})`;
								return getComputedStyle(probe).color;
							});
						},
						regions.map((region) => region.token),
					)
				).map(oklchLightness);

				if (scheme === "light") {
					expect(optimum, `${label}: optimum above suboptimum`).toBeGreaterThan(
						suboptimum,
					);
					expect(
						suboptimum,
						`${label}: suboptimum above even-less-good`,
					).toBeGreaterThan(evenLessGood);
				} else {
					expect(optimum, `${label}: optimum below suboptimum`).toBeLessThan(
						suboptimum,
					);
					expect(
						suboptimum,
						`${label}: suboptimum below even-less-good`,
					).toBeLessThan(evenLessGood);
				}
			});
		}
	}
}
