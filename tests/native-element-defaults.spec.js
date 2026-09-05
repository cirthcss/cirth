const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");
const { setContent } = require("./helpers/render");

// The defects the docs/core ownership audit found, pinned against the
// compiled stylesheet with no documentation shell anywhere near them.
//
// Every one of these was measured in a browser before it was fixed, and
// every one of them is wrong in any page that uses the markup — which is
// why they are library changes rather than shell overrides. The audit's
// own test is the one each case has to keep passing: if the documentation
// were deleted tomorrow and a real application were built on Cirth, would
// we still want this?

const projectRoot = path.join(__dirname, "..");

/** @param {string} file */
const read = (file) => {
	const stylesheet = path.join(projectRoot, file);
	if (!fs.existsSync(stylesheet)) {
		throw new Error(
			`native-element-defaults.spec: ${file} not found: run \`npm run build\` first.`,
		);
	}
	return fs.readFileSync(stylesheet, "utf8");
};

/** @type {[string, string][]} */
const builds = [
	["default", read("dist/cirth.css")],
	["classless", read("dist/cirth.classless.css")],
];

// Utilities are classes, so they exist in the default build only.
const defaultBuild = read("dist/cirth.css");

/**
 * @param {import("@playwright/test").Page} page
 * @param {string} css
 * @param {string} markup
 */
const render = (page, css, markup) =>
	setContent(page, `<style>${css}</style><main>${markup}</main>`);

// --- 1. The disclosure marker is centred on the line it belongs to ------

// summary::after floats, and a float aligns to the *top* of the line box it
// joins — so a marker shorter than the line sits high by half the
// difference. It was 16px of chevron in a 24px line (4px high) at the
// default type scale, and 16px in a 36px line (10px high) at 24px type,
// because the box was pinned to the root scale while the line followed the
// element. summary[role="button"] carried the correction alone.
for (const [name, css] of builds) {
	for (const [scale, wrapper] of [
		["default type", ""],
		["24px type", "font-size: 24px"],
	]) {
		test(`${name}: the summary marker is centred on its first line at ${scale}`, async ({
			page,
		}) => {
			await render(
				page,
				css,
				`<div style="${wrapper}">
					<details><summary id="plain">Plain summary</summary><p>panel</p></details>
					<details><summary id="trigger" role="button">Button summary</summary><p>panel</p></details>
				</div>`,
			);

			for (const id of ["plain", "trigger"]) {
				const measured = await page.locator(`#${id}`).evaluate((element) => {
					const style = getComputedStyle(element);
					const marker = getComputedStyle(element, "::after");
					const box = element.getBoundingClientRect();
					// A float joins the first line box, whose top is the top of
					// the element's content box.
					const contentTop =
						box.top +
						Number.parseFloat(style.paddingTop) +
						Number.parseFloat(style.borderTopWidth);
					const lineHeight = Number.parseFloat(style.lineHeight);
					const markerHeight = Number.parseFloat(marker.height);
					return {
						lineHeight,
						markerHeight,
						delta:
							contentTop +
							markerHeight / 2 -
							(contentTop + lineHeight / 2),
					};
				});

				// The invariant, stated twice: the marker box is one line tall,
				// and its centre therefore lands on the centre of the line.
				expect(
					measured.markerHeight,
					`#${id}: marker box is not one line box tall`,
				).toBeCloseTo(measured.lineHeight, 0);
				expect(
					Math.abs(measured.delta),
					`#${id}: marker centre is ${measured.delta}px off the line centre`,
				).toBeLessThanOrEqual(1);
			}
		});
	}
}

// --- 2. A vertical nav paints inside its own container -------------------

// The horizontal nav pays its inline gutters forward and takes them back on
// the link. Stacked, those insets stopped cancelling and the painted box —
// the hover fill, and the border-inline-start used as the aria-current rail
// — ran 8px outside the <aside> on both edges. In the container the pattern
// is actually for, a sticky sidebar that scrolls, the rail was clipped away
// entirely.
for (const [name, css] of builds) {
	test(`${name}: a vertical nav's painted box stays inside its aside`, async ({
		page,
	}) => {
		await render(
			page,
			css,
			`<aside id="rail" style="inline-size: 240px; overflow: hidden">
				<nav aria-label="Section">
					<ul>
						<li><a id="current" href="#a" aria-current="page">Current</a></li>
						<li><a id="other" href="#b">Other</a></li>
					</ul>
				</nav>
			</aside>`,
		);

		const geometry = await page.evaluate(() => {
			const aside = /** @type {HTMLElement} */ (
				document.getElementById("rail")
			);
			const style = getComputedStyle(aside);
			const box = aside.getBoundingClientRect();
			const inner = {
				start:
					box.left +
					Number.parseFloat(style.paddingLeft) +
					Number.parseFloat(style.borderLeftWidth),
				end:
					box.right -
					Number.parseFloat(style.paddingRight) -
					Number.parseFloat(style.borderRightWidth),
			};
			const links = ["current", "other"].map((id) => {
				const link = /** @type {HTMLElement} */ (document.getElementById(id));
				const rect = link.getBoundingClientRect();
				const linkStyle = getComputedStyle(link);
				return {
					id,
					left: rect.left,
					right: rect.right,
					railWidth: Number.parseFloat(linkStyle.borderInlineStartWidth),
					railColor: linkStyle.borderInlineStartColor,
				};
			});
			return { inner, links };
		});

		for (const link of geometry.links) {
			// Contained on both inline edges. Sub-pixel tolerance only.
			expect(
				link.left,
				`${link.id}: painted box starts outside the aside`,
			).toBeGreaterThanOrEqual(geometry.inner.start - 0.5);
			expect(
				link.right,
				`${link.id}: painted box ends outside the aside`,
			).toBeLessThanOrEqual(geometry.inner.end + 0.5);
		}

		// And the rail an aria-current entry paints is a real, visible edge
		// rather than a transparent one clipped off the side.
		const current = geometry.links[0];
		expect(current.railWidth).toBeGreaterThan(0);
		expect(current.railColor).not.toBe("rgba(0, 0, 0, 0)");
		expect(current.railColor).not.toBe("transparent");
	});
}

// A plain list in an <aside> is a plain list. The vertical-nav block used to
// be keyed on `aside` alone, so it forced `display: block` — which is not
// `list-item` — onto the items of any list in a complementary region, and
// their markers stopped being generated.
for (const [name, css] of builds) {
	test(`${name}: a prose list inside an aside keeps its list semantics`, async ({
		page,
	}) => {
		await render(
			page,
			css,
			`<aside><ul id="prose"><li>One</li><li>Two</li></ul></aside>
			 <ul id="control"><li>One</li><li>Two</li></ul>`,
		);

		/** @param {string} selector */
		const display = (selector) =>
			page
				.locator(`${selector} li`)
				.first()
				.evaluate((element) => getComputedStyle(element).display);

		expect(await display("#prose")).toBe("list-item");
		expect(await display("#prose")).toBe(await display("#control"));
	});
}

// The same containment, in the three places a stacked nav actually lives
// outside an <aside>: a drawer (<dialog>), a disclosure (<details>), and a
// plain container. There is no ancestor the framework could key on — a
// <dialog> can hold a horizontal tab bar and a <details> can hold anything
// — so the contract is the gutter token, and it is the whole contract:
// name it zero and all three of the bar's inline insets collapse together.
for (const [name, css] of builds) {
	for (const [shape, markup] of [
		[
			"drawer",
			`<dialog open><article id="panel" style="inline-size: 320px">
				<header>Menu</header>
				<nav aria-label="Site" style="--cirth-nav-element-spacing-horizontal: 0; display: block; overflow: hidden">
					<ul>
						<li><a id="current" href="#a" aria-current="page">Docs</a></li>
						<li><a id="other" href="#b">Examples</a></li>
					</ul>
				</nav>
			</article></dialog>`,
		],
		[
			"disclosure",
			`<div style="inline-size: 320px"><details open id="panel">
				<summary>Browse</summary>
				<nav aria-label="Site" style="--cirth-nav-element-spacing-horizontal: 0; display: block; overflow: hidden">
					<ul>
						<li><a id="current" href="#a" aria-current="page">Docs</a></li>
						<li><a id="other" href="#b">Examples</a></li>
					</ul>
				</nav>
			</details></div>`,
		],
		[
			"plain container",
			`<div id="panel" style="inline-size: 320px; overflow: hidden">
				<nav aria-label="Site" style="--cirth-nav-element-spacing-horizontal: 0; display: block">
					<ul>
						<li><a id="current" href="#a" aria-current="page">Docs</a></li>
						<li><a id="other" href="#b">Examples</a></li>
					</ul>
				</nav>
			</div>`,
		],
	]) {
		test(`${name}: a stacked nav in a ${shape} paints inside its container`, async ({
			page,
		}) => {
			await render(page, css, markup);

			const geometry = await page.evaluate(() => {
				const nav = /** @type {HTMLElement} */ (
					document.querySelector("#panel nav")
				);
				const style = getComputedStyle(nav);
				const box = nav.getBoundingClientRect();
				const inner = {
					start:
						box.left +
						Number.parseFloat(style.paddingLeft) +
						Number.parseFloat(style.borderLeftWidth),
					end:
						box.right -
						Number.parseFloat(style.paddingRight) -
						Number.parseFloat(style.borderRightWidth),
				};
				const links = ["current", "other"].map((id) => {
					const link = /** @type {HTMLElement} */ (
						document.getElementById(id)
					);
					const rect = link.getBoundingClientRect();
					const linkStyle = getComputedStyle(link);
					return {
						id,
						left: rect.left,
						right: rect.right,
						railWidth: Number.parseFloat(linkStyle.borderInlineStartWidth),
						railColor: linkStyle.borderInlineStartColor,
					};
				});
				return { inner, links };
			});

			for (const link of geometry.links) {
				expect(
					link.left,
					`${link.id}: painted box starts outside the panel`,
				).toBeGreaterThanOrEqual(geometry.inner.start - 0.5);
				expect(
					link.right,
					`${link.id}: painted box ends outside the panel`,
				).toBeLessThanOrEqual(geometry.inner.end + 0.5);
			}
		});
	}
}

// `0` is what an author writes, and a custom property is substituted at
// computed-value time — so the gutter has to survive arriving without a
// unit. Written into the `margin` shorthand it did not: `calc(0 * -1)` is a
// <number> where a <length> is required, which invalidates the whole
// declaration and takes the *block* margin with it, adding one link-gutter
// of height to every row in the stack. Split across the two axes, the
// inline half falls back to its own initial value and the block rhythm is
// untouched.
for (const [name, css] of builds) {
	test(`${name}: releasing the nav gutter keeps the link's block rhythm, unit or not`, async ({
		page,
	}) => {
		await render(
			page,
			css,
			["0", "0px", "0rem"]
				.map(
					(zero, index) =>
						`<div id="panel-${index}" style="inline-size: 280px; overflow: hidden">
							<nav aria-label="Section ${index}" style="--cirth-nav-element-spacing-horizontal: ${zero}; display: block">
								<ul><li><a href="#a" aria-current="page">Overview</a></li></ul>
							</nav>
						</div>`,
				)
				.join("") +
				`<div id="bar" style="inline-size: 280px">
					<nav aria-label="Bar"><ul><li><a href="#a">Overview</a></li></ul></nav>
				</div>`,
		);

		const readings = await page.evaluate(() =>
			["panel-0", "panel-1", "panel-2", "bar"].map((id) => {
				const host = /** @type {HTMLElement} */ (document.getElementById(id));
				const link = /** @type {HTMLElement} */ (host.querySelector("a"));
				const style = getComputedStyle(link);
				return {
					id,
					marginBlockStart: style.marginBlockStart,
					marginInlineStart: style.marginInlineStart,
					overhang:
						host.getBoundingClientRect().left -
						link.getBoundingClientRect().left,
				};
			}),
		);

		const bar = /** @type {(typeof readings)[number]} */ (readings.at(-1));
		for (const reading of readings.slice(0, -1)) {
			// The block rhythm is the bar's, whatever unit the zero arrived in.
			expect(reading.marginBlockStart, reading.id).toBe(bar.marginBlockStart);
			// And the inline bleed is gone.
			expect(reading.marginInlineStart, reading.id).toBe("0px");
			expect(reading.overhang, reading.id).toBeCloseTo(0, 1);
		}
		// The control: an untouched bar still bleeds by its gutter.
		expect(bar.overhang).toBeGreaterThan(0);
	});
}

// The inline pull is the item's gutter negated, not the link's own. Keyed to
// the link gutter — which it was, invisibly, because the two carry the same
// 8px by default — re-timing either token broke a plain horizontal bar: the
// first link's painted box started outside a list pulled out by less, and
// adjacent links overlapped by the difference.
for (const [name, css] of builds) {
	test(`${name}: a re-timed nav link gutter still tiles inside the container`, async ({
		page,
	}) => {
		await render(
			page,
			css,
			`<div id="bar" style="inline-size: 640px; --cirth-nav-link-spacing-horizontal: 1rem">
				<nav aria-label="Site">
					<ul>
						<li><a id="one" href="#a">One</a></li>
						<li><a id="two" href="#b">Two</a></li>
					</ul>
				</nav>
			</div>`,
		);

		const geometry = await page.evaluate(() => {
			const list = /** @type {HTMLElement} */ (
				document.querySelector("#bar nav ul")
			);
			const rect = (/** @type {string} */ id) =>
				/** @type {HTMLElement} */ (
					document.getElementById(id)
				).getBoundingClientRect();
			return {
				listLeft: list.getBoundingClientRect().left,
				one: { left: rect("one").left, right: rect("one").right },
				two: { left: rect("two").left, right: rect("two").right },
			};
		});

		// The first link's box reaches the list's own edge and no further.
		expect(geometry.one.left).toBeCloseTo(geometry.listLeft, 1);
		// Adjacent links tile: they touch, and they do not overlap.
		expect(geometry.two.left).toBeCloseTo(geometry.one.right, 1);
	});
}

// --- 3. The page roles are not shadowable -------------------------------

// --cirth-color is the slot a component rebinds: a <button> sets it to the
// inverse ink its filled surface needs, a link to the accent, a heading to
// its own. That is what --cirth-ink exists to sit beside, exactly as
// --cirth-canvas already sat beside --cirth-background-color.
for (const [name, css] of builds) {
	test(`${name}: --cirth-ink and --cirth-canvas survive every component that rebinds the slot`, async ({
		page,
	}) => {
		await render(
			page,
			css,
			`<button type="button" id="button">Button</button>
			 <p><a href="#x" id="link">Link</a></p>
			 <p><input id="input" type="text" value="field"></p>
			 <h2 id="heading">Heading</h2>`,
		);

		const readings = await page.evaluate(() => {
			/**
			 * @param {Element} element
			 * @param {string} property
			 */
			const read = (element, property) =>
				getComputedStyle(element).getPropertyValue(property).trim();
			const root = document.documentElement;
			const targets = ["button", "link", "input", "heading"];
			return {
				rootInk: read(root, "--cirth-ink"),
				rootCanvas: read(root, "--cirth-canvas"),
				inside: targets.map((id) => {
					const element = /** @type {Element} */ (
						document.getElementById(id)
					);
					return {
						id,
						ink: read(element, "--cirth-ink"),
						canvas: read(element, "--cirth-canvas"),
						slot: read(element, "--cirth-color"),
					};
				}),
			};
		});

		expect(readings.rootInk, "--cirth-ink is not declared").not.toBe("");
		expect(readings.rootCanvas, "--cirth-canvas is not declared").not.toBe("");

		for (const target of readings.inside) {
			expect(target.ink, `--cirth-ink shadowed inside ${target.id}`).toBe(
				readings.rootInk,
			);
			expect(target.canvas, `--cirth-canvas shadowed inside ${target.id}`).toBe(
				readings.rootCanvas,
			);
		}

		// The reason the pair has to exist: the slot really is rebound, so a
		// control reaching for --cirth-color inside a <button> gets the
		// button's ink and not the page's. If this ever stops being true the
		// tokens above are still correct, but the comment explaining them is
		// not.
		const button = readings.inside.find((entry) => entry.id === "button");
		expect(button?.slot).not.toBe(readings.rootInk);
	});
}

// A preset, or the high-contrast pass, that moves the page's ink has to move
// the *role* and let the slot follow — not the other way round. Playroom set
// --cirth-color directly, so under it --cirth-ink still held the base
// theme's near-black: the two names disagreed about what the page's ink was,
// which is the one thing a page role must never do.
const presetFiles = fs
	.readdirSync(path.join(projectRoot, "dist/presets"))
	.filter((name) => name.endsWith(".css") && !name.endsWith(".min.css"))
	.sort();

for (const preset of ["(none)", ...presetFiles]) {
	for (const scheme of /** @type {("light" | "dark")[]} */ (["light", "dark"])) {
		for (const contrast of /** @type {("no-preference" | "more")[]} */ ([
			"no-preference",
			"more",
		])) {
			test(`page ink: --cirth-ink is the page's ink under ${preset}, ${scheme}, contrast:${contrast}`, async ({
				page,
			}) => {
				await page.emulateMedia({ colorScheme: scheme, contrast });
				const overlay =
					preset === "(none)"
						? ""
						: `<style>${read(`dist/presets/${preset}`)}</style>`;
				await setContent(page,
					`<style>${defaultBuild}</style>${overlay}<main><p id="copy">Body copy.</p></main>`,
				);

				const measured = await page.evaluate(() => {
					const root = getComputedStyle(document.documentElement);
					const probe = document.createElement("span");
					document.body.append(probe);
					/** @param {string} value */
					const resolve = (value) => {
						probe.style.color = "";
						probe.style.color = value;
						return getComputedStyle(probe).color;
					};
					const result = {
						ink: resolve(root.getPropertyValue("--cirth-ink")),
						slot: resolve(root.getPropertyValue("--cirth-color")),
						painted: getComputedStyle(
							/** @type {Element} */ (document.getElementById("copy")),
						).color,
					};
					probe.remove();
					return result;
				});

				expect(measured.ink, "--cirth-ink is undeclared").not.toBe("");
				expect(
					measured.slot,
					"--cirth-color and --cirth-ink disagree about the page's ink",
				).toBe(measured.ink);
				expect(
					measured.painted,
					"body copy is not painted in the page's ink",
				).toBe(measured.ink);
			});
		}
	}
}

// --- 4. <dl> arrives finished -------------------------------------------

for (const [name, css] of builds) {
	test(`${name}: a description list is styled, in both shapes HTML allows`, async ({
		page,
	}) => {
		await render(
			page,
			css,
			`<dl id="flat">
				<dt>Order</dt><dd>#1042</dd>
				<dt>Placed</dt><dd>3 March</dd>
			</dl>
			<dl id="wrapped">
				<div><dt>Order</dt><dd>#1042</dd></div>
				<div><dt>Placed</dt><dd>3 March</dd></div>
			</dl>`,
		);

		const measured = await page.evaluate(() => {
			/** @param {string} selector */
			const weight = (selector) =>
				Number.parseFloat(
					getComputedStyle(
						/** @type {Element} */ (document.querySelector(selector)),
					).fontWeight,
				);
			const terms = [...document.querySelectorAll("#flat dt")];
			const definitions = [...document.querySelectorAll("#flat dd")];
			const wrappers = [...document.querySelectorAll("#wrapped > div")];
			return {
				indent: getComputedStyle(definitions[0]).marginInlineStart,
				termWeight: weight("#flat dt"),
				definitionWeight: weight("#flat dd"),
				pairGap:
					terms[1].getBoundingClientRect().top -
					definitions[0].getBoundingClientRect().bottom,
				insideGap:
					definitions[0].getBoundingClientRect().top -
					terms[0].getBoundingClientRect().bottom,
				wrapperMarginTop: getComputedStyle(wrappers[1]).marginTop,
				// The elements are styled inside the wrapper too.
				wrappedIndent: getComputedStyle(
					/** @type {Element} */ (document.querySelector("#wrapped dd")),
				).marginInlineStart,
				wrappedTermWeight: weight("#wrapped dt"),
			};
		});

		// The user agent's 40px indent is a browser default, not a decision.
		expect(measured.indent).toBe("0px");
		expect(measured.wrappedIndent).toBe("0px");

		// A term has to read as the term rather than as another line of its
		// own definition.
		expect(measured.termWeight).toBeGreaterThan(measured.definitionWeight);
		expect(measured.wrappedTermWeight).toBe(measured.termWeight);

		// Space between pairs, and none inside one.
		expect(measured.pairGap).toBeGreaterThan(0);
		expect(measured.insideGap).toBeCloseTo(0, 0);

		// And deliberately nothing on the wrapper: that box exists so the
		// author can lay the pairs out, overwhelmingly by making the <dl> a
		// grid. A framework margin there would land on grid items and pull
		// every cell after the first out of line with the first.
		expect(
			measured.wrapperMarginTop,
			"a framework margin on the pair wrapper breaks a gridded <dl>",
		).toBe("0px");
	});
}

// A gridded <dl> is the composition the framework recommends instead of
// shipping a metrics component, so it has to compose with no resets.
for (const [name, css] of builds) {
	test(`${name}: a gridded description list keeps its first row aligned`, async ({
		page,
	}) => {
		await render(
			page,
			css,
			`<dl id="grid" style="display: grid; grid-template-columns: repeat(3, 1fr); margin: 0">
				<div><dt>One</dt><dd>1</dd></div>
				<div><dt>Two</dt><dd>2</dd></div>
				<div><dt>Three</dt><dd>3</dd></div>
			</dl>`,
		);

		const tops = await page
			.locator("#grid > div")
			.evaluateAll((cells) =>
				cells.map((cell) => cell.getBoundingClientRect().top),
			);

		for (const top of tops) expect(top).toBeCloseTo(tops[0], 0);
	});
}

// --- 5. <caption> agrees with the rest of its table ---------------------

for (const [name, css] of builds) {
	test(`${name}: a table caption agrees with the cells under it`, async ({
		page,
	}) => {
		await render(
			page,
			css,
			`<table>
				<caption id="caption">Project team and roles</caption>
				<thead><tr><th id="head" scope="col">Name</th></tr></thead>
				<tbody><tr><td>Alex Doe</td></tr></tbody>
			</table>`,
		);

		const measured = await page.evaluate(() => {
			const caption = getComputedStyle(
				/** @type {Element} */ (document.getElementById("caption")),
			);
			const cell = getComputedStyle(
				/** @type {Element} */ (document.getElementById("head")),
			);
			const root = getComputedStyle(document.documentElement);
			return {
				captionAlign: caption.textAlign,
				cellAlign: cell.textAlign,
				captionColor: caption.color,
				cellColor: cell.color,
				muted: root.getPropertyValue("--cirth-muted-color").trim(),
				spaceBelow: Number.parseFloat(caption.paddingBlockEnd),
			};
		});

		// The one thing a table used to disagree with itself about.
		expect(measured.captionAlign).toBe(measured.cellAlign);
		expect(measured.captionAlign).not.toBe("center");

		// Subordinate to the data, like figcaption is to its figure.
		expect(measured.captionColor).not.toBe(measured.cellColor);
		expect(measured.muted).not.toBe("");

		// And it does not sit directly on the header row.
		expect(measured.spaceBelow).toBeGreaterThan(0);
	});
}

// --- 6. The skip-link utility does not move the page --------------------

// `.sr-only-focusable` used to return the element to normal flow on focus,
// which shoved the whole document down by its own height the instant a
// keyboard reader pressed Tab — measured at +24px, on the first interaction
// anyone has with the page.
test("default: .sr-only-focusable reveals without moving the document", async ({
	page,
}) => {
	await render(
		page,
		defaultBuild,
		`<a href="#target" id="skip" class="sr-only sr-only-focusable">Skip to content</a>
		 <h1 id="after">A heading the skip link would otherwise push down</h1>
		 <p>Body copy.</p>`,
	);

	/** @param {string} selector */
	const topOf = (selector) =>
		page
			.locator(selector)
			.evaluate((element) => element.getBoundingClientRect().top);

	const before = await topOf("#after");
	await page.locator("#skip").focus();
	const after = await topOf("#after");

	expect(after - before, "focusing the skip link moved the document").toBe(0);

	const revealed = await page.locator("#skip").evaluate((element) => {
		const style = getComputedStyle(element);
		const box = element.getBoundingClientRect();
		return {
			position: style.position,
			background: style.backgroundColor,
			width: box.width,
			height: box.height,
		};
	});

	// Out of flow is what removes the jump...
	expect(revealed.position).not.toBe("static");
	// ...which means it is painted over whatever it lands on, so the reveal
	// has to be opaque or it is not a reveal.
	expect(revealed.background).not.toBe("rgba(0, 0, 0, 0)");
	expect(revealed.background).not.toBe("transparent");
	// And it is actually visible, not still clipped to 1px.
	expect(revealed.width).toBeGreaterThan(1);
	expect(revealed.height).toBeGreaterThan(1);
});

// --- 7. The VoiceOver clearfix never becomes a layout participant -------

// `:where(nav li)::before` carries a zero-width space so Safari does not drop
// `list-style: none` navigation out of the accessibility tree. It used to
// take itself out of flow with `float`, which a flex or grid container
// ignores — the box was still generated, as an item before every real one.
for (const [name, css] of builds) {
	for (const [display, template] of [
		["grid", "display: grid; grid-template-columns: 1fr auto"],
		["flex", "display: flex; gap: 8px"],
	]) {
		test(`${name}: a ${display} nav item keeps its children in order`, async ({
			page,
		}) => {
			await render(
				page,
				css,
				`<style>nav li { ${template}; align-items: center }</style>
				 <nav aria-label="Tools">
					<ul>
						<li id="item">
							<span id="label">Label</span>
							<button id="action" type="button">Go</button>
						</li>
					</ul>
				 </nav>`,
			);

			const measured = await page.evaluate(() => {
				/** @param {string} id */
				const centre = (id) => {
					const rect = /** @type {Element} */ (
						document.getElementById(id)
					).getBoundingClientRect();
					return { x: rect.left, y: rect.top + rect.height / 2 };
				};
				return {
					before: getComputedStyle(
						/** @type {Element} */ (document.getElementById("item")),
						"::before",
					).position,
					label: centre("label"),
					action: centre("action"),
				};
			});

			// Out of flow under every display type, not just in a block
			// formatting context.
			expect(measured.before).toBe("absolute");

			// DOM order is reading order: the label leads, the button follows,
			// and both sit on one row. With the float the pseudo-element took
			// the first track, the label took the second, and the button wrapped
			// onto a second row at the inline start.
			expect(
				measured.label.x,
				`${display}: children rendered out of order`,
			).toBeLessThan(measured.action.x);
			expect(
				Math.abs(measured.label.y - measured.action.y),
				`${display}: children fell onto separate rows`,
			).toBeLessThanOrEqual(1);
		});
	}
}

// --- 8. A wide table stays operable ------------------------------------

// The canonical pattern for a table that has to scroll. Cirth ships the
// scroll container and its focus ring; the four attributes together are
// what make the region operable from a keyboard (WCAG 2.1.1), and none of
// them is enough on its own.
test("default: a table in .overflow-auto scrolls and takes a focus ring", async ({
	page,
}) => {
	await render(
		page,
		defaultBuild,
		`<div id="region" class="overflow-auto" tabindex="0" role="region"
			  aria-label="Project team and roles" style="inline-size: 200px">
			<table style="inline-size: 800px">
				<caption>Project team and roles</caption>
				<thead><tr><th scope="col">Name</th><th scope="col">Role</th></tr></thead>
				<tbody><tr><td>Alex Doe</td><td>Engineer</td></tr></tbody>
			</table>
		 </div>`,
	);

	const region = page.locator("#region");

	// It is a scroll container, and the keyboard can reach it.
	expect(
		await region.evaluate(
			(element) => element.scrollWidth > element.clientWidth,
		),
	).toBe(true);
	await expect(region).toHaveAttribute("tabindex", "0");
	await expect(region).toHaveAttribute("role", "region");
	await expect(region).toHaveAttribute("aria-label", /\w/);

	// Keyboard focus, so :focus-visible applies and the framework's own ring
	// is painted rather than the browser's default hairline.
	await page.keyboard.press("Tab");
	await expect(region).toBeFocused();

	const outline = await region.evaluate((element) => {
		const style = getComputedStyle(element);
		return {
			style: style.outlineStyle,
			width: Number.parseFloat(style.outlineWidth),
			color: style.outlineColor,
		};
	});
	expect(outline.style).not.toBe("none");
	expect(outline.width).toBeGreaterThan(0);
	expect(outline.color).not.toBe("rgba(0, 0, 0, 0)");

	// And it actually scrolls.
	await region.evaluate((element) => element.scrollBy(120, 0));
	expect(await region.evaluate((element) => element.scrollLeft)).toBeGreaterThan(
		0,
	);
});

// --- 9. <ol> and <ul> are the same nav ----------------------------------

// A breadcrumb is an ordered sequence, so <ol> is the element for it — and
// <ol> was the element the framework did not style. `nav, nav ul { display:
// flex }` left an ordered list at `display: block` with `inline-block`
// items, which is the one layout mode that *renders* the newlines a source
// file has between <li> elements, and the breadcrumb block was scoped to
// `ul` as well, so the separator never had any content to draw. The more
// correct markup got a narrower trail, whitespace between the items that
// tracked the file's indentation, and no dividers at all.
//
// The assertion is a comparison, not a set of numbers: the two lists are
// the same nav, so they must measure the same. Real newlines and tabs sit
// between the items on purpose — without them the whitespace half of the
// defect cannot appear.

/** @type {{ file: string, name: string, wrapper: string }[]} */
const scopedAndUnscoped = [
	{ file: "dist/cirth.css", name: "default", wrapper: "" },
	{ file: "dist/cirth.classless.css", name: "classless", wrapper: "" },
	{ file: "dist/cirth.scoped.css", name: "scoped", wrapper: "cirth" },
	{
		file: "dist/cirth.classless.scoped.css",
		name: "classless scoped",
		wrapper: "cirth",
	},
];

/** @param {"ol" | "ul"} tag @param {string} id */
const trail = (tag, id) =>
	`<nav id="${id}" aria-label="breadcrumb">
		<${tag}>
			<li><a href="/">Home</a></li>
			<li><a href="/library/">Library</a></li>
			<li><a href="/library/data/" aria-current="page">Data</a></li>
		</${tag}>
	</nav>`;

for (const build of scopedAndUnscoped) {
	test(`${build.name}: a breadcrumb measures the same as <ol> and as <ul>`, async ({
		page,
	}) => {
		const markup = `${trail("ul", "as-ul")}${trail("ol", "as-ol")}`;
		await setContent(
			page,
			`<style>${read(build.file)}</style><main>${
				build.wrapper ? `<div class="${build.wrapper}">${markup}</div>` : markup
			}</main>`,
		);

		const measured = await page.evaluate(() =>
			["as-ul", "as-ol"].map((id) => {
				const nav = /** @type {HTMLElement} */ (document.getElementById(id));
				const list = /** @type {HTMLElement} */ (
					nav.querySelector(":is(ol, ul)")
				);
				const items = /** @type {HTMLElement[]} */ ([
					...list.querySelectorAll("li"),
				]);
				const round = (/** @type {number} */ value) =>
					Number.parseFloat(value.toFixed(2));

				return {
					id,
					display: getComputedStyle(list).display,
					listWidth: round(list.getBoundingClientRect().width),
					itemWidths: items.map((item) =>
						round(item.getBoundingClientRect().width),
					),
					// Source formatting rendered as whitespace is the defect's
					// signature: between flex items this is exactly the gutter.
					seams: items
						.slice(1)
						.map((item, index) =>
							round(
								item.getBoundingClientRect().left -
									items[index].getBoundingClientRect().right,
							),
						),
					divider: getComputedStyle(items[0], "::after").content,
				};
			}),
		);

		const [asUl, asOl] = measured;

		expect(asUl.display, "a nav list is a flex container").toBe("flex");
		expect({ ...asOl, id: "as-ul" }, "<ol> renders differently from <ul>").toEqual(
			asUl,
		);

		// And the separator is drawn — the half of this that no amount of
		// comparing the two lists to each other would have caught.
		expect(asOl.divider, "the breadcrumb divider is missing").not.toBe("none");

		// Items tile on the list's own gutter, with no source formatting
		// wedged between them.
		for (const seam of asOl.seams) {
			expect(seam, "whitespace between breadcrumb items").toBeLessThanOrEqual(
				8.5,
			);
		}
	});
}

// The same contract outside a breadcrumb: a plain navigation list and a
// navbar both take the flex row whichever list element they are written
// with, and a stacked nav releases it for both in the same way.
for (const [name, css] of builds) {
	test(`${name}: a nav list is a row as <ol> and as <ul>, stacked or not`, async ({
		page,
	}) => {
		const list = (/** @type {"ol" | "ul"} */ tag) =>
			`<${tag}>
				<li><a href="#a">Overview</a></li>
				<li><a href="#b">Tokens</a></li>
			</${tag}>`;

		await render(
			page,
			css,
			["ol", "ul"]
				.map(
					(tag) => `<div id="bar-${tag}" style="inline-size: 640px">
						<nav aria-label="Bar ${tag}">${list(/** @type {"ol"} */ (tag))}</nav>
					</div>
					<header id="navbar-${tag}" style="inline-size: 640px">
						<nav aria-label="Navbar ${tag}">${list(/** @type {"ol"} */ (tag))}</nav>
					</header>
					<aside id="rail-${tag}" style="inline-size: 240px">
						<nav aria-label="Rail ${tag}">${list(/** @type {"ol"} */ (tag))}</nav>
					</aside>`,
				)
				.join(""),
		);

		const shapes = await page.evaluate(() =>
			["bar", "navbar", "rail"].map((shape) => {
				const read = (/** @type {"ol" | "ul"} */ tag) => {
					const host = /** @type {HTMLElement} */ (
						document.getElementById(`${shape}-${tag}`)
					);
					const inner = /** @type {HTMLElement} */ (
						host.querySelector(":is(ol, ul)")
					);
					const first = /** @type {HTMLElement} */ (
						inner.querySelector("li")
					);
					return {
						display: getComputedStyle(inner).display,
						width: Number.parseFloat(
							inner.getBoundingClientRect().width.toFixed(2),
						),
						itemHeight: Number.parseFloat(
							first.getBoundingClientRect().height.toFixed(2),
						),
					};
				};

				return { shape, ol: read("ol"), ul: read("ul") };
			}),
		);

		for (const shape of shapes) {
			expect(shape.ol, `${shape.shape}: <ol> and <ul> disagree`).toEqual(
				shape.ul,
			);
		}

		// The two shapes really are different, so the equality above is not
		// passing because everything collapsed to the same thing.
		const [bar, , rail] = shapes;
		expect(bar.ul.display).toBe("flex");
		expect(rail.ul.display).toBe("block");
	});
}

// --- 10. --cirth-spacing is the flow knob, and only the flow knob --------

// It reads as the density control and it was only half wired. `.grid` gaps
// and section margins followed it; paragraph rhythm did not, because
// --cirth-typography-spacing-vertical was declared as its own copy of
// --cirth-space-4 — so the playroom preset had to restate it, and every
// future preset would have had to remember. It is derived now.
//
// The other half of the contract is what deliberately does *not* follow:
// control padding, which the 44px target-size floor is computed from, and
// card padding, which is named on the space scale one step above the
// controls so a container is more generous than its contents at every
// setting of the knob. Both are asserted here, because "it did not move"
// is a promise exactly as much as "it moved" is.
//
// Set at the root, which is where the documentation says to set it and the
// only place it can work: every token that derives from it is declared at
// the root too, so substitution happens there and the result inherits.

/**
 * @param {import("@playwright/test").Page} page
 * @param {string} css
 * @param {string} [spacing]
 */
const flowRhythm = async (page, css, spacing) => {
	await setContent(
		page,
		`<style>${css}</style>` +
			(spacing ? `<style>:root { --cirth-spacing: ${spacing} }</style>` : "") +
			`<main>
				<p id="copy">Body copy.</p>
				<section id="section">A section.</section>
				<article id="card">On a card.</article>
				<input id="field" type="text">
			</main>`,
	);

	return page.evaluate(() => {
		const style = (/** @type {string} */ id) =>
			getComputedStyle(
				/** @type {Element} */ (document.getElementById(id)),
			);
		const root = getComputedStyle(document.documentElement);

		return {
			spacing: root.getPropertyValue("--cirth-spacing").trim(),
			// Flow: follows the knob.
			paragraph: style("copy").marginBottom,
			section: style("section").marginBottom,
			// Components: pinned, on purpose.
			cardPadding: style("card").paddingTop,
			fieldPadding: style("field").paddingTop,
			fieldHeight: style("field").height,
		};
	});
};

for (const [name, css] of builds) {
	for (const [spacing, expected] of [
		["1.25rem", "20px"],
		["0.75rem", "12px"],
	]) {
		test(`${name}: --cirth-spacing at ${spacing} retimes the flow and not the controls`, async ({
			page,
		}) => {
			const control = await flowRhythm(page, css);
			const dense = await flowRhythm(page, css, spacing);

			// The token is unregistered, so it holds the literal it was given;
			// what is asserted below is what the flow computed from it.
			expect(dense.spacing).toBe(spacing);

			expect(
				dense.paragraph,
				"paragraph rhythm did not follow --cirth-spacing",
			).toBe(expected);
			expect(dense.section, "section rhythm did not follow --cirth-spacing").toBe(
				expected,
			);
			expect(dense.paragraph).not.toBe(control.paragraph);

			expect(dense.cardPadding, "card padding followed the flow knob").toBe(
				control.cardPadding,
			);
			expect(dense.fieldPadding, "control padding followed the flow knob").toBe(
				control.fieldPadding,
			);
			expect(dense.fieldHeight, "a target size moved with the flow knob").toBe(
				control.fieldHeight,
			);
		});
	}
}

// A container stays more generous than the controls inside it at every
// setting of the knob — the relationship the card's own comment claims.
// Derived from --cirth-spacing rather than named on the scale, the two
// would have crossed the first time a preset tightened it.
for (const [name, css] of builds) {
	test(`${name}: a card stays roomier than its controls at any --cirth-spacing`, async ({
		page,
	}) => {
		for (const spacing of [undefined, "0.5rem", "2rem"]) {
			const measured = await flowRhythm(page, css, spacing);
			expect(
				Number.parseFloat(measured.cardPadding),
				`card vs control padding at --cirth-spacing: ${spacing ?? "default"}`,
			).toBeGreaterThan(Number.parseFloat(measured.fieldPadding));
		}
	});
}

// And the reason the derivation was worth making: a preset that opens the
// flow up no longer has to restate the typography token to be consistent.
// Playroom does not declare it any more; measured against the default
// build, prose and grid gaps move together under it.
test("default: the playroom preset retimes prose through --cirth-spacing alone", async ({
	page,
}) => {
	await setContent(
		page,
		`<style>${defaultBuild}</style><style>${read(
			"dist/presets/playroom.css",
		)}</style><main class="container">
			<p id="copy">Body copy.</p>
			<div class="grid" id="grid"><div>a</div><div>b</div></div>
		</main>`,
	);

	const measured = await page.evaluate(() => {
		const root = getComputedStyle(document.documentElement);
		const copy = getComputedStyle(
			/** @type {Element} */ (document.getElementById("copy")),
		);
		const grid = getComputedStyle(
			/** @type {Element} */ (document.getElementById("grid")),
		);
		return {
			spacing: root.getPropertyValue("--cirth-spacing").trim(),
			typography: root
				.getPropertyValue("--cirth-typography-spacing-vertical")
				.trim(),
			paragraph: copy.marginBottom,
			columnGap: grid.columnGap,
		};
	});

	// 1.25rem — space-5 — and prose, grid and the knob all read it.
	expect(measured.typography).toBe(measured.spacing);
	expect(measured.paragraph).toBe("20px");
	expect(measured.columnGap).toBe("20px");
});
