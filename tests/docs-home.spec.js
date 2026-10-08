const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");
const {
	assertDocsBuilt,
	createServer,
	startServer,
} = require("../scripts/lib/docs-site");

// The home page's scenes and the one controller that moves them. Every
// state is a function of the scroll position: these tests put the page at a
// scene's exact progress (scrollY is computed from the section's geometry,
// so nothing depends on inertia or a delay) and read the state the page
// says it is in, then go back and read it again. Under reduced motion, with
// no script and on a phone, every scene is simply complete.

assertDocsBuilt("docs-home.spec");

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

/**
 * Wait for the controller's frame and for the scenes to catch up with the
 * scroll: they are drawn at an eased position that follows the window's,
 * and `data-animating` is on the page while the two differ.
 * @param {import("@playwright/test").Page} page
 */
const settle = async (page) => {
	await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
	await page.waitForFunction(() => !document.querySelector(".docs-home")?.hasAttribute("data-animating"));
};

/**
 * Scroll a held scene to `progress` (0 to 1) of its travel and let the
 * scenes settle there.
 * @param {import("@playwright/test").Page} page
 * @param {string} selector
 * @param {number} progress
 */
const goTo = async (page, selector, progress) => {
	await page.locator(selector).evaluate((section, p) => {
		const element = /** @type {HTMLElement} */ (section);
		const top = element.getBoundingClientRect().top + window.scrollY;
		window.scrollTo(0, top + p * (element.offsetHeight - window.innerHeight));
	}, progress);
	await settle(page);
};

/** @param {import("@playwright/test").Page} page */
const held = async (page) => {
	await page.emulateMedia({ reducedMotion: "no-preference" });
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });
	await expect(page.locator(".docs-home")).toHaveAttribute("data-stage", "held");
};

/** What the story shows: how much of the listing is typed, each picture, and which steps are reached. */
const storyAt = (/** @type {import("@playwright/test").Page} */ page) =>
	page.locator("[data-docs-story]").evaluate((story) => {
		const typed = /** @type {HTMLElement} */ (story.querySelector("[data-docs-story-typed]"));
		const source = /** @type {HTMLElement} */ (story.querySelector("[data-docs-story-code]"));
		const opacity = (/** @type {string} */ selector) => Number(getComputedStyle(/** @type {Element} */ (story.querySelector(selector))).opacity);
		return {
			step: /** @type {HTMLElement} */ (story).dataset.step,
			typed: typed.textContent?.length ?? 0,
			total: source.textContent?.length ?? 0,
			whole: source.textContent,
			browser: opacity("[data-docs-story-part='2']"),
			cirth: opacity("[data-docs-story-part='3']"),
			reached: [...story.querySelectorAll("[data-docs-story-step]")].map((step) => (step.hasAttribute("data-reached") ? 1 : 0)).join(""),
		};
	});

test("the story types the markup, then shows the browser's picture, then Cirth's, with the scroll and back", async ({ page }) => {
	await held(page);
	const specimen = (await page.locator("[data-docs-story-code]").textContent()) ?? "";
	expect(specimen).toContain('<meter value="0.7" low="0.5" high="0.8" optimum="0">');

	await goTo(page, "[data-docs-story]", 0);
	let at = await storyAt(page);
	// Nothing typed yet, give or take the one character a scroll position
	// rounded to a whole pixel can be worth.
	expect(at.typed).toBeLessThanOrEqual(1);
	expect([at.step, at.browser, at.cirth, at.reached]).toEqual(["1", 0, 0, "100"]);

	await goTo(page, "[data-docs-story]", 0.15);
	at = await storyAt(page);
	expect(at.typed).toBeGreaterThan(at.total * 0.3);
	expect(at.typed).toBeLessThan(at.total * 0.7);
	// The listing in the document is whole whatever is drawn.
	expect(at.whole).toBe(specimen);

	await goTo(page, "[data-docs-story]", 0.34);
	at = await storyAt(page);
	expect(at.typed).toBe(at.total);
	expect([at.step, at.browser, at.cirth, at.reached]).toEqual(["1", 0, 0, "100"]);

	// The browser's picture stands for a long stretch before Cirth's, and
	// the first two steps are reached while it does.
	for (const p of [0.46, 0.55, 0.6]) {
		await goTo(page, "[data-docs-story]", p);
		at = await storyAt(page);
		expect([at.step, at.browser, at.cirth, at.reached], `at ${p}`).toEqual(["2", 1, 0, "110"]);
	}

	// Cirth's is complete early, and holds to the end, with all three steps.
	for (const p of [0.72, 0.85, 1]) {
		await goTo(page, "[data-docs-story]", p);
		at = await storyAt(page);
		expect([at.step, at.browser, at.cirth, at.reached], `at ${p}`).toEqual(["3", 0, 1, "111"]);
	}

	// And backwards: the same states at the same points.
	await goTo(page, "[data-docs-story]", 0.5);
	at = await storyAt(page);
	expect([at.step, at.browser, at.cirth, at.reached]).toEqual(["2", 1, 0, "110"]);
	await goTo(page, "[data-docs-story]", 0.15);
	at = await storyAt(page);
	expect(at.typed).toBeLessThan(at.total);
	expect([at.browser, at.cirth, at.reached]).toEqual([0, 0, "100"]);

	// The typing is a picture: hidden from assistive technology, never
	// announced, and the story has no live region at all.
	await expect(page.locator("[data-docs-story-typed]")).toHaveAttribute("aria-hidden", "true");
	await expect(page.locator("[data-docs-story] [aria-live]")).toHaveCount(0);
	// The scene is held under the header, for about three windows.
	const geometry = await page.locator("[data-docs-story]").evaluate((story) => {
		const scene = /** @type {Element} */ (story.querySelector(".docs-story-scene"));
		return { section: story.getBoundingClientRect().height, position: getComputedStyle(scene).position };
	});
	expect(geometry.position).toBe("sticky");
	expect(geometry.section / 900).toBeGreaterThanOrEqual(2.5);
	expect(geometry.section / 900).toBeLessThanOrEqual(3.5);
});

test("the story's steps hold their stage on a threshold, move only colour, and never move", async ({ page }) => {
	await held(page);
	/** Where each step is, and the colours it is drawn in. */
	const steps = () =>
		page.locator("[data-docs-story-step]").evaluateAll((items) =>
			items.map((item) => {
				const box = item.getBoundingClientRect();
				const title = /** @type {Element} */ (item.querySelector("h3"));
				return {
					box: [box.x, box.y, box.width, box.height].map((value) => Math.round(value)).join(","),
					color: getComputedStyle(title).color,
					transition: getComputedStyle(title).transitionProperty,
					duration: Number.parseFloat(getComputedStyle(title).transitionDuration) * 1000,
				};
			}),
		);
	const readStage = async () => (await storyAt(page)).reached;

	// The second step opens half way through the browser's picture coming
	// in (0.41 of the story). Just past that line, coming from before it,
	// the stage holds; past the margin it moves; and coming back, it holds
	// just under the line until it is past the margin the other way.
	await goTo(page, "[data-docs-story]", 0.3);
	const before = await steps();
	expect(await readStage()).toBe("100");
	await goTo(page, "[data-docs-story]", 0.415);
	expect(await readStage(), "just past the line, from before it").toBe("100");
	await goTo(page, "[data-docs-story]", 0.45);
	expect(await readStage()).toBe("110");
	await goTo(page, "[data-docs-story]", 0.405);
	expect(await readStage(), "just under the line, from after it").toBe("110");
	await goTo(page, "[data-docs-story]", 0.37);
	expect(await readStage()).toBe("100");

	// Not one step moved or changed size between the stages; only colour
	// changed, for the library's transition.
	await goTo(page, "[data-docs-story]", 0.9);
	const after = await steps();
	expect(after.map((step) => step.box)).toEqual(before.map((step) => step.box));
	expect(after[2].color).not.toBe(before[2].color);
	for (const step of after) {
		expect(step.transition).toBe("color");
		expect(step.duration).toBeGreaterThanOrEqual(380);
		expect(step.duration).toBeLessThanOrEqual(520);
	}

	// A step not yet reached is muted, and still reads: the muted ink is
	// the lightest the theme keeps at AA. Every step is one colour of ink
	// or the other, never an opacity.
	await goTo(page, "[data-docs-story]", 0.1);
	await page.waitForTimeout(400);
	const muted = await page.locator("[data-docs-story-step='3']").evaluate((step) => {
		const probe = document.createElement("span");
		probe.style.color = "var(--cirth-muted-color)";
		step.append(probe);
		const token = getComputedStyle(probe).color;
		probe.remove();
		return {
			opacity: getComputedStyle(step).opacity,
			title: getComputedStyle(/** @type {Element} */ (step.querySelector("h3"))).color,
			text: getComputedStyle(/** @type {Element} */ (step.querySelector("p"))).color,
			token,
		};
	});
	expect(muted.opacity).toBe("1");
	expect(muted.title).toBe(muted.token);
	expect(muted.text).toBe(muted.token);

	// What tells the stage at a glance is not the text: a reached step has
	// the accent's bar down its edge, the current one also a wash of it and
	// aria-current="step", and a step not yet reached has neither. Each
	// phase, then backwards.
	/** @param {number} p */
	const marks = async (p) => {
		await goTo(page, "[data-docs-story]", p);
		await page.waitForTimeout(600);
		return page.locator("[data-docs-story-step]").evaluateAll((items) =>
			items.map((item) => {
				const bar = Number(getComputedStyle(item, "::before").opacity);
				const wash = getComputedStyle(item).backgroundColor;
				const washed = !/rgba\(0, 0, 0, 0\)|transparent/.test(wash);
				return `${bar === 1 ? "bar" : bar === 0 ? "-" : "?"}${washed ? "+wash" : ""}${item.getAttribute("aria-current") === "step" ? "+current" : ""}`;
			}),
		);
	};
	expect(await marks(0.15)).toEqual(["bar+wash+current", "-", "-"]);
	expect(await marks(0.52)).toEqual(["bar", "bar+wash+current", "-"]);
	expect(await marks(0.85)).toEqual(["bar", "bar", "bar+wash+current"]);
	expect(await marks(0.52)).toEqual(["bar", "bar+wash+current", "-"]);
	expect(await marks(0.15)).toEqual(["bar+wash+current", "-", "-"]);
	// All three are still read: none is hidden from assistive technology.
	await expect(page.locator("[data-docs-story-step][aria-hidden], [data-docs-story-step][hidden]")).toHaveCount(0);
});

test("the keyboard reaches the live ticket wherever the story is, and finds it visible", async ({ page }) => {
	await held(page);
	await goTo(page, "[data-docs-story]", 0.2);
	const chosen = page.locator(".docs-story-result input[type='radio']:checked");
	await chosen.focus();
	await expect(chosen).toBeFocused();
	await expect(page.locator("[data-docs-story-part='3']")).toHaveCSS("opacity", "1");
	// The radios are the browser's own: an arrow key moves the choice, and
	// nothing in the ticket opens, closes or changes its height.
	const height = await page.locator(".docs-story-result article").evaluate((card) => card.getBoundingClientRect().height);
	await page.keyboard.press("ArrowDown");
	await expect(page.locator(".docs-story-result input[type='radio']").nth(1)).toBeChecked();
	await expect(page.locator(".docs-story-result input[type='radio']").nth(1)).toBeFocused();
	expect(await page.locator(".docs-story-result article").evaluate((card) => card.getBoundingClientRect().height)).toBe(height);
});

test("no demonstration on the home page opens or closes: no disclosure anywhere in it", async ({ page }) => {
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });
	// In the page and in every copy's shadow root.
	const found = await page.evaluate(() => {
		/** @param {Document | ShadowRoot} root @returns {number} */
		const count = (root) =>
			root.querySelectorAll("details, summary, [aria-expanded]").length +
			[...root.querySelectorAll("*")].reduce((sum, element) => sum + (element.shadowRoot ? count(element.shadowRoot) : 0), 0);
		return count(/** @type {Document} */ (/** @type {unknown} */ (document.querySelector("main"))));
	});
	expect(found).toBe(0);
	// And none in the specimens the listings show.
	for (const listing of await page.locator("main pre").allTextContents()) {
		expect(listing).not.toMatch(/<(details|summary)\b/);
	}
});

test("the markup comparison prints what its fixtures measure, with bars to scale", async ({ page }) => {
	const { compute, readResults } = require("../scripts/lib/markup-benchmark");
	const results = readResults();
	const fresh = compute();
	// The committed results are the fixtures' numbers.
	expect(results.metrics).toEqual(fresh.metrics);
	// The Cirth fixture is the hero's specimen, character for character.
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });
	const hero = (await page.locator(".docs-hero-source pre").textContent()) ?? "";
	expect(hero).toBe(results.sources.cirth);

	const cards = page.locator("[data-docs-bench-card]");
	await expect(cards).toHaveCount(fresh.metrics.length);
	for (const [index, metric] of fresh.metrics.entries()) {
		const card = cards.nth(index);
		await expect(card.locator("h3")).toHaveText(metric.label);
		// Every value is text, next to the name of what it measures.
		const rows = await card.locator(".docs-bench-rows > div").evaluateAll((items) =>
			items.map((item) => {
				const bar = /** @type {Element} */ (item.querySelector(".docs-bench-bar"));
				return {
					id: /** @type {HTMLElement} */ (item).dataset.implementation,
					name: item.querySelector("dt")?.textContent,
					value: Number(item.querySelector("data")?.getAttribute("value")),
					text: item.querySelector("data")?.textContent,
					hidden: bar.getAttribute("aria-hidden"),
					share: Number.parseFloat(getComputedStyle(bar, "::before").width) / bar.getBoundingClientRect().width,
				};
			}),
		);
		expect(rows.map((row) => row.id)).toEqual(fresh.implementations.map((implementation) => implementation.id));
		for (const row of rows) {
			const id = String(row.id);
			const implementation = fresh.implementations.find((entry) => entry.id === id);
			const value = metric.values[id];
			expect(row.name).toBe(implementation?.label);
			expect(row.value).toBe(value);
			expect(row.text?.replace(/\s/g, " ")).toBe(`${value.toLocaleString("en-GB")}${metric.unit ? ` ${metric.unit}` : ""}`);
			// A bar is its value over the larger of the two, and decoration.
			expect(row.share).toBeCloseTo(value / Math.max(...Object.values(metric.values)), 2);
			expect(row.hidden).toBe("true");
		}
		const reduction = Math.round(((metric.values.utility - metric.values.cirth) / metric.values.utility) * 100);
		await expect(card.locator(".docs-bench-result")).toHaveText(`${reduction}% ${metric.result}`);
	}
	// The headline is the result's, the method is on the page, and the
	// way to the fixtures leads somewhere that exists.
	const lessMarkup = fresh.metrics.every((metric) => metric.reduction > 0);
	await expect(page.locator("#bench-title")).toHaveText(lessMarkup ? "Less markup to maintain." : "The same card, measured twice.");
	await expect(page.locator(".docs-bench")).not.toContainText(/faster|quicker|performance|productiv/i);
	await expect(page.locator(".docs-bench-method")).toContainText("Not counted");
	await expect(page.locator(".docs-bench-method time")).toHaveAttribute("datetime", results.measured);
	// The link is written as the page's other links are (no trailing slash,
	// which the host resolves); this test's server needs the slash.
	await expect(page.locator(".docs-bench a[href='/why-cirth#less-markup-measured']")).toHaveCount(1);
	await page.goto(`${origin}/why-cirth/#less-markup-measured`, { waitUntil: "networkidle" });
	await expect(page.locator("#less-markup-measured")).toBeVisible();
	await expect(page.locator("main")).toContainText("(utility-first - Cirth) / utility-first");
	for (const source of Object.values(results.sources)) {
		const listings = await page.locator("main pre").allTextContents();
		expect(listings.some((listing) => listing.trim() === String(source).trim())).toBe(true);
	}
});

test("your theme starts as Cirth ships, then changes one declaration at a time with the scroll, and changes back", async ({ page }) => {
	const themeDemo = require("../docs/src/_data/themeDemo.js");
	await held(page);
	const read = () =>
		page.locator("[data-docs-theme]").evaluate((section) => {
			const root = /** @type {ShadowRoot} */ (section.querySelector(".docs-theme-copy")?.shadowRoot);
			const surface = /** @type {Element} */ (root.querySelector(".cirth"));
			const card = /** @type {Element} */ (root.querySelector("article")).getBoundingClientRect();
			const listing = /** @type {Element} */ (section.querySelector("[data-docs-theme-listing]"));
			return {
				state: /** @type {HTMLElement} */ (section).dataset.state,
				lines: [...listing.querySelectorAll(".docs-theme-line")].filter((line) => !(/** @type {HTMLElement} */ (line).hidden)).map((line) => String(line.textContent).trim()),
				changed: [...listing.querySelectorAll("[data-changed]")].map((line) => /** @type {HTMLElement} */ (line).dataset.docsThemeFrom),
				current: [...section.querySelectorAll("[data-docs-theme-step][data-current]")].map((step) => /** @type {HTMLElement} */ (step).dataset.docsThemeStep),
				enabled: [...root.querySelectorAll("style[data-docs-theme-state]")].filter((style) => /** @type {HTMLStyleElement} */ (style).media !== "not all").map((style) => /** @type {HTMLElement} */ (style).dataset.docsThemeState),
				tokens: ["--cirth-primary", "--cirth-border-radius", "--cirth-canvas"].map((name) => getComputedStyle(surface).getPropertyValue(name).trim()),
				page: ["--cirth-primary", "--cirth-border-radius", "--cirth-canvas"].map((name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()),
				card: [card.width, card.height].map(Math.round).join("x"),
			};
		});
	const points = [0.05, 0.3, 0.52, 0.85];
	/** @type {string[]} */
	const cards = [];
	for (const [index, p] of points.entries()) {
		await goTo(page, "[data-docs-theme]", p);
		const state = themeDemo.states[index];
		const at = await read();
		expect(at.state, `at ${p}`).toBe(state.id);
		expect(at.changed).toEqual(state.changes ? [state.id] : []);
		expect(at.current).toEqual(state.changes ? [state.id] : []);
		// The listing holds the declarations applied so far, and says so when there are none.
		const applied = themeDemo.changes.slice(0, index).map((step) => `${step.changes}: ${step.values[String(step.changes)]};`);
		expect(at.lines).toEqual(index === 0 ? ["/* No overrides: Cirth as it ships. */"] : applied);
		if (index === 0) {
			// Nothing is declared: no state's stylesheet is on, and the copy's
			// tokens are the ones Cirth gives this page.
			expect(at.enabled).toEqual([]);
			expect(at.tokens).toEqual(at.page);
		} else {
			expect(at.enabled).toEqual([state.id]);
		}
		cards.push(at.card);
	}
	// The card keeps its size through every state.
	expect(new Set(cards).size, cards.join(" ")).toBe(1);
	for (const [index, p] of [...points.entries()].reverse()) {
		await goTo(page, "[data-docs-theme]", p);
		expect((await read()).state, `back at ${p}`).toBe(themeDemo.states[index].id);
	}
	// No play or pause control: the scroll is the only thing that moves it.
	await expect(page.locator(".docs-theme button", { hasText: /play|pause|stop/i })).toHaveCount(0);
});

test("your theme's card is live: every control answers the pointer and the keyboard, and keeps its size", async ({ page, browserName }) => {
	test.setTimeout(120_000);
	await held(page);
	await goTo(page, "[data-docs-theme]", 0.85);
	const copy = page.locator(".docs-theme-copy");
	// Not a picture: no inert and no pointer-events: none, on it or above it.
	expect(
		await copy.evaluate((element) => {
			for (let node = /** @type {Element | null} */ (element); node; node = node.parentElement) {
				if (node.hasAttribute("inert") || getComputedStyle(node).pointerEvents === "none") return false;
			}
			return true;
		}),
	).toBe(true);
	/** A control's box and the colours that tell its state. */
	const look = (/** @type {import("@playwright/test").Locator} */ control) =>
		control.evaluate((element) => {
			const box = element.getBoundingClientRect();
			const own = getComputedStyle(element);
			return {
				box: [box.x, box.y, box.width, box.height].map((value) => Math.round(value * 10) / 10).join(","),
				paint: [own.backgroundColor, own.backgroundImage, own.boxShadow, own.borderTopColor].join(" | "),
				checked: element instanceof HTMLInputElement ? element.checked : null,
			};
		});
	const state = () => page.locator("[data-docs-theme]").getAttribute("data-state");
	const settled = await state();
	const controls = {
		radio: copy.locator("fieldset input[type='radio']").nth(1),
		checkbox: copy.locator("input[type='checkbox']"),
		secondary: copy.locator("footer button.secondary"),
		primary: copy.locator("footer button:not(.secondary)"),
	};
	for (const [name, control] of Object.entries(controls)) {
		const button = name === "primary" || name === "secondary";
		// Buttons that cannot submit anything; choices that keep their place.
		await expect(control).toHaveAttribute("type", button ? "button" : /^(radio|checkbox)$/);
		const rest = await look(control);
		await control.hover();
		await page.waitForTimeout(250);
		const hover = await look(control);
		expect(hover.paint, `${name}: hover shows`).not.toBe(rest.paint);
		const box = /** @type {{ x: number, y: number, width: number, height: number }} */ (await control.boundingBox());
		await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
		await page.mouse.down();
		const active = await look(control);
		await page.mouse.up();
		await page.waitForTimeout(250);
		const after = await look(control);
		if (button) expect(active.paint, `${name}: pressed shows`).not.toBe(hover.paint);
		else expect(after.checked, `${name}: a click changes its state`).toBe(!rest.checked);
		// No state moves or resizes the control.
		expect([hover.box, active.box, after.box], name).toEqual([rest.box, rest.box, rest.box]);
		await page.mouse.move(0, 0);
	}
	// The keyboard walks into the card in the page's order, and every stop
	// shows a ring; walking it moves nothing and changes no state.
	await page.locator(".docs-theme-code").focus();
	const scroll = await page.evaluate(() => window.scrollY);
	const stops = [];
	for (let index = 0; index < 5; index += 1) {
		// WebKit, as Safari does by default, reaches buttons and choices with
		// Option+Tab; Tab alone is the text fields and links.
		await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
		stops.push(
			await page.evaluate(() => {
				let element = document.activeElement;
				while (element?.shadowRoot?.activeElement) element = element.shadowRoot.activeElement;
				return {
					inCard: Boolean(element && element.getRootNode() instanceof ShadowRoot),
					visible: Boolean(element?.matches(":focus-visible")),
					ring: Boolean(element && getComputedStyle(element).outlineStyle !== "none" && Number.parseFloat(getComputedStyle(element).outlineWidth) > 0),
				};
			}),
		);
	}
	// The first stop is the listing's copy control; the four after it are the card's.
	expect(stops.slice(1).map((stop) => stop.inCard)).toEqual([true, true, true, true]);
	for (const stop of stops) expect(stop.visible && stop.ring).toBe(true);
	expect(await page.evaluate(() => window.scrollY)).toBe(scroll);
	expect(await state()).toBe(settled);
});

test("every scene is a frame of about one window at desktop and laptop sizes, and nothing in it is cut", async ({ page }) => {
	// Three windows, ten scroll positions each.
	test.setTimeout(180_000);
	await page.emulateMedia({ reducedMotion: "no-preference" });
	for (const [width, height] of [[1440, 900], [1280, 800], [1024, 768]]) {
		await page.setViewportSize({ width, height });
		await page.goto(`${origin}/`, { waitUntil: "networkidle" });
		await expect(page.locator(".docs-home")).toHaveAttribute("data-stage", "held");
		const header = await page.locator(".docs-header").evaluate((element) => element.getBoundingClientRect().height);
		const frame = height - header;
		// The scenes that are not held: at least a window below the header,
		// and no more than that where what they hold fits one.
		for (const selector of [".docs-glance", ".docs-presets", ".docs-agnostic", ".docs-pure"]) {
			const section = await page.locator(selector).evaluate((element) => element.getBoundingClientRect().height);
			expect(section, `${selector} at ${width}x${height}`).toBeGreaterThanOrEqual(frame - 2);
			expect(section, `${selector} at ${width}x${height}`).toBeLessThanOrEqual(frame + 2);
		}
		expect(await page.locator(".docs-hero").evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(frame - 2);
		// The held scenes: at every point of their scroll, everything they
		// draw is between the header and the bottom of the window.
		// The comparison is held for under half a window more than a window.
		const bench = await page.locator(".docs-bench").evaluate((element) => element.getBoundingClientRect().height);
		expect(bench / height, `the comparison at ${width}x${height}`).toBeGreaterThanOrEqual(1.25);
		expect(bench / height, `the comparison at ${width}x${height}`).toBeLessThanOrEqual(1.5);
		for (const [selector, points] of /** @type {[string, number[]][]} */ ([["[data-docs-story]", [0, 0.2, 0.5, 0.85]], ["[data-docs-bench]", [0.5, 1]], ["[data-docs-theme]", [0.05, 0.85]]])) {
			for (const p of points) {
				await goTo(page, selector, p);
				const extent = await page.locator(selector).evaluate((section) => {
					let top = Infinity;
					let bottom = -Infinity;
					for (const element of /** @type {Element} */ (section.firstElementChild).querySelectorAll("h2, p, pre, figure, li, article")) {
						const box = element.getBoundingClientRect();
						if (!box.height || Number(getComputedStyle(element).opacity) === 0) continue;
						top = Math.min(top, box.top);
						bottom = Math.max(bottom, box.bottom);
					}
					return { top, bottom };
				});
				expect(extent.top, `${selector} at ${p}, ${width}x${height}: under the header`).toBeGreaterThanOrEqual(header - 1);
				expect(extent.bottom, `${selector} at ${p}, ${width}x${height}: inside the window`).toBeLessThanOrEqual(height + 1);
			}
		}
		expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
	}
	// The footer keeps its own height; on a phone the figures are not a
	// window tall, only as tall as they are.
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });
	expect(await page.locator(".docs-footer").evaluate((element) => element.getBoundingClientRect().height)).toBeLessThan(800);
	await page.setViewportSize({ width: 390, height: 844 });
	expect(["auto", "0px"]).toContain(await page.locator(".docs-glance").evaluate((element) => getComputedStyle(element).minHeight));
});

test("the markup comparison composes as the reader scrolls in, holds still, and comes apart backwards", async ({ page }) => {
	await held(page);
	/** Each part's progress when the section's top is `share` of the window down (negative: above it). */
	const at = async (/** @type {number} */ share) => {
		await page.locator("[data-docs-bench]").evaluate((section, value) => {
			window.scrollTo(0, section.getBoundingClientRect().top + window.scrollY - window.innerHeight * value);
		}, share);
		await settle(page);
		return page.locator("[data-docs-bench]").evaluate((section) => {
			const read = (/** @type {Element} */ element, /** @type {string} */ name) => Number(/** @type {HTMLElement} */ (element).style.getPropertyValue(name));
			const cards = [...section.querySelectorAll("[data-docs-bench-card]")];
			return {
				p: Number(/** @type {HTMLElement} */ (section).dataset.progress),
				head: read(section, "--docs-head"),
				card: cards.map((card) => read(card, "--docs-card")),
				bar: cards.map((card) => read(card, "--docs-bar")),
				result: cards.map((card) => read(card, "--docs-result")),
				sticky: getComputedStyle(/** @type {Element} */ (section.querySelector(".docs-bench-scene"))).position,
			};
		});
	};
	const shares = [0.8, 0.5, 0.3, 0.1, -0.05, -0.2, -0.45];
	/** @type {Awaited<ReturnType<typeof at>>[]} */
	const forward = [];
	for (const share of shares) forward.push(await at(share));
	expect(forward[0].sticky).toBe("sticky");
	// Before it, nothing; at the end of its hold, everything.
	expect([forward[0].head, ...forward[0].card, ...forward[0].bar, ...forward[0].result]).toEqual([0, 0, 0, 0, 0, 0, 0]);
	const last = forward.at(-1);
	expect([last?.p, last?.head, ...(last?.card ?? []), ...(last?.bar ?? []), ...(last?.result ?? [])]).toEqual([1, 1, 1, 1, 1, 1, 1, 1]);
	// In order: the copy leads, the first card leads the second, a card
	// is in before its bars, and its bars before its result.
	for (const point of forward) {
		expect(point.head).toBeGreaterThanOrEqual(point.card[0]);
		expect(point.card[0]).toBeGreaterThanOrEqual(point.card[1]);
		for (const index of [0, 1]) {
			expect(point.card[index]).toBeGreaterThanOrEqual(point.bar[index]);
			expect(point.bar[index]).toBeGreaterThanOrEqual(point.result[index]);
		}
	}
	// Every part only grows on the way in...
	for (let index = 1; index < forward.length; index += 1) {
		expect(forward[index].p).toBeGreaterThanOrEqual(forward[index - 1].p);
		for (const key of /** @type {const} */ (["card", "bar", "result"])) {
			forward[index][key].forEach((value, card) => expect(value).toBeGreaterThanOrEqual(forward[index - 1][key][card]));
		}
	}
	// ...and some point shows it part way, so it is a sequence, not a switch.
	expect(forward.some((point) => point.card.some((value) => value > 0.05 && value < 0.95))).toBe(true);
	// The last stretch holds still and complete.
	expect((await at(-0.35)).result).toEqual([1, 1]);
	// Backwards, the same states at the same places.
	for (const [index, share] of [...shares.entries()].reverse()) {
		const back = await at(share);
		expect(back, `back at ${share}`).toEqual(forward[index]);
	}
	// The numbers are text, whole, at every point: only their cards move.
	await at(0.3);
	await expect(page.locator("[data-docs-bench-card] data").first()).toHaveText("0");
	// Opacity and transforms only: the cards never change their box.
	const boxes = () => page.locator("[data-docs-bench-card]").evaluateAll((cards) => cards.map((card) => /** @type {HTMLElement} */ (card).offsetTop + "/" + /** @type {HTMLElement} */ (card).offsetHeight));
	const early = await boxes();
	await at(-0.45);
	expect(await boxes()).toEqual(early);
});

test("the close is one message: the real command and the way to get started", async ({ page }) => {
	await held(page);
	const close = page.locator(".docs-pure");
	await expect(close.locator("h2")).toHaveText("Your HTML is already enough.");
	await expect(close.locator("h2")).toHaveCount(1);
	await expect(close).toContainText("No component runtime and no client-side bundle to initialize.");
	await expect(close.locator(".docs-close-eyebrow")).toHaveText("Pure CSS");
	// The command is the package's real one, with the shell's copy control.
	const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"), "utf8"));
	await expect(close.locator("pre code")).toHaveText(`npm install ${manifest.name}`);
	await expect(close.locator("pre button.copy")).toHaveAttribute("aria-label", "Copy to clipboard");
	// The figures are said once, in their own section; the close repeats none.
	await expect(close.locator("dl, ul, strong")).toHaveCount(0);
	// One way on, the first of two actions.
	const actions = close.locator(".docs-close-actions a");
	await expect(actions).toHaveCount(2);
	await expect(actions.first()).toHaveText("Get started");
	await expect(actions.first()).toHaveAttribute("href", "/installation");
	await expect(actions.first()).not.toHaveClass(/secondary|outline/);
	// Nothing drawn: no diagram, no connector, no list of stacks, no mark.
	await expect(close.locator("svg, img, ol, [data-docs-pipe], [data-docs-pipe-stage]")).toHaveCount(0);

	// It comes up in order as it arrives: the command, then the actions.
	await page.locator(".docs-close-install").evaluate((element) => {
		window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - window.innerHeight + 40);
	});
	await settle(page);
	const arriving = await close.locator(".docs-close-install, .docs-close-actions").evaluateAll((items) => items.map((item) => Number(getComputedStyle(item).opacity)));
	expect(arriving[0]).toBeGreaterThan(arriving[1]);
	await page.keyboard.press("End");
	await page.waitForFunction(() => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2);
	await page.waitForTimeout(500);
	await settle(page);
	for (const opacity of await close.locator("[data-reveal]").evaluateAll((items) => items.map((item) => getComputedStyle(item).opacity))) expect(opacity).toBe("1");
});

test("the presets' import is the one the package exports for the preset chosen, and the frame keeps its size", async ({ page }) => {
	const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"), "utf8"));
	await held(page);
	await expect(page.locator("#presets-title")).toHaveText("Pick a preset. Both schemes are ready.");
	await expect(page.locator(".docs-presets-tagline")).toHaveText("Same markup. Same components. Two coordinated schemes.");
	await expect(page.locator(".docs-presets a[href='/presets']")).toHaveText("Compare every preset");
	const select = page.locator("[data-docs-compare-preset]");
	const options = await select.locator("option").evaluateAll((items) => items.map((item) => /** @type {HTMLOptionElement} */ (item).value));
	expect(options).toEqual(["default", "material", "metro", "plain"]);
	const sizes = new Set();
	for (const name of options) {
		await select.selectOption(name);
		const shown = page.locator("[data-docs-compare-import][data-current]");
		await expect(shown).toHaveAttribute("data-docs-compare-import", name);
		const lines = ((await shown.innerText()) ?? "").split("\n").map((line) => line.trim()).filter(Boolean);
		expect(lines[0]).toBe('@import "@cirthcss/cirth";');
		if (name === "default") expect(lines).toHaveLength(1);
		else {
			expect(lines).toEqual(['@import "@cirthcss/cirth";', `@import "@cirthcss/cirth/presets/${name}";`]);
			// The path is one the package really exports.
			expect(manifest.exports[`./presets/${name}`]).toBe(`./dist/presets/${name}.min.css`);
		}
		sizes.add(
			await page.locator(".docs-presets").evaluate((section) => {
				const imports = /** @type {Element} */ (section.querySelector("[data-docs-compare-imports]")).getBoundingClientRect();
				const frame = /** @type {Element} */ (section.querySelector(".docs-compare-frame")).getBoundingClientRect();
				return `${Math.round(imports.height)}/${Math.round(frame.height)}`;
			}),
		);
	}
	expect(sizes.size, "changing preset moves nothing").toBe(1);
});

test("one field of colour, fixed behind the page, carried by the scroll and still when the page is", async ({ page }) => {
	await held(page);
	const aurora = page.locator(".docs-aurora");
	const layer = await aurora.evaluate((element) => ({
		position: getComputedStyle(element).position,
		zIndex: getComputedStyle(element).zIndex,
		events: getComputedStyle(element).pointerEvents,
		glows: element.children.length,
		hidden: element.getAttribute("aria-hidden"),
	}));
	expect(layer).toEqual({ position: "fixed", zIndex: "-1", events: "none", glows: 3, hidden: "true" });
	// One layer for the whole page: no section paints a gradient of its own.
	const gradients = await page.locator("main > section").evaluateAll((sections) =>
		sections
			.filter((section) => /gradient/.test(getComputedStyle(section).backgroundImage) || /gradient/.test(getComputedStyle(section, "::before").backgroundImage))
			.map((section) => section.className),
	);
	expect(gradients).toEqual([]);
	// It is never what the pointer lands on.
	expect(await page.evaluate(() => document.elementFromPoint(720, 450)?.closest(".docs-aurora") ?? null)).toBeNull();

	/** Each glow's written x, y, scale, opacity and hue, by its class. */
	const field = () =>
		aurora.evaluate((element) =>
			Object.fromEntries(
				[...element.children].map((glow) => [
					glow.className,
					["x", "y", "scale", "opacity", "hue"].map((name) => /** @type {HTMLElement} */ (glow).style.getPropertyValue(`--docs-${name}`)),
				]),
			),
		);
	await goTo(page, "[data-docs-story]", 0.5);
	const story = await field();
	await page.locator(".docs-agnostic").evaluate((band) => {
		const element = /** @type {HTMLElement} */ (band);
		window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY + element.offsetHeight / 2 - window.innerHeight / 2);
	});
	await settle(page);
	const agnostic = await field();
	expect(agnostic).not.toEqual(story);
	// The gold glow is the stacks' own: out elsewhere, in there.
	expect(Number(story["docs-aurora-gold"][3])).toBeLessThan(Number(agnostic["docs-aurora-gold"][3]));
	// Nothing moves while the reader does not.
	await page.waitForTimeout(800);
	expect(await field()).toEqual(agnostic);
	// And it comes back to the same arrangement at the same place.
	await goTo(page, "[data-docs-story]", 0.5);
	expect(await field()).toEqual(story);
});

test("the scenes follow the scroll eased in time: a wheel's steps arrive as one movement, and land", async ({ page }) => {
	await held(page);
	await goTo(page, "[data-docs-story]", 0.3);
	const travel = await page.locator("[data-docs-story]").evaluate((section) => /** @type {HTMLElement} */ (section).offsetHeight - window.innerHeight);
	// Every frame: how far the scene is drawn behind the window, in pixels.
	await page.evaluate((length) => {
		const story = /** @type {HTMLElement} */ (document.querySelector("[data-docs-story]"));
		const top = story.getBoundingClientRect().top + window.scrollY;
		/** @type {number[]} */
		const behind = [];
		/** @type {any} */ (window).behind = behind;
		const sample = () => {
			behind.push(Math.abs(window.scrollY - (top + Number(story.dataset.progress) * length)));
			if (behind.length < 240) requestAnimationFrame(sample);
		};
		requestAnimationFrame(sample);
	}, travel);
	const box = /** @type {{ x: number, y: number, width: number, height: number }} */ (await page.locator(".docs-story-scene").boundingBox());
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	for (let index = 0; index < 6; index += 1) {
		await page.mouse.wheel(0, 120);
		await page.waitForTimeout(40);
	}
	// And straight back: a reversal is followed at once.
	for (let index = 0; index < 4; index += 1) {
		await page.mouse.wheel(0, -120);
		await page.waitForTimeout(40);
	}
	await settle(page);
	const behind = /** @type {number[]} */ (await page.evaluate(() => /** @type {any} */ (window).behind));
	// While the wheel turns, the scene trails the window (a wheel step is
	// not drawn as a jump); it never trails by more than the steps given.
	expect(Math.max(...behind)).toBeGreaterThanOrEqual(20);
	expect(Math.max(...behind)).toBeLessThanOrEqual(6 * 120);
	// It lands where the window is, and stops.
	const landed = await page.locator("[data-docs-story]").evaluate((section) => {
		const element = /** @type {HTMLElement} */ (section);
		const p = -element.getBoundingClientRect().top / (element.offsetHeight - window.innerHeight);
		return Math.abs(p - Number(element.dataset.progress));
	});
	expect(landed).toBeLessThanOrEqual(0.002);
	await expect(page.locator(".docs-home")).not.toHaveAttribute("data-animating", /.*/);

	// Under reduced motion the scenes are not eased at all.
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.mouse.wheel(0, 400);
	await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
	await expect(page.locator(".docs-home")).not.toHaveAttribute("data-animating", /.*/);
});

test("nothing runs while the page is still, and no animation is endless", async ({ page }) => {
	await held(page);
	await goTo(page, "[data-docs-theme]", 0.3);
	await page.waitForTimeout(1600);
	const snapshot = () =>
		page.evaluate(() => [
			[...document.querySelectorAll(".docs-aurora > span")].map((glow) => glow.getAttribute("style")).join("|"),
			document.querySelector("[data-docs-story]")?.getAttribute("style"),
			document.querySelector("[data-docs-theme]")?.getAttribute("data-state"),
			document.querySelector(".docs-agnostic-orbit")?.getAttribute("style"),
		]);
	const before = await snapshot();
	await page.waitForTimeout(1000);
	expect(await snapshot()).toEqual(before);
	const running = await page.evaluate(() =>
		document
			.getAnimations()
			.filter((animation) => animation.playState === "running")
			.map((animation) => ({
				iterations: animation.effect?.getComputedTiming().iterations,
				duration: Number(animation.effect?.getComputedTiming().duration) || 0,
			})),
	);
	for (const animation of running) {
		expect(animation.iterations).not.toBe(Infinity);
		expect(animation.duration).toBeLessThanOrEqual(2000);
	}
});

test("no held scene covers the footer, and the page runs to its end", async ({ page }) => {
	await held(page);
	for (const selector of ["[data-docs-story]", "[data-docs-bench]", "[data-docs-theme]"]) {
		// Past the end of its section, a scene has let go: it ends where the
		// section ends.
		await goTo(page, selector, 1.15);
		const box = await page.locator(selector).evaluate((section) => {
			const scene = /** @type {Element} */ (section.firstElementChild);
			return { scene: scene.getBoundingClientRect().bottom, section: section.getBoundingClientRect().bottom };
		});
		expect(box.scene, selector).toBeLessThanOrEqual(box.section + 1);
	}
	await page.keyboard.press("End");
	await page.waitForFunction(() => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2);
	// End's scroll is animated too, and reaches the last pixels after the
	// line above is met: let it finish, or WebKit starts Home from a scroll
	// still under way and stops a pixel short of the top.
	await page.waitForTimeout(500);
	const footer = await page.evaluate(() => {
		const element = /** @type {Element} */ (document.querySelector(".docs-footer"));
		const box = element.getBoundingClientRect();
		const hit = document.elementFromPoint(box.left + 40, Math.min(box.bottom, window.innerHeight) - 20);
		return { inView: box.top < window.innerHeight, own: Boolean(hit && element.contains(hit)) };
	});
	expect(footer).toEqual({ inView: true, own: true });
	// Page Down walks the page like any other: no snapping, no hold.
	await page.keyboard.press("Home");
	await page.waitForFunction(() => window.scrollY === 0);
	// The page scrolls smoothly; let Home's scroll settle before the next key.
	await page.waitForTimeout(500);
	await page.keyboard.press("PageDown");
	await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
	await expect(page.locator("html")).not.toHaveCSS("scroll-snap-type", /mandatory/);
});

test("a fragment, a reload and the back button land on the state of where they land", async ({ page }) => {
	await page.emulateMedia({ reducedMotion: "no-preference" });
	await page.setViewportSize({ width: 1440, height: 900 });
	for (const id of ["story-title", "bench-title", "theme-title", "presets-title", "agnostic-title", "pure-title"]) {
		await page.goto(`${origin}/#${id}`, { waitUntil: "load" });
		await expect(page.locator(`#${id}`)).toBeInViewport();
		await expect(page.locator(`#${id}`)).toHaveCSS("opacity", "1");
	}
	// The theme's title is at the top of its held scene: the scene says the
	// state that point of the scroll is.
	await page.goto(`${origin}/#theme-title`, { waitUntil: "load" });
	await expect(page.locator("[data-docs-theme]")).toHaveAttribute("data-state", /^(start|accent|corners|canvas)$/);

	// A reload in the middle of the story, and away and back: wherever the
	// browser puts the page (Chromium and WebKit restore the scroll, Firefox
	// may not), the story shows the state of that point of the scroll.
	/** The progress the geometry says, the one the scene says, and its step. */
	const landed = () =>
		page.locator("[data-docs-story]").evaluate((section) => {
			const element = /** @type {HTMLElement} */ (section);
			const travel = element.offsetHeight - window.innerHeight;
			const p = Math.min(1, Math.max(0, -element.getBoundingClientRect().top / travel));
			return {
				geometry: Number(p.toFixed(3)),
				scene: Number(element.dataset.progress),
				step: element.dataset.step,
				// Fresh from a load, the stage's lines are exact: half way in
				// for the browser's picture (0.41) and for Cirth's (0.68).
				expected: p < 0.41 ? "1" : p < 0.68 ? "2" : "3",
			};
		});
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });
	await goTo(page, "[data-docs-story]", 0.55);
	expect((await landed()).step).toBe("2");
	for (const move of ["reload", "back"]) {
		if (move === "reload") await page.reload({ waitUntil: "load" });
		else {
			await page.goto(`${origin}/installation/`, { waitUntil: "load" });
			await page.goBack({ waitUntil: "load" });
		}
		await page.waitForTimeout(600);
		await settle(page);
		const at = await landed();
		expect(Math.abs(at.geometry - at.scene), `${move}: the scene's progress is the page's`).toBeLessThanOrEqual(0.002);
		expect(at.step, move).toBe(at.expected);
	}
});

test("with reduced motion every scene is complete and nothing moves", async ({ page }) => {
	const themeDemo = require("../docs/src/_data/themeDemo.js");
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });
	await expect(page.locator(".docs-home")).toHaveAttribute("data-motion", "still");
	await expect(page.locator(".docs-home")).toHaveAttribute("data-stage", "column");
	// Markup, browser and Cirth, all there.
	for (const part of ["1", "2", "3"]) await expect(page.locator(`[data-docs-story-part="${part}"]`)).toHaveCSS("opacity", "1");
	await expect(page.locator("[data-docs-story-typed]")).toBeHidden();
	// Every step reached and none of them marked current, the finished
	// theme, the comparison composed with every bar at its length, and
	// nothing eased.
	expect(await page.locator("[data-docs-story-step][data-reached]").count()).toBe(3);
	await expect(page.locator("[data-docs-story-step][aria-current]")).toHaveCount(0);
	await expect(page.locator("[data-docs-theme]")).toHaveAttribute("data-state", themeDemo.final.id);
	for (const bar of await page.locator(".docs-bench-bar").all()) expect(await bar.evaluate((element) => getComputedStyle(element, "::before").scale)).toBe("1");
	for (const card of await page.locator("[data-docs-bench-card]").all()) await expect(card).toHaveCSS("opacity", "1");
	await expect(page.locator(".docs-bench-scene")).toHaveCSS("position", "static");
	await expect(page.locator(".docs-home")).not.toHaveAttribute("data-animating", /.*/);
	const hidden = await page.evaluate(() =>
		[...document.querySelectorAll("main [data-reveal]")].filter((element) => getComputedStyle(element).opacity !== "1").length,
	);
	expect(hidden).toBe(0);
	// No scene has a held height, and the field is the hero's, still.
	const heights = await page.locator("main > section").evaluateAll((sections) => sections.map((section) => section.getBoundingClientRect().height));
	for (const height of heights) expect(height).toBeLessThan(900 * 2.6);
	await page.mouse.wheel(0, 3000);
	await page.waitForTimeout(300);
	expect(await page.locator(".docs-aurora > [style]").count()).toBe(0);
	expect(await page.locator("[data-docs-story]").getAttribute("style")).toBeNull();
	expect(await page.evaluate(() => document.getAnimations().length), "something moves under reduced motion").toBe(0);
});

test("on a phone the story is three blocks in order, nothing cut and nothing held", async ({ page }) => {
	await page.emulateMedia({ reducedMotion: "no-preference" });
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });
	await expect(page.locator(".docs-home")).toHaveAttribute("data-stage", "column");
	const order = await page.locator(".docs-story-grid > *").evaluateAll((items) =>
		items.map((item) => {
			const element = /** @type {HTMLElement} */ (item);
			return element.dataset.docsStoryStep ? `text ${element.dataset.docsStoryStep}` : element.dataset.docsStoryPart ? `picture ${element.dataset.docsStoryPart}` : "head";
		}),
	);
	expect(order).toEqual(["head", "text 1", "picture 1", "text 2", "picture 2", "text 3", "picture 3"]);
	for (const part of ["1", "2", "3"]) {
		const picture = page.locator(`[data-docs-story-part="${part}"]`);
		await picture.evaluate((element) => element.scrollIntoView({ block: "center" }));
		await expect(picture).toHaveCSS("opacity", "1");
		// Its whole height, with no scroll of its own.
		const clipped = await picture.evaluate((element) =>
			[...element.querySelectorAll("*")].some((child) => child.scrollHeight > child.clientHeight + 1 && getComputedStyle(child).overflowY !== "visible"),
		);
		expect(clipped, `picture ${part} is cut`).toBe(false);
	}
	for (const scene of [".docs-story-scene", ".docs-bench-scene", ".docs-theme-scene"]) {
		await expect(page.locator(scene)).toHaveCSS("position", "static");
	}
	await expect(page.locator("[data-docs-story-typed]")).toBeHidden();
});

// Pages a reader meets first, at every width from a phone up.
const firstPages = [
	"/",
	"/installation/",
	"/installation/laravel/",
	"/installation/django/",
	"/installation/phoenix/",
	"/installation/wordpress/",
	"/installation/yew/",
	"/installation/vite/",
	"/installation/nextjs/",
	"/installation/lit/",
	"/installation/rails/",
	"/installation/blazor/",
	"/installation/hugo/",
	"/installation/electron/",
	"/installation/dioxus/",
	"/compatibility/",
	"/forms/select/",
	"/forms/checkbox-radio-switch/",
	"/content/link/",
	"/customization/",
	"/brand/",
];

test("no page scrolls sideways from 320px up, and none logs an error", async ({ page }) => {
	test.setTimeout(300_000);
	/** @type {string[]} */
	const errors = [];
	page.on("pageerror", (error) => errors.push(String(error)));
	page.on("console", (message) => {
		if (message.type() === "error") errors.push(message.text());
	});
	for (const url of firstPages) {
		for (const width of [320, 390, 768, 1024, 1440]) {
			await page.setViewportSize({ width, height: 900 });
			await page.goto(`${origin}${url}`, { waitUntil: "networkidle" });
			const overflow = await page.evaluate(
				() => document.documentElement.scrollWidth - document.documentElement.clientWidth,
			);
			expect(overflow, `${url} at ${width}px`).toBeLessThanOrEqual(0);
		}
	}
	expect(errors).toEqual([]);
});
