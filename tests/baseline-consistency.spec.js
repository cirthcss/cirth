const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");
const {
	assertDocsBuilt,
	createServer,
	listPages,
	startServer,
} = require("../scripts/lib/docs-site");

// The consistency contract the Native Baseline pass settled: one card
// contract, one button geometry, one active-navigation marker, and no
// surface that quietly opted out of them.
//
// Each test below pins a specific regression that had actually shipped, so
// a failure here names the thing that came back rather than "the design
// changed" — that is what the screenshot baselines are for.

assertDocsBuilt("baseline-consistency.spec");

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
 * @param {import("@playwright/test").Locator} locator
 * @param {string[]} properties
 */
const styleOf = (locator, properties) =>
	locator.evaluate((element, props) => {
		const computed = /** @type {Record<string, string>} */ (
			/** @type {unknown} */ (getComputedStyle(element))
		);
		/** @type {Record<string, string>} */
		const out = {};
		for (const property of props) out[property] = computed[property];
		return out;
	}, properties);

// --- Buttons are flat, and every variant is flat in the same way --------

test("every button variant carries the same border on all four sides", async ({
	page,
}) => {
	await page.goto(`${origin}/content/button/`, { waitUntil: "networkidle" });

	const buttons = page.locator(
		'.docs-demo-preview :is(button, [role="button"], [type="submit"], [type="reset"], [type="button"])',
	);
	const count = await buttons.count();

	expect(count, "the button page renders its examples").toBeGreaterThan(5);

	for (let index = 0; index < count; index++) {
		const button = buttons.nth(index);
		const label = (await button.getAttribute("class")) || "(no variant)";
		const style = await styleOf(button, [
			"borderTopWidth",
			"borderRightWidth",
			"borderBottomWidth",
			"borderLeftWidth",
			"borderTopColor",
			"borderBottomColor",
		]);

		// A thicker or darker bottom edge is the 3D "registration" relief
		// this baseline removed: outline buttons kept it while filled ones
		// did not, so the two variants had different geometry.
		expect(style.borderBottomWidth, `${label}: bottom vs top width`).toBe(
			style.borderTopWidth,
		);
		expect(style.borderLeftWidth, `${label}: left vs right width`).toBe(
			style.borderRightWidth,
		);
		expect(style.borderTopWidth, `${label}: vertical vs horizontal`).toBe(
			style.borderLeftWidth,
		);
		expect(style.borderBottomColor, `${label}: bottom edge is not darkened`).toBe(
			style.borderTopColor,
		);
	}
});

test("a pressed button does not translate", async ({ page }) => {
	await page.goto(`${origin}/content/button/`, { waitUntil: "networkidle" });

	const button = page.locator(".docs-demo-preview button").first();
	await button.hover();
	await page.mouse.down();
	const pressed = await styleOf(button, ["transform"]);
	await page.mouse.up();

	expect(pressed.transform).toBe("none");
});

// --- The card contract -------------------------------------------------

test("the hero demo surface uses the card radius and clips its panels", async ({
	page,
}) => {
	await page.goto(origin, { waitUntil: "networkidle" });

	// One plate per region now; the source card is the one that has to clip
	// a code pane running flush to its own edge.
	const figure = page.locator(".docs-source-panel");
	const style = await styleOf(figure, [
		"borderTopLeftRadius",
		"borderBottomRightRadius",
		"overflow",
	]);
	const cardRadius = await page.evaluate(() =>
		getComputedStyle(document.documentElement)
			.getPropertyValue("--cirth-card-border-radius")
			.trim(),
	);

	// The outer surface was square while the sign-in card it renders inside
	// itself was rounded.
	expect(style.borderTopLeftRadius).not.toBe("0px");
	expect(style.borderTopLeftRadius).toBe(style.borderBottomRightRadius);
	expect(cardRadius, "the shell reads the card radius token").not.toBe("");
	expect(["clip", "hidden"]).toContain(style.overflow);
});

test("the colour swatches paint a surface, not the canvas", async ({
	page,
}) => {
	await page.goto(`${origin}/colors/`, { waitUntil: "networkidle" });

	const swatch = page.locator(".docs-color-swatch").first();
	const surface = await styleOf(swatch, ["backgroundColor"]);
	const canvas = await styleOf(page.locator("body"), ["backgroundColor"]);

	// Transparent swatches let the label sit straight on the page, so the
	// card had a border but no body.
	expect(surface.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
	expect(surface.backgroundColor).not.toBe("transparent");
	expect(surface.backgroundColor).not.toBe(canvas.backgroundColor);
});

// The home page used to close with three cards built by the shell; it now
// renders its cards from the specimen strings the sections show the source
// of, so the contract worth pinning is the same one and the subject is
// stronger: these are <article> elements with no class on them at all, and
// if any of them picks up a shell treatment the page stops being able to
// claim the source beside it is all there is.
test("the home page's specimen cards all share one card contract", async ({
	page,
}) => {
	await page.goto(origin, { waitUntil: "networkidle" });

	/** @type {Record<string, string>[]} */
	const cards = [];
	const properties = [
		"borderTopWidth",
		"borderTopLeftRadius",
		"backgroundColor",
		"boxShadow",
		"padding",
	];

	// One example shows at a time, so each one is opened to be measured:
	// a card in a panel nobody looked at is exactly where a shell
	// treatment would go unnoticed.
	for (const id of ["article", "details", "form"]) {
		await page.locator(`[data-docs-tab="${id}"]`).click();
		await expect(page.locator(`[data-docs-panel="${id}"]`)).toBeVisible();
		cards.push(
			await styleOf(
				page.locator(`[data-docs-panel="${id}"] .docs-stage-preview article`),
				properties,
			),
		);
	}
	cards.push(
		await styleOf(
			page.locator(".docs-theme-showcase .docs-stage-preview article"),
			properties,
		),
	);

	const [first, ...rest] = cards;
	expect(cards.length).toBeGreaterThan(1);
	for (const card of rest) expect(card).toEqual(first);

	expect(first.boxShadow, "cards carry no decorative shadow").toBe("none");
});

// --- :visited must not repaint a card ----------------------------------

// The page-level half of this pair is gone with the three link-wrapped
// cards it looked at, and removing it costs no coverage: getComputedStyle
// reports the *unvisited* style for a visited link in every engine, by
// design, so a test that read colours off the page could only ever observe
// sameness whether the rule was right or wrong. The guarantee that does
// survive is the one below — the selector excludes card links in the first
// place — asserted against the built stylesheets.

test("the visited rule stands aside for a link wrapping a card", () => {
	// Asserted on the built stylesheets rather than through the page: the
	// same reason link-visited.spec.js does it there. :visited is
	// deliberately unobservable, so the guarantee that survives every engine
	// is that the selector excludes card links in the first place.
	for (const build of [
		"dist/cirth.css",
		"dist/cirth.classless.css",
		"dist/cirth.scoped.css",
	]) {
		const stylesheet = path.join(__dirname, "..", build);

		if (!fs.existsSync(stylesheet)) {
			throw new Error(
				`baseline-consistency.spec: ${build} not found: run \`npm run build\` first.`,
			);
		}

		const rule = fs
			.readFileSync(stylesheet, "utf8")
			.split("}")
			.find(
				(block) =>
					block.includes(":visited") &&
					block.includes("--cirth-link-visited-color"),
			);

		expect(rule, `${build} ships a visited rule`).toBeDefined();
		expect(rule, `${build} excludes card links`).toContain(":has(article)");
	}
});

// --- The open accordion keeps its bottom gutter ------------------------

test("an open disclosure keeps a bottom gutter whatever its last child is", async ({
	page,
}) => {
	for (const url of ["/", "/components/accordion/"]) {
		await page.goto(`${origin}${url}`, { waitUntil: "networkidle" });

		const scope = url === "/" ? ".docs-faq-list" : ".docs-demo-preview";
		const details = page.locator(`${scope} details:not(.dropdown)`);
		const count = await details.count();

		expect(count, `${url} renders disclosures`).toBeGreaterThan(0);

		for (let index = 0; index < count; index++) {
			const item = details.nth(index);
			await item.evaluate((element) => {
				/** @type {HTMLDetailsElement} */ (element).open = true;
			});

			// The gutter used to hang on the last child's margin-bottom, so a
			// page that zeroed that margin collapsed the content onto the
			// disclosure's own border.
			const gap = await item.evaluate((element) => {
				const last = element.lastElementChild;
				if (!last || last.tagName === "SUMMARY") return null;
				return (
					element.getBoundingClientRect().bottom -
					last.getBoundingClientRect().bottom
				);
			});

			if (gap === null) continue;

			expect(gap, `${url} disclosure ${index} bottom gutter`).toBeGreaterThan(
				8,
			);
		}
	}
});

// --- Navigation: one marker, squared against the rail ------------------

test("the active navigation item squares off on the rail side", async ({
	page,
}) => {
	await page.goto(`${origin}/about/`, { waitUntil: "networkidle" });

	const active = page.locator(
		'.docs-sidebar nav li a[aria-current="page"]',
	);
	const style = await styleOf(active, [
		"borderStartStartRadius",
		"borderEndStartRadius",
		"borderInlineStartWidth",
	]);

	// Logical corners, so this still describes the rail edge under RTL.
	expect(style.borderStartStartRadius).toBe("0px");
	expect(style.borderEndStartRadius).toBe("0px");
	expect(style.borderInlineStartWidth).not.toBe("0px");
});

test("the outline highlights an entry with exactly one indicator", async ({
	page,
}) => {
	await page.goto(`${origin}/about/`, { waitUntil: "networkidle" });

	const marker = await page
		.locator(".docs-toc a")
		.first()
		.evaluate((element) => {
			const before = getComputedStyle(element, "::before");
			return { content: before.content, width: before.width };
		});

	// The outline used to draw its own amber bar as a ::before on top of the
	// rail the framework already paints for aria-current.
	expect(["none", "normal", ""]).toContain(marker.content);
});

test("the sidebar group headers share the inline gutter of their entries", async ({
	page,
}) => {
	await page.goto(`${origin}/about/`, { waitUntil: "networkidle" });

	const summary = await styleOf(
		page.locator(".docs-sidebar details > summary").first(),
		["paddingInlineStart"],
	);
	const link = await styleOf(page.locator(".docs-sidebar nav li a").first(), [
		"paddingInlineStart",
	]);

	// Group headers sat flush at 0 while every entry under them was inset.
	expect(Number.parseFloat(summary.paddingInlineStart)).toBeGreaterThanOrEqual(
		8,
	);
	expect(summary.paddingInlineStart).toBe(link.paddingInlineStart);
});

// --- No separator under a page title -----------------------------------

test("no documentation page draws a rule under its title", async ({ page }) => {
	// Includes the four pages the old :first-child rule actually reached —
	// the reason this looked like it only affected some pages.
	const paths = [
		"/about/",
		"/brand/",
		"/colors/",
		"/get-started/",
		"/customization/",
		"/upgrading/",
		"/contributions/",
		"/components/card/",
		"/components/accordion/",
		"/content/button/",
		"/forms/",
		"/utilities/breakout/",
		"/utilities/reduce-motion/",
		"/utilities/truncate/",
	];

	for (const url of paths) {
		await page.goto(`${origin}${url}`, { waitUntil: "domcontentloaded" });

		const heading = page.locator(".docs-content > h1").first();
		const style = await styleOf(heading, [
			"borderBottomWidth",
			"borderBottomStyle",
		]);

		expect(
			style.borderBottomWidth === "0px" || style.borderBottomStyle === "none",
			`${url} draws a rule under its h1`,
		).toBe(true);
	}
});

// --- The card border stays in the neutral family ------------------------

test("the card and table borders keep a neutral hue in every theme", async ({
	page,
}) => {
	// --cirth-card-border-color mixes the field border toward the card
	// surface. Mixed `in oklch` that interpolated the *hue angle*, and the
	// card surface is an authored oklch() whose hue is an explicit 0deg
	// rather than a powerless one — so the 264deg field border took the
	// short way round the wheel and the most-used border in the library
	// landed at 323.52deg, a faint magenta with no other member of the
	// palette anywhere near it. Mixed `in oklab` there is no angle to
	// rotate. This asserts the outcome, not the mechanism: whatever the
	// derivation, the result has to stay in the family its inputs are in.
	for (const [preset, storage] of [
		["default", "amber"],
		["plain", "plain"],
		["playroom", "playroom"],
	]) {
		await page.goto(`${origin}/components/card/`, {
			waitUntil: "domcontentloaded",
		});
		await page.evaluate((value) => {
			sessionStorage.setItem("cirth-preset", value);
		}, storage);
		await page.reload({ waitUntil: "networkidle" });

		const hues = await page.evaluate(() => {
			const probe = document.createElement("div");
			document.body.append(probe);
			/** @param {string} token */
			const hueOf = (token) => {
				probe.style.color = `oklch(from var(${token}) 50% 0.2 h)`;
				const used = getComputedStyle(probe).color;
				const parts = used.match(/-?[\d.]+/g) ?? [];
				return Number.parseFloat(parts[2] ?? "NaN");
			};
			const out = {
				card: hueOf("--cirth-card-border-color"),
				table: hueOf("--cirth-table-border-color"),
				field: hueOf("--cirth-form-element-border-color"),
			};
			probe.remove();
			return out;
		});

		// Within 15deg of the neutral the border is derived from. The old
		// value missed by 59.5deg.
		for (const key of /** @type {const} */ (["card", "table"])) {
			const delta = Math.abs(((hues[key] - hues.field + 540) % 360) - 180);
			expect(
				delta,
				`${preset}: --cirth-${key}-border-color is ${hues[key].toFixed(
					2,
				)}deg against a ${hues.field.toFixed(2)}deg field border`,
			).toBeLessThan(15);
		}
	}
});

// --- The sticky header does not eat the viewport ------------------------

test("the documentation header stays under 120px at every desktop width", async ({
	page,
}) => {
	// The three header regions used to sit on equal 1fr outer tracks with a
	// minmax(16rem, 32rem) search between them. The search took its full
	// 32rem whenever it fitted, and from 1366px down to 1024px what was left
	// no longer held the control cluster, which wrapped: a 201px sticky
	// header, a quarter of a 1280x800 viewport, on every page.
	for (const width of [1024, 1100, 1280, 1366, 1440, 1600, 1920]) {
		await page.setViewportSize({ width, height: 800 });
		await page.goto(`${origin}/components/card/`, { waitUntil: "networkidle" });

		const height = await page
			.locator(".docs-header")
			.evaluate((element) => element.getBoundingClientRect().height);

		expect(height, `header is ${Math.round(height)}px at ${width}px`).toBeLessThan(
			120,
		);
	}
});

// --- Nothing readable is set below 12px ---------------------------------

test("no rendered text on the built site is smaller than 12px", async ({
	page,
}) => {
	// axe has nothing to say here — there is no AA success criterion on
	// minimum text size — which is exactly why 8px, 8.75px, 9px, 9.625px and
	// 10px had accumulated across the annotation layer, and why this is a
	// test rather than a review note.
	//
	// The floor applies to the *rendered* size, so a container counts as
	// under it when a shrinking child (small, code, kbd, samp — all 0.875em)
	// would land below: the shell's rule is that any such container starts
	// at --cirth-font-size-sm, and leaves take --cirth-font-size-xs.
	await page.setViewportSize({ width: 1280, height: 800 });

	/** @type {string[]} */
	const offenders = [];
	for (const file of listPages()) {
		const url = `/${file.replace(/index\.html$/, "")}`;
		await page.goto(`${origin}${url}`, { waitUntil: "domcontentloaded" });

		offenders.push(
			...(await page.evaluate((page) => {
				/** @type {string[]} */
				const found = [];
				for (const element of document.querySelectorAll("*")) {
					if (element.getClientRects().length === 0) continue;
					const size = Number.parseFloat(getComputedStyle(element).fontSize);
					if (size >= 12) continue;
					const hasText = [...element.childNodes].some(
						(node) => node.nodeType === 3 && node.nodeValue?.trim(),
					);
					if (!hasText) continue;
					found.push(
						`${page} ${element.tagName.toLowerCase()}` +
							`${element.className ? `.${String(element.className).trim().split(/\s+/).join(".")}` : ""}` +
							` at ${size}px: ${element.textContent?.trim().slice(0, 32)}`,
					);
				}
				return found;
			}, url)),
		);
	}

	expect(offenders, offenders.join("\n")).toEqual([]);
});

// --- The accent is action and position, never membership ----------------

test("navigation links reserve the accent for position, while header chrome uses weight", async ({
	page,
}) => {
	// Ordinary navigation is a position map: neutral ink plus one accent
	// edge for the current entry. Header navigation is application chrome,
	// and follows the navbar ladder Bootstrap defines — resting ink below
	// the hover step, hover below the current entry, and the current entry
	// at the emphasis ink rather than at whatever the header happens to
	// inherit. Neither convention paints membership with the action colour.
	for (const variant of ["amber", "plain", "playroom"]) {
		await page.goto(`${origin}/specimen/${variant}/`, {
			waitUntil: "networkidle",
		});

		const sample = await page.evaluate(() => {
			const probe = document.createElement("div");
			document.body.append(probe);
			probe.style.color = "var(--cirth-primary)";
			const accent = getComputedStyle(probe).color;
			probe.style.color = "var(--cirth-color)";
			const ink = getComputedStyle(probe).color;
			probe.style.color = "var(--cirth-muted-color)";
			const muted = getComputedStyle(probe).color;
			// The top of the ladder: the token whose whole job is full
			// contrast, which is what the current navbar entry now takes.
			probe.style.color = "var(--cirth-contrast)";
			const contrast = getComputedStyle(probe).color;
			probe.remove();

			const links = [...document.querySelectorAll("nav a:not([aria-current])")];
			const ordinaryLinks = links.filter((link) => !link.closest("header"));
			const headerLinks = links.filter((link) => link.closest("header"));
			const currentHeaderLink = document.querySelector(
				'header nav a[aria-current]:not([aria-current="false"])',
			);
			if (!currentHeaderLink) {
				throw new Error("the specimen has no current header navigation link");
			}
			const currentStyle = getComputedStyle(currentHeaderLink);
			return {
				accent,
				contrast,
				ink,
				muted,
				ordinaryColors: ordinaryLinks.map(
					(link) => getComputedStyle(link).color,
				),
				headerColors: headerLinks.map((link) => getComputedStyle(link).color),
				current: {
					borderBottomWidth: currentStyle.borderBottomWidth,
					color: currentStyle.color,
					fontWeight: currentStyle.fontWeight,
					textDecorationLine: currentStyle.textDecorationLine,
				},
			};
		});

		expect(sample.ordinaryColors.length).toBeGreaterThan(2);
		for (const color of sample.ordinaryColors) {
			expect(color, `${variant}: a resting nav link is painted the accent`).not.toBe(
				sample.accent,
			);
			expect(color, `${variant}: a resting nav link is not the page ink`).toBe(
				sample.ink,
			);
		}
		expect(sample.headerColors.length).toBeGreaterThan(0);
		for (const color of sample.headerColors) {
			expect(color, `${variant}: header navigation does not use secondary ink`).toBe(
				sample.muted,
			);
		}
		expect(sample.current).toEqual({
			borderBottomWidth: "0px",
			color: sample.contrast,
			fontWeight: "600",
			textDecorationLine: "none",
		});
		// Full contrast, and still not the accent: in chrome the accent
		// belongs to actions, and position is carried by contrast.
		expect(
			sample.contrast,
			`${variant}: the current header link is painted the accent`,
		).not.toBe(sample.accent);
		expect(
			sample.contrast,
			`${variant}: the current header link is not above the resting ink`,
		).not.toBe(sample.muted);
	}
});
