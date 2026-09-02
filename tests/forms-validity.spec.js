const { expect, test } = require("@playwright/test");
const {
	assertDocsBuilt,
	createServer,
	startServer,
} = require("../scripts/lib/docs-site");

assertDocsBuilt("forms-validity.spec");

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

test.beforeEach(async ({ page }) => {
	await page.goto(`${origin}/forms/`, { waitUntil: "networkidle" });
	await page.evaluate(() => {
		document.body.innerHTML = `
			<main class="container">
				<form id="validation-form">
					<label>
						Required select
						<select id="required-select" required>
							<option value="" selected>Choose an option</option>
							<option value="one">One</option>
						</select>
					</label>
					<label>
						Valid email
						<input id="form-email" type="email" required>
					</label>
					<input id="form-range" type="range" min="0" max="10" value="5">
					<button id="submit" type="submit">Submit</button>
				</form>

				<select id="focus-reference">
					<option value="">Choose an option</option>
					<option value="one">One</option>
				</select>
				<input id="neutral-reference" type="text">
				<input id="valid-reference" type="text" aria-invalid="false">
				<input id="invalid-reference" type="text" aria-invalid="true">
				<input id="outside-email" type="email" required>
				<input id="outside-range" type="range" min="0" max="10" value="5">
				<input id="native-invalid-aria-valid" type="email" required aria-invalid="false">
				<input id="native-valid-aria-invalid" type="email" required value="ada@example.com" aria-invalid="true">
			</main>
		`;
	});
	await page.addStyleTag({
		content: `
			*,
			*::before,
			*::after {
				animation: none !important;
				transition: none !important;
			}
		`,
	});
});

/** @param {import("@playwright/test").Locator} locator */
const stateOf = (locator) =>
	locator.evaluate((element) => {
		const style = getComputedStyle(element);
		return {
			borderColor: style.borderColor,
			boxShadow: style.boxShadow,
			focused: element.matches(":focus"),
			userInvalid: element.matches(":user-invalid"),
			userValid: element.matches(":user-valid"),
		};
	});

test("native valid controls stay neutral inside and outside forms", async ({
	page,
}) => {
	const neutral = await stateOf(page.locator("#neutral-reference"));

	for (const selector of ["#form-email", "#outside-email"]) {
		const control = page.locator(selector);
		await control.fill("ada@example.com");
		await control.press("Tab");

		const state = await stateOf(control);
		expect(state.borderColor).toBe(neutral.borderColor);
		expect(state.boxShadow).toBe(neutral.boxShadow);
	}
});

test("native invalid controls are styled outside a form after interaction", async ({
	page,
}) => {
	const control = page.locator("#outside-email");
	const invalid = await stateOf(page.locator("#invalid-reference"));

	await control.fill("not-an-email");
	await control.blur();

	const state = await stateOf(control);
	expect(state.userInvalid).toBe(true);
	expect(state.borderColor).toBe(invalid.borderColor);
});

test("range inputs stay neutral after interaction inside and outside forms", async ({
	page,
}) => {
	const neutral = await stateOf(page.locator("#neutral-reference"));
	const valid = await stateOf(page.locator("#valid-reference"));

	for (const selector of ["#form-range", "#outside-range"]) {
		const range = page.locator(selector);
		await range.focus();
		await range.press("ArrowRight");
		await range.press("Tab");

		const state = await stateOf(range);
		expect(state.borderColor).toBe(neutral.borderColor);
		expect(state.borderColor).not.toBe(valid.borderColor);
		expect(state.boxShadow).toBe(neutral.boxShadow);
	}
});

test("a required select waits until blur before showing a submitted error", async ({
	page,
}) => {
	const focusReference = page.locator("#focus-reference");
	await focusReference.focus();
	const neutralFocus = await stateOf(focusReference);

	await page.locator("#submit").click();
	const select = page.locator("#required-select");
	const invalid = await stateOf(page.locator("#invalid-reference"));

	await expect(select).toBeFocused();
	let state = await stateOf(select);
	expect(state.borderColor).toBe(neutralFocus.borderColor);
	expect(state.borderColor).not.toBe(invalid.borderColor);

	await select.press("Tab");
	state = await stateOf(select);
	expect(state.userInvalid).toBe(true);
	expect(state.borderColor).toBe(invalid.borderColor);
});

test("a valid select returns to the neutral state after a choice", async ({
	page,
}) => {
	const select = page.locator("#required-select");
	const neutral = await stateOf(page.locator("#neutral-reference"));
	const valid = await stateOf(page.locator("#valid-reference"));

	await select.selectOption("one");
	await select.blur();

	const state = await stateOf(select);
	expect(state.borderColor).toBe(neutral.borderColor);
	expect(state.borderColor).not.toBe(valid.borderColor);
});

test("explicit aria-invalid states override native validity", async ({ page }) => {
	const explicitValid = page.locator("#native-invalid-aria-valid");
	const explicitInvalid = page.locator("#native-valid-aria-invalid");
	const valid = await stateOf(page.locator("#valid-reference"));
	const invalid = await stateOf(page.locator("#invalid-reference"));

	await explicitValid.fill("not-an-email");
	await explicitValid.blur();
	await explicitInvalid.fill("ada@example.com");
	await explicitInvalid.blur();

	const validState = await stateOf(explicitValid);
	const invalidState = await stateOf(explicitInvalid);
	expect(validState.userInvalid).toBe(true);
	expect(validState.borderColor).toBe(valid.borderColor);
	expect(invalidState.userValid).toBe(true);
	expect(invalidState.borderColor).toBe(invalid.borderColor);
});

test("Firefox keeps an opened required select neutral and a valid choice does not turn green", async ({
	browserName,
	page,
}) => {
	test.skip(browserName !== "firefox", "Firefox-specific regression coverage");

	const select = page.locator("#required-select");
	const focusReference = page.locator("#focus-reference");
	const neutral = await stateOf(page.locator("#neutral-reference"));
	const valid = await stateOf(page.locator("#valid-reference"));
	const invalid = await stateOf(page.locator("#invalid-reference"));

	await focusReference.focus();
	const neutralFocus = await stateOf(focusReference);
	await select.click();

	let state = await stateOf(select);
	expect(state.userInvalid).toBe(true);
	expect(state.borderColor).toBe(neutralFocus.borderColor);
	expect(state.borderColor).not.toBe(invalid.borderColor);

	await select.selectOption("one");
	await select.press("Tab");

	// The pointer is still where the click left it, and a field answers
	// hover now (forms/_basics.scss) — so it has to be moved off before the
	// border is compared against a reference that was never hovered, or the
	// comparison is between two different states rather than two schemes of
	// validity styling.
	await page.mouse.move(0, 0);
	state = await stateOf(select);
	expect(state.userValid).toBe(true);
	expect(state.borderColor).toBe(neutral.borderColor);
	expect(state.borderColor).not.toBe(valid.borderColor);
});

test("WebKit/Safari keeps a user-valid range visually neutral", async ({
	browserName,
	page,
}) => {
	test.skip(browserName !== "webkit", "WebKit/Safari-specific regression coverage");

	const range = page.locator("#outside-range");
	const neutral = await stateOf(page.locator("#neutral-reference"));
	const valid = await stateOf(page.locator("#valid-reference"));

	await range.focus();
	await range.press("ArrowRight");
	await range.press("Tab");

	const state = await stateOf(range);
	expect(state.userValid).toBe(true);
	expect(state.borderColor).toBe(neutral.borderColor);
	expect(state.borderColor).not.toBe(valid.borderColor);
});

test("the submit control waits for the reader before it dims", async ({
	page,
}) => {
	// The form on this page holds two required, empty controls, so it is
	// :invalid from first paint. That used to be enough to grey the submit
	// button — a login form nobody had touched drew its primary action as
	// if it were disabled, which is exactly what it looked like on the home
	// page's hero demo. The fields in the same form already waited for
	// :user-invalid before showing anything; the button now waits with
	// them.
	const submit = page.locator("#submit");
	const filter = () =>
		submit.evaluate((element) => getComputedStyle(element).filter);

	expect(
		await page.locator("#validation-form").evaluate((form) => form.matches(":invalid")),
		"the fixture form must actually be invalid, or this proves nothing",
	).toBe(true);
	expect(await filter(), "untouched").toBe("none");

	// Leaving a field invalid is the interaction that earns the feedback.
	await page.locator("#form-email").fill("not-an-email");
	await submit.focus();
	await expect
		.poll(filter, { message: "after leaving a field invalid" })
		.toBe("grayscale(1)");

	// And it is given back the moment the form is satisfiable again.
	await page.locator("#form-email").fill("ada@example.com");
	await page.locator("#required-select").selectOption("one");
	await submit.focus();
	await expect.poll(filter, { message: "after fixing it" }).toBe("none");
});
