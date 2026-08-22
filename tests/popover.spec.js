const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");

// gh#51 — [data-tooltip] is gone and [popover] took its place.
//
// The old component failed WCAG 1.4.13 by construction: its message lived
// in generated content, so nothing could reference it and no engine had to
// expose it. Every assertion here is aimed at the properties that failure
// cost, and at the one guarantee CSS still owns — that an element carrying
// an attribute the browser might not know stays hidden rather than
// spilling its contents into the page.

const projectRoot = path.join(__dirname, "..");

const builds = [
	{ file: "dist/cirth.css", name: "default" },
	{ file: "dist/cirth.classless.css", name: "classless" },
	{ file: "dist/cirth.scoped.css", name: "scoped" },
	{ file: "dist/cirth.classless.scoped.css", name: "classless scoped" },
];

/** @param {string} file */
const read = (file) => {
	const stylesheet = path.join(projectRoot, file);

	if (!fs.existsSync(stylesheet)) {
		throw new Error(`popover.spec: ${file} not found: run \`npm run build\` first.`);
	}

	return fs.readFileSync(stylesheet, "utf8");
};

const css = read("dist/cirth.css");

const markup = `
	<main>
		<button type="button" popovertarget="hint" aria-describedby="hint">Requirements</button>
		<span id="hint" popover>At least twelve characters.</span>
		<dialog id="sheet" popover><article><p>A dialog.</p></article></dialog>
	</main>
`;

/** @param {import("@playwright/test").Page} page */
const render = (page) => page.setContent(`<style>${css}</style>${markup}`);

/** @param {import("@playwright/test").Page} page @param {string} id @param {string} property */
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

// --- The contract, on the built stylesheets ---------------------------

for (const build of builds) {
	test(`the popover fails closed in the ${build.name} build`, () => {
		const source = read(build.file);
		const hidden = source
			.split("}")
			.find(
				(block) =>
					block.includes('[popover=""]') && block.includes("display: none"),
			);

		expect(hidden, "a rule hiding popovers by default").toBeDefined();
		expect(source, "revealed only by the open state").toContain(":popover-open");

		// A dialog has its own component and must not be restyled as a sheet.
		expect(source).toContain(":not(dialog)");

		// Only the popovers the library can claim. A manual popover belongs to
		// whoever is driving it — including tooling that injects one, which is
		// how a blanket rule once handed Playwright's own screenshot-mask
		// overlay a fade and made every masked capture unstable.
		expect(source, "auto is styled").toContain('[popover="auto"]');
		expect(source, "hint is styled").toContain('[popover="hint"]');
		expect(source, "manual is left alone").not.toContain('[popover="manual"]');
	});

	test(`the ${build.name} build has no trace of the old tooltip`, () => {
		const source = read(build.file);

		expect(source).not.toContain("data-tooltip");
		expect(source).not.toContain("--cirth-tooltip");
	});
}

// --- What the browser actually does -----------------------------------

test("the hint is hidden until it is asked for, and announced either way", async ({
	page,
}) => {
	await render(page);

	expect(await styleOf(page, "hint", "display")).toBe("none");

	// aria-describedby resolves while the panel is closed — the property the
	// pseudo-element version could never have.
	const described = await page.evaluate(() => {
		const id = document.querySelector("button")?.getAttribute("aria-describedby");
		return id ? document.getElementById(id)?.textContent?.trim() : null;
	});

	expect(described).toContain("twelve characters");
});

test("an invoker opens it, and the platform closes it", async ({ page }) => {
	await render(page);
	await page.getByRole("button", { name: "Requirements" }).click();

	await expect
		.poll(() => page.evaluate(() => document.getElementById("hint")?.matches(":popover-open")))
		.toBe(true);
	expect(await styleOf(page, "hint", "display")).toBe("block");

	// Dismissible without moving the pointer or the focus (WCAG 1.4.13).
	await page.keyboard.press("Escape");

	await expect
		.poll(() => page.evaluate(() => document.getElementById("hint")?.matches(":popover-open")))
		.toBe(false);
});

test("it is painted as a sheet, not as bare text", async ({ page }) => {
	await render(page);
	await page.getByRole("button", { name: "Requirements" }).click();
	await page.waitForFunction(() =>
		document.getElementById("hint")?.matches(":popover-open"),
	);

	expect(await styleOf(page, "hint", "border-top-style")).toBe("solid");
	expect(await styleOf(page, "hint", "background-color")).not.toBe("rgba(0, 0, 0, 0)");
	expect(Number.parseFloat(await styleOf(page, "hint", "border-top-left-radius"))).toBeGreaterThan(0);
});

test("a manual popover is left to whoever is driving it", async ({ page }) => {
	await page.setContent(
		`<style>${css}</style><div id="chrome" popover="manual">Tooling overlay.</div>`,
	);
	await page.evaluate(() => document.getElementById("chrome")?.showPopover());

	// The border it does have is the user agent's own default for [popover],
	// not this library's. What must not be there is Cirth's treatment — and
	// above all its transition: an overlay that fades in is an overlay a
	// screenshot can catch mid-fade.
	expect(await styleOf(page, "chrome", "transition-duration")).toBe("0s");
	expect(await styleOf(page, "chrome", "box-shadow")).toBe("none");
});

test("a dialog that is also a popover keeps the dialog treatment", async ({
	page,
}) => {
	await render(page);

	// The sheet rules must not have claimed it: a closed dialog is hidden by
	// the user agent, not by a border-radius and a box shadow.
	expect(await styleOf(page, "sheet", "border-top-style")).not.toBe("solid");
});
