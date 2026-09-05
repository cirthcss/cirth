const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");
const { contrastRatio, parseColor } = require("../scripts/lib/color");
const { listPresetNames } = require("../scripts/lib/presets");
const { setContent } = require("./helpers/render");

// gh#34 — prefers-contrast: more (src/theme/_contrast.scss).
//
// The claim being checked is a numeric one, in both schemes: text reaches
// WCAG AAA (>= 7:1) against the surface it sits on, hairlines clear the
// 3:1 non-text floor by a margin, and every one of those numbers is an
// improvement on the default rather than merely a different color.
//
// Emulation is engine-dependent, so each test is gated on a sentinel
// stylesheet: where the engine won't report the preference at all, the
// test skips instead of failing.

const projectRoot = path.join(__dirname, "..");

const builds = [
	{ file: "dist/cirth.css", name: "default", root: ":root" },
	{ file: "dist/cirth.classless.css", name: "classless", root: ":root" },
	{ file: "dist/cirth.scoped.css", name: "scoped", root: ".cirth" },
	{
		file: "dist/cirth.classless.scoped.css",
		name: "classless scoped",
		root: ".cirth",
	},
];

/** @param {string} file */
const read = (file) => {
	const stylesheet = path.join(projectRoot, file);

	if (!fs.existsSync(stylesheet)) {
		throw new Error(
			`prefers-contrast.spec: ${file} not found: run \`npm run build\` first.`,
		);
	}

	return fs.readFileSync(stylesheet, "utf8");
};

const css = read("dist/cirth.css");

// Presets are loaded *after* the framework and redeclare the same tokens
// on the same roots, so each one has to carry its own pass or it would
// hand the strengthened values straight back (see src/presets/).
const presets = listPresetNames().map((name) => ({
	css: read(`dist/presets/${name}.css`),
	name,
}));

const markup = `
	<main>
		<p id="text">Body copy.</p>
		<p id="muted" style="color: var(--cirth-muted-color)">Muted copy.</p>
		<p><a id="link" href="https://example.com">A link</a></p>
		<hr id="rule">
		<input id="field" type="text">
		<input id="error-field" type="text" aria-invalid="true">
		<input id="success-field" type="text" aria-invalid="false">
		<input id="warning-field" type="text" style="border-color: var(--cirth-warning-border)">
		<article id="card"><p id="card-text">On a card.</p></article>
		<button id="button" type="button">Button</button>
		<p id="error-text" style="color: var(--cirth-error-text)">Error text.</p>
		<p id="success-text" style="color: var(--cirth-success-text)">Success text.</p>
		<mark id="warning-text">Warning text.</mark>
	</main>
`;

/**
 * @param {import("@playwright/test").Page} page
 * @param {{ scheme: "light" | "dark", more: boolean, preset?: string }} options
 */
const render = async (page, { more, preset = "", scheme }) => {
	await page.emulateMedia({
		colorScheme: scheme,
		contrast: more ? "more" : "no-preference",
	});
	await setContent(page,
		`<style>${css}</style><style>${preset}</style>${markup}`,
	);
};

/**
 * @param {import("@playwright/test").Page} page
 * @param {string} id
 * @param {string} property
 */
const styleOf = (page, id, property) =>
	page.evaluate(
		([elementId, name]) => {
			const element = document.getElementById(elementId);
			if (!element) {
				throw new Error(`missing #${elementId}`);
			}
			return getComputedStyle(element).getPropertyValue(name);
		},
		/** @type {[string, string]} */ ([id, property]),
	);

/** @param {import("@playwright/test").Page} page */
const pageBackground = (page) =>
	page.evaluate(
		() => getComputedStyle(document.documentElement).backgroundColor,
	);

/** @param {import("@playwright/test").Page} page */
const reportsPreference = async (page) => {
	await page.emulateMedia({ contrast: "more" });
	// Both colors come from the stylesheet: an inline style would outrank
	// the media block and make every engine look unsupported.
	await setContent(page,
		"<style>#s{color:rgb(255,0,0)}" +
			"@media (prefers-contrast: more){#s{color:rgb(0,255,0)}}</style>" +
			'<p id="s">sentinel</p>',
	);

	return (await styleOf(page, "s", "color")) === "rgb(0, 255, 0)";
};

// --- The CSS contract, asserted on the built stylesheets ---------------

for (const build of builds) {
	test(`the preference is handled in the ${build.name} build`, () => {
		const source = read(build.file);
		const block = source.slice(source.indexOf("@media (prefers-contrast: more)"));

		expect(source).toContain("@media (prefers-contrast: more)");

		// Both schemes, through the same wiring the themes themselves use:
		// the light roots (kept at the weight of a plain root by :where(),
		// see gh#92), and the forced-dark root.
		expect(block).toContain(`${build.root}:where(:not([data-theme="dark"]))`);
		expect(block).toContain(':where([data-theme="dark"])');
		expect(block).toContain("prefers-color-scheme: dark");

		// Geometry is deliberately untouched — control heights are built
		// from the border width (44px, WCAG 2.5.5).
		expect(block).not.toContain("--cirth-border-width:");
		expect(block).not.toContain("--cirth-outline-width:");
	});
}

// --- What actually gets painted ---------------------------------------

for (const scheme of /** @type {const} */ (["light", "dark"])) {
	test(`${scheme} scheme: text reaches AAA and improves on the default`, async ({
		page,
	}) => {
		test.skip(
			!(await reportsPreference(page)),
			"this engine does not expose prefers-contrast to automation",
		);

		/** @param {boolean} more */
		const measure = async (more) => {
			await render(page, { more, scheme });
			const background = await pageBackground(page);

			return {
				body: contrastRatio(await styleOf(page, "text", "color"), background),
				card: contrastRatio(
					await styleOf(page, "card-text", "color"),
					await styleOf(page, "card", "background-color"),
				),
				link: contrastRatio(await styleOf(page, "link", "color"), background),
				muted: contrastRatio(await styleOf(page, "muted", "color"), background),
			};
		};

		const base = await measure(false);
		const more = await measure(true);

		for (const role of /** @type {const} */ (["body", "card", "link", "muted"])) {
			expect(more[role], `${role} text reaches AAA`).toBeGreaterThanOrEqual(7);
			expect(more[role], `${role} text improves on the default`).toBeGreaterThan(
				base[role],
			);
		}
	});

	test(`${scheme} scheme: hairlines and focus rings strengthen`, async ({
		page,
	}) => {
		test.skip(
			!(await reportsPreference(page)),
			"this engine does not expose prefers-contrast to automation",
		);

		/** @param {boolean} more */
		const measure = async (more) => {
			await render(page, { more, scheme });
			const background = await pageBackground(page);

			return {
				field: contrastRatio(
					await styleOf(page, "field", "border-top-color"),
					background,
				),
				focus: parseColor(await styleOf(page, "field", "--cirth-primary-focus")),
				rule: contrastRatio(
					await styleOf(page, "rule", "border-top-color"),
					background,
				),
				underline: await styleOf(page, "link", "text-decoration-color"),
				linkColor: await styleOf(page, "link", "color"),
			};
		};

		const base = await measure(false);
		const more = await measure(true);

		for (const role of /** @type {const} */ (["field", "rule"])) {
			expect(more[role], `${role} border clears the non-text floor`).toBeGreaterThan(3);
			expect(more[role], `${role} border improves on the default`).toBeGreaterThan(
				base[role],
			);
		}

		// A translucent ring composites against whatever is behind it —
		// exactly what "more contrast" asks us to stop doing.
		expect(base.focus.alpha).toBeLessThan(1);
		expect(more.focus.alpha).toBe(1);

		// The underline drops its half-alpha tint for the link color itself.
		expect(parseColor(base.underline).alpha).toBeLessThan(1);
		expect(more.underline).toBe(more.linkColor);
	});
}

// A button label sits on a fill, not on the page, so it is the one place
// where strengthening the accent can make things *worse*: the fill derives
// from --cirth-primary, the label is --cirth-primary-inverse (white), and an
// accent lightened for text legibility drags the fill up under the label.
// That regressed once, in the dark scheme, to 4.2:1 — below where it sat
// with no preference expressed at all — because the pass boosted the accent
// and let the fill follow. Both the theme and every preset now pin the fill.
for (const scheme of /** @type {const} */ (["light", "dark"])) {
	test(`${scheme} scheme: a button label clears AAA on its own fill`, async ({
		page,
	}) => {
		test.skip(
			!(await reportsPreference(page)),
			"this engine does not expose prefers-contrast to automation",
		);

		/** @param {boolean} more */
		const measure = async (more) => {
			await render(page, { more, scheme });

			return contrastRatio(
				await styleOf(page, "button", "color"),
				await styleOf(page, "button", "background-color"),
			);
		};

		const plain = await measure(false);
		const more = await measure(true);

		expect(more, "AAA under the preference").toBeGreaterThanOrEqual(7);
		expect(more, "never worse than with no preference").toBeGreaterThanOrEqual(
			plain,
		);
	});
}

for (const preset of presets) {
	test(`the ${preset.name} preset carries its own pass`, () => {
		expect(preset.css).toContain("@media (prefers-contrast: more)");
	});

	for (const scheme of /** @type {const} */ (["light", "dark"])) {
		test(`${preset.name}, ${scheme} scheme: the preset's own accent reaches AAA`, async ({
			page,
		}) => {
			test.skip(
				!(await reportsPreference(page)),
				"this engine does not expose prefers-contrast to automation",
			);

			/** @param {boolean} more */
			const measure = async (more) => {
				await render(page, { more, preset: preset.css, scheme });
				const background = await pageBackground(page);

				return {
					link: contrastRatio(await styleOf(page, "link", "color"), background),
					muted: contrastRatio(
						await styleOf(page, "muted", "color"),
						background,
					),
					// The body ink comes from the framework's pass — no preset
					// overrides --cirth-color — so this is the check that the two
					// passes compose rather than cancel.
					text: contrastRatio(await styleOf(page, "text", "color"), background),
				};
			};

			const base = await measure(false);
			const more = await measure(true);

			for (const role of /** @type {const} */ (["link", "muted", "text"])) {
				expect(more[role], `${role} reaches AAA`).toBeGreaterThanOrEqual(7);
				expect(
					more[role],
					`${role} is at least as strong as the default`,
				).toBeGreaterThanOrEqual(base[role]);
			}
		});
	}
}

// The complete shipped-theme matrix for the pairs named in the
// customization guide. These assertions are deliberately numeric: axe
// covers the real docs pages, while this compact fixture makes a failure say
// exactly which theme, scheme, contrast preference, and semantic state
// regressed. Every pair must clear its AA floor in both preference modes,
// and asking for more contrast must never make any one of them worse.
const themes = [{ css: "", name: "default" }, ...presets];
const pairFloors = {
	accent: 4.5,
	button: 4.5,
	errorBorder: 3,
	errorText: 4.5,
	muted: 4.5,
	successBorder: 3,
	successText: 4.5,
	warningBorder: 3,
	warningText: 4.5,
};

/** @param {import("@playwright/test").Page} page */
const measureNamedPairs = async (page) => {
	const canvas = await pageBackground(page);
	const fieldBackground = await styleOf(page, "field", "background-color");

	return {
		accent: contrastRatio(await styleOf(page, "link", "color"), canvas),
		button: contrastRatio(
			await styleOf(page, "button", "color"),
			await styleOf(page, "button", "background-color"),
		),
		errorBorder: contrastRatio(
			await styleOf(page, "error-field", "border-top-color"),
			fieldBackground,
		),
		errorText: contrastRatio(
			await styleOf(page, "error-text", "color"),
			canvas,
		),
		muted: contrastRatio(await styleOf(page, "muted", "color"), canvas),
		successBorder: contrastRatio(
			await styleOf(page, "success-field", "border-top-color"),
			fieldBackground,
		),
		successText: contrastRatio(
			await styleOf(page, "success-text", "color"),
			canvas,
		),
		warningBorder: contrastRatio(
			await styleOf(page, "warning-field", "border-top-color"),
			fieldBackground,
		),
		warningText: contrastRatio(
			await styleOf(page, "warning-text", "color"),
			await styleOf(page, "warning-text", "background-color"),
		),
	};
};

for (const theme of themes) {
	for (const scheme of /** @type {const} */ (["light", "dark"])) {
		test(`${theme.name}, ${scheme}, contrast fixture: every named pair clears AA and never weakens`, async ({
			page,
		}) => {
			test.skip(
				!(await reportsPreference(page)),
				"this engine does not expose prefers-contrast to automation",
			);

			await render(page, {
				more: false,
				preset: theme.css,
				scheme,
			});
			const base = await measureNamedPairs(page);

			await render(page, {
				more: true,
				preset: theme.css,
				scheme,
			});
			const more = await measureNamedPairs(page);

			for (const pair of /** @type {(keyof typeof pairFloors)[]} */ (
				Object.keys(pairFloors)
			)) {
				const floor = pairFloors[pair];
				expect(base[pair], `${pair}, no-preference`).toBeGreaterThanOrEqual(
					floor,
				);
				expect(more[pair], `${pair}, more`).toBeGreaterThanOrEqual(floor);
				expect(
					more[pair],
					`${pair}, more is never worse`,
				).toBeGreaterThanOrEqual(base[pair] - 0.001);
			}
		});
	}
}
