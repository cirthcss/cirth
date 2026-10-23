const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");
const { oklabDistance, parseColor, simulateCvd } = require("../scripts/lib/color");
const { setContent } = require("./helpers/render");

// The five colour signals of the default theme, kept apart from one another
// when colour vision is reduced: the accent, the three states and a
// visited link. tests/framework-specimen.spec.js holds the primary fill
// apart from the danger fill; nothing held the rest, and before
// specs/default-palette.md the error and warning texts sat 0.009 apart
// under deuteranopia, less than half a just-noticeable difference.
//
// Each pair is compared as marks (the accent's fill, and each state's
// input, which is its border and its meter reading) and as text roles, and
// counts at the smaller of the two; a visited link is only ever text. Every
// comparison runs in normal vision and under Machado et al.'s protanopia,
// deuteranopia and tritanopia at full severity, on colours rounded to the
// 8-bit sRGB a screen paints, and the distance is Oklab.
//
// The floors are a tripwire, not a perceptual guarantee: two JND (0.04) in
// the base schemes and one (0.02) under prefers-contrast: more, where the
// text roles move toward the ink and closer together. The default palette
// measures 0.048 and 0.028.

const projectRoot = path.join(__dirname, "..");
const stylesheet = path.join(projectRoot, "dist/cirth.css");

if (!fs.existsSync(stylesheet)) {
	throw new Error(
		"signal-separation.spec: dist/cirth.css not found: run `npm run build` first.",
	);
}

const css = fs.readFileSync(stylesheet, "utf8");

/** @type {Record<string, { mark?: string, text: string }>} */
const signals = {
	accent: { mark: "--cirth-primary-surface", text: "--cirth-primary-text" },
	error: { mark: "--cirth-error", text: "--cirth-error-text" },
	success: { mark: "--cirth-success", text: "--cirth-success-text" },
	warning: { mark: "--cirth-warning", text: "--cirth-warning-text" },
	visited: { text: "--cirth-link-visited-color" },
};

const visions = /** @type {const} */ ([
	"normal",
	"protanopia",
	"deuteranopia",
	"tritanopia",
]);

/** @param {ReturnType<typeof parseColor>} color */
const painted = (color) => ({
	...color,
	b: Math.round(color.b * 255) / 255,
	g: Math.round(color.g * 255) / 255,
	r: Math.round(color.r * 255) / 255,
});

/**
 * @param {ReturnType<typeof parseColor>} color
 * @param {(typeof visions)[number]} vision
 */
const seen = (color, vision) =>
	vision === "normal" ? color : simulateCvd(color, vision);

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

for (const scheme of /** @type {const} */ (["light", "dark"])) {
	for (const more of [false, true]) {
		const label = `${scheme}${more ? " · more" : ""}`;
		const floor = more ? 0.02 : 0.04;

		test(`${label}: the five signals stay apart under colour vision deficiency`, async ({
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
			await setContent(page, `<style>${css}</style><p id="probe">probe</p>`);

			const tokens = Object.values(signals).flatMap(({ mark, text }) =>
				mark ? [mark, text] : [text],
			);
			const resolved = await page.evaluate((names) => {
				const probe = document.getElementById("probe");
				if (!probe) throw new Error("missing #probe");
				return Object.fromEntries(
					names.map((name) => {
						probe.style.color = `var(${name})`;
						return [name, getComputedStyle(probe).color];
					}),
				);
			}, tokens);
			/** @param {string} token */
			const color = (token) => painted(parseColor(resolved[token]));

			const names = Object.keys(signals);
			let worst = { distance: Infinity, detail: "" };
			for (const [index, first] of names.entries()) {
				for (const second of names.slice(index + 1)) {
					const a = signals[first];
					const b = signals[second];
					const comparisons = [["text", a.text, b.text]];
					if (a.mark && b.mark) comparisons.push(["mark", a.mark, b.mark]);

					for (const [kind, one, other] of comparisons) {
						for (const vision of visions) {
							const distance = oklabDistance(
								seen(color(one), vision),
								seen(color(other), vision),
							);
							if (distance < worst.distance) {
								worst = {
									distance,
									detail: `${first}/${second} ${kind} under ${vision}`,
								};
							}
						}
					}
				}
			}

			expect(
				worst.distance,
				`${label}: closest pair is ${worst.detail} at ${worst.distance.toFixed(3)}`,
			).toBeGreaterThanOrEqual(floor);
		});
	}
}
