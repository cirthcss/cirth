const fs = require("node:fs");
const path = require("node:path");
const { expect, test } = require("@playwright/test");
const {
	assertDocsBuilt,
	createServer,
	startServer,
} = require("../scripts/lib/docs-site");
const frameworks = require("../docs/src/_data/frameworks.js");

// The integration guides are one list, docs/src/_data/frameworks.js, and
// every place that shows them reads it. These tests hold the list to what
// it promises: one page per entry and one entry per page, a mark that is a
// file on this site, a project site behind every mark that is a link, a
// count that is the list's length wherever it is printed, and none of the
// integrations the list keeps out on purpose.

assertDocsBuilt("docs-integrations.spec");

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

const pagesDir = path.join(__dirname, "../docs/src/pages/installation");
const logoDir = path.join(__dirname, "../docs/public/logos/frameworks");

/** @param {string} value */
const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");

test("the list and the guide pages match one for one", () => {
	const pages = fs
		.readdirSync(pagesDir)
		.filter((file) => file.endsWith(".md") && file !== "index.md")
		.map((file) => file.replace(/\.md$/, ""))
		.sort();
	const ids = frameworks.guides.map((/** @type {{ id: string }} */ guide) => guide.id).sort();
	expect(pages, "a page with no entry, or an entry with no page").toEqual(ids);

	// Each page says which entry it is, and no two entries share a route.
	for (const id of ids) {
		const source = fs.readFileSync(path.join(pagesDir, `${id}.md`), "utf8");
		expect(source, `${id}.md names its entry`).toMatch(new RegExp(`^framework: ${id}$`, "m"));
	}
	const routes = frameworks.guides.map((/** @type {{ link: string }} */ guide) => guide.link);
	expect(new Set(routes).size).toBe(routes.length);
	expect(frameworks.count).toBe(frameworks.guides.length);
});

test("every entry is complete, and its category and status are real ones", () => {
	const categories = new Set(frameworks.categories.map((/** @type {{ id: string }} */ category) => category.id));
	for (const guide of frameworks.guides) {
		expect(categories.has(guide.category), `${guide.id}: category`).toBe(true);
		expect(Object.keys(frameworks.statuses), `${guide.id}: status`).toContain(guide.verified.status);
		expect(guide.officialUrl, `${guide.id}: official site`).toMatch(/^https:\/\/[^/]+\.[a-z]+/);
		expect(guide.docs.length, `${guide.id}: official pages followed`).toBeGreaterThan(0);
		for (const doc of guide.docs) expect(doc.url).toMatch(/^https:\/\//);
		expect(guide.verified.date, `${guide.id}: verification date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		expect(guide.verified.with.length, `${guide.id}: versions`).toBeGreaterThan(4);
		expect(guide.verified.with, `${guide.id}: a version number`).toMatch(/\d+\.\d+/);
		expect(guide.summary.length).toBeGreaterThan(10);
		if (guide.lowers) expect(guide.fix, `${guide.id}: what to set`).toBeTruthy();
	}
	// Every category in use has a guide, and every guide has a category.
	expect(frameworks.groups.reduce((sum, /** @type {{ guides: unknown[] }} */ group) => sum + group.guides.length, 0)).toBe(
		frameworks.count,
	);
});

test("every mark is a safe file on this site, and a guide without one says why", () => {
	for (const guide of frameworks.guides) {
		if (!guide.mark) {
			expect(guide.noMark, `${guide.id}: why there is no mark`).toBeTruthy();
			continue;
		}
		const mark = frameworks.marks[guide.mark];
		for (const file of [mark.file, mark.dark]) {
			if (!file) continue;
			expect(fs.existsSync(path.join(logoDir, file)), `${guide.id}: ${file}`).toBe(true);
		}
		expect(mark.source).toMatch(/^https:\/\//);
		expect(mark.termsUrl).toMatch(/^https:\/\//);
		expect(mark.owner.length).toBeGreaterThan(2);
		expect(mark.aspect).toBeGreaterThan(0);
	}
});

// A logo is shown under its owner's own published terms or not at all.
const placeholder = /^\s*$|\bno\s+(?:terms|licen[cs]e|policy)\b|not\s+stated|unknown|\btbd\b|\btodo\b/i;

test("every mark shown names its source, owner and terms, and a guide without one says why", () => {
	const shown = new Set(frameworks.guides.map((/** @type {{ mark: string | null }} */ guide) => guide.mark).filter(Boolean));
	// Every mark in the data is one a guide shows, and the other way round.
	expect(Object.keys(frameworks.marks).sort()).toEqual([...shown].sort());
	for (const [id, mark] of Object.entries(frameworks.marks)) {
		const fields = /** @type {Record<string, unknown>} */ (/** @type {unknown} */ (mark));
		for (const field of ["source", "owner", "terms", "termsUrl"]) {
			const value = fields[field];
			expect(typeof value === "string" && value.trim().length > 0, `${id}: ${field}`).toBe(true);
		}
		expect(mark.terms, `${id}: "${mark.terms}" is not a term of use`).not.toMatch(placeholder);
	}
	for (const guide of frameworks.guides) {
		if (guide.mark) {
			expect(guide.noMark, `${guide.id} shows a mark and says it has none`).toBeUndefined();
			continue;
		}
		expect(guide.markData, `${guide.id}: no mark data to draw`).toBeNull();
		expect(String(guide.noMark).length, `${guide.id}: why there is no mark`).toBeGreaterThan(20);
	}
	// The projects whose marks are not shown here, and why that is decided
	// in the data, not in a template.
	expect(frameworks.guides.filter((/** @type {{ mark: string | null }} */ guide) => !guide.mark).map((/** @type {{ id: string }} */ guide) => guide.id).sort()).toEqual(
		["dioxus", "eleventy", "livewire", "stimulus", "symfony", "waku"],
	);
	// AdonisJS is shown under its brand guidelines, light and dark official
	// files, and is never recoloured by a filter.
	expect(frameworks.marks.adonisjs).toMatchObject({ termsUrl: "https://adonisjs.com/brand", dark: "adonisjs-dark.svg" });
	expect(frameworks.marks.adonisjs.mono).toBeUndefined();
	// Nothing in the logos folder that no shown mark names.
	const files = new Set(Object.values(frameworks.marks).flatMap((/** @type {{ file: string, dark?: string }} */ mark) => [mark.file, mark.dark].filter(Boolean)));
	expect(fs.readdirSync(logoDir).filter((file) => !files.has(file))).toEqual([]);
	// The count is the guides', whatever the marks.
	expect(frameworks.count).toBe(fs.readdirSync(pagesDir).filter((file) => file.endsWith(".md") && file !== "index.md").length);
	expect(frameworks.count).toBeGreaterThan(Object.keys(frameworks.marks).length);
});

test("a guide named by text has no picture anywhere a mark would be", async ({ page }) => {
	const textOnly = frameworks.guides.filter((/** @type {{ mark: string | null }} */ guide) => !guide.mark);
	/** Every framework logo image on a page, by file. */
	const logos = () =>
		page.locator('img[src*="/logos/frameworks/"]').evaluateAll((images) => images.map((image) => image.getAttribute("src")));
	const shownFiles = new Set(Object.values(frameworks.marks).flatMap((/** @type {{ file: string, dark?: string }} */ mark) => [mark.file, mark.dark].filter(Boolean)));

	await page.goto(`${origin}/installation/`, { waitUntil: "networkidle" });
	for (const guide of textOnly) {
		const tile = page.locator(".docs-guide-grid > li").filter({ has: page.locator(`a[href="${guide.link}"]`) });
		await expect(tile.locator("img"), guide.id).toHaveCount(0);
		await expect(tile.locator(".docs-mark-none"), `${guide.id}: no stand-in`).toHaveCount(0);
		// The site link is its address, which is its name.
		const site = tile.locator(`a[href="${guide.officialUrl}"]`);
		await expect(site).toHaveText(guide.officialUrl.replace(/^https:\/\/(www\.)?/, "").replace(/\/$/, ""));
		await expect(site).not.toHaveAttribute("aria-label", /.*/);
	}

	for (const url of ["/", "/installation/", "/brand/", ...frameworks.guides.map((/** @type {{ link: string }} */ guide) => `${guide.link}/`)]) {
		await page.goto(`${origin}${url}`, { waitUntil: "domcontentloaded" });
		for (const src of await logos()) {
			expect(shownFiles.has(String(src).split("/").pop()), `${url}: ${src} is not a shown mark`).toBe(true);
		}
	}
	for (const guide of textOnly) {
		await page.goto(`${origin}${guide.link}/`, { waitUntil: "domcontentloaded" });
		await expect(page.locator(".docs-guide-title img"), guide.id).toHaveCount(0);
		await expect(page.locator(".docs-guide-title")).toHaveText(guide.name);
		await expect(page.locator(`.docs-sidebar a[href="${guide.link}"]`)).toHaveText(guide.name);
	}

	// The Brand page lists each of them, with the reason, and no logo row.
	await page.goto(`${origin}/brand/`, { waitUntil: "domcontentloaded" });
	const rows = await page.locator('[aria-label="Framework logo sources"] tbody th').allTextContents();
	expect(rows).toHaveLength(Object.keys(frameworks.marks).length);
	for (const guide of textOnly) {
		expect(rows, guide.id).not.toContain(guide.name);
		await expect(page.locator("main li", { hasText: String(guide.noMark).slice(0, 40) })).toHaveCount(1);
	}
	for (const terms of await page.locator('[aria-label="Framework logo sources"] tbody td:last-child').allTextContents()) {
		expect(terms).not.toMatch(placeholder);
	}

	// The home page's orbit holds only marks it may show, none of them empty.
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });
	const orbit = await page.locator(".docs-agnostic-orbit li").evaluateAll((items) => items.map((item) => item.querySelectorAll("img").length));
	expect(orbit.length).toBe(frameworks.featured.length);
	for (const count of orbit) expect(count).toBeGreaterThan(0);
});

test("nothing the list keeps out is in it, and nothing is in it twice", () => {
	const names = frameworks.guides.map((/** @type {{ name: string }} */ guide) => normalize(guide.name));
	for (const excluded of frameworks.excluded) {
		expect(names, `${excluded.name} is not a guide: ${excluded.reason}`).not.toContain(normalize(excluded.name));
	}
	for (const banned of ["tailwind", "unocss", "bun"]) {
		for (const guide of frameworks.guides) {
			expect(normalize(guide.name), `${guide.id} is not a ${banned} guide`).not.toContain(banned);
			expect(guide.id).not.toContain(banned);
		}
	}
	// One guide per tool: no two names, routes or official sites alike, and
	// no guide is a set-up another guide already covers.
	expect(new Set(names).size).toBe(names.length);
	const sites = frameworks.guides.map((/** @type {{ officialUrl: string }} */ guide) => guide.officialUrl);
	expect(new Set(sites).size).toBe(sites.length);
	const covered = frameworks.guides.flatMap((/** @type {{ covers?: string[] }} */ guide) => guide.covers ?? []).map(normalize);
	for (const name of names) expect(covered, `${name} is covered by another guide`).not.toContain(name);
	expect(covered).toEqual(expect.arrayContaining(["htmlandvite", "reactandvite", "phoenixliveview"]));
});

test("the Installation grid is the list: a mark to the project's site, a name to the guide", async ({ page }) => {
	await page.goto(`${origin}/installation/`, { waitUntil: "networkidle" });
	const tiles = page.locator(".docs-guide-grid > li");
	await expect(tiles).toHaveCount(frameworks.count);

	// The groups and their order are the data's.
	await expect(page.locator(".docs-guide-group-title")).toHaveText(
		frameworks.groups.map((/** @type {{ text: string }} */ group) => group.text),
	);

	const read = await tiles.evaluateAll((items) =>
		items.map((item) => ({
			links: [...item.querySelectorAll("a")].map((link) => ({
				href: link.getAttribute("href"),
				name: link.getAttribute("aria-label") ?? link.textContent?.trim(),
				nested: link.querySelector("a") !== null || link.parentElement?.closest("a") !== null,
				alts: [...link.querySelectorAll("img")].map((image) => image.getAttribute("alt")),
			})),
		})),
	);
	read.forEach((tile, index) => {
		const guide = frameworks.guides[index];
		expect(tile.links, `${guide.id}: two links`).toHaveLength(2);
		const [site, name] = tile.links;
		expect(site.href, `${guide.id}: the mark leads to the project's site`).toBe(guide.officialUrl);
		// A mark's link is named for the site; a text-only one is its address.
		expect(site.name).toBe(guide.mark ? `${guide.name} website` : guide.officialUrl.replace(/^https:\/\/(www\.)?/, "").replace(/\/$/, ""));
		for (const alt of site.alts) expect(alt, `${guide.id}: the image is decorative inside a named link`).toBe("");
		expect(name.href).toBe(guide.link);
		expect(name.name).toContain(guide.name);
		expect(site.nested || name.nested, `${guide.id}: no link inside a link`).toBe(false);
	});
	await expect(page.locator(".docs-content a a")).toHaveCount(0);
});

test("Django's logo, wherever it is a link, leads to djangoproject.com", async ({ page }) => {
	const django = frameworks.byId.django;
	expect(django.officialUrl).toBe("https://www.djangoproject.com");
	for (const url of ["/installation/", "/"]) {
		await page.goto(`${origin}${url}`, { waitUntil: "networkidle" });
		const linked = page.locator(`a:has(img[src="/logos/frameworks/${frameworks.marks.django.file}"])`);
		expect(await linked.count(), `${url} shows the Django logo as a link`).toBeGreaterThan(0);
		for (const href of await linked.evaluateAll((links) => links.map((link) => link.getAttribute("href")))) {
			expect(href, `${url}: a Django logo link`).toBe("https://www.djangoproject.com");
		}
	}
	// On its own guide the logo is not a link, and the site is.
	await page.goto(`${origin}/installation/django/`, { waitUntil: "networkidle" });
	await expect(page.locator("h1 a")).toHaveCount(0);
	await expect(page.locator(".docs-guide-meta a")).toHaveAttribute("href", "https://www.djangoproject.com");
});

test("a guide says how sure it is, from the data, and which pages it follows", async ({ page }) => {
	for (const guide of frameworks.guides) {
		await page.goto(`${origin}${guide.link}/`, { waitUntil: "networkidle" });
		const meta = page.locator(".docs-content > .docs-guide-meta");
		await expect(meta, guide.id).toContainText(guide.categoryText);
		await expect(meta.locator(".docs-guide-status")).toHaveAttribute("data-status", guide.verified.status);
		await expect(meta.locator("time")).toHaveAttribute("datetime", guide.verified.date);
		await expect(meta.locator("a")).toHaveAttribute("href", guide.officialUrl);
		const note = page.locator(".docs-content aside.docs-verified");
		await expect(note).toHaveCount(1);
		await expect(note).toContainText(guide.status.text);
		for (const doc of guide.docs) {
			await expect(note.locator(`a[href="${doc.url}"]`)).toHaveCount(1);
		}
	}
});

test("every count of the guides on the site is the list's", async ({ page }) => {
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });
	await expect(page.locator(".docs-fact-list")).toContainText(`${frameworks.count} checked guides`);
	await expect(page.locator(".docs-agnostic")).toContainText(`Browse all ${frameworks.count} guides`);
	await page.goto(`${origin}/installation/`, { waitUntil: "networkidle" });
	await expect(page.locator(".docs-content")).toContainText(`${frameworks.count} guides, by category`);
	const verified = frameworks.guides.filter((/** @type {{ verified: { status: string } }} */ guide) => guide.verified.status === "verified").length;
	await expect(page.locator(".docs-content")).toContainText(
		verified === frameworks.count ? `All ${frameworks.count} are verified` : `${verified} of ${frameworks.count} are`,
	);
});

test("Compatibility lists each stack's pipeline from the same data", async ({ page }) => {
	await page.goto(`${origin}/compatibility/`, { waitUntil: "networkidle" });
	const table = page.locator("table", { hasText: "Rewrites" });
	for (const guide of frameworks.pipelines.lowers) {
		await expect(table.locator(`a[href="${guide.link}"]`), guide.id).toHaveCount(1);
	}
	for (const guide of frameworks.pipelines.keeps) {
		await expect(table.locator(`a[href="${guide.link}"]`), guide.id).toHaveCount(1);
	}
	expect(frameworks.pipelines.lowers.length + frameworks.pipelines.keeps.length + frameworks.pipelines.asIs.length).toBe(
		frameworks.count,
	);
});
