const { expect, test } = require("@playwright/test");
const { assertDocsBuilt, createServer, startServer } = require("../scripts/lib/docs-site");

// A component inside a docs demo must look exactly as Cirth alone draws it.
// Each case renders a demo's own markup a second time, in a page that loads
// nothing but the docs build of Cirth, at the demo's width, and compares
// the computed look of every element, at rest and in its states. The only
// container property carried over is the one a demo declares on purpose:
// a stage that paints the recessed level says so through --cirth-surface.
// scripts/check-demo-boundary.js checks the same boundary statically.

assertDocsBuilt("docs-boundary.spec");

/** @type {import("node:http").Server} */
let server;
/** @type {string} */
let origin;

test.beforeAll(async () => {
	server = createServer();
	origin = await startServer(server);
});

test.afterAll(() => {
	server.close();
});

const properties = [
	"color",
	"background-color",
	"background-image",
	...["top", "right", "bottom", "left"].flatMap((side) => [`border-${side}-color`, `border-${side}-style`, `border-${side}-width`, `padding-${side}`]),
	...["top-left", "top-right", "bottom-right", "bottom-left"].map((corner) => `border-${corner}-radius`),
	"box-shadow",
	"font-family",
	"font-size",
	"font-style",
	"font-weight",
	"line-height",
	"letter-spacing",
	"text-transform",
	"outline-color",
	"outline-style",
	"outline-width",
	"outline-offset",
	"appearance",
	"accent-color",
];

/**
 * @typedef {{
 *   name: string,
 *   url: string,
 *   container: string,
 *   surface?: string,
 *   targets: { selector: string, states: ("hover" | "active" | "focus" | "click")[] }[],
 * }} Case
 */

/** @type {Case[]} */
const cases = [
	{
		name: "the story's ticket on the home page",
		url: "/",
		container: ".docs-story-result",
		targets: [
			{ selector: "button", states: ["hover", "active", "focus"] },
			{ selector: "input[type='radio']:not(:checked)", states: ["hover", "focus", "click"] },
		],
	},
	{
		name: "the hero's sign-in card",
		url: "/",
		container: ".docs-hero-render",
		targets: [],
	},
	{
		name: "the first button demo",
		url: "/content/button/",
		container: ".docs-demo-preview",
		surface: "var(--cirth-surface-recessed)",
		targets: [
			{ selector: "button", states: ["hover", "active", "focus"] },
			{ selector: "button[disabled]", states: ["hover"] },
		],
	},
	{
		name: "the first checkbox demo",
		url: "/forms/checkbox-radio-switch/",
		container: ".docs-demo-preview",
		surface: "var(--cirth-surface-recessed)",
		targets: [{ selector: "input[type='checkbox']", states: ["hover", "focus", "click"] }],
	},
	{
		name: "the first text input demo",
		url: "/forms/text-inputs/",
		container: ".docs-demo-preview",
		surface: "var(--cirth-surface-recessed)",
		targets: [{ selector: "input", states: ["hover", "focus"] }],
	},
];

/**
 * Every element's look under `root`, in document order.
 * @param {import("@playwright/test").Locator} root
 */
const lookOf = (root) =>
	root.evaluate(
		(element, names) =>
			[...element.querySelectorAll("*")].map((node) => {
				const style = getComputedStyle(node);
				return `${node.tagName.toLowerCase()} ${names.map((name) => `${name}=${style.getPropertyValue(name)}`).join("; ")}`;
			}),
		properties,
	);

/**
 * One element's look after putting it in a state.
 * @param {import("@playwright/test").Page} page
 * @param {import("@playwright/test").Locator} target
 * @param {"hover" | "active" | "focus" | "click"} state
 */
const lookIn = async (page, target, state) => {
	await target.scrollIntoViewIfNeeded();
	// WebKit hit-tests a disabled control as its parent, so the pointer is
	// moved over it without waiting for it to receive events.
	const force = await target.isDisabled();
	if (state === "hover") await target.hover({ force });
	if (state === "active") {
		await target.hover({ force });
		await page.mouse.down();
	}
	if (state === "focus") {
		await page.keyboard.press("Shift");
		await target.focus();
	}
	if (state === "click") await target.click();
	const look = await target.evaluate(
		(element, names) => names.map((name) => `${name}=${getComputedStyle(element).getPropertyValue(name)}`).join("; "),
		properties,
	);
	if (state === "active") await page.mouse.up();
	await page.mouse.move(0, 0);
	await target.evaluate((element) => /** @type {HTMLElement} */ (element).blur());
	return look;
};

for (const scheme of /** @type {const} */ (["light", "dark"])) {
	for (const entry of cases) {
		test(`${entry.name} looks as Cirth alone draws it (${scheme})`, async ({ browser }) => {
			const context = await browser.newContext({ colorScheme: scheme, reducedMotion: "reduce", viewport: { width: 1280, height: 900 } });
			const docs = await context.newPage();
			await docs.goto(`${origin}${entry.url}`, { waitUntil: "networkidle" });
			const container = docs.locator(entry.container).first();
			const { html, width } = await container.evaluate((element) => ({
				html: element.innerHTML,
				width: element.getBoundingClientRect().width - Number.parseFloat(getComputedStyle(element).paddingLeft) - Number.parseFloat(getComputedStyle(element).paddingRight),
			}));

			const alone = await context.newPage();
			await alone.goto(`${origin}/404.html`, { waitUntil: "load" });
			await alone.setContent(
				`<!doctype html><html lang="en" data-theme="${scheme}"><head><meta charset="utf-8"><link rel="stylesheet" href="${origin}/styles/generated/cirth-docs.css"></head><body><main><div id="root" style="inline-size: ${width}px${entry.surface ? `; --cirth-surface: ${entry.surface}` : ""}">${html}</div></main></body></html>`,
				{ waitUntil: "load" },
			);
			const root = alone.locator("#root");

			// At rest, element by element.
			expect(await lookOf(root)).toEqual(await lookOf(container));

			// In each state, on both pages the same way.
			for (const target of entry.targets) {
				for (const state of target.states) {
					const inDocs = await lookIn(docs, container.locator(target.selector).first(), state);
					const inAlone = await lookIn(alone, root.locator(target.selector).first(), state);
					expect(inDocs, `${target.selector} ${state}`).toBe(inAlone);
				}
			}
			await context.close();
		});
	}
}
