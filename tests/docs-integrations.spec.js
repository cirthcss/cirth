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

test("every mark is a safe file on this site, and a project named by text says why", () => {
	for (const guide of frameworks.guides) {
		const record = frameworks.marks[guide.mark];
		expect(record, guide.id).toBeTruthy();
		if (!record.file) {
			expect(guide.markData, `${guide.id}: nothing to draw`).toBeNull();
			expect(String(record.textOnly).length, `${guide.id}: why it is named by text`).toBeGreaterThan(40);
			continue;
		}
		for (const file of [record.file, record.dark]) {
			if (!file) continue;
			expect(fs.existsSync(path.join(logoDir, file)), `${guide.id}: ${file}`).toBe(true);
		}
		expect(record.source).toMatch(/^https:\/\//);
		expect(record.termsUrl).toMatch(/^https:\/\//);
		expect(record.owner.length).toBeGreaterThan(2);
		expect(record.aspect).toBeGreaterThan(0);
	}
});

test("every record names its owner, the policy read and when, and a logo is never shown against one", () => {
	const used = new Set(frameworks.guides.map((/** @type {{ mark: string }} */ guide) => guide.mark));
	// Every record in the data is one a guide uses, and the other way round.
	expect(Object.keys(frameworks.marks).sort()).toEqual([...used].sort());
	expect(frameworks.checked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	for (const [id, record] of Object.entries(frameworks.marks)) {
		for (const field of ["owner", "terms", "termsUrl"]) {
			const value = /** @type {Record<string, unknown>} */ (record)[field];
			expect(typeof value === "string" && value.trim().length > 0, `${id}: ${field}`).toBe(true);
		}
		expect(record.termsUrl, id).toMatch(/^https:\/\//);
		// Nothing is recoloured: no one-colour inversion, and a file drawn
		// for light backgrounds alone asks for a light ground instead.
		expect(record, id).not.toHaveProperty("mono");
		if (record.file) {
			expect(record.source, id).toMatch(/^https:\/\//);
			expect(record.textOnly, id).toBeUndefined();
		}
	}
	// The projects named by text alone, decided in the data: the Spring and
	// Go guidelines allow the name and not the logo, Symfony asks for written
	// authorisation, and Oracle for a licence.
	expect(frameworks.guides.filter((/** @type {{ markData: unknown }} */ guide) => !guide.markData).map((/** @type {{ id: string }} */ guide) => guide.id).sort()).toEqual(
		["go-templates", "helidon", "spring-boot", "symfony"],
	);
	expect(frameworks.marks.spring.textOnly).toMatch(/reserved for Broadcom/);
	expect(frameworks.marks.spring.trademarkNotice).toMatch(/Broadcom/);
	// A logo shown as a nominative reference says so, and when it comes down.
	expect(Object.entries(frameworks.marks).filter(([, record]) => record.nominative).map(([id]) => id).sort()).toEqual(["blazor", "jakarta", "nextjs", "stimulus"]);
	for (const id of ["blazor", "jakarta", "nextjs", "stimulus"]) {
		expect(frameworks.marks[id].nominative, id).toMatch(/comes down if the owner asks\.$/);
		expect(frameworks.marks[id].retrieved, id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	}
	// Jakarta EE's is the standard logo, never the Compatible or Member one.
	expect(frameworks.marks.jakarta).toMatchObject({ file: "jakarta.svg", trademarkNotice: "Jakarta EE is a trademark of Eclipse Foundation AISBL." });
	expect(frameworks.marks.nextjs.trademarkNotice).toMatch(/trademarks or registered trademarks of Vercel, Inc\. or its affiliates/);
	// The projects whose terms ask for a notice, and no others.
	expect(Object.entries(frameworks.marks).filter(([, record]) => record.trademarkNotice).map(([id]) => id).sort()).toEqual(
		["codeigniter", "electron", "ember", "jakarta", "ktor", "micronaut", "nextjs", "quarkus", "spring", "symfony"],
	);
	// Files drawn for light backgrounds with no official dark variant.
	expect(Object.entries(frameworks.marks).filter(([, record]) => record.ground).map(([id]) => id).sort()).toEqual(["codeigniter", "elysia", "rails", "stimulus"]);
	// Where JetBrains asks the Ktor logo to lead, wherever it is a link to the project.
	expect(frameworks.marks.ktor.linkTo).toBe("https://www.jetbrains.com");
	// AdonisJS and WordPress are shown with their own files for dark backgrounds.
	expect(frameworks.marks.adonisjs).toMatchObject({ termsUrl: "https://adonisjs.com/brand", dark: "adonisjs-dark.svg" });
	expect(frameworks.marks.wordpress).toMatchObject({ dark: "wordpress-dark.png" });
	// Nothing in the logos folder that no record names.
	const files = new Set(Object.values(frameworks.marks).flatMap((/** @type {{ file?: string, dark?: string }} */ record) => [record.file, record.dark].filter(Boolean)));
	expect(fs.readdirSync(logoDir).filter((file) => !files.has(file))).toEqual([]);
	// The count is the guides', whatever the records.
	expect(frameworks.count).toBe(fs.readdirSync(pagesDir).filter((file) => file.endsWith(".md") && file !== "index.md").length);
	expect(frameworks.count).toBeGreaterThan(Object.keys(frameworks.marks).length);
});

test("a guide named by text has no picture anywhere a mark would be", async ({ page }) => {
	const textOnly = frameworks.guides.filter((/** @type {{ markData: unknown }} */ guide) => !guide.markData);
	/** Every framework logo image on a page, by file. */
	const logos = () =>
		page.locator('img[src*="/logos/frameworks/"]').evaluateAll((images) => images.map((image) => image.getAttribute("src")));
	const shownFiles = new Set(Object.values(frameworks.marks).flatMap((/** @type {{ file?: string, dark?: string }} */ record) => [record.file, record.dark].filter(Boolean)));

	await page.goto(`${origin}/framework-guides/`, { waitUntil: "networkidle" });
	for (const guide of textOnly) {
		const tile = page.locator(".docs-guide-grid > li").filter({ has: page.locator(`a[href="${guide.link}"]`) });
		await expect(tile.locator("img"), guide.id).toHaveCount(0);
		// No stand-in drawing: the project's address, set as text, hidden
		// from the link's name.
		const address = tile.locator(".docs-guide-address");
		await expect(address).toHaveText(new URL(guide.officialUrl).hostname.replace(/^www\./, ""));
		await expect(address).toHaveAttribute("aria-hidden", "true");
		await expect(tile.locator("svg, .docs-mark")).toHaveCount(0);
	}

	for (const url of ["/", "/framework-guides/", "/attributions/", ...frameworks.guides.map((/** @type {{ link: string }} */ guide) => `${guide.link}/`)]) {
		await page.goto(`${origin}${url}`, { waitUntil: "domcontentloaded" });
		for (const src of await logos()) {
			expect(shownFiles.has(String(src).split("/").pop()), `${url}: ${src} is not a shown mark`).toBe(true);
		}
	}
	for (const guide of textOnly) {
		await page.goto(`${origin}${guide.link}/`, { waitUntil: "domcontentloaded" });
		await expect(page.locator(".docs-project img"), guide.id).toHaveCount(0);
		await expect(page.locator(".docs-project-name")).toHaveText(guide.name);
		await expect(page.locator(`.docs-sidebar a[href="${guide.link}"]`)).toHaveText(guide.name);
	}

	// Attributions lists every project, the decision and the reason.
	await page.goto(`${origin}/attributions/`, { waitUntil: "domcontentloaded" });
	const table = page.locator('[aria-label="Framework logo sources and decisions"]');
	const rows = await table.locator("tbody tr").evaluateAll((items) => items.map((item) => [...item.children].map((cell) => cell.textContent?.trim() ?? "")));
	expect(rows).toHaveLength(Object.keys(frameworks.marks).length);
	for (const [id, record] of Object.entries(frameworks.marks)) {
		const row = rows.find((cells) => cells[0] === record.name);
		expect(row, id).toBeTruthy();
		expect(row?.[1], id).toBe(
			record.file
				? `${record.wide ? "Wordmark" : "Logo"}${record.nominative ? ", nominative use" : ""}`
				: "Name only",
		);
		expect(row?.[2], id).toBe(record.owner);
		expect(row?.[5], id).toBe(frameworks.checked);
	}
	for (const guide of textOnly) {
		await expect(page.locator("main li", { hasText: String(guide.brand.textOnly).slice(0, 40) })).toHaveCount(1);
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
	expect(covered).toEqual(expect.arrayContaining(["htmlandvite", "reactandvite", "phoenixliveview", "remix"]));
	// Spring Boot is one guide, whichever view technology renders it.
	expect(frameworks.guides.filter((/** @type {{ mark: string }} */ guide) => guide.mark === "spring").map((/** @type {{ id: string }} */ guide) => guide.id)).toEqual(["spring-boot"]);
});

test("the Framework guides grid is the list: each card one link to its guide, and no link out", async ({ page, browserName }) => {
	await page.goto(`${origin}/framework-guides/`, { waitUntil: "networkidle" });
	const tiles = page.locator(".docs-guide-grid > li");
	await expect(tiles).toHaveCount(frameworks.count);

	// The groups and their order are the data's, and Server-rendered apps
	// is one alphabetical grid.
	await expect(page.locator(".docs-guide-group-title")).toHaveText(
		frameworks.groups.map((/** @type {{ text: string }} */ group) => group.text),
	);
	const server = /** @type {{ guides: { name: string }[] }} */ (frameworks.groups.find((/** @type {{ id: string }} */ group) => group.id === "server"));
	const serverNames = server.guides.map((/** @type {{ name: string }} */ guide) => guide.name);
	expect(serverNames).toEqual([...serverNames].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" })));
	await expect(page.locator('section[aria-labelledby="guides-server"] .docs-guide-name')).toHaveText(serverNames.map((name) => new RegExp(`^${name.replace(/[+.]/g, "\\$&")}`)));

	const read = await tiles.evaluateAll((items) =>
		items.map((item) => {
			const links = [...item.querySelectorAll("a")];
			const link = links[0];
			return {
				links: links.length,
				href: link?.getAttribute("href"),
				onclick: link?.hasAttribute("onclick"),
				nested: link?.querySelector("a") !== null,
				// What a screen reader names the link: its text without the
				// parts hidden from it.
				name: (() => {
					const copy = /** @type {HTMLElement} */ (link.cloneNode(true));
					for (const hidden of copy.querySelectorAll('[aria-hidden="true"]')) hidden.remove();
					return copy.textContent?.trim();
				})(),
				alts: [...item.querySelectorAll("img")].map((image) => image.getAttribute("alt")),
				arrowHidden: item.querySelector(".docs-guide-arrow")?.getAttribute("aria-hidden"),
				// The whole card is the link's box.
				fill: (() => {
					const card = /** @type {Element} */ (item).getBoundingClientRect();
					const box = link.getBoundingClientRect();
					return Math.abs(card.width - box.width) < 1 && Math.abs(card.height - box.height) < 1;
				})(),
			};
		}),
	);
	read.forEach((tile, index) => {
		const guide = frameworks.guides[index];
		expect(tile.links, `${guide.id}: one link`).toBe(1);
		expect(tile.href, guide.id).toBe(guide.link);
		expect(tile.onclick, guide.id).toBe(false);
		expect(tile.nested, guide.id).toBe(false);
		expect(tile.name, `${guide.id}: named by its name`).toBe(guide.name);
		expect(tile.arrowHidden, guide.id).toBe("true");
		expect(tile.fill, `${guide.id}: the card is the link`).toBe(true);
		// The card draws the logo the guide's own card draws, decorative.
		expect(tile.alts.length > 0, `${guide.id}: logo drawn`).toBe(Boolean(guide.markData));
		for (const alt of tile.alts) expect(alt, guide.id).toBe("");
	});
	// Nothing on the page's guide grid leads off the site.
	await expect(page.locator('.docs-guide-groups a:not([href^="/"])')).toHaveCount(0);
	// One line of fine print under the list, and no project's notice on the page.
	const fine = page.locator(".docs-content .docs-fine-print");
	await expect(fine).toHaveCount(1);
	await expect(fine).toHaveText("Logos belong to their projects; none of these projects is affiliated with Cirth or endorses it (sources and terms).");
	await expect(fine.locator("a")).toHaveAttribute("href", "/attributions/#framework-logos");
	expect(await fine.evaluate((element) => element.previousElementSibling?.matches("section"))).toBe(true);
	for (const record of Object.values(frameworks.marks)) {
		if (record.trademarkNotice) await expect(page.locator(".docs-content", { hasText: record.trademarkNotice })).toHaveCount(0);
	}
	await expect(page.locator(".docs-content a a")).toHaveCount(0);

	// The whole card answers the pointer and the keyboard.
	const card = tiles.first().locator("a");
	const before = await card.evaluate((element) => getComputedStyle(element).backgroundColor);
	await card.hover({ position: { x: 4, y: 4 } });
	expect(await card.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(before);
	await page.mouse.move(0, 0);
	// WebKit, like Safari, moves Tab between links only with Option held.
	const tab = browserName === "webkit" ? "Alt+Tab" : "Tab";
	await card.focus();
	await page.keyboard.press(`Shift+${tab}`);
	await page.keyboard.press(tab);
	expect(await card.evaluate((element) => element.matches(":focus-visible") && getComputedStyle(element).outlineStyle !== "none")).toBe(true);
});

test("Django's logo, wherever it is a link to the project, leads to djangoproject.com", async ({ page }) => {
	const django = frameworks.byId.django;
	expect(django.officialUrl).toBe("https://www.djangoproject.com");
	// On Framework guides the logo is a picture inside the card that opens the
	// guide, and links nowhere else.
	await page.goto(`${origin}/framework-guides/`, { waitUntil: "networkidle" });
	for (const href of await page.locator(`a:has(img[src="/logos/frameworks/${frameworks.marks.django.file}"])`).evaluateAll((links) => links.map((link) => link.getAttribute("href")))) {
		expect(href).toBe("/installation/django");
	}
	for (const url of ["/", "/installation/django/"]) {
		await page.goto(`${origin}${url}`, { waitUntil: "networkidle" });
		const linked = page.locator(`a:has(img[src="/logos/frameworks/${frameworks.marks.django.file}"])`);
		expect(await linked.count(), `${url} shows the Django logo as a link`).toBeGreaterThan(0);
		for (const href of await linked.evaluateAll((links) => links.map((link) => link.getAttribute("href")))) {
			expect(href, `${url}: a Django logo link`).toBe("https://www.djangoproject.com");
		}
	}
	// On its own guide the logo leads there too, out of the tab order; the
	// card's Website link is the one the keyboard and a screen reader find.
	await page.goto(`${origin}/installation/django/`, { waitUntil: "networkidle" });
	await expect(page.locator("h1 a")).toHaveCount(0);
	await expect(page.locator(".docs-project-mark")).toHaveAttribute("tabindex", "-1");
	await expect(page.locator(".docs-project-links a").first()).toHaveAttribute("href", "https://www.djangoproject.com");
});

test("a guide opens on its project's card and one h1, says how sure it is, and which pages it follows", async ({ page }) => {
	// Every guide, one page load each.
	test.setTimeout(120_000);
	for (const guide of frameworks.guides) {
		await page.goto(`${origin}${guide.link}/`, { waitUntil: "networkidle" });
		// The card: the project's name (text, not a heading), what it is, and
		// its site and repository, each link named for the project.
		const card = page.locator(".docs-content > aside.docs-project");
		await expect(card, guide.id).toHaveAttribute("aria-label", `About ${guide.name}`);
		await expect(card.locator(".docs-project-name")).toHaveText(guide.name);
		await expect(card.locator(".docs-project-description")).toHaveText(guide.description);
		await expect(card.locator("h1, h2, h3, h4, h5, h6")).toHaveCount(0);
		const links = card.locator(".docs-project-links a");
		await expect(links.first()).toHaveText("Website");
		await expect(links.first()).toHaveAttribute("href", guide.officialUrl);
		await expect(links.first()).toHaveAttribute("aria-label", `${guide.name} official website`);
		if (guide.github) {
			await expect(links.nth(1)).toHaveText("GitHub");
			await expect(links.nth(1)).toHaveAttribute("href", guide.github);
			await expect(links.nth(1)).toHaveAttribute("aria-label", `${guide.name} on GitHub`);
		}
		// One h1, right after the card, and the outline below it is h2s and h3s.
		await expect(page.locator("main h1")).toHaveCount(1);
		await expect(page.locator(".docs-content > aside.docs-project + h1")).toHaveText(`Install Cirth for ${guide.name}`);
		// The facts line: how sure, with which release, and when.
		const meta = page.locator(".docs-content > .docs-guide-meta");
		await expect(meta.locator(".docs-guide-status")).toHaveAttribute("data-status", guide.verified.status);
		await expect(meta).toContainText(`${guide.status.text} with ${guide.version} on`);
		await expect(meta.locator("time")).toHaveAttribute("datetime", guide.verified.date);
		const note = page.locator(".docs-content aside.docs-verified");
		await expect(note).toHaveCount(1);
		await expect(note).toContainText(guide.status.text);
		// The project's notice, where its terms ask for one: once, in fine
		// print, after the verification note and before the pager.
		const notice = page.locator(".docs-content > .docs-fine-print");
		if (guide.brand.trademarkNotice) {
			await expect(notice, guide.id).toHaveCount(1);
			await expect(notice).toHaveText(guide.brand.trademarkNotice);
			expect(await notice.evaluate((element) => [element.previousElementSibling?.matches("aside.docs-verified"), element.nextElementSibling?.matches("nav.docs-prev-next")])).toEqual([true, true]);
		} else {
			await expect(notice, guide.id).toHaveCount(0);
		}
		for (const doc of guide.docs) {
			await expect(note.locator(`a[href="${doc.url}"]`)).toHaveCount(1);
		}
	}
});

test("every count of the guides on the site is the list's", async ({ page }) => {
	await page.goto(`${origin}/`, { waitUntil: "networkidle" });
	const verifiedCount = frameworks.guides.filter((/** @type {{ verified: { status: string } }} */ guide) => guide.verified.status === "verified").length;
	expect(frameworks.verifiedCount).toBe(verifiedCount);
	await expect(page.locator(".docs-agnostic")).toContainText(`Browse all ${frameworks.count} guides`);
	// The home page carries no project's trademark notice.
	for (const record of Object.values(frameworks.marks)) {
		if (record.trademarkNotice) await expect(page.locator("main", { hasText: record.trademarkNotice })).toHaveCount(0);
	}
	await page.goto(`${origin}/framework-guides/`, { waitUntil: "networkidle" });
	await expect(page.locator(".docs-content")).toContainText(`All ${frameworks.count} guides are currently marked`);
	const verified = frameworks.guides.filter((/** @type {{ verified: { status: string } }} */ guide) => guide.verified.status === "verified").length;
	await expect(page.locator(".docs-content")).toContainText(
		verified === frameworks.count ? `All ${frameworks.count} guides are currently marked Verified` : `${verified} of ${frameworks.count} guides are currently marked Verified`,
	);
});

test("Compatibility lists each stack's pipeline from the same data", async ({ page }) => {
	await page.goto(`${origin}/compatibility/`, { waitUntil: "networkidle" });
	const table = page.locator("table", { hasText: "Observed pipeline behavior" });
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
