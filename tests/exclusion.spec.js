const fs = require("node:fs");
const path = require("node:path");
const postcss = require("postcss");
const { expect, test } = require("@playwright/test");
const { setContent } = require("./helpers/render");

const projectRoot = path.join(__dirname, "..");

/** @param {string} file */
const read = (file) => {
	const stylesheet = path.join(projectRoot, file);
	if (!fs.existsSync(stylesheet)) {
		throw new Error(
			`exclusion.spec: ${file} not found: run \`npm run build\` first.`,
		);
	}
	return fs.readFileSync(stylesheet, "utf8");
};

/**
 * A same-engine reference retaining only the rules the exclusion contract
 * deliberately leaves global. The production invariant is parser-backed in
 * check:exclusion; this reference exists only to avoid hard-coding UA values
 * that differ between Chromium, Firefox and WebKit.
 *
 * @param {string} css
 */
const withoutComponents = (css) => {
	const root = postcss.parse(css);
	root.walkRules((rule) => {
		if (rule.selector === "from" || rule.selector === "to" || /%$/.test(rule.selector)) {
			return;
		}
		const globalSelectors = rule.selectors.filter(
			(selector) => !selector.includes(".no-cirth"),
		);
		if (globalSelectors.length === 0) {
			rule.remove();
		} else {
			rule.selectors = globalSelectors;
		}
	});
	return root.toString();
};

const specimen = `
	<button id="button">Action</button>
	<input id="input" placeholder="Search">
	<table id="table"><tbody><tr><td id="cell">Cell</td></tr></tbody></table>
	<details id="details"><summary id="summary">More</summary><p>Body</p></details>
`;

/** @param {import("@playwright/test").Page | import("@playwright/test").Frame} page */
const snapshot = (page) =>
	page.evaluate(() => {
		/** @param {string} id */
		const style = (id) => {
			const element = document.getElementById(id);
			if (!element) {
				throw new Error(`missing #${id}`);
			}
			return getComputedStyle(element);
		};
		const button = style("button");
		const input = style("input");
		const cell = style("cell");
		const details = style("details");
		const summary = document.getElementById("summary");
		if (!summary) {
			throw new Error("missing #summary");
		}
		const marker = getComputedStyle(summary, "::after");

		return {
			button: {
				backgroundColor: button.backgroundColor,
				borderRadius: button.borderRadius,
				borderWidth: button.borderWidth,
				minBlockSize: button.minBlockSize,
				padding: button.padding,
			},
			cell: {
				borderBottomWidth: cell.borderBottomWidth,
				padding: cell.padding,
				textAlign: cell.textAlign,
			},
			details: {
				marginBottom: details.marginBottom,
				markerContent: marker.content,
				markerMaskImage: marker.maskImage || marker.webkitMaskImage,
			},
			input: {
				appearance: input.appearance,
				backgroundImage: input.backgroundImage,
				borderRadius: input.borderRadius,
				borderWidth: input.borderWidth,
				height: input.height,
				padding: input.padding,
			},
		};
	});

/**
 * @param {import("@playwright/test").Page} page
 * @param {string} css
 * @param {boolean} scoped
 */
const referenceSnapshot = async (page, css, scoped) => {
	await page.locator("body").evaluate((body) => {
		body.insertAdjacentHTML("beforeend", '<iframe id="reference"></iframe>');
	});
	const handle = await page.locator("#reference").elementHandle();
	if (!handle) {
		throw new Error("reference iframe did not create an element");
	}
	const frame = await handle.contentFrame();
	if (!frame) {
		throw new Error("reference iframe did not create a frame");
	}
	const markup = scoped ? `<div class="cirth">${specimen}</div>` : specimen;
	await setContent(frame, `<style>${withoutComponents(css)}</style>${markup}`);
	return snapshot(frame);
};

const builds = [
	{ file: "dist/cirth.css", name: "default", scoped: false },
	{ file: "dist/cirth.classless.css", name: "classless", scoped: false },
	{ file: "dist/cirth.scoped.css", name: "scoped", scoped: true },
	{
		file: "dist/cirth.classless.scoped.css",
		name: "classless scoped",
		scoped: true,
	},
];

for (const build of builds) {
	test(`${build.name} build excludes component declarations`, async ({ page }) => {
		const css = read(build.file);
		const outside = build.scoped
			? `<div class="cirth">${specimen}</div>`
			: specimen;
		const excluded = build.scoped
			? `<div class="cirth"><div class="no-cirth">${specimen}</div></div>`
			: `<div class="no-cirth">${specimen}</div>`;

		await setContent(page, `<style>${css}</style><section id="outside">${outside}</section>`);
		const outsideState = await snapshot(page);
		const reference = await referenceSnapshot(page, css, build.scoped);
		expect(outsideState).not.toEqual(reference);

		await page.locator("#outside").evaluate((element, markup) => {
			element.innerHTML = markup;
		}, excluded);
		expect(await snapshot(page)).toEqual(reference);
	});
}

test("the boundary works on its own subject, when nested, and when toggled", async ({
	page,
}) => {
	const css = read("dist/cirth.css");
	await setContent(
		page,
		`<style>${css}</style>
		<button id="button">Action</button>
		<div class="no-cirth"><div class="no-cirth">${specimen}</div></div>`,
	);
	const reference = await referenceSnapshot(page, css, false);

	const button = page.locator("body > #button");
	const componentPadding = await button.evaluate(
		(element) => getComputedStyle(element).padding,
	);
	await button.evaluate((element) => element.classList.add("no-cirth"));
	const excludedPadding = await button.evaluate(
		(element) => getComputedStyle(element).padding,
	);
	expect(excludedPadding).toBe(reference.button.padding);
	expect(excludedPadding).not.toBe(componentPadding);

	await button.evaluate((element) => element.classList.remove("no-cirth"));
	expect(
		await button.evaluate((element) => getComputedStyle(element).padding),
	).toBe(componentPadding);

	await button.evaluate((element) => element.remove());
	expect(await snapshot(page)).toEqual(reference);
});

test("global reset, theme, layout and reduced-motion rules keep applying", async ({
	page,
}) => {
	const css = read("dist/cirth.css");
	await setContent(
		page,
		`<style>${css}</style>
		<div id="boundary" class="no-cirth grid">
			<button id="button">Action</button>
			<div id="plain">Plain</div>
		</div>`,
	);

	const state = await page.evaluate(() => {
		const boundary = document.getElementById("boundary");
		const button = document.getElementById("button");
		const plain = document.getElementById("plain");
		if (!boundary || !button || !plain) {
			throw new Error("missing exclusion fixture node");
		}
		const boundaryStyle = getComputedStyle(boundary);
		const buttonStyle = getComputedStyle(button);
		const plainStyle = getComputedStyle(plain);
		return {
			boxSizing: buttonStyle.boxSizing,
			customProperty: buttonStyle.getPropertyValue("--cirth-primary").trim(),
			display: boundaryStyle.display,
			fontFamily: buttonStyle.fontFamily,
			parentFontFamily: boundaryStyle.fontFamily,
			transitionToken: plainStyle
				.getPropertyValue("--cirth-transition")
				.trim(),
		};
	});

	expect(state.boxSizing).toBe("border-box");
	expect(state.customProperty).not.toBe("");
	expect(state.display).toBe("grid");
	expect(state.fontFamily).toBe(state.parentFontFamily);
	expect(state.transitionToken).toContain("0s");
});

test("outside :has() and sibling subjects still react across the boundary", async ({
	page,
}) => {
	const css = read("dist/cirth.css");
	await setContent(
		page,
		`<style>${css}</style>
		<input class="no-cirth"><small id="outside-helper">Outside helper</small>
		<div class="no-cirth">
			<input><small id="inside-helper">Inside helper</small>
			<dialog id="dialog"><p>Modal</p></dialog>
		</div>`,
	);

	const before = await page.evaluate(() => {
		const inside = document.getElementById("inside-helper");
		const outside = document.getElementById("outside-helper");
		if (!inside || !outside) {
			throw new Error("missing sibling fixture node");
		}
		return {
			inside: getComputedStyle(inside).display,
			outside: getComputedStyle(outside).display,
		};
	});
	expect(before.outside).toBe("block");
	expect(before.inside).not.toBe("block");

	await page.locator("#dialog").evaluate((dialog) => {
		if (!(dialog instanceof HTMLDialogElement)) {
			throw new Error("#dialog is not a dialog");
		}
		dialog.showModal();
	});
	expect(
		await page.evaluate(() => getComputedStyle(document.documentElement).overflow),
	).toBe("hidden");
});

test("later third-party CSS remains authoritative inside the boundary", async ({
	page,
}) => {
	const css = read("dist/cirth.css");
	await setContent(
		page,
		`<style>${css}</style>
		<style>
			.third-party button {
				padding: 3px 7px;
				border: 2px solid rgb(1 2 3);
				border-radius: 1px;
				font: 13px/1.25 monospace;
			}
		</style>
		<div class="no-cirth third-party"><button id="button">Widget</button></div>`,
	);

	const state = await page.locator("#button").evaluate((element) => {
		const style = getComputedStyle(element);
		return {
			borderColor: style.borderColor,
			borderRadius: style.borderRadius,
			borderWidth: style.borderWidth,
			fontFamily: style.fontFamily,
			fontSize: style.fontSize,
			padding: style.padding,
		};
	});
	expect(state).toEqual({
		borderColor: "rgb(1, 2, 3)",
		borderRadius: "1px",
		borderWidth: "2px",
		fontFamily: "monospace",
		fontSize: "13px",
		padding: "3px 7px",
	});
});

test("the guard adds no specificity to the component selector", async ({
	page,
}) => {
	const css = read("dist/cirth.css");
	await setContent(
		page,
		`<style>${css}</style>
		<style>button { padding: 2px 5px; }</style>
		<button id="button">Same-specificity override</button>`,
	);

	expect(
		await page.locator("#button").evaluate(
			(element) => getComputedStyle(element).padding,
		),
	).toBe("2px 5px");
});
