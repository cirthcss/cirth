const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");

// gh#64 — the modal no longer asks an integrator's script for anything.
//
// Three dependencies went, and each is checked for the property it used to
// buy rather than for the selector that replaced it: the page stops
// scrolling without .modal-is-open or a measured --cirth-scrollbar-width,
// the dialog animates in without .modal-is-opening, and neither costs the
// layout shift the old scroll lock existed to compensate for.

const projectRoot = path.join(__dirname, "..");

/** @param {string} file */
const read = (file) => {
	const stylesheet = path.join(projectRoot, file);

	if (!fs.existsSync(stylesheet)) {
		throw new Error(
			`modal.spec: ${file} not found: run \`npm run build\` first.`,
		);
	}

	return fs.readFileSync(stylesheet, "utf8");
};

const css = read("dist/cirth.css");

const markup = `
	<main class="container">
		<p style="block-size: 300vh">A page tall enough to scroll.</p>
	</main>
	<dialog id="sheet">
		<article>
			<header><strong>Confirm</strong></header>
			<p>Body copy.</p>
			<footer><button type="button">Cancel</button></footer>
		</article>
	</dialog>
`;

/** @param {import("@playwright/test").Page} page */
const render = (page) => page.setContent(`<style>${css}</style>${markup}`);

/** @param {import("@playwright/test").Page} page */
const measureWidth = (page) =>
	page.evaluate(() => {
		const main = document.querySelector("main");
		if (!main) {
			throw new Error("missing main");
		}
		return main.getBoundingClientRect().width;
	});

/** @param {import("@playwright/test").Page} page */
const dialogStyle = (page, /** @type {string} */ property) =>
	page.evaluate((name) => {
		const sheet = document.querySelector("dialog");
		if (!sheet) {
			throw new Error("missing dialog");
		}
		return getComputedStyle(sheet).getPropertyValue(name);
	}, property);

/** @param {import("@playwright/test").Page} page */
const rootOverflow = (page) =>
	page.evaluate(() => getComputedStyle(document.documentElement).overflow);

// --- The contract, on the built stylesheets ---------------------------

for (const build of [
	{ file: "dist/cirth.css", name: "default", scoped: false },
	{ file: "dist/cirth.classless.css", name: "classless", scoped: false },
	{ file: "dist/cirth.scoped.css", name: "scoped", scoped: true },
	{
		file: "dist/cirth.classless.scoped.css",
		name: "classless scoped",
		scoped: true,
	},
]) {
	test(`the ${build.name} build asks no script for anything`, () => {
		const source = read(build.file);

		for (const gone of [
			"modal-is-open",
			"modal-is-opening",
			"modal-is-closing",
			"--cirth-scrollbar-width",
		]) {
			expect(source, `${gone} is gone`).not.toContain(gone);
		}

		expect(source, "the dialog animates itself in").toContain(
			"@starting-style",
		);

		// The scoped builds are anchored in a wrapper and must not reach the
		// document root, so they cannot lock the page — and must not try.
		if (build.scoped) {
			expect(source).not.toContain("html:has(dialog[open])");
		} else {
			expect(source).toContain("html:has(dialog[open])");
		}
	});
}

// --- What the browser actually does -----------------------------------

test("the page stops scrolling while a dialog is open, and starts again after", async ({
	page,
}) => {
	await render(page);

	expect(await rootOverflow(page)).not.toBe("hidden");

	await page.evaluate(() => {
		/** @type {HTMLDialogElement | null} */
		const sheet = document.querySelector("#sheet");
		sheet?.showModal();
	});

	expect(await rootOverflow(page)).toBe("hidden");

	await page.keyboard.press("Escape");
	await expect.poll(() => rootOverflow(page)).not.toBe("hidden");
});

test("locking the page does not shift the layout", async ({ page }) => {
	await render(page);
	const before = await measureWidth(page);

	await page.evaluate(() => {
		/** @type {HTMLDialogElement | null} */
		const sheet = document.querySelector("#sheet");
		sheet?.showModal();
	});
	await page.waitForTimeout(50);

	// The reason --cirth-scrollbar-width existed: hiding the overflow used to
	// widen the content by a scrollbar. scrollbar-gutter holds the space.
	expect(await measureWidth(page)).toBe(before);
});

// Every context in this suite runs under prefers-reduced-motion: reduce,
// which is the right default and also collapses the very transitions these
// two tests are about. The first opts out deliberately; the second checks
// that leaving the default in place still silences the component.
test.describe("motion", () => {
	test.use({ contextOptions: { reducedMotion: "no-preference" } });

	test("it fades and slides in without a class being toggled", async ({
		page,
	}) => {
		await render(page);

		// Asked of the animation engine, and asked from inside the page: reading
		// opacity mid-flight races the round trip, and a @starting-style
		// transition only begins after the next style flush, so both the opening
		// and the question have to happen on the same side of the wire.
		const running = await page.evaluate(async () => {
			/** @type {HTMLDialogElement | null} */
			const sheet = document.querySelector("#sheet");
			if (!sheet) {
				throw new Error("missing dialog");
			}
			sheet.showModal();
			await new Promise((resolve) =>
				requestAnimationFrame(() => requestAnimationFrame(resolve)),
			);
			return sheet
				.getAnimations({ subtree: true })
				.map((animation) =>
					animation instanceof CSSTransition ? animation.transitionProperty : "",
				)
				.filter(Boolean);
		});

		expect(running, "the backdrop fades").toContain("opacity");
		expect(running, "the sheet slides").toContain("transform");

		await expect.poll(() => dialogStyle(page, "opacity")).toBe("1");
	});
});

test("under reduced motion it simply appears", async ({ page }) => {
	await render(page);

	const running = await page.evaluate(async () => {
		/** @type {HTMLDialogElement | null} */
		const sheet = document.querySelector("#sheet");
		if (!sheet) {
			throw new Error("missing dialog");
		}
		sheet.showModal();
		await new Promise((resolve) =>
			requestAnimationFrame(() => requestAnimationFrame(resolve)),
		);
		return sheet.getAnimations({ subtree: true }).length;
	});

	expect(running, "no transition to sit through").toBe(0);
	expect(await dialogStyle(page, "opacity")).toBe("1");
});

test("a closed dialog renders nothing", async ({ page }) => {
	await render(page);

	// The user agent enforces this and author CSS cannot override it, which is
	// why the library does not ship a defensive rule of its own.
	expect(await dialogStyle(page, "display")).toBe("none");
});
