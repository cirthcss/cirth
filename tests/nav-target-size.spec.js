const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");
const { setContent } = require("./helpers/render");

// WCAG 2.5.8 asks for a 24 by 24 CSS pixel target, or enough spacing to
// make up for a smaller one. Nav links tile with no spacing between them,
// so the size has to be there on both axes. The block axis always was; the
// inline axis was not for a one-character entry: the "1" of a pagination
// nav measured 23px wide, and axe failed it. See
// specs/nav-link-target-size.md.

const css = fs.readFileSync(
	path.join(__dirname, "..", "dist", "cirth.css"),
	"utf8",
);

test("a one-character nav link is still a 24px target", async ({ page }) => {
	await setContent(
		page,
		`<html><head><style>${css}</style></head><body>
		<main class="container">
			<nav aria-label="Pagination">
				<ul>
					<li><a href="#" aria-current="page">1</a></li>
					<li><a href="#">2</a></li>
					<li><a href="#">i</a></li>
					<li><a href="#">Next</a></li>
				</ul>
			</nav>
		</main></body></html>`,
	);

	const boxes = await page
		.locator("nav a")
		.evaluateAll((links) =>
			links.map((link) => {
				const box = link.getBoundingClientRect();
				return { text: link.textContent, width: box.width, height: box.height };
			}),
		);
	for (const box of boxes) {
		expect(box.width, `"${box.text}" width`).toBeGreaterThanOrEqual(24);
		expect(box.height, `"${box.text}" height`).toBeGreaterThanOrEqual(24);
	}
	// A label that was already wider keeps its own width.
	const next = boxes.find((box) => box.text === "Next");
	expect(next?.width).toBeGreaterThan(24);
});

test("a stacked nav keeps its full-width rows", async ({ page }) => {
	await setContent(
		page,
		`<html><head><style>${css}</style></head><body>
		<main class="container"><aside><nav>
			<ul><li><a href="#">A</a></li><li><a href="#">Longer entry</a></li></ul>
		</nav></aside></main></body></html>`,
	);
	const [short, long] = await page
		.locator("aside nav a")
		.evaluateAll((links) => links.map((link) => link.getBoundingClientRect().width));
	// The floor is a minimum, not a width: rows in a column are as wide as
	// the column, whatever their label.
	expect(short).toBeCloseTo(long, 0);
});
