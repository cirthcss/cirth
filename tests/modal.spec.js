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
	<dialog id="inline" open>
		<article><p>An open dialog that is not modal.</p></article>
	</dialog>
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
		// By id: this page also renders a non-modal dialog, and the first
		// dialog in the document is not the one these assertions are about.
		const sheet = document.querySelector("#sheet");
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
			expect(source).not.toContain("html:has(dialog:modal)");
		} else {
			expect(source).toContain("html:has(dialog:modal)");
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

// Regression, found on this project's own documentation: the modal page
// renders an open <dialog> inline as its worked example, and a scroll lock
// keyed on [open] took the whole page's scrolling with it — the reader
// could not reach the prose below the demo. A non-modal dialog is ordinary
// in-flow content, so :modal is the condition, and this is the case that
// says so.
test("an open but non-modal dialog leaves the page scrolling", async ({
	page,
}) => {
	await render(page);

	const inline = page.locator("#inline");
	await expect(inline).toBeVisible();
	expect(await rootOverflow(page)).not.toBe("hidden");

	const scrolled = await page.evaluate(() => {
		window.scrollTo(0, 400);
		return window.scrollY;
	});
	expect(scrolled, "the reader can still reach the rest of the page").toBe(400);
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

			// Polled rather than sampled at a fixed frame: a @starting-style
			// transition begins after the next style flush, and how many
			// frames that takes is a property of the machine, not of the
			// component. A loaded CI runner is slower than a laptop, and a
			// test that only passes on the laptop proves nothing.
			for (let frame = 0; frame < 30; frame++) {
				const running = sheet
					.getAnimations({ subtree: true })
					.map((animation) =>
						animation instanceof CSSTransition
							? animation.transitionProperty
							: "",
					)
					.filter(Boolean);

				if (running.length > 0) {
					return running;
				}

				await new Promise((resolve) => requestAnimationFrame(resolve));
			}

			return [];
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

test("the close button is a full-size target around a small icon", async ({
	page,
}) => {
	await page.setContent(
		`<style>${css}</style>
		<dialog id="sheet" open>
			<article>
				<header>
					<button id="close" aria-label="Close" rel="prev"></button>
					<strong id="title">Confirm</strong>
				</header>
				<p id="body">Body copy.</p>
			</article>
		</dialog>`,
	);

	// The icon is 1rem and stays 1rem — what grows is what a pointer has to
	// hit. 16px was the whole target for the control people reach for in a
	// hurry, and a floor that only grew its height would have left it tall
	// and thin, which is worse than either.
	const { close, header } = await page.evaluate(() => {
		const box = (/** @type {string} */ id) => {
			const el = document.getElementById(id);
			if (!el) {
				throw new Error(`missing ${id}`);
			}
			const { width, height } = el.getBoundingClientRect();
			return { width, height };
		};
		return { close: box("close"), header: box("title") };
	});

	expect(close.width).toBeGreaterThanOrEqual(44);
	expect(close.height).toBeGreaterThanOrEqual(44);

	// And the header it sits in is unchanged: the extra is taken back out
	// with negative margins, so the target grew without moving anything.
	expect(header.height).toBeLessThan(44);
});
