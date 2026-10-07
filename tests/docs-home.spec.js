const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
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
 * Scroll a held scene to `progress` (0 to 1) of its travel and wait for the
 * controller's frame.
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
	await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
};

/** @param {import("@playwright/test").Page} page */
const held = async (page) => {
	await page.emulateMedia({ reducedMotion: "no-preference" });
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });
	await expect(page.locator(".docs-home")).toHaveAttribute("data-stage", "held");
};

/** What the story shows: how much of the listing is typed, and each picture. */
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
		};
	});

test("the story types the markup, then shows the browser's picture, then Cirth's, with the scroll and back", async ({ page }) => {
	await held(page);
	const specimen = (await page.locator("[data-docs-story-code]").textContent()) ?? "";
	expect(specimen).toContain('<meter value="0.7" low="0.5" high="0.8" optimum="0">');

	await goTo(page, "[data-docs-story]", 0);
	let at = await storyAt(page);
	expect(at.typed).toBe(0);
	expect([at.step, at.browser, at.cirth]).toEqual(["1", 0, 0]);

	await goTo(page, "[data-docs-story]", 0.15);
	at = await storyAt(page);
	expect(at.typed).toBeGreaterThan(at.total * 0.3);
	expect(at.typed).toBeLessThan(at.total * 0.7);
	// The listing in the document is whole whatever is drawn.
	expect(at.whole).toBe(specimen);

	await goTo(page, "[data-docs-story]", 0.34);
	at = await storyAt(page);
	expect(at.typed).toBe(at.total);
	expect([at.step, at.browser, at.cirth]).toEqual(["1", 0, 0]);

	// The browser's picture stands for a long stretch before Cirth's.
	for (const p of [0.46, 0.55, 0.6]) {
		await goTo(page, "[data-docs-story]", p);
		at = await storyAt(page);
		expect([at.step, at.browser, at.cirth], `at ${p}`).toEqual(["2", 1, 0]);
	}

	// Cirth's is complete early, and holds to the end.
	for (const p of [0.72, 0.85, 1]) {
		await goTo(page, "[data-docs-story]", p);
		at = await storyAt(page);
		expect([at.step, at.browser, at.cirth], `at ${p}`).toEqual(["3", 0, 1]);
	}

	// And backwards: the same states at the same points.
	await goTo(page, "[data-docs-story]", 0.5);
	at = await storyAt(page);
	expect([at.step, at.browser, at.cirth]).toEqual(["2", 1, 0]);
	await goTo(page, "[data-docs-story]", 0.15);
	at = await storyAt(page);
	expect(at.typed).toBeLessThan(at.total);
	expect([at.browser, at.cirth]).toEqual([0, 0]);

	// The typing is a picture: hidden from assistive technology, never
	// announced, and the story has no live region at all.
	await expect(page.locator("[data-docs-story-typed]")).toHaveAttribute("aria-hidden", "true");
	await expect(page.locator("[data-docs-story] [aria-live]")).toHaveCount(0);
	// The scene is held under the header, for four to five windows.
	const geometry = await page.locator("[data-docs-story]").evaluate((story) => {
		const scene = /** @type {Element} */ (story.querySelector(".docs-story-scene"));
		return { section: story.getBoundingClientRect().height, position: getComputedStyle(scene).position };
	});
	expect(geometry.position).toBe("sticky");
	expect(geometry.section / 900).toBeGreaterThanOrEqual(4);
	expect(geometry.section / 900).toBeLessThanOrEqual(5);
});

test("the keyboard reaches the live ticket wherever the story is, and finds it visible", async ({ page }) => {
	await held(page);
	await goTo(page, "[data-docs-story]", 0.2);
	const summary = page.locator(".docs-story-result summary");
	await summary.focus();
	await expect(summary).toBeFocused();
	await expect(page.locator("[data-docs-story-part='3']")).toHaveCSS("opacity", "1");
	await page.keyboard.press("Enter");
	await expect(page.locator(".docs-story-result details")).toHaveAttribute("open", "");
});

test("the measured figures are read off the page and the build, and compose with the scroll", async ({ page }) => {
	await held(page);
	const specimen = (await page.locator("[data-docs-story-code]").textContent()) ?? "";
	const tags = [...specimen.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/g)];
	const figures = await page.locator(".docs-measured-figure strong").allTextContents();
	// No class in the ticket; no byte of script in the package; the default
	// build's size as gzip measures it.
	expect(tags.filter(([, , attributes]) => /\sclass=/.test(attributes))).toHaveLength(0);
	expect(figures[0]).toBe("0");
	await expect(page.locator(".docs-measured-tags li")).toHaveCount(tags.length);
	expect(await page.locator(".docs-measured-tags li").allTextContents()).toEqual(tags.map(([, name]) => name));
	const dist = path.join(__dirname, "../dist");
	/** @param {string} dir @returns {string[]} */
	const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]));
	const scripts = walk(dist).filter((file) => /\.(?:m?js|cjs|wasm)$/.test(file));
	expect(figures[1].replace(/\s/g, " ")).toBe(`${scripts.reduce((sum, file) => sum + fs.statSync(file).size, 0)} B`);
	const gzip = zlib.gzipSync(fs.readFileSync(path.join(dist, "cirth.min.css")), { level: 9 }).length;
	expect(Number.parseFloat(figures[2])).toBeCloseTo(gzip / 1024, 0);
	await expect(page.locator(".docs-measured-builds > div")).toHaveCount(4);
	// Every figure says what it was measured on.
	await expect(page.locator(".docs-measured-fact").nth(0)).toContainText("In the ticket above");
	await expect(page.locator(".docs-measured-fact").nth(1)).toContainText("dist/");
	await expect(page.locator(".docs-measured-fact").nth(2)).toContainText("measured on every build");

	const composed = () =>
		page.locator(".docs-measured-fact").evaluateAll((facts) => facts.map((fact) => Number(getComputedStyle(fact).getPropertyValue("--docs-fact"))));
	await goTo(page, "[data-docs-measured]", 0);
	const start = await composed();
	expect(start[2]).toBe(0);
	await goTo(page, "[data-docs-measured]", 0.9);
	expect(await composed()).toEqual([1, 1, 1]);
	await goTo(page, "[data-docs-measured]", 0);
	expect(await composed()).toEqual(start);
});

test("your theme changes one declaration at a time with the scroll, and changes back", async ({ page }) => {
	const themeDemo = require("../docs/src/_data/themeDemo.js");
	await held(page);
	const read = () =>
		page.locator("[data-docs-theme]").evaluate((section) => ({
			state: /** @type {HTMLElement} */ (section).dataset.state,
			changed: [...section.querySelectorAll("[data-docs-theme-token][data-changed]")].map((line) => /** @type {HTMLElement} */ (line).dataset.docsThemeToken),
			values: [...section.querySelectorAll("[data-docs-theme-token]")].map((line) =>
				[...line.querySelectorAll("[data-docs-theme-value]")].filter((value) => !(/** @type {HTMLElement} */ (value).hidden)).map((value) => value.textContent),
			),
			current: [...section.querySelectorAll("[data-docs-theme-step][data-current]")].map((step) => /** @type {HTMLElement} */ (step).dataset.docsThemeStep),
		}));
	const points = [0.05, 0.3, 0.52, 0.85];
	for (const [index, p] of points.entries()) {
		await goTo(page, "[data-docs-theme]", p);
		const state = themeDemo.states[index];
		const at = await read();
		expect(at.state, `at ${p}`).toBe(state.id);
		expect(at.changed).toEqual(state.changes ? [state.changes] : []);
		expect(at.current).toEqual(state.changes ? [state.id] : []);
		// Each line shows the one value the token has at this state.
		expect(at.values).toEqual(themeDemo.tokens.map((/** @type {string} */ token) => [state.values[token]]));
	}
	for (const [index, p] of [...points.entries()].reverse()) {
		await goTo(page, "[data-docs-theme]", p);
		expect((await read()).state, `back at ${p}`).toBe(themeDemo.states[index].id);
	}
	// No play or pause control: the scroll is the only thing that moves it.
	await expect(page.locator(".docs-theme button", { hasText: /play|pause|stop/i })).toHaveCount(0);
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

	const field = () =>
		aurora.evaluate((element) =>
			["warm-x", "warm-y", "warm-s", "warm-o", "warm-h", "cool-x", "gold-o"].map((name) => /** @type {HTMLElement} */ (element).style.getPropertyValue(`--docs-aurora-${name}`)),
		);
	await goTo(page, "[data-docs-story]", 0.5);
	const story = await field();
	await page.locator(".docs-agnostic").evaluate((band) => {
		const element = /** @type {HTMLElement} */ (band);
		window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY + element.offsetHeight / 2 - window.innerHeight / 2);
	});
	await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
	const agnostic = await field();
	expect(agnostic).not.toEqual(story);
	// The gold glow is the stacks' own: out elsewhere, in there.
	expect(Number(story[6])).toBeLessThan(Number(agnostic[6]));
	// Nothing moves while the reader does not.
	await page.waitForTimeout(800);
	expect(await field()).toEqual(agnostic);
	// And it comes back to the same arrangement at the same place.
	await goTo(page, "[data-docs-story]", 0.5);
	expect(await field()).toEqual(story);
});

test("nothing runs while the page is still, and no animation is endless", async ({ page }) => {
	await held(page);
	await goTo(page, "[data-docs-theme]", 0.3);
	await page.waitForTimeout(1600);
	const snapshot = () =>
		page.evaluate(() => [
			document.querySelector(".docs-aurora")?.getAttribute("style"),
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
	for (const selector of ["[data-docs-story]", "[data-docs-measured]", "[data-docs-theme]"]) {
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
	for (const id of ["story-title", "measured-title", "theme-title", "presets-title", "agnostic-title", "pure-title"]) {
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
				expected: p < 0.38 ? "1" : p < 0.66 ? "2" : "3",
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
		await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
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
	// The finished theme and every figure.
	await expect(page.locator("[data-docs-theme]")).toHaveAttribute("data-state", themeDemo.final.id);
	for (const fact of await page.locator(".docs-measured-fact").all()) await expect(fact).toHaveCSS("opacity", "1");
	const hidden = await page.evaluate(() =>
		[...document.querySelectorAll("main [data-reveal]")].filter((element) => getComputedStyle(element).opacity !== "1").length,
	);
	expect(hidden).toBe(0);
	// No scene has a held height, and the field is the hero's, still.
	const heights = await page.locator("main > section").evaluateAll((sections) => sections.map((section) => section.getBoundingClientRect().height));
	for (const height of heights) expect(height).toBeLessThan(900 * 2.6);
	await page.mouse.wheel(0, 3000);
	await page.waitForTimeout(300);
	expect(await page.locator(".docs-aurora").getAttribute("style")).toBeNull();
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
	for (const scene of [".docs-story-scene", ".docs-measured-scene", ".docs-theme-scene"]) {
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
