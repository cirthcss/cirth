const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");
const { contrastRatio, parseColor } = require("../scripts/lib/color");
const { setContent } = require("./helpers/render");

// gh#32 — the @media print pass (src/utilities/_print.scss).
//
// The failure this exists to catch is invisible on screen and expensive to
// notice: a page printed while the dark scheme is active keeps its
// near-white text, while the browser drops the dark background it was
// legible against (print-color-adjust: economy), so the sheet comes out
// blank. Both schemes are therefore asserted to print the same ink.
//
// Rendered against the built stylesheet with page.emulateMedia, not
// against the docs site: the pass is a property of dist/, and setContent
// keeps the fixtures small enough to read.
//
// The pass ships as its own stylesheet (dist/cirth.print*.css) rather than
// inside the main bundle, so each fixture loads the pair in the order a
// consumer would: the build first, its print sheet after. Concatenating
// them here reproduces that order exactly — which is what the pass needs,
// since it wins over component rules by source position.

const projectRoot = path.join(__dirname, "..");

const builds = [
	{
		file: "dist/cirth.css",
		print: "dist/cirth.print.css",
		name: "default",
		scope: "",
	},
	{
		file: "dist/cirth.classless.css",
		print: "dist/cirth.print.classless.css",
		name: "classless",
		scope: "",
	},
	{
		file: "dist/cirth.scoped.css",
		print: "dist/cirth.print.scoped.css",
		name: "scoped",
		scope: ".cirth",
	},
];

/** @param {string} file */
const read = (file) => {
	const stylesheet = path.join(projectRoot, file);

	if (!fs.existsSync(stylesheet)) {
		throw new Error(
			`print.spec: ${file} not found: run \`npm run build\` first.`,
		);
	}

	return fs.readFileSync(stylesheet, "utf8");
};

const css = read("dist/cirth.css") + read("dist/cirth.print.css");
const externalHref = "https://example.com/deep/link";

const markup = `
	<nav><ul><li><a id="nav-link" href="${externalHref}">Nav</a></li></ul></nav>
	<main>
		<h1 id="heading">Heading</h1>
		<article id="card">
			<p id="text">Body copy.</p>
			<p><a id="link" href="${externalHref}">External link</a></p>
			<figure><figcaption id="caption">Caption</figcaption></figure>
			<table><thead id="head"><tr><th id="cell">Header</th></tr></thead>
				<tbody><tr><td>Cell</td></tr></tbody></table>
			<pre id="code"><code>a very long line</code></pre>
			<button id="button">Button</button>
			<input id="box" type="checkbox" checked>
			<input id="field" type="text" value="Typed value">
		</article>
	</main>
`;

/**
 * @param {import("@playwright/test").Page} page
 * @param {{ media?: "print" | "screen", scheme?: "light" | "dark" }} options
 */
const render = async (page, { media = "print", scheme = "light" } = {}) => {
	await page.emulateMedia({ colorScheme: scheme, media });
	await setContent(page, `<style>${css}</style>${markup}`);
};

/**
 * @param {import("@playwright/test").Page} page
 * @param {string} id
 * @param {string} property
 * @param {string} [pseudo]
 */
const styleOf = (page, id, property, pseudo) =>
	page.evaluate(
		([elementId, name, pseudoElement]) => {
			const element = document.getElementById(elementId);
			if (!element) {
				throw new Error(`missing #${elementId}`);
			}
			return getComputedStyle(element, pseudoElement || null).getPropertyValue(
				name,
			);
		},
		/** @type {[string, string, string]} */ ([id, property, pseudo ?? ""]),
	);

// --- The CSS contract, asserted on the built stylesheets ---------------

for (const build of builds) {
	test(`the print pass ships in the ${build.name} build`, () => {
		const source = read(build.file) + read(build.print);

		expect(source).toContain("@media print");

		for (const token of [
			"--cirth-print-color",
			"--cirth-print-muted-color",
			"--cirth-print-border-color",
		]) {
			expect(source, `${token} is declared`).toContain(`${token}:`);
		}

		// The scheme overrides have to land on the element that inherits to
		// the document, not on :root — that is what lets them outrank the
		// color schemes and any preset loaded afterwards.
		const printBlock = source.slice(source.indexOf("@media print"));
		const root = build.scope || "body";

		expect(printBlock).toContain(`${root} {`);
	});
}

// --- What actually gets painted ---------------------------------------

for (const scheme of /** @type {const} */ (["light", "dark"])) {
	test(`${scheme} scheme: text and links print as black ink`, async ({
		page,
	}) => {
		await render(page, { scheme });

		for (const id of ["heading", "text", "cell", "link", "button", "field"]) {
			const color = parseColor(await styleOf(page, id, "color"));

			expect(
				contrastRatio(await styleOf(page, id, "color"), "rgb(255, 255, 255)"),
				`#${id} against paper`,
			).toBeGreaterThan(15);
			expect(color.alpha, `#${id} is opaque`).toBe(1);
		}

		// Muted stays muted, and stays readable: AA for body text on white.
		expect(
			contrastRatio(await styleOf(page, "caption", "color"), "rgb(255, 255, 255)"),
		).toBeGreaterThanOrEqual(4.5);
	});

	test(`${scheme} scheme: surfaces flatten`, async ({ page }) => {
		await render(page, { scheme });

		for (const id of ["card", "code", "button", "field"]) {
			expect(
				parseColor(await styleOf(page, id, "background-color")).alpha,
				`#${id} background`,
			).toBe(0);
		}

		expect(await styleOf(page, "card", "box-shadow")).toBe("none");
		expect(await styleOf(page, "button", "box-shadow")).toBe("none");
	});
}

test("links keep their underline and gain their URL", async ({ page }) => {
	await render(page);

	expect(await styleOf(page, "link", "text-decoration-line")).toContain(
		"underline",
	);
	// Firefox reports the specified value here (`" (" attr(href) ")"`) where
	// Chromium and WebKit report the substituted one, so accept either: the
	// assertion is that the URL is being emitted at all.
	expect(await styleOf(page, "link", "content", "::after")).toMatch(
		new RegExp(`attr\\(href\\)|${externalHref}`),
	);

	// Navigation is a list of labels, not a bibliography.
	expect(await styleOf(page, "nav-link", "content", "::after")).toBe("none");
});

test("state-bearing color opts back in", async ({ page }) => {
	await render(page);

	expect(await styleOf(page, "box", "print-color-adjust")).toBe("exact");
});

test("nothing is clipped or torn by the fold", async ({ page }) => {
	await render(page);

	expect(await styleOf(page, "head", "display")).toBe("table-header-group");
	expect(await styleOf(page, "code", "white-space")).toBe("pre-wrap");
	expect(await styleOf(page, "code", "overflow-x")).toBe("visible");
	expect(await styleOf(page, "heading", "break-after")).toBe("avoid");
});

test("none of it applies on screen", async ({ page }) => {
	await render(page, { media: "screen" });

	// The accent is still the accent, the card is still a surface.
	expect(
		contrastRatio(await styleOf(page, "link", "color"), "rgb(255, 255, 255)"),
	).toBeLessThan(15);
	expect(parseColor(await styleOf(page, "card", "background-color")).alpha).toBe(
		1,
	);
	expect(await styleOf(page, "link", "content", "::after")).toBe("none");
});
