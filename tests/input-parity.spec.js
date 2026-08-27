const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");

// Pointer and keyboard input must reach the same native actions. This is
// especially important for aria-busy: CSS once blocked pointer activation
// while Enter still fired, creating two different controls depending on
// input method.

const stylesheet = path.join(__dirname, "../dist/cirth.css");
if (!fs.existsSync(stylesheet)) {
	throw new Error(
		"input-parity.spec: dist/cirth.css not found: run `npm run build` first.",
	);
}
const css = fs.readFileSync(stylesheet, "utf8");
const themes = [
	{ name: "default", presetCss: "" },
	{ name: "plain", presetCss: "dist/presets/plain.css" },
	{ name: "playroom", presetCss: "dist/presets/playroom.css" },
].map((theme) => {
	if (!theme.presetCss) return { ...theme, presetCss: "" };
	const preset = path.join(__dirname, "..", theme.presetCss);
	if (!fs.existsSync(preset)) {
		throw new Error(
			`input-parity.spec: ${theme.presetCss} not found: run \`npm run build\` first.`,
		);
	}
	return { ...theme, presetCss: fs.readFileSync(preset, "utf8") };
});

const markup = `
	<button id="busy" type="button" aria-busy="true">Working</button>
	<button id="disabled" type="button" aria-busy="true" disabled>Working</button>

	<button id="popover-trigger" type="button" popovertarget="hint" aria-describedby="hint">
		Requirements
	</button>
	<span id="hint" popover>At least twelve characters.</span>

	<button id="dialog-trigger" type="button">Open confirmation</button>
	<dialog id="confirmation" aria-labelledby="confirmation-title">
		<article>
			<h2 id="confirmation-title">Confirmation</h2>
			<button type="button" id="dialog-close">Close</button>
		</article>
	</dialog>

	<script>
		window.activationDetails = [];
		window.disabledActivations = 0;
		document.querySelector("#busy").addEventListener("click", (event) => {
			window.activationDetails.push(event.detail);
		});
		document.querySelector("#disabled").addEventListener("click", () => {
			window.disabledActivations += 1;
		});
		document.querySelector("#dialog-trigger").addEventListener("click", () => {
			document.querySelector("#confirmation").showModal();
		});
		document.querySelector("#dialog-close").addEventListener("click", () => {
			document.querySelector("#confirmation").close();
		});
	</script>
`;

/**
 * @param {import("@playwright/test").Page} page
 * @param {(typeof themes)[number]} theme
 */
const render = (page, theme) =>
	page.setContent(
		`<style>${css}</style><style>${theme.presetCss}</style>${markup}`,
	);

/**
 * @param {import("@playwright/test").Page} page
 * @param {"pointer" | "enter" | "space"} modality
 */
const activatePopover = async (page, modality) => {
	const trigger = page.locator("#popover-trigger");
	if (modality === "pointer") {
		await trigger.click();
	} else {
		await trigger.focus();
		await page.keyboard.press(modality === "enter" ? "Enter" : "Space");
	}
	await expect
		.poll(() =>
			page.evaluate(() => document.querySelector("#hint")?.matches(":popover-open")),
		)
		.toBe(true);
	await page.keyboard.press("Escape");
};

/**
 * @param {import("@playwright/test").Page} page
 * @param {"pointer" | "enter" | "space"} modality
 */
const activateDialog = async (page, modality) => {
	const trigger = page.locator("#dialog-trigger");
	if (modality === "pointer") {
		await trigger.click();
	} else {
		await trigger.focus();
		await page.keyboard.press(modality === "enter" ? "Enter" : "Space");
	}

	await expect(page.getByRole("dialog", { name: "Confirmation" })).toBeVisible();
	expect(
		await page.evaluate(() => document.querySelector("#confirmation")?.matches(":modal")),
	).toBe(true);
	await page.keyboard.press("Escape");
};

for (const theme of themes) {
	test.describe(`${theme.name} theme`, () => {
		test("aria-busy preserves pointer, Enter, and Space activation parity", async ({
			page,
		}) => {
			await render(page, theme);
			const busy = page.locator("#busy");

			await busy.click();
			await busy.focus();
			await page.keyboard.press("Enter");
			await page.keyboard.press("Space");

			const details = await page.evaluate(
				() => /** @type {any} */ (window).activationDetails,
			);
			// Pointer-generated click events have a positive detail; keyboard-
			// synthesised clicks have detail 0. All three must reach the same
			// click contract.
			expect(details).toHaveLength(3);
			expect(details[0]).toBeGreaterThan(0);
			expect(details.slice(1)).toEqual([0, 0]);
		});

		test("a disabled busy button blocks pointer and keyboard equally", async ({
			page,
		}) => {
			await render(page, theme);
			const disabled = page.locator("#disabled");
			const box = await disabled.boundingBox();
			expect(box).not.toBeNull();

			await page.mouse.click(
				(box?.x ?? 0) + (box?.width ?? 0) / 2,
				(box?.y ?? 0) + (box?.height ?? 0) / 2,
			);
			await disabled.focus();
			await page.keyboard.press("Enter");
			await page.keyboard.press("Space");

			expect(
				await page.evaluate(
					() => /** @type {any} */ (window).disabledActivations,
				),
			).toBe(0);
		});

		test("popover invokers have pointer, Enter, and Space parity", async ({
			page,
		}) => {
			await render(page, theme);
			for (const modality of ["pointer", "enter", "space"]) {
				await activatePopover(
					page,
					/** @type {"pointer" | "enter" | "space"} */ (modality),
				);
			}
		});

		test("dialog invokers have pointer, Enter, and Space parity", async ({
			page,
		}) => {
			await render(page, theme);
			for (const modality of ["pointer", "enter", "space"]) {
				await activateDialog(
					page,
					/** @type {"pointer" | "enter" | "space"} */ (modality),
				);
			}
		});
	});
}
