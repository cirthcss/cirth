const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");
const { setContent } = require("./helpers/render");

// .overflow-auto exists so that something wider than the screen scrolls
// inside it instead of widening the page (WCAG 1.4.10). A scroll container
// only clips what it contains, though, and an absolutely positioned
// descendant is contained by its nearest positioned ancestor, so a
// .sr-only header on a table's action column escaped it and pushed the
// page 1,111px wider at 320px. The container is now that ancestor.

const css = fs.readFileSync(
	path.join(__dirname, "..", "dist", "cirth.css"),
	"utf8",
);

test("a visually hidden cell does not widen the page at 320px", async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 640 });
	await setContent(
		page,
		`<style>${css}</style>
		<main class="container">
			<div class="overflow-auto" tabindex="0" role="region" aria-label="Wide table">
				<table>
					<thead><tr>
						${"<th scope=\"col\">Column heading</th>".repeat(8)}
						<th scope="col"><span class="sr-only">Actions</span></th>
					</tr></thead>
					<tbody><tr>${"<td>Cell content</td>".repeat(8)}<td><button>Edit</button></td></tr></tbody>
				</table>
			</div>
		</main>`,
	);

	const metrics = await page.evaluate(() => {
		const container = /** @type {HTMLElement} */ (document.querySelector(".overflow-auto"));
		return {
			page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
			container: container.scrollWidth - container.clientWidth,
		};
	});
	expect(metrics.page).toBeLessThanOrEqual(0);
	// The table still overflows — into the container, where it scrolls.
	expect(metrics.container).toBeGreaterThan(0);
});
