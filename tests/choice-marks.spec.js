const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");
const { listPresetNames } = require("../scripts/lib/presets");
const { setContent } = require("./helpers/render");

// specs/choice-marks.md: a checkbox and a radio keep the 24px box that is
// their target and draw a 20px mark inside it; a checked radio is the
// accent with a dot; every state is told apart by more than colour; the
// mark is centred on the first line's capital height and a wrapping label
// hangs under its first word; inside .segmented the chosen radio is a ring
// and a dot on the accent. Measured on the built CSS, in three engines.

const projectRoot = path.join(__dirname, "..");
const css = fs.readFileSync(path.join(projectRoot, "dist/cirth.css"), "utf8");
const presets = ["default", ...listPresetNames()];

const markup = `
	<main class="container" style="max-inline-size: 20rem">
		<fieldset>
			<legend>Delivery</legend>
			<label id="checked"><input type="radio" name="d" value="a" checked> Standard</label>
			<label id="unchecked"><input type="radio" name="d" value="b"> Express delivery, next working day if ordered before two</label>
			<label><input id="disabled" type="radio" name="e" disabled> Collect</label>
			<label><input id="disabled-checked" type="radio" name="f" disabled checked> Post office</label>
			<label><input id="invalid" type="radio" name="g" aria-invalid="true" checked> Courier</label>
			<label><input id="valid" type="radio" name="h" aria-invalid="false" checked> Locker</label>
		</fieldset>
		<label id="box"><input type="checkbox" checked> Remember this choice for the next order and the one after it</label>
		<label><input id="switch" type="checkbox" role="switch"> Notifications</label>
		<fieldset class="segmented">
			<legend>View</legend>
			<label id="segment-on"><input type="radio" name="s" checked> List</label>
			<label id="segment-off"><input type="radio" name="s"> Grid</label>
		</fieldset>
		<button id="away" type="button">Away</button>
	</main>`;

/**
 * @param {import("@playwright/test").Page} page
 * @param {string} [preset]
 */
const render = async (page, preset = "default") => {
	const presetCss =
		preset === "default"
			? ""
			: fs.readFileSync(path.join(projectRoot, `dist/presets/${preset}.css`), "utf8");
	await setContent(
		page,
		`<html><head><style>${css}</style><style>${presetCss}</style></head><body>${markup}</body></html>`,
	);
};

/**
 * What a reader sees of one mark: its box, the drawn mark inside the band,
 * the ring's colour and the dot.
 * @param {import("@playwright/test").Page} page
 * @param {string} selector
 */
const mark = (page, selector) =>
	page.locator(selector).evaluate((input) => {
		const style = getComputedStyle(input);
		const dot = getComputedStyle(input, "::before");
		const box = input.getBoundingClientRect();
		const band = Number.parseFloat(style.borderTopWidth);
		const probe = document.createElement("span");
		document.body.append(probe);
		const resolve = (/** @type {string} */ value) => {
			probe.style.color = value;
			return getComputedStyle(probe).color;
		};
		// Engines serialise the inset ring with its colour first and the
		// keyword last: "oklch(…) 0px 0px 0px 1px inset".
		const ring = /^(.*?)\s+0px 0px 0px ([\d.]+)px inset$/.exec(style.boxShadow);
		const result = {
			box: box.width,
			band,
			mark: box.width - band * 2,
			bandColor: style.borderTopColor,
			ring: ring ? Number(ring[2]) : 0,
			ringColor: ring ? ring[1] : style.boxShadow,
			fill: style.backgroundColor,
			accent: resolve("var(--cirth-primary-surface)"),
			invalid: resolve("var(--cirth-form-element-invalid-border-color)"),
			valid: resolve("var(--cirth-form-element-valid-border-color)"),
			label: resolve("var(--cirth-primary-on-surface)"),
			dot: dot.content === "none" ? null : { scale: dot.scale, color: dot.backgroundColor, size: Number.parseFloat(dot.width) },
			outlineOffset: style.outlineOffset,
		};
		probe.remove();
		return result;
	});

for (const preset of presets) {
	test(`a radio's box is its target and its mark is drawn inside it (${preset})`, async ({ page }) => {
		await render(page, preset);

		for (const selector of ["#checked input", "#unchecked input", "#box input"]) {
			const read = await mark(page, selector);
			// 1.5em at 16px is the 24px target; the mark is 1.25em.
			expect(read.box, `${selector} box`).toBeCloseTo(24, 0);
			expect(read.mark, `${selector} mark`).toBeCloseTo(20, 0);
			// The band is part of the target and is not painted.
			expect(read.bandColor, `${selector} band`).toBe("rgba(0, 0, 0, 0)");
			// One edge, the width every resting edge has.
			expect(read.ring, `${selector} edge`).toBe(1);
		}

		// Checked: the accent with a dot in the label colour. The dot is the
		// signal a reader without colour gets.
		const checked = await mark(page, "#checked input");
		const unchecked = await mark(page, "#unchecked input");
		expect(checked.fill).toBe(checked.accent);
		expect(checked.dot?.scale).toBe("1");
		expect(checked.dot?.color).toBe(checked.label);
		expect(checked.dot?.size).toBeCloseTo(8, 0);
		expect(unchecked.dot?.scale).toBe("0");
		expect(unchecked.fill).not.toBe(checked.fill);

		// Invalid and valid fill the mark with their status, as a checkbox
		// does; disabled keeps a dot, in the disabled ink.
		expect((await mark(page, "#invalid")).fill).toBe(checked.invalid);
		expect((await mark(page, "#valid")).fill).toBe(checked.valid);
		const disabledChecked = await mark(page, "#disabled-checked");
		expect(disabledChecked.dot?.scale).toBe("1");
		expect(disabledChecked.bandColor).toBe("rgba(0, 0, 0, 0)");
		expect(disabledChecked.dot?.color).not.toBe(checked.label);
		const disabled = await mark(page, "#disabled");
		expect(disabled.bandColor).toBe("rgba(0, 0, 0, 0)");
		expect(disabled.ring).toBe(1);
	});
}

test("a switch keeps its track: no band, no ring, the thumb in flow", async ({ page }) => {
	await render(page);
	const track = await page.locator("#switch").evaluate((input) => {
		const style = getComputedStyle(input);
		return {
			display: style.display,
			shadow: style.boxShadow,
			border: Number.parseFloat(style.borderTopWidth),
			width: input.getBoundingClientRect().width,
		};
	});
	expect(track.display).toBe("inline-block");
	expect(track.shadow).toBe("none");
	expect(track.border).toBeCloseTo(3, 0);
	expect(track.width).toBeCloseTo(16 * 2.7, 0);
});

test("a mark answers the pointer, and its label counts as the mark", async ({
	page,
}) => {
	await render(page);
	const resting = await mark(page, "#unchecked input");
	await page.locator("#unchecked").hover({ position: { x: 120, y: 10 } });
	const hovered = await mark(page, "#unchecked input");
	expect(hovered.ringColor).not.toBe(resting.ringColor);
	expect(hovered.fill).not.toBe(resting.fill);

	const checkedResting = await mark(page, "#box input");
	await page.locator("#box input").hover();
	const checkedHovered = await mark(page, "#box input");
	expect(checkedHovered.fill).not.toBe(checkedResting.fill);
});

test("the focus ring sits two pixels off the drawn mark", async ({ page, browserName }) => {
	await render(page);
	const radio = page.locator("#unchecked input");
	await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
	await radio.focus();
	expect(await radio.evaluate((element) => element.matches(":focus-visible"))).toBe(true);
	const ring = await radio.evaluate((element) => {
		const style = getComputedStyle(element);
		return {
			style: style.outlineStyle,
			width: Number.parseFloat(style.outlineWidth),
			offset: Number.parseFloat(style.outlineOffset),
			band: Number.parseFloat(style.borderTopWidth),
		};
	});
	expect(ring.style).not.toBe("none");
	expect(ring.width).toBeGreaterThan(0);
	// The ring is drawn from the box; the band holds it 2px off the mark,
	// the gap every other control's ring keeps.
	expect(ring.offset + ring.band).toBeCloseTo(2, 0);
});

test("the mark centres on the capital height, and a wrapped label hangs under its first word", async ({
	page,
}) => {
	await render(page);
	for (const id of ["unchecked", "box"]) {
		const geometry = await page.locator(`#${id}`).evaluate((label) => {
			const input = /** @type {HTMLInputElement} */ (label.querySelector("input"));
			const box = input.getBoundingClientRect();
			const probe = document.createElement("span");
			probe.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";
			input.after(probe);
			const baseline = probe.getBoundingClientRect().bottom;
			probe.remove();
			const font = getComputedStyle(label);
			const context = /** @type {CanvasRenderingContext2D} */ (
				document.createElement("canvas").getContext("2d")
			);
			context.font = `${font.fontWeight} ${font.fontSize} ${font.fontFamily}`;
			const cap = context.measureText("H").actualBoundingBoxAscent;
			const text = /** @type {Text} */ (
				[...label.childNodes].find((node) => node.nodeType === 3 && node.textContent?.trim())
			);
			const first = document.createRange();
			const start = (text.textContent ?? "").search(/\S/);
			first.setStart(text, start);
			first.setEnd(text, start + 1);
			const whole = document.createRange();
			whole.selectNodeContents(text);
			const rects = [...whole.getClientRects()].filter((rect) => rect.width > 1);
			const lines = [...new Set(rects.map((rect) => Math.round(rect.top)))];
			const second = rects.find((rect) => Math.round(rect.top) === lines[1]);
			return {
				capOffset: box.top + box.height / 2 - (baseline - cap / 2),
				firstWord: first.getBoundingClientRect().left,
				secondLine: second?.left ?? null,
				lines: lines.length,
			};
		});
		expect(Math.abs(geometry.capOffset), `${id}: mark on the cap height`).toBeLessThanOrEqual(1);
		expect(geometry.lines, `${id} wraps`).toBeGreaterThan(1);
		expect(
			Math.abs(/** @type {number} */ (geometry.secondLine) - geometry.firstWord),
			`${id}: the second line starts under the first word`,
		).toBeLessThanOrEqual(1);
	}
});

test("inside .segmented the chosen radio is a ring and a dot on the accent, and the segment keeps its padding", async ({
	page,
}) => {
	await render(page);
	const on = await mark(page, "#segment-on input");
	const off = await mark(page, "#segment-off input");
	expect(on.fill).toBe("rgba(0, 0, 0, 0)");
	expect(on.ringColor).toBe(on.label);
	expect(on.dot?.scale).toBe("1");
	expect(off.dot?.scale).toBe("0");

	const segment = await page.locator("#segment-on").evaluate((label) => {
		const style = getComputedStyle(label);
		return {
			start: style.paddingInlineStart,
			end: style.paddingInlineEnd,
			indent: style.textIndent,
		};
	});
	expect(segment.start).toBe(segment.end);
	expect(segment.indent).toBe("0px");
});

test("under forced colours every mark keeps an edge, and the checked radio its dot", async ({
	page,
	browserName,
}) => {
	test.skip(browserName !== "chromium", "forced-colors emulation is Chromium's");
	await page.emulateMedia({ forcedColors: "active" });
	await render(page);
	const checked = await mark(page, "#checked input");
	const unchecked = await mark(page, "#unchecked input");
	const disabled = await mark(page, "#disabled");
	for (const read of [checked, unchecked, disabled]) {
		expect(read.bandColor).not.toBe("rgba(0, 0, 0, 0)");
	}
	expect(disabled.bandColor).not.toBe(unchecked.bandColor);
	expect(checked.dot?.scale).toBe("1");
	expect(unchecked.dot?.scale).toBe("0");
});

// --- Focus, by the way it arrived ------------------------------------------

// WebKit does not match :focus-visible on a radio its arrow keys moved to
// (measured on WebKit 26.5), so a ring keyed to :focus-visible alone left a
// keyboard user walking a group in Safari with no indicator after the first
// key. A radio's ring is keyed to :focus as well. These tests drive each way
// focus can arrive, in every engine, and read what is painted.

const focusMarkup = `
	<main class="container">
		<button id="before" type="button">Before</button>
		<fieldset>
			<legend>Size</legend>
			<label><input type="radio" name="size" value="s" checked> Small</label>
			<label><input type="radio" name="size" value="m"> Medium, with a label long enough to wrap onto a second line in a narrow column</label>
			<label><input type="radio" name="size" value="l"> Large</label>
		</fieldset>
		<fieldset class="segmented">
			<legend>View</legend>
			<label><input type="radio" name="view" value="list" checked> List</label>
			<label><input type="radio" name="view" value="grid"> Grid</label>
		</fieldset>
	</main>`;

/**
 * @param {import("@playwright/test").Page} page
 * @param {{ zoom?: number }} [options]
 */
const renderFocus = async (page, { zoom = 1 } = {}) => {
	await setContent(
		page,
		`<html><head><style>${css}</style><style>main { max-inline-size: 18rem; zoom: ${zoom}; }</style></head><body>${focusMarkup}</body></html>`,
	);
};

/** What the focused element and its segment paint. */
const focusPaint = (/** @type {import("@playwright/test").Page} */ page) =>
	page.evaluate(() => {
		const active = /** @type {HTMLInputElement} */ (document.activeElement);
		const style = getComputedStyle(active);
		const segment = active.closest("fieldset.segmented > label");
		const segmentStyle = segment ? getComputedStyle(segment) : null;
		return {
			value: active.value,
			ring: style.outlineStyle !== "none" && Number.parseFloat(style.outlineWidth) > 0,
			segmentRing:
				segmentStyle !== null &&
				segmentStyle.outlineStyle !== "none" &&
				Number.parseFloat(segmentStyle.outlineWidth) > 0,
		};
	});

/** @param {string} browserName */
const tabKey = (browserName) => (browserName === "webkit" ? "Alt+Tab" : "Tab");

test("Tab into a radio group paints the ring on the checked radio", async ({ page, browserName }) => {
	await renderFocus(page);
	await page.locator("#before").focus();
	await page.keyboard.press(tabKey(browserName));
	expect(await focusPaint(page)).toEqual({ value: "s", ring: true, segmentRing: false });
});

test("arrow keys keep the ring on every radio they reach, WebKit included", async ({
	page,
	browserName,
}) => {
	await renderFocus(page);
	await page.locator("#before").focus();
	await page.keyboard.press(tabKey(browserName));
	await page.keyboard.press("ArrowDown");
	// The wrapped option: the ring sits on the mark, whatever the label does.
	expect(await focusPaint(page)).toEqual({ value: "m", ring: true, segmentRing: false });
	await page.keyboard.press("ArrowDown");
	expect(await focusPaint(page)).toEqual({ value: "l", ring: true, segmentRing: false });
	await page.keyboard.press("ArrowUp");
	expect(await focusPaint(page)).toEqual({ value: "m", ring: true, segmentRing: false });
});

test("inside .segmented the segment carries the ring, after Tab and after arrows", async ({
	page,
	browserName,
}) => {
	await renderFocus(page);
	await page.locator('input[value="l"]').focus();
	await page.keyboard.press(tabKey(browserName));
	// One ring, the segment's: the radio's own would sit on the accent.
	expect(await focusPaint(page)).toEqual({ value: "list", ring: false, segmentRing: true });
	await page.keyboard.press("ArrowRight");
	expect(await focusPaint(page)).toEqual({ value: "grid", ring: false, segmentRing: true });
});

test("a click shows the ring where the engine focuses the radio: the documented compromise", async ({
	page,
	browserName,
}) => {
	await renderFocus(page);
	await page.locator('input[value="l"]').click();
	await expect(page.locator('input[value="l"]')).toBeChecked();
	const focused = await page.evaluate(() => /** @type {HTMLInputElement} */ (document.activeElement)?.value);
	if (browserName === "webkit") {
		// WebKit does not move focus to a radio on click: nothing to ring.
		expect(focused).not.toBe("l");
		return;
	}
	// Chromium and Firefox focus it, and no CSS state tells this focus from
	// the keyboard's, so the ring shows until focus moves on. Keyboard
	// visibility is what the rule is for (specs/choice-marks.md).
	expect(await focusPaint(page)).toEqual({ value: "l", ring: true, segmentRing: false });
});

test("the ring survives page zoom", async ({ page, browserName }) => {
	for (const zoom of [2, 4]) {
		await renderFocus(page, { zoom });
		await page.locator("#before").focus();
		await page.keyboard.press(tabKey(browserName));
		await page.keyboard.press("ArrowDown");
		expect(await focusPaint(page), `zoom ${zoom}`).toEqual({ value: "m", ring: true, segmentRing: false });
	}
});

test("under forced colours the arrow-moved ring is a system colour", async ({ page, browserName }) => {
	test.skip(browserName !== "chromium", "forced-colors emulation is Chromium's");
	await page.emulateMedia({ forcedColors: "active" });
	await renderFocus(page);
	await page.locator("#before").focus();
	await page.keyboard.press("Tab");
	await page.keyboard.press("ArrowDown");
	expect((await focusPaint(page)).ring).toBe(true);
	const colour = await page.evaluate(() => getComputedStyle(/** @type {Element} */ (document.activeElement)).outlineColor);
	expect(colour).not.toBe("rgba(0, 0, 0, 0)");
});
